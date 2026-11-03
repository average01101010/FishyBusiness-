# Mindre støy i kartet: navn og etiketter (plan, 02.11.2026)

## Hva Jonas ba om

Jonas 02.11.2026, med et bilde av kartet i Hammerfest: «Vi må passe på at ikke blir alt for mye info og navn på kartet som overlapper hverandre slik at det bare blir støy. Hvordan løser vi dette på en intuitiv og taktfull måte?»

Bildet viser:
- «Hammerfest utstyrsbutikk» oppå «Hammerfest vest havn».
- «Rypefjord utstyrsbutikk» oppå «Rypefjord nord havn».
- AIS-navnene til havskipene («Malangsfjord I», «Polarfangst») oppå havnenavnene i Rypefjord.
- «Rypefjord nord havn» to ganger med noen hundre meter imellom.

Tidligere avgjort: kartet skal ikke vise hvem som eier redskapet; et trykk viser det (Jonas 02.11.2026).

## Hva som finnes i dag (`ui/03-map.js`, `renderStatic` og `renderDyn`)

- **Statisk lag:** stedsnavnene av rang 0 først (`chartNamesSvg … 'first'`), så handelsstedene (`PORTS`: mottak, butikk, verft, naust). Handelsstedenes navn sjekkes mot det som alt er tegnet (`taken`, `over`). Rorbuer og havner (`havnsNear`, `havnNm`) legger seg i `taken`, men sjekker ikke selv: de tegnes oppå det som står der. Dybdetallene og resten av stedsnavnene viker for alt.
- **Dynamisk lag (AIS, `renderDyn`):** navnene til båtene har sin egen sjekk (`lblAt`, et rutenett på 70 × 14 px), som ikke vet om de statiske navnene. Kystbåtenes navn vises bare når kartet er zoomet langt inn, men det gjelder også båter som ligger i havn.
- **Havnene** (`07e-havn.js`) får navn fra kartets stedsnavn. To kaier i samme havn kan få samme navn, og en havn ved siden av et mottak eller en butikk på samme sted gjentar stedsnavnet.

## Fasene

| Fase | Hva | Filer | Tester | Måles |
|---|---|---|---|---|
| **E1** | **Én etikettrunde med prioritet.** Alle navn i kartet går gjennom samme liste over opptatte flater, i prioritetsrekkefølge. Et navn som ikke får plass, tegnes ikke, men ikonet står. Havner og rorbuer sjekker også. To havner med samme navn innen 1,5 km blir ett navn. En havn uten eget navn ved siden av et handelssted på samme sted vises bare som ikon. AIS-laget leser de statiske flatene og viker. | `ui/03-map.js`, `core/07e-havn.js` (navnene) | `charttest`, `npctest` (navnene i kartet), `routetest`; ny sjekk: ingen to etiketter overlapper i Hammerfest, Bergen og Tromsø | antall etiketter før og etter på de tre stedene, og tiden `renderStatic` tar |
| **E2** | **Navnet ved trykk.** Et trykk på et ikon som står uten navn (havn, rorbu, handelssted, båt i havn), viser navnet i en liten boble i to sekunder, i samme stil som redskapskortet. | `ui/03-map.js` | `charttest` | – |

Stikkprøven (`/stikkprove`) i stående og liggende format på Hammerfest, Bergen, Bodø og Tromsø avslutter E1.

## Valgene

1. **Navnene på NPC-båtene:**
   - A) Bare på båter som er ute (ikke i havn), og bare langt inne i kartet. En båt i havn viser navnet når du trykker. **Anbefalt:** havna er der støyen er, mens båtene ute er livet på sjøen.
   - B) Bare når båten er trykket på.
   - C) Som i dag.
2. **Når to navn kolliderer, vinner:**
   - A) Spillere, så handelssteder (mottak, butikk, verft), din egen rute og dine merker, så rorbuer, så havner, så NPC-båter, så felt- og stedsnavn, så dybder. **Anbefalt:** det du handler med og spiller med, går foran det som bare er kulisse.
   - B) Handelsstedene først, så alt annet likt.
3. **Havnenavnene:**
   - A) Vises når de får plass og ikke gjentar et handelssted eller en annen havn på samme sted. **Anbefalt:** det gir navn der havna er alene, og ikon der det er trangt.
   - B) Aldri navn på havner, bare ikon og navn ved trykk.

## Antatt eller usikkert

- Bredden på et navn anslås av antall tegn (som i dag), ikke av målt tekst. Det kan gi litt luft eller litt overlapp.
- Prioriteten må prøves på nettbrettet. Det som ser ryddig ut på 1280 × 800, kan bli for tomt på telefonen.
- «Rypefjord nord havn» to ganger kan være to ekte kaier med samme navn i kartdataene. Da slås de sammen i kartet, ikke i dataene.

## Hva planen ikke gjør

- Endrer ikke ikonene eller fargene.
- Legger ikke inn en bryter for kartlag (vis/skjul navn). Den kan komme senere om E1 ikke er nok.
- Rører ikke 3D-plotteren på båten, som ikke viser navn.

## Status

- 02.11.2026: planen lagt fram.
- 02.11.2026: **E1 og E2 bygd** (Jonas: «Gjennomfør E1 og E2», valgene 1A, 2A og 3A). Se 5.47 i `kartplotter.md`.
  - Hammerfest (Rypefjord, Jonas' bilde): butikken står alene, og havna like ved har bare ikon (navnet ved trykk). Ingen overlapp der, i Bergen eller i Tromsø, i begge formater (`etikett.py`).
