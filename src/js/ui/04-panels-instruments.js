// ---------- estimates ----------
function estimate(){
  const b = S.boat, H = S.t / 60, W = windAt(H);
  let km = 0, fishH = 0, bad = -1, a = quayPos(b);   // from where she lies (at Father's naust its berth, not the plant's harbour point)
  S.draft.forEach((w, i) => { km += kmTrue(a, w); if (bad < 0 && !legClear(a, w)) bad = i; fishH += w.fish || 0; a = w; });
  const v = Math.min(S.draftSpeed, speedCap(hsAt(b.pos, H)));
  const nm = km / NM, hours = nm / v, fuel = fuelLph(v, W) * hours;
  return {nm, hours, fishH, fuel, bad, v};
}

// ---------- panels ----------
const TABS = ['route', 'fish', 'hold', 'wx', 'port', 'log'];
function renderTabs(){
  $('tabs').innerHTML = TABS.map(k => '<button type="button" role="tab" data-tab="' + k + '" aria-selected="' + (k === tab) + '">' + t('tab_' + k) + '</button>').join('');
}
function setTab(k){ tab = k; renderTabs(); panelDirty = true; renderPanel(); panel.scrollTop = 0; }
$('tabs').addEventListener('click', e => { const bt = e.target.closest('[data-tab]'); if (bt) setTab(bt.dataset.tab); });

function statusText(){
  const b = S.boat;
  if (S.plan && S.plan.depAt) return t('st_waiting', hm(S.plan.depAt / 60));
  if (b.status === 'aground') return t('st_aground');
  if (b.status === 'port') return t(b.land ? 'st_landing' : b.shift ? 'st_shift' : b.fueling ? 'st_fueling' : 'st_port', portById(b.port).name);
  if (b.anch && b.anch.up != null) return GL('Hiver anker', 'Weighing anchor');   // (a route waits for it: 06e-anchor.js)
  if (b.status === 'sailing') return t(S.plan && S.plan.returning ? 'st_returning' : 'st_sailing', fmt(b.v, 0));
  if (b.gop){ const g = gopText(); return GL(g[2], g[3]); }
  if (b.status === 'fishing' && b.deckEnd) return GL('Tar unna fangsten', 'Seeing to the catch');   // after the gear work, not «Fisker» (F4)
  if (gopAfter(b)) return t('st_idle');
  if (b.anch && b.status === 'idle') return GL(b.anch.out != null && b.anch.out < b.anch.rode ? 'Kaster anker' : 'Ligger til ankers', b.anch.out != null && b.anch.out < b.anch.rode ? 'Anchoring' : 'At anchor');
  if (b.hove && b.status === 'idle') return GL('Ligger bi i uværet', 'Lying to in the storm');   // (core/05-vessels.js lieTo)
  if (b.status === 'tow' && b.tow) return t('st_tow_' + b.tow.ph, fmt(b.v, 0));
  return t('st_' + b.status);
}
// the most imminent event for the boat you are looking at: what and when (game minutes)
function nextEvent(){
  const b = S.boat, T = S.t, ev = [], L = (no, en) => S.lang === 'no' ? no : en;
  const add = (t, txt) => { if (t != null && Number.isFinite(t) && t >= T) ev.push({t, txt}); };
  if (S.plan && S.plan.depAt && (b.status === 'port' || b.status === 'idle')) add(S.plan.depAt, L('Avgang', 'Departure'));
  if (b.land) add(b.land.until, L('Sluttseddelen', 'The landing note'));
  if (b.fueling) add(b.fueling.until, L('Bunkringen er ferdig', 'Fuelling done'));
  if (b.shift) add(b.shift.until, L('Forhalingen er ferdig', 'Shifting done'));
  if (b.status === 'fishing' && b.fishUntil != null && !b.deckEnd && !gopAfter(b)) add(b.fishUntil, L('Fisket er ferdig', 'Fishing done'));
  if (b.status === 'port' && jobsDone()) add(jobsDone(), jobsCrewOnly() ? L('Mannskapet er ferdig', 'The crew is done') : L('Verkstedet er ferdig', 'The yard is done'));
  if (b.status === 'sailing' && S.plan && S.plan.idx < S.plan.wps.length){
    const wps = S.plan.wps; let a = b.pos, km = 0, stop = null;
    for (let i = S.plan.idx; i < wps.length; i++){ km += kmTrue(a, wps[i]); a = wps[i]; if (wpStop(wps[i]) || i === wps.length - 1){ stop = wps[i]; break; } }
    const kn = Math.max(4, b.v || S.plan.speed || 10);
    if (stop) add(T + km / (kn * NM) * 60, stop.port ? L('Fremme i ', 'Arriving at ') + portById(stop.port).name : stop.fish > 0 ? L('Fremme på feltet', 'On the grounds') : L('Fremme ved neste stopp', 'At the next stop'));
  }
  ev.sort((x, y) => x.t - y.t); return ev[0] || null;
}
// innerHTML only when the markup has changed (the tick writes the boxes five times a second); el.dataset.v counts the changes
function setHtml(el, h){ if (el._h === h) return false; el._h = h; el.innerHTML = h; el.dataset.v = (+el.dataset.v || 0) + 1; return true; }
let hudV = '', hudT = 0, hudCard = false;   // hudCard: the whole box open as a card over the little chart (a tap on the strip)
// UI 2, U2-1 (docs/planer/ui-2-staaende.md 4.1–4.2, Jonas 06.11.2026, V1 A: the phone upright is the measure). Upright, the strip is the
// normal state and the whole box is a card a tap away; on its side the whole box stands as before, and the strip is what «–» folds it
// to (S.settings.hudMin). The little chart has a fixed place under either (styles.css), whatever the box holds
const HUDMQ = typeof matchMedia === 'function' ? matchMedia('(orientation: portrait)') : null;
const hudPortrait = () => !!(HUDMQ && HUDMQ.matches);
// the strip's second line: diesel, hold, energy and sea as an icon (the dock's stroke icons' kin) and a figure
const HICON = {fuel:'<svg viewBox="0 0 24 24"><path d="M5 20V5.5A1.5 1.5 0 0 1 6.5 4h6A1.5 1.5 0 0 1 14 5.5V20"/><path d="M4 20h11"/><path d="M7 7.5h5V12H7z"/><path d="M14 11h2a2 2 0 0 1 2 2v3.5a1.5 1.5 0 0 0 3 0V9l-2.5-2.5"/></svg>',
  hold:'<svg viewBox="0 0 24 24"><path d="M3 8l9-4 9 4v9l-9 4-9-4z"/><path d="M3 8l9 4 9-4M12 12v9"/></svg>',
  en:'<svg viewBox="0 0 24 24"><path d="M13 2.5L5 13.5h6L10 21.5l9-11h-6z"/></svg>',
  sea:'<svg viewBox="0 0 24 24"><path d="M2 10c3.3-1.6 6.7-1.6 10 0s6.7 1.6 10 0"/><path d="M2 16c3.3-1.6 6.7-1.6 10 0s6.7 1.6 10 0"/></svg>'};
