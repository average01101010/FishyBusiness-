# Fiskekar på dekk for båtene uten lasterom (plan 04.11.2026)

Status: **bygd 04.11.2026** (K-A–K-E, se «Status» nederst). Jonas' valg står under «Valgene».

## Hva Jonas ba om (04.11.2026)

> «Kan du sørge for at båter som ikke har lasterom oppbevarer fisken i de hvite 500 kilos fiskekarrene vi har laget modeller av?
> Om båten ikke har lasterom, men har 1500 kg kapasitet betyr det at det må være 3 karr ombord i båten.
> Sørg også for at fisken gradvis fyller karret opp og at det ser realistisk ut, uten clipping eller andre grafiske blemmer.
> Det er disse karrene som skal løftes ut ved levering til fiskemottaket, så det må være animasjoner for akkurat dette.
> Sjekk gjennom hvordan dette fungerer for alle båtene og kom opp med en plan for hvordan det kan løses på en intuitiv og taktfull måte.»

Regelen: antall kar = kapasiteten / 500 kg. Karene står på dekk, fylles synlig fisk for fisk, og er de samme karene som kranen løfter i land.

## Slik er det i dag, båt for båt

| Båt (`VESSELS`) | Modell | `hold.kind` | Kapasitet (kg) | Med verftets påbygg (×1,2/1,4/1,7) | Fangsten vises i | Leveres i |
|---|---|---|---|---|---|---|
| `skiff` | `skiff59.py` (håndbåt, `G.hand`) | `dekk` | 350 | 420 / 490 / 595 | ett 300 l-kar (`kit.tubs`), `13-instruments.js` | kasser 40 kg, paller à 9 |
| `trebat` (startbåten) | `snekke23.py` (håndbåt) | `dekk` | 350 | 420 / 490 / 595 | modellens egen «kasse» ved `skiff.tub`, ingen `kit.tubs` | kasser 40 kg |
| `snekke` | `snekke26.py` | `dekk` | 900 | 1 080 / 1 260 / 1 530 | ett 300 l-kar (`kit.tubs`), `09-landing-deck.js` `drawDeck` | kasser 40 kg |
| `plastsjark` … `kyst21` | | `rom` | 3 500–55 000 | | kasser i rommet (`deckcrew.js` `crates`, 40 kg) | blå klosser «kar 300 kg» (`PM.tub`, `08-plants.js`) |
| `snokrabbe`, `autoliner`, `bunntral` | | `frys` | 400–800 t | | | samme klosser |
| `pelagisk`, `ringnot38` | | `rsw` | 400–2 000 t | | | samme klosser |

Det som finnes og kan brukes:

- **Karmodellene** (`tools/deck/fisk.py` → `src/data/deck-fish.b64`): `kar460` (lys gråhvit, 1,20 × 1,00 × 0,74 m, innvendig 1,06 × 0,86 m og 0,60 m dypt, veggene 2,5° ut), `kar460o`/`kar460b` (oransje/blå), `kar300`, `kar1000`, knust is (`is`) og blodvann (`vann`). Karene har gaffellommer fra fire sider, så trucken kan ta dem. Extras `tubs` gir innermålene ved kanten (`in_top`) og ved bunnen (`in_floor`).
- **Fylling på dekk** (`drawDeck`, `09-landing-deck.js:482`): båter med `hold.kind === 'dekk'` og `kit.tubs` fyller karene etter tur, i lag på seks fisk med et islag over. Håndbåtene (skiff, trebåt) går utenom og tegner fangsten i `13-instruments.js:204`.
- **Pakkeren** (`20-trawl-seine.js:133`, `crateOf`) går til det nærmeste karet på de åpne båtene og legger fisken der.
- **Leveringen** (`07-harbours.js` `LANDING`, `landPlan`, `landState`; `09-landing-deck.js` `landScene`): tidslinje i spillminutter (klargjøring 1, 2,5 per løft, 5 til sluttseddelen), kranen, trucken og fire folk på kaia. Lasten står på faste plasser midt på dekk (`deckSlots`), ikke der karene faktisk står.

