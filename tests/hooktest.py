"""The session hooks and the deny list in .claude/settings.json (Ø17, 06.11.2026; docs/planer/verktoy-fra-game-studios.md A1, A2, A4).

No browser and no game: each hook script is run as Claude Code runs it, with the JSON it sends on stdin and CLAUDE_PROJECT_DIR set,
and what it prints is checked. A hook that fails must let the tool through and never stop the session (exit 0, nothing on stdout
for the read guard), so both are also run with broken input, a project without git or docs, and no programs on PATH.

The deny rules are matched against commands with the wildcard rules in Claude Code's permission docs (`*` matches anything, a
trailing ` *` also matches nothing, a compound command is checked part by part). That is a model of the matcher, not Claude Code
itself: it catches a rule that is missing or one that would block the normal push to the working branch, not a change in Claude Code."""
import json, os, re, shutil, subprocess, sys, tempfile, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SETTINGS = os.path.join(ROOT, '.claude', 'settings.json')
START = os.path.join(ROOT, '.claude', 'hooks', 'okt-start.sh')
GUARD = os.path.join(ROOT, '.claude', 'hooks', 'lesevakt.py')
LIMIT = 60 * 1024
BASH = shutil.which('bash') or '/bin/bash'   # absolute, so the runs with no PATH still start the shell Claude Code starts


def ok(cond, what, extra=''):
    print(('OK   ' if cond else 'FEIL ') + what + ((': ' + extra) if extra else ''), flush=True)
    return cond


def hook(cmd, payload, project=ROOT, env=None, timeout=20):
    """Run a hook command as Claude Code does: through bash, the JSON on stdin, CLAUDE_PROJECT_DIR set. Returns (code, out, err, s)."""
    e = dict(os.environ, CLAUDE_PROJECT_DIR=project)
    if env: e.update(env)
    t0 = time.time()
    try:
        p = subprocess.run([BASH, '-c', cmd], input=payload if isinstance(payload, str) else json.dumps(payload),
                           capture_output=True, text=True, timeout=timeout, env=e, cwd=project)
        return p.returncode, p.stdout, p.stderr, time.time() - t0
    except subprocess.TimeoutExpired:
        return 'tid', '', '', time.time() - t0


# ---------- the settings file ----------
try:
    S = json.load(open(SETTINGS))
    ok(True, 'settings.json er gyldig JSON')
except Exception as ex:
    ok(False, 'settings.json er gyldig JSON', str(ex)[:200]); S = {}
H = S.get('hooks', {})


def cmds(event, matcher=None):
    return [h.get('command', '') for g in H.get(event, []) if matcher is None or g.get('matcher') == matcher for h in g.get('hooks', [])
            if h.get('type') == 'command']


start_cmd = next((c for c in cmds('SessionStart') if 'okt-start.sh' in c), '')
guard_cmd = next((c for c in cmds('PreToolUse', 'Read') if 'lesevakt.py' in c), '')
commit_cmd = next((c for c in cmds('PreToolUse', 'Bash') if 'commitvakt.py' in c), '')
COMMIT = os.path.join(ROOT, '.claude', 'hooks', 'commitvakt.py')
ok(bool(start_cmd), 'SessionStart kjører okt-start.sh', start_cmd)
# no matcher, so it runs at startup, resume, clear and after every compaction (source "compact")
ok(all(not g.get('matcher') for g in H.get('SessionStart', [])), 'SessionStart uten matcher (også etter komprimering)')
ok(bool(guard_cmd), 'PreToolUse på Read kjører lesevakt.py', guard_cmd)
ok(bool(commit_cmd), 'PreToolUse på Bash kjører commitvakt.py', commit_cmd)
ok(os.path.exists(COMMIT), 'commitvakt.py finnes')
ok(all(h.get('onFailure', 'continue') == 'continue' for ev in H.values() for g in ev for h in g.get('hooks', [])),
   'ingen hook har onFailure: block (en hook som feiler, slipper verktøyet gjennom)')
ok(os.path.exists(START) and os.access(START, os.X_OK), 'okt-start.sh finnes og kan kjøres')
ok(os.path.exists(GUARD), 'lesevakt.py finnes')

