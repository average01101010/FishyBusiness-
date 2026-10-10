# Handelssteder og hvem som selger hva (regel, Jonas 07.10.2026)

Dette er en spillregel som gjelder alt nytt og alle endringer. Den er lagt inn etter tilbakemelding #39, der en tester merket at man kunne
kjøpe fiskeutstyr i fars naust uten å gå noe sted. Legg til nye ideer nederst, under «Å fylle på».

## Reglene

Spillet har **tre handelssteder**. Alt som kjøpes eller leveres, hører til ett av dem. Båten må ligge ved stedets kai for å handle der.

| Sted | Hva som gjøres der |
|---|---|
| **Utstyrsbutikken** | Fiskeutstyr: garn, liner, teiner, juksamaskin, garnhaler, linehaler. Alt av navigasjonsutstyr, ekkolodd, radio, 12 V-batteri og alt elektrisk. Redningsutstyr, varmekjeldress og oljehyre. Bøting av garn, trål og not. |
| **Fiskemottaket** | Bare levering av fisk, salg av is og agn. |
| **Verftet** | Kjøp av brukte og nye båter, motoroppgraderinger, reparasjoner, vedlikehold av båten, klassing for de fartøyene det gjelder, spyling og bunnsmøring, kosmetiske oppgraderinger (maling). Redningsskøyta sleper alltid til nærmeste verft (Jonas 08.10.2026), siden skroget skal repareres etterpå. |

To steder uten handel:

- **Fars naust** er hjemmet spilleren kommer tilbake til med jevne mellomrom. Der hviler man, ser til mannskapet og beholdningen, og kan restaurere naustet til god standard (notatboka). Det selges ingenting der. Det går ikke an å kjøpe fiskeutstyr, is eller noe annet fra naustet.
- **Rorbuene** selger heller ingenting. De er bare en plass å hvile eller søke ly for været.

## Plassering av stedene (regel, Jonas 08.10.2026)

Gjelder alle fiskemottak, verft, utstyrsbutikker, rorbuer og fars naust, og alle senere endringer og nye bygg. Jonas' ord: «Sjekk plassering av alle fiskemottak, verft, utstyrsbutikker og rorbuer. Disse skal ikke ligge for nært hverandre. Det skal i praksis være umulig å få opp knappen der man må velge mellom å fortøye i et fiskebruk eller en rorbue. Men de må være plassert på strategiske plasser langs kysten der de i stor grad har ly for vær og vind.»

- **Avstand:** ingen to steder (mottak, verft, butikk, rorbu, naust) nærmere hverandre enn **1,5 km**, så valgknappen for fortøyning (to steder innen 120 m) i praksis aldri kommer opp. Det gjør ingenting at det tar litt tid å flytte båten.
- **Ly:** stedene legges der de har ly for vær og vind (lav eksponering, innenfor holmer og i viker), og der det faktisk går an å seile dit (vann nok, ingen bro eller land i veien).
- **Fiskemottakene** står på sine ekte plasser (Fiskeridirektoratets register og Råfisklaget). De flyttes ikke.
- **Verftene** står på sine ekte plasser, men kan flyttes litt (noen hundre meter) når det gir en bedre plass. Når to eller flere ligger veldig nær hverandre, fjernes noen, så kartet ikke blir rotete. Der det er langt mellom dem, settes det inn oppdiktede verft på strategiske steder: **nærmeste verft er aldri mer enn 20 nautiske mil unna** langs kysten.
- **Utstyrsbutikkene** plasseres fritt på strategiske steder, helst der det er folk (bygder og byer). **Én butikk per by** holder.
- **Rorbuene** legges i ly, ikke så langt fra et fiskemottak, men ikke så nær at fortøyningen blir trøbbel (1,5–4 km fra mottaket). Spredningen langs kysten skal være som i dag.
- **Bygningene:** der en Blender-modell settes ut, fjernes kartets egne bygg under den, så ingenting overlapper. Byggene plasseres realistisk (kai mot sjøen, bygg på land).
- **Navn:** alle mottak heter etter stedet pluss «fiskemottak», «mottak», «fiskebruk» eller en annen vanlig variant, aldri etter et firma (se CLAUDE.md).
- **Kartikoner:** hver slags sted har sitt eget ikon i kartplotteren (mottak, verft, butikk, rorbu, naust).
- **Fars naust** står i Vangshamn på Senja (Jonas 08.10.2026), nær Botnhamn, der den første fangsten leveres. Startskjermen viser stedene uten kart, sortert etter hva det er å tjene akkurat nå, med søk.

## Knappene ved hvert sted (Jonas 07.10.2026, andre melding)

