# Driftsplan 2: valgene etter GUI-gjennomgangen (05.11.2026)

Bakgrunn: `03-gui-gjennomgang.md` (funnene, med mål, bilder og filer). F1–F7 er rettet. U4 (Pause stopper båten) og U11 (din egen hvile når planen er hjemme) er bygd 05.11.2026 etter Jonas' svar. Dette er resten: U1–U3, U5–U10, U12–U14 og P1–P7. **Jonas har svart (05.11.2026, under «Status»); ingenting er bygd ennå.**

Jonas' ord som gjelder: «Kjør på med F1–F7 først, så tar vi resten i en ny økt» (05.11.2026). Reglene: grafikken og opplevelsen på nettbrettet (berøring, stående og liggende), handelsstedene (kjøp bare i butikken, på mottaket og på verftet), og ingen grunner til hvorfor noe er laget slik i patchnotes.

## Gruppe 1: rettinger uten reelt valg (ett «ja» tar alle)

Forslaget i rapporten bygges som det står. Anbefaling: **ja til alle**.

| | Hva | Rettingen | Fil |
|---|---|---|---|
| U2 | «Krever fire om bord» på en snekke som aldri kan gå døgndrift | Båtens grenser først: «Båten har ingen køyer» / «Båten har plass til bare 3», så hva som mangler | `ui/05d-plan2.js` `rhythm` |
| U3 | En rad med feil blir rød og liten i hele innholdet | Egen klasse som bare farger verdien; verdien sier hva som mangler («1 juksplass · mangler felt») | `ui/05d-plan2.js` `row`, `styles.css` |
| U5 | «Nå» og «I dag» viser ulik sluttid for juksinga | Steget som er i gang, viser motorens tid begge steder | `ui/05d-plan2.js` `preview` |
| U10 | Skipperens kort tilbyr «Gjør til styrmann» | Knappen vises ikke på skipperen | `ui/05b-work.js` |
| U12 | «Mer» lukker seg når skuffen tegnes på nytt | Husk åpne «Mer» per side | `ui/10c-dock.js` `fold` |
| U13 | Grunnene under «Ikke klar ennå» er bare tekst | Hver grunn blir en knapp til raden eller siden som løser den | `ui/05d-plan2.js` `top`, `core/06g-plan2.js` `plan2Check` (grunnene får et mål) |
| P1 | Planlista over ECDIS-linja, som skinner gjennom | ECDIS-linja skjules i planmodus | `styles.css` (`body.pm`) |
| P2 | «Felt 1» oppå fangstmerkets etikett | Merkets etikett skjules når en nål står på merket | `ui/03g-planmap.js` |
| P3 | Kortet sier linetypen to ganger | Den andre raden heter «Stamper» | `ui/03g-planmap.js` |
| P4 | «Dagen: dagen er 14 t», tider etter midnatt uten «i morgen» | «Dagen er 14 t.», og «i morgen kl.» etter midnatt | `core/06g-plan2.js` `planDayText` |
| P5 | Toasten midt over skuffen i stående; «Lager planen …» henger 0,7 s | Toasten over skuffen når den er åpen; skuffen tegnes med en gang etter Start | `styles.css`, `ui/05d-plan2.js` |
| P6 | «longline»/«Line», liten forbokstav, brytning på kortet (engelsk) | Ett ord («Longline»), stor forbokstav, kortere tekst på kortet | `ui/03g-planmap.js`, `core/06g-plan2.js` |

## Gruppe 2: reelle valg

**U1 – Skuffen er 55 % av høyden i stående format** (på 384×853 ser du bare Start og dagen).
- **A (anbefalt):** Driftsplan (og de andre skjemasidene) åpner i 88 % høyde i stående format. Raskt, og 3D-bildet over trengs ikke mens du planlegger.
- B: Skuffen kan dras opp og ned med fingeren, på alle sider. Mer arbeid, og drag i skuffen må ikke krangle med rulling.
- C: Begge.

**U6 – Kortet i kartet dekker Autonav, Søk og Vis båten på telefon.**
- **A (anbefalt):** De tre knappene skjules i planmodus. Planmodus trenger dem ikke, og Ferdig tar deg tilbake.
- B: Knappene løftes over kortet.

**U7 – 49 trykkflater under 44 px** (−/+, ↑/↓, Fjern, forhåndsvalgene, kortets ×).
- **A (anbefalt):** Alle minst 44×44 på siden og i kartkortet, kortets × som egen 44 px-knapp, mer luft mellom − og +. Siden blir litt lengre (mer sveip, se U1).
- B: 44 px bare i kartkortet og på −/+; resten som i dag.

**U8 – Start ser nøytral ut, Slett er den tyngste knappen.**
- **A (anbefalt):** Start grønn og fylt, Slett som rød kantknapp, én farge for «gå videre» på hele siden.
- B: Som i dag.

**U9 – Planen kan startes uten blåsesett** (lina blir liggende om bord, båten jukser).
- **A (anbefalt):** Ingen blåsesett til et felt er en feil: Start er låst, med grunnen og veien til utstyrsbutikken (kjøpet skjer i butikken, som før). Færre sett enn felt er fortsatt en advarsel.
- B: Bare advarselen, men øverst og tydeligere.

**U14 – Hjem-lista sier lite, verft står som mulig hjem, naustet står sist.**
- **A (anbefalt):** Naustet først, så rorbuene nærmest plassene, så resten; hver linje sier det som skiller (egnebu, hvile for deg og mannskapet, avstand til plassene); verft tas ut av lista.
- B: Bare sorteringen.
- C: Som A, men verft blir stående.

**P7 – Slett bruker nettleserens `confirm()`.**
- **A (anbefalt):** Spillets egen bekreftelse med planens navn og hva som skjer med redskapet i sjøen.
- B: Som i dag.

## Rekkefølgen når Jonas har svart

Én økt: gruppe 1 og valgene, i den rekkefølgen: U9 og U13 (planen som ikke går), U1 og U7 (siden på nettbrettet), U6, P1, P2 (kartet), resten. Én commit per retting. Testene: `driftsplan2gui` (U6 og U7 er røde der med vilje til de er rettet), `driftsplan2ui`, `driftsplan2map`, `driftsplan2test` når `core/06g` endres, `dockrow` for U1 og U12, og skjermbilder i 800×1280, 1280×800 og 384×853.

## Usikkert

- U1 A: 88 % er et anslag. På 384×853 må det prøves om HUD-en over skuffen trengs (klokka, energien).
- U7 A gjør siden lengre; sammen med U1 A bør det bli færre sveip totalt, men det er ikke målt.
- U9 A: «veien til butikken» er en rute i kartet eller en tekst; en knapp kan ikke selge noe utenfor butikken (`docs/handelssteder.md`).
- Alt er prøvd bare rundt Senja (testmiljøet har ikke hele kysten).

## Det planen ikke gjør

Ingen endring i motoren utover grunnene (U13), dagens ord (P4) og blåsesettet (U9). Del 8 (ryddingen av den gamle planen) er ikke med.

## Status

- 05.11.2026: planen skrevet. Jonas svarte samme dag: gruppe 1 ja til alle, A på U1, U6, U7, U8, U9, U14 og P7. I tillegg: Pause skal ankre der det går (driver ellers), og en rorbu uten penger lar planen vente og si fra. Bygges i neste økt.
- 05.11.2026: alt bygd på `ccr-5e1ba2f4-pusvyd` (U1–U3, U5–U10, U12–U14, P1–P7 og Pause med anker), én commit per retting. Detaljene står i `docs/systemer/driftsplan.md` («Valgene etter GUI-gjennomgangen bygd»).
