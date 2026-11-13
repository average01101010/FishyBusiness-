# Designombyggingen: alle menyer (plan, ikke bygd)

**Jonas 13.11.2026:** «send bilder av UI, UX, GUI fra alle butikker, menyer, undermenyer, skuffer og alt til gemini. Målet er en total design-rebuild i spillet der […] målet er et skikkelig løft fra hvordan det ser ut i dag. Sammen med gemini og meg skal vi finne ut av hvordan vi skal lage dette.» Og: «vi skal i gang med en fullstendig UI/UX/GUI-overhaul så mye må testes i etterkant uansett.»

Ingenting er bygd. Dette er grunnlaget og valgene.

## Hva som er sendt, og hva som mangler

`tools/ui/designshots.py` tar hver skjerm i 800 × 1280 og 1280 × 800 til `tests/out/design/`. Første runde: 46 skjermer per format (92 bilder), ett `ask_gemini`-kall.

- **Med:** skjermen i havn, de 21 skuffesidene (butikk, mottak, verft, bank, mannskap, om bord), telefonens hjemskjerm, 22 apper, nettbutikken, dekksdagbokas første oppslag.
- **Mangler:** skjermen til sjøs og HUD-en over 3D (bildene er tatt uten 3D, så bakgrunnen er svart), kartplotteren og ruteplanleggeren, «Sett ut»-skuffen og fisket for hånd, underfanene i appene og skuffene (bare første fane er tatt), dekksdagbokas andre faner, Garderoben (åpnes ikke som en vanlig app; skriptet feilet der), Admin, Kystmegleren, dialogene (bekreftelser, kjøpsøyeblikket), innlastingen, innloggingen, brevet, startstedet og veiledningen, telefon- og PC-størrelsene, mørkt tema, og tilstander med innhold (fangst om bord, redskap i sjøen, mannskap, skadet utstyr). Butikken for ekte penger er bare sett som Kaibodens første fane.

Runde to tar det som mangler før noe låses.

## Hva Gemini fant (hele svaret: `design-ombygging-gemini.md`)

1. **Samme ting flere steder:** lasterommet (tre steder), redskapen (to skuffer, pluss en «Kjøp»-fane), driftsplanen og mannskapet (fire innganger), oppdrag (skuff og app med ulikt innhold), prisene og regnskapet (havn, bank, Rederi, Salgslaget, dagboka), blad B (båthandelen og Kvote).
2. **De verste skjermene:** telefonens hjemskjerm (liten telefon i hjørnet, dekker «Verft» og «Om bord» i stående, nederste ikonrad kuttet), Havn i liggende (pristabellen kuttet), Malerverkstedet (arket dekker båten du maler, rundt 90 små fargeruter på én gang), utstyrsbutikken (fire bokser før første vare, tittelen skifter med fanen), båthandelen (fem bokser før første båt), Om bord › Redskap, Oppgraderinger, Innstillinger (knapperaden kuttet).
3. **Ingen felles byggeklosser:** minst fire knappestiler (magenta, marine, grønn, stiplet), flere kort- og fanestiler.
4. **Formatene brukes feil:** liggende har skuffen som en smal spalte på 30 % uansett innhold; stående har alltid et ark på 80 %, også når det er nesten tomt eller skjuler båten.
5. **Telefonen:** behold fiksjonen (statuslinja, appfargene, hjem-knappen), men la den bli en skjerm i nettbrettstørrelse på nettbrett og fylle hele skjermen på en ekte telefon.
6. **Kjøpet:** uklart hva «Kjøp og monter · 3 t (30 min i ekte tid)» binder, om det bekreftes, og hva «Prøv på båten» gjør. For få varer til søk; to filtre («Passer båten», «Kan kjøpes nå») holder.
7. **Designsystem:** bygger på tokenene som finnes; magenta beholdes som den ene fargen for «kjøp/godta», én primærknapp per kort, minst 44 px trykkflate, minste skrift 12 px, én kortmal for varer og én for statuslinjer, én fanestil.
8. **Det som er bra og skal stå:** kartet og HUD-en, dekksdagboka, Kystposten, Regler- og Fiskeguide-tabellene, de malte bildene, roen (ingen nedtelling, ingen press).

## Øktas vurdering

- Enig i hovedlinja: mest å hente på (a) felles byggeklosser, (b) formatene, (c) færre innganger til samme ting, (d) telefonen i nettbrettstørrelse.
- **Navigasjonsforslaget (Kaia, Bygd & Verft, Om bord, Telefon, Dagbok) passer ikke rett inn:** knappelinja følger i dag stedet (utstyrsbutikk, mottak, verft er tre steder, `docs/handelssteder.md`), og Gemini har slått mottaket og butikken sammen til «Kaia». Sammenslåingen av skuffesidene kan gjøres uten å røre den regelen.
- **Ikke sjekket mot koden:** tapptellingen, hva som skjer ved «Kjøp og monter», og om vifta finnes slik den antar. Bekreftelsen finnes (kjøp fra 10 000 kr bekreftes i knappen, `IC_CONFIRM_KR`), så punktet «ingen bekreftelse» er feil, men at det ikke synes før trykket, stemmer.
- Gemini så ikke 3D-bildet bak menyene. Hvor mye av båten og sjøen en meny skal dekke, er halve spørsmålet, og må vurderes i runde to med 3D på.
- Ekte penger (`ui/10i-shop.js`, `ui/10q-buymoment.js`) og `src/legal/` går som PR til Jonas uansett fase.

## Faser (forslag, hver én økt)

