# Handelssteder og hvem som selger hva (regel, Jonas 07.10.2026)

Dette er en spillregel som gjelder alt nytt og alle endringer. Den er lagt inn etter tilbakemelding #39, der en tester merket at man kunne
kjøpe fiskeutstyr i fars naust uten å gå noe sted. Legg til nye ideer nederst, under «Å fylle på».

## Reglene

Spillet har **tre handelssteder**. Alt som kjøpes eller leveres, hører til ett av dem. Båten må ligge ved stedets kai for å handle der.

| Sted | Hva som gjøres der |
|---|---|
| **Utstyrsbutikken** | Fiskeutstyr: garn, liner, teiner, juksamaskin, garnhaler, linehaler. Alt av navigasjonsutstyr, ekkolodd, radio, 12 V-batteri og alt elektrisk. Redningsutstyr, varmekjeldress og oljehyre. Bøting av garn, trål og not. |
| **Fiskemottaket** | Bare levering av fisk, salg av is og agn. |
| **Verftet** | Kjøp av brukte og nye båter, motoroppgraderinger, reparasjoner, vedlikehold av båten, klassing for de fartøyene det gjelder, spyling og bunnsmøring, kosmetiske oppgraderinger (maling). |

To steder uten handel:

- **Fars naust** er hjemmet spilleren kommer tilbake til med jevne mellomrom. Der hviler man, ser til mannskapet og beholdningen, og kan restaurere naustet til god standard (notatboka). Det selges ingenting der. Det går ikke an å kjøpe fiskeutstyr, is eller noe annet fra naustet.
- **Rorbuene** selger heller ingenting. De er bare en plass å hvile eller søke ly for været.

## Slik er det i dag (07.10.2026), og hva som mangler

- Dagens spill har butikken (`shopBuy`, siden «Fiskeutstyr»), isen, agnet og verftet som menyer på kaia i **hver** havn, og alt kan nås også fra naustet. Det er det som skal rives opp.
- **Verftet** har ingen Blender-modell. Den må lages og settes ut langs hele kysten på strategiske steder (ikke i hver havn).
- **Utstyrsbutikken** har en modell (`tools/harbour/butikk.py`), men står bare på kaia i Finnsnes og ved naustet i en start langs kysten. Plassering langs hele kysten må avgjøres.
- **Fiskemottaket** finnes alt langs hele kysten (`src/data/mottak.json`), med kai, kran og isrenne.

## Første tur (veiledningen), vedtatt 07.10.2026

Åpne brevet → se båten for første gang (**juksa ligger montert i båten fra start**) → åpne kartplotteren → lære Autonav og egne ruter → til fiskeplassen spilleren «har hørt om» (fars notatbok) → fiske båten full raskt med juksa, **uten is** → til nærmeste fiskemottak → levere første fangst → **kjøpe is for nedkjøling** (første fylling er spandert av mottaket: spilleren er ny kunde, og de kjenner igjen den gamle båten; prisen på isen nevnes ikke) → første tur på egen hånd. Ising introduseres altså etter første levering.

## Å fylle på

- Åpne spørsmål: hvor hører **bunkring** (diesel), **riggen** (omrigging mellom juksa, line, garn og teiner), **kveiteutstyret**, **klær** og **pub, bank, oppdrag og ansatte** hjemme under denne inndelingen? Foreløpig står de som i dag.
- Hvordan finner vi gode steder for verft og utstyrsbutikker langs kysten (virkelige verft og båtutstyrsbutikker fra kartdata, som mottakene)?
