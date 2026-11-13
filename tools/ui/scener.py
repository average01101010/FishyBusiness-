"""The dialogs, the tip, the toast and the boxes that lie over the 3D picture, as scenes the design tools open (designombyggingen D6,
13.11.2026): tools/ui/kontrast.py measures the text in each, tools/ui/designshots.py d6 photographs each. A scene is a name, the script
that opens it, the root its text is measured in, and the script that closes it. The real dialogs are opened where they can be from a
new game; the confirmation and the tip are made with the game's own modal() and #tip, with texts the game has.
"""
CLOSE_MODAL = "(() => { const m = document.getElementById('modal'); if (m){ m.hidden = true; m.innerHTML = ''; } })()"
TIP = """(() => { const t = document.getElementById('tip'); document.getElementById('tipText').textContent = %s;
  const ok = document.getElementById('tipOk'), sk = document.getElementById('tipSkip'), alt = document.getElementById('tipAlt');
  ok.textContent = 'OK'; ok.hidden = false; sk.textContent = S.lang === 'no' ? 'Hopp over' : 'Skip'; sk.hidden = false; alt.textContent = S.lang === 'no' ? 'Vis meg' : 'Show me'; alt.hidden = false;
  t.classList.toggle('small', %s); t.hidden = false; t.style.setProperty('display', 'block', 'important'); t.style.left = '24px'; t.style.top = Math.round(innerHeight * 0.42) + 'px';
  const a = t.querySelector('.tip-arrow'); if (a){ a.style.left = '30px'; a.style.top = '-7px'; } })()"""
