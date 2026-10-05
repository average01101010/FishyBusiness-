// ---------- the opening: the letter from Father ----------
// Jonas 05.10.2026: «Skjermen er helt svart, med en slitt konvolutt med røff håndskrift hvor det står: "Til den som tar over".
// Spilleren skal så kunne åpne konvolutten ved å trykke på den, og den vil da åpne seg på en tilfredsstillende måte. Ut kommer det et
// brettet brev som åpnes.» A new game opens on it: a tap turns the envelope over, the flap opens, the folded letter slides out, comes
// forward and unfolds, and «Ta over» goes on to naming the boat (showIntro). The paper is Blender's (tools/opening/brev.py, the
// pictures pic-letter-*), the handwriting the page's (Caveat and Rock Salt from Google Fonts), so it is sharp on any screen and has
// both languages; the paper sounds are made here from noise. The letter's words are Jonas's.
const LETTER = {
  read:false,
  to:{no:'Til den som tar over', en:'To whoever takes over'},
  tap:{no:'Trykk på konvolutten', en:'Tap the envelope'},
  go:{no:'Ta over', en:'Take over'},
  // [paragraph, space before it in lines]
  no:[['Til deg som står igjen på kaia.', 0],
    ['Hvis du leser dette, har havet endelig krevd sitt, eller så orket ikke kroppen mer.', 0.7],
    ['Jeg etterlater meg verken penger, gull eller enkle løsninger. Det du arver, er den gamle trebåten, en slitt presenning og et naust som har sett sine bedre dager.', 0.25],
    ['Havet her ute gir ingenting gratis. Det finnes uker hvor horisonten er grå og sjøen slår over rekka, hvor du blir sittende landfast i naustet og bare hører regnet tromme mot taket mens kaffekjelen koker tørr. Andre dager er sjøen tom, og fisken vil ikke ha det du har å by på, uansett hvor lenge du drar på snøret.', 0.25],
    ['Men så kommer de dagene da fjorden ligger speilblank, havet koker av fisk, og ingenting kunne vært bedre.', 0.25],
    ['Mulighetene finnes, men de krever at du tåler motbakkene og de dagene det butter imot. Resten må du finne ut av på egen hånd.', 0.8]],
  en:[['To you who are left standing on the quay.', 0],
    ['If you are reading this, the sea has finally claimed its due, or the body could not take any more.', 0.7],
    ['I leave behind neither money, gold nor easy answers. What you inherit is the old wooden boat, a worn tarpaulin and a boathouse that has seen better days.', 0.25],
    ['The sea out here gives nothing for free. There are weeks when the horizon is grey and the sea breaks over the rail, when you sit stuck ashore in the boathouse, listening to the rain drum on the roof while the coffee pot boils dry. Other days the sea is empty, and the fish want none of what you have to offer, however long you work the line.', 0.25],
    ['But then come the days when the fjord lies mirror-calm, the sea boils with fish, and nothing could be better.', 0.25],
    ['The chances are there, but they ask that you can take the uphill stretches and the days when everything goes against you. The rest you will have to find out on your own.', 0.8]],
  sign:{no:'– Far', en:'– Father'}
};
function letterPic(k){ const el = document.getElementById('pic-letter-' + k); const d = el && el.textContent.trim(); return d ? 'url(data:image/webp;base64,' + d + ')' : 'none'; }

// paper sounds from noise through a band-pass, with sparse clicks for the crackle: [length s, band Hz, Q, crackle]
let LETTER_AC = null;
function letterSound(kind){
  const st = S.settings || {}; if (st.sound === false) return; const vol = st.vol == null ? 0.6 : st.vol;
  const P = {lift:[0.18, 1600, 0.7, 0.2], flip:[0.3, 2300, 0.8, 0.5], peel:[0.6, 3400, 0.45, 1.6], slide:[0.95, 1300, 0.6, 0.25], unfold:[0.42, 2700, 0.55, 1.0], fold:[0.35, 1900, 0.6, 0.6]}[kind]; if (!P) return;
  try {
    LETTER_AC = LETTER_AC || new (window.AudioContext || window.webkitAudioContext)(); const ac = LETTER_AC; if (ac.state === 'suspended') ac.resume();
    const [dur, f, q, crack] = P, n = Math.floor(ac.sampleRate * dur), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++){ const t = i / n, env = Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.1)), 1.4); let x = Math.random() * 2 - 1; if (Math.random() < crack * 0.004) x *= 5; d[i] = x * env * (0.55 + 0.45 * Math.random()); }
    const src = ac.createBufferSource(); src.buffer = b; const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
    const g = ac.createGain(); g.gain.value = 0.42 * vol; src.connect(bp); bp.connect(g); g.connect(ac.destination); src.start();
  } catch (e){ /* no sound, no matter */ }
}