# ---------- A1: the deny list ----------
deny = S.get('permissions', {}).get('deny', [])
bash_rules = [r[5:-1] for r in deny if r.startswith('Bash(') and r.endswith(')')]


def rx(rule):
    if rule.endswith(':*'): rule = rule[:-2] + ' *'   # the old prefix form
    tail = rule.endswith(' *')
    body = re.escape(rule[:-2] if tail else rule).replace(r'\*', '.*')
    return re.compile('^' + body + ('(?: .*)?' if tail else '') + '$', re.S)


RX = [rx(r) for r in bash_rules]


def denied(command):
    parts = [p.strip() for p in re.split(r'&&|\|\||;|\|', command) if p.strip()]
    return any(any(r.match(p) for r in RX) for p in parts)


MUST_DENY = ['git push --force origin ccr-5e1ba2f4-pusvyd', 'git push -f origin ccr-5e1ba2f4-pusvyd', 'git push origin ccr-5e1ba2f4-pusvyd --force',
             'git push --force-with-lease origin ccr-5e1ba2f4-pusvyd', 'git push origin +HEAD:ccr-5e1ba2f4-pusvyd',
             'git push origin main', 'git push -u origin main', 'git push origin HEAD:main', 'git push origin refs/heads/main',
             'git reset --hard', 'git reset --hard origin/ccr-5e1ba2f4-pusvyd', 'git clean -f', 'git clean -fd', 'git clean -xdf',
             'rm -rf dist', 'rm -fr tests/out', 'rm -Rf src', 'sudo apt-get install -y jq',
             'cd /home/user/FishyBusiness- && git push --force origin ccr-5e1ba2f4-pusvyd']
MUST_ALLOW = ['git push -u origin ccr-5e1ba2f4-pusvyd', 'git push origin HEAD:ccr-5e1ba2f4-pusvyd', 'git push -u origin ccr-d22aebce-865bcx',
              'git push -u origin fb/auto-2026-11-06-main-fix', 'git reset --soft HEAD~1', 'git reset HEAD tests/historikk.tsv', 'git clean -n',
              'rm -r dist-vec', 'rm -f tests/out/x.png', 'git status', 'git fetch origin ccr-5e1ba2f4-pusvyd',
              'git merge-base --is-ancestor origin/ccr-5e1ba2f4-pusvyd HEAD']
miss = [c for c in MUST_DENY if not denied(c)]
over = [c for c in MUST_ALLOW if denied(c)]
ok(bool(bash_rules) and not miss, 'deny-lista nekter %d farlige kommandoer' % len(MUST_DENY), 'slipper gjennom: ' + '; '.join(miss) if miss else '')
ok(bool(bash_rules) and not over, 'deny-lista slipper gjennom %d vanlige (pushen til arbeidsgrenen, soft reset, rm -r)' % len(MUST_ALLOW),
   'nekter: ' + '; '.join(over) if over else '')
for tool in ('Read', 'Edit'):
    have = [r for r in deny if r.startswith(tool + '(') and '.env' in r]
    ok(any('**/.env' in r or './.env' == r[len(tool) + 1:-1] for r in have) and any('.env.' in r for r in have), '%s av .env og .env.* nektes' % tool, ', '.join(have))