## Det som er galt eller mangler

1. **Antall kar følger modellen, ikke kapasiteten.** Snekka har ett 300 l-kar for 900 kg. Trebåten har ingen kar. Påbygget på verftet gir flere kilo, men ingen flere kar.
2. **Fyllingen hopper.** `Math.ceil(f * 6)` lag med seks fisk: ett lag er en sjettedel av karet, i snekka 150 kg på én gang. Fisken som pakkeren legger i, synes ikke før laget er fullt.
3. **Clipping.** Isen skaleres likt i alle høyder (`M4.S(0.86, 1, 1.05)`, målet ved kanten), men karet er smalere nede (2,5° og avrundet bunn), så isen går gjennom veggene i de nederste lagene. Fiskene ligger på faste plasser (±0,25 på tvers, ±0,24 på langs) med lengde 0,46–0,54 m uansett art og vekt. Endene kommer ut mot veggen ved bunnen, og en stor lange eller kveite blir like lang som en hyse.
4. **Leveringen løfter ikke karene.** De åpne båtene lander i paller med 40 kg-kasser (`land:'box'`), og `drawDeck` slutter å tegne når `b.land` er satt (`09-landing-deck.js:463`), så karene forsvinner fra dekk i det øyeblikket lossingen starter. Det er ingen stropp eller krok på karet. Kranen hekter på et punkt midt på dekk.
5. **Lasterom-båtene** løfter blå klosser (`PM.tub`) i stedet for karmodellen.
6. **Funnet underveis (ikke en del av planen):** frys- og RSW-fartøyene lander også i kar på 300 kg, ett per løft. Et fullt snøkrabbefartøy (500 t) gir 1 667 løft, rundt 69 timer spilltid. Det hører hjemme i havsteget og føres i backloggen.

## Løsningen kort

Karene blir *selve lasterommet* på de åpne båtene. Kapasiteten er antall kar × 500 kg, og påbygget på verftet gir ett kar til, ikke en prosent. Det spilleren ser på dekk, er det kjernen regner med, og det samme som kranen løfter: hvert kar har sine egne kilo og arter, fra første fisk til det står på kaia.

## Fasene

### K-A. Kjernen: karene som lasterom (én økt)

- Ny ren fil `src/js/core/07f-kar.js` (i malen etter `07e-havn.js`, i `COVER`):
  - `tubCount(type, holdLv)`: antall kar for en `dekk`-båt (etter K2), begrenset av plassene i modellen.
  - `tubLoads(hold, n, capKg)`: fordeler det sløyde og isede i `S.hold` på karene i fyllrekkefølge. Gir per kar kilo, arter og fyllgrad. Fisken som venter på kniven, ligger i bløggekaret som før.
- `applyVessel`/`holdX`: for `dekk`-båtene blir `holdCap = tubCount × TUB_KG` (`TUB_KG = 500`, eller etter K1). `HOLDUP` gir +1 kar på disse båtene, og verftet viser «ett kar til (500 kg)».
- `landPlan`: `dekk`-båtene lander i kar (`kind:'kar'`), ett løft per kar med fisk og ett løft til med de tomme karene tilbake (K3). `LANDING` brukes som før, så klokka og `catchUp` er uendret.
- Lagringene: `holdLv` beholdes. Kapasiteten regnes om ved lasting, og fisk over den nye kapasiteten blir liggende (den forsvinner aldri).
- Tester: `tests/unit/kar.test.mjs` med 350, 900, 1 500 og 1 530 kg, tomt, halvfullt og overfullt, blandede arter, påbygg og gamle lagringer. `vesseltest.py` (ingen navnevalg).

### K-B. Modellene: plass til karene (én økt, Blender)

