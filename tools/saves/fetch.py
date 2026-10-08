"""The players' saves from the account database, for tests/savestest.py (Jonas 08.10.2026: start the game with every real save before it
goes out, so a save that cannot start is caught before a player meets it).

Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (Supabase › Project Settings › API; in GitHub Actions as secrets). Writes each save, and
the last few earlier ones of each player (save_hist), as plain JSON to tests/saves/ (in .gitignore: the players' games never go into the
repository, which is public). The file names are the save's own row, not the player.

  python3 tools/saves/fetch.py            # the saves now
  python3 tools/saves/fetch.py --hist 3   # and up to three earlier ones of each player
"""
import base64, gzip, json, os, sys, urllib.request, hashlib

URL = os.environ.get('SUPABASE_URL') or json.load(open(os.path.join(os.path.dirname(__file__), '../../src/data/cloud.json')))['supabaseUrl']
KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
OUT = os.path.join(os.path.dirname(__file__), '../../tests/saves')

def get(path):
    rq = urllib.request.Request(URL.rstrip('/') + '/rest/v1/' + path, headers={'apikey': KEY, 'Authorization': 'Bearer ' + KEY})
    with urllib.request.urlopen(rq, timeout=60) as r: return json.load(r)

def raw(code):
    if not code or not code.startswith('KYST2:'): return code
    return gzip.decompress(base64.b64decode(code[6:])).decode('utf-8')

def main():
    if not KEY: sys.exit('SUPABASE_SERVICE_ROLE_KEY is not set')
    hist = int(sys.argv[sys.argv.index('--hist') + 1]) if '--hist' in sys.argv else 0
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):
        if f.endswith('.json'): os.remove(os.path.join(OUT, f))
    rows = [('save', r) for r in get('saves?select=player_id,data,updated_at')]
    if hist:
        h = get('save_hist?select=player_id,data,saved_at&order=saved_at.desc')
        per = {}
        for r in h:
            per.setdefault(r['player_id'], [])
            if len(per[r['player_id']]) < hist: per[r['player_id']].append(r)
        rows += [('hist', r) for v in per.values() for r in v]
    n = 0
    for kind, r in rows:
        try: s = raw(r['data']); json.loads(s)
        except Exception as e: print('skipped one', kind, e); continue
        name = kind + '-' + hashlib.sha1((r['player_id'] + (r.get('updated_at') or r.get('saved_at') or '')).encode()).hexdigest()[:10] + '.json'
        open(os.path.join(OUT, name), 'w').write(s); n += 1
    print(n, 'saves in', os.path.normpath(OUT))

if __name__ == '__main__': main()
