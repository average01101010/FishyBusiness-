# The code map (docs/utviklingsplan.md, fase A5): docs/systemer/kodekart.md lists, for every JavaScript file of the game, its section
# comments and its functions with line numbers, so a session can find where something lives without reading a 6 000-line file.
#   python3 tools/docs/kodekart.py            writes docs/systemer/kodekart.md
#   python3 tools/docs/kodekart.py --check    exits 1 when the map is stale (run by /lever)
# Sections are the comment lines '// ===== … =====', '// ---------- … ----------' and '// --- …'; functions are 'function name(' at the
# top level or one level in (view3d.js and vessel3d.js wrap everything in one function). Line numbers go stale with every edit, so
# the map is written again by /lever; the names and the order are what matter.
import os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'docs', 'systemer', 'kodekart.md')
HDR = re.compile(r'^\s*// (?:={5,}|-{3,}) ?(.*?)\s*(?:={5,}|-{3,})?\s*$')
FN = re.compile(r'^(\s{0,2})(?:async )?function\s+(\w+)\s*\(([^)]*)\)')
IIFE = {'src/js/view3d.js', 'src/js/vessel3d.js'}
# the pieces of view3d.js (src/js/view3d/) and of the phone (src/js/ui/phone/) are one function's body each (E1, 26.10.2026)
iife = lambda f: f in IIFE or f.startswith('src/js/view3d/') or f.startswith('src/js/ui/phone/')

def files():
    # the order of the template, which is the order the browser sees
    tpl = open(os.path.join(ROOT, 'src', 'index.html'), encoding='utf-8').read()
    out = []
    for m in re.finditer(r'@include\(([^)]+\.js)\)', tpl):
        p = m.group(1)
        if p.startswith('data/') or p.startswith('js/lib/') or p.startswith('vendor/'): continue   # not the libraries
        f = 'src/' + p
        if f not in out and os.path.exists(os.path.join(ROOT, f)): out.append(f)
    return out

def build():
    L = ['# Kodekart', '', 'Seksjonene og funksjonene i hver kildefil, med linjenummer, i rekkefølgen malen setter dem sammen i (`src/index.html`). Lages av `python3 tools/docs/kodekart.py` og skrives på nytt av `/lever`, så linjenumrene kan være litt gamle; navnene og rekkefølgen stemmer. Slå opp her og bruk `grep` i stedet for å lese en stor fil hel.', '']
    for f in files():
        lines = open(os.path.join(ROOT, f), encoding='utf-8').read().split('\n')
        first = lines[0].strip() if lines and lines[0].lstrip().startswith('//') else ''
        first = re.sub(r'^//\s*(?:={5,}\s*)?', '', first).rstrip('= ').strip()
        L.append('## `%s` (%d linjer)' % (f, len(lines)))
        if first: L.append('')
        if first: L.append(first[:220])
        L.append('')
        n = 0
        for i, s in enumerate(lines, 1):
            m = HDR.match(s)
            if m and len(m.group(1).strip()) > 2:
                L.append('- **%d** %s' % (i, m.group(1)[:160])); n += 1; continue
            m = FN.match(s)
            if m and (not m.group(1) or iife(f)):
                args = m.group(3).strip(); L.append('  - %d `%s(%s)`' % (i, m.group(2), args[:60] + ('…' if len(args) > 60 else ''))); n += 1
        if not n: L.append('- (ingen seksjoner eller funksjoner på toppnivå)')
        L.append('')
    return '\n'.join(L).rstrip('\n') + '\n'

if __name__ == '__main__':
    text = build()
    if '--check' in sys.argv:
        old = open(OUT, encoding='utf-8').read() if os.path.exists(OUT) else ''
        if old != text: print('kodekart.md er ikke ferskt: kjør python3 tools/docs/kodekart.py'); sys.exit(1)
        print('kodekart.md er ferskt'); sys.exit(0)
    open(OUT, 'w', encoding='utf-8').write(text)
    print(OUT, text.count('\n'), 'linjer')