// the four figures the gauges and the strip show: the share 0–1, the text, and the class that colours a warning (yellow r1, red r2)
function hudFigures(){
  const b = S.boat, H = S.t / 60, W = windAt(H), hs = hsAt(b.pos, H), atSea = b.status !== 'port', lvl = riskLevel(W, hs), L = (a, c) => S.lang === 'no' ? a : c;
  const fuelP = b.fuel / BOAT.fuelCap, HF = holdFmt(), holdP = HF.load / Math.max(1, capHold()), e = S.energy == null ? 100 : S.energy, full = holdP >= 0.995;
  return {W, hs, lvl, atSea, HF,
    fuel:{v:fuelP, txt:fmt(b.fuel, 0) + ' L', tiny:fmt(b.fuel, 0), cls:fuelP < 0.1 ? 'r2' : fuelP < 0.25 ? 'r1' : ''},
    // full is red with «Full», nearly full yellow (spilltest 3, U5); a freezer vessel's in tonnes of product (H2b); the strip says only «Full»
    hold:{v:holdP, txt:full ? L('Full', 'Full') + ' · ' + HF.short : HF.short, short:full ? L('Full', 'Full') : HF.short, tiny:full ? L('Full', 'Full') : HF.short.replace(/ kg$/, ''), cls:full ? 'r2' : holdP >= 0.9 ? 'r1' : ''},
    en:{v:energyOff() ? 1 : e / 100, txt:energyOff() ? L('av', 'off') : asleep() ? L('sover', 'asleep') : Math.round(e) + ' %', tiny:energyOff() ? L('av', 'off') : asleep() ? L('sover', 'asleep') : Math.round(e) + '%', cls:asleep() || (!energyOff() && e < ENERGY.dim) ? 'r2' : !energyOff() && e < ENERGY.warn ? 'r1' : ''},
    sea:{v:atSea ? (lvl + 1) / 3 : 0.15, txt:fmt(hs, 1) + ' m', cls:atSea ? 'r' + lvl : ''}};
}
// the third line (U2-1, plan 4.2): the warning that applies now (the rules ✕ or !, a synchronous roll with the advice, the buoy a mile off
// with «Kjør dit»), or the next event («Fisket er ferdig 09:01 · om 30 min i ekte tid»); when neither, what the pill over the buttons used
// to say (10c-dock.js infoText): the work going on, the rest, and in harbour the place («Ved kaia · Finnsnes»); the cold last. The deck's
// kg stand at its end while she fishes. «Regler ✓» is not here: it is always true and belongs to the box. The box keeps its «now» rows
// with the warnings and the cold, so there the line is the next event and the pill's text alone (how: 'strip', 'box' or 'card'; the
// card has room for the deck's whole text, the box takes the short one so it stays inside its reserved height). The class «st nx»
// stays: the first trip points at it (07b-first-trip.js sail, deck, full, land, slip). Upright the line is empty only while she lies
// still with nothing on (U2-0: 6 of 48 samples), and its place stands
const HUD_SHORT = [['Fisket er ferdig', 'Ferdig'], ['Forhalingen er ferdig', 'Ferdig'], ['Bunkringen er ferdig', 'Ferdig'], ['Mannskapet er ferdig', 'Mannskapet ferdig'], ['Verkstedet er ferdig', 'Verkstedet ferdig'],
  ['Fishing done', 'Done'], ['Shifting done', 'Done'], ['Fuelling done', 'Done'], ['The crew is done', 'Crew done'], ['The yard is done', 'Yard done']];
