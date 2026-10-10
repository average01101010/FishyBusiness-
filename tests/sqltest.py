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
        # the device behind the frame rate and the errors (20261006160000_device_data.sql), and the agent's and the admin's view of them
        dev = '{"version":"t2","platform":"android","browser":"chrome","gpu":"Adreno (TM) 642L","cores":"8","mem":"6","scr":"412x915@2.6","lvl":"1","view":"3d"}'
        sql("select public.tm_perf(41.5, 18, 3, '%s')" % dev, {}, 'anon'); sql("select public.tm_perf(55, 40, 0, '%s')" % dev.replace('"cores":"8"', '"cores":"lots"'), {}, 'anon')
        sql("select public.tm_error('WebGL: shader x', 'view3d.js:9', 'at s', '%s')" % dev, {}, 'anon')
        R['devPerf'] = sql("select string_agg(gpu || '|' || coalesce(cores::text, '-') || '|' || mem || '|' || scr || '|' || lvl || '|' || view, ' ; ' order by id) from public.perf where gpu is not null")
        TV = json.loads(sql("select public.agent_tech(7)", None, 'service_role'))
        R['devTech'] = {'err': [e for e in TV['errors'] if e['msg'] == 'WebGL: shader x'], 'fps': [f for f in TV['fps_device'] if f['gpu'] == 'Adreno (TM) 642L'], 'keys': sorted(TV)}
        R['devPl'] = sql("select public.agent_tech(7)", B, 'authenticated', expect_err=True); R['devAdm1'] = sql("select public.admin_devices(7)", AD1, 'authenticated', expect_err=True)
        R['devAdm'] = sorted(json.loads(sql("select public.admin_devices(7)", AD2, 'authenticated')))
        R['errors'] = sql("select count(*) || '/' || count(player_id) from public.errors where msg <> 'WebGL: shader x'")
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
        NOON = "set dsb.clock = '2026-10-06 12:00:00+02'; "   # the tests' clock for the weekly message; push_claim has no quiet hours since 20261008000000_push_ops.sql
        # nothing is sent sooner than five minutes after the plan was laid (push_plan): the tests make what is five minutes off due now
        DUE = "update public.push_queue set send_at = now() - interval '1 second' where sent_at is null and send_at > now() and send_at < now() + interval '6 minutes'; "
        R['pushFloor'] = sql("select (min(send_at) > now() + interval '4 minutes')::text from public.push_queue where player_id = 'user_01AAA' and sent_at is null")   # the -30 s item was held back to five minutes from now
        R['pushClaim'] = sql(DUE + "select count(*) from public.push_claim(10)", None, 'service_role') + '/' + sql(DUE + "select count(*) from public.push_claim(10)", None, 'service_role')
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
        # the feedback agent (20261006120000_feedback_agent.sql): only service_role (the Edge Function feedback-agent) reads, without who wrote it
        R['agMail'] = sql("select public.fb_send('ui', 'Skriv til ola.nordmann@example.no eller 912 34 567, knappen virker ikke', 2, null, '{\"version\":\"t2\",\"boat\":\"skiff\",\"email\":\"x@y.no\"}')", A, 'authenticated')
        AG = json.loads(sql("select public.agent_feedback(50)", None, 'service_role')); agm = [r for r in AG['rows'] if r['id'] == int(R['agMail'])]
        R['agRows'] = len(AG['rows']); R['agRow'] = agm[0] if agm else {}; R['agWho'] = 'user_01' in json.dumps(AG)
        R['agPl'] = sql("select public.agent_feedback(5)", A, 'authenticated', expect_err=True); R['agAdm'] = sql("select public.agent_feedback(5)", AD2, 'authenticated', expect_err=True)
        R['agImgs'] = json.loads(sql("select public.agent_feedback_imgs(%d)" % f2, None, 'service_role'))
        sql("select public.agent_note(%s, 'Knappen i UI virker ikke (1 spiller)', 3, 'seen', 'Takk! Vi ser på det.')" % R['agMail'], None, 'service_role')
        R['agNoteBad'] = sql("select public.agent_note(%s, 'x', 1, 'deleted', null)" % R['agMail'], None, 'service_role', expect_err=True)
        R['agNotePl'] = sql("select public.agent_note(%s, 'x', 1, 'seen', null)" % R['agMail'], A, 'authenticated', expect_err=True)
        AG2 = json.loads(sql("select public.agent_feedback(50)", None, 'service_role'))
        R['agAfter'] = [r['id'] for r in AG2['rows'] if r['id'] == int(R['agMail'])]; R['agNoted'] = [n for n in AG2['noted'] if n['id'] == int(R['agMail'])]
        R['agRun'] = sql("select public.agent_run('# Rapport\n1 ny', '[{\"url\":\"https://github.com/x/pull/1\",\"title\":\"t\"}]', 1)", None, 'service_role')
        R['agRunPl'] = sql("select public.agent_run('x', '[]', 0)", A, 'authenticated', expect_err=True)
        R['agRuns'] = json.loads(sql("select public.admin_agent_runs(5)", AD2, 'authenticated')); R['agRunsPl'] = sql("select public.admin_agent_runs(5)", A, 'authenticated', expect_err=True)
        R['agAdmRow'] = [r for r in json.loads(sql("select public.admin_feedback(50, null, null)", AD2, 'authenticated'))['rows'] if r['id'] == int(R['agMail'])]
        # the thank-you (20261006140000_feedback_reward.sql): «Kommer» or «Fikset» gives the player one takk-haill grant, once per feedback
        fA = int(R['agMail']); cnt = lambda f: sql("select count(*) from public.grants where product_id = 'fb_haill' and (data->>'fid')::bigint = %d" % f)
        sql("select public.admin_feedback_set(%d, 'seen', null)" % fA, AD2, 'authenticated'); R['rwSeen'] = cnt(fA)
        sql("select public.admin_feedback_set(%d, 'planned', 'Kommer snart')" % fA, AD2, 'authenticated'); sql("select public.admin_feedback_set(%d, 'fixed', 'Rettet!')" % fA, AD2, 'authenticated')
        R['rwOnce'] = cnt(fA); R['rwFirst'] = cnt(fid)
        R['rwPend'] = [g for g in json.loads(sql("select public.shop_pending()", A, 'authenticated')) if g['product'] == 'fb_haill']
        R['rwMine'] = {m['id']: m.get('rewarded') for m in json.loads(sql("select public.fb_mine()", A, 'authenticated'))}
        R['rwBuy'] = sql("select public.shop_quote('fb_haill')", A, 'authenticated', expect_err=True)
        R['rwAdm'] = [r.get('rewarded') for r in json.loads(sql("select public.admin_feedback(50, null, null)", AD2, 'authenticated'))['rows'] if r['id'] == fA]
        R['rwPl'] = sql("select public.admin_feedback_set(%d, 'fixed', null)" % fA, A, 'authenticated', expect_err=True)
        if R['rwPend']: sql("select public.shop_done(array[%s]::bigint[])" % ','.join(str(g['id']) for g in R['rwPend']), A, 'authenticated')
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
        # pos_world (20261008120000_pos_world.sql): every active player whatever the distance, the paint only on the near ones
        sql("select public.pos_put(850, 350, 90, 7, 'sailing', 'Havbris', 'trebat', 'h:gul')", A, 'authenticated')
        R['allNear'] = json.loads(sql("select public.pos_world(850, 350, 20)", B, 'authenticated'))
        R['allFar'] = json.loads(sql("select public.pos_world(100, 100, 20)", B, 'authenticated'))
        R['allAnon'] = sql("select public.pos_world(850, 350, 20)", {}, 'anon', expect_err=True)
        sql("select public.pos_put(850, 350, 90, 7, 'sailing', 'Havbris', 'trebat')", A, 'authenticated')
        sql("update public.presence set at = now() - interval '5 minutes' where player_id = 'user_01BBB'")
        R['nearStale'] = json.loads(sql("select public.pos_near(850, 350, 20)", A, 'authenticated'))
        R['allStale'] = json.loads(sql("select public.pos_world(850, 350, 20)", A, 'authenticated'))
        R['posRead'] = sql("select count(*) from public.presence", A, 'authenticated', expect_err=True)
        R['posBad'] = sql("select public.pos_put('NaN', 1, 0, 0, '', '', '')", A, 'authenticated', expect_err=True)
        R['posAnon'] = sql("select public.pos_near(850, 350, 20)", {}, 'anon', expect_err=True)
        R['posOff'] = sql("select public.pos_off()", A, 'authenticated', expect_err=True)   # no hiding the boat (20261007130000_seen.sql)
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
        sql("""select public.land_put(1003, 2027, 'botnhamn', 'lukket', '[{"sp":"torsk","kg":9999,"kgq":0}]', 'Fjordbris', 'Fjordbris <b>Fiskeri</b> AS')""", B, 'authenticated')
        sql("""select public.land_put(1005, 2027, 'finnsnes', 'open', '[{"sp":"torsk","kg":100,"kgq":100}]', 'Havbris')""", A, 'authenticated')
        R['topB'] = json.loads(sql("select public.world_top(5)", B, 'authenticated')); R['topA'] = json.loads(sql("select public.world_top(5)", A, 'authenticated'))
        R['top4'] = json.loads(sql("select public.world_top(4)", B, 'authenticated'))
        R['topL'] = json.loads(sql("select public.world_top(5, 'lukket')", A, 'authenticated'))
        R['topAnon'] = sql("select public.world_top(5)", {}, 'anon', expect_err=True)
        sql("""select public.land_put(1200, 2027, 'botnhamn', 'open', '[{"sp":"torsk","kg":50,"kgq":50}]', '<i>Ond</i>')""", B, 'authenticated')
        R['topEvil'] = json.loads(sql("select public.world_top(7)", A, 'authenticated'))['rows']
        sql("select public.pos_put(860, 350, 0, 0, 'sailing', '<img src=x>Ond', 'skiff')", B, 'authenticated')
        R['posEvil'] = [q['boat'] for q in json.loads(sql("select public.pos_near(860, 350, 20)", A, 'authenticated'))]
        # the paint goes along (20261007090000_livery.sql): kept to its own characters and length, and handed on
        sql("select public.pos_put(860, 350, 0, 0, 'sailing', 'Fjordbris', 'skiff', 'h:kobolt<script>' || repeat('x', 300))", B, 'authenticated')
        R['posLiv'] = [q.get('liv') for q in json.loads(sql("select public.pos_near(860, 350, 20)", A, 'authenticated'))]
        sql("select public.pos_put(860, 350, 0, 0, 'sailing', 'Fjordbris', 'skiff')", B, 'authenticated')
        R['posLiv0'] = [q.get('liv') for q in json.loads(sql("select public.pos_near(860, 350, 20)", A, 'authenticated'))]
        # push rules (20261006030000_push_rules.sql, then 20261008000000_push_ops.sql): one message for what is due at once, a cap a day that follows
        # how much she plays (6, 12 with two sessions a day, 24 with four, 2 when the last five were not answered), no quiet night, nothing
        # stale, five minutes at the earliest, and the world's one message a week: Norway's best fisher
        sql("select public.push_sub('https://fcm.googleapis.com/fcm/send/bbb', 'BPkey2', 'authkey2', 'no')", B, 'authenticated')
        item = lambda secs, tag, exp=None, pri=None: dict({'at': ts(secs), 'tag': tag, 'title': 'Havbris', 'body': tag + ' skjedde.'}, **({'exp': ts(exp)} if exp is not None else {}), **({'pri': pri} if pri is not None else {}))
        sql("select public.push_plan('%s')" % json.dumps([item(-30, 'a1', None, 2), item(-20, 'a2', None, 0)]), A, 'authenticated')
        R['pMerge'] = json.loads(sql(DUE + "select coalesce(json_agg(c), '[]') from public.push_claim(10) c", None, 'service_role'))
        caps = []
        for i in range(8):
            sql("select public.push_plan('%s')" % json.dumps([item(-10, 'b%d' % i)]), B, 'authenticated')
            caps.append(sql(DUE + "select count(*) from public.push_claim(10) c where c.player_id = 'user_01BBB'", None, 'service_role'))
        R['pCap'] = '/'.join(caps)      # six a day for a new player, then none
        # two sessions a day for three days lift it to twelve; the sessions are the analytics' (sessions)
        sql("update public.push_queue set sent_at = sent_at - interval '25 hours' where player_id = 'user_01BBB'")
        sql("insert into public.sessions (id, player_id, started_at) select gen_random_uuid(), 'user_01BBB', now() - (i * interval '5 hours') - interval '1 hour' from generate_series(0, 6) i")
        R['pCap12'] = sql("select public.push_cap('user_01BBB')")
        sql("insert into public.sessions (id, player_id, started_at) select gen_random_uuid(), 'user_01BBB', now() - (i * interval '3 hours') - interval '30 minutes' from generate_series(0, 14) i")
        R['pCap24'] = sql("select public.push_cap('user_01BBB')")
        # the last five unanswered (no session within half an hour of each): two a day
        sql("delete from public.sessions where player_id = 'user_01BBB'")
        sql("insert into public.push_queue (player_id, send_at, tag, title, body, kind, sent_at) select 'user_01BBB', now() - (i * interval '2 hours'), 'u' || i, 't', 'b', 'plan', now() - (i * interval '2 hours') from generate_series(1, 5) i")
        R['pCap2'] = sql("select public.push_cap('user_01BBB')")
        sql("delete from public.push_queue where tag like 'u_'")
        # no quiet night: what is due at 23:30 goes
        sql("select public.push_plan('%s')" % json.dumps([item(-10, 'night')]), B, 'authenticated')
        R['pNight'] = sql("set dsb.clock = '2026-10-06 23:30:00+02'; " + DUE + "select count(*) from public.push_claim(10)", None, 'service_role')
        sql("select public.push_plan('%s')" % json.dumps([item(-30, 'old', -5)]), B, 'authenticated')
        R['pStale'] = sql(DUE + "select count(*) from public.push_claim(10)", None, 'service_role') + '/' + sql("select count(*) from public.push_queue where tag = 'old' and dropped")
        # the leaderboard's «passed you» is gone, and the week's message goes once a week to everyone who has it on: the best fisher in each group
        sql("""select public.land_put(2000, 2027, 'botnhamn', 'open', '[{"sp":"torsk","kg":300,"kgq":300}]', 'Fjordbris')""", B, 'authenticated')
        sql("""select public.land_put(2001, 2027, 'finnsnes', 'open', '[{"sp":"torsk","kg":500,"kgq":500}]', 'Havbris')""", A, 'authenticated')
        R['pPass'] = sql("select count(*) from public.push_queue where tag = 'top-pass'")
        sql("select public.push_prefs(false)", B, 'authenticated')
        R['pWeekOff'] = sql("select public.push_week(true)", None, 'service_role')
        R['pWeekOffQ'] = sql("select count(*) from public.push_queue where tag = 'top-week' and player_id = 'user_01BBB'")
        sql("delete from public.push_queue where tag = 'top-week'"); sql("select public.push_prefs(true)", B, 'authenticated')
        R['pWeek'] = sql("select public.push_week(true)", None, 'service_role') + '/' + sql("select string_agg(body, ' | ' order by body) from public.push_queue where tag = 'top-week'")
        sql("delete from public.push_queue where tag = 'top-week'")
        # the day gate: Monday 08:00 once, not on Tuesday, not twice in a week
        R['pWeekTue'] = sql("set dsb.clock = '2026-10-06 09:00:00+02'; select public.push_week()", None, 'service_role')
        R['pWeekMon'] = sql("set dsb.clock = '2026-10-12 09:00:00+02'; select public.push_week()", None, 'service_role') + '/' + sql("set dsb.clock = '2026-10-12 10:00:00+02'; select public.push_week()", None, 'service_role')
        R['pWeekPl'] = sql("select public.push_week(true)", A, 'authenticated', expect_err=True)
        R['pPaper'] = sql("select public.push_paper()", None, 'service_role')   # Kystposten sends no push (20261008000000_push_ops.sql)
        R['wBadT'] = sql("select public.land_put('NaN', 2027, 'x', 'open', '[]')", A, 'authenticated', expect_err=True)
        R['wBadC'] = sql("select public.catch_put(1, (select jsonb_agg(jsonb_build_array(i, 1)) from generate_series(1, 601) i))", A, 'authenticated', expect_err=True)
        R['wRead'] = sql("select count(*) from public.landings", A, 'authenticated', expect_err=True)
        R['wAnon'] = sql("select public.world_get(0, 2027, 1)", {}, 'anon', expect_err=True)
        R['wAdmPl'] = sql("select public.admin_world()", A, 'authenticated', expect_err=True)
        # the shop (20261006040000_shop.sql): a quote only for a signed-in player and a real product; a paid purchase books one grant
        # however often Stripe tells it; the game takes it and says done; a refund takes back what is not given yet; no player books a payment
        R['sQuote'] = json.loads(sql("select public.shop_quote('trim_turbo')", A, 'authenticated'))
        R['sNoProd'] = sql("select public.shop_quote('gratis')", A, 'authenticated', expect_err=True)
        R['sAnon'] = sql("select public.shop_quote('haill')", {}, 'anon', expect_err=True)
        sql("insert into public.purchases (id, player_id, product_id, amount_nok, status, data) values ('cs_s1', 'user_01AAA', 'trim_turbo', 49, 'open', '{\"boat\":\"v1\"}'), ('cs_s2', 'user_01AAA', 'haill', 29, 'open', '{}')")
        R['sPaid1'] = sql("select public.shop_paid('cs_s1', 'pi_1')"); R['sPaid2'] = sql("select public.shop_paid('cs_s1', 'pi_1')")
        R['sPend'] = json.loads(sql("select public.shop_pending()", A, 'authenticated')); R['sPendB'] = json.loads(sql("select public.shop_pending()", B, 'authenticated'))
        R['sPlPaid'] = sql("select public.shop_paid('cs_s2', 'pi_2')", A, 'authenticated', expect_err=True)
        R['sPlRead'] = sql("select count(*) from public.grants", A, 'authenticated', expect_err=True)
        if R['sPend']: sql("select public.shop_done(array[%d]::bigint[])" % R['sPend'][0]['id'], A, 'authenticated')
        sql("select public.shop_paid('cs_s2', 'pi_2')"); sql("select public.shop_refund('pi_2')"); sql("select public.shop_ended('cs_s9', 'expired')")
        R['sAfter'] = sql("select (select count(*) from public.grants where player_id = 'user_01AAA' and done_at is null and revoked_at is null) || '/' || (select status from public.purchases where id = 'cs_s2') || '/' || (select count(*) from public.grants where revoked_at is not null and product_id <> 'fb_haill') || '/' || (select count(*) from public.grants where done_at is not null and product_id <> 'fb_haill')")
        R['sEnd'] = json.loads(sql("select public.shop_pending()", A, 'authenticated'))
        # a paint design (20261007100000_designs.sql): the account owns it after paying (tm_hello's owned), and a refund takes it away
        sql("insert into public.purchases (id, player_id, product_id, amount_nok, status, data) values ('cs_d1', 'user_01AAA', 'des_ripe', 29, 'open', '{}')")
        sql("select public.shop_paid('cs_d1', 'pi_d1')"); R['dOwn'] = json.loads(sql("select public.tm_hello('{}')", A, 'authenticated')).get('owned')
        R['dGive'] = [g['data'].get('give') for g in json.loads(sql("select public.shop_pending()", A, 'authenticated')) if g['product'] == 'des_ripe']
        sql("select public.shop_refund('pi_d1')"); R['dGone'] = json.loads(sql("select public.tm_hello('{}')", A, 'authenticated')).get('owned')
        # one's own registration number: one player's per mark
        R['rgA'] = sql("select public.reg_claim('T-777-LK')", A, 'authenticated'); R['rgB'] = sql("select public.reg_claim('T-777-LK')", B, 'authenticated')
        R['rgA2'] = sql("select public.reg_claim('T-777-LK')", A, 'authenticated'); R['rgBad'] = sql("select public.reg_claim('<b>')", A, 'authenticated', expect_err=True)
        R['rgRead'] = sql("select count(*) from public.reg_claims", A, 'authenticated', expect_err=True)
        # the company logo (20261007110000_logos.sql): only an account that owns it puts up a picture; the others get it by the id the world
        # gives; the admin takes it away with a reason, then nobody gets it, the player is told why and may put up another at no cost
        import hashlib; hidA = hashlib.md5(b'dsbuser_01AAA').hexdigest()[:10]; LIMG = 'data:image/png;base64,iVBORw0KGgo='
        R['lgNo'] = sql("select public.logo_put('%s')" % LIMG, A, 'authenticated', expect_err=True)
        sql("insert into public.purchases (id, player_id, product_id, amount_nok, status, data) values ('cs_l1', 'user_01AAA', 'des_logo', 49, 'open', '{}')"); sql("select public.shop_paid('cs_l1', 'pi_l1')")
        R['lgV'] = [sql("select public.logo_put('%s')" % LIMG, A, 'authenticated'), sql("select public.logo_put('%s')" % LIMG, A, 'authenticated')]
        R['lgBad'] = sql("select public.logo_put('<svg onload=x>')", A, 'authenticated', expect_err=True)
        R['lgGet'] = json.loads(sql("select public.logo_get('%s')" % hidA, B, 'authenticated') or 'null')
        R['lgRead'] = sql("select count(*) from public.logos", B, 'authenticated', expect_err=True)
        R['lgAdmPl'] = sql("select public.admin_logos(10)", A, 'authenticated', expect_err=True)
        R['lgAdm'] = json.loads(sql("select public.admin_logos(10)", AD2, 'authenticated'))
        R['lgRmPl'] = sql("select public.admin_logo_remove('%s', 'x')" % hidA, B, 'authenticated', expect_err=True)
        R['lgRm'] = sql("select public.admin_logo_remove('%s', 'Støtende innhold')" % hidA, AD2, 'authenticated')
        R['lgGone'] = sql("select coalesce(public.logo_get('%s')::text, 'null')" % hidA, B, 'authenticated')
        R['lgMine'] = json.loads(sql("select public.logo_mine()", A, 'authenticated'))
        R['lgAgain'] = sql("select public.logo_put('%s')" % LIMG, A, 'authenticated'); R['lgMine2'] = json.loads(sql("select public.logo_mine()", A, 'authenticated'))
        sql("select public.delete_me()", A, 'authenticated')
        R['wGone'] = sql("select (select count(*) from public.landings where player_id = 'user_01AAA') || '/' || (select count(*) from public.catches where player_id = 'user_01AAA') || '/' || (select count(*) from public.landings)")
        R['fbGone'] = sql("select count(*) from public.feedback where player_id = 'user_01AAA'")
        R['pushGone'] = sql("select count(*) || '/' || (select count(*) from public.push_queue where player_id = 'user_01AAA') from public.push_subs where player_id = 'user_01AAA'")
        R['deleted'] = sql("select (select count(*) from public.players where id = 'user_01AAA') || '/' || (select count(*) from public.events) || '/' || (select count(*) from public.saves where player_id = 'user_01AAA') || '/' || (select string_agg(distinct coalesce(player_id, 'anon'), ',') from public.purchases)")
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
        dt = R['devTech']; de = dt['err'][0] if dt['err'] else {}; df = dt['fps'][0] if dt['fps'] else {}
        print(ok(R['devPerf'] == 'Adreno (TM) 642L|8|6|412x915@2.6|1|3d ; Adreno (TM) 642L|-|6|412x915@2.6|1|3d' and de.get('n') == 1 and de.get('gpus') == ['Adreno (TM) 642L'] and de.get('platforms') == {'android': 1}
                 and df.get('n') == 2 and df.get('fps') == 48.3 and 'user_' not in json.dumps(dt) and R['devPl'][0] and R['devAdm1'][0] and R['devAdm'] == dt['keys']),
              'the device: the frame rate and the errors keep the graphics chip, cores, memory, screen and 3D level (a bad number left out); the agent and the admin with aal2 see them put together, never who, and no player does', {'perf': R['devPerf'], 'err': de.get('gpus'), 'fps': df})
        ar = R['agRow']; aa = (R['agAdmRow'][0] if R['agAdmRow'] else {}).get('ai') or {}
        print(ok(R['agRows'] >= 3 and ar and not R['agWho'] and len(ar.get('who', '')) == 6 and '@' not in ar.get('body', '') and '912' not in ar.get('body', '') and '[e-post]' in ar.get('body', '')
                 and ar.get('meta') == {'version': 't2', 'boat': 'skiff'} and R['agPl'][0] and R['agAdm'][0] and len(R['agImgs']) == 3),
              'feedback agent: only service_role reads the new ones, without the player id, with e-mail and phone masked and only the known meta; not a player, not the admin login', {'body': ar.get('body'), 'meta': ar.get('meta'), 'who': ar.get('who')})
        print(ok(not R['agAfter'] and R['agNoted'] and R['agNoted'][0].get('note', '').startswith('Knappen') and R['agNoteBad'][0] and R['agNotePl'][0] and R['agRun'].isdigit() and R['agRunPl'][0]
                 and R['agRuns'] and R['agRuns'][0]['prs'][0]['url'].endswith('/pull/1') and R['agRunsPl'][0] and aa.get('reply') == 'Takk! Vi ser på det.' and aa.get('status') == 'seen'),
              'feedback agent: a note takes the feedback out of the new ones and into what it noted; its report and suggested reply reach the admin, and no player writes or reads them', {'ai': aa, 'runs': len(R['agRuns'])})
        rp = R['rwPend']
        print(ok(R['rwSeen'] == '0' and R['rwOnce'] == '1' and R['rwFirst'] == '1' and len(rp) == 2 and all(g['data'].get('type') == 'takk' and g['data'].get('reward') for g in rp)
                 and R['rwMine'].get(fA) is True and R['rwMine'].get(fid) is True and R['rwBuy'][0] and R['rwAdm'] == [True] and R['rwPl'][0]),
              'the thank-you: «Kommer» or «Fikset» gives the player one takk-haill grant per feedback («Lest» none, both statuses one), the player and the admin see it was given, it cannot be bought, and no player sets it',
              {'seen': R['rwSeen'], 'once': R['rwOnce'], 'pend': len(rp), 'mine': R['rwMine'], 'buy': R['rwBuy'][1][:40]})
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
        print(ok(len(R['allNear']) == 1 and R['allNear'][0]['boat'] == 'Havbris' and R['allNear'][0]['liv'] == 'h:gul' and len(R['allFar']) == 1 and R['allFar'][0]['boat'] == 'Havbris' and R['allFar'][0]['liv'] == ''
                 and R['allStale'] == [] and R['allAnon'][0] and 'user_' not in json.dumps(R['allFar'])),
              'pos_world: every active player whatever the distance (pos_near gave none from 100 km away), the paint only on the near ones, no one gone quiet, no anonymous', {'near': R['allNear'], 'far': R['allFar'], 'stale': R['allStale']})
        print(ok(R['posRead'][0] and R['posBad'][0] and R['posAnon'][0] and R['posOff'][0]),
              'the shared world: no one reads the table, a bad position and the anonymous are refused, and there is no hiding the boat', [R[k][1][:40] for k in ('posRead', 'posBad', 'posAnon', 'posOff')])
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
                 and 'user_' not in json.dumps(R['topB']) and all(r['company'] == '' for r in tb)
                 and R['topL']['grp'] == 'lukket' and len(R['topL']['rows']) == 1 and R['topL']['rows'][0]['boat'] == 'Fjordbris' and R['topL']['rows'][0]['company'] == 'Fjordbris bFiskeri/b AS' and R['topL']['rows'][0]['kg'] == 9999 and R['topL']['mine'] is None
                 and R['topEvil'] and R['topEvil'][0]['boat'] == 'iOnd/i' and R['posEvil'] == ['img src=xOnd']),
              "the leaderboards: the players of the whole coast by what they landed in the open or the closed group that game week (the closed group with the company's name); in the open in the open group that game week, under the boat's latest name and the plant they delivered most to (a closed-group landing does not count, a landing at most 10 t), with one's own rank, never an account; a boat's name loses anything that could make markup (also on the AIS)",
              R['topB'])
        lv = (R['posLiv'] or [''])[0] or ''
        print(ok(lv.startswith('h:koboltscript') and len(lv) == 160 and '<' not in lv and R['posLiv0'] == ['']),
              "a boat's paint goes along with her position, kept to letters, digits and separators and 160 characters, and empty when the game sends none", {'liv': lv[:30], 'n': len(lv), 'none': R['posLiv0']})
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
        pm = R['pMerge'][0] if R['pMerge'] else {}
        print(ok(R['pushFloor'] == 'true'), 'push: nothing is sent sooner than five minutes after the plan was laid', R['pushFloor'])
        print(ok(len(R['pMerge']) == 1 and pm.get('title') == 'Det Store Blå' and 'a1 skjedde' in pm.get('body', '') and 'a2 skjedde' in pm.get('body', '') and pm.get('body', '').index('a2') < pm.get('body', '').index('a1')
                 and R['pCap'] == '1/1/1/1/1/0/0/0' and R['pCap12'] == '12' and R['pCap24'] == '24' and R['pCap2'] == '2' and R['pNight'] == '1' and R['pStale'] == '0/1'),
              'push: what is due at once goes as one message, the most important first; six a day for a new player (but five unanswered ones in a row cut it to two until she opens the app), 12 and 24 with more sessions; no quiet night; what has stopped mattering is dropped',
              {'merge': pm, 'cap': R['pCap'], '12': R['pCap12'], '24': R['pCap24'], '2': R['pCap2'], 'night': R['pNight'], 'stale': R['pStale']})
        print(ok(R['pPass'] == '0' and R['pWeekOff'] == '1' and R['pWeekOffQ'] == '0' and R['pWeek'].startswith('2/') and 'Ukas beste fisker i åpen gruppe er «Havbris» med ' in R['pWeek'] and ' I lukket gruppe: «' in R['pWeek']
                 and R['pWeekTue'] == '0' and R['pWeekMon'] == '2/0' and R['pWeekPl'][0] and R['pPaper'] == '0'),
              "push from the server: no leaderboard message; once a week (Monday from 08:00) the best fisher of the last seven days to each who has it on (not with it turned off); players cannot call it", {'pass': R['pPass'], 'off': [R['pWeekOff'], R['pWeekOffQ']], 'week': R['pWeek'], 'tue': R['pWeekTue'], 'mon': R['pWeekMon']})
        q, pd = R['sQuote'], R['sPend']
        print(ok(q.get('price_nok') == 49 and q.get('data', {}).get('k') == 'turbo' and R['sNoProd'][0] and R['sAnon'][0] and R['sPaid1'] == 't' and R['sPaid2'] == 'f'
                 and len(pd) == 1 and pd[0]['product'] == 'trim_turbo' and pd[0]['data'].get('give') == 'trim' and pd[0]['data'].get('boat') == 'v1' and R['sPendB'] == []
                 and R['sPlPaid'][0] and R['sPlRead'][0] and R['sAfter'] == '0/refunded/1/1' and R['sEnd'] == []),
              'the shop: a quote only for a real product and a signed-in player, one grant per paid purchase however often Stripe tells it, given and done once, a refund takes back what is not given, and no player books a payment or reads the grants',
              {'quote': q, 'paid': (R['sPaid1'], R['sPaid2']), 'pending': pd, 'after': R['sAfter'], 'end': R['sEnd']})
        print(ok(R['lgNo'][0] and R['lgV'] == ['1', '2'] and R['lgBad'][0] and R['lgGet'] and R['lgGet'].get('img', '').startswith('data:image/png') and R['lgRead'][0] and R['lgAdmPl'][0] and R['lgRmPl'][0]
                 and len(R['lgAdm']) == 1 and R['lgAdm'][0]['who'] == hidA and R['lgRm'] == 't' and R['lgGone'] == 'null' and R['lgMine'].get('removed') is True and R['lgMine'].get('reason') == 'Støtende innhold'
                 and R['lgAgain'] == '3' and R['lgMine2'].get('removed') is False),
              "the logo: put up only once owned, a bad picture refused, the others get it by the world's id; only the admin lists and takes it away, then nobody gets it, the player is told why and may put up another",
              {k: R[k] for k in ('lgV', 'lgRm', 'lgGone', 'lgMine', 'lgAgain', 'lgMine2')})
        print(ok(R['rgA'] == 't' and R['rgB'] == 'f' and R['rgA2'] == 't' and R['rgBad'][0] and R['rgRead'][0]), "one's own registration number: the first player's, refused to another, kept for the first; a bad mark and reading the claims are refused", {k: R[k] for k in ('rgA', 'rgB', 'rgA2')})
        print(ok(R['dOwn'] == ['des_ripe'] and R['dGive'] == ['cos'] and R['dGone'] == []), 'a paint design: paid, it is the account\'s on every device (owned) and a grant for the game; a refund takes it away', {'own': R['dOwn'], 'give': R['dGive'], 'gone': R['dGone']})
        print(ok(R['deleted'] == '0/0/0/anon'), 'deleting the account takes the player, the events and the save; the purchase stays without a name for the books', R['deleted'])
        # guests (20261006180000_guest.sql): an anonymous sign-in plays and saves like a player, cannot buy, and registering moves it all
        G = {'sub': '9a1c2a3e-0000-4000-8000-0000000000aa', 'role': 'authenticated', 'is_anonymous': True}; C = {'sub': 'user_01GGG', 'role': 'authenticated'}
        sql("select public.tm_hello('{}')", G, 'authenticated'); sql("select public.tm_consent(true, 1990)", G, 'authenticated')
        sql("select public.save_put2('KYST2:guest', '2026-10-06T10:00:00Z', 100, null, false, '{\"day\":3}')", G, 'authenticated')
        gNoShop = sql("select public.shop_quote('trim_turbo')", G, 'authenticated', expect_err=True)
        gNotGuest = sql("select public.guest_claim()", A, 'authenticated', expect_err=True)
        code = sql("select public.guest_claim()", G, 'authenticated')
        gSelf = sql("select public.guest_merge('%s')" % code, G, 'authenticated', expect_err=True)
        gMerge = json.loads(sql("select public.guest_merge('%s')" % code, C, 'authenticated'))
        gAfter = sql("select (select count(*) from public.players where id = '%s') || '/' || (select data from public.saves where player_id = 'user_01GGG') || '/' || (select consent from public.players where id = 'user_01GGG')" % G['sub'])
        gAgain = json.loads(sql("select public.guest_merge('%s')" % code, C, 'authenticated'))
        gRead = sql("select count(*) from public.guest_links", A, 'authenticated', expect_err=True)
        print(ok(gNoShop[0] and 'guest' in gNoShop[1] and gNotGuest[0] and len(code) >= 32 and gSelf[0] and gMerge == {'merged': True, 'save': True} and gAfter == '0/KYST2:guest/true'
                 and gAgain.get('merged') is False and gRead[0]),
              'guests: an anonymous sign-in plays and saves, cannot buy; registering with its one-time code moves the save and the consent to the account and the guest is gone; the code works once and no player reads the codes',
              {'shop': gNoShop, 'merge': gMerge, 'after': gAfter, 'again': gAgain})
        # the player's name (20261007120000_names.sql): an account takes one, unique whatever the case; a guest cannot; the admin takes an
        # offensive one away with a reason, it is barred for good, and a new one is free
        G2 = {'sub': '9a1c2a3e-0000-4000-8000-0000000000bb', 'role': 'authenticated', 'is_anonymous': True}; sql("select public.tm_hello('{}')", G2, 'authenticated')
        hidB = hashlib.md5(b'dsbuser_01BBB').hexdigest()[:10]
        N = {}
        N['free0'] = sql("select public.name_free('Kystjenta')", G2, 'authenticated')
        N['guest'] = sql("select public.name_claim('Kystjenta')", G2, 'authenticated', expect_err=True)
        N['bad'] = sql("select public.name_claim('a b')", B, 'authenticated')
        N['ok'] = sql("select public.name_claim('Kystjenta')", B, 'authenticated')
        N['again'] = sql("select public.name_claim('Kystjenta')", B, 'authenticated')
        N['taken'] = sql("select public.name_claim('KYSTJENTA')", C, 'authenticated')
        N['free1'] = sql("select public.name_free('kystjenta')", C, 'authenticated') + sql("select public.name_free('kystjenta')", B, 'authenticated')
        N['read'] = sql("select count(*) from public.names", B, 'authenticated', expect_err=True)
        N['admPl'] = sql("select public.admin_names(10)", B, 'authenticated', expect_err=True)
        N['adm1'] = sql("select public.admin_names(10)", AD1, 'authenticated', expect_err=True)
        N['list'] = json.loads(sql("select public.admin_names(10)", AD2, 'authenticated'))
        N['rmPl'] = sql("select public.admin_name_remove('%s', 'x')" % hidB, C, 'authenticated', expect_err=True)
        N['rm'] = sql("select public.admin_name_remove('%s', 'Upassende navn')" % hidB, AD2, 'authenticated')
        N['mine'] = json.loads(sql("select public.name_mine()", B, 'authenticated'))
        N['barred'] = sql("select public.name_claim('kystJENTA')", C, 'authenticated') + '/' + sql("select public.name_claim('Kystjenta')", B, 'authenticated')
        N['new'] = sql("select public.name_claim('Havfisker88')", B, 'authenticated'); N['mine2'] = json.loads(sql("select public.name_mine()", B, 'authenticated'))
        print(ok(N['free0'] == 't' and N['guest'][0] and N['bad'] == 'bad' and N['ok'] == 'ok' and N['again'] == 'ok' and N['taken'] == 'taken' and N['free1'] == 'ft'
                 and N['read'][0] and N['admPl'][0] and N['adm1'][0] and len(N['list']) == 1 and N['list'][0]['who'] == hidB and N['list'][0]['name'] == 'Kystjenta'
                 and N['rmPl'][0] and N['rm'] == 't' and N['mine'] == {'name': 'Kystjenta', 'removed': True, 'reason': 'Upassende navn'} and N['barred'] == 'taken/taken'
                 and N['new'] == 'ok' and N['mine2'] == {'name': 'Havfisker88', 'removed': False, 'reason': None}),
              "the player's name: an account takes one, a guest cannot, a bad one is refused, the same name in another case is taken; no player reads the names; only the admin (with MFA) lists and takes one away with a reason the player reads, the name is barred for good, and a new one is free",
              N)
        # seen by the others (20261007130000_seen.sql): every account's boat with the owner's name and sea time; a guest's boat and landings
        # only for the guest; the sea time held to what the real time allows
        V = {}
        sql("select public.pos_put(900, 300, 0, 3, 'sailing', 'Gjestebåt', 'trebat', '', 100)", G2, 'authenticated')
        sql("select public.pos_put(900.5, 300, 0, 3, 'sailing', 'Fjordbris', 'skiff', '', 40000)", B, 'authenticated')
        V['first'] = sql("select fs from public.players where id = 'user_01BBB'")
        sql("select public.pos_put(900.5, 300, 0, 3, 'sailing', 'Fjordbris', 'skiff', '', 900000)", B, 'authenticated')
        V['jump'] = sql("select round(fs) from public.players where id = 'user_01BBB'")
        sql("update public.players set fs_at = now() - interval '2 hours' where id = 'user_01BBB'")
        sql("select public.pos_put(900.5, 300, 0, 3, 'sailing', 'Fjordbris', 'skiff', '', 900000)", B, 'authenticated')
        V['later'] = sql("select round(fs / 100) * 100 from public.players where id = 'user_01BBB'")
        sql("select public.pos_put(900.5, 300, 0, 3, 'sailing', 'Fjordbris', 'skiff', '', 10)", B, 'authenticated')
        V['down'] = sql("select round(fs / 100) * 100 from public.players where id = 'user_01BBB'")
        sql("select public.pos_put(901, 300, 0, 0, 'port', 'Havørn', 'sjark')", C, 'authenticated')
        V['nearC'] = json.loads(sql("select public.pos_near(900, 300, 20)", C, 'authenticated'))
        V['nearG'] = json.loads(sql("select public.pos_near(900, 300, 20)", G2, 'authenticated'))
        V['flag'] = sql("select string_agg(id || '=' || guest, ',' order by id) from public.players where id in ('user_01BBB', '%s')" % G2['sub'])
        sql("""select public.land_put(1200, 2027, 'finnsnes', 'open', '[{"sp":"torsk","kg":800,"kgq":800}]', 'Gjestebåt')""", G2, 'authenticated')
        sql("""select public.land_put(1201, 2027, 'finnsnes', 'open', '[{"sp":"torsk","kg":300,"kgq":300}]', 'Fjordbris')""", B, 'authenticated')
        V['topG'] = json.loads(sql("select public.world_top(7)", G2, 'authenticated'))
        V['topB'] = json.loads(sql("select public.world_top(7)", B, 'authenticated'))
        nb = [q for q in V['nearC'] if q['boat'] == 'Fjordbris']
        print(ok(V['first'] == '40000' and V['jump'] == '40000' and V['later'] == '50000' and V['down'] == '50000'
                 and len(V['nearC']) == 1 and nb and nb[0]['user'] == 'Havfisker88' and nb[0]['fs'] == 50000
                 and sorted(q['boat'] for q in V['nearG']) == ['Fjordbris', 'Havørn'] and V['flag'] == '%s=true,user_01BBB=false' % G2['sub']
                 and [r['boat'] for r in V['topG']['rows']] == ['Gjestebåt', 'Fjordbris'] and V['topG']['rows'][0]['me'] and V['topG']['rows'][1]['user'] == 'Havfisker88'
                 and [r['boat'] for r in V['topB']['rows']] == ['Fjordbris'] and V['topB']['n'] == 1),
              "seen by the others: an account's boat comes with the owner's name and sea time, a guest's only to the guest (on the AIS and the leaderboard); the sea time starts as reported, grows at most 5 000 an hour and never falls",
              V)
        # the badges' funnel (20261007140000_ach.sql): the milestones reached and the chapters finished, by player, for the admin only
        for who, ev in ((B, '{"id":"took","ch":0}'), (B, '{"id":"fish","ch":0}'), (C, '{"id":"took","ch":0}')):
            sql("insert into public.events (player_id, kind, data) values ('%s', 'ach', '%s')" % (who['sub'], ev))
        sql("insert into public.events (player_id, kind, data) values ('%s', 'ach', '{\"id\":\"took\",\"ch\":0}')" % B['sub'])
        sql("insert into public.events (player_id, kind, data) values ('%s', 'ach_ch', '{\"ch\":0}')" % B['sub'])
        AC = {'pl': sql("select public.admin_ach()", B, 'authenticated', expect_err=True), 'mfa': sql("select public.admin_ach()", AD1, 'authenticated', expect_err=True),
              'r': json.loads(sql("select public.admin_ach()", AD2, 'authenticated'))}
        print(ok(AC['pl'][0] and AC['mfa'][0] and AC['r']['ms'].get('took') == 2 and AC['r']['ms'].get('fish') == 1 and AC['r']['ch'].get('0') == 1 and isinstance(AC['r']['players'], int)),
              "the badges' funnel: each milestone counted once per player, the chapters finished; only the admin with MFA reads it", AC['r'])
        # the funnel (20261007150000_funnel.sql): from the first session to the third landing and the account, and coming back after
        # 1, 7 and 30 days of those who have had that long; counted as the change three new players make
        F0 = json.loads(sql("select public.admin_funnel(8)", AD2, 'authenticated'))['all']
        sql("""insert into public.players (id, guest) values ('user_01FN1', false), ('33333333-3333-4333-8333-333333333333', true), ('user_01FN3', false);
          insert into public.sessions (id, player_id, started_at) values ('44444444-4444-4444-8444-444444444441', 'user_01FN1', now() - interval '10 days'),
            ('44444444-4444-4444-8444-444444444442', 'user_01FN1', now() - interval '2 days'), ('44444444-4444-4444-8444-444444444443', '33333333-3333-4333-8333-333333333333', now() - interval '2 hours'),
            ('44444444-4444-4444-8444-444444444444', 'user_01FN3', now() - interval '3 days'), ('44444444-4444-4444-8444-444444444445', 'user_01FN3', now() - interval '36 hours');
          insert into public.events (player_id, kind, data) values ('user_01FN1', 'ach', '{"id":"fish"}'), ('user_01FN1', 'sale', '{}'), ('user_01FN1', 'sale', '{}'), ('user_01FN1', 'sale', '{}'),
            ('user_01FN3', 'sale', '{}'), ('33333333-3333-4333-8333-333333333333', 'ach', '{"id":"took"}')""")
        F1 = json.loads(sql("select public.admin_funnel(8)", AD2, 'authenticated'))
        FD = {k: F1['all'][k] - F0.get(k, 0) for k in F1['all']}
        FX = {'pl': sql("select public.admin_funnel(8)", B, 'authenticated', expect_err=True), 'mfa': sql("select public.admin_funnel(8)", AD1, 'authenticated', expect_err=True)}
        print(ok(FD == {'start': 3, 'catch': 2, 'land1': 2, 'land3': 1, 'reg': 2, 'd1': 2, 'd1n': 2, 'd7': 1, 'd7n': 1, 'd30': 0, 'd30n': 0} and FX['pl'][0] and FX['mfa'][0]
                 and F1['weeks'] and sum(w['start'] for w in F1['weeks']) >= 3),
              "the funnel: started, first catch, first and third landing, an account, and back after 1, 7 and 30 days of those who have had that long; by the week they started; only the admin with MFA reads it", FD)
        # the first trip's steps (20261010100000_tut_steps.sql): players per step, the median seconds (settled steps not counted), the
        # trips finished and their median; only the admin with MFA reads it
        sql("""insert into public.events (player_id, kind, data) values ('user_01FN1', 'tut_step', '{"id":"gps","s":12}'), ('user_01FN1', 'tut_step', '{"id":"route1","s":40}'),
            ('user_01FN3', 'tut_step', '{"id":"gps","s":30}'), ('user_01FN3', 'tut_step', '{"id":"route1","s":0,"settled":true}'), ('user_01FN1', 'tut_done', '{"s":1500}')""")
        TUr = json.loads(sql("select public.admin_tut(8)", AD2, 'authenticated'))
        TUx = {'pl': sql("select public.admin_tut(8)", B, 'authenticated', expect_err=True), 'mfa': sql("select public.admin_tut(8)", AD1, 'authenticated', expect_err=True)}
        print(ok(TUr['started'] == 2 and TUr['steps']['gps']['n'] == 2 and TUr['steps']['gps']['med'] == 21 and TUr['steps']['route1']['n'] == 2 and TUr['steps']['route1']['med'] == 40
                 and TUr['steps']['route1']['settled'] == 1 and TUr['done'] == 1 and TUr['doneMed'] == 1500 and TUx['pl'][0] and TUx['mfa'][0]),
              "the first trip's steps: players and median seconds per step, settled steps without time, the trips finished; only the admin with MFA reads it", TUr)
        # Håndboka's drips (20261010120000_hb.sql): per tip, the players who read it and who put the chapter to rest from it; only the
        # admin with MFA reads it
        sql("""insert into public.events (player_id, kind, data) values ('user_01FN1', 'hb', '{"id":"guide","how":"seen"}'), ('user_01FN1', 'hb', '{"id":"guide","how":"seen"}'),
            ('user_01FN3', 'hb', '{"id":"guide","how":"seen"}'), ('user_01FN3', 'hb', '{"id":"ekko","how":"skip"}')""")
        HBr = json.loads(sql("select public.admin_hb(8)", AD2, 'authenticated'))
        HBx = {'pl': sql("select public.admin_hb(8)", B, 'authenticated', expect_err=True), 'mfa': sql("select public.admin_hb(8)", AD1, 'authenticated', expect_err=True)}
        print(ok(HBr['players'] == 2 and HBr['tips']['guide']['seen'] == 2 and HBr['tips']['guide']['skip'] == 0 and HBr['tips']['ekko']['skip'] == 1 and HBr['tips']['ekko']['seen'] == 0 and HBx['pl'][0] and HBx['mfa'][0]),
              "Håndboka's drips: players who read and who skipped from each tip; only the admin with MFA reads it", HBr)
        # friends (20261009180000_friends.sql): a code, a request by code and by the hashed id, accepted both ways, the friend's boat
        # wherever it is and also when it went quiet long ago, no guest, no stranger reads, and either can end it
        sql("insert into public.players (id, guest) values ('user_01FRA', false), ('user_01FRB', false), ('user_01FRC', false) on conflict do nothing")
        A = {'sub': 'user_01FRA', 'role': 'authenticated'}; B = {'sub': 'user_01FRB', 'role': 'authenticated'}; C = {'sub': 'user_01FRC', 'role': 'authenticated'}; GU = {'sub': '33333333-3333-4333-8333-333333333333', 'role': 'authenticated'}
        hid = lambda p: sql("select left(md5('dsb' || '%s'), 10)" % p)
        FR = {}
        FR['codeA'] = sql("select public.friend_code()", A, 'authenticated'); FR['codeA2'] = sql("select public.friend_code()", A, 'authenticated')
        FR['guest'] = sql("select coalesce(public.friend_code(), 'null')", GU, 'authenticated') + '/' + sql("select public.friend_ask('%s')" % FR['codeA'], GU, 'authenticated')
        FR['self'] = sql("select public.friend_ask('%s')" % FR['codeA'], A, 'authenticated')
        FR['ask'] = sql("select public.friend_ask('%s')" % FR['codeA'].lower(), B, 'authenticated')
        gA = json.loads(sql("select public.friends_get()", A, 'authenticated')); FR['inA'] = [r['id'] for r in gA['in']] == [hid('user_01FRB')]
        FR['outB'] = [r['id'] for r in json.loads(sql("select public.friends_get()", B, 'authenticated'))['out']] == [hid('user_01FRA')]
        FR['yes'] = sql("select public.friend_answer('%s', true)" % hid('user_01FRB'), A, 'authenticated')
        FR['again'] = sql("select public.friend_ask('%s')" % hid('user_01FRA'), B, 'authenticated')
        # C asks A, A asks C back: that makes them friends without an answer
        FR['cross'] = sql("select public.friend_ask('%s')" % hid('user_01FRA'), C, 'authenticated') + '/' + sql("select public.friend_ask('%s')" % hid('user_01FRC'), A, 'authenticated')
        sql("delete from public.presence where player_id = 'user_01FRB'; insert into public.presence (player_id, boat, vtype, x, y, st, at) values ('user_01FRB', 'Havbris', 'trebat', 900, 300, 'port', now() - interval '3 days')")
        gA = json.loads(sql("select public.friends_get()", A, 'authenticated')); fb = [f for f in gA['friends'] if f['id'] == hid('user_01FRB')]
        FR['far'] = bool(fb) and fb[0]['boat'] == 'Havbris' and fb[0]['x'] == 900 and fb[0]['age'] > 200000 and len(gA['friends']) == 2 and gA['code'] == FR['codeA']
        FR['tables'] = sql("select * from public.friends", A, 'authenticated', expect_err=True)[0] and sql("select public.friend_who('%s')" % FR['codeA'], A, 'authenticated', expect_err=True)[0]
        FR['rm'] = sql("select public.friend_remove('%s')" % hid('user_01FRA'), B, 'authenticated')
        FR['after'] = len(json.loads(sql("select public.friends_get()", A, 'authenticated'))['friends'])
        print(ok(len(FR['codeA']) == 6 and FR['codeA'] == FR['codeA2'] and FR['guest'] == 'null/no' and FR['self'] == 'no' and FR['ask'] == 'ok' and FR['inA'] and FR['outB'] and FR['yes'] == 'ok'
                 and FR['again'] == 'already' and FR['cross'] == 'ok/friends' and FR['far'] and FR['tables'] and FR['rm'] == 'ok' and FR['after'] == 1),
              'friends: a lasting code, asked by code or boat, accepted (or asked both ways), the boat seen far away and long after, no guest, no table open, ended by either', FR)
        # shared catch marks (20261009200000_shared_marks.sql): to friends or the fiskarlag, seen by them and not by a stranger, five in four hours
        D = {'sub': 'user_01FRD', 'role': 'authenticated'}
        sql("insert into public.players (id, guest) values ('user_01FRD', false) on conflict do nothing")
        sql("select public.friend_ask('%s')" % hid('user_01FRC'), A, 'authenticated')   # A and C are friends again (C asked before)
        sql("select public.friend_ask('%s')" % hid('user_01FRA'), C, 'authenticated')
        SM = {}
        share = lambda who, sc, x: sql("select public.mark_share('%s', %s, 300, 32, '', null, null, 1.2)" % (sc, x), who, 'authenticated')
        SM['f'] = share(A, 'f', 900); SM['nolag'] = share(A, 'l', 901)
        sql("select public.lag_join('senjahopen')", A, 'authenticated'); sql("select public.lag_join('senjahopen')", D, 'authenticated')
        SM['l'] = share(A, 'l', 902)
        SM['bad'] = sql("select public.mark_share('f', 900, 300, 32, '<b>', null, null, null)", A, 'authenticated')
        SM['guest'] = sql("select public.mark_share('f', 900, 300, 32, '', null, null, null)", GU, 'authenticated')
        gC = json.loads(sql("select public.marks_get()", C, 'authenticated')); gD = json.loads(sql("select public.marks_get()", D, 'authenticated'))
        gB = json.loads(sql("select public.marks_get()", B, 'authenticated')); gA = json.loads(sql("select public.marks_get()", A, 'authenticated'))
        SM['seen'] = [[m['x'] for m in g] for g in (gC, gD, gB, gA)]
        SM['max'] = [share(A, 'f', 903 + i) for i in range(4)]
        sql("update public.shared_marks set at = now() - interval '5 hours' where x = 900")
        SM['old'] = [m['x'] for m in json.loads(sql("select public.marks_get()", C, 'authenticated'))]
        SM['table'] = sql("select * from public.shared_marks", A, 'authenticated', expect_err=True)[0]
        print(ok(SM['f'] == 'ok' and SM['nolag'] == 'nolag' and SM['l'] == 'ok' and SM['bad'] == 'no' and SM['guest'] == 'no' and SM['seen'] == [[900], [902], [], []]
                 and SM['max'] == ['ok', 'ok', 'ok', 'max'] and 900 not in SM['old'] and SM['table']),
              'shared catch marks: a friend sees the one to friends, a club member the one to the club, a stranger and the sharer none; five in four hours; gone after four hours; no table open', SM)
        # the guestbooks (20261009220000_guestbook.sql): sign once a day per place with a preset line, the boat's name with it, the book's
        # last rows and count, my places, no guest, no bad place, no table open
        sql("delete from public.presence where player_id = 'user_01FRA'; insert into public.presence (player_id, boat, vtype, x, y, st) values ('user_01FRA', 'Sjø<b>bris', 'trebat', 900, 300, 'port')")
        GB = {'a1': sql("select public.gb_sign('finnsnes', 2)", A, 'authenticated'), 'a2': sql("select public.gb_sign('finnsnes', 3)", A, 'authenticated'),
              'a3': sql("select public.gb_sign('rb12', -1)", A, 'authenticated'), 'b1': sql("select public.gb_sign('finnsnes', -1)", B, 'authenticated'),
              'bad': sql("select public.gb_sign('fin snes', 1)", A, 'authenticated'), 'badk': sql("select public.gb_sign('husoy', 40)", A, 'authenticated'),
              'guest': sql("select public.gb_sign('finnsnes', 1)", GU, 'authenticated')}
        bk = json.loads(sql("select public.gb_get('finnsnes')", C, 'authenticated'))
        GB['n'] = bk['n']; GB['rows'] = [(r['k'], r['boat'], r['me']) for r in bk['rows']]
        GB['mine'] = sorted(json.loads(sql("select public.gb_mine()", A, 'authenticated')))
        GB['table'] = sql("select * from public.guestbook", A, 'authenticated', expect_err=True)[0]
        print(ok(GB['a1'] == 'ok' and GB['a2'] == 'wait' and GB['a3'] == 'ok' and GB['b1'] == 'ok' and GB['bad'] == 'no' and GB['badk'] == 'no' and GB['guest'] == 'no'
                 and GB['n'] == 2 and GB['rows'] == [(-1, 'Havbris', False), (2, 'Sjøbbris', False)] and GB['mine'] == ['finnsnes', 'rb12'] and GB['table']),
              'guestbooks: once a day per place, a preset line and the boat (markup stripped), the book with its count, my places; no guest, no bad place or line, no table open', GB)
        # tuting and the phrases (20261009240000_hails.sql): the horn within 1 nm, a line within 5 nm, both boats fresh, once a minute per
        # boat; the other gets them with the sender's name, boat and whether they are friends; no guest, no table open
        sql("""delete from public.presence where player_id in ('user_01FRA', 'user_01FRB', 'user_01FRC');
          insert into public.presence (player_id, boat, vtype, x, y, st) values ('user_01FRA', 'Sjøbris', 'trebat', 900, 300, 'sailing'), ('user_01FRB', 'Havbris', 'trebat', 901.2, 300, 'sailing'),
            ('user_01FRC', 'Nordlys', 'trebat', 906, 300, 'fishing')""")
        H = {'horn': sql("select public.hail_send('%s', -1)" % hid('user_01FRB'), A, 'authenticated'), 'again': sql("select public.hail_send('%s', -1)" % hid('user_01FRB'), A, 'authenticated'),
             'hornFar': sql("select public.hail_send('%s', -1)" % hid('user_01FRC'), A, 'authenticated'), 'line5': sql("select public.hail_send('%s', 2)" % hid('user_01FRC'), A, 'authenticated'),
             'badk': sql("select public.hail_send('%s', 9)" % hid('user_01FRB'), C, 'authenticated'), 'self': sql("select public.hail_send('%s', 1)" % hid('user_01FRA'), A, 'authenticated'),
             'guest': sql("select public.hail_send('%s', 1)" % hid('user_01FRB'), GU, 'authenticated')}
        sql("update public.presence set at = now() - interval '5 minutes' where player_id = 'user_01FRB'")
        H['stale'] = sql("select public.hail_send('%s', 3)" % hid('user_01FRB'), C, 'authenticated')
        gB = json.loads(sql("select public.hails_get(0)", B, 'authenticated')); gC = json.loads(sql("select public.hails_get(0)", C, 'authenticated'))
        H['gotB'] = [(g['k'], g['boat'], g['fid'] == hid('user_01FRA'), g['friend']) for g in gB]; H['gotC'] = [(g['k'], g['friend']) for g in gC]
        H['since'] = json.loads(sql("select public.hails_get(%d)" % gB[-1]['id'], B, 'authenticated')) if gB else None
        H['table'] = sql("select * from public.hails", A, 'authenticated', expect_err=True)[0]
        print(ok(H['horn'] == 'ok' and H['again'] == 'wait' and H['hornFar'] == 'far' and H['line5'] == 'ok' and H['badk'] == 'no' and H['self'] == 'no' and H['guest'] == 'no' and H['stale'] == 'far'
                 and H['gotB'] == [(-1, 'Sjøbris', True, False)] and H['gotC'] == [(2, True)] and H['since'] == [] and H['table']),
              'hails: the horn within 1 nm and a line within 5 nm of a fresh boat, once a minute; the other gets the sender, the boat and the friendship; no guest, no table open', H)
        # towing between players (20261009260000_tows.sql): an ask seen near and not far, taken once, hooked only within 200 m, done in a
        # harbour with the game's pay at most once a day for the same player; a guest can do nothing; no table open
        sql("""delete from public.presence where player_id in ('user_01FRA', 'user_01FRB', 'user_01FRC', 'user_01FRD');
          insert into public.presence (player_id, boat, vtype, x, y, st) values ('user_01FRA', 'Sjøbris', 'trebat', 900, 300, 'out'), ('user_01FRB', 'Havbris', 'trebat', 905, 300, 'sailing'),
            ('user_01FRC', 'Nordlys', 'trebat', 990, 300, 'sailing')""")
        T = {}
        tid = int(sql("select public.tow_ask(900, 300)", A, 'authenticated'))
        T['seenB'] = [o['id'] for o in json.loads(sql("select public.tow_open(905, 300, 55)", B, 'authenticated'))] == [tid]
        T['farC'] = json.loads(sql("select public.tow_open(990, 300, 55)", C, 'authenticated')) == []
        T['ownA'] = json.loads(sql("select public.tow_open(900, 300, 55)", A, 'authenticated')) == []
        T['guest'] = sql("select coalesce(public.tow_ask(1, 1)::text, 'null')", GU, 'authenticated') + '/' + sql("select public.tow_take(%d)" % tid, GU, 'authenticated')
        T['take'] = sql("select public.tow_take(%d)" % tid, B, 'authenticated'); T['take2'] = sql("select public.tow_take(%d)" % tid, D, 'authenticated')
        T['hookFar'] = sql("select public.tow_hook(%d)" % tid, B, 'authenticated')
        sql("update public.presence set x = 900.1, at = now() where player_id = 'user_01FRB'")
        T['hook'] = sql("select public.tow_hook(%d)" % tid, B, 'authenticated')
        mA = json.loads(sql("select public.tow_mine()", A, 'authenticated')); T['mineA'] = [mA['role'], mA['st'], mA['other']['boat']]
        T['bad'] = json.loads(sql("select public.tow_done(%d, 'fin snes')" % tid, B, 'authenticated'))['ok']
        T['done'] = json.loads(sql("select public.tow_done(%d, 'finnsnes')" % tid, B, 'authenticated'))
        mA = json.loads(sql("select public.tow_mine()", A, 'authenticated')); T['mineA2'] = [mA['st'], mA['port']]
        # the same pair again the same day: done, but not paid
        t2 = int(sql("select public.tow_ask(900, 300)", A, 'authenticated')); sql("select public.tow_take(%d)" % t2, B, 'authenticated'); sql("select public.tow_hook(%d)" % t2, B, 'authenticated')
        T['done2'] = json.loads(sql("select public.tow_done(%d, 'finnsnes')" % t2, B, 'authenticated'))
        # a helper gives it back: open again
        t3 = int(sql("select public.tow_ask(900, 300)", A, 'authenticated')); sql("select public.tow_take(%d)" % t3, B, 'authenticated'); sql("select public.tow_cancel(%d)" % t3, B, 'authenticated')
        T['back'] = [o['id'] for o in json.loads(sql("select public.tow_open(905, 300, 55)", B, 'authenticated'))] == [t3]
        T['table'] = sql("select * from public.tows", A, 'authenticated', expect_err=True)[0]
        print(ok(T['seenB'] and T['farC'] and T['ownA'] and T['guest'] == 'null/no' and T['take'] == 'ok' and T['take2'] == 'taken' and T['hookFar'] == 'far' and T['hook'] == 'ok'
                 and T['mineA'] == ['needer', 'tow', 'Havbris'] and T['bad'] is False and T['done'] == {'ok': True, 'pay': True} and T['mineA2'] == ['done', 'finnsnes']
                 and T['done2'] == {'ok': True, 'pay': False} and T['back'] and T['table']),
              'towing between players: an ask seen near, taken once, hooked within 200 m, done in a harbour, paid once a day for the same player, handed back; no guest, no table open', T)
    finally:
        run(*as_pg([os.path.join(BIN, 'pg_ctl'), '-D', data, '-m', 'immediate', 'stop']))
        shutil.rmtree(tmp, ignore_errors=True)


main()