- **Fiskemottaket** har ikke lenger knappene Marked og Verft. Det tar bare imot fisk og selger is og agn, så knappene er Lever, Is og Agn (og Mannskap og Beholdning som ellers).
- **Utstyrsbutikken** er den som står på kaia i Finnsnes i dag (modellen finnes: `tools/harbour/butikk.py`). Den skal settes ut på strategiske steder langs hele landet.
- **Verftet** er et eget sted med egen modell (finnes ikke ennå), også satt ut på strategiske steder langs kysten.
- **Alt som i dag ligger under Marked og Verft fordeles på de tre stedene**, etter listene over. Kartet over dagens menyer: Marked (Lever, Is, Agn) går til mottaket. Verft (Båthandel, Vedlikehold, Malerverksted og antigro/bunnsmøring og motor under Oppgrader) går til verftet. Fiskeutstyr, haler, juksamaskin, elektronikk og redning under Oppgrader, og klær, går til utstyrsbutikken.
- **Alle tre handelsstedene har fortsatt knappen Bygd** (pub, bank, oppdrag, ansatte). Naustet og rorbuene har ingen handelsknapper.
- Hensikten er at spilleren alltid skal vite hvor hun finner det hun trenger å kjøpe: ett sted per slags vare.

## Slik er det i dag (07.10.2026), og hva som mangler

- Dagens spill har butikken (`shopBuy`, siden «Fiskeutstyr»), isen, agnet og verftet som menyer på kaia i **hver** havn, og alt kan nås også fra naustet. Det er det som skal rives opp.
- **Verftet** har ingen Blender-modell. Den må lages og settes ut langs hele kysten på strategiske steder (ikke i hver havn).
- **Utstyrsbutikken** har en modell (`tools/harbour/butikk.py`), men står bare på kaia i Finnsnes og ved naustet i en start langs kysten. Plassering langs hele kysten må avgjøres.
- **Fiskemottaket** finnes alt langs hele kysten (`src/data/mottak.json`), med kai, kran og isrenne.

## Første tur (veiledningen), vedtatt 07.10.2026

Åpne brevet → se båten for første gang (**juksa ligger montert i båten fra start**) → åpne kartplotteren → lære Autonav og egne ruter → til fiskeplassen spilleren «har hørt om» (fars notatbok) → fiske båten full raskt med juksa, **uten is** → til nærmeste fiskemottak → levere første fangst → **kjøpe is for nedkjøling** (første fylling er spandert av mottaket: spilleren er ny kunde, og de kjenner igjen den gamle båten; prisen på isen nevnes ikke) → første tur på egen hånd. Ising introduseres altså etter første levering.

## Status (07.10.2026)

- **Gjort:** naustet selger ingenting (knappene Marked, Bygd og Verft vises ikke der; `shopBuy` avviser; telefonsidene for kjøp er av ved naustet via `atTrade`). Håndjuksa er montert fra start, første fiske går uten is, og veiledningen får steget `ice` etter første levering (første fylling på huset). Alle mottak selger is. Omrigging (juksa, line, garn, teiner) skjer om bord under Beholdning → Rigg, så lenge ingen redskap står i sjøen.
- **Vedtatt (andre melding):** bunkring (diesel) på fiskemottak og verft. Verft kan stå på ekte steder der vi finner data, og på falske steder på strategiske plasser slik at nærmeste verft aldri er langt unna. Verftet bygges i Blender med dieselfylling og en dokk eller slipp som kan tørrlegge alle båtene, med animasjoner.
- **Trinn 2 gjort (07.10.2026):** utstyrsbutikk og verft er egne havner med egen kai langs hele kysten (103 butikker og 157 verft, ekte punkter fra Overture der de finnes og oppdiktede der avstanden ble for lang), med egne knapper, kjøp bare på riktig sted og «nærmeste sted» med Autonav (se 5.32 i overleveringen). Bunkring er på mottak og verft. Utseendet er mottakets inntil modellene er laget.
- **Gjenstår (trinn 3):** verftsmodellen i Blender med dieselfylling, skipsløft som tørrlegger alle båter, og animasjoner; butikkmodell med kai; folk og skilt.

## Å fylle på

- Foreslått, ikke vedtatt: diesel (bunkring) hører til mottaket (bunkerkaia står alt ved mottakene), og omrigging hører til utstyrsbutikken. Telefonen kan ikke brukes til å kjøpe fysiske ting borte fra stedet. En hjelp for å finne nærmeste butikk, verft og mottak (kartlag med avstand og Autonav dit).
- Åpne spørsmål: hvor hører **bunkring** (diesel), **riggen** (omrigging mellom juksa, line, garn og teiner), **kveiteutstyret**, **klær** og **pub, bank, oppdrag og ansatte** hjemme under denne inndelingen? Foreløpig står de som i dag.
- Hvordan finner vi gode steder for verft og utstyrsbutikker langs kysten (virkelige verft og båtutstyrsbutikker fra kartdata, som mottakene)?

## Utstyrsbutikkens service (08.10.2026)

Butikken har en Service-knapp (`Butikk › Service`): den reparerer line og teiner, bøter garn og bytter kroker på halve tiden av det mannskapet bruker, mot et gebyr, og den kjøper utstyr tilbake til en firedel av nypris ganger standen (aldri lønnsomt å kjøpe og selge). Kroker i pakker på 100, 500 og 1000 og reservesett til juksa (markkroker med pilk, kveitepilk) selges her. Se 5.36 i `OVERLEVERING.md`.

