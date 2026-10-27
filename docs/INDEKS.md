# Indeks over dokumentasjonen

Les denne først, så bare dokumentet for systemet du skal endre, og `docs/BACKLOG.md`. Dokumentene i `docs/systemer/` er overleveringen delt opp per system 26.10.2026 (`docs/utviklingsplan.md`, fase A); overskriftene har de gamle kapittelnumrene, og `docs/systemer/gamle-numre.md` sier hvor hvert nummer havnet. Nytt skrives inn i systemdokumentet samme dag som det avgjøres.

## Start her

| Dokument | Hva det er |
|---|---|
| `CLAUDE.md` | Reglene for arbeidet. Jonas' valg. Følges alltid. |
| `docs/systemer/visjon.md` | Visjonen, sjangeren, arbeidsmåten og statusen slik den sto ved overleveringen. |
| `docs/BACKLOG.md` | Den ene lista: feil, spillbarhet, antakelser, valg som står med vilje, det som må måles, røde tester, ryddejobber. Oppdateres av hver økt. |
| `docs/utviklingsplan.md` | Arbeidsmåten framover: økter, skills, agenter, oppdeling av koden. |
| `docs/systemer/kodekart.md` | Seksjonene og funksjonene i hver kildefil med linjenummer (lages av `python3 tools/docs/kodekart.py`). Slå opp her før en stor fil leses. |
| `docs/systemer/testing.md` | Testene: `run.py`, `COVER`, LITE og 3D, de lange testene og når de er nødvendige, triksene. |

## Systemene

