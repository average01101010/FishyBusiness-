# D5: telefonen i nettbrettstørrelse, og appene i to spalter

Fra `docs/planer/design-ombygging.md` (les «Runde to», «Jonas' svar», D0, D1 og D6). Jonas 13.11.2026, valg 2: «A», telefonen blir en stor flate på nettbrett som beholder telefonens ramme og statuslinje. Jonas 13.11.2026, etter D6: «Start D5 i en ny økt». D4 (sammenslåingene) er ikke bestemt, og D5 venter ikke på den. Samme dag tok han bort «Kart»-knappen D6 la ved det lille kartet («det ser ikke bra ut»): legg ikke nye knapper i HUD-en uten at han har bedt om dem.

## Ferdig når

1. **Telefonen er en stor flate på nettbrett:** i 800 × 1280 og 1280 × 800 åpner telefonen som en flate med rammen og statuslinja (klokka, dekningen) den har i dag, større enn dagens 330 × 660, og den ligger ikke over knappelinja: knappene «Verft» og «Om bord» er enten synlige og kan trykkes, eller hele knappelinja er skjult mens telefonen er åpen (`docktest` eller en ny sjekk viser det i begge formater). Telefonen på en telefon (opp til 560 px bred, eller opp til 520 px høy) er som i dag.
2. **Hjemskjermen bruker plassen:** appene står i grupper, og det viktigste nå (det hjemskjermen viser øverst i dag) står ved siden av dem i liggende og over dem i stående; ingen app er borte og ingen har byttet navn (`tabtest` og sjekkene for hjemskjermen i `docktest` er grønne).
3. **Appene med noe å sammenligne har to spalter** i den store flata (de samme kortene som skuffen fikk i D2: varekort, båtkort, mannskapskort; Rederi, Kvote og Regler etter innholdet), og lesesidene (Håndboka, Patchnotes, Regler › tekst) har en linjelengde som kan leses (høyst rundt 75 tegn).
4. **Kontrasten holder og papiret står:** `python3 tools/ui/kontrast.py` gir 0 under 4,5:1 i 1280 × 800 og i 800 × 1280 (kjør den i begge; i dag måler den bare liggende), og Kystposten, notatene og dekksdagboka har papiret sitt.
5. **Kontroll og tester:** `/kontroll` på steget; `docktest`, `tabtest`, `uishots`, `navbarshot`, `roetest`, `kystkarttest`, `itemcardtest`; `tut.py` i begge formater (veiledningen peker inn i telefonen); skjermbilder i begge formater i `docs/okter/<dato>-D5/`, med 3D bak telefonen i minst ett.

## Vit dette

- **Gemini fant (runde to):** telefonen i stående dekker «Verft» og «Om bord» i knappelinja; en telefon i nettbrettstørrelse må være en egen flate som skjuler knappelinja, ikke flyte over den. Skissen Jonas så (D0): appene i tre grupper og det viktigste nå ved siden av.
- **Ikke rør** `ui/10i-shop.js`, `ui/10q-buymoment.js`, Stripe, `shop_*` eller `src/legal/` (ekte penger: PR til Jonas). Kaiboden og Trim får utseendet bare gjennom stilarket.
- **Stilen:** blokkene Styrhus (D1), D2, D3 og D6 nederst i `src/styles.css`. Rollene (`--m-ink`, `--m-card` …) har verdier i `#drawer`, `.ph-appv:not(.ph-paper)` og D6-omfangene (dialogen, tipset, målebrettet, kappløpsboksen); hovedknappen er `--a-main` og magenta står bare på kjøp og godta (lista i D3-blokka; en ny kjøpsknapp må inn der).
- **Telefonen i dag:** `#phone` er 330 × 660 nederst til høyre (`src/styles.css`, «#phone»), fyller skjermen uten ramme på en telefon (`max-width:560px`, `max-height:520px`). Koden er delt i `src/js/ui/phone/` (stykker av én funksjon: de kan ikke `node --check`-es alene, bare bygges); `docs/systemer/kodekart.md` sier hvor hjemskjermen (`08-home-papers-merker.js`) og skallet (`00-shell.js`) er, og `docs/systemer/ui-og-telefon.md` («U2-6: Hjemskjermen») sier hva Jonas har bestemt om hjemskjermen.
- **HUD-en etter D6:** et nettbrett i stående har hele statusboksen i 3D (`hudPortrait`, `hudSheet` i `ui/04-panels-instruments.js`), stripa over skuffens ark og i kartplotteren. En stor telefonflate må ikke skjule dem uten at det er meningen: bestem om HUD-en står eller skjules bak telefonen, og vis det i bildene.
- **Verktøyene:** `tools/ui/designshots.py` (alle skuffesider, appene og dagboka i begge formater; `hud kort` gir havn, til sjøs og kartplotter med 3D; `d6` dialogene, tipset, toasten og garderoben), `tools/ui/kontrast.py`, `tools/ui/scener.py`. Et 3D-bilde tar flere minutter i testmiljøet: kjør dem alene og i bakgrunnen, og bygg til en egen mappe (`KYST_DIST=dist-full`) mens førbildene tas av det gamle bygget.
- **Testene går tregt i testmiljøet** (D3 og D6): `tut.py` ett format om gangen med `KYST_TUT_ONE=liggende` og `KYST_TUT_ONE=staaende`.
- **Filene steget eier:** `src/styles.css`, `src/js/ui/phone/00-shell.js`, `08-home-papers-merker.js` og de appene som får to spalter, `tools/ui/`. Sjekk «Øktene som kjører» først: `ui/phone/07-patch.js` røres av alle som skriver patchnotat.
- **Gemini:** ett `ask_gemini`-kall med før- og etterbilder i begge formater og stilblokka (spørsmål som kan svares feil: «Hvilke knapper i knappelinja kan du trykke mens telefonen er åpen?», «Hva er det viktigste på hjemskjermen?»).

+ halen (`docs/planer/start/README.md`).
