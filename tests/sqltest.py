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
        sql("select public.delete_me()", A, 'authenticated')
        R['deleted'] = sql("select (select count(*) from public.players where id = 'user_01AAA') || '/' || (select count(*) from public.events) || '/' || (select count(*) from public.saves) || '/' || (select coalesce(player_id, 'anon') from public.purchases)")
        # a yes taken back: the sessions, events, device, state and year of birth go, the account and the save stay
        C = {'sub': 'user_01CCC', 'role': 'authenticated'}; sid = '22222222-2222-4222-8222-222222222222'
        sql("select public.tm_hello('{}')", C, 'authenticated'); sql("select public.tm_consent(true, 1985)", C, 'authenticated')
        sql("select public.tm_hello('{\"browser\":\"firefox\",\"tz\":\"Europe/Oslo\"}')", C, 'authenticated'); batch(C)
        sql("select public.save_put('KYST2:CCC', '2026-10-04T10:00:00Z', 5, false)", C, 'authenticated')
        sql("select public.tm_error('TypeError: z', 'core.js:3', '', '{\"sid\":\"%s\"}')" % sid, C, 'authenticated')
        R['withdrawYes'] = sql("select (select count(*) from public.events where player_id = 'user_01CCC') || '/' || (select browser || '/' || birth_year from public.players where id = 'user_01CCC') || '/' || (select count(*) from public.errors where player_id = 'user_01CCC')")
        sql("select public.tm_consent(false, null)", C, 'authenticated')
        R['withdrawNo'] = sql("select (select count(*) from public.events where player_id = 'user_01CCC') || '/' || (select count(*) from public.sessions where player_id = 'user_01CCC') || '/' || (select coalesce(browser, '-') || '/' || coalesce(tz, '-') || '/' || coalesce(boat, '-') || '/' || coalesce(birth_year::text, '-') || '/' || consent from public.players where id = 'user_01CCC') || '/' || (select count(*) from public.errors where player_id = 'user_01CCC') || '/' || (select count(*) from public.saves where player_id = 'user_01CCC')")
        print('sql:', json.dumps({k: v for k, v in R.items() if k not in ('readAnon', 'writePl', 'dashPlayer', 'dashAal1', 'anonDash', 'anonTrunc', 'plTrunc', 'anonSave', 'anonSeq')}, ensure_ascii=False, default=str))
        print(ok(R['hello']['consent'] is None and R['hello']['owned'] == []), 'hello makes the player and says consent is not asked yet')
        print(ok(R['before'] == '0' and R['after'] == '4/240/rage'), 'no consent, nothing stored; with consent the session, its active time, the events and a rage quit are', R['after'])
        print(ok(R['devBefore'] == '-' and R['devAfter'] == 'chrome'), 'the device is stored only with consent (the privacy page)', [R['devBefore'], R['devAfter']])
        print(ok(R['child'] == 'false/-'), 'under 13 a yes does not count as consent (personopplysningsloven § 5), and the year of birth is not kept', R['child'])
        print(ok(R['withdrawYes'] == '2/firefox/1985/1' and R['withdrawNo'] == '0/0/-/-/-/-/false/0/1'), 'taking the yes back deletes the sessions, events, device, state and year of birth and unnames the errors; the save stays', [R['withdrawYes'], R['withdrawNo']])
        print(ok(R['errors'] == '2/0'), 'errors come in also without consent and from the anonymous, and then without a name', R['errors'])
        print(ok(R['save1']['ok'] and not R['save2']['ok'] and R['save3']['ok'] and R['getA']['data'] == 'KYST2:OLD' and R['getB'] is None), 'the cloud save: the newest wins, an older one is refused unless forced, and each sees only his own')
        print(ok(R['readEv'] == '0' and R['readPl'] == '0' and all(R[k][0] for k in ('readAnon', 'writePl', 'dashPlayer', 'dashAal1', 'anonDash'))), 'the lock: a player sees no rows and cannot write a table or open the dashboard, the admin without the second factor is refused, the anonymous too',
              [R[k][1][:50] for k in ('writePl', 'dashPlayer', 'dashAal1')])
        keys = ['overview', 'daily', 'heatmap', 'churn', 'rage', 'features', 'gear', 'boats', 'groundings', 'trips', 'economy', 'money', 'tech', 'geo']
        print(ok(all(k in D for k in keys) and D['overview']['players'] == 2 and D['overview']['sessions'] == 1 and D['rage']['share'] == 1 and D['trips']['avg_kr'] == 5400 and R['adminRead'] == '4'),
              'the admin with aal2 gets every panel of the dashboard and reads the tables', {k: D[k] for k in ('overview', 'rage', 'trips')})
        print(ok(all(R[k][0] for k in ('anonTrunc', 'plTrunc', 'anonSave', 'anonSeq'))), "Supabase's default rights are taken back: no one empties the admin list, and the anonymous call no player function and touch no sequence", [R[k][1][:45] for k in ('anonTrunc', 'plTrunc', 'anonSave', 'anonSeq')])
        print(ok(R['deleted'] == '0/0/0/anon'), 'deleting the account takes the player, the events and the save; the purchase stays without a name for the books', R['deleted'])
    finally:
        run(*as_pg([os.path.join(BIN, 'pg_ctl'), '-D', data, '-m', 'immediate', 'stop']))
        shutil.rmtree(tmp, ignore_errors=True)


main()