- **D0 Runde to:** resten av skjermene, med 3D og med innhold; skisser av tre nøkkelskjermer (utstyrsbutikken i liggende, telefonen på nettbrett, Om bord) som Jonas velger mellom.
- **D1 Byggeklossene:** knapper, kort, faner, skrift og avstander som ett sett i `styles.css`; ingen flytting. Størst synlig løft for minst risiko.
- **D2 Formatene:** bredere skuff med rutenett i liggende for butikk, båthandel, oppgraderinger og havn; ark etter innholdet i stående; malerverkstedet viser båten.
- **D3 Butikkene og kjøpet:** varen først, én topplinje i stedet for fire bokser, tydelig hva kjøpet binder.
- **D4 Sammenslåingene:** én plass for lasterom, redskap, mannskap og drift, oppdrag, regnskap.
- **D5 Telefonen i nettbrettstørrelse** og appene i to spalter.
- **D6 HUD-en, dialogene, innlastingen og resten.**

Etter hver fase: `designshots.py` før og etter, `uishots`, og Jonas på nettbrettet. De lange UI-testene tas samlet etter D2 og D5, ikke etter hver fase.

## Valg for Jonas

1. **Hvor dypt?** A: nytt utseende og nye oppsett, samme innhold og funksjoner (anbefalt: D1–D3 først, så vurdere). B: også sammenslåing og ny navigasjon (D4–D5) fra start. C: bare byggeklossene.
2. **Telefonen på nettbrett:** A: stor skjerm som beholder telefonens ramme og statuslinje (anbefalt). B: som i dag. C: fjern telefonen som ramme, appene blir vanlige paneler.
3. **Knappelinja:** A: som i dag, etter stedet (anbefalt; følger handelsstedsregelen). B: Geminis fem faste.
4. **Retning for utseendet:** velges fra skissene i D0, ikke nå.

## Runde to (13.11.2026): underfanene, dagboka og skjermene over 3D

99 bilder i ett kall: 86 av underfanene i skuffene og appene, dagbokas faner og innlastingen (`rest..`), og 13 med 3D tegnet (`hud..`: havn, telefonen og malerverkstedet over 3D, til sjøs, kartplotter, rute).

**Det Gemini fant som står seg:**

- **Menyene over 3D:** malerverkstedet i stående dekker rundt 85 % og lar båten stå i en stripe på toppen; telefonen i stående dekker «Verft» og «Om bord» i knappelinja. Den trakk derfor tilbake «ark etter innholdet»: i stående trengs et tak (55–60 %) over knappelinja, og en bredere skuff i liggende krever at kameraet flytter båten til venstre. En telefon i nettbrettstørrelse må være en egen flate som skjuler knappelinja, ikke flyte over den.
- **HUD-en:** kompasstapen øverst har ingen bakgrunn og forsvinner mot fjell og båt; statuskortet i stående mangler «Regler ✓ Lov her» og søylene som liggende har; det lille kartet skifter mellom mørkt, beige og lyst varmekart.
- **Til sjøs:** fiske, anker og Om bord er lette å finne; det finnes ingen synlig knapp til kartet (man må vite at det lille kartet åpner det).
- **Faner uten tegn på at de ruller:** Milepæler (sju faner, tre synlige), Kvote (fire, pluss fem underfaner på to linjer), båthandelens fire filtre på to linjer.
- **Tette skjermer som trenger mest:** Kvote (din kvote først), Regler › Sjekk (32 valg før svaret; svaret for båten din her og nå først), Kystbanken › Regnskap (tre tall først, resten under «Detaljer»).
- **Dekksdagboka:** fanene Sesonger, Hendelser, Utstyr og Salg overlapper Fiskeguiden, Kystposten, Redskap og Salgslaget; i stående blir boka liten med håndskrift rundt 8–9 px. Gemini vil løse den opp. **Økta er uenig:** i runde én kalte den selv boka «standout worldbuilding», og fiksjonen er Jonas' valg. Lesbarheten i stående er det ekte problemet.

**Feil i skjermbildene, ikke i spillet (skriptet, rettet eller notert):**

- **Kartplotteren og ruta** (`hud07`, `hud08`) viste sjø uten kart: skriptet åpnet den med `setBodyView(false)` i stedet for `openPlotter()`. Rettet i skriptet. **`tests/uishots.py` hadde samme feil** og har fotografert en tom plotter; med kartet på plass fant testen at feltene i topplinja var 3–6 px for smale i stående nettbrett. Rettet i `src/styles.css` (feltene holder bredden, ekkoloddforklaringen gir etter), `uishots` rød før og grønn etter.
- **Innlastingen** (`rest43`) var et grått bilde: tatt etter 0,6 s, før bildet av naustet var hentet. Punkt 6 og beslutning 10 hos Gemini faller.
- **Kystbanken fane 2–7** var samme bilde: skriptet trykket på knapper som ikke er faner. `skuff-arbeid` og `skuff-beholdning` er samme skuff («Om bord») åpnet på ulik fane, ikke to sider.

**Fortsatt ikke tatt:** Garderoben og underfanene i Tilbakemelding og Innstillinger (åpnes ikke fra skriptet), åpningen etter «Start» (brevet, veiledningen), dialogene, og tilstander med fangst, mannskap og redskap i sjøen.

**Geminis beslutningsliste** (ti A/B-valg) står i svaret. De som er nye i forhold til valgene under: tak på arkhøyden i stående, kameraet som flytter båten når skuffen åpnes, en synlig kartknapp til sjøs, lik HUD i begge formater, én kartpalett, og bakgrunn på kompasset og meldingene.

## Usikkert

- Hvor mye D2 og D5 koster i ytelse og testing er ikke målt.
- Bare første fane av hver skjerm er sett; funnene om «tomme» sider kan skyldes at båten var tom.

## Status

13.11.2026: runde én og to sendt, planen skrevet. Ingenting av ombyggingen er bygd; kartplotterens topplinje i stående er rettet underveis. Venter på Jonas.