## Kjøpsrekkefølgen (Jonas 08.10.2026)

Alle kjøpssystemer følger det spilleren eier. Regelen ligger i `buyGate(what)` i `src/js/core/10-gear.js`, og både `buyGear` og knappene i butikken og på mottaket spør den:

| Kjøp | Krever |
|---|---|
| line | linehaler |
| garn | garnhaler (passer båter fra 7,5 m) |
| teiner | teinehaler |
| kroker | at du eier line |
| blåsesett, dregger | at du eier line, garn eller teiner |
| agn | at du eier line eller teiner |
| juksautstyr (pilk, markkroker) | ingenting (juksa følger med fra start) |

Halerne heter bare linehaler, garnhaler og teinehaler (ingen «elektrisk», «hydraulisk» eller 12 V). Linehaler og teinehaler passer på alle båter. Eldre lagringer med den gamle elektriske haleren får linehaler og teinehaler. Et nytt kjøpssystem legger regelen sin i `buyGate` (eller `equipFits` for utstyr som må passe båten) i stedet for å sjekke selv.

## Verftets oppgraderinger (Jonas 09.10.2026)

Verftet bygger om selve båten: lasterom, motor, lugarer, messe og bysse, tørkerom og bad, isolert lasterom, drivstofftank og stabilisering. Aldri fiskeutstyr, liner, garn, teiner, juksa eller haler (de kjøpes i utstyrsbutikken, og haleren følger `buyGate`). Navigasjonsutstyr er elektronikk i utstyrsbutikken. Prisen følger båtens verdi, og hver oppgradering finnes bare der båten har det den bygges på (køyer for lugar, messe og tørkerom). Tallene står i 5.37 i overleveringen.

### Steder i havet (Jonas 10.10.2026)

«Fiskemottaket i Vannvåg ligger midt i havet og det ser utrolig dumt ut. Gjelder dette flere fiskemottak, naust, rorbuer, verftet eller utstyrsbutikker?» Mottak, verft og butikker er havneenheter (blokk 54,8 m langs fronten og 24,4 m bak, verft 120 × 34 m, og 4 m fylling) som står på en kaifront fra kartpakkene, og ingenting annet holder dem til land. Står fronten på en pirlinje som går ut fra land (Vannvåg: 150 m fra land), står hele enheten på pæler i sjøen.

- **Målt i spillet** (spillets egen kystlinje, `coast2`, så 25 m-masken): av 349 mottak, verft og butikker lå 31 med blokka mer enn 6 m fra land (19 mottak, 6 verft og 6 butikker, tre av butikkene 80–120 m ute: Hernar, Bosberg og Reine). **Naust og rorbuer er ikke rammet:** de legges ved kjøretid på en rett strand med land 6, 14 og 25 m bak og vann foran (`shoreSpot`, `07c-naust.js` og `07d-rorbu.js`, med spillets egen `isLand`), og finnes ingen slik strand, finnes ikke stedet (aldri en enhet i sjøen).
- **Rettet:** `tools/steder/landflytt.py` (etter `bruflytt.py`, idempotent, `--dry` og `--report`) måler avstanden fra enhetens bakke til land med `land_gap()` (`fotavtrykk.land_fine()` leser kystlinja som spillet gjør, samme nonzero-regel) og flytter stedet til nærmeste kaifront som er god etter `steder.py`, har land innen 6 m, ikke har bro eller fast hinder i liggeplassen, og holder avstandene. Siste nivåer tillater pirlinjer og kyststrekk (type 1 og 3), som mottakene ofte står på fra før. 31 steder flyttet (de fleste under 250 m, lengste 747 m: Berlevåg), 0 uløst. Målt på nytt i spillet: 334 av 349 overlapper land og 14 ligger innen 6 m. Det siste (Kongsfjord-mottaket) kom med i en ny kjøring, etter at søsteroppføringen på samme kai sluttet å telle som nabo.
- Kjøres alltid etter `mottak.py`, `steder.py` og `bruflytt.py`: `python3 tools/steder/landflytt.py` (kartpakkene i `tools/map/out/game`).

### Broer under steder (Jonas 08.10.2026)

`tools/steder/bruflytt.py` flyttet fem steder fra broer til nærmeste kai uten bro. Ti steder (mottakene Bergsfjord, Nordnesøya, Sleneset og Gutvik, verftene Trondheim, Lurøy, Ramfjordbotn og Olderdalen, butikkene Vannvåg og Uløybukt) har ingen kai uten bro innen 1,5 km. For dem og alle andre tegnes og regnes ikke en kort bro (under 80 m) som ligger under en havneenhet eller et sted: `bridgeUnderUnit` i `core/01-world.js`, brukt av `11b-obstacles.js` og `view3d.js`.
