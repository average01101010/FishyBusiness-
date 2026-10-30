// ===== The item card (M1 in docs/planer/butikker-og-sponsorer.md, 30.10.2026) =====
// One card for everything sold for the game's kroner at the tackle shop, the plant and the yard: a picture, one line with what it does in
// numbers (from the code's own constants, never prose), the price with an anchor where there is a fair one (the hand, the hand jig), the
// condition where there is one, what is aboard, the buttons, and «Mer» to the Håndboka, where the long explanations now live. The
// pictures are drawn here as small side views in SVG, so the card needs no WebGL and no extra files.
const icL = (no, en) => S.lang === 'no' ? no : en;
// ---- the pictures: 64 × 40, a light sea line under the things that float or stand on deck
const IC_C = {ink:'#22323c', mid:'#5d7380', soft:'#c9d6dd', red:'#d0452f', org:'#e8833a', yel:'#e9b949', grn:'#2f8f5b', blu:'#2f6fae', wood:'#a87a4c', ice:'#cfeaf5'};
const icSvg = d => '<svg viewBox="0 0 64 40" fill="none" stroke="' + IC_C.ink + '" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
const IC_DECK = '<path d="M4 36h56" stroke="' + IC_C.soft + '" stroke-width="2"/>';
const IC_HOOK = (x, y) => '<path d="M' + x + ' ' + y + 'v5a2 2 0 0 0 4 0" />';
const ICPIC = {
  // the hand jig: a wooden reel at the rail, the line down to the pilk with its fly hooks
  jig:icSvg('<rect x="6" y="8" width="16" height="12" rx="2" fill="' + IC_C.wood + '"/><circle cx="14" cy="14" r="4" fill="#fff"/><path d="M22 14h12v14"/><path d="M34 12v6M31 15h6" stroke="' + IC_C.mid + '"/>' +
    '<path d="M34 28l-3 6h6z" fill="' + IC_C.mid + '"/>' + IC_HOOK(28, 20) + IC_HOOK(40, 22) + IC_DECK),
  // the halibut gear: the big pilk and the gaff
  kgear:icSvg('<path d="M14 6v18"/><path d="M10 24l4 10 4-10z" fill="' + IC_C.yel + '"/><path d="M36 6l18 22"/><path d="M54 28a5 5 0 0 1-8 2" stroke-width="2.2"/>' + IC_DECK),
  // the jigging machine: the box on the rail with its arm and line
  jukse:icSvg('<rect x="8" y="16" width="20" height="14" rx="2" fill="' + IC_C.org + '"/><circle cx="18" cy="23" r="4" fill="#fff"/><path d="M26 16l18-10h8"/><path d="M52 6v24"/><path d="M50 30l2 5 2-5z" fill="' + IC_C.mid + '"/><path d="M6 30h26" stroke-width="2.4"/>' + IC_DECK),
  // a spare set: the pilk and fly hooks
  jigset:icSvg('<path d="M32 4v8"/><path d="M28 12h8l-2 14h-4z" fill="' + IC_C.mid + '"/>' + IC_HOOK(18, 10) + IC_HOOK(46, 10) + IC_HOOK(18, 22) + IC_HOOK(46, 22) + '<path d="M20 10h8M36 10h10M20 22h8M36 22h10" stroke="' + IC_C.soft + '"/>'),
  // ice: cubes in the box
  ice:icSvg('<path d="M10 16h44v18H10z" fill="#fff"/><rect x="14" y="10" width="10" height="10" rx="1.5" fill="' + IC_C.ice + '" transform="rotate(-8 19 15)"/><rect x="27" y="8" width="10" height="10" rx="1.5" fill="' + IC_C.ice + '"/><rect x="40" y="11" width="10" height="10" rx="1.5" fill="' + IC_C.ice + '" transform="rotate(10 45 16)"/>' + IC_DECK),
  // bait: a herring in a tray
  bait:icSvg('<path d="M8 26h48l-4 8H12z" fill="' + IC_C.soft + '"/><path d="M14 20c8-8 22-8 30 0-8 8-22 8-30 0z" fill="' + IC_C.blu + '"/><path d="M44 20l8-6v12z" fill="' + IC_C.blu + '"/><circle cx="20" cy="19" r="1" fill="#fff" stroke="none"/>'),
  // a net: floats along the head rope, the mesh, the lead line
  net:icSvg('<path d="M6 8h52M6 32h52"/><path d="M6 8l8 24M14 8l8 24M22 8l8 24M30 8l8 24M38 8l8 24M46 8l8 24M14 8l-8 24M22 8l-8 24M30 8l-8 24M38 8l-8 24M46 8l-8 24M54 8l-8 24" stroke="' + IC_C.mid + '" stroke-width=".9"/>' +
    [10, 24, 38, 52].map(x => '<ellipse cx="' + x + '" cy="8" rx="3.5" ry="2.4" fill="' + IC_C.org + '"/>').join('') + [10, 24, 38, 52].map(x => '<rect x="' + (x - 2) + '" y="31" width="4" height="3" fill="' + IC_C.ink + '"/>').join('')),
  // a tub of line with the hooks on the rim
  line:icSvg('<path d="M14 14h36l-4 20H18z" fill="' + IC_C.blu + '"/><path d="M14 14h36"/><path d="M20 18c6 3 18 3 24 0M21 23c6 3 16 3 22 0" stroke="#fff" stroke-width="1.2"/>' + [18, 24, 30, 36, 42].map(x => IC_HOOK(x, 8)).join('') + IC_DECK),
  // the king crab pot
  pot:icSvg('<rect x="10" y="10" width="44" height="24" rx="2" fill="' + IC_C.soft + '"/><path d="M10 18h44M10 26h44M21 10v24M32 10v24M43 10v24" stroke="' + IC_C.mid + '" stroke-width=".9"/><ellipse cx="32" cy="10" rx="8" ry="2.5" fill="#fff"/>' + IC_DECK),
  // the buoy set: two buoys, a pole with its flag
  kit:icSvg('<path d="M20 30V6"/><path d="M20 6h10l-3 4 3 4H20" fill="' + IC_C.red + '"/><circle cx="20" cy="30" r="5" fill="' + IC_C.org + '"/><circle cx="44" cy="30" r="5" fill="' + IC_C.org + '"/><path d="M2 36c5-2 10-2 15 0s10 2 15 0 10-2 15 0 10 2 15 0" stroke="' + IC_C.blu + '"/>'),
  // the heavy anchor (dregg)
  heavy:icSvg('<path d="M32 6v24"/><circle cx="32" cy="6" r="2.5"/><path d="M20 22c0 8 24 8 24 0" stroke-width="2.4"/><path d="M18 20l2 3 3-1M46 20l-2 3-3-1"/>' + IC_DECK),
  // hooks
  hooks:icSvg([14, 28, 42].map(x => '<path d="M' + x + ' 6v16a6 6 0 0 0 12 0v-3" stroke-width="2"/><path d="M' + (x + 12) + ' 19l-2 2"/>').join('')),
  // the haulers: a drum on its pedestal with the line coming over it
  linehaler:icSvg('<path d="M22 34V20h12v14" fill="' + IC_C.mid + '"/><circle cx="28" cy="16" r="9" fill="' + IC_C.grn + '"/><circle cx="28" cy="16" r="3" fill="#fff"/><path d="M4 6l24 1M28 25l24 9" stroke="' + IC_C.ink + '"/>' + IC_DECK),
  garnhaler:icSvg('<path d="M20 34V22h16v12" fill="' + IC_C.mid + '"/><path d="M14 10h28l-4 14H18z" fill="' + IC_C.blu + '"/><path d="M18 14h20M20 19h16" stroke="#fff" stroke-width="1.2"/><path d="M2 4l14 8M40 22l20 10" stroke="' + IC_C.mid + '" stroke-width=".9"/>' + IC_DECK),
  teinehaler:icSvg('<path d="M14 34V8h22"/><path d="M14 8l10 10"/><circle cx="36" cy="10" r="4" fill="' + IC_C.yel + '"/><path d="M36 14v8"/><rect x="28" y="22" width="16" height="10" rx="1.5" fill="' + IC_C.soft + '"/><path d="M28 27h16M36 22v10" stroke="' + IC_C.mid + '" stroke-width=".9"/>' + IC_DECK),
  // a crab tank with running water
  krabbekar:icSvg('<rect x="8" y="12" width="48" height="22" rx="2" fill="#fff"/><path d="M8 18c6-2 12 2 18 0s12-2 18 0 8 1 12 0" stroke="' + IC_C.blu + '"/><path d="M8 18h48v16H8z" fill="' + IC_C.ice + '" stroke="none"/><ellipse cx="32" cy="27" rx="6" ry="4" fill="' + IC_C.red + '"/><path d="M26 26l-6-4M38 26l6-4M27 30l-6 3M37 30l6 3" stroke="' + IC_C.red + '"/>'),
  // electronics: the radio, the AIS box, the plotter, the sounders, the radars, the watch alarm
  vhf:icSvg('<rect x="14" y="14" width="30" height="18" rx="2" fill="' + IC_C.mid + '"/><rect x="18" y="18" width="12" height="6" fill="' + IC_C.ice + '"/><circle cx="38" cy="22" r="3" fill="#fff"/><path d="M50 32V4"/><path d="M44 30l6-4"/>'),
  ais:icSvg('<rect x="14" y="18" width="24" height="14" rx="2" fill="' + IC_C.mid + '"/><path d="M46 32V8"/><path d="M52 10a8 8 0 0 0 0 12M56 6a14 14 0 0 1 0 20M40 10a8 8 0 0 1 0 12" stroke="' + IC_C.grn + '"/>'),
  plotter:icSvg('<rect x="10" y="6" width="44" height="28" rx="3" fill="' + IC_C.ink + '"/><rect x="14" y="10" width="36" height="20" fill="' + IC_C.ice + '"/><path d="M14 22c6-4 10 2 16-2s10-2 20 0M14 15c8 3 14-3 22 0s10 1 14-1" stroke="' + IC_C.blu + '" stroke-width="1"/><path d="M28 18h8l-4 7z" fill="' + IC_C.red + '" stroke="none"/>'),
  chirp:icSvg('<rect x="10" y="6" width="44" height="28" rx="3" fill="' + IC_C.ink + '"/><rect x="14" y="10" width="36" height="20" fill="#0d2a44"/><path d="M14 26c6-1 10 1 16 0s14-2 20 0" stroke="' + IC_C.org + '"/><path d="M22 16h4M34 19h5M28 14h3" stroke="' + IC_C.grn + '" stroke-width="2"/>'),
  sonar:icSvg('<path d="M32 4v14"/><rect x="28" y="16" width="8" height="5" rx="1" fill="' + IC_C.mid + '"/><path d="M32 21L8 36M32 21L56 36" stroke="' + IC_C.soft + '"/><path d="M14 33c12-6 24-6 36 0" stroke="' + IC_C.grn + '" stroke-width="2.4"/><circle cx="24" cy="31" r="1.6" fill="' + IC_C.org + '" stroke="none"/><circle cx="40" cy="30" r="1.6" fill="' + IC_C.org + '" stroke="none"/>'),
  radar:icSvg('<ellipse cx="32" cy="18" rx="16" ry="9" fill="#fff"/><path d="M16 18h32" stroke="' + IC_C.soft + '"/><path d="M28 27h8v7h-8z" fill="' + IC_C.mid + '"/>' + IC_DECK),
  radarA:icSvg('<path d="M8 12h48" stroke-width="4"/><path d="M32 12v22"/><path d="M26 34h12"/><path d="M32 18h6" stroke="' + IC_C.mid + '"/>'),
  brovakt:icSvg('<rect x="14" y="10" width="36" height="22" rx="3" fill="' + IC_C.mid + '"/><path d="M26 25a6 6 0 1 1 12 0z" fill="' + IC_C.yel + '"/><path d="M32 25v2"/><path d="M20 6l-4-3M44 6l4-3M32 6V2" stroke="' + IC_C.red + '"/><rect x="40" y="14" width="6" height="4" rx="1" fill="#fff"/>'),
  // the yard's: the bottom paint, the 90 hp outboard
  antigro:icSvg('<path d="M4 18h40l-4 12H10z" fill="#fff"/><path d="M8 24h33l-1.6 6H10z" fill="' + IC_C.red + '" stroke="none"/><path d="M48 12h10v16H48z" fill="' + IC_C.red + '"/><path d="M48 16h10" stroke="#fff"/>' + IC_DECK),
  motor90:icSvg('<rect x="22" y="4" width="20" height="14" rx="4" fill="' + IC_C.ink + '"/><path d="M28 18h8v12h-8z" fill="' + IC_C.mid + '"/><path d="M24 30h16"/><circle cx="32" cy="34" r="2.5" fill="' + IC_C.yel + '"/>'),
  // the clothes: the oilskins, the thermal suit
  olje:icSvg('<path d="M22 6l-10 6 3 8 5-3v17h24V17l5 3 3-8-10-6c-2 3-4 4-10 4s-8-1-10-4z" fill="' + IC_C.yel + '"/><path d="M32 10v24" stroke="' + IC_C.ink + '" stroke-width="1"/>'),
  varme:icSvg('<path d="M22 6l-10 6 3 8 5-3v17h10V24h4v10h10V17l5 3 3-8-10-6c-2 3-4 4-10 4s-8-1-10-4z" fill="' + IC_C.red + '"/><path d="M20 20h24" stroke="' + IC_C.yel + '" stroke-width="2"/>'),
  box:icSvg('<path d="M12 14l20-8 20 8v16l-20 8-20-8z" fill="' + IC_C.soft + '"/><path d="M12 14l20 8 20-8M32 22v16"/>')
};
const icPic = k => ICPIC[k] || ICPIC.box;
// ---- what each thing does, in numbers from the code ([no, en]); the long story is in the Håndboka (ITEM_HB)
const ICFX = {
  jig:() => ['Fisker for hånd: torsk, sei og hyse', 'Fishes by hand: cod, saithe and haddock'],
  kgear:() => ['Juksa tar mest kveite · fredet 20.12–20.4', 'The jig takes mostly halibut · closed 20.12–20.4'],
  jukse:() => ['Fisker ' + fmt(JIG.machine / JIG.hand, 0) + '× håndjuksa · én person passer ' + JIG.perPerson, 'Catches ' + fmt(JIG.machine / JIG.hand, 0) + '× a hand jig · one person tends ' + JIG.perPerson],
  linehaler:() => ['Trekker lina ' + fmt(GEAR.line.hand, 1) + '× raskere enn for hånd', 'Hauls the line ' + fmt(GEAR.line.hand, 1) + '× faster than by hand'],
  garnhaler:() => ['Trekker garna ' + fmt(GEAR.garn.hand, 1) + '× raskere enn for hånd · fra 7,5 m', 'Hauls the nets ' + fmt(GEAR.garn.hand, 1) + '× faster than by hand · from 7.5 m'],
  teinehaler:() => ['Teiner kan ikke trekkes uten', 'Pots cannot be hauled without one'],
  krabbekar:() => ['Krabben lever i flere døgn · uten: rundt ett', 'The crab lives for days · without: about one'],
  chirp:() => ['Ser fisken 0,75 nm rundt båten · velg art', 'Sees the fish 0.75 nm around the boat · pick the species'],
  sonar:() => ['Ser fisken 1,5 nm rundt · skiller torsk, hyse og sei · fra 10 m', 'Sees the fish 1.5 nm around · tells cod, haddock and saithe apart · from 10 m'],
  plotter:() => ['Dybdefarger, relieff og dybdekurver', 'Depth colours, relief and contours'],
  vhf:() => ['Kulingvarsel og nødanrop uten mobildekning', 'Gale warnings and distress calls without mobile coverage'],
  ais:() => ['Andre ser deg på AIS · raskere hjelp ved nød', 'Others see you on AIS · faster help in distress'],
  brovakt:() => ['Piper etter 3 min om du døser av ved roret', 'Beeps after 3 min if you doze at the wheel'],
  radar:() => ['Kuppel på styrhustaket · går rundt til sjøs · til 12 m', 'A dome on the wheelhouse · turns at sea · up to 12 m'],
  radarA:() => ['Åpen antenne på fire fot i masta · 10–21 m', 'A four-foot open array on the mast · 10–21 m'],
  antigro:() => ['Skroget gror 3× saktere', 'The hull fouls 3× slower'],
  motor90:() => ['Toppfart ' + EQUIP.motor90.boost.vmax + ' kn · tørstere', 'Top speed ' + EQUIP.motor90.boost.vmax + ' kn · thirstier'],
  olje:() => ['Holder deg tørr i regn og sjøsprøyt', 'Keeps you dry in rain and spray'],
  varme:() => ['Holder varmen i kulda · fingrene fryser mindre', 'Keeps you warm in the cold · the fingers freeze less'],
  ice:() => [fmt(0.3, 1) + ' kg is per kg fisk · iset fisk holder E-kvalitet i 2 døgn', fmt(0.3, 1) + ' kg of ice a kg of fish · iced fish keeps grade E for 2 days'],
  bait:() => ['Hyseline ' + fmt(LINE_KINDS.hyse.baitKg, 0) + ' kg, bankline ' + fmt(LINE_KINDS.bank.baitKg, 0) + ' kg per stamp · teine ' + fmt(GPRICE.potBait, 1) + ' kg', 'Haddock line ' + fmt(LINE_KINDS.hyse.baitKg, 0) + ' kg, bank line ' + fmt(LINE_KINDS.bank.baitKg, 0) + ' kg a tub · pot ' + fmt(GPRICE.potBait, 1) + ' kg'],
  net:() => ['156 mm torsk · 180–200 mm skrei · flytegarn sei · 360 mm blåkveite', '156 mm cod · 180–200 mm skrei · floating nets saithe · 360 mm Greenland halibut'],
  line:() => ['Hyseline ' + LINE_KINDS.hyse.hooks + ' kroker · bankline ' + LINE_KINDS.bank.hooks + ' større kroker per stamp', 'Haddock line ' + LINE_KINDS.hyse.hooks + ' hooks · bank line ' + LINE_KINDS.bank.hooks + ' bigger hooks a tub'],
  pot:() => ['Kongekrabbe · ' + POTS.big.cap + ' krabber per teine · høyst 30 per båt', 'King crab · ' + POTS.big.cap + ' crabs a pot · at most 30 a boat'],
  kit:() => ['To blåser, stake, flagg og dregg til hvert sett i sjøen', 'Two buoys, pole, flag and anchor for each set in the sea'],
  hooks:() => ['Bytter slitte og bøyde kroker og juksasett', 'Replaces worn and bent hooks and jig sets']
};
const icFx = k => { const f = ICFX[k]; if (!f) return ''; const v = f(); return icL(v[0], v[1]); };
// the anchor beside the price: what the same work costs another way (the hand, the hand jig), only where it is a fair comparison
const ICANCHOR = {
  linehaler:() => icL('for hånd: ' + fmt(GEAR.line.hand, 1) + '× tid', 'by hand: ' + fmt(GEAR.line.hand, 1) + '× the time'),
  garnhaler:() => icL('for hånd: ' + fmt(GEAR.garn.hand, 1) + '× tid', 'by hand: ' + fmt(GEAR.garn.hand, 1) + '× the time'),
  jukse:() => icL('håndjuksa ' + kr(PRICE.gear), 'hand jig ' + kr(PRICE.gear))
};
// the Håndboka's entry each card's «Mer» opens (the search in the app is set to its title)
const ICMORE = {jig:'juksa', kgear:'kveiteutstyr', jukse:'juksa', jigset:'kroker', linehaler:'halere', garnhaler:'halere', teinehaler:'halere', krabbekar:'teiner',
  chirp:'elektronikk', sonar:'elektronikk', plotter:'elektronikk', vhf:'elektronikk', ais:'elektronikk', brovakt:'elektronikk', radar:'elektronikk', radarA:'elektronikk',
  antigro:'montering', motor90:'montering', olje:'klaer', varme:'klaer', ice:'is', bait:'agn', net:'garn', line:'line', pot:'teiner', kit:'blaser', heavy:'blaser', hooks:'kroker'};
