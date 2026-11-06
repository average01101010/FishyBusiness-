// The shop against the database (06.11.2026, before the launch): every product the game sells for real money has a product id the
// checkout knows (SHOP_PRODUCT in ui/10i-shop.js, else shop-checkout gets '' and the purchase can never open), and the price the game
// shows is the one the database charges (supabase/migrations, the last insert of each product wins). The company logo was sold in the
// paint shop at 29 kr shown, 49 kr in the database, and with no product id, so «Kjøp» always failed.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export default function (t){
  const K = t.K, src = f => readFileSync(join(ROOT, 'src', f), 'utf8');
  // the database's prices: (id, kind, name_no, name_en, price_nok, data) rows in the migrations, in the order they run
  const DB = {}, MIG = join(ROOT, 'supabase', 'migrations');
  for (const f of readdirSync(MIG).filter(f => f.endsWith('.sql')).sort()){
    const sql = readFileSync(join(MIG, f), 'utf8');
    for (const m of sql.matchAll(/\(\s*'([a-z0-9_]+)'\s*,\s*'(?:booster|skin)'\s*,\s*'(?:[^']|'')*'\s*,\s*'(?:[^']|'')*'\s*,\s*(\d+)\s*,\s*'(\{[^']*\})'/g)) DB[m[1]] = {nok:+m[2], data:JSON.parse(m[3])};
  }
  t.ok(Object.keys(DB).length >= 15, 'produktene i migreringene er lest (' + Object.keys(DB).length + ')');
  // the game's product ids and prices
  const shop = src('js/ui/10i-shop.js'), SP = Function('return ' + shop.match(/const SHOP_PRODUCT = (\{[\s\S]*?\});/)[1])();
  const paint = src('js/ui/10j-paint.js'), pm = paint.match(/const DNOK = (\d+), NOK = (\{[^}]*\})/), DNOK = +pm[1], PNOK = Function('return ' + pm[2])();
  const COS = Function('return ' + src('js/vessel3d.js').match(/const DESIGNS = (\[[^\]]*\]), COS = \[\.\.\.DESIGNS, ([^\]]*)\]/).slice(1).join('.concat([') + '])')();
  const game = {};   // the shop's key -> the price the game shows
  for (const k in K.HAILL) if (!K.HAILL[k].reward) game[k] = K.HAILL[k].nok;
  for (const k in K.BOOSTS) game[k] = K.BOOSTS[k].nok;
  for (const k in K.SKIP) game['sk_' + k] = K.SKIP[k].nok;
  game.yard = K.YARD_NOW_NOK;
  for (const k of COS) game['des_' + k] = PNOK[k] || DNOK;
  for (const [k, nok] of Object.entries(game)){
    const id = SP[k], P = id && DB[id];
    t.ok(!!id, k + ': har et produkt-id kassen kjenner (SHOP_PRODUCT)');
    t.ok(!!P, k + ': produktet ' + (id || '?') + ' finnes i databasen');
    if (P) t.eq(nok, P.nok, k + ': prisen spillet viser er den databasen tar (' + nok + ' kr)');
  }
  // and the other way: every product the database sells (not the thank-you, which is never bought) is one the game sells
  const sold = new Set(Object.values(SP));
  for (const id of Object.keys(DB).filter(id => !DB[id].data.reward)) t.ok(sold.has(id), id + ': databasens produkt selges i spillet');
}