function hudShortEv(txt){ for (const [a, b] of HUD_SHORT) if (txt === a) return b; return txt; }
function hudLine3(how){
  const strip = how === 'strip';
  const b = S.boat, H = S.t / 60, atSea = b.status !== 'port', no = S.lang === 'no', L = (a, c) => no ? a : c, I = typeof DOCK !== 'undefined' ? DOCK.info() : {};
  let cls = '', go = '', h = '';
  if (strip && atSea){
    if (RU.ok){ const r = ruNow(); if (r.v !== 'ok'){ const it = r.items.find(i => i.v === r.v); cls = r.v === 'no' ? 'r2' : 'r1'; h = (r.v === 'no' ? '✕ ' : '! ') + (it ? ruShort(it) : L('Regler', 'Rules')); } }
    if (!h){ const M = motionHere(H, b), z = M.state; if (z.lvl){ cls = 'r' + z.lvl; h = {gm:L('Rank båt', 'Tender boat'), res:stabStill(b) ? L('Synkronrulling · rull ', 'Synchronous roll · rolls ') + Math.round((M.M.roll + M.M.heel) * 180 / Math.PI) + '°' : L('Synkronrulling · endre kurs eller fart', 'Synchronous roll · change course or speed'), roll:L('Kraftig rulling · ta det rolig', 'Heavy rolling · ease off')}[z.why] || ''; } }
    if (!h && b.status !== 'sailing' && typeof gearBuoyNear === 'function'){ const nb = gearBuoyNear(b.pos); if (nb && nb.d > GEARLIE.alarm){ cls = 'r2'; go = String(nb.s.id); h = L('Blåsa ', 'Buoy ') + fmt(nb.d / NM, 1) + L(' nm unna · Kjør dit ›', ' nm off · Go there ›'); } }
  }
  let on = I.on || '';   // the work going on; in the box a row of its own under the event, in the strip only when there is no event
  // the next event: in the box «⏱ Fisket er ferdig 09:01 · om 27 min i ekte tid»; in the strip the real time stands in a span of its own
  // (.l3s) that gives way first when the line is short, so the event and its hour are never cut before it, and the narrow phone drops
  // the clock sign («Fisket er ferdig 19:30» and «Dekk 81 kg» on one line at 10 px in 47 vw of 390 px)
  // the narrow phone (Jonas 06.11.2026: «Bare å fjerne ordet "fisket" så får du masse plass»): line 1 says what she does («Fisker»,
  // «Forhaler», «Bunkrer»), so line 3 says only «Ferdig 19:30» beside the deck's kg; the crew and the yard keep their word, the place
  // its name («Fremme i Botnhamn»)
  const narrow = strip && window.innerWidth <= 560; let hs = '';
  if (!h){ const nx = nextEvent(); if (nx){ h = (narrow ? hudShortEv(nx.txt) : '⏱ ' + nx.txt) + ' ' + hm(nx.t / 60); if (strip) hs = '· ' + (no ? 'om ' : 'in ') + realDur(nx.t - S.t); else h += ' <small>· ' + inReal(nx.t - S.t) + '</small>'; } }
  if (!h && (on || I.place)){ h = on || I.place; on = ''; cls = 'q'; }
  if (!h && strip && atSea){ const cp = coldPen(H); if (cp > 0.03){ cls = 'cold'; h = L('Kulde −', 'Cold −') + Math.round(cp * 100) + ' % · ' + Math.round(effTemp(H)) + ' °C'; } }
  const tail = [strip ? '' : on, I.reels, I.deck ? (how === 'card' ? I.deck[0] : L('Dekk ', 'Deck ') + I.deck[1]) : ''].filter(Boolean).join(' · ');
  if (!h && tail) return '<div class="st nx q"><span class="l3">' + tail + '</span></div>';   // only the deck (or the work): the line itself
  if (!h && !tail && !strip) return '';
  return '<div class="st nx' + (cls ? ' ' + cls : '') + '"' + (go ? ' data-hgo="' + go + '"' : '') + '><span class="l3">' + h + '</span>' + (hs ? '<span class="l3s">' + hs + '</span>' : '') + (tail ? '<span class="l3d">' + tail + '</span>' : '') + '</div>';
}
function renderHud(){
  const b = S.boat, H = S.t / 60, no = S.lang === 'no', L = (a, c) => no ? a : c, F = hudFigures(), {W, hs, lvl, atSea, HF} = F;
  const dot = b.status === 'adrift' || b.status === 'engine' ? 'bad' : (b.status === 'sailing' || b.status === 'fishing') ? 'go' : '';
  document.body.classList.toggle('sailing', b.status === 'sailing');
  const v3 = document.body.classList.contains('v3d'), up = hudPortrait(), strip = up || !!S.settings.hudMin;
  if (hudCard && !(strip && v3)) hudCard = false;   // the card belongs to the strip in 3D; the plotter and the whole box have none
  const card = strip && hudCard;
  hudClasses(strip && !card, card);
  if (strip && !card){
    // the strip (U2-1; before it, Jonas 05.10.2026: «bare basisinformasjonen vises på en tynn stripe»): three lines of fixed height.
    // 1: the clock, the state with its dot, the till. 2: diesel, hold, energy and sea as an icon and a figure, coloured when they warn.
    // 3: hudLine3. A tap gives the whole box as a card over the chart; on its side, where the whole box is the normal state, «+» opens
    // it again for good
    // a phone upright (47 vw, as wide as the little chart, Jonas 06.11.2026): the figures without their units (the icons say what they
    // are; the card has them whole), and «I havn» without the place, which stands on line 3
    const narrow = up && window.innerWidth <= 560;
    const g2 = (k, f, lbl) => '<span class="g2 g-' + k + (f.cls ? ' ' + f.cls : '') + '" title="' + lbl + '">' + HICON[k] + '<b>' + (narrow ? (f.tiny || f.short || f.txt) : (f.short || f.txt)) + '</b></span>';
    const stTxt = narrow && b.status === 'port' && !b.land && !b.shift && !b.fueling && !(S.plan && S.plan.depAt) ? L('I havn', 'In port') : statusText();
    setHtml(hud, '<div class="hs1' + (up ? '' : ' wb') + '"><span class="ht">' + hm(H) + '</span><i class="dot ' + dot + '"></i><span class="hs">' + stTxt + '</span><b class="hc' + (S.cash < 0 ? ' r2' : '') + '">' + kr(cashShown()) + '</b>' +
      (up ? '' : '<button type="button" class="hmin" data-hmin="hud" aria-label="' + L('Vis hele boksen', 'Show the whole box') + '">+</button>') + '</div>' +
      '<div class="hs2">' + g2('fuel', F.fuel, 'Diesel') + g2('hold', F.hold, L('Last', 'Hold')) + g2('en', F.en, L('Energi', 'Energy')) + g2('sea', F.sea, L('Sjø', 'Sea')) + '</div>' + hudLine3('strip'));
  } else {
  // «Kystlys» U3 (docs/planer/ui-redesign.md, V5 A, 04.11.2026): the status box is instruments, not a table of eleven rows. Four gauges
  // on one row (diesel, hold, energy, sea), under them only what matters now (the rules at sea, a roll, the cold, the luck, the fleet),
  // and a tap on the gauges gives the whole table as before (S.settings.hudFull). As a card (U2-1) the table is open and the gauges are
  // no button; the ✕ closes it
  const gauge = (k, lbl, f) => '<span class="g g-' + k + (f.cls ? ' ' + f.cls : '') + '"><span class="gl">' + lbl + '</span><i style="--v:' + Math.round(clamp(f.v, 0, 1) * 100) + '%"></i><b>' + f.txt + '</b></span>';
  const gs = gauge('fuel', 'Diesel', F.fuel) + gauge('hold', L('Last', 'Hold'), F.hold) + gauge('en', L('Energi', 'Energy'), F.en) + gauge('sea', L('Sjø', 'Sea'), F.sea), showAll = card || !!S.settings.hudFull;
  const gauges = card ? '<div class="gauges open">' + gs + '</div>' : '<button type="button" class="gauges' + (showAll ? ' open' : '') + '" data-hfull aria-label="' + L('Vis alle tallene', 'Show all the figures') + '">' + gs + '</button>';
  // what matters now, as rows with what to do
  const now = [];
  if (S.fleet && S.fleet.length > 1) now.push('<div class="row"><span>' + L('Båt', 'Vessel') + '</span><b>' + S.boatName + (meAboard() ? ' ⚓' : '') + '</b></div>');
  // her own gear in the sea (spilltest 3, U2; Jonas 05.11.2026, V2 B): how far to the nearest buoy and how she moves; red with «Kjør dit»
  // a mile off
  if (atSea && b.status !== 'sailing' && typeof gearBuoyNear === 'function'){ const nb = gearBuoyNear(b.pos);
    if (nb){ const dv = b.drv, kn = dv ? Math.hypot(dv.x, dv.y) * 60 / NM : 0, far = nb.d > GEARLIE.alarm;
      const mv = dv && dv.up ? L('kjører opp', 'running up') : kn >= 0.1 ? L('driver ', 'drifting ') + fmt(kn, 1) + ' kn ' + dirName(trueDeg(Math.atan2(dv.x, -dv.y), b.pos)) : '';
      now.push('<div class="row' + (far ? ' warn' : '') + '"><span>' + L('Blåsa', 'Buoy') + '</span><b class="' + (far ? 'r2' : '') + '">' + fmt(nb.d / NM, 1) + ' nm' + (mv ? ' · ' + mv : '') + '</b>' +
        (far ? '<button type="button" class="hgo" data-hgo="' + nb.s.id + '">' + L('Kjør dit', 'Go there') + '</button>' : '') + '</div>'); } }
  if (atSea){ const z = motionHere(H, b).state; if (z.lvl) now.push('<div class="row warn"><span>' + L('Stabilitet', 'Stability') + '</span><b class="r' + z.lvl + '">' + {gm:L('rank', 'tender'), res:stabStill(b) ? L('synkronrulling · rull ', 'synchronous roll · rolls ') + Math.round((motionHere(H, b).M.roll + motionHere(H, b).M.heel) * 180 / Math.PI) + '°' : L('synkronrulling · endre kurs eller fart', 'synchronous roll · change course or speed'), roll:L('kraftig rulling · ta det rolig', 'heavy rolling · ease off')}[z.why] + '</b></div>'); }
  // the rules where you are (03e-rules.js ruNow): a tap opens the Regler app
  if (atSea && RU.ok){ const r = ruNow(), it = r.items.find(i => i.v === r.v && i.v !== 'ok'); now.push('<div class="row rlink"><span>' + L('Regler', 'Rules') + '</span><b class="' + (r.v === 'no' ? 'r2' : r.v === 'warn' ? 'r1' : 'r0') + '">' + (r.v === 'no' ? '✕ ' : r.v === 'warn' ? '! ' : '✓ ') + (it ? ruShort(it) : L('Lov her', 'Allowed here')) + ' ›</b></div>'); }
  { const cp = coldPen(S.t / 60); if (cp > 0.03) now.push('<div class="row"><span>' + L('Kulde', 'Cold') + '</span><b class="cold">−' + Math.round(cp * 100) + ' % · ' + Math.round(effTemp(S.t / 60)) + ' °C</b></div>'); }
  if (haillStage()) now.push('<div class="row"><span>' + L('Haill', 'Luck') + '</span><b class="haill">' + haillStage()[S.lang] + ' +' + Math.round(haillBoost() * 100) + ' %</b></div>');
  // the whole table behind the tap: the figures the gauges round off, the wind, the bonus and the bank's other accounts
  const full = !showAll ? '' : '<div class="hfull">' +
    '<div class="row"><span>' + t('wind') + '</span><b>' + dirName(windDir(H)) + ' ' + fmt(W, 1) + ' m/s</b></div>' +
    '<div class="row"><span>' + t('waves') + '</span><b>' + fmt(hs, 1) + ' m' + (atSea ? ' <span class="r' + lvl + '">' + t('risk' + lvl) + '</span>' : '') + '</b></div>' +
    '<div class="row"><span>' + t('fuel') + '</span><b>' + fmt(b.fuel, 0) + ' / ' + BOAT.fuelCap + ' L</b></div>' +
    '<div class="row"><span>' + t('hold') + '</span><b>' + HF.txt + (HF.fz ? ' ' + L('produkt', 'product') : '') + '</b></div>' + (HF.fz ? '<div class="row"><span>' + L('Rund vekt', 'Round weight') + '</span><b>' + HF.rnd + '</b></div>' : '') +
    (streakPct() > 0 ? '<div class="row"><span>Bonus</span><b>+' + fmt(streakPct(), 0) + ' %</b></div>' : '') +
    (S.bank && (S.bank.skatt >= 1 || S.bank.spare >= 1) ? '<div class="row"><span>' + L('Skatt · spart', 'Tax · saved') + '</span><b>' + kr(Math.round(S.bank.skatt)) + ' · ' + kr(Math.round(S.bank.spare)) + '</b></div>' : '') + '</div>';
  setHtml(hud, '<div class="hd"><span>' + dayStr(H) + ' ' + hm(H) + '</span><b class="' + (S.cash < 0 ? 'r2' : '') + '">' + kr(cashShown()) + '</b>' +
    (card ? '<button type="button" class="hmin" data-hcard aria-label="' + L('Lukk', 'Close') + '">✕</button>' : '<button type="button" class="hmin" data-hmin="hud" aria-label="' + L('Minimer', 'Minimise') + '">–</button>') + '</div>' +
    '<div class="st"><i class="dot ' + dot + '"></i>' + statusText() + '</div>' + hudLine3(card ? 'card' : 'box') + gauges + (now.length ? '<div class="hnow">' + now.join('') + '</div>' : '') + full);
  }
  // the compass and the plotter's instruments take their room from the box (--hudW, --gpsTop): measured when its content has changed and
  // every 2 s (setting them on the chart's parent every tick restyled the whole chart), never while the card is open (it is wider, and
  // nothing under it moves). In 3D the little chart has a fixed place of its own (styles.css, U2-1), whatever the box's height
  if (!card && (hud.dataset.v !== hudV || performance.now() - hudT > 2000)){ hudV = hud.dataset.v; hudT = performance.now(); requestAnimationFrame(() => { const mw = $('mapwrap').style, hr = hud.getBoundingClientRect(), top = Math.round(hr.bottom - $('mapwrap').getBoundingClientRect().top + 6) + 'px', w = Math.round(hr.width) + 'px'; if (mw.getPropertyValue('--gpsTop') !== top) mw.setProperty('--gpsTop', top); if (mw.getPropertyValue('--hudW') !== w) mw.setProperty('--hudW', w); }); }
}
// position/heading between simulation steps, so instruments and 3D move smoothly
function liveFrac(){ return clamp(acc + (wallNow() - lastWall) / 1000 * simRate() / 60, 0, 0.999); }
function livePose(frac){
  if (frac === undefined) frac = liveFrac();
  const b = S.boat, q0 = quayPos(b); let p = {x:q0.x, y:q0.y}, hd = b.heading, idx = S.plan ? S.plan.idx : 0;   // at the naust, its berth
  // at anchor: along the minute's swing round it (core/06e-anchor.js anchorSwing)
  if (b.anch && b.status !== 'port'){ const m = b.anch.mv; return m && m.t === S.t ? {p:{x:b.pos.x + m.x * frac, y:b.pos.y + m.y * frac}, hd:b.heading + dynAng(b.heading || 0, m.hd) * frac, frac, idx} : {p:{x:b.pos.x, y:b.pos.y}, hd:b.heading, frac, idx}; }
  if (dynLive()) return dynLivePose(frac);   // the manoeuvring model's own pose, a little on from its last tick (core/16b-dyn.js)
  if (helmOn()) return helmPose(frac);
  if (b.status === 'tow'){ const q = towPose(frac); if (q && q.b) return {p:q.b.p, hd:q.b.hd, frac}; }
  // setting or hauling: along the string at the minute's pace (core/10-gear.js gearOpMinute)
  if (b.gop && b.gop.mv && b.gop.mv.t === S.t) return {p:{x:b.pos.x + b.gop.mv.x * frac, y:b.pos.y + b.gop.mv.y * frac}, hd:b.heading, frac, idx};
  // lying still, she drifts along the minute's drift (core/16b-dyn.js lieDrift)
  if (b.drv && b.drv.st === b.status && b.drv.t === S.t) return {p:{x:b.pos.x + b.drv.x * frac, y:b.pos.y + b.drv.y * frac}, hd:b.drv.up ? Math.atan2(b.drv.x, -b.drv.y) : b.heading, frac, idx};
  if (b.status === 'sailing' && S.plan){
    let left = sailV(S.t / 60) * NM / 60 * frac;
    while (left > 1e-9 && idx < S.plan.wps.length){
      const w = S.plan.wps[idx], d = dist(p, w);
      if (d > 1e-6) hd = Math.atan2(w.x - p.x, -(w.y - p.y));
      if (d <= left){ p = {x:w.x, y:w.y}; left -= d; if (wpStop(w)) break; idx++; }
      else { p = {x:p.x + (w.x - p.x) / d * left, y:p.y + (w.y - p.y) / d * left}; left = 0; }
    }
  }
  return {p, hd, frac, idx};   // idx: the next waypoint from there
}
function vnoise2(x, y, s){
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const h = (a, c) => hash(Math.imul(a, 374761393) ^ Math.imul(c + s * 7919, 668265263));
  return (h(ix, iy) * (1 - ux) + h(ix + 1, iy) * ux) * (1 - uy) + (h(ix, iy + 1) * (1 - ux) + h(ix + 1, iy + 1) * ux) * uy;
}
// small-scale bottom texture on top of the 50 m model (finer data is classified in Norway)
function microBottom(p, d){ return (vnoise2(p.x * 40, p.y * 40, 3) - 0.5) * Math.min(4, 0.06 * d) + (vnoise2(p.x * 140, p.y * 140, 5) - 0.5) * Math.min(1.2, 0.02 * d); }

