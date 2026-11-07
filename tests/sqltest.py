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
-- Supabase's Vault (supabase_vault: vault.decrypted_secrets), which rt_ticket reads its secret from (20261105160000_rt_ticket.sql)
create schema vault; create table vault.decrypted_secrets (id uuid primary key default gen_random_uuid(), name text unique, decrypted_secret text, created_at timestamptz default now());
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
        # Ø6 funn 1 (20261105120000_fb_meta.sql): meta.pos is kept only as two numbers, so no HTML reaches the admin page that way
        PX = {'sub': 'user_01XSS', 'role': 'authenticated'}; sql("select public.tm_hello('{}')", PX, 'authenticated')
        fbp = lambda m: sql("select public.fb_send('bug', 'Pos', null, null, '%s')" % m, PX, 'authenticated')
        R['fbPos'] = [sql("select coalesce((meta -> 'pos')::text, '-') || '|' || coalesce(meta ->> 'version', '-') from public.feedback where id = %s" % fbp(m))
                      for m in ('{"version":"t3","pos":[69.5,17.6]}', '{"version":"t3","pos":["\\"><img src=x onerror=alert(1)>",0]}', '{"pos":[1e400,5]}', '{"pos":"69,17"}', '{"pos":null}')]
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

        # the save by the server's own revision (20261011120000_sync.sql): a device that has not met the newest revision cannot write over
        # it, the refusal says another device made it, a forced save keeps the one it replaces, save_head is the save without the game
        PE = {'sub': 'user_01EEE', 'role': 'authenticated'}; sql("select public.tm_hello('{}')", PE, 'authenticated')
        put3 = lambda data, base, dev, force='false', who=PE: json.loads(sql("select public.save_put3('%s', '2026-10-11T10:00:00Z', 100, %s, %s, '{\"day\":3}', '%s', '%s')" % (data, base if base is not None else 'null', force, dev, {'devA': 'iPhone', 'devB': 'Android'}.get(dev, 'PC')), who, 'authenticated'))
        R['p3a'] = put3('KYST2:A1', None, 'devA')
        R['p3b0'] = put3('KYST2:B0', None, 'devB')                       # B never met the cloud
        R['p3a2'] = put3('KYST2:A2', R['p3a'].get('rev'), 'devA')
        R['p3bStale'] = put3('KYST2:B1', R['p3a'].get('rev'), 'devB')    # B met only the first
        R['p3Head'] = json.loads(sql("select public.save_head()", PE, 'authenticated'))
        R['p3Force'] = put3('KYST2:B2', 0, 'devB', 'true')
        R['p3Get'] = json.loads(sql("select public.save_get()", PE, 'authenticated'))
        R['p3Hist'] = json.loads(sql("select public.save_hist_list()", PE, 'authenticated'))
        sql("select public.save_put2('KYST2:OLDCODE', '2026-10-11T11:00:00Z', 100, '%s', true, '{\"day\":4}')" % R['p3Get']['saved_at'], PE, 'authenticated')
        R['p3Old'] = json.loads(sql("select public.save_head()", PE, 'authenticated'))
        R['p3Anon'] = sql("select public.save_put3('x', now(), 1, null, false, '{}', 'd', 'n')", {}, 'anon', expect_err=True)
        R['p3Other'] = json.loads(sql("select public.save_head()", B, 'authenticated'))
        # one device at a time (20261013120000_active.sql): the device that starts takes the game, the other's saves are refused (taken),
        # except its last state as the hand-over while nothing has been saved since; a beat tells every device who has the game
        PF = {'sub': 'user_01FFF', 'role': 'authenticated'}; sql("select public.tm_hello('{}')", PF, 'authenticated')
        put4 = lambda data, base, dev, hand='false', force='false': json.loads(sql("select public.save_put4('%s', '2026-10-13T10:00:00Z', 100, %s, %s, '{\"day\":5}', '%s', '%s', %s)" % (data, base if base is not None else 'null', force, dev, {'devA': 'Nettbrett', 'devB': 'iPhone'}.get(dev, 'PC'), hand), PF, 'authenticated'))
        R['acA'] = put4('KYST2:A1', None, 'devA')
        R['acClaim'] = json.loads(sql("select public.save_claim('devB', 'iPhone')", PF, 'authenticated'))
        R['acPutA'] = put4('KYST2:A2', 1, 'devA')
        R['acHand'] = put4('KYST2:A3', 1, 'devA', 'true')
        R['acBeatB'] = json.loads(sql("select public.save_beat('devB')", PF, 'authenticated'))
        R['acBeatA'] = json.loads(sql("select public.save_beat('devA')", PF, 'authenticated'))
        R['acPutB'] = put4('KYST2:B1', 2, 'devB')
        R['acHand2'] = put4('KYST2:A4', 2, 'devA', 'true')
        R['acOld'] = json.loads(sql("select public.save_put3('KYST2:A5', '2026-10-13T10:00:00Z', 100, 3, false, '{}', 'devA', 'Nettbrett')", PF, 'authenticated'))
        R['acGet'] = json.loads(sql("select public.save_get()", PF, 'authenticated'))
        R['acBeatAnon'] = sql("select public.save_beat('x')", {}, 'anon', expect_err=True)
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
        # the looks (20261010140000_look.sql): the near boats carry the skipper's and the crew's looks, the far ones do not; strange characters go;
        # the old call without them still works and clears them
        sql("select public.pos_put(850, 350, 90, 7, 'sailing', 'Havbris', 'trebat', 'h:gul', null, 'f.2.braid.4.none.bucket.3.oilskin.3.8.boot.9<script>', 'm.1.short.2.full.beanie.-.parka.2.0.boot.9;m.3.curl.1.none.none.-.fleece.5.8.shoe.15')", A, 'authenticated')
        R['lkNear'] = json.loads(sql("select public.pos_world(850, 350, 20)", B, 'authenticated'))
        R['lkFar'] = json.loads(sql("select public.pos_world(100, 100, 20)", B, 'authenticated'))
        R['lkNear2'] = json.loads(sql("select public.pos_near(850, 350, 20)", B, 'authenticated'))
        sql("select public.pos_put(850, 350, 90, 7, 'sailing', 'Havbris', 'trebat', 'h:gul')", A, 'authenticated')
        R['lkOld'] = json.loads(sql("select public.pos_world(850, 350, 20)", B, 'authenticated'))
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
        sql("update public.world_agg set at = now() - interval '2 minutes'")   # B4: the year's shared picture is at most a minute old
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
        R['pWeekMe'] = sql("select body from public.push_queue where tag = 'top-week' and player_id = 'user_01BBB'")
        sql("delete from public.push_queue where tag = 'top-week'")
        # the day gate: Monday 08:00 once, not on Tuesday, not twice in a week
        R['pWeekTue'] = sql("set dsb.clock = '2026-10-06 09:00:00+02'; select public.push_week()", None, 'service_role')
        R['pWeekSun18'] = sql("set dsb.clock = '2026-10-11 18:30:00+02'; select public.push_week()", None, 'service_role')
        R['pWeekMon'] = sql("set dsb.clock = '2026-10-11 19:30:00+02'; select public.push_week()", None, 'service_role') + '/' + sql("set dsb.clock = '2026-10-11 20:30:00+02'; select public.push_week()", None, 'service_role')
        R['pWeekTitle'] = sql("select string_agg(distinct title, '|') from public.push_queue where tag = 'top-week'")
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
        # Ø6 funn 5 (20261105140000_liv_owned.sql): the others see a paid design on the boat only when the account owns it; the colours,
        # the registration mark and the pennants are free
        livA = lambda: (sql("select public.pos_put(850, 350, 90, 7, 'sailing', 'Havbris', 'trebat', 'h:gul;r:raud;t:blaa;f:SE.rekt;f:LOGO.vimpel;l:abc;m:T.1.LK;p:2')", A, 'authenticated'), sql("select liv from public.presence where player_id = 'user_01AAA'"))[1]
        R['livOwn'] = livA()
        sql("select public.shop_refund('pi_d1')"); R['dGone'] = json.loads(sql("select public.tm_hello('{}')", A, 'authenticated')).get('owned')
        R['livGone'] = livA(); sql("select public.pos_put(850, 350, 90, 7, 'sailing', 'Havbris', 'trebat', 'h:gul')", A, 'authenticated')
        # one's own registration number: one player's per mark
        R['rgA'] = sql("select public.reg_claim('T-777-LK')", A, 'authenticated'); R['rgB'] = sql("select public.reg_claim('T-777-LK')", B, 'authenticated')
        R['rgA2'] = sql("select public.reg_claim('T-777-LK')", A, 'authenticated'); R['rgBad'] = sql("select public.reg_claim('<b>')", A, 'authenticated', expect_err=True)
        R['rgRead'] = sql("select count(*) from public.reg_claims", A, 'authenticated', expect_err=True)
        # the company logo (20261007110000_logos.sql): only an account that owns it puts up a picture; the others get it by the id the world
        # gives; the admin takes it away with a reason, then nobody gets it, the player is told why and may put up another at no cost
        import hashlib; hidA = hashlib.md5(b'dsbuser_01AAA').hexdigest()[:10]; LIMG = 'data:image/png;base64,iVBORw0KGgo='
        # sponsors (M6): nobody but the admin with aal2 adds one or reads the tables; sp_now gives only what is active, to anyone
        R['spPl'] = sql("select public.sp_admin_put(null, 'Testmerke', 'vare', null, 'https://example.no', 'Avtale 1')", A, 'authenticated', expect_err=True)
        R['spAd1'] = sql("select public.sp_admin_put(null, 'Testmerke', 'vare', null, 'https://example.no', 'Avtale 1')", AD1, 'authenticated', expect_err=True)
        R['spNoAgr'] = sql("select public.sp_admin_put(null, 'Testmerke', 'vare', null, null, '')", AD2, 'authenticated', expect_err=True)
        R['spBadUrl'] = sql("select public.sp_admin_put(null, 'Testmerke', 'vare', null, 'javascript:alert(1)', 'Avtale 1')", AD2, 'authenticated', expect_err=True)
        spid = sql("select public.sp_admin_put(null, 'Testmerke', 'vare', null, 'https://example.no', 'Avtale 1')", AD2, 'authenticated')
        plid = sql("select public.sp_admin_place(%s, 'item', 'garnhaler', '{\"model\": \"GH-200\"}')" % spid, AD2, 'authenticated')
        R['spNow'] = json.loads(sql("select public.sp_now()", {'role': 'anon'}, 'anon'))
        sql("select public.sp_admin_on('p', %s, false)" % plid, AD2, 'authenticated'); R['spOff'] = json.loads(sql("select public.sp_now()", A, 'authenticated'))
        sql("select public.sp_admin_on('p', %s, true)" % plid, AD2, 'authenticated'); sql("select public.sp_admin_on('s', %s, false)" % spid, AD2, 'authenticated'); R['spOffS'] = json.loads(sql("select public.sp_now()", A, 'authenticated'))
        R['spList'] = json.loads(sql("select public.sp_admin_list()", AD2, 'authenticated')); R['spListPl'] = sql("select public.sp_admin_list()", A, 'authenticated', expect_err=True)
        sql("insert into public.events (player_id, kind, data) values ('user_01AAA', 'sp_view', '{\"pl\": %s, \"imp\": 3, \"sec\": 40}'), ('user_01BBB', 'sp_view', '{\"pl\": %s, \"imp\": 1, \"sec\": 9000}'), ('user_01AAA', 'sp_click', '{\"pl\": %s}')" % (plid, plid, plid))
        R['spRep'] = json.loads(sql("select public.admin_sp_report(30)", AD2, 'authenticated')); R['spRepPl'] = sql("select public.admin_sp_report(30)", A, 'authenticated', expect_err=True)
        sql("delete from public.events where kind in ('sp_view', 'sp_click')")   # (the deletion check further down counts every event)
        R['spRead'] = sql("select count(*) from public.sponsors", A, 'authenticated', expect_err=True); R['spReadAnon'] = sql("select count(*) from public.sponsor_placements", {'role': 'anon'}, 'anon', expect_err=True)   # (Ø6 funn 12: no rights on the table at all, not only no rows)
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
        # delete_me2 (20261011160000_delete_me2.sql): the same, and the answer names the account for the Edge Function account-delete
        D2U = {'sub': 'user_01DDD', 'role': 'authenticated'}; sql("select public.tm_hello('{}')", D2U, 'authenticated')
        R['del2'] = sql("select public.delete_me2()", D2U, 'authenticated') + '/' + sql("select count(*) from public.players where id = 'user_01DDD'")
        R['del2Anon'] = sql("select public.delete_me2()", None, 'anon', expect_err=True)
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
        print(ok(R['p3a'].get('ok') and R['p3a']['rev'] == 1 and not R['p3b0'].get('ok') and R['p3b0'].get('moved') is True and R['p3b0']['cloud']['device_name'] == 'iPhone'
                 and R['p3a2'].get('ok') and R['p3a2']['rev'] == 2 and not R['p3bStale'].get('ok') and R['p3bStale']['cloud']['rev'] == 2 and R['p3bStale'].get('moved') is True
                 and R['p3Head']['rev'] == 2 and 'data' not in R['p3Head'] and R['p3Head']['device'] == 'devA'
                 and R['p3Force'].get('ok') and R['p3Force']['rev'] == 3 and R['p3Get']['data'] == 'KYST2:B2' and R['p3Get']['device_name'] == 'Android' and R['p3Get'].get('updated_at')
                 and any(h['summary'].get('day') == 3 for h in R['p3Hist']) and R['p3Old']['rev'] == 4 and R['p3Old']['device'] is None
                 and R['p3Anon'][0] and R['p3Other'] is None), 'the server counts the saves: a device that has not met the newest revision is refused (and told another device made it), a forced one keeps the replaced game, save_head is the save without the game, the older puts bump the revision, and anon cannot write',
              {k: R[k] for k in ('p3a', 'p3b0', 'p3a2', 'p3bStale', 'p3Head', 'p3Force', 'p3Old')})
        print(ok(R['acA'].get('ok') and R['acClaim'].get('prev_dev') == 'devA' and R['acClaim'].get('prev_age') is not None and R['acClaim']['prev_age'] < 60
                 and not R['acPutA'].get('ok') and R['acPutA'].get('taken') is True and R['acPutA']['cloud']['active_name'] == 'iPhone'
                 and R['acHand'].get('ok') and R['acHand']['rev'] == 2 and R['acBeatB']['active_dev'] == 'devB' and R['acBeatB']['rev'] == 2 and R['acBeatB']['device'] == 'devA' and R['acBeatB'].get('active_age') is not None
                 and R['acBeatA']['active_dev'] == 'devB' and R['acPutB'].get('ok') and R['acPutB']['rev'] == 3 and not R['acHand2'].get('ok')
                 and not R['acOld'].get('ok') and R['acOld'].get('taken') is True and R['acGet']['data'] == 'KYST2:B1' and R['acBeatAnon'][0]),
              'one device at a time: the device that starts takes the game, the other one\'s saves are refused (taken), its last state goes up as the hand-over only while nothing has been saved since, a beat tells who has the game, and the old put is refused too',
              {k: R[k] for k in ('acA', 'acClaim', 'acPutA', 'acHand', 'acBeatB', 'acPutB', 'acHand2', 'acOld')})
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
        print(ok(R['fbPos'] == ['[69.5, 17.6]|t3', '-|t3', '-|-', '-|-', '-|-']), 'feedback: meta.pos is kept only as two numbers within latitude and longitude, anything else is dropped (Ø6 funn 1)', R['fbPos'])
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
        print(ok(R['lkNear'][0]['lk'] == 'f.2.braid.4.none.bucket.3.oilskin.3.8.boot.9script' and R['lkNear'][0]['ck'].count(';') == 1 and R['lkFar'][0]['lk'] == '' and R['lkFar'][0]['ck'] == ''
                 and R['lkNear2'][0]['lk'].startswith('f.2.braid') and R['lkOld'][0]['lk'] == '' and R['lkOld'][0]['ck'] == '' and R['lkOld'][0]['liv'] == 'h:gul'),
              'pos_put/pos_world/pos_near: the skipper\'s and the crew\'s looks go along with the position, on the near boats only, strange characters are stripped, and the old call clears them', {'near': R['lkNear'], 'far': R['lkFar'], 'old': R['lkOld']})
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
                 and R['pWeekTue'] == '0' and R['pWeekSun18'] == '0' and R['pWeekMon'] == '2/0' and R['pWeekPl'][0] and R['pPaper'] == '0'
                 and R['pWeekMe'].startswith('Du leverte ') and ' i åpen gruppe. Ukas beste fisker i åpen gruppe er «Havbris»' in R['pWeekMe'] and R['pWeekTitle'] == 'Ukas fangst'),
              "push from the server: no leaderboard message; once a week (Sunday from 19:00) «Ukas fangst»: her own kilos and place in her group over the last seven days, and the best fisher, to each who has it on (not with it turned off); players cannot call it", {'pass': R['pPass'], 'off': [R['pWeekOff'], R['pWeekOffQ']], 'week': R['pWeek'], 'me': R['pWeekMe'], 'tue': R['pWeekTue'], 'sun18': R['pWeekSun18'], 'mon': R['pWeekMon'], 'title': R['pWeekTitle']})
        q, pd = R['sQuote'], R['sPend']
        print(ok(q.get('price_nok') == 49 and q.get('data', {}).get('k') == 'turbo' and R['sNoProd'][0] and R['sAnon'][0] and R['sPaid1'] == 't' and R['sPaid2'] == 'f'
                 and len(pd) == 1 and pd[0]['product'] == 'trim_turbo' and pd[0]['data'].get('give') == 'trim' and pd[0]['data'].get('boat') == 'v1' and R['sPendB'] == []
                 and R['sPlPaid'][0] and R['sPlRead'][0] and R['sAfter'] == '0/refunded/1/1' and R['sEnd'] == []),
              'the shop: a quote only for a real product and a signed-in player, one grant per paid purchase however often Stripe tells it, given and done once, a refund takes back what is not given, and no player books a payment or reads the grants',
              {'quote': q, 'paid': (R['sPaid1'], R['sPaid2']), 'pending': pd, 'after': R['sAfter'], 'end': R['sEnd']})
        sn = R['spNow']
        print(ok(R['spPl'][0] and R['spAd1'][0] and R['spNoAgr'][0] and R['spBadUrl'][0] and len(sn) == 1 and sn[0]['target'] == 'garnhaler' and sn[0]['sponsor']['name'] == 'Testmerke' and sn[0]['data'].get('model') == 'GH-200'
                 and R['spOff'] == [] and R['spOffS'] == [] and len(R['spList']) == 1 and len(R['spList'][0]['placements']) == 1 and R['spListPl'][0] and R['spRead'][0] and R['spReadAnon'][0] and R['spRepPl'][0] and len(R['spRep']) == 1 and R['spRep'][0]['imp'] == 4 and R['spRep'][0]['sec'] == 640 and R['spRep'][0]['clicks'] == 1 and R['spRep'][0]['sponsor'] == 'Testmerke'),
              'sponsors: only the admin with the second factor adds one, and only with an agreement and an https site; sp_now gives anyone what is active and nothing switched off; no player reads the tables; the report per placement and week (views, seconds capped at 600 a send, clicks) only for the admin',
              {k: R[k] for k in ('spPl', 'spAd1', 'spNoAgr', 'spBadUrl', 'spOff', 'spOffS', 'spListPl', 'spRead', 'spReadAnon')})
        print(ok(R['lgNo'][0] and R['lgV'] == ['1', '2'] and R['lgBad'][0] and R['lgGet'] and R['lgGet'].get('img', '').startswith('data:image/png') and R['lgRead'][0] and R['lgAdmPl'][0] and R['lgRmPl'][0]
                 and len(R['lgAdm']) == 1 and R['lgAdm'][0]['who'] == hidA and R['lgRm'] == 't' and R['lgGone'] == 'null' and R['lgMine'].get('removed') is True and R['lgMine'].get('reason') == 'Støtende innhold'
                 and R['lgAgain'] == '3' and R['lgMine2'].get('removed') is False),
              "the logo: put up only once owned, a bad picture refused, the others get it by the world's id; only the admin lists and takes it away, then nobody gets it, the player is told why and may put up another",
              {k: R[k] for k in ('lgV', 'lgRm', 'lgGone', 'lgMine', 'lgAgain', 'lgMine2')})
        print(ok(R['rgA'] == 't' and R['rgB'] == 'f' and R['rgA2'] == 't' and R['rgBad'][0] and R['rgRead'][0]), "one's own registration number: the first player's, refused to another, kept for the first; a bad mark and reading the claims are refused", {k: R[k] for k in ('rgA', 'rgB', 'rgA2')})
        print(ok(R['livOwn'] == 'h:gul;r:raud;m:T.1.LK;p:2' and R['livGone'] == 'h:gul;m:T.1.LK;p:2'),
              "the others see a paid paint design only while the account owns it (bought, not refunded); colours, the registration mark and the pennants always (Ø6 funn 5)", {'own': R['livOwn'], 'gone': R['livGone']})
        print(ok(R['dOwn'] == ['des_ripe'] and R['dGive'] == ['cos'] and R['dGone'] == []), 'a paint design: paid, it is the account\'s on every device (owned) and a grant for the game; a refund takes it away', {'own': R['dOwn'], 'give': R['dGive'], 'gone': R['dGone']})
        print(ok(R['deleted'] == '0/0/0/anon'), 'deleting the account takes the player, the events and the save; the purchase stays without a name for the books', R['deleted'])
        print(ok(R['del2'] == 'user_01DDD/0' and R['del2Anon'] is not None), 'delete_me2 deletes the account and names it (for the sign-in at WorkOS); signed out it is refused', {'del2': R['del2'], 'anon': str(R['del2Anon'])[:60]})
        # guests (20261006180000_guest.sql): an anonymous sign-in plays and saves like a player, cannot buy, and registering moves it all
        G = {'sub': '9a1c2a3e-0000-4000-8000-0000000000aa', 'role': 'authenticated', 'is_anonymous': True}; C = {'sub': 'user_01GGG', 'role': 'authenticated'}
        sql("select public.tm_hello('{}')", G, 'authenticated'); sql("select public.tm_consent(true, 1990)", G, 'authenticated')
        sql("select public.save_put2('KYST2:guest', '2026-10-06T10:00:00Z', 100, null, false, '{\"day\":3}')", G, 'authenticated')
        # Ø6 funn 2 og 3 (20261105130000_guest_world.sql): what a guest lands and catches is the guest's alone until the account is made:
        # not in the open group's quota or the boats, the plants' market, the cells or the season's event list (the guest sees its own)
        wgA = lambda since=0: (sql("delete from public.world_agg"), json.loads(sql("select public.world_get(%d, 2027, 1500)" % since, A, 'authenticated')))[1]
        wA0 = wgA()
        sql("""select public.land_put(1500, 2027, 'finnsnes', 'open', '[{"sp":"torsk","kg":700,"kgq":700}]', 'Gjest', '', 'skrei')""", G, 'authenticated')
        sql("select public.catch_put(1500, '[[549755813999, 400]]')", G, 'authenticated')
        wA1 = wgA(wA0['cur'])
        GW = {'open': wA1['open'] - wA0['open'], 'boats': wA1['boats'] - wA0['boats'], 'mkt': sorted(map(tuple, wA1['mkt'])) == sorted(map(tuple, wA0['mkt'])),
              'cells': [c for c in wA1['cells'] if c[0] == 549755813999], 'wy': sql("select count(*) from public.world_year where player_id = '%s'" % G['sub']),
              'evA': [r['boat'] for r in json.loads(sql("select public.ev_top('skrei', 2027)", A, 'authenticated'))['rows']],
              'evG': [r['boat'] for r in json.loads(sql("select public.ev_top('skrei', 2027)", G, 'authenticated'))['rows'] if r['me']]}
        gNoShop = sql("select public.shop_quote('trim_turbo')", G, 'authenticated', expect_err=True)
        gNotGuest = sql("select public.guest_claim()", A, 'authenticated', expect_err=True)
        code = sql("select public.guest_claim()", G, 'authenticated')
        gSelf = sql("select public.guest_merge('%s')" % code, G, 'authenticated', expect_err=True)
        gMerge = json.loads(sql("select public.guest_merge('%s')" % code, C, 'authenticated'))
        gAfter = sql("select (select count(*) from public.players where id = '%s') || '/' || (select data from public.saves where player_id = 'user_01GGG') || '/' || (select consent from public.players where id = 'user_01GGG')" % G['sub'])
        gAgain = json.loads(sql("select public.guest_merge('%s')" % code, C, 'authenticated'))
        # with the account the guest's landings count (guest_merge), and for everyone: no landing ahead of the shared clock, the year from
        # the game hour and not from the call, the plant and the species cleaned (Ø6 funn 2c)
        GW['wyC'] = sql("select coalesce(sum(kgq), 0) from public.world_year where player_id = 'user_01GGG' and y = 2027 and acc = 'open' and sp = 'torsk'")
        GW['openAfter'] = wgA()['open'] - wA0['open']
        GW['ahead'] = sql("""select public.land_put(%s, 2027, 'finnsnes', 'none', '[{"sp":"torsk","kg":1}]')""" % sql("select public.world_gh() + 100"), C, 'authenticated', expect_err=True)
        sql("""select public.land_put(1600, 2031, '<b>mØF50</b>', 'none', '[{"sp":"<i>torsk","kg":1}]')""", C, 'authenticated')
        GW['clean'] = sql("select y || '/' || port || '/' || sp from public.landings where player_id = 'user_01GGG' order by id desc limit 1")
        gRead = sql("select count(*) from public.guest_links", A, 'authenticated', expect_err=True)
        print(ok(gNoShop[0] and 'guest' in gNoShop[1] and gNotGuest[0] and len(code) >= 32 and gSelf[0] and gMerge == {'merged': True, 'save': True} and gAfter == '0/KYST2:guest/true'
                 and gAgain.get('merged') is False and gRead[0]),
              'guests: an anonymous sign-in plays and saves, cannot buy; registering with its one-time code moves the save and the consent to the account and the guest is gone; the code works once and no player reads the codes',
              {'shop': gNoShop, 'merge': gMerge, 'after': gAfter, 'again': gAgain})
        print(ok(abs(GW['open']) < 0.01 and GW['boats'] == 0 and GW['mkt'] and GW['cells'] == [] and GW['wy'] == '0' and 'Gjest' not in GW['evA'] and GW['evG'] == ['Gjest']
                 and GW['wyC'] == '700' and abs(GW['openAfter'] - 700) < 0.01 and GW['ahead'][0] and 'ahead' in GW['ahead'][1] and GW['clean'] == '2027/bmØF50b/itorsk'),
              "a guest's landings and catch are the guest's alone (not in the open group's quota, the boats, the market, the cells or the event list) until the account is made, and then they count; no landing ahead of the shared clock, the year from the game hour, the plant and species cleaned (Ø6 funn 2 og 3)",
              {k: (v[1][:60] if isinstance(v, tuple) else v) for k, v in GW.items()})
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
        # (OPP4, 20261107160000_funnel_tier.sql: a tier bought in the first seven days, from shop_buy {w:'equip', k, lv} and the yard's upg
        # {k, lv}; a buy without lv is not a tier)
        sql("""insert into public.events (player_id, kind, data, ts) values ('user_01FN1', 'shop_buy', '{"w":"equip","k":"kniv","lv":2}', now() - interval '8 days'),
            ('user_01FN1', 'shop_buy', '{"w":"equip","k":"jukse"}', now() - interval '9 days'), ('user_01FN3', 'upg', '{"k":"prop","lv":1}', now() - interval '1 day'), ('33333333-3333-4333-8333-333333333333', 'upg', '{"k":"cabin","lv":1}', now() - interval '1 hour'),
            ('33333333-3333-4333-8333-333333333333', 'shop_buy', '{"w":"equip","k":"vhf"}', now() - interval '1 hour')""")
        F1 = json.loads(sql("select public.admin_funnel(8)", AD2, 'authenticated'))
        FD = {k: F1['all'][k] - F0.get(k, 0) for k in F1['all']}
        FX = {'pl': sql("select public.admin_funnel(8)", B, 'authenticated', expect_err=True), 'mfa': sql("select public.admin_funnel(8)", AD1, 'authenticated', expect_err=True)}
        print(ok(FD == {'start': 3, 'catch': 2, 'land1': 2, 'land3': 1, 'reg': 2, 'd1': 2, 'd1n': 2, 'd7': 1, 'd7n': 1, 'd30': 0, 'd30n': 0, 'tier': 2, 'tier7': 1} and FX['pl'][0] and FX['mfa'][0]
                 and F1['weeks'] and sum(w['start'] for w in F1['weeks']) >= 3 and all('tier' in w and 'tier7' in w for w in F1['weeks'])),
              "the funnel: started, first catch, first and third landing, an account, back after 1, 7 and 30 days of those who have had that long, and a tier bought within day 7 (OPP4); by the week they started; only the admin with MFA reads it", FD)
        # a tier bought after the first seven days is not counted, but the player is among those who have had them (d7n); the yard's other
        # rebuilds (upg cabin above) are not tiers
        sql("""insert into public.players (id, guest) values ('user_01FN4', false);
          insert into public.sessions (id, player_id, started_at) values ('44444444-4444-4444-8444-444444444446', 'user_01FN4', now() - interval '20 days');
          insert into public.events (player_id, kind, data, ts) values ('user_01FN4', 'shop_buy', '{"w":"equip","k":"hott","lv":2}', now() - interval '12 days')""")
        F2 = json.loads(sql("select public.admin_funnel(8)", AD2, 'authenticated'))['all']; sql("delete from public.players where id = 'user_01FN4'")
        FT = {k: F2.get(k, 0) - F1['all'].get(k, 0) for k in ('start', 'tier', 'tier7', 'd7n')}
        print(ok(FT == {'start': 1, 'tier': 0, 'tier7': 0, 'd7n': 1}), "the funnel's tier: one bought on day 8 is not within day 7", FT)
        # the first trip's steps (20261010100000_tut_steps.sql): players per step, the median seconds (settled steps not counted), the
        # trips finished and their median; only the admin with MFA reads it
        sql("""insert into public.events (player_id, kind, data) values ('user_01FN1', 'tut_step', '{"id":"gps","s":12}'), ('user_01FN1', 'tut_step', '{"id":"route1","s":40}'),
            ('user_01FN3', 'tut_step', '{"id":"gps","s":30}'), ('user_01FN3', 'tut_step', '{"id":"route1","s":0,"settled":true}'), ('user_01FN1', 'tut_done', '{"s":1500}')""")
        TUr = json.loads(sql("select public.admin_tut(8)", AD2, 'authenticated'))
        TUx = {'pl': sql("select public.admin_tut(8)", B, 'authenticated', expect_err=True), 'mfa': sql("select public.admin_tut(8)", AD1, 'authenticated', expect_err=True)}
        print(ok(TUr['started'] == 2 and TUr['steps']['gps']['n'] == 2 and TUr['steps']['gps']['med'] == 21 and TUr['steps']['route1']['n'] == 2 and TUr['steps']['route1']['med'] == 40
                 and TUr['steps']['route1']['settled'] == 1 and TUr['done'] == 1 and TUr['doneMed'] == 1500 and TUx['pl'][0] and TUx['mfa'][0]),
              "the first trip's steps: players and median seconds per step, settled steps without time, the trips finished; only the admin with MFA reads it", TUr)
        # the first trip's clock (20261027120000_tut_time.sql, Onboarding 2 O0): per region and for the whole coast, the players who began,
        # got a fish and finished, the median seconds to the first fish and how many within five minutes, the map and the naust after
        # «Start her», and the loads without the naust; the steps above have no region ('ukjent'); only the admin with MFA reads it
        sql("""insert into public.events (player_id, kind, data) values ('user_01FN1', 'tut_step', '{"id":"n1","s":3,"r":"vest"}'), ('user_01FN3', 'tut_step', '{"id":"n1","s":4,"r":"troms"}'),
            ('user_01FN1', 'tut_load', '{"r":"vest","letter":40,"map":8,"naust":14}'), ('user_01FN3', 'tut_load', '{"r":"troms","letter":30,"map":6,"naust":null}'),
            ('user_01FN1', 'tut_fish', '{"r":"vest","s":240,"sBoat":150}'), ('user_01FN3', 'tut_fish', '{"r":"troms","s":420,"sBoat":300}'), ('user_01FN1', 'tut_done', '{"s":900,"r":"vest"}')""")
        TT = json.loads(sql("select public.admin_tut_time(8)", AD2, 'authenticated'))
        TTx = {'pl': sql("select public.admin_tut_time(8)", B, 'authenticated', expect_err=True), 'mfa': sql("select public.admin_tut_time(8)", AD1, 'authenticated', expect_err=True)}
        A, V = TT.get('alle', {}), TT.get('vest', {})
        print(ok(A.get('fish') == 2 and A.get('fishMed') == 330 and A.get('fish5') == 1 and A.get('naustMed') == 14 and A.get('noRoom') == 1 and A.get('mapMed') == 7
                 and V.get('started') == 1 and V.get('fish') == 1 and V.get('done') == 1 and V.get('fishMed') == 240 and V.get('fishBoatMed') == 150
                 and TT.get('troms', {}).get('naustMed') is None and 'ukjent' in TT and TTx['pl'][0] and TTx['mfa'][0]),
              "the first trip's clock: per region and in all, the time to the first fish and how many within five minutes, the map and the naust after «Start her», the starts without the naust; only the admin with MFA reads it", TT)
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
        # B4 (02.11.2026, supabase/migrations/20261102120000_register.sql): the closed group's register is one for all players: a right
        # bought by one is gone from the NPC owners for the others; refused when none is left; a holder who neither lands nor buys for
        # 90 days gives the place back; the world brings the register, the open group's active players and the others' catch per group;
        # the stock comes from the server only when the admin turns it on; only the admin with the second factor reaches the switches
        G = {}; wg = lambda who: json.loads(sql("select public.world_get(0, 2027, 1000)", who, 'authenticated'))
        G['r0'] = wg(A)['reg']['h9']
        G['a1'] = json.loads(sql("select public.reg_take('h9')", A, 'authenticated'))['h9']
        G['b1'] = json.loads(sql("select public.reg_take('h9')", B, 'authenticated'))['h9']
        G['seenA'] = wg(A)['reg']['h9']; G['seenB'] = wg(B)['reg']['h9']
        sql("update public.reg_rights set total = 1 where id = 'h20'")
        G['last'] = json.loads(sql("select public.reg_take('h20')", A, 'authenticated'))['h20']
        G['full'] = sql("select public.reg_take('h20')", B, 'authenticated', expect_err=True)
        G['bad'] = sql("select public.reg_take('h99')", A, 'authenticated', expect_err=True)[0]
        # B has neither landed nor bought for 100 days: the place goes back
        sql("update public.reg_held set at = now() - interval '100 days' where player_id = '%s'; update public.landings set at = now() - interval '100 days' where player_id = '%s'" % (B['sub'], B['sub']))
        G['idle'] = wg(A)['reg']['h9']
        G['freed'] = json.loads(sql("select public.reg_free('h9')", A, 'authenticated'))['h9']
        W = wg(A); G['keys'] = sorted(k for k in ('reg', 'open_boats', 'grp', 'stock') if k in W); G['stockOff'] = W['stock'] is None
        G['cfgA'] = sql("select public.admin_cfg_set('stock_server', 'true')", A, 'authenticated', expect_err=True)[0]
        G['cfg1'] = sql("select public.admin_cfg_set('stock_server', 'true')", AD1, 'authenticated', expect_err=True)[0]
        sql("select public.admin_cfg_set('stock_server', 'true')", AD2, 'authenticated')
        G['cfgBad'] = sql("select public.admin_cfg_set('share_limit', '7')", AD2, 'authenticated', expect_err=True)[0]
        sql("select public.admin_stock_set('torsk', 2028, 400000, 330000, 320000)", AD2, 'authenticated')
        G['stockOn'] = wg(B)['stock']
        G['shareA'] = sql("select public.admin_share(2027)", A, 'authenticated', expect_err=True)[0]
        SH = json.loads(sql("select public.admin_share(2027)", AD2, 'authenticated')); G['share'] = sorted(SH.keys())
        G['tables'] = all(sql("select * from public.%s" % t, A, 'authenticated', expect_err=True)[0] for t in ('reg_held', 'reg_rights', 'world_cfg', 'world_stock'))
        print(ok(G['r0'] == 200 and G['a1'] == 199 and G['b1'] == 198 and G['seenA'] == G['seenB'] == 198),
              'the register is one for all: 200 NPC owners at 9-9.9 m, 199 after a purchase by one account and 198 after the other, the same seen by both', G)
        print(ok(G['last'] == 0 and G['full'][0] and 'no owner left' in G['full'][1] and G['bad']), 'refused when no NPC owner is left at that length, and for a length the game does not sell')
        print(ok(G['idle'] == 199 and G['freed'] == 200), 'a holder idle for 90 days gives the place back, and a right sold goes back to the NPCs')
        print(ok(G['keys'] == ['grp', 'open_boats', 'reg', 'stock'] and G['stockOff'] and G['stockOn'] == [['torsk', 2028, 400000, 330000, 320000]]),
              'the world brings the register, the open group\'s active players and the others\' catch per group; the stock only when the admin has turned it on')
        print(ok(G['cfgA'] and G['cfg1'] and G['cfgBad'] and G['shareA'] and G['share'] == ['cfg', 'grp', 'open_boats', 'reg', 'reg_total', 'stock'] and G['tables']),
              'only the admin with the second factor turns the switches and sees the share; no player reads the tables')
        # H1 of the ocean step (03.11.2026, 20261103180000_havkonsesjon.sql): the ocean permits are in the same register, as many as in life; one bought is gone for everybody, and a permit the game does not have is refused
        H1 = {'tral': json.loads(sql("select public.reg_take('tral')", A, 'authenticated'))['tral'], 'seen': wg(B)['reg'], 'bad': sql("select public.reg_take('reke')", A, 'authenticated', expect_err=True)[0]}
        H1['back'] = json.loads(sql("select public.reg_free('tral')", A, 'authenticated'))['tral']
        print(ok(H1['tral'] == 35 and H1['seen'].get('tral') == 35 and H1['seen'].get('konv') == 26 and H1['seen'].get('rnot') == 69 and H1['seen'].get('krab') == 34 and H1['bad'] and H1['back'] == 36),
              'the ocean permits in the shared register, as many as in life: 36 trawl permits, 35 after one is bought (seen by the other account), 26 conventional, 69 purse seine, 34 snow crab; back to 36 when sold', {k: H1[k] for k in ('tral', 'bad', 'back')})
        # whose gear it is (02.11.2026, 20261102130000_gear_owner.sql): gear_near2 gives B's sets to A with B's player name and boat, never
        # A's own, and gear_near still gives them with nothing of the owner
        sql("select public.gear_put('[[\"g1\", \"garn\", 900.1, 300.1, 900.3, 300.1]]'::jsonb)", B, 'authenticated')
        sql("delete from public.presence where player_id = '%s'; insert into public.presence (player_id, boat, vtype, x, y, st) values ('%s', 'Havbris', 'trebat', 900, 300, 'port')" % (B['sub'], B['sub']))
        g2 = json.loads(sql("select public.gear_near2(900, 300, 5)", A, 'authenticated')); g1 = json.loads(sql("select public.gear_near(900, 300, 5)", A, 'authenticated'))
        own = json.loads(sql("select public.gear_near2(900, 300, 5)", B, 'authenticated'))
        mine = [q for q in g2 if q[0] == 'garn' and abs(q[1] - 900.1) < 1e-3]; nmB = sql("select coalesce((select name from public.names where player_id = '%s' and removed_at is null), '')" % B['sub']).strip()
        print(ok(len(mine) == 1 and mine[0][5] == nmB and mine[0][6] == 'Havbris' and all(len(q) == 5 for q in g1) and not any(abs(q[1] - 900.1) < 1e-3 for q in own)),
              'gear_near2 gives the others\' sets with the owner\'s player name and boat, never your own; gear_near still has nothing of the owner', (mine, nmB, len(g1), len(own)))
        # the admin told at once (20261102150000_err_alert.sql): the first look starts the cursor; a new message and three crashes give one
        # push to the admin with a subscription; within half an hour no other, and the cursor waits; then the next; no player runs it
        E = {}
        adm = sql("select id from public.players order by id limit 1")
        sql("update public.players set game_admin = true where id = '%s'; insert into public.push_subs (endpoint, player_id, p256dh, auth, lang) values ('https://push.test/adm', '%s', 'k', 'a', 'no') on conflict do nothing" % (adm, adm))
        E['first'] = sql("select public.err_alert()")
        sql("insert into public.errors (msg, src) values ('errtest ny 1282 feil', 'x'), ('Krasj: siden stoppet mens den var på skjermen · 3d', 'crash'), ('Krasj: siden stoppet mens den var på skjermen · 3d', 'crash'), ('Krasj: siden stoppet mens den var på skjermen · kart', 'crash'), ('TypeError: x', 'view3d.js:5')")
        E['one'] = sql("select public.err_alert()")
        E['body'] = sql("select replace(body, E'\\n', ' | ') from public.push_queue where tag = 'dsb-err' and player_id = '%s' order by id desc limit 1" % adm)
        sql("insert into public.errors (msg, src) values ('errtest annen', 'x')")
        E['wait'] = sql("select public.err_alert()")
        sql("update public.push_state set v = v - 3600 where k = 'err_alert_at'")
        E['next'] = sql("select public.err_alert()"); E['body2'] = sql("select replace(body, E'\\n', ' | ') from public.push_queue where tag = 'dsb-err' order by id desc limit 1")
        sql("insert into public.errors (msg, src) values ('errtest ny 999 feil', 'x')"); sql("update public.push_state set v = v - 3600 where k = 'err_alert_at'")
        E['same'] = sql("select public.err_alert()")
        E['anon'] = sql("select public.err_alert()", {}, 'anon', expect_err=True)[0]; E['pl'] = sql("select public.err_alert()", A, 'authenticated', expect_err=True)[0]
        sql("update public.players set game_admin = false where id = '%s'; delete from public.push_subs where endpoint = 'https://push.test/adm'; delete from public.push_queue where tag = 'dsb-err'" % adm)
        print(ok(E['first'] == '0' and E['one'] == '1' and '«errtest ny 1282 feil»' in E['body'] and 'nye feil' in E['body'] and '3 krasj' in E['body'] and 'TypeError: x' not in E['body']
                 and E['wait'] == '0' and E['next'] == '1' and 'errtest annen' in E['body2'] and E['same'] == '0' and E['anon'] and E['pl']),
              'a new error or three crashes push the admin once, never a known one; half an hour between, nothing lost; numbers do not make a message new; no player runs it', E)
        # Ø6 ryddejobbene (20261105150000_rydd.sql), last, so the ceilings stop nothing above. Funn 9: without a sign-in the errors and the
        # frame rate stop at a ceiling that grows with the active players; an event's data is kept to 4 000 bytes. Funn 10: a guest's berth gives way to an account and is not shown to it. Funn 12: anon runs only what it should.
        PY = {'sub': 'user_01RYD', 'role': 'authenticated'}; sql("select public.tm_hello('{}')", PY, 'authenticated'); sql("select public.tm_consent(true, 1990)", PY, 'authenticated')
        cnt = lambda q: int(sql("select count(*) from " + q))
        RY = {'act': int(sql("select public.tm_active()"))}; a_ = RY['act']
        e0m, e0h = cnt("public.errors where ts > now() - interval '1 minute'"), cnt("public.errors where ts > now() - interval '1 hour'")
        sql("select count(*) from (select public.tm_error('flood ' || g, 's', '', '{}') from generate_series(1, 400) g) z", {}, 'anon')
        RY['err'] = [cnt("public.errors where msg like 'flood %'"), max(0, min(30 + a_ - e0m, 200 + 20 * a_ - e0h))]
        p0 = cnt("public.perf where ts > now() - interval '1 hour'"); NP = 1200 + 60 * a_
        sql("select count(*) from (select public.tm_perf(30, 20, 0, '{}') from generate_series(1, %d) g) z" % NP, {}, 'anon')
        RY['perf'] = [cnt("public.perf where ts > now() - interval '1 hour'") - p0, max(0, min(NP, 500 + 60 * a_ - p0))]
        sid3 = '33333333-3333-4333-8333-333333333333'
        sql("""select public.tm_batch('%s', '{}', 10, ('[{"k":"big","t":%d,"d":{"x":"' || repeat('y', 5000) || '"}},{"k":"small","t":%d,"d":{"x":1}}]')::jsonb, false, null)"""
            % (sid3, int(time.time() * 1000), int(time.time() * 1000)), PY, 'authenticated')
        RY['ev'] = sql("select string_agg(kind || '=' || data::text, ' ' order by kind) from public.events where session_id = '%s'" % sid3)
        sql("select public.berth_put('h_ry:k1:0', 'h_ry', 'v1', 900, 300, 0, 10, 3)", G2, 'authenticated')
        RY['bSeen'] = [len(json.loads(sql("select public.berth_get('h_ry')", who, 'authenticated'))) for who in (G2, PY)]
        RY['bTake'] = sql("select public.berth_put('h_ry:k1:0', 'h_ry', 'v2', 900, 300, 0, 10, 3)", PY, 'authenticated')
        RY['bBack'] = sql("select public.berth_put('h_ry:k1:0', 'h_ry', 'v1', 900, 300, 0, 10, 3)", G2, 'authenticated')
        # the queue at the plants (20261107120000_landing_q.sql, K2): one place at 'p_ko': the first goes, the second waits behind her with
        # a wait of about her landing, the third behind both; the first's end frees the place for the second; a wait not renewed in a
        # minute is gone (seen set back); land_look counts them; anon runs none of it
        KO = {}
        KO['g1'] = json.loads(sql("select public.land_begin('p_ko', 500, 600, 1)", PY, 'authenticated'))
        KO['w2'] = json.loads(sql("select public.land_begin('p_ko', 300, 600, 1)", G2, 'authenticated'))
        KO['w3'] = json.loads(sql("select public.land_begin('p_ko', 300, 600, 1)", A, 'authenticated'))
        KO['look'] = json.loads(sql("select public.land_look(array['p_ko', 'p_other'])", A, 'authenticated'))
        sql("select public.land_end()", PY, 'authenticated')
        KO['g2'] = json.loads(sql("select public.land_begin('p_ko', 300, 600, 1)", G2, 'authenticated'))
        sql("update public.landing_q set seen = now() - interval '2 minutes' where player_id = '%s'" % A['sub'])
        KO['w3gone'] = json.loads(sql("select public.land_look(array['p_ko'])", G2, 'authenticated'))
        KO['two'] = json.loads(sql("select public.land_begin('p_two', 300, 600, 2)", A, 'authenticated'))
        KO['anon'] = sql("select public.land_begin('p_ko', 1, 60, 1)", {}, 'anon', expect_err=True)
        sql("select public.land_end()", G2, 'authenticated'); sql("select public.land_end()", A, 'authenticated')
        print(ok(KO['g1'].get('go') is True and KO['w2'].get('go') is False and KO['w2'].get('ahead') == 0 and KO['w2'].get('active') == 1 and 0 < KO['w2'].get('wait_s', 0) <= 600
                 and KO['w3'].get('go') is False and KO['w3'].get('ahead') == 1 and KO['w3'].get('wait_s', 0) > 600
                 and KO['look'] == [{'port': 'p_ko', 'active': 1, 'waiting': 2}] and KO['g2'].get('go') is True
                 and KO['w3gone'] == [{'port': 'p_ko', 'active': 1, 'waiting': 0}] and KO['two'].get('go') is True and KO['anon'][0]),
              "the queue at the plants: the first lands, the next wait in order with a wait of about a landing each, the place frees at land_end, a wait a page stopped renewing is gone, land_look counts, anon is refused (K2)", KO)
        # boat sales between players at Kystmegleren (20261107140000_broker.sql, B1–B8): the limits on the start and buy-now prices against
        # the boat's value and the type's price, three listings a player, the bids with 2 % steps and the money bound and released in the
        # ledger, buy-now, the settlement (the winner gets the boat, the seller the price less 5 %, an unsold boat back), cancelling only
        # without bids, the right moving in the register, the wish's push, a deleted seller, the cash check, and guests and anon refused
        MB = {}
        S1 = {'sub': 'user_01MS1', 'role': 'authenticated'}; K1 = {'sub': 'user_01MK1', 'role': 'authenticated'}; K2 = {'sub': 'user_01MK2', 'role': 'authenticated'}; S2 = {'sub': 'user_01MS2', 'role': 'authenticated'}
        for who in (S1, K1, K2, S2): sql("select public.tm_hello('{}')", who, 'authenticated')
        sql("select public.tm_consent(true, 1990)", S1, 'authenticated')
        sql("insert into public.saves (player_id, data, saved_at, summary) values ('user_01MK1', 'x', now(), '{\"cash\":100000}'), ('user_01MS1', 'x', now(), '{\"cash\":0}') on conflict (player_id) do update set summary = excluded.summary")
        sql("insert into public.reg_held (player_id, id) values ('user_01MS1', 'h9') on conflict do nothing")
        VES = lambda nm, lic='null': "'{\"type\":\"sjark\",\"name\":\"%s\",\"engH\":1200,\"equip\":{\"vhf\":true},\"lic\":%s,\"pgear\":{\"nets\":[1]},\"at\":\"Myre\"}'" % (nm, lic)
        def sqle(q, claims, role):   # the whole error (sql() keeps only its last 200 characters, which the PL/pgSQL context can fill)
            pre = "set role %s; set request.jwt.claims = '%s'; " % (role, json.dumps(claims))
            pp = run('psql', '-h', sock, '-U', user, '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-qAt', '-c', pre + q)
            return (pp.returncode != 0, pp.stderr)
        put = lambda who, vid, start, buynow='null', hours=24, value=1000000, lic_kr=0, ves=None: sqle(
            "select public.listing_put('%s', %s, %d, %d, %d, %s, %d, 'p_yard', 800, 300, 'Testrederi')" % (vid, ves or VES('Havbris ' + vid), value, lic_kr, start, buynow, hours), who, 'authenticated')
        err = lambda r: (r[1].split('ERROR:')[1].strip().split('\n')[0] if r[0] else 'ok')
        MB['lim'] = [err(put(S1, 'v9', 399999)), err(put(S1, 'v9', 500000, 1600001)), err(put(S1, 'v9', 500000, 500000)), err(put(S1, 'v9', 500000, hours=2)),
                     err(put(S1, 'v9', 500000, value=5000000)), err(put(S1, 'v9', 2000001, value=1250000)), err(put(G2, 'v9', 500000)),
                     err(put(S1, 'v9', 500000, ves="'{\"type\":\"autoliner\",\"name\":\"X\"}'"))]
        L1 = json.loads(sql("select public.listing_put('v2', %s, 1000000, 300000, 500000, 900000, 24, 'p_yard', 800, 300, 'Testrederi')" % VES('Havbris', '{\"id\":\"h9\"}'), S1, 'authenticated'))['id']
        MB['dup'] = err(put(S1, 'v2', 500000))
        L2 = json.loads(sql("select public.listing_put('v3', %s, 1000000, 0, 400000, null, 6, 'p_yard', 800, 300, '')" % VES('Polarlys'), S1, 'authenticated'))['id']
        L3 = json.loads(sql("select public.listing_put('v4', %s, 1000000, 0, 400000, null, 1, 'p_yard', 810, 300, '')" % VES('Bølgen'), S1, 'authenticated'))['id']
        MB['four'] = err(put(S1, 'v5', 500000))
        bid = lambda who, lid, kr, dl='null': err(sqle("select public.listing_bid(%d, %d, %s)" % (lid, kr, dl), who, 'authenticated'))
        led = lambda who: [(r['kind'], r['kr']) for r in json.loads(sql("select public.broker_pending()", who, 'authenticated'))]
        MB['bids'] = [bid(K1, L1, 499999), bid(K1, L1, 500000), bid(K1, L1, 600000), bid(K2, L1, 509999), bid(K2, L1, 510000, "'p_far'"), bid(S1, L1, 700000), bid(K1, L1, 900000), bid(K1, L2, 1300000), bid(G2, L2, 500000)]
        MB['ledK1'] = led(K1); MB['ledK2'] = led(K2)
        MB['top'] = sql("select top_kr || '/' || bids_n || '/' || (select count(*) from public.bids where listing = %d and state = 'held') from public.listings where id = %d" % (L1, L1))
        MB['cancel'] = [err(sqle("select public.listing_cancel(%d)" % L1, S1, 'authenticated')), err(sqle("select public.listing_cancel(%d)" % L3, K1, 'authenticated')),
                        err(sqle("select public.listing_cancel(%d)" % L3, S1, 'authenticated'))]
        # buy-now: K2's bid is released, K1 pays 900 000 and gets the boat, the seller 855 000, the right h9 moves to K1
        MB['buy'] = json.loads(sql("select public.listing_buy(%d, null)" % L1, K1, 'authenticated'))
        MB['buyAgain'] = err(sqle("select public.listing_buy(%d, null)" % L1, K2, 'authenticated'))
        MB['ledK1b'] = json.loads(sql("select public.broker_pending()", K1, 'authenticated')); MB['ledK2b'] = led(K2)
        MB['reg'] = sql("select coalesce(string_agg(player_id || ':' || id, ',' order by player_id), '') from public.reg_held where player_id in ('user_01MS1', 'user_01MK1')")
        # the end of the time: L2 with K2's bid at the start price and delivery, sold at the settlement; a fourth listing with no bid back
        MB['bidL2'] = bid(K2, L2, 400000, "'p_far'")
        L4 = json.loads(sql("select public.listing_put('v5', %s, 1000000, 0, 400000, null, 1, 'p_yard', 800, 300, '')" % VES('Ternen'), S1, 'authenticated'))['id']
        sql("update public.listings set until = now() - interval '1 second' where id in (%d, %d)" % (L2, L4))
        MB['settle'] = sql("select public.listing_settle()", None, 'service_role')
        MB['states'] = sql("select string_agg(state, ',' order by id) from public.listings where id in (%d, %d, %d, %d)" % (L1, L2, L3, L4))
        P1 = json.loads(sql("select public.broker_pending()", S1, 'authenticated'))
        MB['ledS1'] = [(r['kind'], r['kr'], r['data'].get('vid'), r['data'].get('why')) for r in P1]
        MB['ledK2c'] = json.loads(sql("select public.broker_pending()", K2, 'authenticated'))
        sql("select public.broker_done(array[%s]::bigint[])" % ','.join(str(r['id']) for r in P1), S1, 'authenticated')
        sql("select public.broker_done(array[%s]::bigint[])" % ','.join(str(r['id']) for r in P1), K1, 'authenticated')   # (someone else's ids do nothing)
        MB['doneS1'] = len(json.loads(sql("select public.broker_pending()", S1, 'authenticated'))); MB['stillK1'] = len(json.loads(sql("select public.broker_pending()", K1, 'authenticated')))
        # the cash check counts what the broker paid out: the seller's cash up by the sales is not flagged
        f0 = int(sql("select count(*) from public.cash_flags where player_id = 'user_01MS1'"))
        sql("update public.saves set summary = '{\"cash\":1235000}', updated_at = now() where player_id = 'user_01MS1'")
        MB['flag'] = int(sql("select count(*) from public.cash_flags where player_id = 'user_01MS1'")) - f0
        # what is for sale: the open ones nearest first, without the gear in the sea, the sold ones without the buyer
        sql("select public.listing_put('v6', %s, 1000000, 0, 400000, null, 72, 'p_near', 801, 300, '')" % VES('Skarven'), S1, 'authenticated')
        G = json.loads(sql("select public.listings_get(800, 300, 50)", K1, 'authenticated'))
        MB['get'] = {'n': len(G['list']), 'names': [x['name'] for x in G['list']], 'pgear': any('pgear' in x['vessel'] for x in G['list']), 'mine': [x['mine'] for x in G['list']],
                     'sold': [(s['type'], s['price']) for s in G['sold']], 'soldWho': any('buyer' in s or 'player' in s for s in G['sold']), 'far': len(json.loads(sql("select public.listings_get(2000, 2000, 50)", K1, 'authenticated'))['list'])}
        MB['getS1'] = [(m['name'], m['state']) for m in json.loads(sql("select public.listings_get(null, null, null)", S1, 'authenticated'))['mine']]
        MB['getGuest'] = len(json.loads(sql("select public.listings_get(null, null, null)", G2, 'authenticated'))['list'])
        # the wish: K2 with a push subscription and no presence is told once; a second boat within twelve hours is not told again
        sql("insert into public.push_subs (endpoint, player_id, p256dh, auth, lang) values ('https://fcm.googleapis.com/x/mk2', 'user_01MK2', 'k', 'a', 'nb') on conflict do nothing")
        sql("select public.broker_wish_set('open', 2000000)", K2, 'authenticated')
        sql("select public.listing_put('v7', %s, 1000000, 0, 400000, null, 6, 'p_yard', 800, 300, '')" % VES('Kvalbein'), S1, 'authenticated')
        MB['wish1'] = sql("select count(*) || '/' || coalesce(max(body), '') from public.push_queue where player_id = 'user_01MK2' and tag = 'mkt-wish'")
        sql("select public.listing_cancel(%d)" % json.loads(sql("select public.listings_get(null, null, null)", S1, 'authenticated'))['mine'][0]['id'], S1, 'authenticated')
        sql("select public.listing_put('v8', %s, 1000000, 0, 400000, null, 6, 'p_yard', 800, 300, '')" % VES('Ingrid'), S1, 'authenticated')
        MB['wish2'] = sql("select count(*) from public.push_queue where player_id = 'user_01MK2' and tag = 'mkt-wish'")
        # a seller who deletes his account: his listing is called off and the bid in it given back
        LS2 = json.loads(sql("select public.listing_put('v2', %s, 1000000, 0, 400000, null, 24, 'p_yard', 800, 300, '')" % VES('Morgenrød'), S2, 'authenticated'))['id']
        bid(K1, LS2, 400000); sql("select public.broker_pending()", K1, 'authenticated')
        sql("delete from public.players where id = 'user_01MS2'"); sql("select public.listing_settle()", None, 'service_role')
        MB['gone'] = [sql("select state from public.listings where id = %d" % LS2), [(r['kind'], r['kr']) for r in json.loads(sql("select public.broker_pending()", K1, 'authenticated')) if r['listing'] == LS2]]
        MB['anon'] = [sql("select public.%s" % q, {}, 'anon', expect_err=True)[0] for q in ("listings_get(null, null, null)", "broker_pending()", "listing_bid(1, 1, null)")]
        MB['tabs'] = [sql("select count(*) from public.%s" % tb, K1, 'authenticated', expect_err=True)[0] for tb in ('listings', 'bids', 'broker_ledger', 'broker_wish')]
        MB['priv'] = [sql("select has_function_privilege('authenticated', 'public.%s', 'execute')" % f) for f in ('listing_settle()', 'broker_sold(listings, text, bigint, text)', 'broker_reg_move(text, text, text)')]
        lim_ok = MB['lim'] == ['start', 'buynow', 'buynow', 'bad hours', 'bad value', 'start', 'guest', 'bad type']
        bids_ok = MB['bids'] == ['low 500000', 'ok', 'top', 'low 510000', 'ok', 'own', 'buynow', 'cash', 'guest'] and MB['ledK1'] == [('bid', -500000), ('release', 500000)] and MB['ledK2'] == [('bid', -520200)] and MB['top'] == '510000/2/1'
        b1 = {r['kind']: r for r in MB['ledK1b']}
        buy_ok = (MB['buy'].get('price') == 900000 and MB['buyAgain'] == 'gone' and b1.get('buy', {}).get('kr') == -900000 and b1.get('boat', {}).get('data', {}).get('port') == 'p_yard'
                  and b1.get('boat', {}).get('data', {}).get('vessel', {}).get('pgear') == {'nets': [1]} and MB['ledK2b'] == [('bid', -520200), ('release', 520200)] and MB['reg'] == 'user_01MK1:h9')
        k2c = [(r['kind'], r['kr'], r['data'].get('port')) for r in MB['ledK2c']]
        settle_ok = (int(MB['settle']) == 2 and MB['states'] == 'sold,sold,cancelled,unsold' and ('paid', 855000, 'v2', None) in MB['ledS1'] and ('paid', 380000, 'v3', None) in MB['ledS1']
                     and ('back', 0, 'v4', 'cancelled') in MB['ledS1'] and ('back', 0, 'v5', 'unsold') in MB['ledS1'] and ('bid', -408000, None) in k2c and ('boat', 0, 'p_far') in k2c
                     and MB['doneS1'] == 0 and MB['stillK1'] == len(MB['ledK1b']))
        get_ok = (MB['get']['names'] == ['Skarven'] and not MB['get']['pgear'] and MB['get']['mine'] == [False] and MB['get']['far'] == 0 and (('sjark', 900000) in MB['get']['sold']) and ('sjark', 400000) in MB['get']['sold']
                  and not MB['get']['soldWho'] and ('Skarven', 'open') in MB['getS1'] and ('Havbris', 'sold') in MB['getS1'] and MB['getGuest'] >= 1)
        print(ok(lim_ok and bids_ok and buy_ok and settle_ok and get_ok and MB['dup'] == 'listed' and MB['four'] == 'too many' and MB['cancel'] == ['bids', 'not yours', 'ok']
                 and MB['flag'] == 0 and MB['wish1'].startswith('1/') and 'Kvalbein' in MB['wish1'] and 'Myre' in MB['wish1'] and MB['wish2'] == '1' and MB['gone'] == ['cancelled', [('bid', -400000), ('release', 400000)]]
                 and all(MB['anon']) and all(MB['tabs']) and MB['priv'] == ['f', 'f', 'f']),
              "Kystmegleren: start ≥ 40 % and buy-now ≤ 160 % of the value, the value held to the type, three listings, bids 2 % apart with the money bound and released in the ledger, buy-now, the settlement (boat to the winner, price less 5 % to the seller, unsold back), cancel only without bids, the right moves, the wish told once, a deleted seller's bid given back, the cash check counts the broker, guests and anon refused (B1–B8)", MB)
        # the right itself, not only that the call fails (the functions refuse anon by themselves too); and the player's rights stay
        RY['anonNo'] = [sql("select has_function_privilege('anon', 'public.%s', 'execute')" % f) == 'f' for f in ('guest_claim()', 'guest_merge(text)', 'push_plan(jsonb)', 'admin_cash_flags(int)', 'admin_tur_share(int)', 'saves_cash_check()')]
        RY['authYes'] = [sql("select has_function_privilege('authenticated', 'public.%s', 'execute')" % f) == 't' for f in ('guest_claim()', 'guest_merge(text)', 'push_plan(jsonb)', 'admin_cash_flags(int)', 'admin_tur_share(int)')]
        RY['anonList'] = sql("select string_agg(p.proname, ',' order by p.proname) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prosecdef and has_function_privilege('anon', p.oid, 'execute')")
        RY['anonTab'] = [sql("select count(*) from public.%s" % tb, {}, 'anon', expect_err=True)[0] for tb in ('berths', 'cash_flags', 'sponsors', 'sponsor_placements')]
        RY['anonYes'] = sql("select jsonb_typeof(public.sp_now())", {}, 'anon')
        print(ok(RY['err'][0] == RY['err'][1] and RY['err'][0] < 400 and RY['perf'][0] == RY['perf'][1] and RY['perf'][0] < NP and RY['ev'] == 'big={} small={"x": 1}'
                 and RY['bSeen'] == [1, 0] and RY['bTake'] == 'ok' and RY['bBack'] == 'taken' and all(RY['anonNo']) and all(RY['authYes']) and RY['anonList'] == 'sp_now,tm_error,tm_perf' and all(RY['anonTab']) and RY['anonYes'] == 'array'),
              "without a sign-in the errors and the frame rate stop at a ceiling that grows with the active players; an event's data has a size; a guest's berth gives way to an account and is not shown to it; anon runs only tm_error, tm_perf and sp_now (Ø6 funn 9, 10, 12)", RY)
        # Ø16 (20261105160000_rt_ticket.sql): the real-time relay's ticket. Without the secret in Vault it refuses; with it, a ticket of
        # «1.<id>.<guest>.<expiry>.<nonce>.<hmac>» signed with the secret (checked here as the relay checks it), the public id pos_world
        # gives, the guest flag for a guest, 60 s, a new nonce each time; anon cannot ask, nor a player who is not there
        import hashlib, hmac as _hmac
        RT = {'off': sql("select public.rt_ticket()", A, 'authenticated', expect_err=True)}
        RKEY = '5a' * 32
        sql("insert into vault.decrypted_secrets (name, decrypted_secret) values ('rt_secret', '%s')" % RKEY)
        def rtk(t):
            pay, _, sig = t.rpartition('.'); f = pay.split('.')
            return {'ok': _hmac.compare_digest(_hmac.new(RKEY.encode(), pay.encode(), hashlib.sha256).hexdigest(), sig), 'f': f, 'n': len(t)}
        now_s = int(time.time()); tA, tA2, tG = [rtk(sql("select public.rt_ticket()", w, 'authenticated')) for w in (A, A, G2)]
        RT['a'] = tA; RT['g'] = tG['f'][2]; RT['nonce'] = tA['f'][4] != tA2['f'][4]
        RT['id'] = tA['f'][1] == hashlib.md5(('dsb' + A['sub']).encode()).hexdigest()[:10] == sql("select left(md5('dsb' || '%s'), 10)" % A['sub'])
        RT['exp'] = int(tA['f'][3]) - now_s
        RT['anon'] = sql("select public.rt_ticket()", {}, 'anon', expect_err=True)[0]
        RT['nobody'] = sql("select public.rt_ticket()", {'sub': 'user_01NOPE', 'role': 'authenticated'}, 'authenticated', expect_err=True)[0]
        RT['priv'] = [sql("select has_function_privilege('%s', 'public.rt_ticket()', 'execute')" % r) for r in ('anon', 'authenticated')]
        sql("update vault.decrypted_secrets set decrypted_secret = 'short' where name = 'rt_secret'")
        RT['bad'] = sql("select public.rt_ticket()", A, 'authenticated', expect_err=True)
        print(ok(RT['off'][0] and 'rt off' in RT['off'][1] and tA['ok'] and tA2['ok'] and tG['ok'] and tA['f'][0] == '1' and tA['f'][2] == '0' and RT['g'] == '1' and RT['id'] and RT['nonce']
                 and 58 <= RT['exp'] <= 62 and len(tA['f'][4]) == 16 and tA['n'] < 160 and RT['anon'] and RT['nobody'] and RT['priv'] == ['f', 't'] and RT['bad'][0] and 'rt off' in RT['bad'][1]),
              "the relay's ticket: refused without the secret, signed with it, the public id, the guest flag, 60 s, once; not for anon or a player who is not there (Ø16)", RT)
        # the load of 5 000 players (plan 5b; KYST_LAST=5000): landings and catches for that many players, then what world_get costs
        NL = int(os.environ.get('KYST_LAST') or 0)
        if NL:
            t0 = time.time()
            sql("insert into public.players (id) select 'last_' || g from generate_series(1, %d) g on conflict do nothing" % NL)
            sql("insert into public.landings (player_id, gh, y, port, sp, acc, kg, kgq) select 'last_' || (g %% %d + 1), 1000 + g * 0.01, 2027, 'p' || (g %% 300), case g %% 3 when 0 then 'torsk' when 1 then 'sei' else 'hyse' end, case when g %% 5 = 0 then 'lukket' else 'open' end, 300 + g %% 400, 300 + g %% 400 from generate_series(1, %d) g" % (NL, NL * 40))
            sql("insert into public.reg_held (player_id, id) select 'last_' || g, (array['u7','h7','h8','h9','h10','h14','h20'])[g %% 7 + 1] from generate_series(1, %d) g where g %% 5 = 0 on conflict do nothing" % NL)
            fill = time.time() - t0; sql("analyze")
            t0 = time.time(); k = 20; wg(A)
            for _ in range(k): wg(A)
            per = (time.time() - t0) / k
            t0 = time.time(); [sql("select public.reg_free_counts()") for _ in range(k)]; regs = (time.time() - t0) / k
            parts = {'select1': "select 1", 'open': "select coalesce(sum(s),0) from (select least(sum(l.kgq), 60000) s from landings l where l.y = 2027 and l.acc = 'open' and l.sp = 'torsk' and l.player_id <> 'x' group by l.player_id) a",
                     'boats': "select count(distinct l.player_id) from landings l where l.y = 2027 and l.player_id <> 'x'",
                     'agg_fresh': "update public.world_agg set at = now() - interval '2 minutes'; select public.world_agg_get(2027)", 'agg_cached': "select public.world_agg_get(2027)",
                     'grp': "select count(*) from (select l.acc, l.sp, sum(l.kg) from landings l where l.y = 2027 and l.acc in ('open','lukket') and l.sp in ('torsk','hyse','sei') and l.player_id <> 'x' group by l.acc, l.sp) a",
                     'reg': "select public.reg_free_counts()", 'mkt': "select count(*) from landings l where l.at > now() - interval '1 day'"}
            PT = {}
            for nm, q in parts.items():
                t0 = time.time(); [sql(q) for _ in range(5)]; PT[nm] = round((time.time() - t0) / 5 * 1000, 1)
            # the position every 15 s (20 000 calls a minute with 5 000 players) and what the near boats cost, with 5 000 boats in presence
            sql("insert into public.presence (player_id, x, y, at) select 'last_' || g, 600 + (g %% 100) * 5, 200 + (g / 100) * 10, now() from generate_series(1, %d) g on conflict do nothing" % NL)
            many = lambda q, who, n: (lambda t0: ([sql(q, who, 'authenticated') for _ in range(n)], (time.time() - t0) / n)[1])(time.time())
            PT['pos_put'] = round(many("select public.pos_put(850, 350, 0, 3, 'out', 'Havbris', 'trebat')", A, 5) * 1000, 1)
            PT['pos_near'] = round(many("select public.pos_near(850, 350, 20)", A, 5) * 1000, 1)
            print('LASTPARTS', json.dumps(PT))
            print('LAST', json.dumps({'players': NL, 'landings': NL * 40, 'fill_s': round(fill, 1), 'world_get_ms': round(per * 1000, 1), 'reg_ms': round(regs * 1000, 1),
                  'world_get_per_min_5000': round(NL / 10), 'db_s_per_min': round(NL / 10 * per, 1)}))
    finally:
        run(*as_pg([os.path.join(BIN, 'pg_ctl'), '-D', data, '-m', 'immediate', 'stop']))
        shutil.rmtree(tmp, ignore_errors=True)


main()