| Dokument | Dekker | Kildefiler |
|---|---|---|
| `arkitektur.md` | Én fil i flere lag, tilstanden `S`, tiden og den felles klokka, konvensjoner og fallgruver i koden. | `src/index.html`, `build.mjs`, `core/00-proj.js`, `core/02-*`, `ui/11-boot.js` |
| `kart-og-terreng.md` | Rammen (UTM 33), presisjonen, kartpakkene og lasteren, kartrørledningen og releasene, kjernen for hele kysten, sjømerkene, vektorkysten. | `core/01-world.js`, `core/01b-mapdata.js`, `tools/map/`, `.github/workflows/kart.yml` |
| `kartplotter.md` | Sjøkartet i 2D: lag, søk, lasting, bunnen i den lille plotteren. | `ui/03-map.js`, `ui/03b-route.js`, `ui/04-panels-instruments.js` |
| `3d-verden.md` | 3D for hele kysten: terreng, bakkens materialer, lys og fyrlykter, kameraet og kino-visningen, nordlyset. | `src/js/view3d/` (delene av `view3d.js`: `01-shaders`, `02-mesh-terrain`, `06-buildings-lights`, `15-env-mooring`, `17-draw`, `18-setup`, `23-camera-frame`, `24-cinema`) |
| `3d-baater-og-animasjon.md` | Båtene i 3D: bevegelse, animasjoner, styrhuset innenfra, måkene og halerne fra Blender. | `src/js/vessel3d.js`, `view3d/` (`09-landing-deck`, `10-gear`, `12-skiff`, `13-instruments`, `16-motion`, `19-wildlife-npc`, `20-trawl-seine`, `21-rescue-anchor`), `tools/boats/`, `tools/wild/` |
| `fysikk-og-styring.md` | Skipsstabilitet, manøvreringsmodellen, manuell styring, fysikk 1–3. | `core/16b-dyn.js`, `core/16c-hull.js`, `ui/10-rod-acts.js` |
| `autonav.md` | Ruteplanleggeren, Autonav, leinettet, hindringene i sjøen, aldri på land. | `core/06-*`, `ui/03b-route.js`, `tools/leia/`, `src/data/leinett.json` |
| `vaer-og-hav.md` | Vær og hav, nærfeltet, tidevann per sted, sol etter posisjon, skyene i ekte tid. | `core/03-simulation.js` (tidevann), `core/03b-*`, `src/data/tide.json`, `src/data/climate.json` |
| `bygg-veier-og-kaier.md` | Hus, veier, bruer, brygger, moloer og kaifronter fra vec-pakkene, og flytebryggene. | `core/01c-vec.js`, `view3d/` (`04-vec-packs`, `05-quays-breakwaters`, `06-buildings-lights`, `22-docks-air`), `tools/map/vectors.py`, `tools/map/flyte.py` |
| `npc-trafikk.md` | NPC-trafikken langs kysten, Senja-flåten, kaiplassene, liggeplassen for spillerens båt (4.16c). | `core/05-vessels.js`, `core/07-harbours.js`, `core/07e-havn.js`, `tools/map/npc.py` |
| `havner-og-mottak.md` | Fiskemottakene, mottakene som havner, start langs kysten, naustet og butikken i 3D, rorbuene, havner B1–B5. | `core/07-harbours.js`, `src/data/mottak.json`, `src/data/rorbuer.json`, `tools/mottak/`, `tools/harbour/` |
| `handel-og-steder.md` | De tre handelsstedene, butikken, verftet og butikken som havneenheter, plassering og ikoner. Regelen står i `docs/handelssteder.md`. | `ui/10i-shop.js`, `ui/10c-dock.js`, `src/data/steder.json`, `tools/steder/` |
| `baater.md` | Flåtemodellen, båttypene og utstyret, verkstedet, Malerverkstedet, verftets oppgraderinger, fartøystigen. Planen for nye båter står i `docs/batplan.md`. | `core/02-*` (`VESSELS`), `core/05-vessels.js`, `ui/10j-paint.js`, `tools/boats/` |
| `redskap.md` | Redskap og utstyr: de andres redskap i havet, utstyrsstatus og service, dekksutstyret, redskapet om bord synlig, redskap i sjøen. | `core/10-gear.js`, `core/10b-gearcare.js`, `ui/09-hand-fishing.js` |
| `fiskerimodellen.md` | Kart, fjordlinje og fangstfelt, fiskerimodellen, Fiskeguiden, juks i dødtiden. Spesifikasjonen står i `docs/spesifikasjon.md`. | `core/03-simulation.js`, `core/03c-*`, `ui/06f-fishguide.js` |
| `priser-og-salg.md` | Priser, kvalitet og salg, bestillingene. | `core/03-simulation.js` (`grade`, `sell`), `core/08-*` |
| `kvoter-og-regler.md` | Kvoter og regulering, reglenes kartdata, regelmotoren, Regler-appen, varsel før feil, regelverket og kildene. | `core/03d-quota.js`, `core/03e-rules.js`, `src/data/rules.json`, `tools/rules/` |
| `folk-om-bord.md` | Mannskapet, kulde og klær, arbeid om bord, mat, hviletid og energien, mannskapets arbeid på sjøen, karakteren og garderoben. Planen står i `docs/mannskap-plan.md`. | `core/04-crew.js`, `core/14-crewlife.js`, `ui/05b-work.js`, `ui/13-work.js`, `tools/harbour/arbeider.py`, `tools/harbour/garderobe.py` |
| `driftsplan.md` | Driftsplanen (`S.ops`), Driftsplan-appen, den gamle planleggeren. | `core/06d-drift.js`, `ui/05c-drift.js` |
| `oppdrag-og-kystposten.md` | Turoppdrag fra der du er, Kystposten. | `core/09g-turer.js`, `ui/06b-book-tabs.js` |
| `samlinger-og-kultur.md` | Merker og milepæler, personlige rekorder og trofeveggen, gjestebøker og Kystfareren, overtro, tatoveringer, det som er tatt ut. | `core/09f-merker.js`, `ui/06-logbook.js`, `tools/harbour/naustinne.py` |
| `haill-pub-og-bonus.md` | Haill og puben, Skippertak og Kaiboden, innloggingsbonusen, puben i 3D. Reglene for ekte penger står i `docs/engasjement.md`. | `core/03-simulation.js` (`HAILL`, `STREAK`), `ui/10i-shop.js`, `tools/harbour/pub.py` |
| `skyen-og-felles-verden.md` | Skyen (Supabase, WorkOS), felles verden V1–V3, fartstid og «Mens du var borte», innlastingen og innloggingen, push, sesongene, venner, delte merker, tuting, slep. | `ui/10f-cloud.js`, `ui/10g-push.js`, `ui/10l-share.js`, `supabase/` |
| `tilbakemelding-og-admin.md` | Tilbakemeldingsagenten og rutinen, admin, Tilbakemelding-appen. | `ui/06e-feedback.js`, `src/admin/`, `tools/feedback/`, `supabase/functions/feedback-agent` |
| `opning-og-veiledning.md` | Åpningsscenen og veiledningen «Første tur». | `ui/07b-first-trip.js`, `ui/08b-letter.js`, `ui/08c-start.js`, `tools/opening/` |
| `ui-og-telefon.md` | Knappelinja, skuffen og «Sett ut», dekksdagboka, telefon, nettbrett og PC. | `ui/phone/` (delene av `05-phone.js`, én per app), `ui/07-guide.js`, `ui/08-actions.js`, `src/styles.css` |
| `lyd.md` | Lyden. | `ui/12-sound.js` |
| `monetisering-og-engasjement.md` | Monetisering og engasjement slik det sto i overleveringen. Reglene som gjelder, står i `CLAUDE.md` og `docs/engasjement.md`. | `ui/10i-shop.js` |
| `rettelser.md` | Rettelsesrundene etter spilltestene og tilbakemeldingene. | |

