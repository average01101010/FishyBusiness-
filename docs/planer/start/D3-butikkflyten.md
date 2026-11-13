# D3: butikkene og kjøpet

Fra `docs/planer/design-ombygging.md` (les den først: «Hva Gemini fant», «Runde to», D1 og D2). Jonas 13.11.2026: valg 1 A (nytt utseende og nye oppsett, samme innhold og funksjoner), retning B «Styrhus», «Start D3 i en ny økt». Grenen bygger på `ccr-061ea8a6-pt4l71` (D1 og D2), som ikke er flettet inn i arbeidsgrenen.

## Ferdig når

1. **Varen først.** I Fiskeutstyr og Elektronikk og haler står første varekort over bretten i 800 × 1280 og 1280 × 800: stedshodet («Du er her»), monteringsnotatet, butikkdama og «Det båten trenger nå» er samlet i én kompakt topp, ikke fire bokser. Det samme i båthandelen: første båt over bretten, og båten du eier er merket «Din båt» i stedet for en grønn ramme.
2. **Tittelen står.** Skuffens tittel er den samme når fanen byttes mellom Redskap og Elektronikk og haler.
3. **Kjøpet sier hva det binder.** Knappen har handlingen og prisen; monteringstiden står som undertekst og sier at båten ligger til den er ferdig; et kjøp som bekreftes (fra `IC_CONFIRM_KR`), viser det før trykket; «Prøv på båten» sier hva den gjør, og står ikke på en vare som ikke kan kjøpes.
4. **Magenta bare på kjøp og godta.** De andre hovedhandlingene («Til service», «Lever fangst», «Rigg om», «Kjør dit», «Lag driftsplan») er sekundære; lasteromsstolpen og avkrysningsboksen er ikke magenta. Patchnotatet `styrhus-131126` rettes etter det.
5. **Oppgraderingene** har ett kortoppsett: alle med bilde, «Nå» og «Neste trinn» som to linjer, prisen på knappen.
6. **Kontroll og tester:** `/kontroll` på D2 og D3 sammen (D2 er ikke kontrollert); `python3 tools/ui/kontrast.py` 0; `docktest`, `dockrow`, `uishots`, `itemcardtest`, `shoptest`, `opptest`, `nettest`; `tut.py` i begge formater (UI-et er flyttet i D2 og D3; ikke kjørt etter D2).

## Vit dette

- **Ikke rør** `ui/10i-shop.js`, `ui/10q-buymoment.js`, Stripe, `shop_*` eller `src/legal/` (ekte penger: PR til Jonas).
- **Én kjøpslogikk:** regelen står i `buyGate` (`core/10-gear.js`) og `equipFits`; knappene spør den. D3 endrer hvordan det vises, ikke hva som kan kjøpes.
- **Verktøyene:** `tools/ui/designshots.py` (alle sider i begge formater, `rest` for underfanene, `hud` med 3D; 3D-bilder av malerverkstedet går ofte i tidsavbrudd), `tools/ui/kontrast.py` (åpner bare en nesten tom båt med ett mannskap: fangst om bord og redskap i sjøen er ikke dekket), `tools/ui/styrhus.py` (fargerollene; kjør den på ny CSS med hardkodede farger).
- **Stilen:** Styrhus-blokka og D2-blokka nederst i `src/styles.css`. Rollene (`--m-ink`, `--m-card` …) har verdier bare i `#drawer` og `.ph-appv:not(.ph-paper)`. Skissene: https://claude.ai/artifact/3fHdvNBptZ29gwPwERw3ZC (butikken i retning B viser kategoriskinne og kort uten boksene over).
- **Stedshodet** er `dress` i `ui/10c-dock.js`; butikkdama og «trenger nå» er `shopTop` i `ui/phone/13b-nettet.js`; varekortet er `itemCard` i `ui/05a-itemcard.js`; verftets linjer er `kitCard0` i `ui/phone/10-fartoy.js`.
- **Åpent fra forrige økt:** `docs/spill-dette/D2-skuffen.md` (Jonas på nettbrettet), `krabbefabrikktest` rød én gang under last (ikke undersøkt), Garderoben, dialogene og åpningen etter «Start» er ikke fotografert, backloggen er ikke oppdatert for denne grenen.
- **Gemini:** ett `ask_gemini`-kall med før- og etterbilder av butikken i begge formater når D3 er bygd (UX-flyten: «hva skjer når jeg trykker her?»). Forrige økt brukte 7 bilder og 2 vurderingskall.
