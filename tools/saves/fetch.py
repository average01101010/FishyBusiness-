"""The players' saves from the account database, for tests/savestest.py (Jonas 08.10.2026: start the game with every real save before it
goes out, so a save that cannot start is caught before a player meets it).

Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (Supabase › Project Settings › API; in GitHub Actions as secrets). Writes each save, and
the last few earlier ones of each player (save_hist), as plain JSON to tests/saves/ (in .gitignore: the players' games never go into the
repository, which is public), or to the folder --out names (the release job: "$RUNNER_TEMP/saves", deleted when the job ends).

A file is named by the save's fingerprint, the first 8 characters of the sha256 of the save (L1c, 11.11.2026): the same as
tests/savestest.py prints, and nothing of the player's (no id, no name, no time). Two rows with the same save are one file. Nothing but
the number of saves is printed.

  python3 tools/saves/fetch.py                  # the saves now
  python3 tools/saves/fetch.py --hist 3         # and up to three earlier ones of each player
  python3 tools/saves/fetch.py --out <folder>   # there, not in tests/saves/
  python3 tools/saves/fetch.py --find 1a2b3c4d  # whose save the gate stopped on: the row behind a fingerprint (player id and time).
                                                # Writes no file, and refuses in GitHub Actions: the answer is for Jonas' own screen
"""
import base64, gzip, json, os, sys, urllib.request, hashlib

URL = os.environ.get('SUPABASE_URL') or json.load(open(os.path.join(os.path.dirname(__file__), '../../src/data/cloud.json')))['supabaseUrl']
KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
arg = lambda k: sys.argv[sys.argv.index(k) + 1] if k in sys.argv and sys.argv.index(k) + 1 < len(sys.argv) else None
OUT = arg('--out') or os.path.join(os.path.dirname(__file__), '../../tests/saves')
fp = lambda s: hashlib.sha256(s.encode('utf-8')).hexdigest()[:8]

def get(path):
    # a thousand rows at a time (PostgREST gives no more in one answer, and says nothing about the rest)
    out = []
    while True:
        rq = urllib.request.Request(URL.rstrip('/') + '/rest/v1/' + path + '&limit=1000&offset=%d' % len(out), headers={'apikey': KEY, 'Authorization': 'Bearer ' + KEY})
        with urllib.request.urlopen(rq, timeout=60) as r: page = json.load(r)
        out += page
        if len(page) < 1000: return out

def raw(code):
    if not code or not code.startswith('KYST2:'): return code
    return gzip.decompress(base64.b64decode(code[6:])).decode('utf-8')

def main():
    if not KEY: sys.exit('SUPABASE_SERVICE_ROLE_KEY is not set')
    find = arg('--find')
    if find and os.environ.get('GITHUB_ACTIONS'): sys.exit('--find is not for a job: its answer names a player, and the log is public')
    hist = int(arg('--hist') or 0) or (3 if find else 0)
    rows = [('save', r) for r in get('saves?select=player_id,data,updated_at')]
    if hist:
        h = get('save_hist?select=player_id,data,saved_at&order=saved_at.desc')
        per = {}
        for r in h:
            per.setdefault(r['player_id'], [])
            if len(per[r['player_id']]) < hist: per[r['player_id']].append(r)
        rows += [('hist', r) for v in per.values() for r in v]
    if not find:
        os.makedirs(OUT, exist_ok=True)
        for f in os.listdir(OUT):
            if f.endswith('.json'): os.remove(os.path.join(OUT, f))
    seen, skipped = set(), 0
    for kind, r in rows:
        try: s = raw(r['data']); json.loads(s)
        except Exception: skipped += 1; continue   # (the error is not printed: a JSON error quotes the text it stopped at)
        f = fp(s)
        if find:
            if f == find.lower(): print(kind, 'player', r['player_id'], r.get('updated_at') or r.get('saved_at'))
            continue
        if f in seen: continue
        seen.add(f); open(os.path.join(OUT, f + '.json'), 'w', encoding='utf-8').write(s)
    if skipped: print(skipped, 'rows skipped (not a save that can be read)')
    if not find: print(len(seen), 'saves fetched')

if __name__ == '__main__': main()
