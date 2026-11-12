// The tackle shops' and the yards' names along the whole coast (core/06c-steder.js; CLAUDE.md and docs/handelssteder.md: «navn etter
// stedet»). A place with no postal town in Kartverket's register was called «Verft verft» (one yard on the Varanger peninsula, found in
// the spot check for the hop, 12.11.2026); it now takes the town of the nearest plant. No place may be named by its kind alone.
export default function (t){
  const {PORTS} = t.K;
  const st = PORTS.filter(p => p.sted === 'verft' || p.sted === 'butikk');
  t.ok(st.length > 150, 'handelsstedene langs kysten er lastet (' + st.length + ')');
  const bad = st.filter(p => /^(Verft|Butikk) (verft|utstyrsbutikk)\b/.test(p.name));
  t.eq(bad.map(p => p.id + ' ' + p.name).join(', '), '', 'ingen heter bare etter hva det er («Verft verft», «Butikk utstyrsbutikk»)');
  const v = PORTS.find(p => p.id === 'sv1305146_156500');
  t.ok(v && /verft$/.test(v.name) && !/^Verft /.test(v.name), 'verftet uten poststed heter etter nærmeste mottak: «' + (v && v.name) + '»');
}
