"""How many haill the players' saves hold, for the cap in haill_import (valg 36 A, HS4, 12.11.2026).

Jonas runs it on his own machine with the key, as tools/saves/fetch.py: a session never has the key and never reads saves. It reads
each save in memory, writes no file and prints only numbers: how many saves hold 0, 1, 2 ... of each kind (S.haillInv.haill and
.luksus, the haill aboard, S.yardCredit), and the largest. No player id, no name, no time.

  SUPABASE_SERVICE_ROLE_KEY=... python3 tools/saves/haill_count.py
"""
import json, os, sys
from collections import Counter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch import get, raw, KEY

def main():
    if not KEY: sys.exit('SUPABASE_SERVICE_ROLE_KEY is not set')
    kinds = {'haill': Counter(), 'luksus': Counter(), 'aboard': Counter(), 'yardCredit': Counter()}
    read = bad = 0
    for r in get('saves?select=player_id,data&order=player_id'):
        try: s = json.loads(raw(r['data']))
        except Exception: bad += 1; continue
        read += 1
        inv = s.get('haillInv') or {}
        num = lambda v: int(v) if isinstance(v, (int, float)) and v == v and v >= 0 else 0
        kinds['haill'][num(inv.get('haill'))] += 1
        kinds['luksus'][num(inv.get('luksus'))] += 1
        kinds['aboard'][(s.get('haill') or {}).get('type') or '-'] += 1
        kinds['yardCredit'][num(s.get('yardCredit'))] += 1
    print('%d saves read, %d unreadable' % (read, bad))
    for k, c in kinds.items():
        print('%-10s %s' % (k, '  '.join('%s: %d' % (v, n) for v, n in sorted(c.items(), key=lambda x: str(x[0]).zfill(8)))))

if __name__ == '__main__': main()