// ---------- instruments: GPS and echo sounder ----------
const INSTR = (() => {
  // the GPS's readings in the chart plotter's top bar (#ecdisTop); the GPS box and the little echogram box beside it went on
  // 02.10.2026 (the user's wishes: the box's lines are in the bar, the echo sounder's fish shows on the chart with its scale in the
  // bar). WPT and ETA show while a route is sailed (body.navon). echoOn: the echo sounder's setting, which the heat map and
  // the skiff's console follow
  const echoOn = () => !S.settings || S.settings.echo !== false;
  function show(){ renderGPS(); }
  // a grid heading (radians) as the true bearing the instruments show
  const deg3 = (r, p) => String(Math.round(trueDeg(r, p || S.boat.pos)) % 360).padStart(3, '0') + '°';
  function gpsLL(p){
    const {lat, lon} = LL(p), f = (v, w, hh) => { const a = Math.abs(v), dd = Math.floor(a); let m = ((a - dd) * 60).toFixed(3).padStart(6, '0'); if (S.lang === 'no') m = m.replace('.', ','); return String(dd).padStart(w, '0') + '°' + m + "'" + hh; };
    return [f(lat, 2, 'N'), f(lon, 3, (lon < 0 ? (S.lang === 'no' ? 'V' : 'W') : (S.lang === 'no' ? 'Ø' : 'E')))];
  }
  // the route's numbers: the next point (number, distance, bearing, time), the cross-track error and the time at the end
  function navOf(pose, H, sog){
    const b = S.boat; if (!(S.plan && S.plan.idx < S.plan.wps.length && b.status !== 'port')) return null;
    const wps = S.plan.wps.slice(S.plan.idx), w = wps[0], dw = kmTrue(pose.p, w), brg = Math.atan2(w.x - pose.p.x, -(w.y - pose.p.y));
    let tot = 0, a = pose.p, fishH = 0; wps.forEach((q, i) => { tot += kmTrue(a, q); a = q; if (i && q.fish > 0) fishH += q.fish; });
    const v = (sog || S.plan.speed || 10) * NM, last = wps[wps.length - 1], H0 = S.plan.depAt ? Math.max(H, S.plan.depAt / 60) : H;
    return {n:S.plan.idx + 1, wpt:fmt(dw / NM, 2) + ' nm ' + deg3(brg), at:hm(H0 + dw / v),
      dest:last.port ? portById(last.port).name : 'WPT ' + S.plan.wps.length, eta:hm(H0 + tot / v + fishH)};
  }
  // the box under the little chart in 3D (the user's wish 02.10.2026): the same width and look as the status box over it
  function render3d(pose, H, sog, ll, nv){
    const el = $('gps3d'), no = S.lang === 'no', on = S.boat.status !== 'port';
    GPS3D = {kn:fmt(sog, 1) + ' kn', crs:deg3(pose.hd), ll, nv};   // the little chart's foot (03e-miniplot.js)
    if (!el) return;
    if (S.settings.plotMin){ if (el.hidden) el.hidden = false; const pm = $('plotMin'); if (pm.textContent !== '+'){ pm.textContent = '+'; pm.setAttribute('aria-label', no ? 'Vis kartplotteren' : 'Show the chart plotter'); }
      setHtml(el, '<div class="gstrip"><b>' + fmt(sog, 1) + ' kn</b><b>' + deg3(pose.hd) + '</b><span>' + ll[0] + ' ' + ll[1] + '</span></div>'); return; }
    { const pm = $('plotMin'); if (pm.textContent !== '–'){ pm.textContent = '–'; pm.setAttribute('aria-label', no ? 'Minimer kartplotteren' : 'Minimise the chart plotter'); } }
    if (el.hidden === on) el.hidden = !on; if (!on) return;
    const row = (k, v) => '<div class="row"><span>' + k + '</span><b>' + v + '</b></div>';
    setHtml(el, row(no ? 'Fart' : 'Speed', fmt(sog, 1) + ' kn') + row(no ? 'Kurs' : 'Course', deg3(pose.hd)) + row('POS', ll[0]) + row('', ll[1]) +
      (nv ? row('WPT ' + nv.n, nv.wpt) + row(no ? 'Neste' : 'Next', nv.at) + row('ETA ' + nv.dest, nv.eta) : ''));
  }
  const GPSC = {k:'', nx:null, st:null};
  function renderGPS(){
    const v3 = document.body.classList.contains('v3d'); if (!v3 && !document.body.classList.contains('vplot')) return;
    const pose = livePose(), b = S.boat, H = (S.t + pose.frac) / 60, sog = b.status === 'sailing' || (b.status === 'tow' && b.tow && b.tow.ph === 'tow') ? b.v : 0, ll = gpsLL(pose.p), no = S.lang === 'no', nv = navOf(pose, H, sog);
    if (v3){ render3d(pose, H, sog, ll, nv); return; }
    const nav = !!nv;
    if (document.body.classList.contains('navon') !== nav) document.body.classList.toggle('navon', nav);
    if (nav){
      $('ecWptL').textContent = 'WPT ' + nv.n + ' · ' + nv.at; $('ecWpt').textContent = nv.wpt;
      $('ecEtaL').textContent = 'ETA · ' + nv.dest.toUpperCase(); $('ecEta').textContent = nv.eta;
    }
    $('ecHdg').textContent = deg3(pose.hd); $('ecSog').textContent = fmt(sog, 1) + ' kn'; $('ecPos').innerHTML = ll[0] + '<br>' + ll[1]; $('ecDepL').textContent = no ? 'DYBDE' : 'DEPTH'; $('ecDep').textContent = b.status === 'port' ? '–' : fmt(depthF(pose.p) + tideCD(H), 1) + ' m';
    // the next tide and the sun's day change slowly: worked out again every 10 game minutes or km
    const tk = Math.floor(S.t / 10) + ':' + Math.round(pose.p.x) + ':' + Math.round(pose.p.y);
    if (GPSC.k !== tk){ GPSC.k = tk; GPSC.nx = tideEvents(H, 14)[0]; GPSC.st = sunTimes(H); }
    const th = tideH(H), up = tideH(H + 0.25) > th, nx = GPSC.nx && GPSC.nx.t > H ? GPSC.nx : (GPSC.nx = tideEvents(H, 14)[0]), st = GPSC.st;
    $('ecTideL').textContent = no ? 'TIDEVANN' : 'TIDE'; $('ecTide').textContent = (th >= 0 ? '+' : '') + fmt(th, 1) + ' m ' + (up ? '↑' : '↓') + (nx ? ' ' + (nx.kind === 'high' ? (no ? 'flo ' : 'HW ') : (no ? 'fjære ' : 'LW ')) + hm(nx.t) : '');
    $('ecSunL').textContent = no ? 'SOL' : 'SUN'; $('ecSun').textContent = st.always ? (no ? 'Midnattssol' : 'Midnight sun') : st.never ? (no ? 'Mørketid' : 'Polar night') : '↑' + (st.up ? hm(st.up) : '–') + ' ↓' + (st.dn ? hm(st.dn) : '–');
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) show(); });
  return {show, renderGPS, echoOn};
})();
// a tap in the box: «Kjør dit» to the buoy, the fold and the card, the whole table, the rules line (the Regler app); on the strip itself,
// the whole box as a card (U2-1)
hud.addEventListener('click', e => {
  const go = e.target.closest('[data-hgo]'); if (go){ e.stopPropagation(); const s = mySets().find(x => String(x.id) === go.dataset.hgo); if (s) DOCK.goTo(s); return; }
  if (e.target.closest('[data-hmin]')){ e.stopPropagation(); hudFold('hud'); return; }
  if (e.target.closest('[data-hcard]')){ e.stopPropagation(); hudCardOpen(false); return; }
  if (e.target.closest('[data-hfull]')){ e.stopPropagation(); S.settings.hudFull = !S.settings.hudFull; save(); renderHud(); return; }
  if (e.target.closest('.rlink')){ PHONE.open('regler'); return; }
  if (document.body.classList.contains('hudcard')){ e.stopPropagation(); hudCardOpen(false); return; }   // a tap on the card itself closes it, as the ✕ does
  if (document.body.classList.contains('hudstrip')){ e.stopPropagation(); hudCardOpen(true); }
});
// the card over the chart: a tap outside or on the card closes it (as the dock's fans close), so do Escape and a turn of the screen,
// and the first trip when it points at something under it (07b-first-trip.js tutTip)
function hudCardOpen(on){ on = !!on; if (hudCard === on) return; hudCard = on; renderHud(); }
document.addEventListener('pointerdown', e => { if (hudCard && !hud.contains(e.target)) hudCardOpen(false); }, true);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && hudCard) hudCardOpen(false); });
window.addEventListener('resize', () => { if (hudCard) hudCardOpen(false); });
// the status box and the little chart each fold to a strip (S.settings.hudMin, plotMin), and «Vis HUD» in the settings takes them all
// away (hudOff): the status box, the little chart, its GPS strip and the compass. hudstrip and hudcard say what the box is right now
// (renderHud: upright it is always the strip); without them the classes stand as they are
function hudClasses(stripOn, cardOn){
  const st = S.settings || {}, c = document.body.classList, set = (k, v) => { if (v !== undefined && c.contains(k) !== !!v) c.toggle(k, !!v); };
  set('hudmin', st.hudMin); set('plotmin', st.plotMin); set('hudoff', st.hudOff); set('hudstrip', stripOn); set('hudcard', cardOn);
}
function hudFold(which){
  if (which === 'hud'){ S.settings.hudMin = !S.settings.hudMin; hudCard = false; } else S.settings.plotMin = !S.settings.plotMin;
  save(); renderHud(); if (typeof renderGPS === 'function') renderGPS();
}
$('plotMin').addEventListener('click', e => { e.stopPropagation(); hudFold('plot'); });
