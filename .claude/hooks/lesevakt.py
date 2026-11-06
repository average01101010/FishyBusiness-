"""A4 (docs/planer/verktoy-fra-game-studios.md, Ø17 06.11.2026): the read guard. CLAUDE.md says «read only the part you need; look
it up in the code map and use grep». This makes it hold: a Read of a .md or .js file over 60 KB under docs/ or src/js/ with neither
offset nor limit is refused, and the answer is the file's headings with line numbers (the `#` lines in Markdown, the `// ----------`
sections and the `function` lines in JS), so the next Read takes only the section. A Read with offset or limit always goes through,
so nothing can get stuck. Any failure of its own lets the read through: it prints nothing and exits 0 (exit 2 would block)."""
import json, os, re, sys

LIMIT = 60 * 1024
SHOW = 150      # headings listed at most
WIDE = 160      # a heading line is cut here (view3d has lines thousands of characters long)


def main():
    try: inp = json.loads(sys.stdin.read() or '{}')
    except Exception: return
    ti = inp.get('tool_input') or {}
    path = ti.get('file_path') or ''
    if not path or ti.get('offset') is not None or ti.get('limit') is not None: return
    root = os.environ.get('CLAUDE_PROJECT_DIR') or inp.get('cwd') or os.getcwd()
    full = path if os.path.isabs(path) else os.path.join(inp.get('cwd') or root, path)
    rel = os.path.relpath(os.path.realpath(full), os.path.realpath(root)).replace(os.sep, '/')
    if rel.startswith('../'): return
    md, js = rel.endswith('.md'), rel.endswith(('.js', '.mjs'))
    under = rel.startswith(('docs/', 'src/js/')) or '/docs/' in rel or '/src/js/' in rel   # also in an agent's worktree
    if not (md or js) or not under or not os.path.isfile(full): return
    size = os.path.getsize(full)
    if size <= LIMIT: return
    pat = re.compile(r'^#{1,6} ') if md else re.compile(r'^\s*(?://\s*-{6,}|(?:export\s+)?(?:async\s+)?function\b)')
    heads, n = [], 0
    with open(full, encoding='utf-8', errors='replace') as f:
        for n, line in enumerate(f, 1):
            if pat.match(line): heads.append('%6d: %s' % (n, line.rstrip()[:WIDE]))
    more = len(heads) - SHOW
    why = ['Lesevakten (.claude/hooks/lesevakt.py; CLAUDE.md: «les bare delen du trenger»): %s er %d KB og %d linjer, over grensen på %d KB. '
           'Les med offset og limit, bare delen du trenger, eller finn stedet med grep -n først.%s' %
           (rel, size // 1024, n, LIMIT // 1024, ' Slå også opp i docs/systemer/kodekart.md.' if js else ''),
           ('Overskriftene' if md else 'Seksjonene og funksjonene') + ' med linjenummer%s:' % (' (de første %d av %d)' % (SHOW, len(heads)) if more > 0 else '')]
    why += heads[:SHOW] or ['    (ingen funnet; bruk grep -n)']
    if more > 0: why.append('    … og %d til (grep -n).' % more)
    print(json.dumps({'hookSpecificOutput': {'hookEventName': 'PreToolUse', 'permissionDecision': 'deny',
                                             'permissionDecisionReason': '\n'.join(why)}}, ensure_ascii=False))


try: main()
except Exception: pass
sys.exit(0)
