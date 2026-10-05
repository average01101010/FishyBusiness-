// ===== Tilbakemelding: the players' feedback on the phone (05.10.2026) =====
// Jonas 05.10.2026: «Lag en feedback-app i telefonen hvor brukerne kan komme med tilbakemeldinger, gjerne sortert etter hva
// tilbakemeldingen gjelder. La dem også laste opp bilde. På denne måten kan vi samle inn masse viktig data».
// What it is about (one of TOPICS), the text, how happy you are with the game (1-5, optional) and one picture: from the gallery or
// the camera, or of the game itself (G3.snap, the 3D view without the buttons). The picture is made smaller here (at most 1600 px on
// the long side, JPEG under about 400 kB), so it costs little to send and keep. With it go where and how it was played (meta below),
// so a bug can be found again. Sent with fb_send (supabase/migrations/20261005180000_feedback.sql) when signed in on detstorebla.no
// (CLOUD.on); in the artifact and the tests the app says where it can be sent from. The player sees what they have sent, its status
// and the answer (fb_mine); only the admin (/admin, Tilbakemeldinger) reads them all.
const FEEDBACK = (() => {
  const TOPICS = [['bug', 'Feil', 'Bug'], ['ui', 'Knapper og skjerm', 'Buttons and screen'], ['perf', 'Grafikk og fart', 'Graphics and speed'],
    ['fish', 'Fiske og fangst', 'Fishing and catch'], ['econ', 'Penger og priser', 'Money and prices'], ['boat', 'Båter og utstyr', 'Boats and gear'],
    ['world', 'Kart, vær og verden', 'Chart, weather and world'], ['tut', 'Første tur', 'First trip'], ['idea', 'Idé eller ønske', 'Idea or wish'], ['other', 'Annet', 'Other']];
  const STATUS = {new:['Mottatt', 'Received'], seen:['Lest', 'Read'], planned:['Kommer', 'Planned'], fixed:['Fikset', 'Fixed'], no:['Ikke nå', 'Not now']};
  const MAXPX = 1600, MAXLEN = 540000, MAXTXT = 4000;
  const D = {topic:null, body:'', rating:0, img:null, busy:false, imgBusy:false, mine:null, mineBusy:false, done:false, err:null};
  const L2 = (no, en) => S.lang === 'en' ? en : no;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
  const redraw = () => { if (PHONE.isOpen() && PHONE.app === 'tilbake') PHONE.render(); };
  const canSend = () => CLOUD.on && !!D.topic && D.body.trim().length >= 3 && !D.busy && !D.imgBusy;

  // where and how it was played: the build, the device and the view, and the boat (its position in lat/lon, 3 decimals)
  function meta(){
    let m = {}; try { m = cloudMeta(); } catch (e){}
    const b = S.boat, ll = b && b.pos ? natLL(b.pos) : null, q = typeof G3 !== 'undefined' && G3.quality ? G3.quality() : {};
    return {...m, w:innerWidth, h:innerHeight, dpr:Math.round((devicePixelRatio || 1) * 100) / 100, view:typeof G3 !== 'undefined' && G3.isActive() ? '3d' : 'kart',
      lvl:q.lvl, fps:q.fps ? Math.round(q.fps) : null, st:b && b.status, port:b && b.port, pos:ll ? [Math.round(ll.lat * 1000) / 1000, Math.round(ll.lon * 1000) / 1000] : null,
      t:Math.round(S.t || 0), tut:typeof tutOn === 'function' && tutOn() && tutStep() ? tutStep().id : null, energy:Math.round(S.energy || 0)};
  }

  // a picture made smaller: a JPEG data URL with at most MAXPX on the long side and under MAXLEN characters
  function shrink(src, w, h){
    for (const px of [MAXPX, 1200, 900]){
      const k = Math.min(1, px / Math.max(w, h)), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(src, 0, 0, c.width, c.height);
      for (const qy of [0.82, 0.7, 0.58]){ const u = c.toDataURL('image/jpeg', qy); if (u.length <= MAXLEN) return {url:u, w:c.width, h:c.height}; }
    }
    return null;
  }
  async function pick(file){
    if (!file) return;
    if (!/^image\//.test(file.type)){ toast(L2('Det er ikke et bilde.', 'That is not a picture.')); return; }
    D.imgBusy = true; redraw();
    try {
      let src, w, h;
      if (typeof createImageBitmap === 'function'){ src = await createImageBitmap(file); w = src.width; h = src.height; }
      else { const u = URL.createObjectURL(file); src = await new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = u; }); w = src.naturalWidth; h = src.naturalHeight; URL.revokeObjectURL(u); }
      const r = shrink(src, w, h); if (src.close) src.close();
      if (!r) throw new Error('too big');
      D.img = r;
    } catch (e){ console.error(e); toast(L2('Bildet kunne ikke leses.', 'The picture could not be read.')); }
    D.imgBusy = false; redraw();
  }
  // a picture of the game: the phone goes away for a moment, the 3D view draws a frame, and it is kept (G3.snap)
  async function snap(){
    if (typeof G3 === 'undefined' || !G3.isActive() || !G3.snap) return;
    D.imgBusy = true; PHONE.show(false);
    await new Promise(r => setTimeout(r, 450));
    let u = null; try { u = await G3.snap(MAXPX); } catch (e){ console.error(e); }
    if (u){ const im = new Image(); await new Promise(r => { im.onload = r; im.onerror = r; im.src = u; }); D.img = im.naturalWidth ? shrink(im, im.naturalWidth, im.naturalHeight) : null; }
    D.imgBusy = false; PHONE.open('tilbake');
    if (!D.img) toast(L2('Fikk ikke tatt bilde av spillet.', 'Could not take a picture of the game.'));
  }
  async function send(){
    if (!canSend()) return;
    D.busy = true; D.err = null; redraw();
    try {
      await cloudRpc('fb_send', {topic:D.topic, body:D.body.trim().slice(0, MAXTXT), rating:D.rating || null, img:D.img ? D.img.url : null, meta:meta()});
      D.body = ''; D.img = null; D.rating = 0; D.topic = null; D.done = true; D.mine = null;
      toast(L2('Takk! Tilbakemeldingen er sendt.', 'Thank you! Your feedback is sent.'));
      loadMine();
    } catch (e){ console.error(e); D.err = L2('Det gikk ikke å sende. Sjekk nettet og prøv igjen. Du kan sende opptil 20 om dagen.', 'It could not be sent. Check the network and try again. You can send up to 20 a day.'); }
    D.busy = false; redraw();
  }
  async function loadMine(){
    if (!CLOUD.on || D.mineBusy) return;
    D.mineBusy = true;
    try { D.mine = await cloudRpc('fb_mine', {}) || []; } catch (e){ D.mine = D.mine || []; }
    D.mineBusy = false; redraw();
  }

  function page(){
    if (CLOUD.on && D.mine === null) loadMine();
    const h = ['<div class="ph-c fb">'];
    if (!CLOUD.on) h.push('<div class="ph-card"><p>' + L2('Tilbakemeldinger sendes fra spillet på <b>detstorebla.no</b> eller i appen, når du er logget inn.', 'Feedback is sent from the game on <b>detstorebla.no</b> or in the app, when you are signed in.') + '</p></div>');
    if (D.done && !D.body) h.push('<div class="ph-card fb-ok"><p><b>' + L2('Takk!', 'Thank you!') + '</b> ' + L2('Vi leser alt som kommer inn. Svaret ser du nederst her.', 'We read everything that comes in. You will see the answer at the bottom here.') + '</p></div>');
    h.push('<div class="ph-card"><h4>' + L2('Hva gjelder det?', 'What is it about?') + '</h4><div class="fb-topics">' +
      TOPICS.map(([k, no, en]) => '<button class="fb-chip' + (D.topic === k ? ' on' : '') + '" data-pa="fbTopic" data-k="' + k + '">' + L2(no, en) + '</button>').join('') + '</div></div>');
    h.push('<div class="ph-card"><h4>' + L2('Fortell', 'Tell us') + '</h4><textarea id="fbBody" rows="6" maxlength="' + MAXTXT + '" placeholder="' +
      esc(D.topic === 'bug' ? L2('Hva gjorde du, hva skjedde, og hva hadde du ventet?', 'What did you do, what happened, and what did you expect?') : L2('Hva synes du, eller hva ønsker du deg? Jo mer konkret, jo bedre.', 'What do you think, or what would you like? The more concrete, the better.')) +
      '">' + esc(D.body) + '</textarea><p class="ph-note fb-n">' + D.body.length + ' / ' + MAXTXT + '</p></div>');
    const can3d = typeof G3 !== 'undefined' && G3.isActive() && !!G3.snap;
    h.push('<div class="ph-card"><h4>' + L2('Bilde', 'Picture') + ' <small>' + L2('valgfritt', 'optional') + '</small></h4>' +
      (D.imgBusy ? '<p class="ph-note">' + L2('Gjør klar bildet …', 'Getting the picture ready …') + '</p>'
        : D.img ? '<img class="fb-img" src="' + D.img.url + '" alt=""><div class="ph-row2"><span class="ph-note">' + D.img.w + ' × ' + D.img.h + ' · ' + Math.round(D.img.url.length / 1365) + ' kB</span><button class="ph-btn alt" data-pa="fbNoImg">' + L2('Fjern', 'Remove') + '</button></div>'
        : '<div class="ph-row2"><label class="ph-btn fb-file">' + L2('Velg bilde', 'Choose picture') + '<input type="file" id="fbFile" accept="image/*" hidden></label>' +
          (can3d ? '<button class="ph-btn" data-pa="fbSnap">' + L2('Bilde av spillet', 'Picture of the game') + '</button>' : '') + '</div>') + '</div>');
    h.push('<div class="ph-card"><h4>' + L2('Hvor fornøyd er du med spillet?', 'How happy are you with the game?') + ' <small>' + L2('valgfritt', 'optional') + '</small></h4><div class="fb-stars">' +
      [1, 2, 3, 4, 5].map(i => '<button class="fb-star' + (i <= D.rating ? ' on' : '') + '" data-pa="fbRate" data-k="' + i + '" aria-label="' + i + '">★</button>').join('') + '</div></div>');
    h.push('<p class="ph-note">' + L2('Med følger versjon, enhet, skjerm, grafikk og bildetakt, og hvor båten er og hva den gjør, så vi kan finne feilen igjen. Se personvernerklæringen.', 'With it go the version, device, screen, graphics and frame rate, and where the boat is and what it is doing, so we can find the bug again. See the privacy policy.') + '</p>');
    if (D.err) h.push('<p class="ph-note fb-err">' + esc(D.err) + '</p>');
    h.push('<button class="ph-btn p fb-send" data-pa="fbSend"' + (canSend() ? '' : ' disabled') + '>' + (D.busy ? L2('Sender …', 'Sending …') : L2('Send', 'Send')) + '</button>');
    if (CLOUD.on){
      h.push('<div class="ph-card"><h4>' + L2('Dine tilbakemeldinger', 'Your feedback') + '</h4>');
      if (D.mine === null) h.push('<p class="ph-note">' + L2('Henter …', 'Loading …') + '</p>');
      else if (!D.mine.length) h.push('<p class="ph-note">' + L2('Ingen ennå.', 'None yet.') + '</p>');
      else for (const f of D.mine){ const tp = TOPICS.find(x => x[0] === f.topic), st = STATUS[f.status] || STATUS.new;
        h.push('<div class="fb-mine"><div class="ph-kv"><span>' + new Date(f.ts).toLocaleDateString(S.lang === 'en' ? 'en-GB' : 'nb-NO') + ' · ' + (tp ? L2(tp[1], tp[2]) : f.topic) + (f.img ? ' · 📷' : '') + '</span><span class="fb-st ' + f.status + '">' + L2(st[0], st[1]) + '</span></div>' +
          '<p>' + esc(f.body) + '</p>' + (f.reply ? '<p class="fb-reply"><b>' + L2('Svar:', 'Answer:') + '</b> ' + esc(f.reply) + '</p>' : '') + '</div>'); }
      h.push('</div>');
    }
    h.push('</div>');
    return h.join('');
  }
  // the phone's taps (05-phone.js act0): true to draw the page again
  function act(a, d){
    if (a === 'fbTopic'){ D.topic = d.k; D.done = false; return true; }
    if (a === 'fbRate'){ D.rating = D.rating === +d.k ? 0 : +d.k; return true; }
    if (a === 'fbNoImg'){ D.img = null; return true; }
    if (a === 'fbSnap'){ snap(); return false; }
    if (a === 'fbSend'){ send(); return false; }
    return false;
  }
  // typing keeps the text between redraws (the page is drawn anew on every tap), and the count follows
  function input(v){ D.body = String(v).slice(0, MAXTXT); D.done = false; const n = document.querySelector('#phone .fb-n'); if (n) n.textContent = D.body.length + ' / ' + MAXTXT;
    const b = document.querySelector('#phone .fb-send'); if (b) b.disabled = !canSend(); }
  return {page, act, input, pick, meta, TOPICS, get draft(){ return D; }};
})();