- `skiff59.py`, `snekke23.py` og `snekke26.py` får `kit.tubs` med én plass per mulig kar (`[x, y, z, ry, 460]`). Første plass er alltid i bruk, de neste kommer med påbygget. Plassene ligger på dorken/durken mellom toftene og i cockpiten, og skal være fri for haleren, bordet, bløggekaret, rorkulten, motorkassa og gangveien (`deckMap` i `deckcrew.js` tar dem ut av gangkartet).
- Snekka: to plasser aft i cockpiten og en tredje i forkant mot skottet.
- Trebåten og skiffen: én plass, og en til etter K2.
- Om nødvendig (K1): et nytt hvitt kar på rundt 660 l i `fisk.py` (`kar660`), med samme form og samme extras.
- QA: `tools/boats/qa/clip_*.py` utvides med en sjekk av hver karplass mot skrog, tofter og utstyr. Skjermbilder i begge formater.

### K-C. Fyllingen: fisk for fisk, uten clipping (én økt)

- Ren pakker i `07f-kar.js`: `tubPack(tubDims, loads, seed)` gir en fast liste med plasser i karets ramme. Hver plass har posisjon, retning og skala. Rekkefølgen er et islag i bunnen, så fisk på langs med hodene annenhver vei, buken ned, i rader, et tynt islag over hvert lag, og knust is over det øverste.
  - Lengden per fisk kommer av arten og vekten (lengde–vekt, samme som `fsc`). Den som er for lang til karet på langs, legges på skrå, og bare om den fortsatt ikke passer, krympes den litt (høyst 10 %, ellers går den i neste kar).
  - Hver plass sjekkes mot karets indre profil i sin høyde: bredden fra `in_floor` til `in_top` med 2,5° og bunnrundingen, og 15 mm klaring. Isen skaleres til innermålet i sin egen høyde.
  - Antall fisk følger kiloene (én fisk per fisk, gjennomsnittsvekt per art), så karet fylles jevnt og øker én fisk om gangen.
- `drawDeck` og `13-instruments.js` bruker samme pakker for alle tre båtene, så håndbåtene og snekka viser det samme.
- Pakkerens animasjon (`pack`, `20-trawl-seine.js`) legger fisken på *neste plass* i karet som fylles. Fisken som går i, er den som så blir liggende.
- Fullt kar: isen dekker toppen, fisken stikker ikke over kanten. Er alle karene fulle, sier dekkslinja «Karene er fulle» som i dag med lasterommet.
- Tester: `kar.test.mjs` sjekker at ingen plass går utenfor den indre profilen for alle arter og vekter fra 0,5 til 60 kg, og at antall plasser bare øker når kiloene øker. 3D: `workshot.py` (finnes) og en ny `karshot.py` med skjermbilder av tomt, 10 %, 50 %, 90 % og fullt kar, i begge formater.

### K-D. Leveringen: karene løftes i land (én økt)

- En ny del i `tools/deck/kran.py`: **firepartsstropp** med ring øverst og fire kroker som tar under kanten i hjørnene (`kar_slynge`), extras for krokpunktene.
- `landScene`: plassene er karenes egne (`kit.tubs`), ikke `deckSlots`. Hvert løft går slik:
  1. Kroken med stroppen senkes over karet.
  2. En fra båten hekter på de fire krokene: skipperen når han er alene, ellers mannskapet (`unhook`-hendene finnes).
  3. Karet løftes rolig fri av dekk og pendler litt, dempet.
  4. Kranen svinger inn og setter karet på losseplassen.
  5. Kaiarbeideren hekter av.
  6. Trucken tar karet i gaffellommene og kjører det inn.
- Karet har med seg innholdet sitt (samme `tubPack`) hele veien. Karene som venter, står fylt på dekk. `drawDeck` slutter ikke lenger å tegne under lossing.
- Til slutt kommer de tomme, spylte karene tilbake i ett løft, stablet, og settes på plassene sine (K3).
- Båten løftes litt i sjøen når vekten går (`boatTons`/fysikken finnes). Det er lite på snekka, men synlig på trebåten.
- Tidslinja følger `LANDING` (2,5 spillminutter per løft), så det spilleren ser, er det klokka sier, også når spillet åpnes midt i en lossing.
- Tester: `docktest.py`/`landtest.py` (finnes; sjekk at de dekker `landScene`), ny `karland.py` med 3D-bilder av hvert steg, i begge formater, med trebåten, snekka (to og tre kar) og skiffen.