# ---------- A2: the session start ----------
if start_cmd:
    for src in ('startup', 'compact'):
        code, out, err, dt = hook(start_cmd, {'hook_event_name': 'SessionStart', 'source': src, 'session_id': 'test'})
        need = ['Gren:', 'Siste commits', 'Spillarbeid som venter', 'Hele kysten', 'dist/']
        lack = [n for n in need if n not in out]
        ok(code == 0 and not lack, 'øktstarten (%s) skriver gren, commits, backloggen, kysten og dist/' % src, 'kode %s, mangler %s, stderr %s' % (code, lack, err[:200]) if code or lack else '%.2f s, %d linjer' % (dt, len(out.splitlines())))
        ok(dt < 5, 'øktstarten (%s) under 5 s' % src, '%.2f s' % dt)
    ok('komprimer' in hook(start_cmd, {'source': 'compact'})[1].lower(), 'etter en komprimering sier øktstarten det')
    # it must never stop a session: not a git repo, no docs, garbage on stdin, no programs on PATH
    tmp = tempfile.mkdtemp(); shutil.copytree(os.path.dirname(START), os.path.join(tmp, '.claude', 'hooks'))   # the scripts, nothing else
    for what, payload, env, project in (('i en mappe uten git og docs', {'source': 'startup'}, None, tmp),
                                        ('med søppel på stdin', 'ikke json {', None, ROOT),
                                        ('uten programmer på PATH', {'source': 'startup'}, {'PATH': '/nonexistent'}, ROOT)):
        code, out, err, dt = hook(start_cmd, payload, project=project, env=env)
        ok(code == 0 and dt < 5, 'øktstarten %s ender med kode 0' % what, 'kode %s, %.2f s' % (code, dt))
    shutil.rmtree(tmp, ignore_errors=True)
    os.makedirs(os.path.join(ROOT, 'tests', 'out'), exist_ok=True)
    open(os.path.join(ROOT, 'tests', 'out', 'hooktest-okt-start.txt'), 'w').write(hook(start_cmd, {'source': 'startup'})[1])

# ---------- A4: the read guard ----------


def guard(path, project=ROOT, env=None, **extra):
    inp = dict({'hook_event_name': 'PreToolUse', 'tool_name': 'Read', 'tool_input': dict({'file_path': path}, **extra), 'cwd': project})
    return hook(guard_cmd, inp, project=project, env=env)


def decision(out):
    try: return json.loads(out)['hookSpecificOutput']
    except Exception: return None


