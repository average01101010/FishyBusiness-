# Slik lager vi traileren til Det store blå

*Utkast 30. oktober 2026. Bygger på Laksebaronen-metoden (okt. 2026), tilpasset vårt spill. Strategien og begrunnelsene står i `TRAILER-STRATEGI.md`. Dette dokumentet er arbeidsbeskrivelsen.*

## Kort fortalt

- **Alt er ekte spillgrafikk og, så langt det går, ekte spillyd.** Traileren filmes i selve spillet. Unntak: logo og adresse på sluttkortet.
- **Historien er én båt som blir til en annen.** Trebåten fra 1956 (23 fot, 8 hk semidiesel, 45 000 kr) og kystnotbåten på 38,55 m (ringnot og snurrevad). Alt i traileren ligger mellom de to.
- **Kroken er lyd.** Første 1–2 sekunder er semidieselen alene. Musikken kommer inn på første slag.
- **Musikk i Suno, klipp på slag.** Stemme bare hvis den er ekte og nordnorsk. Masteren skal fungere uten lyd.
- **Vi jobber i runder.** Grovklipp i halv størrelse, eieren ser det på mobil og sender notater med tidskode, vi retter, nytt grovklipp. Full størrelse først når bildene er godkjent.
- **Ingenting publiseres før eieren har godkjent det.** Ingenting vises som ikke er spillbart den dagen.

## Hvem gjør hva

| Hvem | Oppgaver |
|---|---|
| Eier | Idé, musikk i Suno, eventuelt opptak av ekte stemme, notater på grovklipp, godkjenning, publisering, avklaringer om spillet |
| Claude | Manus og opptaksliste, analyse og klipping av musikk, filmoppsett i spillet, filming, klipping, lydmiks, kvalitetskontroll |

## De to båtene

| | Trebåten | Kystnotbåten |
|---|---|---|
| I spillet | «Trebåt 23 fot (7,0 m), 8 hk semidiesel», byggeår 1956, 45 000 kr, 7 knop, 1,9 t, åpen gruppe under 8 m, kan fiske innenfor Fjordlinja | «Kystnotbåt 38,55 m, ringnot og snurrevad», 38,55 × 9,5 m, blått skrog, hvit overbygning, kran og notbinge akter |
| Rolle i filmen | Starten. Nostalgien. Kroken. | Målet. Aspirasjonen. Høydepunktet. |
| Lys | Grålysning, kaldt lys, lav kontrast | Midnattssol kl. 04, varmt lys, lang skygge på sjøen |
| Sted | Kaia på Finnsnes, Gisundbrua i bakgrunnen | Under Gisundbrua, Finnsnes bak |
| Kamera | Nært. Treverket, motorkassa, rorkulten. Lav høyde, nær vannflaten. | Åpent. Lang, rolig bevegelse rundt eller langs båten. Masten mot brua. |
| Lyd | Semidiesel på tomgang, sjø mot klinkbygd skrog, måker | Dyp dieselrumling, bølger mot baugen |
| Skal unngås | Pop-in av hus og trær bak, plutselige hopp i lys | Masten gjennom brua, kjølvann som «starter» i bildet, for fort vending |

Referansebilder ligger i `referanse/`.

## Arbeidsgangen steg for steg

### 1. Avklaringer først

Før manus skrives, må disse være svart ut (se også del 10 i strategien):

- Er spillet en Vite/three.js-webklient? Avgjør hvordan filmoppsettet bygges.
- Er spillet gratis? Avgjør teksten på sluttkortet.
- Hvilke animasjoner finnes for å sette og dra bruk, fisk om bord, levering?
- Finnes motorlyden i spillet?
- Hvilke steder og hvilket lys (mørketid, nordlys, vær) finnes i dag?

### 2. Manus og opptaksliste

