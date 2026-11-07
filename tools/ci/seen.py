# Has a data release already been made from these files? (BACKLOG 10.7, 04.11.2026: a merge into the working branch changes the files
# that start kart.yml, gebco.yml and the other data workflows, so the merge started them again and made a release nobody used.)
# The hash of the files' contents goes into every release's notes as «[src <hash>]»; a workflow started by a push asks this first and
# stops when a release with the same mark is there. workflow_dispatch always runs (a run by hand is meant).
#   python3 tools/ci/seen.py <tag prefix> <file> [file ...]   writes skip=true|false and mark=[src <hash>] to $GITHUB_OUTPUT
import os, sys, json, hashlib, subprocess
pre, files = sys.argv[1], sys.argv[2:]
h = hashlib.sha256()
for f in files: h.update(f.encode() + b'\0' + open(f, 'rb').read() + b'\0')
mark = f'[src {h.hexdigest()[:16]}]'; skip = False
if os.environ.get('GITHUB_EVENT_NAME') == 'push':
    try:
        r = subprocess.run(['gh', 'api', f"repos/{os.environ['GITHUB_REPOSITORY']}/releases?per_page=100"], capture_output=True, text=True, check=True)
        for rel in json.loads(r.stdout):
            if rel['tag_name'].startswith(pre + '-') and mark in (rel.get('body') or ''): skip = True; print('already made:', rel['tag_name'], mark); break
    except Exception as e: print('could not list the releases, running:', e)
out = os.environ.get('GITHUB_OUTPUT')
if out:
    with open(out, 'a') as o: o.write(f'skip={str(skip).lower()}\nmark={mark}\n')
print(json.dumps({'skip': skip, 'mark': mark}))
