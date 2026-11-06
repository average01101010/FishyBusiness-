"""A3 (docs/planer/verktoy-fra-game-studios.md, Ø17 06.11.2026): the commit guard. /lever point 8 says a commit never carries dist/,
dist-vec/ or tests/out/, and never a model name in the message; the three commits before Ø17 all had a Co-Authored-By line with one,
because the harness asks for it in every session. This makes the rule hold: a `git commit` whose message (in -m, in a heredoc or in
the -F file) names a model, or whose index holds the build or the test pictures, is refused with the reason, and the session rewrites.
It runs on every Bash call (about 30 ms) and says nothing unless the command is a commit. Any failure of its own lets the command
through: it prints nothing and exits 0 (exit 2 would block)."""
import json, os, re, subprocess, sys

# a model name: «Claude Opus 5.5», «claude-sonnet-5-5», «Opus 5.5», or any Co-Authored-By line that names Claude. Not «Claude Code»,
# not a branch like claude/u2-3-knappelinja, not the Claude-Session link
MODEL = re.compile(r'(?i)\bclaude[ -](?:opus|sonnet|haiku|fable)\b|\b(?:opus|sonnet|haiku|fable)[ -]\d+(?:[.-]\d+)?\b|co-authored-by:[^\n]*\bclaude\b')
COMMIT = re.compile(r'(?:^|[;&|(]\s*|\s)git\s+(?:-[Cc]\s+\S+\s+)*commit\b')
# a heredoc body is text, not a command: a documentation change in Ø17 that quoted «&& git commit» and a model name was refused before this
HEREDOC = re.compile(r'<<-?\s*([\'"]?)(\w+)\1[^\n]*\n.*?\n\s*\2\s*(?=\n|$)', re.S)
OUT = ('dist/', 'dist-vec/', 'dist-pwa/', 'dist-full/', 'tests/out/')


def main():
    try: inp = json.loads(sys.stdin.read() or '{}')
    except Exception: return
    if inp.get('tool_name') != 'Bash': return
    cmd = (inp.get('tool_input') or {}).get('command') or ''
    shell = HEREDOC.sub(' <<heredoc', cmd)   # the command without the heredoc bodies
    if not COMMIT.search(shell): return
    cwd = inp.get('cwd') or os.getcwd()
    m = re.match(r'\s*cd\s+(["\']?)(\S+?)\1\s*&&', shell)   # «cd <mappe> && git commit …»: the index is there
    if m: cwd = os.path.expanduser(m.group(2))
    m = re.search(r'\s-C\s+(["\']?)(\S+?)\1\s', shell)
    if m: cwd = os.path.join(cwd, os.path.expanduser(m.group(2)))
    text = cmd
    m = re.search(r'(?:-F|--file)[= ]+(["\']?)(?!-)(\S+?)\1(?:\s|$)', cmd)   # the message in a file (not «-F -», which is the heredoc in cmd)
    if m:
        try: text += '\n' + open(os.path.join(cwd, os.path.expanduser(m.group(2))), encoding='utf-8', errors='replace').read()
        except OSError: pass
    why = []
    hits = sorted({h.group(0).strip() for h in MODEL.finditer(text)})
    if hits: why.append('meldingen har modellnavn (%s). /lever punkt 8: ingen modellnavn i meldingen; ta bort Co-Authored-By-linja og navnet, behold Claude-Session-lenka.' % '; '.join(hits)[:200])
    try:
        staged = subprocess.run(['git', 'diff', '--cached', '--name-only'], cwd=cwd, capture_output=True, text=True, timeout=5).stdout.split('\n')
        bad = [f for f in staged if f.startswith(OUT)]
        if bad: why.append('bygget eller testbildene er staget (%s). De er ikke i git: git reset HEAD -- %s' % (', '.join(bad[:6]), ' '.join(bad[:6])))
    except Exception: pass
    if not why: return
    print(json.dumps({'hookSpecificOutput': {'hookEventName': 'PreToolUse', 'permissionDecision': 'deny',
                                             'permissionDecisionReason': 'Commit-vakten (.claude/hooks/commitvakt.py): ' + ' '.join(why)}}, ensure_ascii=False))


try: main()
except Exception: pass
sys.exit(0)
