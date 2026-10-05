"""The cloud's database (supabase/migrations/, 04.10.2026) on a local PostgreSQL with Supabase's auth stubs: the game's functions as a
player (hello, consent, batches of events, errors, the cloud save with its conflict rule, deleting the account), and the lock Jonas
asked for («Dette må ingen andre enn meg ha tilgang til»): no player reads a table or the dashboard, an admin without the second
factor (aal1) is refused, the admin with aal2 gets every panel. Needs the PostgreSQL server binaries (initdb, pg_ctl); prints OK or
FEIL, and SKIP without them."""
import glob, json, os, shutil, subprocess, sys, tempfile, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ok = lambda c: 'OK  ' if c else 'FEIL'
BIN = (sorted(glob.glob('/usr/lib/postgresql/*/bin')) or [''])[-1]
if not os.path.exists(os.path.join(BIN, 'initdb')):
    print('SKIP no PostgreSQL server binaries'); sys.exit(0)

STUB = """
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth; grant usage on schema auth to anon, authenticated;
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt() ->> 'sub')::uuid $$;
grant execute on function auth.jwt(), auth.uid() to anon, authenticated;
grant usage on schema public to anon, authenticated;
-- as on Supabase: new tables, sequences and functions in public give anon and authenticated every right
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
"""