- **Mål og format.** Hovedtrailer 60–70 s, filmet én gang og beskåret til både 9:16 (1080×1920) og 16:9 (1920×1080), 60 bilder i sekundet. Viktig innhold holdes i et felt som overlever begge beskjæringer.
- **`script.md`** er tekst på skjermen og eventuell stemme, én linje per replikk med tidsvindu og makslengde. Maks 0,9 ord i sekundet.
- **`shotlist.md`** er opptakslisten: tid, sted, lys, hva som skjer, kameraføring, tekst over. Egne regler for overganger og hva som ikke skal være med.
- **Faste regler:**
  - Første 1–2 sekunder er reallyd uten musikk. Musikken kommer inn på første harde klipp.
  - Harde klipp på taktslag. Bare et par myke overtoninger, og alltid der lyset er likt på begge sider.
  - Én lang scene uten tekst og stemme på musikkens høydepunkt: kystnotbåten under Gisundbrua i midnattssol.
  - Trebåten skal ha minst like mye tid som kystnotbåten.
  - Logoen kommer på siste store slag, adressen ett slag senere, så motoren alene i ett sekund.
  - Masteren har ingen knapper eller menyer i bildet. Unntak: fakta-kortet fra båthandelen vises med vilje i ett klipp, som ekte spillbilde.
  - Ingenting som ikke er spillbart ved publisering.

### 3. Musikk (Suno)

- **Låta.** Eieren lager den i Suno. Vi ber om rundt 96 BPM (nær tomgangspulsen til en semidiesel), tydelig oppbygning, tydelig drop og kraftig sluttslag. To stilretninger prøves, 2–3 versjoner hver:
  - nordisk og nedpå, med fele eller trekkspill som motiv;
  - moderne kyst, elektronisk puls med ett akustisk instrument oppå.
- **Analyse og klipping** som i Laksebaronen: tempo, taktslag, takter og nivå per takt med Python og ffmpeg. Skjøter bare slag mot slag, samme sted i takten og samme harmoni, krysstoning 12 ms. Nedtrapping over to slag fra høydepunkt til rolig del.
- **Klippekartet** (`audio/music-edit-*.json`) er fasiten for alle tider i filmen. Endres musikken, oppdateres kartet først.

### 4. Lyd fra spillet og stemme

- **Reallyd.** Motor, sjø, måker og vinsj tas fra spillet hvis det finnes. Hvis ikke, må lyd med kommersiell lisens brukes, og det noteres i `CREDITS.md`.
- **Stemme.** Tre nivåer:
  1. Masteren har ingen stemme, bare tekst på skjermen.
  2. En versjon med ekte nordnorsk stemme, 3–4 korte linjer, lavmælt. Krever skriftlig samtykke.
  3. ElevenLabs på norsk brukes bare til å sjekke timing i grovklipp, aldri i ferdig film.
- **Plassering.** Hver linje faller på et klipp. Nøkkelordet treffer bildeskiftet.
- **Kontroll.** Stemme minst rundt 6 LU over musikken. Alle linjer innenfor vinduene sine.

### 5. Filming i spillet («harness»)

- **Egen kopi av spillkoden** på en egen gren som aldri pushes.
- **Privat byggeflagg**, for eksempel `VITE_TRAILER`. Vi kontrollerer at en vanlig build ikke inneholder noe av filmkoden.
- **Filmklokke.** 60 fps på kunstig klokke, fast utgangspunkt for alt tilfeldig, Playwright styrer Chromium og lagrer hvert bilde.
- **Hvert klipp er en JSON-fil:** sted, dato og klokkeslett, lys, sjø, båtens bane og fart, kamera, hva som skjules, hvilken tekst som ligger over.
- **Kontrollbilder** per klipp: 0, 25, 50, 75 og 100 %, kontaktark, og en kort forhåndsvisning med musikk i halv størrelse.
- **Automatiske kontroller:**
  - ingen hopp mellom to bilder;
  - skrog mot land, kai og andre båter i hvert bilde, også i oppkjøringen som bygger kjølvann;
  - mast mot bru når kystnotbåten går under Gisundbrua;
  - fortøyde båter i riktig høyde ved kai;
  - ingen hopp i detaljnivå på hus, trær og bygder;
  - kontinuerlig sol og lys gjennom klippet.