### K-E. Lasterom-båtene (valgfri, K4)

Sjarkene og kystbåtene løfter `kar460` med stroppen i stedet for de blå klossene, opp gjennom luka, med samme pakker for innholdet. Frys/RSW holdes utenfor (havsteget).

## Valgene

- **K1. Hvilket kar er «500 kg-karet»?**
  - **A (anbefalt):** `kar460`, det hvite vi har, regnet som 500 kg i spillet. Modellen finnes, og det ser riktig ut. Fullt kar fyller det til kanten med is over.
  - **B:** et nytt hvitt kar på rundt 660 l, som er nærmere 500 kg fisk med is i virkeligheten.
  - **C:** `kar1000` (hvitt, 1,0 m høyt) halvfullt.
  - Usikkert: tommelfingerregelen er rundt 0,65–0,75 kg fisk per liter med is, altså rundt 300–350 kg i et 460 l-kar. Spillet bruker selv 300 kg per kar for sjarkene i dag (`LANDING.tubKg`). Det er ikke sjekket mot en kilde. A er derfor litt raust, men enkelt.
- **K2. Hvordan regnes antallet?**
  - **A (anbefalt):** kapasiteten *er* karene: skiff og trebåt 1 kar (500 kg), snekka 2 kar (1 000 kg), og påbygget på verftet gir +1 kar inntil modellens plasser er brukt (skiff og trebåt høyst 2, snekka høyst 3 = 1 500 kg). Det er Jonas' regel rett fram, og det spilleren ser, er det han har.
  - **B:** dagens kilo beholdes og antallet rundes opp (350 → 1, 900 → 2, 1 530 → 4). Det gir halvtomme kar og et fjerde kar som knapt får plass i snekka.
  - **C:** som B, men rundet til nærmeste (1 530 → 3). Da kan et kar få over 500 kg.
  - A endrer kapasiteten litt: skiff/trebåt 350 → 500, snekke 900 → 1 000, og verftets tre steg blir to steg på +1 kar. Økonomien (`turCap`, oppdragene) regner av `holdCap` og justerer seg selv, men det må sjekkes i en tur.
- **K3. De tomme karene etter lossing?**
  - **A (anbefalt):** de kommer tilbake spylt, stablet i ett løft til slutt. Det tar 2,5 spillminutter mer, og båten står aldri uten kar.
  - **B:** de dukker opp tomme på plassene uten animasjon.
- **K4. Lasterom-båtene?**
  - **A (anbefalt):** ta K-E etter K-D. Da løfter alle kystbåtene ekte kar med stropp.
  - **B:** bare de åpne båtene nå.

## Det som er antatt eller usikkert

- 500 kg per kar er Jonas' tall. Se K1 for virkeligheten.
- Plass til tre kar i snekka og to i trebåten og skiffen er ikke målt i modellene ennå. Det avgjøres i K-B med QA-skriptene, og blir det trangt, sier økta fra før den flytter annet utstyr.
- At fisken legges buken ned på langs med is mellom lagene, er vanlig praksis på sjark og snekke slik jeg kjenner det, men det er ikke sjekket mot en kilde (Råfisklagets eller Mattilsynets veiledning om ising bør slås opp i K-C).
- Stroppen med fire kroker under kanten er antatt. Noen mottak bruker en løfteramme eller truck rett fra båten. Jonas kan ha bilder.
- Ytelse: tre fulle kar er rundt 3 × 80 fisk + islag. Det tegnes med de samme fiskemodellene som i dag og bør tåle seg. Hvis ikke, slås fiskene i hvert kar sammen til én buffer når karet ikke endrer seg (ingen kvalitetssenking).

## Hva planen ikke gjør

- Ikke frys- og RSW-fartøyenes lossing (havsteget). Feilen med 1 667 løft føres i backloggen.
- Ikke kassene i rommet på sjarkene (de blir som i dag til K-E).
- Ikke kjøp av kar som eget utstyr. Karene hører til båten (skrog og innredning, ikke redskap).

