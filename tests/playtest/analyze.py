"""Measurements from a playtest run, from the hidden observer's files (the tester never sees these).

Usage: python3 tests/playtest/analyze.py r1 [--obs /root/playtest-obs]
Writes <obs>/<run>/metrics.json and prints a summary per phase (spill, knekk).
"""
import argparse, collections, glob, json, os, re

GAME_RATE = 6  # game minutes per real minute at normal pace


def load_jsonl(p):
    out = []
    if os.path.exists(p):
        for line in open(p):
            try:
                out.append(json.loads(line))
            except Exception:
                pass
    return out


def fmt_h(sec):
    m = int(round(sec / 60))
    return '%d t %02d min' % (m // 60, m % 60)


def latest_snap(obs):
    snaps = sorted(glob.glob(os.path.join(obs, 'snap', '*.json')), key=os.path.getmtime)
    for p in reversed(snaps):
        try:
            return json.load(open(p)), p
        except Exception:
            continue
    return None, None


def phase_metrics(rows):
    if not rows:
        return {}
    first, last = rows[0], rows[-1]
    m = {}
    m['kommandoer'] = len(rows)
    m['handlinger'] = sum(1 for r in rows if r['cmd'] not in ('dagbok', 'bilde', 'tekst', 'hjelp'))
    m['ekte_tid'] = fmt_h(last['w'] - first['w'])
    hum = last.get('hum', 0) - (first.get('hum', 0) - 0)
    m['menneskelig_tid'] = fmt_h(hum)
    m['borte_tid'] = fmt_h(last.get('away', 0) - first.get('away', 0))
    b, a = first.get('before') or {}, last.get('after') or {}
    if 't' in b and 't' in a:
        m['spilltid'] = fmt_h((a['t'] - b['t']) * 60)
        m['spilltid_fra_til'] = [b.get('clock'), a.get('clock')]
    m['kontanter_fra_til'] = [b.get('cash'), a.get('cash')]
    cash = [r['after'].get('cash') for r in rows if isinstance((r.get('after') or {}).get('cash'), (int, float))]
    if cash:
        m['kontanter_min_max'] = [min(cash), max(cash)]
    m['turer_kg_omsetning'] = [a.get('trips'), a.get('kg'), a.get('rev')]
    m['båt_flåte_eide_lisens'] = [a.get('boat'), a.get('fleet'), a.get('owned'), a.get('lic')]
    m['mannskap_redskap_i_sjøen'] = [a.get('crew'), a.get('sets')]
    m['lån'] = a.get('loan')
    # commands
    m['per_kommando'] = dict(collections.Counter(r['cmd'] for r in rows).most_common())
    # coverage: game actions and phone apps actually tapped
    acts, apps, pa = collections.Counter(), collections.Counter(), collections.Counter()
    miss, notfound = 0, 0
    for r in rows:
        h = r.get('hit') or {}
        act = h.get('act') or {}
        d = act.get('data') or {}
        if r['cmd'] == 'trykk' and r.get('ok'):
            if not act and not h.get('pointer'):
                miss += 1
            if d.get('act'):
                acts[d['act']] += 1
            if d.get('pa') == 'open' and d.get('a'):
                apps[d['a']] += 1
            elif d.get('pa'):
                pa[d['pa']] += 1
        if r.get('find') is not None and not (r['find'].get('hits')):
            notfound += 1
    m['spillhandlinger_brukt'] = dict(acts.most_common())
    m['apper_åpnet'] = dict(apps.most_common())
    m['telefonknapper'] = dict(pa.most_common(25))
    m['bomtrykk'] = miss
    m['tekst_ikke_funnet'] = notfound
    m['ugyldige_kommandoer'] = sum(1 for r in rows if not r.get('ok'))
    # statuses seen
    m['statuser'] = dict(collections.Counter((r.get('after') or {}).get('st') for r in rows).most_common())
    m['tempo_brukt'] = sorted({(r.get('after') or {}).get('mult') for r in rows} - {None})
    m['omlastinger'] = sum(1 for r in rows if r['cmd'] == 'lastinn')
    m['snudd'] = sum(1 for r in rows if r['cmd'] == 'snu')
    # repeated identical commands in a row (farming or being stuck)
    streak, best, prev = 0, (0, None), None
    for r in rows:
        key = (r['cmd'], tuple(r.get('args') or []))
        streak = streak + 1 if key == prev else 1
        prev = key
        if streak > best[0]:
            best = (streak, ' '.join([r['cmd']] + list(r.get('args') or [])))
    m['lengste_gjentakelse'] = best
    # cash jumps between commands
    jumps = []
    for r in rows:
        c0, c1 = (r.get('before') or {}).get('cash'), (r.get('after') or {}).get('cash')
        if isinstance(c0, (int, float)) and isinstance(c1, (int, float)) and abs(c1 - c0) >= 20000:
            jumps.append({'n': r['n'], 'cmd': r['cmd'], 'args': r.get('args'), 'fra': c0, 'til': c1})
    m['kontanthopp'] = jumps[:30]
    return m


def game_metrics(S):
    if not S:
        return {}
    g = {}
    log = S.get('log') or []
    msgs = S.get('msgs') or []
    txt = [(e.get('t'), e.get('no') or '') for e in log]
    def count(pat):
        rx = re.compile(pat, re.I)
        return sum(1 for _, t in txt if rx.search(t))
    def grab(pat, n=8):
        rx = re.compile(pat, re.I)
        return [t for _, t in txt if rx.search(t)][:n]
    g['grunnstøtinger'] = [i for i in (S.get('incidents') or []) if i.get('k') == 'aground']
    g['logg_grunn_slep_redning'] = grab(r'grunn|slep|redning|kystverket|sjøredning', 12)
    g['motorstopp_tom'] = grab(r'motorstopp|tom for (drivstoff|bensin|diesel)|drivende', 10)
    g['snudd_vær'] = grab(r'snur|returnerer|utsatt en time|for mye (vind|sjø)', 10)
    g['inndragning_meldinger'] = [m.get('no') for m in msgs if re.search(r'inndr|gebyr|bot\b', m.get('no') or '', re.I)]
    g['kvote_full_logg'] = count(r'kvoten er full')
    g['kveite'] = grab(r'kveite', 10)
    g['fjordlinja'] = grab(r'fjordlinj', 10)
    g['ferskfisk'] = grab(r'ferskfisk', 10)
    g['hvile'] = grab(r'hvile|fri\b|sliten', 10)
    g['tapt_redskap'] = grab(r'tapt|kystvakten|revet', 10)
    sales = S.get('sales') or []
    g['landinger'] = len(sales)
    g['landet_kg_kr'] = [sum(s.get('kg', 0) for s in sales), sum(s.get('total', 0) for s in sales)]
    per = collections.Counter()
    for s in sales:
        for sp, kg in s.get('sp') or []:
            per[sp] += kg
    g['kg_per_art'] = dict(per.most_common())
    g['mottak'] = dict(collections.Counter(s.get('port') for s in sales).most_common())
    g['utstyr'] = S.get('equip')
    g['eide_båter'] = S.get('owned')
    g['lisens'] = S.get('lic')
    g['mannskap'] = [{'navn': c.get('name'), 'lott': c.get('share')} for c in (S.get('crew') or [])]
    g['redskap_i_sjøen'] = len(S.get('sets') or [])
    g['pgear'] = S.get('pgear')
    g['stats'] = S.get('stats')
    g['meldinger_fra'] = dict(collections.Counter(m.get('from') for m in msgs).most_common())
    g['tatoveringer'] = list((S.get('tattoos') or {}).keys())
    g['lore'] = list((S.get('lore') or {}).keys())[:20]
    return g


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('run')
    ap.add_argument('--obs', default='/root/playtest-obs')
    a = ap.parse_args()
    obs = os.path.join(a.obs, a.run)
    rows = load_jsonl(os.path.join(obs, 'cmd.jsonl'))
    by = collections.OrderedDict()
    for r in rows:
        by.setdefault(r.get('phase', 'spill'), []).append(r)
    S, sp = latest_snap(obs)
    out = {'run': a.run, 'faser': {k: phase_metrics(v) for k, v in by.items()}, 'spillet': game_metrics(S), 'snapshot': sp,
           'sidefeil': [e for e in load_jsonl(os.path.join(obs, 'errors.jsonl')) if e.get('kind') == 'pageerror'],
           'konsollfeil': len([e for e in load_jsonl(os.path.join(obs, 'errors.jsonl')) if e.get('kind') == 'console']),
           'tempo_hendelser': load_jsonl(os.path.join(obs, 'events.jsonl')),
           'dagbok_notater': len(load_jsonl(os.path.join(obs, 'diary.jsonl')))}
    json.dump(out, open(os.path.join(obs, 'metrics.json'), 'w'), ensure_ascii=False, indent=1)
    print(json.dumps(out, ensure_ascii=False, indent=1)[:12000])


if __name__ == '__main__':
    main()
