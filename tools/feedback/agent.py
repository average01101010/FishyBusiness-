"""The feedback agent's hands (06.10.2026; tools/feedback/RUTINE.md, supabase/functions/feedback-agent, docs/OVERLEVERING.md 4.22).

Talks to the Edge Function feedback-agent with the token in the environment variable FEEDBACK_AGENT_TOKEN (Jonas sets it in the
Claude Code environment; it is never written anywhere). What it fetches is the players' feedback: it goes to a folder outside the repo
(--out, by default a temporary folder) and never into git.

    python3 tools/feedback/agent.py list [--lim 40] [--out DIR] [--imgs]     the new feedback to DIR/feedback.json (pictures to DIR/img/)
    python3 tools/feedback/agent.py note ID --score 6 --status seen --note "..." [--reply "..."]
    python3 tools/feedback/agent.py run --report RAPPORT.md [--pr URL "title"]... [--n 12]
"""
import argparse, base64, json, os, sys, tempfile, urllib.error, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
URL = json.load(open(os.path.join(ROOT, 'src', 'data', 'cloud.json')))['supabaseUrl'].rstrip('/') + '/functions/v1/feedback-agent'


def call(op, **kw):
    tok = os.environ.get('FEEDBACK_AGENT_TOKEN', '')
    if not tok:
        sys.exit('FEEDBACK_AGENT_TOKEN is not set: Jonas adds it as an environment variable in the Claude Code environment (and as a secret in Supabase)')
    req = urllib.request.Request(URL, data=json.dumps({'op': op, **kw}).encode(), method='POST',
                                 headers={'Authorization': 'Bearer ' + tok, 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            out = json.load(r)
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors='replace')[:300]
        sys.exit('feedback-agent %s: HTTP %d %s' % (op, e.code, body))
    except urllib.error.URLError as e:
        sys.exit('feedback-agent %s: %s (is %s allowed in the environment\'s network access?)' % (op, e.reason, URL.split('/')[2]))
    if not out.get('ok'):
        sys.exit('feedback-agent %s: %s' % (op, out.get('why')))
    return out.get('data')


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest='cmd', required=True)
    a = sub.add_parser('list'); a.add_argument('--lim', type=int, default=40); a.add_argument('--out', default=os.path.join(tempfile.gettempdir(), 'dsb-feedback'))
    a.add_argument('--imgs', action='store_true')
    n = sub.add_parser('note'); n.add_argument('id', type=int); n.add_argument('--score', type=float); n.add_argument('--status', choices=['new', 'seen', 'fixed', 'planned', 'no'])
    n.add_argument('--note', required=True); n.add_argument('--reply')
    r = sub.add_parser('run'); r.add_argument('--report', required=True); r.add_argument('--pr', nargs=2, action='append', metavar=('URL', 'TITLE'), default=[])
    r.add_argument('--n', type=int, default=0)
    o = ap.parse_args()
    if o.cmd == 'list':
        d = call('list', lim=o.lim)
        if os.path.abspath(o.out).startswith(ROOT + os.sep):
            sys.exit('--out must be outside the repo: the feedback never goes into git')
        os.makedirs(o.out, exist_ok=True)
        json.dump(d, open(os.path.join(o.out, 'feedback.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        rows = d.get('rows') or []
        print('%d new (%d not yet read), %d noted before; written to %s' % (len(rows), d.get('left', 0) - len(rows), len(d.get('noted') or []), os.path.join(o.out, 'feedback.json')))
        for x in rows:
            m = x.get('meta') or {}
            print('#%s %s %s %s who=%s played=%s earlier=%s img=%s vid=%s %s/%s' % (x['id'], x['ts'][:16], x['topic'], ('*' * (x.get('rating') or 0)) or '-', x['who'], x.get('played'),
                  x.get('earlier'), x.get('nimg'), x.get('nvid'), m.get('version'), m.get('platform')))
            print('   ' + ' '.join(x['body'].split())[:300])
            if o.imgs and x.get('nimg'):
                os.makedirs(os.path.join(o.out, 'img'), exist_ok=True)
                for k, u in enumerate(call('imgs', fid=x['id']) or []):
                    head, _, b64 = u.partition(',')
                    ext = 'png' if 'png' in head else 'webp' if 'webp' in head else 'jpg'
                    p = os.path.join(o.out, 'img', '%s-%d.%s' % (x['id'], k, ext)); open(p, 'wb').write(base64.b64decode(b64)); print('   picture', p)
    elif o.cmd == 'note':
        call('note', fid=o.id, note=o.note, score=o.score, st=o.status, reply=o.reply); print('noted', o.id)
    else:
        rep = open(o.report, encoding='utf-8').read()
        rid = call('run', report=rep, prs=[{'url': u, 'title': t} for u, t in o.pr], n=o.n); print('report', rid)


if __name__ == '__main__':
    main()
