# D6: HUD-en, dialogene, innlastingen og resten

Fra `docs/planer/design-ombygging.md` (les den først: «Runde to», D1, D2 og D3). Jonas 13.11.2026: retning B «Styrhus» (mørkt glass som HUD-en), valg 1 A (nytt utseende og nye oppsett, samme innhold og funksjoner), og om rekkefølgen: «D6 når D3 er levert». D4 (sammenslåingene) er ikke bestemt og D5 (telefonen i nettbrettstørrelse) er ikke startet; D6 venter ikke på dem.

## Ferdig når

1. **Dialogene, tipsene og toasten er Styrhus:** bekreftelsene, tipsboksen, toasten og kortene som legger seg over 3D-bildet (fangstkortet, sluttseddelen, ukas kort) har de mørke flatene og rollene fra D1 (`--m-ink`, `--m-card` …), i 800 × 1280 og 1280 × 800. `python3 tools/ui/kontrast.py` er utvidet til å åpne dem og gir 0 under 4,5:1 (sett rød før rettingen når noe er under).
2. **HUD-en er lik i begge formater:** statuskortet i stående viser det samme som i liggende («Regler ✓ Lov her» og søylene), og kompasstapen og meldingene over 3D har en bakgrunn som holder teksten lesbar mot fjell og båt (målt eller vist i skjermbilde med 3D på, over lys og mørk bakgrunn).
3. **Kartet til sjøs har en synlig knapp:** det finnes en knapp til kartplotteren i knappelinja eller ved det lille kartet, ikke bare et trykk på kartet selv; det lille kartet har én palett (ikke mørkt, beige og lyst varmekart om hverandre).
4. **Magenta utenfor skuffen følger D3:** bare kjøp og godta er magenta også i HUD-en, infoboksen, knappelinja (`.dk-b.pri`), kartplotteren og dialogene; de andre hovedhandlingene har `--a-main`. Patchnotatet for dagen sier det.
5. **Kontroll og tester:** `/kontroll` på steget; `hudtest`, `docktest`, `dockrow`, `uishots`, `navbarshot`, `roetest`, `kystkarttest`; `tut.py` i begge formater (tipsene og knappelinja er endret); skjermbilder med 3D i begge formater i `docs/okter/<dato>-D6/`.

## Vit dette

- **Ikke rør** `ui/10i-shop.js`, `ui/10q-buymoment.js`, Stripe, `shop_*` eller `src/legal/` (ekte penger: PR til Jonas). Kjøpsøyeblikkets dialog er en av dem: den får fargene bare gjennom stilarket, og en endring der går som PR.
- **Papiret står:** dekksdagboka, Kystposten, brevet og notatene (`.ph-paper`) beholder papiret sitt. Innlastingen har et malt bilde som står; bare teksten og framdriften over det er steget.
- **Stilen:** Styrhus-blokka, D2-blokka og D3-blokka nederst i `src/styles.css`. Rollene har verdier bare i `#drawer` og `.ph-appv:not(.ph-paper)`; D6 gir dem verdier i de nye omfangene (dialogen, tipset, toasten, kortene), ikke globalt, så kartplotteren (ECDIS) og papiret ikke endres utilsiktet. `tools/ui/styrhus.py` gir hardkodede farger en rolle.
- **Magenta-lista** står i D3-blokka (`:is(#drawer,.ph-appv…) .ph-btn.p:is([data-pa=…])`): en ny kjøpsknapp må inn der. Utenfor skuffen brukes `.btn.primary`, `.dk-b.pri`, `.dk-go`, `#tipOk`, `.hgo` og `var(--mag)` direkte (rundt 35 steder; `grep -n "var(--mag)" src/styles.css`). Ruta, veipunktene og settelinja i kartet er magenta som sjøkartets egen farge og skal stå.
- **Verktøyene:** `tools/ui/designshots.py hud` (skjermen med 3D i havn, til sjøs, kartplotter, rute; 3D-bilder går ofte i tidsavbrudd i testmiljøet, kjør dem alene), `tools/ui/kontrast.py` (åpner i dag skuffesidene og appene, ikke dialogene og HUD-en).
- **Gemini fant (runde to):** kompasstapen uten bakgrunn forsvinner mot fjell og båt; statuskortet i stående mangler det liggende har; det lille kartet skifter palett; ingen synlig kartknapp til sjøs; telefonen i stående dekker «Verft» og «Om bord» (det siste hører til D5, ikke hit).
- **Ikke fotografert ennå:** Garderoben, dialogene og åpningen etter «Start» (brevet, veiledningen). Steget tar bildene før det endrer noe (førbilder), i begge formater.
- **Åpent fra D3 som hører hit:** Vedlikehold-siden har fortsatt tiden på knappen («Verkstedet · 2 000 kr · 3 t»); flere kjøp er nøytrale knapper og aldri magenta («Kjøp nå» hos megleren, «Kjøp til flåten», «Kjøp 50 kg is» på Havn). Jonas har ikke bedt om dem; ta dem bare om han sier det.
- **Filene steget eier:** `src/styles.css`, `ui/10c-dock.js` (knappelinja), `ui/07-guide.js` (infoboksen), HUD-koden (`docs/systemer/kodekart.md` sier hvor), `tools/ui/`. Hold deg unna `ui/phone/` utenom det stilarket gjør.
- **Gemini:** ett `ask_gemini`-kall med før- og etterbilder med 3D i begge formater og stilblokka (spørsmål som kan svares feil: «Hvor er knappen til kartet?», «Leser du kompasskursen mot fjellet?»).

+ halen (`docs/planer/start/README.md`).
