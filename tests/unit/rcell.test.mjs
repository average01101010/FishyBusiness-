// rcell, the reader of one raster cell (core/01b-mapdata.js), with the short way for a cell in the block it read last (Ø3a, 07.11.2026):
// the same cell as the old formula (blocks of n by n cells from the frame's origin, negative cells too), the block asked of mapBlock
// only when the cell is in another one, a block that is not in throws every time it is asked for and leaves the last one at hand, and
// a layer whose blocks are forgotten (mapDrop: bx, by, ox, oy NaN, b null) reads its blocks again.
export default function (t){
  const K = t.K, rcell = K.rcell;
  const val = (ix, iy) => ix * 7919 + iy * 104729 + 0.25;   // a value per cell that tells every cell apart
  const asked = [], gone = new Set(['2,-1']);
  // the stub: block (bx, by) of n x n cells, row by row, as mapDecode gives it; a block in «gone» has not come
  K.set('mapBlock', (L, bx, by) => {
    asked.push(bx + ',' + by); if (gone.has(bx + ',' + by)) throw new Error('map: ' + L.name + ' block ' + bx + ',' + by + ' is not loaded');
    const n = L.n, a = new Float64Array(n * n); for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) a[j * n + i] = val(bx * n + i, by * n + j); return a; });
  const L = {name:'prove', id:63, n:7, bx:NaN, by:NaN, ox:NaN, oy:NaN, b:null, k:1};
  // a walk over the cells round the origin and across many block edges, as the readers go (along a row, down a column, at random)
  let bad = 0, n = 0, seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const cells = [];
  for (let ix = -30; ix <= 30; ix++) cells.push([ix, 3]);
  for (let iy = -30; iy <= 30; iy++) cells.push([-4, iy]);
  for (let k = 0; k < 4000; k++) cells.push([Math.floor(rnd() * 90) - 45, Math.floor(rnd() * 90) - 45]);
  for (const [ix, iy] of cells){
    if (gone.has(Math.floor(ix / 7) + ',' + Math.floor(iy / 7))) continue;
    n++; if (rcell(L, ix, iy) !== val(ix, iy)) bad++;
  }
  t.ok(n > 4000 && bad === 0, 'rcell gir samme celle som den gamle formelen over ' + n + ' oppslag på kryss og tvers av blokkene, også negative (' + bad + ' feil)');
  // in one block: mapBlock once, however many cells are read
  asked.length = 0; for (let iy = 14; iy < 21; iy++) for (let ix = 7; ix < 14; ix++) rcell(L, ix, iy);
  t.ok(asked.length === 1 && asked[0] === '1,2', 'en hel blokk leses med ett kall til mapBlock (' + asked.join(' ') + ')');
  // a block that has not come throws each time, and the block read before is still at hand
  rcell(L, 0, 0); asked.length = 0; let thrown = 0;
  for (let k = 0; k < 3; k++){ try { rcell(L, 15, -3); } catch (e){ thrown++; } }
  t.ok(thrown === 3 && asked.length === 3, 'en blokk som ikke er inne, kaster hver gang den blir spurt etter (' + thrown + ' av 3)');
  asked.length = 0; const v0 = rcell(L, 3, 4);
  t.ok(v0 === val(3, 4) && asked.length === 0, 'etter kastet leses blokka som var inne fra før, uten nytt kall');
  gone.delete('2,-1'); t.ok(rcell(L, 15, -3) === val(15, -3), 'når blokka er kommet, leses den');
  // forgotten (mapDrop): read again from mapBlock
  L.bx = L.by = L.ox = L.oy = NaN; L.b = null; asked.length = 0;
  t.ok(rcell(L, 3, 4) === val(3, 4) && asked.length === 1, 'et lag der blokkene er glemt (mapDrop), leser blokka på nytt');
  // a layer made without ox and oy (as the tests' stubs and an older layer): the long way, the same cells
  const L2 = {name:'gammel', id:62, n:5, bx:NaN, by:NaN, b:null, k:1}; let bad2 = 0;
  for (let k = 0; k < 500; k++){ const ix = Math.floor(rnd() * 40) - 20, iy = Math.floor(rnd() * 40) - 20; if (gone.has(Math.floor(ix / 5) + ',' + Math.floor(iy / 5))) continue; if (rcell(L2, ix, iy) !== val(ix, iy)) bad2++; }
  t.ok(bad2 === 0, 'et lag uten ox og oy leser de samme cellene (' + bad2 + ' feil)');
}