// the card. o: {k (picture, line, anchor, «Mer»), name, sub (small after the name), fx (instead of the line), price (kr or text), anchor,
// cond (0–1 with its label), have (a line in green, «Om bord»), note, btns (html), body (html after the price), id}
function itemCard(o){
  const k = o.k, fx = o.fx != null ? o.fx : icFx(k), an = o.anchor != null ? o.anchor : ICANCHOR[k] ? ICANCHOR[k]() : '', hb = ICMORE[k] && typeof hbById === 'function' ? hbById('lex_' + ICMORE[k]) : null;
  const pr = o.price == null ? '' : '<div class="ic-pr"><b>' + (typeof o.price === 'number' ? kr(o.price) : o.price) + '</b>' + (an ? '<span class="ic-an">' + an + '</span>' : '') + '</div>';
  const cond = o.cond == null ? '' : '<div class="ic-cond"><span>' + (o.condL || icL('Stand', 'Condition')) + '</span><span>' + Math.round(o.cond * 100) + ' %</span></div><div class="ph-bar"><i style="width:' + Math.round(Math.max(0, Math.min(1, o.cond)) * 100) + '%"></i></div>';
  return '<div class="ph-card ic" id="' + (o.id || 'ic-' + k) + '" data-ic="' + k + '"><div class="ic-pic">' + icPic(o.pic || k) + '</div><div class="ic-b"><h4>' + o.name + (o.sub ? ' <small>' + o.sub + '</small>' : '') + '</h4>' +
    (fx ? '<p class="ic-fx">' + fx + '</p>' : '') + pr + cond + (o.body || '') + (o.have ? '<p class="ic-have">' + o.have + '</p>' : '') + (o.note ? '<p class="ph-note">' + o.note + '</p>' : '') +
    (o.btns ? '<div class="ic-btns">' + o.btns + '</div>' : '') +
    (hb ? '<button type="button" class="ic-more" data-pa="open" data-a="handbok" data-hbid="' + hb.id + '">' + icL('Mer om ', 'More on ') + icL(hb.t[0], hb.t[1]).toLowerCase() + ' ›</button>' : '') + '</div></div>';
}
// a buy button that confirms in itself: the first tap turns it into «Bekreft · price» with a small ✕ beside it for four seconds
const IC_CONFIRM_MS = 4000;
const IC_CONFIRM_KR = 10000;   // equipment from this price confirms too (M2); the cheap and the counted (gear, clothes) go in one tap
