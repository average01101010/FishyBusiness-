// ===== Tilbakemelding: the players' feedback on the phone (05.10.2026) =====
// Jonas 05.10.2026: «Lag en feedback-app i telefonen hvor brukerne kan komme med tilbakemeldinger, gjerne sortert etter hva
// tilbakemeldingen gjelder. La dem også laste opp bilde. På denne måten kan vi samle inn masse viktig data».
// What it is about (one of TOPICS), the text, how happy you are with the game (1-5, optional), up to four pictures and two videos
// (Jonas 05.10.2026: «Litt viktig at spillet tillater skjermbilder og skjermopptak … essensielt ved logging av feilmeldinger»):
// pictures from the gallery or the camera, or of the game itself (G3.snap, the 3D view without the buttons), made smaller here (at
// most 1600 px on the long side, JPEG under about 400 kB); videos (screen recordings) up to two minutes, at most 50 MB as they go up,
// so a larger one is played through once here into a smaller one (720p, MediaRecorder) first. The pictures go with fb_send2, and each
// video afterwards straight to the private Storage bucket (fb_media_slot, then the upload with its progress, then fb_media_done;
// supabase/migrations/20261006010000_feedback_media.sql). A video that does not get through can be sent again; the text and the
// pictures are in by then. With it go where and how it was played (meta below),
// so a bug can be found again. Sent with fb_send (supabase/migrations/20261005180000_feedback.sql) when signed in on detstorebla.no
// (CLOUD.on); in the artifact and the tests the app says where it can be sent from. The player sees what they have sent, its status
// and the answer (fb_mine); only the admin (/admin, Tilbakemeldinger) reads them all.
const FEEDBACK = (() => {
  const TOPICS = [['bug', 'Feil', 'Bug'], ['ui', 'Knapper og skjerm', 'Buttons and screen'], ['perf', 'Grafikk og fart', 'Graphics and speed'],
    ['fish', 'Fiske og fangst', 'Fishing and catch'], ['econ', 'Penger og priser', 'Money and prices'], ['boat', 'Båter og utstyr', 'Boats and gear'],
    ['world', 'Kart, vær og verden', 'Chart, weather and world'], ['tut', 'Første tur', 'First trip'], ['idea', 'Idé eller ønske', 'Idea or wish'], ['other', 'Annet', 'Other']];
  const STATUS = {new:['Mottatt', 'Received'], seen:['Lest', 'Read'], planned:['Kommer', 'Planned'], fixed:['Fikset', 'Fixed'], no:['Ikke nå', 'Not now']};
  const MAXPX = 1600, MAXLEN = 540000, MAXTXT = 4000, MAXIMG = 4, MAXVID = 2, LIM = {vbytes:50 * 1048576, vsecs:120};
  const D = {topic:null, body:'', rating:0, imgs:[], vids:[], busy:false, imgBusy:false, vBusy:null, up:null, fid:null, mine:null, mineBusy:false, done:false, err:null};
  const L2 = (no, en) => S.lang === 'en' ? en : no;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
  const redraw = () => { if (PHONE.isOpen() && PHONE.app === 'tilbake') PHONE.render(); };
  const canSend = () => CLOUD.on && !D.busy && !D.imgBusy && !D.vBusy && (D.fid ? D.vids.length > 0 : !!D.topic && D.body.trim().length >= 3);

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
  // pictures and videos from the file picker (several at a time)
  async function pick(files){
    for (const file of Array.from(files || [])){
      if (/^video\//.test(file.type)) await addVideo(file);
      else if (/^image\//.test(file.type)) await addImage(file);
      else toast(L2('Det er ikke et bilde eller en video.', 'That is not a picture or a video.'));
    }
  }
  async function addImage(file){
    if (D.imgs.length >= MAXIMG){ toast(L2('Du kan legge ved opptil ' + MAXIMG + ' bilder.', 'You can add up to ' + MAXIMG + ' pictures.')); return; }
    D.imgBusy = true; redraw();
    try {
      let src, w, h;
      if (typeof createImageBitmap === 'function'){ src = await createImageBitmap(file); w = src.width; h = src.height; }
      else { const u = URL.createObjectURL(file); src = await new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = u; }); w = src.naturalWidth; h = src.naturalHeight; URL.revokeObjectURL(u); }
      const r = shrink(src, w, h); if (src.close) src.close();
      if (!r) throw new Error('too big');
      D.imgs.push(r);
    } catch (e){ console.error(e); toast(L2('Bildet kunne ikke leses.', 'The picture could not be read.')); }
    D.imgBusy = false; redraw();
  }
  // a video: its length, size and a still for the form; one larger than 50 MB is made smaller first
  const vidEl = blob => new Promise((ok, no) => { const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto';
    v.style.cssText = 'position:fixed;left:-20px;top:0;width:4px;height:4px;opacity:0;pointer-events:none'; document.body.appendChild(v);
    v.onloadedmetadata = () => ok(v); v.onerror = () => { v.remove(); no(new Error('video')); }; v.src = URL.createObjectURL(blob); });
  const vidGone = v => { try { URL.revokeObjectURL(v.src); } catch (e){} v.remove(); };
  async function still(v){
    try { v.currentTime = Math.min(0.5, (v.duration || 1) / 2); await new Promise(r => { v.onseeked = r; setTimeout(r, 1500); });
      const k = 240 / Math.max(v.videoWidth || 1, v.videoHeight || 1), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(v.videoWidth * k)); c.height = Math.max(1, Math.round(v.videoHeight * k));
      c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.7); } catch (e){ return null; }
  }
  async function addVideo(file){
    if (D.vids.length >= MAXVID){ toast(L2('Du kan legge ved opptil ' + MAXVID + ' videoer.', 'You can add up to ' + MAXVID + ' videos.')); return; }
    D.vBusy = {p:0, t:L2('Leser videoen …', 'Reading the video …')}; redraw();
    let v = null;
    try {
      v = await vidEl(file); const secs = isFinite(v.duration) ? v.duration : 0;
      if (secs > LIM.vsecs + 1){ toast(L2('Videoen er lengre enn to minutter. Klipp den i galleriet først.', 'The video is longer than two minutes. Trim it in the gallery first.')); return; }
      const pic = await still(v);
      let blob = file, mime = normMime(file.type);
      if (file.size > LIM.vbytes || !mime){ blob = await smaller(v, secs, p => vProg(p, L2('Gjør videoen mindre', 'Making the video smaller'))); mime = normMime(blob.type); }
      if (!blob || blob.size > LIM.vbytes || !mime) throw new Error('size ' + (blob && blob.size));
      D.vids.push({blob, mime, secs, pic, mb:blob.size / 1048576});
    } catch (e){ console.error(e); toast(L2('Videoen kunne ikke brukes. Ta et kortere opptak og prøv igjen.', 'The video could not be used. Take a shorter recording and try again.')); }
    finally { if (v) vidGone(v); D.vBusy = null; redraw(); }
  }
  const normMime = t => { const m = String(t || '').split(';')[0].trim().toLowerCase(); return ['video/mp4', 'video/webm', 'video/quicktime', 'video/3gpp'].includes(m) ? m : null; };
  function vProg(p, t){ D.vBusy = {p, t}; const e = document.querySelector('#phone .fb-prog'); if (e) e.textContent = t + ' … ' + Math.round(p * 100) + ' %'; else redraw(); }
  // played through once into a canvas at most 1280 px wide and recorded again at a rate that lands under the limit (as MP4 where the
  // browser records it, else WebM); it takes as long as the video
  async function smaller(v, secs, onp){
    if (typeof MediaRecorder === 'undefined') throw new Error('no MediaRecorder');
    const type = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t));
    if (!type) throw new Error('no type');
    const k = Math.min(1, 1280 / Math.max(v.videoWidth || 1280, v.videoHeight || 720)), c = document.createElement('canvas');
    c.width = Math.max(2, Math.round((v.videoWidth || 1280) * k / 2) * 2); c.height = Math.max(2, Math.round((v.videoHeight || 720) * k / 2) * 2);
    const g = c.getContext('2d'), rec = new MediaRecorder(c.captureStream(30), {mimeType:type, videoBitsPerSecond:Math.max(4e5, Math.min(2.5e6, Math.floor(LIM.vbytes * 8 * 0.85 / Math.max(1, secs))))}), parts = [];
    rec.ondataavailable = e => { if (e.data && e.data.size) parts.push(e.data); };
    const stopped = new Promise(r => { rec.onstop = r; });
    v.currentTime = 0; await new Promise(r => { v.onseeked = r; setTimeout(r, 1000); });
    let raf = 0; const draw = () => { g.drawImage(v, 0, 0, c.width, c.height); onp(Math.min(1, v.currentTime / Math.max(0.1, secs))); if (!v.ended) raf = requestAnimationFrame(draw); };
    const ended = new Promise(r => { v.onended = r; });
    rec.start(1000); await v.play(); draw(); await ended; cancelAnimationFrame(raf); g.drawImage(v, 0, 0, c.width, c.height);
    rec.stop(); await stopped;
    return new Blob(parts, {type:type.split(';')[0]});
  }
  // a video up to the bucket, with its progress (XMLHttpRequest, as fetch does not tell how far an upload has come)
  function upload(path, blob, mime, onp){
    return cloudToken().then(tok => new Promise((ok, no) => {
      const x = new XMLHttpRequest(), c = CLOUD_CFG;
      x.open('POST', c.supabaseUrl.replace(/\/$/, '') + '/storage/v1/object/feedback-media/' + path.split('/').map(encodeURIComponent).join('/'));
      x.setRequestHeader('apikey', c.supabaseAnon); if (tok) x.setRequestHeader('Authorization', 'Bearer ' + tok);
      x.setRequestHeader('Content-Type', mime); x.setRequestHeader('x-upsert', 'false'); x.setRequestHeader('cache-control', 'max-age=3600');
      x.upload.onprogress = e => { if (e.lengthComputable) onp(e.loaded / e.total); };
      x.onload = () => x.status >= 200 && x.status < 300 ? ok() : no(new Error('upload ' + x.status + ' ' + String(x.responseText || '').slice(0, 160)));
      x.onerror = () => no(new Error('upload network')); x.send(blob); }));
  }
  // a picture of the game: the phone goes away for a moment, the 3D view draws a frame, and it is kept (G3.snap)
  async function snap(){
    if (typeof G3 === 'undefined' || !G3.isActive() || !G3.snap) return;
    D.imgBusy = true; PHONE.show(false);
    await new Promise(r => setTimeout(r, 450));
    let u = null; try { u = await G3.snap(MAXPX); } catch (e){ console.error(e); }
    let r = null; if (u){ const im = new Image(); await new Promise(q => { im.onload = q; im.onerror = q; im.src = u; }); r = im.naturalWidth ? shrink(im, im.naturalWidth, im.naturalHeight) : null; }
    if (r && D.imgs.length < MAXIMG) D.imgs.push(r);
    D.imgBusy = false; PHONE.open('tilbake');
    if (!r) toast(L2('Fikk ikke tatt bilde av spillet.', 'Could not take a picture of the game.'));
  }
  // the text and the pictures first (fb_send2; fb_send with the first picture where the database does not have it yet), then each
  // video; if a video does not get through, the form keeps it and «Send videoen på nytt» tries the videos only
  async function send(){
    if (!canSend()) return;
    D.busy = true; D.err = null; redraw();
    try {
      if (!D.fid){
        try { D.fid = await cloudRpc('fb_send2', {topic:D.topic, body:D.body.trim().slice(0, MAXTXT), rating:D.rating || null, imgs:D.imgs.map(i => i.url), meta:meta()}); }
        catch (e){ if (!/ 404$/.test(e.message)) throw e;
          D.fid = await cloudRpc('fb_send', {topic:D.topic, body:D.body.trim().slice(0, MAXTXT), rating:D.rating || null, img:D.imgs[0] ? D.imgs[0].url : null, meta:meta()}); D.vids = []; }
        D.body = ''; D.imgs = []; D.rating = 0; D.topic = null; D.mine = null;
      }
      while (D.vids.length){
        const v = D.vids[0], n = D.vids.length;
        D.up = {p:0}; vProg(0, L2('Sender videoen', 'Sending the video') + (n > 1 ? ' (' + n + ')' : ''));
        const path = await cloudRpc('fb_media_slot', {fid:D.fid, mime:v.mime, bytes:v.blob.size, secs:Math.round(v.secs)});
        await upload(path, v.blob, v.mime, p => vProg(p, L2('Sender videoen', 'Sending the video')));
        await cloudRpc('fb_media_done', {path}); D.vids.shift(); D.vBusy = null;
      }
      D.fid = null; D.up = null; D.vBusy = null; D.done = true;
      toast(L2('Takk! Tilbakemeldingen er sendt.', 'Thank you! Your feedback is sent.'));
      loadMine();
    } catch (e){ console.error(e); D.vBusy = null; D.up = null;
      D.err = D.fid ? L2('Teksten og bildene er sendt, men videoen kom ikke fram. Sjekk nettet og trykk «Send videoen på nytt».', 'The text and pictures are sent, but the video did not get through. Check the network and tap «Send the video again».')
        : L2('Det gikk ikke å sende. Sjekk nettet og prøv igjen. Du kan sende opptil 20 om dagen.', 'It could not be sent. Check the network and try again. You can send up to 20 a day.'); }
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
    const can3d = typeof G3 !== 'undefined' && G3.isActive() && !!G3.snap, full = D.imgs.length >= MAXIMG && D.vids.length >= MAXVID;
    h.push('<div class="ph-card"><h4>' + L2('Bilder og video', 'Pictures and video') + ' <small>' + L2('valgfritt', 'optional') + '</small></h4>' +
      (D.imgs.length || D.vids.length ? '<div class="fb-media">' + D.imgs.map((m, i) => '<div class="fb-th"><img src="' + m.url + '" alt=""><button class="fb-x" data-pa="fbNoImg" data-i="' + i + '" aria-label="' + L2('Fjern', 'Remove') + '">×</button></div>').join('') +
        D.vids.map((v, i) => '<div class="fb-th vid">' + (v.pic ? '<img src="' + v.pic + '" alt="">' : '') + '<span>▶ ' + (v.secs >= 1 ? Math.round(v.secs) + ' s · ' : '') + fmt(v.mb, 1) + ' MB</span>' +
          (D.fid ? '' : '<button class="fb-x" data-pa="fbNoVid" data-i="' + i + '" aria-label="' + L2('Fjern', 'Remove') + '">×</button>') + '</div>').join('') + '</div>' : '') +
      (D.imgBusy ? '<p class="ph-note">' + L2('Gjør klar bildet …', 'Getting the picture ready …') + '</p>' : '') +
      (D.vBusy ? '<p class="ph-note fb-prog">' + esc(D.vBusy.t) + ' … ' + Math.round(D.vBusy.p * 100) + ' %</p>' : '') +
      (D.fid || full || D.imgBusy || D.vBusy ? '' : '<div class="ph-row2"><label class="ph-btn fb-file">' + L2('Velg bilder eller video', 'Choose pictures or video') + '<input type="file" id="fbFile" accept="image/*,video/*" multiple hidden></label>' +
          (can3d && D.imgs.length < MAXIMG ? '<button class="ph-btn" data-pa="fbSnap">' + L2('Bilde av spillet', 'Picture of the game') + '</button>' : '') + '</div>') +
      '<p class="ph-note">' + L2('Opptil ' + MAXIMG + ' bilder og ' + MAXVID + ' videoer på inntil to minutter. Skjermbilde: av/på og volum ned samtidig. Skjermopptak: dra ned hurtigmenyen og velg «Skjermopptak». Videoene ser bare utviklerne.',
        'Up to ' + MAXIMG + ' pictures and ' + MAXVID + ' videos of up to two minutes. Screenshot: power and volume down together. Screen recording: pull down the quick settings and choose «Screen recorder». Only the developers see the videos.') + '</p></div>');
    h.push('<div class="ph-card"><h4>' + L2('Hvor fornøyd er du med spillet?', 'How happy are you with the game?') + ' <small>' + L2('valgfritt', 'optional') + '</small></h4><div class="fb-stars">' +
      [1, 2, 3, 4, 5].map(i => '<button class="fb-star' + (i <= D.rating ? ' on' : '') + '" data-pa="fbRate" data-k="' + i + '" aria-label="' + i + '">★</button>').join('') + '</div></div>');
    h.push('<p class="ph-note">' + L2('Med følger versjon, enhet, skjerm, grafikk og bildetakt, og hvor båten er og hva den gjør, så vi kan finne feilen igjen. Se personvernerklæringen.', 'With it go the version, device, screen, graphics and frame rate, and where the boat is and what it is doing, so we can find the bug again. See the privacy policy.') + '</p>');
    if (D.err) h.push('<p class="ph-note fb-err">' + esc(D.err) + '</p>');
    h.push('<button class="ph-btn p fb-send" data-pa="fbSend"' + (canSend() ? '' : ' disabled') + '>' + (D.busy ? L2('Sender …', 'Sending …') : D.fid ? L2('Send videoen på nytt', 'Send the video again') : L2('Send', 'Send')) + '</button>');
    if (CLOUD.on){
      h.push('<div class="ph-card"><h4>' + L2('Dine tilbakemeldinger', 'Your feedback') + '</h4>');
      if (D.mine === null) h.push('<p class="ph-note">' + L2('Henter …', 'Loading …') + '</p>');
      else if (!D.mine.length) h.push('<p class="ph-note">' + L2('Ingen ennå.', 'None yet.') + '</p>');
      else for (const f of D.mine){ const tp = TOPICS.find(x => x[0] === f.topic), st = STATUS[f.status] || STATUS.new;
        h.push('<div class="fb-mine"><div class="ph-kv"><span>' + new Date(f.ts).toLocaleDateString(S.lang === 'en' ? 'en-GB' : 'nb-NO') + ' · ' + (tp ? L2(tp[1], tp[2]) : f.topic) + (f.nimg > 1 ? ' · 📷 ' + f.nimg : f.img ? ' · 📷' : '') + (f.vids ? ' · 🎬' + (f.vids > 1 ? ' ' + f.vids : '') : '') + '</span><span class="fb-st ' + f.status + '">' + L2(st[0], st[1]) + '</span></div>' +
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
    if (a === 'fbNoImg'){ D.imgs.splice(+d.i || 0, 1); return true; }
    if (a === 'fbNoVid'){ if (!D.fid) D.vids.splice(+d.i || 0, 1); return true; }
    if (a === 'fbSnap'){ snap(); return false; }
    if (a === 'fbSend'){ send(); return false; }
    return false;
  }
  // typing keeps the text between redraws (the page is drawn anew on every tap), and the count follows
  function input(v){ D.body = String(v).slice(0, MAXTXT); D.done = false; const n = document.querySelector('#phone .fb-n'); if (n) n.textContent = D.body.length + ' / ' + MAXTXT;
    const b = document.querySelector('#phone .fb-send'); if (b) b.disabled = !canSend(); }
  return {page, act, input, pick, meta, TOPICS, LIM, get draft(){ return D; }};
})();