## Planer og lister

| Dokument | Hva det er |
|---|---|
| `docs/planer/flaateplanen.md` | Flåteplanen fase 1–5 og veikartene (PWA og hele kysten), slik de ble vedtatt. |
| `docs/planer/forslagslista-04.10.2026.md` | Forslagslista fra 04.10.2026. |
| `docs/planer/okonomi/01-gjennomgang.md` | Økonomi 2 (27.10.2026): gjennomgangen av økonomien, skatten (ENK/AS), lotten og kostnadene mot virkeligheten, forslagene (bankkontoer, turoppgjør, regnskap per år) og spørsmålene til Jonas. Venter på svar. |
| `docs/planer/okonomi/02-design.md` | Økonomi 2: designet i fem faser Ø1–Ø5 (hovedbok og regnskap per år, turoppgjør med lott etter felleskostnader, bankkontoer, skatten som i livet, håndboka), valgene V1–V4 og kildene. Venter på «kjør på». |
| `docs/forslag.md` | Forslagslista fra 13.10.2026 (dybde og sjel). |
| `docs/slagplan.md` | Slagplanen fra 05.10.2026 med status. |
| `docs/batplan.md` | Planen for båtene og stigen. |
| `docs/mannskap-plan.md` | Planen for mannskapet. |
| `docs/plan-blakveite.md`, `docs/blakveite.md` | Blåkveita: planen og kunnskapen. |
| `docs/lansering.md` | Det som gjenstår før lansering, og serveren. |
| `docs/onboarding.md` | Onboardingen. |

## Regler og kilder

| Dokument | Hva det er |
|---|---|
| `docs/spesifikasjon.md` | Spesifikasjonen for fiskerisystemet. |
| `docs/engasjement.md` | Engasjement og inntekt: grunnlaget, arbeidslista og det vi ikke gjør. |
| `docs/handelssteder.md` | Handelsstedene og plasseringen av steder. Jonas fyller på. |
| `docs/push-plan.md` | Push-varslene. |
| `tools/feedback/RUTINE.md` | Det tilbakemeldingsrutinen gjør hver kjøring. |