def main():
    tmp = tempfile.mkdtemp(prefix='dsbpg'); data = os.path.join(tmp, 'data'); sock = tmp
    user = 'postgres'
    run = lambda *a, **k: subprocess.run(list(a), capture_output=True, text=True, **k)
    as_pg = (lambda cmd: ['su', 'postgres', '-c', ' '.join(cmd)]) if os.geteuid() == 0 else (lambda cmd: cmd)
    if os.geteuid() == 0: shutil.chown(tmp, 'postgres')
    r = run(*as_pg([os.path.join(BIN, 'initdb'), '-D', data, '-U', user, '-A', 'trust']))
    if r.returncode: print('FEIL initdb', r.stderr[-400:]); return
    r = run(*as_pg([os.path.join(BIN, 'pg_ctl'), '-D', data, '-o', "'-k %s -c listen_addresses='\"''\"" % sock, '-l', os.path.join(tmp, 'log'), '-w', 'start']))
    if r.returncode: print('FEIL pg_ctl', r.stderr[-400:], open(os.path.join(tmp, 'log')).read()[-400:] if os.path.exists(os.path.join(tmp, 'log')) else ''); return
    try:
        def sql(q, claims=None, role=None, expect_err=False):
            pre = ''
            if role: pre += "set role %s; " % role
            if claims is not None: pre += "set request.jwt.claims = '%s'; " % json.dumps(claims)
            p = run('psql', '-h', sock, '-U', user, '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-qAt', '-c', pre + q)
            if expect_err: return p.returncode != 0, p.stderr.strip()[-200:]
            if p.returncode: raise RuntimeError(p.stderr.strip()[:300] + " … " + p.stderr.strip()[-200:] + ' :: ' + q[:120])
            return p.stdout.strip().splitlines()[-1] if p.stdout.strip() else ''
        sql(STUB)
        mig = sorted(glob.glob(os.path.join(ROOT, 'supabase', 'migrations', '*.sql')))
        for m in mig:
            p = run('psql', '-h', sock, '-U', user, '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-q', '-f', m)
            print(ok(p.returncode == 0), 'the migration runs on PostgreSQL:', os.path.basename(m), p.stderr.strip()[-300:] if p.returncode else '')
            if p.returncode: return
        A = {'sub': 'user_01AAA', 'role': 'authenticated'}; B = {'sub': 'user_01BBB', 'role': 'authenticated'}
        ADMIN_ID = '7f1c2a3e-0000-4000-8000-000000000001'
        sql("insert into public.admins values ('%s', 'Jonas')" % ADMIN_ID)
        AD2 = {'sub': ADMIN_ID, 'role': 'authenticated', 'aal': 'aal2'}; AD1 = dict(AD2, aal='aal1')
        R = {}
        R['hello'] = json.loads(sql("select public.tm_hello('{\"lang\":\"nb\",\"tz\":\"Europe/Oslo\",\"browser\":\"chrome\",\"platform\":\"android\",\"pwa\":true}')", A, 'authenticated'))
        # the game's Admin app: only the account flagged by hand; a player cannot flag himself
        R['admSelf'] = sql("update public.players set game_admin = true where id = 'user_01AAA'", A, 'authenticated', expect_err=True)
        sql("update public.players set game_admin = true where id = 'user_01AAA'")
        R['admA'] = json.loads(sql("select public.tm_hello('{}')", A, 'authenticated')).get('admin'); R['admB'] = json.loads(sql("select public.tm_hello('{}')", B, 'authenticated')).get('admin')
        # before consent a batch is dropped; with it the session and the events land
        sid = '11111111-1111-4111-8111-111111111111'
        batch = lambda c, ended='false', reason='null': sql("select public.tm_batch('%s', '{\"version\":\"t1\",\"browser\":\"chrome\",\"boat\":\"sjark\",\"cash\":125000,\"fleet\":2,\"fleetValue\":900000,\"streak\":3}', 120, '[{\"k\":\"app\",\"t\":%d,\"d\":{\"app\":\"redskap\"}},{\"k\":\"sale\",\"t\":%d,\"d\":{\"kr\":5400,\"kg\":180,\"tripMin\":240,\"port\":\"husoy\"}}]', %s, %s)" % (sid, int(time.time() * 1000) - 60000, int(time.time() * 1000), ended, reason), c, 'authenticated')
        batch(A); R['before'] = sql("select count(*) from public.events")
        R['devBefore'] = sql("select coalesce(browser, '-') from public.players where id = 'user_01AAA'")
        sql("select public.tm_consent(true, 1990)", A, 'authenticated'); batch(A); batch(A, 'true', "'rage'")
        sql("select public.tm_hello('{\"lang\":\"nb\",\"tz\":\"Europe/Oslo\",\"browser\":\"chrome\",\"platform\":\"android\",\"pwa\":true}')", A, 'authenticated')
        R['devAfter'] = sql("select coalesce(browser, '-') from public.players where id = 'user_01AAA'")
        R['after'] = sql("select count(*) || '/' || (select active_s from public.sessions) || '/' || (select end_reason from public.sessions) from public.events")
        # under 13 a yes is not consent
        sql("select public.tm_hello('{}')", B, 'authenticated'); sql("select public.tm_consent(true, %d)" % 2020, B, 'authenticated')
        R['child'] = sql("select consent || '/' || coalesce(birth_year::text, '-') from public.players where id = 'user_01BBB'")
        # errors also without consent, then without a name
        sql("select public.tm_error('TypeError: x', 'view3d.js:1', 'at f', '{\"version\":\"t1\"}')", B, 'authenticated')
        sql("select public.tm_error('TypeError: y', 'core.js:2', '', '{}')", {}, 'anon')
        R['errors'] = sql("select count(*) || '/' || count(player_id) from public.errors")
        # the cloud save: newer wins, older is refused unless forced, and each player sees only his own
        R['save1'] = json.loads(sql("select public.save_put('KYST2:AAA', '2026-10-04T10:00:00Z', 100, false)", A, 'authenticated'))
        R['save2'] = json.loads(sql("select public.save_put('KYST2:OLD', '2026-10-04T09:00:00Z', 90, false)", A, 'authenticated'))
        R['save3'] = json.loads(sql("select public.save_put('KYST2:OLD', '2026-10-04T09:00:00Z', 90, true)", A, 'authenticated'))
        R['getA'] = json.loads(sql("select public.save_get()", A, 'authenticated')); R['getB'] = json.loads(sql("select public.save_get()", B, 'authenticated'))
        # the lock: a player reads no table and not the dashboard; the admin needs aal2
        R['readEv'] = sql("select count(*) from public.events", A, 'authenticated'); R['readPl'] = sql("select count(*) from public.players", A, 'authenticated')
        R['readAnon'] = sql("select count(*) from public.players", {}, 'anon', expect_err=True)
        R['writePl'] = sql("insert into public.events (kind) values ('x')", A, 'authenticated', expect_err=True)
        R['dashPlayer'] = sql("select public.admin_dashboard(30)", A, 'authenticated', expect_err=True)
        R['dashAal1'] = sql("select public.admin_dashboard(30)", AD1, 'authenticated', expect_err=True)
        R['anonDash'] = sql("select public.admin_dashboard(30)", {}, 'anon', expect_err=True)
        R['anonTrunc'] = sql("truncate public.admins", {}, 'anon', expect_err=True)
        R['plTrunc'] = sql("truncate public.admins", A, 'authenticated', expect_err=True)
        R['anonSave'] = sql("select public.save_get()", {}, 'anon', expect_err=True)
        R['anonSeq'] = sql("select nextval('public.events_id_seq')", {}, 'anon', expect_err=True)
        D = json.loads(sql("select public.admin_dashboard(30)", AD2, 'authenticated'))
        R['adminRead'] = sql("select count(*) from public.events", AD2, 'authenticated')
        # «slett kontoen»
        sql("insert into public.products values ('boat-skin-1', 'skin', 'Rød skrog', 'Red hull', 49, null, true, '{}')")
        sql("insert into public.purchases (id, player_id, product_id, amount_nok, status, paid_at) values ('cs_test_1', 'user_01AAA', 'boat-skin-1', 49, 'paid', now())")
        # push notifications (20261005120000_push.sql): only the browsers' push services, a plan only with a subscription and only two
        # days ahead, the tables closed to players, and the sender (service role) takes what is due once
        import datetime as _dt
        ts = lambda sec: (_dt.datetime.now(_dt.timezone.utc) + _dt.timedelta(seconds=sec)).isoformat()
        plan = lambda *secs: "select public.push_plan('%s')" % json.dumps([{'at': ts(x), 'tag': 'gear-%d' % i, 'title': 'Snekka', 'body': 'Garnene har stått i 20 timer.'} for i, x in enumerate(secs)])
        R['pushBad'] = sql("select public.push_sub('https://evil.example/x', 'k', 'a', 'no')", A, 'authenticated', expect_err=True)
        R['pushNoSub'] = sql(plan(-30), A, 'authenticated')
        sql("select public.push_sub('https://fcm.googleapis.com/fcm/send/abc', 'BPkey', 'authkey', 'no')", A, 'authenticated')
        R['pushPlan'] = sql(plan(-30, 3600, 5 * 86400), A, 'authenticated')
        R['pushAnon'] = sql("select public.push_plan('[]')", {}, 'anon', expect_err=True)
        R['pushClaimPl'] = sql("select count(*) from public.push_claim(10)", A, 'authenticated', expect_err=True)
        R['pushRead'] = sql("select count(*) from public.push_subs", A, 'authenticated', expect_err=True)
        R['pushClaim'] = sql("select count(*) from public.push_claim(10)", None, 'service_role') + '/' + sql("select count(*) from public.push_claim(10)", None, 'service_role')
        R['pushReplan'] = sql(plan(600), A, 'authenticated') + '/' + sql("select count(*) from public.push_queue where sent_at is null")
        # feedback (20261005180000_feedback.sql): a player sends and reads only their own, without the pictures; no player reads the
        # table or the list; the admin with aal2 lists them, opens a picture, sets the status and answers; at most 20 a day; a picture
        # that is not an image data URL, an unknown topic and the anonymous are refused; they go with the account
        IMG = 'data:image/jpeg;base64,' + 'A' * 400
        R['fbSend'] = sql("select public.fb_send('bug', 'Båten gikk på land', 4, '%s', '{\"version\":\"t1\",\"pos\":[69.5,17.6]}')" % IMG, A, 'authenticated')
        R['fbBadImg'] = sql("select public.fb_send('idea', 'Hei der', null, 'https://evil.example/x.png', '{}')", A, 'authenticated', expect_err=True)
        R['fbBadTopic'] = sql("select public.fb_send('spam', 'Hei der', null, null, '{}')", A, 'authenticated', expect_err=True)
        R['fbAnon'] = sql("select public.fb_send('bug', 'Hei der', null, null, '{}')", {}, 'anon', expect_err=True)
        R['fbMineA'] = json.loads(sql("select public.fb_mine()", A, 'authenticated')); R['fbMineB'] = json.loads(sql("select public.fb_mine()", B, 'authenticated'))
        R['fbRead'] = sql("select count(*) from public.feedback", A, 'authenticated', expect_err=True)
        R['fbAdmPl'] = sql("select public.admin_feedback(10, null, null)", A, 'authenticated', expect_err=True)
        R['fbAdm1'] = sql("select public.admin_feedback(10, null, null)", AD1, 'authenticated', expect_err=True)
        F = json.loads(sql("select public.admin_feedback(10, null, null)", AD2, 'authenticated')); fid = F['rows'][0]['id'] if F['rows'] else 0
        R['fbImg'] = sql("select length(public.admin_feedback_img(%d))" % fid, AD2, 'authenticated')
        sql("select public.admin_feedback_set(%d, 'fixed', 'Takk, rettet!')" % fid, AD2, 'authenticated')
        R['fbMine2'] = json.loads(sql("select public.fb_mine()", A, 'authenticated'))
        # several pictures and video (20261006010000_feedback_media.sql)
        I2 = 'data:image/png;base64,' + 'B' * 300; I3 = 'data:image/webp;base64,' + 'C' * 200
        R['fb2'] = sql("""select public.fb_send2('bug', 'Tre bilder', null, '["%s", "%s", "%s"]', '{}')""" % (IMG, I2, I3), A, 'authenticated')
        R['fb2Bad'] = sql("""select public.fb_send2('bug', 'Feil bilde', null, '["%s", "javascript:x"]', '{}')""" % IMG, A, 'authenticated', expect_err=True)
        R['fb2Five'] = sql("""select public.fb_send2('bug', 'Fem bilder', null, '["%s", "%s", "%s", "%s", "%s"]', '{}')""" % ((IMG,) * 5), A, 'authenticated', expect_err=True)
        R['fb2None'] = sql("select public.fb_send2('idea', 'Uten bilder', null, null, '{}')", A, 'authenticated')
        f2 = int(R['fb2'])
        R['slot1'] = sql("select public.fb_media_slot(%d, 'video/mp4', 30000000, 42)" % f2, A, 'authenticated')
        R['slotOk'] = sql("select public.fb_media_ok('%s')" % R['slot1'], A, 'authenticated') + '/' + sql("select public.fb_media_ok('%s')" % R['slot1'], B, 'authenticated') + '/' + sql("select public.fb_media_own('%s')" % R['slot1'], A, 'authenticated') + '/' + sql("select public.fb_media_own('%s')" % R['slot1'], B, 'authenticated')
        sql("select public.fb_media_done('%s')" % R['slot1'], A, 'authenticated')
        R['slotDone'] = sql("select public.fb_media_ok('%s')" % R['slot1'], A, 'authenticated')
        R['slot2a'] = sql("select public.fb_media_slot(%d, 'video/webm', 1000, 2)" % f2, A, 'authenticated')
        R['slot2'] = sql("select public.fb_media_slot(%d, 'video/webm', 1000, 2)" % f2, A, 'authenticated')   # the first try failed: a new name in its place
        sql("select public.fb_media_done('%s')" % R['slot2'], A, 'authenticated')
        R['slot3'] = sql("select public.fb_media_slot(%d, 'video/mp4', 1000, 2)" % f2, A, 'authenticated', expect_err=True)
        R['slotBig'] = sql("select public.fb_media_slot(%d, 'video/mp4', 60000000, 2)" % int(R['fb2None']), A, 'authenticated', expect_err=True)
        R['slotType'] = sql("select public.fb_media_slot(%d, 'text/html', 1000, 2)" % int(R['fb2None']), A, 'authenticated', expect_err=True)
        R['slotOther'] = sql("select public.fb_media_slot(%d, 'video/mp4', 1000, 2)" % f2, B, 'authenticated', expect_err=True)
        R['mediaList'] = json.loads(sql("select public.fb_media_list()", A, 'authenticated')); R['mediaListB'] = json.loads(sql("select public.fb_media_list()", B, 'authenticated'))
        R['mine2'] = [m for m in json.loads(sql("select public.fb_mine()", A, 'authenticated')) if m['id'] == f2]
        R['admImgs'] = json.loads(sql("select public.admin_feedback_imgs(%d)" % f2, AD2, 'authenticated'))
        R['admImgsPl'] = sql("select public.admin_feedback_imgs(%d)" % f2, A, 'authenticated', expect_err=True)
        F2 = json.loads(sql("select public.admin_feedback(50, null, null)", AD2, 'authenticated')); R['admRow2'] = [r for r in F2['rows'] if r['id'] == f2]; R['admVmb'] = F2.get('vmb'); R['admOrph'] = F2.get('orphans')
        sql("select public.admin_media_gone('%s')" % R['slot2'], AD2, 'authenticated'); R['mediaAfterGone'] = json.loads(sql("select public.fb_media_list()", A, 'authenticated'))
        R['mediaRead'] = sql("select count(*) from public.feedback_media", A, 'authenticated', expect_err=True)
        for i in range(20): sql("select public.fb_send('other', 'nr %d', null, null, '{}')" % i, B, 'authenticated')
        R['fbLimit'] = sql("select public.fb_send('other', 'nr 21', null, null, '{}')", B, 'authenticated', expect_err=True)
        # the cloud save by revision (20261005200000_save_sync.sql): a device that has not met the cloud's newest save cannot write over
        # it (the phone left open with an old game), a forced save keeps the one it replaces, and the history is the player's own
        PD = {'sub': 'user_01DDD', 'role': 'authenticated'}; sql("select public.tm_hello('{}')", PD, 'authenticated')
        put2 = lambda data, at, base, force='false': json.loads(sql("select public.save_put2('%s', '%s', %d, %s, %s, '{\"day\":%d}')" % (data, at, 100, "'%s'" % base if base else 'null', force, len(data)), PD, 'authenticated'))
        R['sv1'] = put2('KYST2:TABLET1', '2026-10-05T10:00:00Z', None)
        r1 = R['sv1'].get('saved_at')
        R['sv2'] = put2('KYST2:TABLET2', '2026-10-05T10:03:00Z', r1); r2 = R['sv2'].get('saved_at')
        R['svPhone'] = put2('KYST2:PHONEOLD', '2026-10-05T11:00:00Z', None)              # the phone, never met the cloud
        R['svStale'] = put2('KYST2:PHONEOLD', '2026-10-05T11:03:00Z', r1)               # or met it at the first save only
        R['svCloud'] = json.loads(sql("select public.save_get()", PD, 'authenticated'))
        R['svForce'] = put2('KYST2:PHONEOLD', '2026-10-05T11:06:00Z', None, 'true')
        R['svHist'] = json.loads(sql("select public.save_hist_list()", PD, 'authenticated'))
        hid = [h['id'] for h in R['svHist'] if h['saved_at'].startswith('2026-10-05T10:03')]
        R['svBack'] = json.loads(sql("select public.save_hist_get(%d)" % (hid[0] if hid else 0), PD, 'authenticated'))
        R['svOther'] = sql("select public.save_hist_get(%d)" % (hid[0] if hid else 0), B, 'authenticated')
        R['svRead'] = sql("select count(*) from public.save_hist", PD, 'authenticated', expect_err=True)
        R['svOld'] = json.loads(sql("select public.save_put('KYST2:OLDPAGE', '2026-10-05T12:00:00Z', 5, false)", PD, 'authenticated'))   # an old page left open
        # the shared world V3: where the boats are (20261005220000_presence.sql)
        sql("select public.pos_put(850, 350, 90, 7, 'sailing', 'Havbris', 'trebat')", A, 'authenticated')
        sql("select public.pos_put(851, 350.5, 180, 0, 'fishing', 'Fjordbris', 'skiff')", B, 'authenticated')
        R['nearB'] = json.loads(sql("select public.pos_near(850, 350, 20)", B, 'authenticated'))
        R['nearA'] = json.loads(sql("select public.pos_near(850, 350, 20)", A, 'authenticated'))
        R['nearFar'] = json.loads(sql("select public.pos_near(100, 100, 20)", B, 'authenticated'))
        sql("update public.presence set at = now() - interval '5 minutes' where player_id = 'user_01BBB'")
        R['nearStale'] = json.loads(sql("select public.pos_near(850, 350, 20)", A, 'authenticated'))
        R['posRead'] = sql("select count(*) from public.presence", A, 'authenticated', expect_err=True)
        R['posBad'] = sql("select public.pos_put('NaN', 1, 0, 0, '', '', '')", A, 'authenticated', expect_err=True)
        R['posAnon'] = sql("select public.pos_near(850, 350, 20)", {}, 'anon', expect_err=True)
        sql("select public.pos_off()", A, 'authenticated'); R['posOff'] = sql("select count(*) from public.presence where player_id = 'user_01AAA'")
        # the shared world V2: one quota, one market and one sea (20261006000000_world_v2.sql)
        sql("""select public.land_put(1000, 2027, 'finnsnes', 'open', '[{"sp":"torsk","kg":500,"kgq":500},{"sp":"hyse","kg":100,"kgq":0}]')""", A, 'authenticated')
        sql("""select public.land_put(1000, 2027, 'finnsnes', 'open', '[{"sp":"torsk","kg":300,"kgq":300}]')""", B, 'authenticated')
        R['wB'] = json.loads(sql("select public.world_get(0, 2027, 1010)", B, 'authenticated'))
        R['wA'] = json.loads(sql("select public.world_get(0, 2027, 1000)", A, 'authenticated'))
        sql("""select public.land_put(1001, 2027, 'senjahopen', 'open', '[{"sp":"torsk","kg":90000,"kgq":90000}]')""", A, 'authenticated')
        R['wCap'] = json.loads(sql("select public.world_get(0, 2027, 1001)", B, 'authenticated'))
        R['wOtherY'] = json.loads(sql("select public.world_get(0, 2028, 1001)", B, 'authenticated'))
        sql("select public.catch_put(1000, '[[549755813890, 200], [549755813891, 50]]')", A, 'authenticated')
        R['cB'] = json.loads(sql("select public.world_get(0, 2027, 1000)", B, 'authenticated'))
        R['cB2'] = json.loads(sql("select public.world_get(%d, 2027, 1000)" % R['cB']['cur'], B, 'authenticated'))
        R['cA'] = json.loads(sql("select public.world_get(0, 2027, 1000)", A, 'authenticated'))
        # the open group's leaderboard (20261006020000_toplist.sql): game week 5 is game hours 840-1008, so A's landings above are in it
        sql("""select public.land_put(1002, 2027, 'botnhamn', 'open', '[{"sp":"torsk","kg":200,"kgq":200}]', 'Fjordbris')""", B, 'authenticated')
        sql("""select public.land_put(1003, 2027, 'botnhamn', 'lukket', '[{"sp":"torsk","kg":9999,"kgq":0}]', 'Fjordbris')""", B, 'authenticated')
        sql("""select public.land_put(1005, 2027, 'finnsnes', 'open', '[{"sp":"torsk","kg":100,"kgq":100}]', 'Havbris')""", A, 'authenticated')
        R['topB'] = json.loads(sql("select public.world_top(5)", B, 'authenticated')); R['topA'] = json.loads(sql("select public.world_top(5)", A, 'authenticated'))
        R['top4'] = json.loads(sql("select public.world_top(4)", B, 'authenticated'))
        R['topAnon'] = sql("select public.world_top(5)", {}, 'anon', expect_err=True)
        sql("""select public.land_put(1200, 2027, 'botnhamn', 'open', '[{"sp":"torsk","kg":50,"kgq":50}]', '<i>Ond</i>')""", B, 'authenticated')
        R['topEvil'] = json.loads(sql("select public.world_top(7)", A, 'authenticated'))['rows']
        sql("select public.pos_put(860, 350, 0, 0, 'sailing', '<img src=x>Ond', 'skiff')", B, 'authenticated')
        R['posEvil'] = [q['boat'] for q in json.loads(sql("select public.pos_near(860, 350, 20)", A, 'authenticated'))]
        R['wBadT'] = sql("select public.land_put('NaN', 2027, 'x', 'open', '[]')", A, 'authenticated', expect_err=True)
        R['wBadC'] = sql("select public.catch_put(1, (select jsonb_agg(jsonb_build_array(i, 1)) from generate_series(1, 601) i))", A, 'authenticated', expect_err=True)
        R['wRead'] = sql("select count(*) from public.landings", A, 'authenticated', expect_err=True)
        R['wAnon'] = sql("select public.world_get(0, 2027, 1)", {}, 'anon', expect_err=True)
        R['wAdmPl'] = sql("select public.admin_world()", A, 'authenticated', expect_err=True)
        sql("select public.delete_me()", A, 'authenticated')
        R['wGone'] = sql("select (select count(*) from public.landings where player_id = 'user_01AAA') || '/' || (select count(*) from public.catches where player_id = 'user_01AAA') || '/' || (select count(*) from public.landings)")
        R['fbGone'] = sql("select count(*) from public.feedback where player_id = 'user_01AAA'")
        R['pushGone'] = sql("select count(*) || '/' || (select count(*) from public.push_queue) from public.push_subs")
        R['deleted'] = sql("select (select count(*) from public.players where id = 'user_01AAA') || '/' || (select count(*) from public.events) || '/' || (select count(*) from public.saves where player_id = 'user_01AAA') || '/' || (select coalesce(player_id, 'anon') from public.purchases)")
        # a yes taken back: the sessions, events, device, state and year of birth go, the account and the save stay
        C = {'sub': 'user_01CCC', 'role': 'authenticated'}; sid = '22222222-2222-4222-8222-222222222222'
        sql("select public.tm_hello('{}')", C, 'authenticated'); sql("select public.tm_consent(true, 1985)", C, 'authenticated')
        sql("select public.tm_hello('{\"browser\":\"firefox\",\"tz\":\"Europe/Oslo\"}')", C, 'authenticated'); batch(C)
        sql("select public.save_put('KYST2:CCC', '2026-10-04T10:00:00Z', 5, false)", C, 'authenticated')
        sql("select public.tm_error('TypeError: z', 'core.js:3', '', '{\"sid\":\"%s\"}')" % sid, C, 'authenticated')
        R['withdrawYes'] = sql("select (select count(*) from public.events where player_id = 'user_01CCC') || '/' || (select browser || '/' || birth_year from public.players where id = 'user_01CCC') || '/' || (select count(*) from public.errors where player_id = 'user_01CCC')")
        sql("select public.tm_consent(false, null)", C, 'authenticated')
        R['withdrawNo'] = sql("select (select count(*) from public.events where player_id = 'user_01CCC') || '/' || (select count(*) from public.sessions where player_id = 'user_01CCC') || '/' || (select coalesce(browser, '-') || '/' || coalesce(tz, '-') || '/' || coalesce(boat, '-') || '/' || coalesce(birth_year::text, '-') || '/' || consent from public.players where id = 'user_01CCC') || '/' || (select count(*) from public.errors where player_id = 'user_01CCC') || '/' || (select count(*) from public.saves where player_id = 'user_01CCC')")
        print('sql:', json.dumps({k: v for k, v in R.items() if k not in ('readAnon', 'writePl', 'dashPlayer', 'dashAal1', 'anonDash', 'anonTrunc', 'plTrunc', 'anonSave', 'anonSeq', 'admSelf')}, ensure_ascii=False, default=str))
        print(ok(R['hello']['consent'] is None and R['hello']['owned'] == []), 'hello makes the player and says consent is not asked yet')
        print(ok(R['hello']['admin'] is False and R['admA'] is True and R['admB'] is False and R['admSelf'][0]), "hello says admin only for the account flagged by hand, and a player cannot flag himself", [R['admA'], R['admB'], R['admSelf'][1][:50]])
        print(ok(R['before'] == '0' and R['after'] == '4/240/rage'), 'no consent, nothing stored; with consent the session, its active time, the events and a rage quit are', R['after'])
        print(ok(R['devBefore'] == '-' and R['devAfter'] == 'chrome'), 'the device is stored only with consent (the privacy page)', [R['devBefore'], R['devAfter']])
        print(ok(R['child'] == 'false/-'), 'under 13 a yes does not count as consent (personopplysningsloven § 5), and the year of birth is not kept', R['child'])
        print(ok(R['withdrawYes'] == '2/firefox/1985/1' and R['withdrawNo'] == '0/0/-/-/-/-/false/0/1'), 'taking the yes back deletes the sessions, events, device, state and year of birth and unnames the errors; the save stays', [R['withdrawYes'], R['withdrawNo']])
        print(ok(R['errors'] == '2/0'), 'errors come in also without consent and from the anonymous, and then without a name', R['errors'])
        print(ok(R['save1']['ok'] and not R['save2']['ok'] and R['save3']['ok'] and R['getA']['data'] == 'KYST2:OLD' and R['getB'] is None), 'the cloud save: the newest wins, an older one is refused unless forced, and each sees only his own')
        print(ok(R['readEv'] == '0' and R['readPl'] == '0' and all(R[k][0] for k in ('readAnon', 'writePl', 'dashPlayer', 'dashAal1', 'anonDash'))), 'the lock: a player sees no rows and cannot write a table or open the dashboard, the admin without the second factor is refused, the anonymous too',
              [R[k][1][:50] for k in ('writePl', 'dashPlayer', 'dashAal1')])
        print(ok(R['sv1'].get('ok') and R['sv2'].get('ok') and not R['svPhone'].get('ok') and not R['svStale'].get('ok') and R['svStale'].get('cloud', {}).get('summary', {}).get('day') == 13
                 and R['svCloud']['data'] == 'KYST2:TABLET2' and not R['svOld'].get('ok')), 'the cloud save: a device that has not met the newest save cannot write over it (the old phone, also an old page), and is told what the cloud has',
              {k: R[k] for k in ('sv1', 'sv2', 'svPhone', 'svStale')})
        print(ok(R['svForce'].get('ok') and R['svBack'] and R['svBack']['data'] == 'KYST2:TABLET2' and R['svOther'] == 'null' and R['svRead'][0] and len(R['svHist']) >= 2),
              'a forced save keeps the game it replaced in the history, and only the player can take it back', {'hist': len(R['svHist']), 'back': (R['svBack'] or {}).get('data'), 'other': R['svOther']})
        print(ok(R['fbSend'].isdigit() and all(R[k][0] for k in ('fbBadImg', 'fbBadTopic', 'fbAnon')) and len(R['fbMineA']) == 1 and R['fbMineA'][0]['img'] is True and 'data:' not in json.dumps(R['fbMineA']) and R['fbMineB'] == []),
              'feedback: a player sends one with a picture and sees only their own, without the picture; a bad picture, an unknown topic and the anonymous are refused', [R[k][1][:40] for k in ('fbBadImg', 'fbBadTopic', 'fbAnon')])
        print(ok(all(R[k][0] for k in ('fbRead', 'fbAdmPl', 'fbAdm1')) and F['rows'] and F['rows'][0]['meta'].get('version') == 't1' and F['topics'].get('bug') == 1 and R['fbImg'] == str(len(IMG)) and R['fbMine2'][0]['status'] == 'fixed' and R['fbMine2'][0]['reply'] == 'Takk, rettet!'),
              'feedback: no player reads the table or the list, nor the admin without the second factor; the admin lists them, opens the picture, sets the status and answers, and the player sees it', {'topics': F.get('topics'), 'img': R['fbImg'], 'mine': R['fbMine2'][0] if R['fbMine2'] else None})
        print(ok(R['fbLimit'][0] and R['fbGone'] == '0'), 'feedback: at most 20 a day, and they go with the account', [R['fbLimit'][1][:40], R['fbGone']])
        a2 = R['admRow2'][0] if R['admRow2'] else {}; m2 = R['mine2'][0] if R['mine2'] else {}
        print(ok(R['fb2'].isdigit() and R['fb2Bad'][0] and R['fb2Five'][0] and R['fb2None'].isdigit() and R['admImgs'] == [IMG, I2, I3] and R['admImgsPl'][0] and m2.get('nimg') == 3 and a2.get('nimg') == 3),
              'feedback: up to four pictures, each checked; the admin gets them all in order, a player not', {'mine': m2, 'bad': R['fb2Bad'][1][:30], 'five': R['fb2Five'][1][:30]})
        print(ok(R['slot1'].startswith('user_01AAA/%d-1-' % f2) and R['slot1'].endswith('.mp4') and R['slotOk'] == 't/f/t/f' and R['slotDone'] == 'f' and R['slot2'].endswith('.webm')
                 and all(R[k][0] for k in ('slot3', 'slotBig', 'slotType', 'slotOther', 'mediaRead')) and R['mediaListB'] == [] and m2.get('vids') == 2
                 and len(a2.get('vids', [])) == 2 and R['admVmb'] == 28.6 and R['slot2a'] != R['slot2'] and R['slot2a'] not in [v['path'] for v in a2.get('vids', [])] and R['admOrph'] == 0 and R['mediaAfterGone'] == [R['slot1']]),
              "feedback video: a name in the player's own folder for their own feedback, which only they may upload to and only once; two a feedback, 50 MB, video types only; the admin sees them and drops a deleted one",
              {'slot': R['slot1'], 'ok': R['slotOk'], 'refused': [R[k][1][:30] for k in ('slot3', 'slotBig', 'slotType', 'slotOther')], 'vmb': R['admVmb'], 'vids': a2.get('vids')})
        nb = R['nearB'][0] if R['nearB'] else {}
        print(ok(len(R['nearB']) == 1 and nb.get('boat') == 'Havbris' and nb.get('vtype') == 'trebat' and len(nb.get('id', '')) == 10 and 'user_' not in json.dumps(R['nearB'])
                 and len(R['nearA']) == 1 and R['nearA'][0]['boat'] == 'Fjordbris' and R['nearFar'] == [] and R['nearStale'] == []),
              'the shared world: each player sees the other boats near by (name, type, place, heading, speed), never their own or an account, and not one gone quiet for two minutes', {'B': nb, 'far': R['nearFar'], 'stale': R['nearStale']})
        print(ok(R['posRead'][0] and R['posBad'][0] and R['posAnon'][0] and R['posOff'] == '0'),
              'the shared world: no one reads the table, a bad position and the anonymous are refused, and «hide my boat» takes it away', [R[k][1][:40] for k in ('posRead', 'posBad', 'posAnon')] + [R['posOff']])
        mk = {(a, b): c for a, b, c in R['wB']['mkt']}
        print(ok(R['wB']['open'] == 500 and R['wA']['open'] == 300 and R['wB']['boats'] == 1 and abs(mk.get(('finnsnes', 'torsk'), 0) - 500 * 0.97 ** 10) < 0.2
                 and abs(mk.get(('finnsnes', 'hyse'), 0) - 100 * 0.97 ** 10) < 0.2 and R['wCap']['open'] == 60000 and R['wOtherY']['open'] == 0),
              "the shared world: each player gets the others' open-group cod this year (capped at 60 t a player) and what they delivered to each plant, decayed by the game hours since",
              {'B': R['wB'], 'cap': R['wCap']['open']})
        cl = {a: b for a, b in R['cB']['cells']}
        print(ok(cl.get(549755813890) == 200 and cl.get(549755813891) == 50 and R['cB']['cur'] > 0 and R['cB2']['cells'] == [] and R['cA']['cells'] == []),
              "the shared world: the fish another player took comes cell by cell once (the cursor), never one's own", {'B': R['cB']['cells'], 'again': R['cB2']['cells'], 'A': R['cA']['cells']})
        tb = R['topB']['rows']
        print(ok(len(tb) == 2 and tb[0]['boat'] == 'Havbris' and tb[0]['kg'] == 10700 and tb[0]['port'] == 'senjahopen' and not tb[0]['me'] and tb[1]['boat'] == 'Fjordbris' and tb[1]['kg'] == 500
                 and tb[1]['port'] == 'finnsnes' and tb[1]['me'] and R['topB']['mine'] == {'rank': 2, 'kg': 500} and R['topA']['mine']['rank'] == 1 and R['topA']['rows'][0]['me'] and R['top4']['rows'] == [] and R['topAnon'][0]
                 and 'user_' not in json.dumps(R['topB']) and R['topEvil'] and R['topEvil'][0]['boat'] == 'iOnd/i' and R['posEvil'] == ['img src=xOnd']),
              "the open group's leaderboard: the players by what they landed in the open group that game week, under the boat's latest name and the plant they delivered most to (a closed-group landing does not count, a landing at most 10 t), with one's own rank, never an account; a boat's name loses anything that could make markup (also on the AIS)",
              R['topB'])
        print(ok(all(R[k][0] for k in ('wBadT', 'wBadC', 'wRead', 'wAnon', 'wAdmPl')) and R['wGone'].startswith('0/0/')),
              'the shared world: a bad time, too many cells, reading the tables, the anonymous and a player asking the admin sums are refused; the landings and catches go with the account',
              [R[k][1][:40] for k in ('wBadT', 'wBadC', 'wRead', 'wAnon', 'wAdmPl')] + [R['wGone']])
        keys = ['overview', 'daily', 'heatmap', 'churn', 'rage', 'features', 'gear', 'boats', 'groundings', 'trips', 'economy', 'money', 'tech', 'geo']
        print(ok(all(k in D for k in keys) and D['overview']['players'] == 2 and D['overview']['sessions'] == 1 and D['rage']['share'] == 1 and D['trips']['avg_kr'] == 5400 and R['adminRead'] == '4'),
              'the admin with aal2 gets every panel of the dashboard and reads the tables', {k: D[k] for k in ('overview', 'rage', 'trips')})
        print(ok(all(R[k][0] for k in ('anonTrunc', 'plTrunc', 'anonSave', 'anonSeq'))), "Supabase's default rights are taken back: no one empties the admin list, and the anonymous call no player function and touch no sequence", [R[k][1][:45] for k in ('anonTrunc', 'plTrunc', 'anonSave', 'anonSeq')])
        print(ok(R['pushBad'][0] and R['pushNoSub'] == '0' and R['pushPlan'] == '2' and all(R[k][0] for k in ('pushAnon', 'pushClaimPl', 'pushRead')) and R['pushClaim'] == '1/0' and R['pushReplan'] == '1/1'),
              'push: only the browsers\' push services; no plan without a subscription; only what is due within two days; players never read the tables or claim; the sender takes what is due once; a new plan replaces the old', {k: R[k] for k in ('pushNoSub', 'pushPlan', 'pushClaim', 'pushReplan')})
        print(ok(R['pushGone'] == '0/0'), 'deleting the account takes the push subscriptions and the queue', R['pushGone'])
        print(ok(R['deleted'] == '0/0/0/anon'), 'deleting the account takes the player, the events and the save; the purchase stays without a name for the books', R['deleted'])
    finally:
        run(*as_pg([os.path.join(BIN, 'pg_ctl'), '-D', data, '-m', 'immediate', 'stop']))
        shutil.rmtree(tmp, ignore_errors=True)


main()