- **Feil i spillet rettes i egne PR-er.** Filmen får bare midlertidige rettinger bak flagget.

### 6. Grovklipp

- `tools/assemble_rough.py` setter sammen klippene med ffmpeg: eksakt antall bilder per klipp, overtoninger der manuset sier det, toning fra svart i starten, logo på siste slag og adresse ett slag etter.
- **Sluttkort:** spillets logo og «detstorebla.no» (med «Spill gratis på» hvis det stemmer). Skrift velges etter logoen. Liten kreditering av Kartverket, Mapzen og OpenStreetMap nederst.

### 7. Lydmiks

- Musikken senkes rundt 8 dB under stemme og under reallyd som skal høres (motoren i starten og slutten).
- Hele miksen til −14 LUFS integrert og høyst −1,5 dBTP, kontrollert med ffmpeg (ebur128).

### 8. Tilbakemeldingsrunder

Som i Laksebaronen: eieren ser grovklippet på mobil, skriver notater med tidskode, vi finner klippet, finner årsaken, retter, filmer bare det som er endret og setter sammen på nytt.

### 9. Ferdig levering

- Alt filmes på nytt i full størrelse.
- Vi leverer:
  - master 9:16 og master 16:9, H.264 høy kvalitet, BT.709, AAC 320 kbit/s;
  - ProRes-master av begge;
  - versjon uten musikk;
  - versjon med ekte stemme, hvis den er laget;
  - tekstede versjoner per plattform;
  - fem korte klipp på 15–20 s, med hver sin krok: lyden, stedet, den store båten, fakta-kortet, de to båtene side om side;
  - plakatbilde og kontaktark;
  - `CREDITS.md` og ferdige tekster til publisering.
- Før levering sjekkes lydnivå, lengde, overganger og hopp i bildet.

### 10. Etter publisering

De fem korte klippene publiseres først, med noen dagers mellomrom. Den kroken som holder seerne lengst de første tre sekundene, flyttes først i neste versjon av hovedtraileren.

## Mappestruktur

```
trailer/
  TRAILER-STRATEGI.md       hvorfor: målgruppe, psykologi, struktur
  SLIK-LAGER-VI-TRAILEREN.md hvordan: dette dokumentet
  referanse/                skjermbilder av de to båtene
  script.md                 tekst på skjermen og stemme, med tidsvinduer
  shotlist.md               opptaksliste med alle klipp og tider
  production.md             plan, leveranser og krav til lyd
  HARNESS.md                teknisk logg for filmoppsettet i spillet
  audio/                    musikk, klippekart, reallyd, stemme og miks
  control-m1/ … control-mN/ kontrollbilder og forhåndsvisninger per runde
  rough/                    grovklippene
  fonts/                    skrift og sluttkort
  tools/                    skriptene (musikk, stemme, miks, sammensetting)
```

## Lærdommer vi arver fra Laksebaronen

- Ting som dukker opp midt i bildet ser billig ut. Båter og fugler kommer inn fra kanten eller er med fra første bilde.
- Lys skal endres gradvis, uten hopp.
- Sjekk hvilken vei 3D-modellene vender før filming.
- Noe som henger i lufta betyr at oppsettet ikke er som i spillet.
- Musikkskifte og lysskifte på samme sted blir for brått. Trapp ned musikken og ton over bildet.
- Halv størrelse er nok for alle valg om utsnitt og tempo.
- Én tung jobb om gangen på maskinen.
- Endringer i spillet går alltid via PR, aldri bare via filmen.

## Rettigheter

- Kartdata: Kartverket, Mapzen (CC BY), OpenStreetMap (ODbL). Krediteres i `CREDITS.md`, i videobeskrivelsen og på sluttkortet.
- Musikk og stemme: betalt Suno- og ElevenLabs-plan hvis de brukes. Ekte stemme krever skriftlig samtykke til markedsføring.
- Grafikk og lyd: bare spillets egne, eller lyd med dokumentert kommersiell lisens.