if guard_cmd:
    big_md = os.path.join(ROOT, 'docs', 'BACKLOG.md')
    big_js = os.path.join(ROOT, 'src', 'js', 'vessel3d.js')
    small = os.path.join(ROOT, 'docs', 'INDEKS.md')   # read whole at the start of every session
    code, out, err, dt = guard(big_md)
    d = decision(out) or {}
    why = d.get('permissionDecisionReason', '')
    ok(code == 0 and d.get('permissionDecision') == 'deny' and d.get('hookEventName') == 'PreToolUse',
       'lesevakten nekter docs/BACKLOG.md uten offset og limit (%d KB)' % (os.path.getsize(big_md) // 1024), 'kode %s, %s' % (code, out[:200]))
    ok(re.search(r'^\s*5: ## Spillarbeid som venter', why, re.M) is not None, 'svaret har overskriftene med linjenummer', why[:300].replace('\n', ' | '))
    ok(dt < 1.5, 'lesevakten under 1,5 s', '%.2f s' % dt)
    open(os.path.join(ROOT, 'tests', 'out', 'hooktest-lesevakt.txt'), 'w').write(why)
    d = decision(guard(big_js)[1]) or {}
    why = d.get('permissionDecisionReason', '')
    ok(d.get('permissionDecision') == 'deny' and re.search(r'^\s*\d+: // -{6,}', why, re.M) and re.search(r'^\s*\d+: .*function ', why, re.M)
       and 'kodekart' in why, 'lesevakten nekter src/js/vessel3d.js og viser seksjonene, funksjonene og kodekartet', why[:200].replace('\n', ' | '))
    d3 = decision(guard(os.path.join(ROOT, 'src', 'js', 'view3d', max(os.listdir(os.path.join(ROOT, 'src', 'js', 'view3d')),
                                                                 key=lambda f: os.path.getsize(os.path.join(ROOT, 'src', 'js', 'view3d', f)))))[1]) or {}
    lines = [l for l in d3.get('permissionDecisionReason', '').splitlines() if re.match(r'^\s*\d+: ', l)]
    ok(lines and all(len(l) <= 170 for l in lines), 'overskriftslinjene er kuttet (view3d har linjer på tusenvis av tegn)', '%d linjer, lengste %d' % (len(lines), max(map(len, lines or ['']))))
    for what, args in (('med offset', dict(offset=5, limit=180)), ('med bare limit', dict(limit=50)), ('med bare offset', dict(offset=400))):
        code, out, err, dt = guard(big_md, **args)
        ok(code == 0 and not out.strip(), 'lesevakten slipper gjennom %s' % what, 'kode %s, %s' % (code, out[:120]))
    code, out, _, _ = guard(small)
    ok(code == 0 and not out.strip() and os.path.getsize(small) <= LIMIT, 'lesevakten slipper gjennom en fil under grensen (%s, %d KB)' % (os.path.relpath(small, ROOT), os.path.getsize(small) // 1024))
    # a project of its own, so nothing is written in the repo: big files outside docs/ and src/js/, and pictures in docs/
    tmp = tempfile.mkdtemp(); shutil.copytree(os.path.dirname(GUARD), os.path.join(tmp, '.claude', 'hooks'))
    for rel in ('docs/big.md', 'docs/shot.png', 'src/data/big.json', 'tools/big.md', 'src/js/core/big.js'):
        os.makedirs(os.path.dirname(os.path.join(tmp, rel)), exist_ok=True)
        open(os.path.join(tmp, rel), 'w').write('# Big\n' + 'x' * 80 + '\n' * 1 + ('## Del\n' + 'y' * 100 + '\n') * 700)
    res = {rel: decision(guard(os.path.join(tmp, rel), project=tmp)[1]) for rel in ('docs/big.md', 'docs/shot.png', 'src/data/big.json', 'tools/big.md', 'src/js/core/big.js')}
    ok(res['docs/big.md'] and res['src/js/core/big.js'] and not res['docs/shot.png'] and not res['src/data/big.json'] and not res['tools/big.md'],
       'lesevakten gjelder bare .md og .js under docs/ og src/js/ (bilder og data går gjennom)', json.dumps({k: bool(v) for k, v in res.items()}))
    # it must never stop a read: broken input, a file that is not there, no python on PATH
    for what, payload, env in (('med søppel på stdin', 'ikke json {', None), ('med tom stdin', '', None),
                               ('uten file_path', {'tool_name': 'Read', 'tool_input': {}}, None),
                               ('for en fil som ikke finnes', {'tool_name': 'Read', 'tool_input': {'file_path': os.path.join(ROOT, 'docs', 'finnes-ikke.md')}}, None),
                               ('uten python på PATH', {'tool_name': 'Read', 'tool_input': {'file_path': big_md}}, {'PATH': '/nonexistent'})):
        code, out, err, dt = hook(guard_cmd, payload, env=env)
        ok(code != 2 and not out.strip(), 'lesevakten %s slipper lesingen gjennom (kode %s, aldri 2)' % (what, code), err.strip()[-160:])
    shutil.rmtree(tmp, ignore_errors=True)

# ---------- A3: the commit guard ----------


def commit(command, project=ROOT, env=None, tool='Bash'):
    return hook(commit_cmd, {'hook_event_name': 'PreToolUse', 'tool_name': tool, 'tool_input': {'command': command}, 'cwd': project}, project=project, env=env)


if commit_cmd:
    for what, c in (('Co-Authored-By med modellnavn', 'git commit -m "Fix" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"'),
                    ('modellnavn i en heredoc', "cd %s && git commit -q -F - <<'EOF'\nØ17: hooks\n\nClaude-Session: https://claude.ai/code/x\nCo-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>\nEOF" % ROOT),
                    ('modell-ID i meldingen', 'git commit --amend -m "written by claude-sonnet-5-5"'),
                    ('git -C og modellnavn', 'git -C %s commit -m "Opus 5.5 did this"' % ROOT)):
        code, out, err, dt = commit(c)
        d = decision(out) or {}
        ok(code == 0 and d.get('permissionDecision') == 'deny' and 'modellnavn' in d.get('permissionDecisionReason', ''), 'commit-vakten nekter %s' % what, 'kode %s, %s %s' % (code, out[:160], err[-120:]))
    ok(dt < 1.5, 'commit-vakten under 1,5 s', '%.2f s' % dt)
    open(os.path.join(ROOT, 'tests', 'out', 'hooktest-commitvakt.txt'), 'w').write(d.get('permissionDecisionReason', ''))
    msgf = os.path.join(tempfile.mkdtemp(), 'melding.txt'); open(msgf, 'w').write('Fix\n\nCo-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>\n')
    ok((decision(commit('git commit -F %s' % msgf)[1]) or {}).get('permissionDecision') == 'deny', 'commit-vakten leser meldingsfila (-F) og nekter modellnavn der')
    for what, c in (('en vanlig melding som nevner grenen claude/u2-3', 'git commit -q -m "Flett inn claude/u2-3-knappelinja-felp6h i arbeidsgrenen"'),
                    ('en melding med Claude-Session-lenka', "git commit -F - <<'EOF'\nØ17: hooks\n\nClaude-Session: https://claude.ai/code/session_013\nEOF"),
                    ('git status (ikke en commit)', 'git status --short'), ('git push (ikke en commit)', 'git push -u origin ccr-5e1ba2f4-pusvyd'),
                    ('en doku-endring som nevner «&& git commit» og et modellnavn i en heredoc', "cd %s && python3 - <<'EOF'\nprint('cd x && git commit -m ok; Claude Opus 5.5')\nEOF" % ROOT)):
        code, out, err, dt = commit(c)
        ok(code == 0 and not out.strip(), 'commit-vakten slipper gjennom %s' % what, 'kode %s, %s' % (code, out[:160]))
    ok(not commit('git commit -m "Co-Authored-By: Claude Opus 5.5"', tool='Read')[1].strip(), 'commit-vakten ser bare på Bash')
    # a repo of its own with the build staged by force (dist/ is in .gitignore, so it takes -f)
    tmp = tempfile.mkdtemp(); shutil.copytree(os.path.dirname(COMMIT), os.path.join(tmp, '.claude', 'hooks'))
    subprocess.run(['git', 'init', '-q'], cwd=tmp, capture_output=True)
    for rel in ('dist/index.html', 'tests/out/x.png', 'src/ok.js'):
        os.makedirs(os.path.dirname(os.path.join(tmp, rel)), exist_ok=True); open(os.path.join(tmp, rel), 'w').write('x')
    subprocess.run(['git', 'add', '-f', 'dist/index.html', 'tests/out/x.png', 'src/ok.js'], cwd=tmp, capture_output=True)
    d = decision(commit('git commit -m "ok"', project=tmp)[1]) or {}
    ok(d.get('permissionDecision') == 'deny' and 'dist/index.html' in d.get('permissionDecisionReason', '') and 'tests/out/x.png' in d.get('permissionDecisionReason', ''),
       'commit-vakten nekter en commit med dist/ og tests/out/ staget', d.get('permissionDecisionReason', '')[:160])
    ok((decision(commit('cd %s && git commit -m "ok"' % tmp)[1]) or {}).get('permissionDecision') == 'deny', 'commit-vakten følger cd <mappe> && git commit')
    subprocess.run(['git', 'reset', '-q', '--', 'dist/index.html', 'tests/out/x.png'], cwd=tmp, capture_output=True)
    ok(not commit('git commit -m "ok"', project=tmp)[1].strip(), 'commit-vakten slipper gjennom når bare src/ok.js er staget')
    shutil.rmtree(tmp, ignore_errors=True)
    # it must never stop a commit by itself
    tmp = tempfile.mkdtemp(); shutil.copytree(os.path.dirname(COMMIT), os.path.join(tmp, '.claude', 'hooks'))
    for what, payload, env, project in (('med søppel på stdin', 'ikke json {', None, ROOT), ('uten tool_input', {'tool_name': 'Bash'}, None, ROOT),
                                        ('i en mappe uten git', {'tool_name': 'Bash', 'tool_input': {'command': 'git commit -m "ok"'}, 'cwd': tmp}, None, tmp),
                                        ('uten python på PATH', {'tool_name': 'Bash', 'tool_input': {'command': 'git commit -m "Claude Opus 5.5"'}}, {'PATH': '/nonexistent'}, ROOT)):
        code, out, err, dt = hook(commit_cmd, payload, project=project, env=env)
        ok(code != 2 and not out.strip(), 'commit-vakten %s slipper kommandoen gjennom (kode %s, aldri 2)' % (what, code), err.strip()[-160:])
    shutil.rmtree(tmp, ignore_errors=True)
