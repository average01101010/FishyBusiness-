# D4: sammenslåingene (én side per ting)

Fra `docs/planer/design-ombygging.md` (les «Hva Gemini fant», «Øktas vurdering», «Jonas' svar», «D4: sammenslåingene» og «D5 etter Jonas' bilder»). Jonas valgte 13.11.2026 punkt for punkt; svarene står ordrett i planen og er grunnlaget her. Prinsippet: **én side per ting, gjerne flere dører inn**; det som forvirrer, er to dører til to ulike sider.

## Ferdig når

1. **Last, redskap og rigg:** «Om bord» har fanene Redskap, Last og Mannskap og drift (rekkefølgen og navnene i planen). Redskap viser redskapen om bord og i sjøen, og riggen velges der; den egne Rigg-siden, den egne Redskap-siden med «Kjøp» og den egne Lasterom-siden finnes ikke lenger som sider eller knapper (`grep` på `DOCK.open('rigg'|'last'|'redskap')` og `data-a="rigg"` gir bare det som er flyttet), og ingen lenke fra Om bord › Redskap går til butikken. «Lasterom» heter «Last» som side- og fanenavn.
2. **Oppdrag, mannskap og drift:** Oppdrag er én side med fanene Turer, Bestillinger og Kappløp, og omdømmet nederst i Bestillinger, åpnet både fra mottaket og fra telefonen. «Om bord › Mannskap og drift» har dem om bord og driftsplanen; Mannskapsbørsen i Bygd er bare for å ansette; Driftsplan-appen åpner den samme siden.
3. **Regnskap, blad B og service:** regnskapet står bare i Kystbanken og Rederi, med konto, gjeld og resultat i år først og resten under «Detaljer»; Havn viser bare prisene der du er. Blad B står i Kvote, og i båthandelen bare når det stopper et kjøp. Utstyrsbutikken har fanene Redskap, Elektronikk og haler, Service, og Service-knappen i vifta er borte.
4. **Dekksdagboka** har bare fanene Dagbok og Salg, og teksten i den er minst 12 px i 800 × 1280.
5. **Ingenting er borte:** hver handling som fantes før (kjøpe, rigge om, levere, ansette, si opp, lage driftsplan, reparere, selge tilbake, se regnskap, se omdømme), kan gjøres fra et sted, sjekket med en liste i en ny test; veiledningen (`tut.py` i begge formater), Håndboka og tipsene peker på de nye stedene; `docktest`, `tabtest`, `uishots`, `telefonflate`, `hbtest`, `worktest` og `driftsplan2gui` er grønne; `kontrast.py` 0 i begge formater; `/kontroll`.

## Vit dette

- **Ikke rør** `ui/10i-shop.js`, `ui/10q-buymoment.js`, Stripe, `shop_*` eller `src/legal/`. Kaiboden og Trim er urørt.
- **Handelsstedene:** man handler bare i utstyrsbutikken, på mottaket og på verftet (`docs/handelssteder.md`). Knappelinja følger stedet som i dag (valg 3 A, 13.11.2026). Ingen nye knapper i HUD-en eller knappelinja uten at Jonas har bedt om dem (D6: «Kart»-knappen ble tatt bort).
- **Kodekartet** (`docs/systemer/kodekart.md`): skuffens sider i `ui/10c-dock.js` (`TITLE`, `TABS`, `WIDE`, `SHOP_PAGES`) og `DRAWER` i `ui/phone/11-rederi.js`; sidene i `ui/phone/` (`rigg` og `beholdning` i `05-rigg-innst-admin.js`, `redskap` og `utstyr` i `12-utstyr-redskap.js`, `service` i `01-haill-fiske-service.js`, `oppdrag` og `ordl` i `02-havn-last-agn-ordre.js` og `09-vaer-post-salg-redning.js`, `havn`, `bank`, `mannskap`, `bors`); dagbokas faner i `ui/06b-book-tabs.js`; veiledningen i `ui/07b-first-trip.js` og Håndboka i `ui/07c-handbook.js`.
- **Lagringene** røres ikke: dette flytter bare hvor sidene står. En gammel lenke (`PHONE.open('rigg')`, `DOCK.open('last')` fra puben, naustet eller tipsene) skal lande på det nye stedet, ikke på en tom side.
- **Patchnotatet:** én linje i dagens nyeste oppføring i `ui/phone/07-patch.js` som sier hvor tingene står nå (aldri hvorfor).
- **Bildene:** `tools/ui/designshots.py` før og etter i begge formater, med 3D i minst ett (`hud`), i `docs/okter/<dato>-D4/`. Ett `ask_gemini`-kall med før og etter (spørsmål som kan svares feil: «Hvor ser du hvor mye fisk som er om bord?», «Hvordan rigger du om til garn?»).
- **Kanskje to økter:** blir steget for stort, er D4 `pågår` med hvor langt det kom, og samme steg fortsetter (punkt 1–2 først, så 3–4).

+ halen (`docs/planer/start/README.md`).
