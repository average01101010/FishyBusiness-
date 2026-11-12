# Spill dette: det Jonas bør prøve på nettbrettet

Jonas 09.11.2026: grafikken og at arbeidet om bord er ekte, er det viktigste, og skjermbildene fra øktene er tatt med en emulert grafikkbrikke, ikke på nettbrettet. Derfor får hver bølge en kort spillerunde: 15–20 minutter med det øktene har endret, og det Jonas finner, blir steg i køen.

- **Hver økt som endrer noe spilleren ser eller kjenner** (grafikk, båten, arbeidet om bord, fangst, tider, UI), skriver en fil `docs/spill-dette/<steg>.md` i samme commit som statusen i køen: høyst fem linjer, hver med *hvor* (båt, sted, tid på døgnet, vær), *hva du gjør* og *hva som skal skje*. Ingen fil når endringen bare er dokumenter eller tester.
- **Koordinatoren** (`tools/plan/KOORDINATOR.md`) samler filene for Jonas, og flytter det han har sett, til `sett.md` med datoen og ordene hans. Det han fant, blir steg i køen.
- Én fil per steg, så øktene ikke skriver i samme fil.
- **Samlet** (taket fra 12.11.2026 ble fjernet samme dag, Jonas: «Fjern taket på 7 steg. Det hindrer oss bare i arbeidet»): `python3 tools/plan/venter.py` teller filene (nye fra og med 12.11.2026 og eldre), og `--liste` skriver `SAMLET.md`, alt sortert etter hvor i spillet det prøves. Tallet stopper ingen økt. `SAMLET.md` redigeres ikke for hånd.
