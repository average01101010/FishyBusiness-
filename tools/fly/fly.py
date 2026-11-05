# The air ticket Tromsø–Longyearbyen per month (H1b R8, BACKLOG 10.3): opens SAS's low fare calendar in a browser and keeps every JSON
# answer the page fetches (the calendar's own API is not documented, so the first run keeps them all for reading), then looks in them
# for the lowest one-way price per month for TOS–LYR. Writes <out>/fly.json ({month: kr} and where each came from) and <out>/raw/.
# Run in Actions (.github/workflows/fly.yml); sas.no is closed to the cloud session.
import asyncio, json, os, re, sys
from playwright.async_api import async_playwright
CFG = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fly.json')))
OUT = sys.argv[1] if len(sys.argv) > 1 else 'fly-out'

def prices(o, path=''):
    # (month, price) pairs anywhere in a JSON answer: a date-like key or field next to a number called price/amount/fare
    out = []
    if isinstance(o, dict):
        d = next((str(o[k]) for k in o if re.search(r'date|month|day', k, re.I) and isinstance(o[k], str) and re.match(r'\d{4}-\d{2}', str(o[k]))), None)
        p = next((o[k] for k in o if re.search(r'price|amount|fare|total', k, re.I) and isinstance(o[k], (int, float))), None)
        if p is None:
            for k in o:
                if re.search(r'price|fare', k, re.I) and isinstance(o[k], dict):
                    p = next((v for kk, v in o[k].items() if re.search(r'amount|total|value|price', kk, re.I) and isinstance(v, (int, float))), None)
                    if p is not None: break
        if d and p: out.append((d[:7], float(p), path))
        for k, v in o.items(): out += prices(v, path + '/' + str(k))
        # a calendar keyed by date: {"2027-07-03": 950, ...}
        for k, v in o.items():
            if re.match(r'^\d{4}-\d{2}(-\d{2})?$', str(k)) and isinstance(v, (int, float)): out.append((str(k)[:7], float(v), path))
    elif isinstance(o, list):
        for i, v in enumerate(o): out += prices(v, path + '[' + str(i) + ']')
    return out

async def main():
    os.makedirs(os.path.join(OUT, 'raw'), exist_ok=True)
    seen, n = [], 0
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(locale='nb-NO', user_agent='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36')
        pg = await ctx.new_page()
        async def resp(r):
            nonlocal n
            try:
                if 'json' not in (r.headers.get('content-type') or ''): return
                body = await r.text(); n += 1
                fn = os.path.join(OUT, 'raw', f'{n:03d}.json'); open(fn, 'w').write(json.dumps({'url': r.url, 'status': r.status, 'body': body[:400000]}))
                seen.append({'n': n, 'url': r.url[:300], 'status': r.status, 'len': len(body), 'tos': 'TOS' in body, 'lyr': 'LYR' in body})
            except Exception as e: print('resp', e)
        pg.on('response', lambda r: asyncio.ensure_future(resp(r)))
        for url in CFG['pages']:
            try:
                await pg.goto(url, wait_until='networkidle', timeout=90000); await pg.wait_for_timeout(8000)
                # cookie banners
                for t in ('Godta alle', 'Aksepter', 'Accept all', 'Godta'):
                    try: await pg.get_by_role('button', name=t).first.click(timeout=2000); break
                    except Exception: pass
                await pg.wait_for_timeout(5000)
                await pg.screenshot(path=os.path.join(OUT, 'raw', 'page%d.png' % CFG['pages'].index(url)), full_page=True)
                open(os.path.join(OUT, 'raw', 'page%d.txt' % CFG['pages'].index(url)), 'w').write((await pg.inner_text('body'))[:200000])
                print('ok', url, pg.url)
            except Exception as e: print('page', url, str(e)[:200])
        await b.close()
    best = {}
    for s in seen:
        try: o = json.loads(json.load(open(os.path.join(OUT, 'raw', '%03d.json' % s['n'])))['body'])
        except Exception: continue
        if not (s['tos'] and s['lyr']): continue
        for m, v, path in prices(o):
            if v > 100 and (m not in best or v < best[m][0]): best[m] = (v, s['url'][:200] + ' ' + path[:100])
    json.dump({'from': CFG['from'], 'to': CFG['to'], 'months': {m: {'kr': v[0], 'src': v[1]} for m, v in sorted(best.items())}, 'answers': seen}, open(os.path.join(OUT, 'fly.json'), 'w'), indent=1, ensure_ascii=False)
    print(json.dumps({m: v[0] for m, v in sorted(best.items())}), len(seen), 'svar')
asyncio.run(main())
