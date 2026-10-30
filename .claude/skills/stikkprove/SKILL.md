---
name: stikkprove
description: Prøver en retting eller en funksjon på minst tre steder spredt langs kysten (sør, midt og nord) før den meldes som ferdig, slik CLAUDE.md krever for alt som kan gjelde hele landet.
---

# /stikkprove <hva som skal prøves>

Regelen (Jonas 09.10.2026): en feil funnet ett sted, og en retting som kan gjelde hele kysten, prøves på minst tre andre steder spredt langs kysten før den meldes som ferdig. Rapporten sier hvor det er prøvd, og om feilen fantes der også.

## Stedene

Velg minst tre, alltid fra ulike deler, i tillegg til stedet feilen ble funnet:

| Del | Sted | `P(lat, lon)` | Merk |
|---|---|---|---|
| sør | Kristiansand | `P(58.146, 8.00)` | få brygger merket som flytebrygger |
| sør/vest | Bergen | `P(60.393, 5.312)` | tett by, største vec-flis (4:26) |
| midt | Bodø | `P(67.285, 14.38)` | mange flytebrygger |
| midt | Trondheim | `P(63.436, 10.40)` | |
| nord | Tromsø | `P(69.649, 18.96)` | flisen testene bruker (18:6) |
| nord | Hammerfest | `P(70.664, 23.68)` | |
| nord/øst | Båtsfjord | `P(70.633, 29.72)` | |
| Senja | Finnsnes, Husøy | startområdet | de innebygde dataene gjelder her, ikke pakkene |

## Slik

1. Bygget: `node build.mjs` for alt i kjernen og UI. `KYST_VEC=1 KYST_DIST=dist-vec node build.mjs` og `KYST_DIST=dist-vec` foran testskriptet når det gjelder vec-pakkene (bygg, veier, brygger, kaier, NPC-båter, havner).
2. Ett Playwright-skript i scratchpad som starter spillet med `boot(pg)` fra `tests/_env.py`, flytter båten med `P(lat, lon)` og `await mapNeed(p, MAPD.simR)` (se `GO` i `tests/vectest.py`), og måler det samme på hvert sted. Skriv tallene ut, ikke bare OK.
3. Når det gjelder 3D: vent på flisas statics (`READY` i `tests/vectest.py`), ta et skjermbilde per sted og se på det.
4. Fantes feilen på et sted der den ikke var ventet, er det en ny sak: rett den, eller skriv den i `docs/BACKLOG.md`.

## Rapporten

En linje per sted: sted, hva som ble målt, før og etter der det finnes, og om feilen fantes der. Det som ikke ble prøvd, sies fra om.