SCENES = [
    # (name, open, root, close)
    ('dialog-bekreft', "modal('<h3>Slette driftsplanen for «' + S.boatName + '»?</h3><p>Hjem, redskap, plassene, levering, vær, rytme og statistikken for båten slettes. Båten og mannskapet beholdes.</p><p class=\"note\">Dette kan ikke angres.</p><div class=\"btns\"><button class=\"btn primary\" data-close>Behold planen</button><button class=\"btn dr-danger\" data-close>Slett planen</button><button class=\"btn\" data-close>Avbryt</button></div>')", '#modal', CLOSE_MODAL),
    ('dialog-regler', "modal('<h3>Reglene stopper båten på ruta</h3><p class=\"bad\"><b>Veipunkt 2:</b> Fredningsområde for kysttorsk: fiske med garn er forbudt her.</p><div class=\"btns\"><button class=\"btn primary\" data-close>Endre ruta</button><button class=\"btn\" data-close>Kast loss likevel</button></div>')", '#modal', CLOSE_MODAL),
    ('dialog-baten-etter-far', "showIntro()", '#modal', CLOSE_MODAL),
    ('dialog-borte', "(() => { const s = S.stats; S.sales.push({t:S.t - 30, total:18450, kg:920, port:S.boat.port || 'finnsnes', lines:[]}); showAway({t0:S.t - 600, rev:s.revenue - 18450, kg:s.kg - 920, fs:fsState().p - 400, realMs:3600000, mins:600, idx:0}); })()", '#modal', CLOSE_MODAL),
    ('dialog-ukas-kort', "ukeShow(Math.max(0, Math.floor(S.t / 60 / 168) - 1))", '#modal', CLOSE_MODAL),
    ('dialog-merker', "modal('<div class=\"ob achc\"><h2>Nye merker</h2><p>Tre merker siden sist.</p><ul class=\"ach-list\"><li><b>Første levering</b><span>Lever fangst på et mottak.</span></li><li><b>Hundre kilo · bronse</b><span>Fisk 100 kg på én tur.</span></li></ul><div class=\"btns\"><button class=\"btn\" data-close>Videre</button><button class=\"btn primary\" data-close>Åpne Merker</button></div></div>')", '#modal', CLOSE_MODAL),
    ('dialog-kapittel', "achChapterCard(0)", '#modal', CLOSE_MODAL),
    ('dialog-statistikk', "cloudAsk()", '#modal', CLOSE_MODAL),
    # (the register, the names and the notifications open only for a guest with the cloud on: the same markup through modal())
    ('dialog-registrer', "modal('<div class=\"ob reg\"><p class=\"reg-from\">Det Store Blå</p><h2>Ta vare på «Havbris»</h2><p>Godt levert! Nå har du noe å ta vare på.</p>' + guestHave() + '<p class=\"reg-next\">Det tar ti sekunder. Brukernavn og båtnavn velger du etterpå, og du kommer rett tilbake hit.</p><p class=\"reg-warn\">Nå ligger alt dette bare i denne nettleseren. Nettlesere sletter slikt, og da er det borte for godt.</p><ul class=\"reg-get\"><li>Båten, pengene og fangsten blir med deg</li><li>Spill videre på mobil, nettbrett og PC</li></ul><div class=\"btns\"><button class=\"btn\" id=\"regLater\" data-close>Senere</button><button class=\"btn primary\" id=\"regGo\">Registrer meg</button></div><p class=\"note\">Med Google, Apple eller e-post. <a href=\"#\" id=\"regIn\">Har du konto? Logg inn</a> · <a href=\"#\">Personvern</a></p></div>')", '#modal', CLOSE_MODAL),
    ('dialog-brukernavn', "modal('<div class=\"ob\"><h2>Velg et brukernavn</h2><p>Alle registrerte spillere har et brukernavn. Andre spillere ser det ved båten din, sammen med fartstiden din.</p><label for=\"nmU\">Brukernavn</label><input id=\"nmU\" placeholder=\"3–20 tegn\"><p class=\"note\">Bokstaver, tall og bindestrek.</p><div class=\"btns\"><button class=\"btn primary\" id=\"nmUserGo\">Lagre</button></div></div>')", '#modal', CLOSE_MODAL),
    ('dialog-varsler', "modal('<div class=\"ob\"><h2>Vil du ha beskjed?</h2><p>Vi sier fra når båten er framme, lasten er full eller redskapen har stått lenge.</p><div class=\"btns\"><button class=\"btn\" data-close>Ikke nå</button><button class=\"btn primary\" id=\"paYes\" data-close>Slå på varsler</button></div></div>')", '#modal', CLOSE_MODAL),
    ('dialog-hopp', "hopOpen()", '#modal', CLOSE_MODAL),
    # (hopOpen() in harbour gives only «why not»: the price card with the paid button and the small print, the same markup)
    ('dialog-hopp-pris', "modal('<h3>Hopp over resten av ruta</h3><p>Båten er framme i Botnhamn med en gang. 14 nm igjen.</p><p class=\"hop-kr\">19 kr</p><p class=\"hop-test\">Testkjøp: ingen penger trekkes.</p><div class=\"btns\"><button class=\"btn\" data-close>Avbryt</button><button class=\"btn primary\" id=\"hopGo\">Hopp · 19 kr</button></div><p class=\"ph-note shop-fine\">Kjøpet er endelig. Vilkår og angrerett står i butikken.</p>')", '#modal', CLOSE_MODAL),
    ('oppdatering', "(() => { let e = document.getElementById('updBar'); if (!e){ e = document.createElement('div'); e.id = 'updBar'; e.dataset.d6 = '1'; document.body.appendChild(e); } e.innerHTML = '<span>Ny versjon er klar</span><button type=\"button\">Oppdater</button><button type=\"button\" id=\"updX\">✕</button>'; })()", '#updBar', "(() => { const e = document.getElementById('updBar'); if (e && e.dataset.d6) e.remove(); })()"),
    ('kapplop-boks', "lopPop('<h4>Etappe 2 er åpen</h4><p>Lindesnes–Nordkapp: neste etappe går fra Egersund til Haugesund.</p><p class=\"lop-nx\">Starten går mandag 08:00.</p>')", '#lopPop', "(() => { const e = document.getElementById('lopPop'); if (e){ e.hidden = true; e.innerHTML = ''; } })()"),
    ('tips', TIP % ("'Trykk på «Butikk» for å kjøpe agn før du kaster loss. Uten agn får du ikke egnet lina.'", 'false'), '#tip', "(() => { const t = document.getElementById('tip'); t.style.removeProperty('display'); t.hidden = true; })()"),
    ('tips-lite', TIP % ("'Båten er på vei. Du er framme 07:40.'", 'true'), '#tip', "(() => { const t = document.getElementById('tip'); t.style.removeProperty('display'); t.hidden = true; })()"),
    ('toast', "toast('Autonav til Botnhamn, 3,2 nm. Trykk «Kast loss» når ruta ligger.', 20000)", '#toast', "toastClear()"),
]
# the dialogs that wait for the screen to be free before they open (ui/05e-merker.js achWhenFree: 1.5 s)
SLOW = {'dialog-kapittel': 2200}
