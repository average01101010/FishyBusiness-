"""The colours of src/styles.css get roles (designombyggingen D1, Jonas 13.11.2026: retning B «Styrhus», docs/planer/design-ombygging.md).

    python3 tools/ui/styrhus.py           -> rewrites src/styles.css in place (run again: nothing changes)
    python3 tools/ui/styrhus.py --dry     -> counts only

Every hard-coded colour in a `color`, `background` or `border` declaration becomes `var(--m-<role>,<the colour it had>)`. The roles are
defined only inside the drawer and the phone's screen (the block «Styrhus» at the end of the stylesheet, written by hand), so outside
them every rule falls back to the colour it has always had, and nothing else on the screen changes. A surface inside them that keeps
its own light look (the newspaper) sets the roles to `initial`, which makes the fallback apply there too.

The role follows from what the colour was for, read from its lightness and hue:
  text:        dark ink -> ink, grey -> muted, a dark green/red/amber/blue (made to be read on white) -> ok/bad/warn/link
  background:  white -> card, light grey -> card2, a light tint -> tint-ok/bad/warn/link, the dark button navy -> dark
  border:      light grey -> line, the dark navy -> dark
Light text (on a coloured or dark fill), mid and saturated fills (the apps' headers, the bars, magenta) stay as they are.
"""
import os, re, sys, colorsys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CSS = os.path.join(ROOT, 'src', 'styles.css')
PROP = re.compile(r'(?<![-\w])(color|background-color|background|border(?:-(?:top|right|bottom|left))?(?:-color)?)\s*:\s*([^;{}]+)')
HEX = re.compile(r'(?<![\w,(-])#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b(?![^()]*\))')   # (not inside var(...), rgba(...) or a gradient's brackets)
HEXG = re.compile(r'#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b')


def hls(h):
    if len(h) == 3: h = ''.join(c * 2 for c in h)
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    hh, l, s = colorsys.rgb_to_hls(r, g, b)
    return hh * 360, l, s


def hue_role(hh):
    if hh < 20 or hh >= 340: return 'bad'
    if hh < 70: return 'warn'
    if hh < 170: return 'ok'
    if hh < 265: return 'link'
    return None                                # (magenta and purple: the accent, kept)


def role(kind, h):
    hh, l, s = hls(h)
    if kind == 'color':
        if l < 0.2: return 'ink'
        if s < 0.3: return 'ink' if l < 0.3 else 'muted' if l < 0.62 else None
        if l < 0.5: return hue_role(hh)
        return None
    if kind == 'background':
        if l > 0.955 and s < 0.6: return 'card'
        if l > 0.8: return 'card2' if s < 0.3 else ('tint-' + hue_role(hh) if hue_role(hh) else None)
        if h.lower() in ('15252f', '16323f', '22323c'): return 'dark'
        return None
    if kind == 'border':
        if l > 0.6 and s < 0.4: return 'line'
        if h.lower() in ('15252f', '16323f', '22323c'): return 'dark'
        if l < 0.5 and s >= 0.3: return hue_role(hh)
        return None


def main():
    dry = '--dry' in sys.argv; src = open(CSS, encoding='utf-8').read()
    cut = src.find('/* ===== Styrhus'); body, tail = (src, '') if cut < 0 else (src[:cut], src[cut:])
    n = {}

    def decl(m):
        prop, val = m.group(1), m.group(2)
        kind = 'color' if prop == 'color' else 'background' if prop.startswith('background') else 'border'
        rx = HEXG if kind == 'background' and 'gradient' in val and 'var(--m-' not in val else HEX

        def one(x):
            if val[max(0, x.start() - 12):x.start()].rstrip().endswith(('var(--m-ink,', 'var(--m-muted,', 'var(--m-card,', 'var(--m-card2,', 'var(--m-line,', 'var(--m-dark,')) or re.search(r'var\(--m-[a-z0-9-]+,\s*$', val[:x.start()]): return x.group(0)
            r = role(kind, x.group(1))
            if not r: return x.group(0)
            n[r] = n.get(r, 0) + 1
            return 'var(--m-%s,%s)' % (r, x.group(0))
        return prop + ':' + rx.sub(one, val)
    out = PROP.sub(decl, body)
    print(', '.join('%s %d' % kv for kv in sorted(n.items())) or 'nothing to change')
    if not dry and out != body: open(CSS, 'w', encoding='utf-8').write(out + tail)


if __name__ == '__main__':
    main()