## Jonas' svar (04.11.2026)

> «K1, la oss bare si at ett fullt kar er 500kg for enkelthetsskyld. Isen trenger ikke ta ekte plass i karet, så lenge det vises at fisken er iset, om mannskapet har kastet is på den. Sørg forresten også for at dette med ising ser bra ut. Det kan ikke bare dukke opp en kasse med is fra løse luften hver gang mannskapet skal ise fisken, og vi må ha blenderanimasjoner for iskasse, spade og selve isbitene, samt animasjoner for handlingen. Sørg gjerne for at det er litt blod og griseri på karene etterhvert som de fylles.
> K2, antall kar må samsvare med lastekapasitet for båter uten lasterom. Om du ser at det blir dårlig plass på dekk kan sikkert karene stables. [...] K3, Enig. K4, Ja. Kar skal løftes med en stropp fra hvert hjørne ja som samles i kroken på kranen. Kjør på»

> «Pass også på at mannskap eller bruker aldri Clipper med bløggekaret. [...] Bløggekaret må stå rett ved sløyebord/benk slik at den som sløyer bare kan plukke fisken opp fra karet, sløye den, så hive den i fiskekarene. De som fisker og bløgger fisken kaster den opp i bløggekaret når den er bløgget.»

## Status

- 04.11.2026: planen skrevet; samme dag valgene og bygd.
- **K1:** `kar460` er 500 kg (`TUB_KG`). Isen tar ingen plass: isbitene ligger på den isede fisken, og et fullt, iset kar har knust is over toppen.
- **K2 (avvik fra planen):** Ingen stabling. Et kar stablet oppå et annet kan ikke fylles før det under er fullt, og da må det tomme bæres over. Det blir ikke realistisk uten en egen bæreanimasjon. Båtene har derfor det dekket har plass til, målt i modellene: skiffen 1 kar (500 kg, før 350), trebåten 1 kar (500 kg, før 350; forreste tofte flyttet 0,11 m), snekka 2 kar (1 000 kg, før 900). Verftet har ingen trinn for disse båtene. Kjøpte trinn betales tilbake én gang (`karRefund`). Plassen for flere kar finnes ikke uten å flytte haleren, bordet eller rorplassen.
- **K3 (justert):** De tomme karene kommer spylt tilbake ett og ett, hvert til sin plass, etter vasken (6 spillminutter). Trucken tar de fulle inn og bringer de spylte ut. Én stropp rundt en stabel tomme kar ville gått gjennom de øverste karene.
- **K4:** Båtene med lasterom lander i mottakets hvite kar på 500 kg med stroppen, satt ut på dekk fra rommet (ikke opp gjennom luka).
- **Isingen:** iskassa (blått 300 l-kar) står fast under sløyebordet på de åpne båtene og ved pakkerens plass på de andre, med isen i så høyt som det er is om bord. Spaden står i den når ingen iser. Spade, skaft, is på bladet og isbiter er Blender-deler (`fisk.py`).
- **Blod:** tre trinn med blod og slim på karet (over 1,5 %, 30 % og 65 % fullt). Spylte kar er rene.
- **Bløggekaret:** flyttet rett ved sløyebordet på skiffen (akter for bordet) og snekka (innenbords for den som sløyer, pakkeren på egen plass `work.pack`); på trebåten tvers og mindre (0,6), fri av den som jukser. Fisken i det legges med samme pakker som i karene, i karets mål, halvt i blodvannet som stiger med den. Sløyeren tar fisken fra bløggekaret, sløyer den på bordet og kaster den i karet som fylles (`gutw`), også når han er alene om bord.

### Det som ikke er gjort eller er svakt

- Ingen egen figur om bord som hekter stroppen på karet. Krokene trekkes ut til hjørnene mens kroken senkes.
- Det er ikke målt i modellene at ingen del av folkene kommer borti karene i alle stillinger. Gangkartet tar karene og iskassa ut (`kitBoxes`), og plassene er regnet med 0,2 m kroppsradius.
- Frys- og RSW-fartøyenes lossing er som før (backloggen).