function showLetter(done){
  const en = S.lang === 'en', T = o => en ? o.en : o.no, slow = !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches), D = ms => slow ? ms : ms * 0.3;
  const sc = document.createElement('div'); sc.id = 'letter'; sc.className = 'lt'; sc.setAttribute('role', 'dialog'); sc.setAttribute('aria-modal', 'true'); sc.setAttribute('aria-label', T(LETTER.to));
  let dust = ''; for (let i = 0; i < 12; i++) dust += '<i style="left:' + (8 + Math.random() * 84).toFixed(1) + '%;top:' + (10 + Math.random() * 75).toFixed(1) + '%;animation-delay:-' + (Math.random() * 20).toFixed(1) + 's;animation-duration:' + (14 + Math.random() * 12).toFixed(1) + 's;width:' + (1 + Math.random() * 2).toFixed(1) + 'px"></i>';
  const paras = (en ? LETTER.en : LETTER.no).map(([p, gap], i) => '<p style="margin-top:' + gap + 'em;transform:rotate(' + ((i % 2 ? 0.35 : -0.45) + Math.random() * 0.2).toFixed(2) + 'deg)"' + (i === 0 ? ' class="lt-hi"' : '') + '>' + p + '</p>').join('') + '<p class="lt-sign">' + T(LETTER.sign) + '</p>';
  const face = (k, back) => '<div class="lt-face' + (back ? ' lt-bk' : '') + '" style="background-image:' + letterPic('paper') + ';background-position:0 ' + (k * 50) + '%"><div class="lt-txt" style="top:calc(var(--H) * -' + k + ' / 3)">' + paras + '</div></div>';
  sc.innerHTML = '<div class="lt-light"></div><div class="lt-dust">' + dust + '</div>' +
    '<div class="lt-stage">' +
      '<button class="lt-env" id="ltEnv" type="button" aria-label="' + T(LETTER.to) + '"><div class="lt-front" style="background-image:' + letterPic('env-front') + '">' +
        '<span class="lt-to">' + T(LETTER.to) + '</span><svg class="lt-ul" viewBox="0 0 200 12" preserveAspectRatio="none"><path d="M3 7 C 40 3, 80 10, 120 5 S 180 4, 197 8" /></svg></div></button>' +
      '<div class="lt-back" id="ltBack" hidden>' +
        '<div class="lt-inside" style="background-image:' + letterPic('env-inside') + '"></div>' +
        '<div class="lt-flap" id="ltFlap"><div class="lt-flap-o" style="background-image:' + letterPic('env-flap') + '"></div><div class="lt-flap-i" style="background-image:' + letterPic('env-flap') + '"></div></div>' +
        '<div class="lt-paper" id="ltPaper"><div class="lt-p lt-p1" id="ltP1">' + face(0) + face(0, true) + '</div><div class="lt-p lt-p2">' + face(1) + '</div><div class="lt-p lt-p3" id="ltP3">' + face(2) + face(2, true) + '</div></div>' +
        '<div class="lt-pocket" style="background-image:' + letterPic('env-pocket') + '"></div>' +
      '</div>' +
    '</div>' +
    '<div class="lt-hint" id="ltHint">' + T(LETTER.tap) + '</div><button class="lt-go" id="ltGo" type="button" hidden>' + T(LETTER.go) + '</button>';
  document.body.appendChild(sc);
  // the game under the scene is hidden while it is up, so the device draws only the letter (the chart and the panels cost frames)
  const app = document.getElementById('app'); if (app) app.style.visibility = 'hidden';
  const $l = id => document.getElementById(id), env = $l('ltEnv'), back = $l('ltBack'), flap = $l('ltFlap'), paper = $l('ltPaper'), go = $l('ltGo');
  // the sizes: the envelope EW wide, the unfolded letter W x H as large as the screen allows; the handwriting is fitted to the sheet
  let EW = 0, W = 0, H = 0;
  function layout(){
    const vw = innerWidth, vh = innerHeight;
    EW = Math.min(vw * 0.84, 560, vh * 0.62 * 1.414); H = Math.min(vh * 0.84, vw * 0.94 * 1.414); W = H / 1.414;
    sc.style.setProperty('--EW', EW + 'px'); sc.style.setProperty('--W', W + 'px'); sc.style.setProperty('--H', H + 'px');
    // the largest hand that fits the sheet, measured on a copy laid out off the screen (the sheet itself is hidden or folded)
    let f = H * 0.05; meas.style.width = W + 'px';
    for (let i = 0; i < 40; i++){ meas.style.fontSize = f + 'px'; if (meas.scrollHeight <= H) break; f *= 0.96; }
    paper.querySelectorAll('.lt-txt').forEach(e => { e.style.fontSize = f + 'px'; });
  }
  const meas = document.createElement('div'); meas.className = 'lt-txt'; meas.setAttribute('aria-hidden', 'true');
  meas.style.cssText = 'position:absolute;left:-9999px;top:0;height:auto;visibility:hidden;pointer-events:none'; meas.innerHTML = paras; sc.appendChild(meas);
  layout(); addEventListener('resize', layout);
  if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('500 20px Caveat'), document.fonts.load('20px "Rock Salt"')]).then(layout, () => {});
  // the folded letter in the envelope: its middle panel inside the pocket, scaled to the envelope
  const s0 = () => EW * 0.86 / W, y0 = () => EW / 1.414 * 0.12;
  paper.style.transform = 'translate(-50%,-50%) translateY(' + y0() + 'px) scale(' + s0() + ')';
  sc.animate([{opacity:0}, {opacity:1}], {duration:D(1400), easing:'ease-out', fill:'both'});
  env.animate([{opacity:0, transform:'translateY(18px) rotate(-6deg)'}, {opacity:1, transform:'translateY(0) rotate(-4deg)'}], {duration:D(1600), delay:D(500), easing:'cubic-bezier(.2,.7,.2,1)', fill:'both'});
  const hint = $l('ltHint'); setTimeout(() => hint.classList.add('on'), D(2600));
  const wait = ms => new Promise(r => setTimeout(r, D(ms)));
  const anim = (el, kf, o) => el.animate(kf, Object.assign({fill:'forwards'}, o, {duration:D(o.duration)})).finished;
  let opened = false;
  env.addEventListener('click', async () => {
    if (opened) return; opened = true; hint.classList.remove('on'); env.classList.add('still'); letterSound('lift');
    // turn it over
    await anim(env, [{transform:'perspective(1200px) rotate(-4deg) rotateY(0)'}, {transform:'perspective(1200px) rotate(-2deg) rotateY(90deg) scale(1.04)'}], {duration:330, easing:'ease-in'});
    letterSound('flip'); env.hidden = true; back.hidden = false; layout();
    await anim(back, [{transform:'perspective(1200px) rotate(-2deg) rotateY(-90deg) scale(1.04)'}, {transform:'perspective(1200px) rotate(0) rotateY(0) scale(1)'}], {duration:420, easing:'cubic-bezier(.2,.8,.3,1)'});
    // the flap comes loose and swings up over the top edge (in front of the letter until it stands up, then behind it)
    await wait(260); letterSound('peel');
    await anim(flap, [{transform:'perspective(900px) rotateX(0)'}, {transform:'perspective(900px) rotateX(90deg)'}], {duration:380, easing:'ease-in'});
    flap.classList.add('open');
    await anim(flap, [{transform:'perspective(900px) rotateX(90deg)'}, {transform:'perspective(900px) rotateX(180deg)'}], {duration:420, easing:'cubic-bezier(.2,.8,.3,1)'});
    // the letter slides up out of the pocket
    await wait(180); letterSound('slide');
    const up = -EW / 1.414 * 0.74;
    await anim(paper, [{transform:'translate(-50%,-50%) translateY(' + y0() + 'px) scale(' + s0() + ')'}, {transform:'translate(-50%,-50%) translateY(' + up + 'px) scale(' + s0() + ')'}], {duration:950, easing:'cubic-bezier(.45,0,.3,1)'});
    paper.classList.add('out');
    // the envelope falls away and the letter comes forward, still folded
    for (const el of back.querySelectorAll('.lt-inside,.lt-flap,.lt-pocket')) anim(el, [{transform:getComputedStyle(el).transform === 'none' ? 'none' : getComputedStyle(el).transform, opacity:1}, {transform:'translateY(70vh) rotate(9deg)', opacity:0}], {duration:900, easing:'cubic-bezier(.5,0,.8,.4)'});
    await anim(paper, [{transform:'translate(-50%,-50%) translateY(' + up + 'px) scale(' + s0() + ')'}, {transform:'translate(-50%,-50%) translateY(0) scale(1)'}], {duration:950, easing:'cubic-bezier(.3,.6,.2,1)'});
    // and unfolds: the top third, then the bottom
    await wait(150); letterSound('unfold');
    await anim($l('ltP1'), [{transform:'translateZ(2px) rotateX(-180deg)'}, {transform:'translateZ(0) rotateX(0)'}], {duration:720, easing:'cubic-bezier(.3,.7,.2,1)'});
    await wait(90); letterSound('fold');
    await anim($l('ltP3'), [{transform:'translateZ(1px) rotateX(180deg)'}, {transform:'translateZ(0) rotateX(0)'}], {duration:720, easing:'cubic-bezier(.3,.7,.2,1)'});
    paper.classList.add('flat');
    setTimeout(() => { go.hidden = false; requestAnimationFrame(() => go.classList.add('on')); go.focus({preventScroll:true}); }, D(1400));
  });
  go.addEventListener('click', async () => {
    go.disabled = true; letterSound('fold');
    if (app) app.style.visibility = ''; await anim(sc, [{opacity:1}, {opacity:0}], {duration:900, easing:'ease-in'});
    removeEventListener('resize', layout); if (app) app.style.visibility = ''; sc.remove(); done();
  });
}
