// ================= put the game on the home screen (Jonas 11.10.2026: «Det er viktig at brukerne laster ned spillet») =================
// The app keeps the game and the chart on the device and runs full screen; in the browser tab iOS clears what a site stores after a week
// without a visit. So the game recommends it: once after the first landing (and at most three times, two days apart), and as a card in
// Settings for as long as the game runs in a tab. Android (Chrome, Samsung): the browser's own install dialog when it offers one
// (beforeinstallprompt), else the menu steps; iPhone and iPad: «Del» and «Legg til på Hjem-skjerm» (there is no dialog to call).
const INSTALL = (() => {
  const KEY = 'dsb_install', ua = navigator.userAgent, L = (no, en) => cloudL(no, en);
  let ev = null;
  const os = () => /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ? 'ios' : /Android/.test(ua) ? 'android' : null;
  const standalone = () => !!(navigator.standalone || (window.matchMedia && (matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: minimal-ui)').matches)));
  const hasApp = () => !!document.querySelector('link[rel=manifest]');   // the build with a manifest and a service worker (the artifact has none)
  const st = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e){ return {}; } };
  const keep = o => { try { localStorage.setItem(KEY, JSON.stringify(Object.assign(st(), o))); } catch (e){} };
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); ev = e; });
  addEventListener('appinstalled', () => { keep({done:1}); ev = null; try { if (typeof cloudEv === 'function') cloudEv('install_done', {os:os()}); } catch (e){} const m = document.getElementById('modal'); if (m && !m.hidden && m.querySelector('.ob.inst')) m.hidden = true; });
  // can it be offered here: a phone or tablet (or a browser that has an install dialog) in a tab, not already the app
  const can = () => hasApp() && !standalone() && !st().done && (!!os() || !!ev);
  const SHARE = '<svg viewBox="0 0 24 24" width="22" height="22" style="vertical-align:-5px" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M8 7l4-4 4 4"/><path d="M5 11v9h14v-9"/></svg>';
  const steps = () => {
    if (os() === 'ios') return '<ol class="inst-steps"><li>' + L('Trykk på ', 'Tap ') + '<b>' + L('Del', 'Share') + '</b> ' + SHARE + L(' (firkanten med pil opp) i Safari.', ' (the square with an arrow up) in Safari.') + '</li>' +
      '<li>' + L('Bla ned og velg ', 'Scroll down and choose ') + '<b>' + L('Legg til på Hjem-skjerm', 'Add to Home Screen') + '</b>.</li><li>' + L('Trykk ', 'Tap ') + '<b>' + L('Legg til', 'Add') + '</b>.</li></ol>' +
      '<p class="note">' + L('Åpner du spillet i en annen nettleser enn Safari, finner du «Del» i menyen. Åpne spillet fra ikonet etterpå.', 'If you have the game open in a browser other than Safari, «Share» is in its menu. Open the game from the icon afterwards.') + '</p>';
    return '<ol class="inst-steps"><li>' + L('Åpne nettleserens meny ', 'Open the browser\'s menu ') + '(⋮).</li><li>' + L('Velg ', 'Choose ') + '<b>' + L('Installer app', 'Install app') + '</b> ' + L('eller ', 'or ') + '<b>' + L('Legg til på startskjermen', 'Add to Home screen') + '</b>.</li><li>' + L('Åpne spillet fra ikonet etterpå.', 'Open the game from the icon afterwards.') + '</li></ol>';
  };
  const why = () => L('Spillet starter fra ikonet i fullskjerm, kartet blir liggende på enheten så det går fort og virker uten nett, og lagringen blir værende. Nettlesere sletter det de har lagret etter en stund, på iPhone etter en uke uten besøk.', 'The game starts from the icon in full screen, the chart stays on the device so it is quick and works offline, and the save stays. Browsers delete what they have stored after a while, an iPhone after a week without a visit.');
  function ask(src){
    if (!can()) return false;
    const n = st().n || 0; keep({n:n + 1, t:Date.now()});
    modal('<div class="ob inst"><h2>' + L('Legg spillet på hjemskjermen', 'Put the game on your home screen') + '</h2><p>' + why() + '</p>' + (ev ? '' : steps()) +
      '<div class="btns"><button class="btn" data-close>' + L('Senere', 'Later') + '</button>' + (ev ? '<button class="btn primary" id="instGo">' + L('Installer', 'Install') + '</button>' : '<button class="btn primary" data-close>' + L('Skjønner', 'Got it') + '</button>') + '</div></div>');
    const b = document.getElementById('instGo'); if (b) b.onclick = () => go('modal');
    try { if (typeof cloudEv === 'function') cloudEv('install_ask', {os:os(), src, n:n + 1, dialog:!!ev}); } catch (e){}
    return true;
  }
  // the install button: the browser's dialog when it has one, else the steps
  async function go(src){
    try { if (typeof cloudEv === 'function') cloudEv('install_go', {os:os(), src, dialog:!!ev}); } catch (e){}
    if (!ev){ modal('<div class="ob inst"><h2>' + L('Legg spillet på hjemskjermen', 'Put the game on your home screen') + '</h2>' + steps() + '<div class="btns"><button class="btn primary" data-close>' + L('Skjønner', 'Got it') + '</button></div></div>'); return; }
    const m = document.getElementById('modal'); if (m && m.querySelector('.ob.inst')) m.hidden = true;
    try { ev.prompt(); const r = await ev.userChoice; if (r && r.outcome === 'accepted') keep({done:1}); } catch (e){}
    ev = null;
  }
  // the card in Settings
  function card(){
    if (!can()) return '';
    return '<div class="ph-card"><h4>' + L('Legg spillet på hjemskjermen', 'Put the game on your home screen') + '</h4><p class="ph-note">' + why() + '</p>' + (ev ? '' : steps()) +
      (ev ? '<button class="ph-btn p" data-pa="installGo">' + L('Installer spillet', 'Install the game') + '</button>' : '') + '</div>';
  }
  // after the first landing, when the screen is free and the registration card (a guest's) has had its turn; three times at most, two days apart
  function start(){
    if (!can()) return;
    const iv = setInterval(() => {
      if (!can()){ clearInterval(iv); return; }
      const s = st(); if ((s.n || 0) >= 3){ clearInterval(iv); return; }
      if (typeof tutOn === 'function' && tutOn()) return;
      if ((S.landN || 0) < 1 && (S.opens || 0) < 2) return;
      if (s.t && Date.now() - s.t < 2 * 864e5) { clearInterval(iv); return; }
      if (typeof isGuest === 'function' && isGuest() && !(S.regAsk > 0)) return;
      const m = document.getElementById('modal'); if (m && !m.hidden) return;
      const ph = document.getElementById('phone'); if (ph && !ph.hidden) return;
      ask('auto'); clearInterval(iv);
    }, 20000);
  }
  return {can, card, ask, go, start, standalone};
})();
