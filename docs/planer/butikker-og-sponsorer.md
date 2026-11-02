# Butikker, markeder og sponsorer (plan 30.10.2026)

Jonas' bestilling 30.10.2026: «Finn ut hvordan vi kan forbedre både utseende og funksjon på alle butikker og markeder i spillet. Undersøk gjerne psykologiske og andre mekanismer eller funksjoner som kan være relevante for dette. Hvordan kan vi sko oss for potensielle salg av markedsføring i fremtiden?» Målet: markedsplattformer med godt design og gode løsninger som kan tjene penger på reklame for ekte aktørers merkevarer, og som gir brukerne en god opplevelse. Jonas' egne idéer: et båtmarked som speiler ekte aktører som driver kommisjonssalg av båter, og utstyrsleverandører som vil eksponere merkevaren sin.

Dette er en utredning og en plan, ikke en bestilling. Ingenting her er bygd. Fasene M1–M9 nederst passer én økt hver, og valgene V1–V8 står med anbefaling. Patchnotes skal aldri nevne noe av dette (`CLAUDE.md`: ingen salgsstrategi i patchnotes).

Grunnlaget er skjermbildene Jonas sendte (telefonen, knappelinja i Finnsnes, Båthandel, Fiskeutstyr, Service, Elektronikk og haler), koden (`ui/phone/10-fartoy.js`, `12-utstyr-redskap.js`, `01-haill-fiske-service.js`, `ui/10c-dock.js`, `ui/10i-shop.js`, `ui/10j-paint.js`, `ui/10g-wardrobe.js`, `core/02-species-gear.js`, `core/10-gear.js`, `supabase/migrations/20261006040000_shop.sql`), reglene (`CLAUDE.md`, `docs/engasjement.md`, `docs/handelssteder.md`), researchnotatet `docs/research/oppdragsdesign-psykologi.md`, spilltestene og nettsøk 30.10.2026 (kildene nederst).

## 0. Kortversjon

1. **Butikkene virker, men de er tekstsider.** Båthandelen er det beste vi har (sideriss, datablad, 3D-visning). Utstyrsbutikken og Elektronikk og haler er lister av avsnitt uten bilder, der leksikonteksten og salgsteksten står i samme kort. Det første å gjøre er ett felles varekort med bilde, én linje, pris, stand og én knapp, og å flytte «hvorfor» til Håndboka.
2. **Vi har alt det psykologien trenger, bare ikke i butikken.** Prøv før du kjøper (Malerverkstedet, showroomet), ankerpris (nypris mot brukt), «Mest for pengene», endowed progress («Neste mål») og gratis første gang (is, slep, reparasjon) finnes alt. De skal brukes likt i alle butikkene, innenfor reglene i `docs/engasjement.md` (ingen nedtelling, ingen falsk knapphet, ingen loot).
3. **Båthandelen bør bli et bruktmarked, ikke en katalog.** I dag står alle 14 båttyper alltid til salgs til fast pris. Et marked med enkeltbåter (byggeår, motortimer, stand, hvem som selger, hvor hun ligger), som skifter ukentlig og er likt for alle (felles verden), gir både realisme og en ærlig grunn til å komme tilbake. Det er også den naturlige plassen for en ekte båtmegler.
4. **Sponsing skal være intrinsisk, aldri avbrytende.** Merkevarer hører hjemme der de hører hjemme i virkeligheten: på haleren, på skiltet over butikkdøra, på jakka i Garderoben, som premie i Lofotfisket, som annonse i Kystposten, som «formidlet av» i båtmarkedet. Ingen videoreklame, ingen reklame for belønning, ingen tredjeparts annonse-SDK (det ville kreve samtykkebanner og bryte personvernløftet).
5. **Regelen «ingen ekte firmanavn» må endres til «ingen ekte firmanavn uten avtale».** Grunnen til regelen (søksmål) faller bort når merkevaren har bedt om å være med. Alt uten avtale heter fortsatt etter stedet.
6. **Et sponset produkt gir aldri spillfordel.** Den merkede haleren fisker som den generiske. Merket er utseende, datablad og historie. Ellers blir sponsing pay-to-win og ødelegger tilliten vi lever av.
7. **Bygg det datadrevet.** Sponsorer, varer, skilt og premier skal ligge i databasen og redigeres i admin, som `season_ev` gjør i dag, ikke i koden. En ny avtale skal ikke kreve utrulling.
8. **Mål det som IAB måler.** Synlighet i 3D (andel av skjermen, vinkel, tid) regnes i spillet, samles anonymt og vises i admin som rekkevidde per plassering. Det er dokumentasjonen vi selger på.
9. **Forvent byttehandel før penger.** Med rundt 14 aktive spillere kjøper ingen annonser. Det første året er sponsing gratis utstyr, ekte produktdata, 3D-tegninger og premier mot plass i spillet. Pengene kommer når rekkevidden er dokumentert. Farming Simulator begynte slik og får nå hundrevis av henvendelser i året.
10. **Juridisk er det to ting:** merk det som er betalt (markedsføringsloven § 3, skjult reklame er forbudt), og oppdater personvernerklæringen og vilkårene før første avtale (de sier i dag at vi ikke viser reklame). Forbrukertilsynet har ingen egen veiledning for produktplassering i spill; den generelle regelen gjelder, og første avtale bør sees av en advokat.

## 1. Slik er butikkene i dag

### 1.1 Stedene og knappene

Tre handelssteder (`docs/handelssteder.md`): fiskemottaket (Lever, Is, Agn, Bunkring), utstyrsbutikken (Fiskeutstyr, Service, Elektronikk og haler) og verftet (Båthandel, Oppgrader, Vedlikehold, Malerverksted, Bunkring). Bygd har Pub, Gjestebok, Bank, Oppdrag, Ansatte. Kaiboden på telefonen selger haill, trim og Skippertak for ekte penger (💎). Malerverkstedet selger skrogfarge for spillpenger og design, flagg, ønskenummer og logo for ekte penger. Garderoben er gratis. 103 butikker og 157 verft langs kysten, navngitt etter stedet.

Det som er godt, og som alt nytt skal bygge på:

- **Én logikk for alle kjøp** (`buyGate`, `equipFits`): butikken viser bare det som passer båten, og sier hvorfor noe ikke kan kjøpes.
- **Kjøp bare der det hører til**, med «nærmeste sted» og Autonav dit (`nearHint`).
- **Båthandelen**: sideriss i SVG per båt, datablad med åtte faste seksjoner, «Se båten i 3D» (`G3.showroom`), innbytte og lån regnet ut i kortet.
- **Malerverkstedet**: prøv fargen og designet på båten før du betaler, kameraet går rundt båten.
- **Kaiboden**: priser i kroner med 💎, «Mest for pengene» som er sant, angrerettlinja, ingen nedtelling.
- **Service**: tilbakekjøp som aldri lønner seg å spekulere i, reparasjon på halve tiden mot gebyr.

### 1.2 Det skjermbildene viser (Finnsnes, 30.10.2026)

- **Fiskeutstyr** (`fiske()` i `01-haill-fiske-service.js`): hvert kort er en overskrift, et avsnitt på tre til fem linjer, «Pris» og «Om bord» i grønt eller en knapp. Ingen bilder. Teksten om torskegarn er et leksikonavsnitt (maskevidder, 62° N, «krever minst to om bord», «plass til 60 til») før det står hva som kan kjøpes. Nederst står «Prisene er foreløpige» til spillerne. Kjøpet tar to trykk (bekreft), som er riktig, men bekreftelsen ser ut som en ny knapperad.
- **Service**: stolper for stand og tak, antall kroker, to store mørke knapper med gebyr og tid. Funksjonelt, men alle kortene er like tunge, og teksten øverst forklarer forretningsregelen («Det lønner seg aldri å kjøpe og selge») i stedet for å si hva du kan gjøre her.
- **Elektronikk og haler** (`utstyr('butikk')` i `12-utstyr-redskap.js`): en lang liste der alt som er kjøpt, står som «Montert» i fet, uten bilde, uten merke og uten mulighet til å sammenligne. Tittelen i skuffen er «Elektronikk og haler», mens knappen i vifta heter det samme og Oppgrader på verftet åpner «Oppgraderinger» fra samme funksjon. Spilleren ser ikke forskjell på butikkens og verftets side før han leser.
- **Båthandel**: fanene og kortene fungerer. Innledningsteksten er tre linjer med regler (åpen gruppe, innbytte, «neste båt du kjøper»). Alle båter står alltid til salgs, merket «brukt», til samme pris i hele landet. En «brukt» aluminiumsbåt fra 2008 ser lik ut i Finnsnes og i Egersund, hver dag, hele året.
- **Telefonen**: 18 apper. Kaiboden (brun, butikk-ikon) ligger i fjerde rad. Det er riktig at den ikke er den første man ser; den skal ikke mase.
- **Spilltestene** (`docs/playtest/rapport-1.md`, `rapport-2.md`): «Neste mål» var for godt gjemt under Fartøy › Marked; lånetallene i Marked blandet to ting; «Reglene står i lange avsnitt i driftsplanen og markedet, akkurat når jeg skulle gjøre noe annet».

### 1.3 Det som mangler mot et marked

- **Ingen varebilder** for utstyr. Modellene finnes (`haul-garn.b64`, `haul-line.b64`, `gear-jig.b64`, `deck-safety` med radar og flåte, `gear-pot`), men butikken bruker dem ikke.
- **Ingen tilbud, ingen variasjon, ingen tilfeldighet.** Fiskeprisene svinger ukentlig (`weekDev`), dieselen per havn (`fuelPortF`), men utstyr og båter er faste overalt. Det er ingen grunn til å kjøpe i Tromsø framfor Finnsnes.
- **Ingen selger.** Mottaket har en bestyrer som husker deg (`turManager`), puben har bartender og kjentmann, men butikken og verftet har ingen ansikt. B1 i `docs/forslag.md` («Folk som husker deg») nevner kjøpmannen og verftseieren.
- **Ingen kjøpsøyeblikk.** Haleren kommer som en linje i loggen. Båten byttes «så snart båten den skal erstatte, ligger i havn». Ingenting skjer på kaia.
- **Ingen «før og etter».** Oppgrader viser «Nå» og «Neste trinn» som tall; haleren sier «Trekker lina jevnt og raskt» uten å si hvor mye raskere enn for hånd (koden vet det: 2–2,5 ganger).
- **Ingen merkevarer.** Riktig etter regelen, men det er akkurat det en sponsor kjøper.

## 2. Psykologi og mekanismer, og hva vi kan bruke

Reglene i `docs/engasjement.md` står: ærlig engasjementsdesign fullt ut, manipulasjon aldri. Tabellen sier for hver mekanisme om den passer, og hvor den hører hjemme. «Allerede» betyr at den finnes i spillet et annet sted.

| Mekanisme | Hva forskningen sier | Passer? | Bruk i butikkene |
|---|---|---|---|
| **Prøv før du kjøper / eierskapseffekten** (endowment, Kahneman, Knetsch og Thaler 1990) | Vi verdsetter det vi alt holder i hånden høyere. Prøving flytter varen inn i «mitt». | Ja | Allerede i Malerverkstedet og showroomet. Mangler for utstyr: vis haleren, radaren, juksamaskinen på *din* båt i 3D før kjøpet (modellene og festepunktene finnes, 5.62). «Prøvetur» på en brukt båt: 10 minutter ved kaia i 3D, uten fiske. |
| **Ankerpris** (Tversky og Kahneman 1974) | Første tall farger alle de neste. | Ja, når tallene er sanne | Allerede i databladet (nypris mot pris). Vis det på kortet: «1,15 mill. · ny 9,5 mill.» for havsjarken. For utstyr: «Linehaler 68 000 kr · trekker 2,3 ganger raskere enn for hånd». |
| **«Mest for pengene» / tre trinn** (decoy-effekten, Ariely 2008) | Et mellomvalg gjør det dyreste rimelig. | Ja, når merket er sant (`kbBest`, `skiptest.py`) | Allerede i Kaiboden. Bruk samme merke i Oppgrader (tre lasteromstrinn) og krokpakker (100/500/1000), regnet ut, aldri satt for hånd. |
| **Endowed progress** (Nunes og Drèze 2006) | En stige som alt har noen trinn fylt, fullføres oftere. | Ja | Allerede i «Neste mål». Legg stigen *inn* i hvert varekort: «Du har 61 % av egenkapitalen» på båtkortet, ikke bare øverst. |
| **Goal gradient** (Hull 1932, Kivetz 2006) | Innsatsen øker nær målet. | Ja | Når en båt er under 10 % unna, får kortet en stille markering og en linje i Rederi-varslene («Tre leveringer til»). Aldri push. |
| **Sosialt bevis** (Cialdini) | Vi gjør det andre som oss gjør. | Ja, additivt og sant | «Fire båter i Troms har garnhaler» fra `landings`/`presence`. «Mest kjøpt denne uka langs kysten». Aldri navn, aldri hvem som har haill. |
| **Gjensidighet** (Cialdini; Gouldner 1960) | En gave skaper lyst til å gi tilbake. | Ja, som i dag | Allerede: første is, første slep, første reparasjon. En sponsor kan betale gaven: «Jakka fra X til alle som registrerer seg». Den som får, vet hvem som ga. |
| **Knapphet** | Det som er få av, er mer verdt. | Bare når den er ekte | Et bruktmarked med én av hver båt er ekte knapphet: simuleringen, ikke butikken, lager den. Ingen «bare i dag», ingen nedtelling, ingen «3 andre ser på denne». Ingen knapphet på det som selges for ekte penger. |
| **Tapsaversjon** | Tap svir dobbelt. | Nei, ikke mot spilleren | Vi bruker den ikke til å selge (ingen «du mister bonusen»). Vi bruker den *for* spilleren: innbytteverdien står alltid synlig, så ingen føler seg lurt ved bytte. |
| **Kognitiv letthet / bilder** (Kahneman 2011) | Det som er lett å ta inn, føles sant og godt. | Ja | Bilde på hvert kort, én linje, prisen stor. Leksikonet (maskevidder, 62° N) i Håndboka, lenket fra kortet. |
| **Valgarkitektur** (Thaler og Sunstein) | Færre valg, gode standardvalg, det relevante først. | Ja | «Passer båten din» først, sortert etter det du mangler (`buyGate` vet). Det som ikke passer, i en lukket seksjon «Passer ikke «Idamor»». |
| **Toppen og slutten** (Kahneman, peak-end) | Vi husker toppen og slutten av en opplevelse. | Ja | Kjøpsøyeblikket på kaia: haleren heises om bord, båten kommer inn fra sjøen med den nye eieren om bord, nøkkelen. Det samme hver gang, kort (under 15 s), kan hoppes over. |
| **Vane og rutine** | Faste handlinger på faste steder. | Ja | En «Innkjøpsliste» som fylles av behovet (is lav, 89 kroker å bytte, service forfalt) og som følger spilleren til riktig butikk. Prikken på Verft-knappen (`svcOverdue`) er første bit. |
| **Immersion og utforskning** (Yee) | De sterkeste motivasjonene i MMO-data. | Ja | Butikker som er ulike: utvalget per sted, tilbud der, en selger med dialekt. En grunn til å gå i land andre steder. |
| **Loot, gacha, FOMO, falsk nedtelling** | Virker kortsiktig, skaper mistillit, lovstridig i flere land | Nei | Står i «Det vi ikke gjør». Uendret. |

Konklusjonen er at butikkene ikke trenger nye triks. De trenger at det vi alt gjør riktig i Kaiboden, Malerverkstedet og Båthandelen, gjøres likt overalt, med bilder, med et ansikt og med et kjøpsøyeblikk.

## 3. Design: ett varekort, fire butikker

### 3.1 Varekortet (felles for alt som selges for spillpenger)

Ett kort, samme rekkefølge overalt, bygd på `.ph-card` og `.vcard` som finnes:

```
┌───────────────────────────────────────────────┐
│ [bilde 42 %]  Garnhaler                        │
│               Trekker garna 2,3× raskere       │
│               95 000 kr · passer fra 7,5 m     │
│               ● Om bord  /  [Kjøp og monter · 30 min] │
│               ▸ Mer om garnhalere (Håndboka)   │
└───────────────────────────────────────────────┘
```

- **Bilde:** sideriss av modellen, laget én gang per utstyr slik `vesselSVG` lages fra 3D-spesifikasjonen (eller et kontrollbilde fra Blender-rørledningen, `/blender`, lagret som `pic-<id>`). Virker uten WebGL.
- **Én linje** med virkningen i tall fra koden, aldri prosa: «2,3× raskere», «+20 % last», «ser fisken 1,5 nm», «holder krabben levende i flere døgn».
- **Prisen** stor, og ankeret ved siden når det finnes (nypris, eller «for hånd: gratis, men 2,5× tid»).
- **Standen** der den finnes (stolpen fra Service), ellers «Om bord» eller «Passer ikke «Idamor»» med grunnen fra `equipFits`.
- **Én knapp.** Bekreftelsen (to trykk) beholdes, men som at knappen selv bytter tekst til «Bekreft 95 000 kr» i tre sekunder, ikke en ny rad.
- **«Mer»** åpner Håndboka på riktig oppslag (`07c-handbook.js` har `hb`-hendelser). Leksikonteksten flyttes dit.
- **Sponsorfelt** (del 5): et lite merke øverst til høyre, «Levert av X» med logo, bare på varer med avtale.

### 3.2 Utstyrsbutikken

- **Én side, tre faner:** Redskap (garn, line, teiner, blåser, kroker, juksautstyr), Elektronikk (plotter, VHF, AIS, CHIRP, sonar, radar, brovakt), Haler og dekk (halere, juksamaskin, krabbekar, klær). Service blir en fane på Beholdning › Redskap der standen alt vises, med «Butikken gjør det» ved siden av «Selv». Da er Service ikke lenger et sted spilleren må lete etter.
- **Sortering:** «Til «Idamor»» først (det som passer og mangler), så «Om bord» (sammenslått, kort), så «Passer ikke» (lukket).
- **Innkjøpslista** øverst: det båten trenger nå (is lav, 89 kroker, lina under 45 %, service forfalt, klær til ny mann om bord), som knapper rett til kortet. Lista regnes av det som alt finnes (`hooksNeed`, `svcOverdue`, `coldPen`, `careQuote`).
- **Kjøpmannen:** én navngitt person per butikk, med dialekt (`dialectAt`), som sier én linje ved inngang og én ved kjøp («Den der kommer du til å like, Jonas»). B1 i `docs/forslag.md`. Han husker siste kjøp. Ingen tall, ingen tips om fisk.
- **Bort:** «Prisene er foreløpige» (til `BACKLOG.md` 10.3 i stedet), forretningsregelen øverst på Service.

### 3.3 Verftet: Båthandel som bruktmarked (Jonas' idé om kommisjonssalg)

I virkeligheten selges sjarker gjennom meglere og FINN, og hver båt er én båt med historie. Spillet bør gjøre det samme:

- **Oppføringer, ikke typer.** `S.market` (eller en felles tabell, V3) har 20–40 oppføringer langs kysten om gangen: type fra `VESSELS`, byggeår innenfor typens spenn, motortimer, stand (skrog, motor, elektronikk fra `EQUIP` som følger med), hvor hun ligger (et verft), hvem som selger (en NPC-skipper fra B2, et dødsbo, et rederi som strukturerer, eller en megler), prisen justert ±15 % etter stand og sted, og hva som følger med (haler, juksamaskiner, garn). Den som har stått lenge, går ned i pris; den som er god og billig, blir solgt til en NPC etter noen dager. Alt deterministisk av ukenummer og frø, så alle ser det samme (felles verden), og serveren kan trekke en oppføring når en spiller kjøper (V3).
- **Faste tilbud beholdes** for det stigen trenger: den nye hurtigsjarken (nybygg, alltid), de fem hjemmelstilbudene (`LIC_OFFERS`), og alltid minst én båt i hver fane innen 20 nm, så ingen står fast. Bruktmarkedet legger seg oppå, det erstatter ikke.
- **Kortet:** sideriss i båtens egen farge (livery finnes), navn hun hadde, byggeår, motortimer, pris med anker (typens nypris), «ligger i Myre, 34 nm». Databladet som i dag, pluss «Tilstand» (det som er slitt, det som er nytt) og «Følger med».
- **Takst:** for 3 000–8 000 kr (etter størrelse) gir en takstmann en rapport som avdekker det kortet ikke sier (motoren er dårligere enn timene tilsier). Kjøpes uten takst, kommer det fram første uka. Det er simuleringens egen friksjon, ikke en felle: taksten koster mindre enn den sparer, og første takst er gratis (som første slep).
- **Prøvetur:** «Se båten i 3D» utvides til ti minutter ved kaia med rattet, uten fiske. Eierskapseffekten gjør resten.
- **Kjøpsøyeblikket:** båten ligger ved verftets kai; spilleren går om bord i 3D (kameraet flytter), navnet males (Malerverkstedet åpner med navnet ferdig), flagget går opp. 15 sekunder. Innbyttebåten blir liggende ved kaia med «Til salgs» til neste uke, og kan dukke opp i markedet igjen, kjøpt av en NPC med nytt navn (B2).
- **Salg uten kjøp:** «Selg» og «Legg ut til salgs» (kommisjon, 5 %, selges innen 1–3 uker til markedspris, som i dag står i `vesselValue`). Kommisjonssalg er akkurat det en megler gjør, og det er der en ekte megler hører hjemme (del 5, F6).
- **«Neste mål»** flyttes ut av Båthandelen og inn på hvert kort som en linje under prisen, og beholdes på telefonens hjemskjerm (spilltest 1).

### 3.4 Mottaket, Kaiboden, Malerverkstedet og Garderoben

- **Mottaket** selger is, agn og diesel. Her trengs lite: varekortet for is og agn, og at bestyreren (finnes) sier prisen på dagens fisk når du kommer, ikke bare i Salgslaget.
- **Kaiboden** er riktig som den er (regler, 💎, angrerett). Det ene: «Kystfiskerpakken» (punkt 8 i `docs/engasjement.md`) som fane fire, ett kjøp for den som heller betaler én gang.
- **Malerverkstedet** er mønsteret for sponsing: det som kjøpes, er pynt, varig, synlig for andre. En sponsors design (del 5, F5) selges her, og sponsoren kan spandere det (gratis for alle, sponsoren betaler).
- **Garderoben** er gratis og har jakke, bukse, sko, hatt. Arbeidsklær er det naturligste av alt å sponse (regntøy, flytedresser, støvler): en ekte jakke som valg, med merkets farge og logo, gratis for spilleren, betalt av merket. Klærne i butikken (`CLOTHES`: oljehyre, varmedress) er funksjon og selges for spillpenger som i dag; Garderoben er utseende.

### 3.5 I 3D

- **Skiltet.** Butikkmodellen (`tools/harbour/butikk.py`, `harbour-unit-s`) og verftet (`harbour-unit-y`, skiltet VERFT · BÅTSALG) får et navngitt feste `anchors.sign` slik puben har (`anchors.sign` får stedets navn). Skiltet viser stedets navn som i dag, og med avtale sponsorens logo på et eget felt under eller ved siden av (tekstur som rederilogoen, 256 × 256 WebP, `logo_put`-mønsteret). Et banner på kaikanten og en flaggstang med sponsorflagg er samme teknikk.
- **Varene står ute.** Ved butikken står det den selger: en haler på en pall, stabler av teiner, garnkar, en juksamaskin på en bukk (modellene finnes i `tools/deck/` og `tools/gear/`). Det gjør kaia til en butikk uten en eneste knapp, og det er flatene en sponsors merke kan stå på.
- **Ved verftet** ligger markedets båter ved kaia (de har liggeplasser, `UNIT_Y`, og NPC-tegningen bruker de samme modellene). Spilleren ser båtene til salgs når han kommer inn.

## 4. Hvordan vi skor oss for salg av markedsføring

### 4.1 Hva vi selger, og til hvem

Publikummet er lite og skarpt: folk som kjenner kystfiske, i Norge, 13 år og eldre, med båt i spillet som ligner båten de har eller drømmer om. For en halerprodusent i Måløy, en klesprodusent, et forsikringsselskap for fiskefartøy, en båtmegler i Nord-Norge eller et verft som bygger sjarker, er det et publikum de ellers når gjennom Fiskeribladet, Nor-Fishing og FINN. Vi selger ikke CPM; vi selger *plassering i den verdenen kundene deres jobber i*, dokumentert med tid på skjerm.

Giants Software (Farming Simulator) er forbildet: produsentene betaler for å være med, og inntekten dekker utviklingen; de måtte be om å få lov i begynnelsen, nå velger de. Corteva sponset ligaen og fikk varene sine i spillet. Volvo CE gjorde en avtale for FS22. Vi er tusen ganger mindre, så rekkefølgen er: byttehandel og «founding partner» først, kontantavtaler når tallene er der.

### 4.2 Formatene (alle intrinsiske)

| # | Format | Hvor | Hva sponsoren får | Hva spilleren får | Regel |
|---|---|---|---|---|---|
| **F1** | **Merkevare på utstyr** | Utstyrsbutikken, Beholdning, 3D på dekk | Navn, logo og ekte modellbetegnelse på haleren/juksamaskinen/radaren/plotteren, databladet med ekte spesifikasjoner, logoen på modellen om bord (dekal-sone som livery-sone 1) | Et ekte produkt å kjenne igjen, samme pris og virkning som det generiske | Aldri bedre tall enn det generiske. Begge selges. |
| **F2** | **Skilt, banner og flagg** | Butikk, verft, mottak (skiltfestet), kaikanten | Logo på skiltet over døra i N butikker (etter region), banner, sponsorflagg | Ingenting, og ingenting tatt | Målt per IAB (4.4). Aldri på sjøen, aldri i kartplotteren, aldri i HUD. |
| **F3** | **Sponsede hendelser** | Lofotfisket, Finnmarksfisket, Seisommeren, Krabbehøsten (`season_ev`) | «Lofotfisket 2027 · premier fra X», logoen på tavla, premien (ekte vare eller spillpenger) | Større premier, vimpel som i dag | Vimpelen er gratis og kan ikke kjøpes (A2). Premien til topp 3 kan være ekte (konkurranseregler, sjekk markedsføringsloven om konkurranser). |
| **F4** | **Annonse i Kystposten** | Kystposten (`09h-press.js`) | En annonsesak merket «Annonse» i spillets avisstil, med bilde og lenke | Avisa blir mer ekte (ekte aviser har annonser) | Merket «Annonse» (mfl. § 3). Høyst én per utgave. Ingen push fra Kystposten (regel). |
| **F5** | **Klær og design** | Garderoben, Malerverkstedet | Merkets jakke/dress/støvler som valg; skrogdesign i merkets farger | Gratis pynt, varig, synlig for andre | Kosmetikk er varig og synlig (regel). Spilleren velger selv å ha det på. |
| **F6** | **Båtmegler i markedet** | Båthandelen (3.3) | «Formidlet av X» på oppføringer som er bygd av meglerens ekte båter til salgs (type, år, lengde, pris lagt om til spillets skala), lenke «Se den ekte båten» | Et marked som ligner på det ekte, og en vei til ekte båter for den som drømmer | Oppføringen er spillets båt (`VESSELS`), ikke meglerens modell. Lenken åpner i ny fane, merket. |
| **F7** | **Sponsorgave** | Registrering, milepæler («Første uke på sjøen») | «Jakka fra X» til alle nye, «dregg fra Y» som drypp | En gave med avsender | Gaven er kosmetikk eller en vare som alt finnes for spillpenger. Aldri haill, aldri Skippertak (de selges). |
| **F8** | **Lenke ut** | Varekortet («Se hos forhandler»), Kystposten | Klikk til egen side, med `?fra=detstorebla` | Veien til det ekte produktet | Alltid i ny fane, alltid merket, aldri i veien for kjøpet i spillet. |

**Det vi ikke gjør:** videoreklame og belønningsreklame (regel), avbrytende bannere, programmatisk annonsering og tredjeparts SDK (krever samtykkebanner etter ekomloven § 3-15, og personvernerklæringen sier «Vi viser ikke reklame, sporer deg ikke for reklame»), reklame rettet mot barn (13-årsgrensen står; ingen direkte kjøpsoppfordring, mfl. § 20), haill eller fordeler i spillet som sponsorvare, og noe som helst sponset på sjøen, i kartplotteren, i HUD eller i Driftsplanen. Sjøen er spillerens.

### 4.3 Pakker og priser (startverdier, justeres)

| Pakke | Innhold | Pris første år |
|---|---|---|
| **Founding partner** (5–8 stk., det første året) | F1 på én vare, F2 på skiltet i én region, logo på kildesiden og i «Sponsorer» i Håndboka, F7 én gang | Byttehandel: ekte produktdata, tegninger/mål for 3D, premier, deling i egne kanaler. Ingen penger. |
| **Vare** | F1 på én vare, F8 | 15 000–30 000 kr i året, når rekkevidden er dokumentert |
| **Sted** | F2 på skiltet i N butikker eller verft, banner | 10 000–40 000 kr i året etter N |
| **Sesong** | F3 på én hendelse (10–12 uker) | 20 000–50 000 kr, pluss premiene |
| **Megler** | F6 med inntil 10 ekte oppføringer om gangen, F8 | 2 000–5 000 kr i måneden, eller provisjon på henvendelser |

Tallene er anslag for et spill med noen hundre aktive spillere. De skal settes etter rekkevidden admin viser (4.4), ikke før. Det første året teller byttehandelen: ekte mål på en garnhaler er verdt mer for spillet enn 15 000 kr.

### 4.4 Måling, som IAB

IAB og MRC ga ut *Intrinsic In-Game Measurement Guidelines* 2.0 i 2022 (oppdateringen av 2009-standarden), og IABs *Gaming Measurement Framework* (juni 2025) peker til dem for intrinsiske plasseringer. Hovedtrekkene: en visning teller når plasseringen har en viss andel av skjermen, innenfor en vinkel mot kameraet, i en viss sammenhengende tid, og det må skilles mellom aktive og inaktive spillere og finnes vern mot juks. Den fulle teksten med tallene er for IAB-medlemmer; tersklene under er startverdier og må sjekkes mot dokumentet før vi selger på dem.

- **I spillet** (`view3d`, der skiltet tegnes): per bilde regnes skiltets projiserte areal i prosent av skjermen og vinkelen mellom skiltets normal og kameraet. Over terskelen (start: 1,5 % av skjermen, under 55°) tikker en teller per plassering. Etter 1 s sammenhengende teller det som én synlig visning, og sekundene summeres. Står spillet stille (ingen berøring på to minutter, siden skjult), telles ingenting.
- **Sendingen:** én rad per plassering per økt, `sp_view {pl, imp, sec}` gjennom `tm_batch` som alt finnes, bare for spillere som deler statistikk (samtykket som i dag). Ingen tredjepart, ingen ny personopplysning, ingen informasjonskapsel.
- **Admin:** fanen «Sponsorer» med rekkevidde per plassering per uke (unike spillere, synlige visninger, sekunder, klikk ut), eksport som CSV til sponsoren. Dette er medieplanen.
- **Lenker ut** telles som `sp_click` med samme nøkkel.

### 4.5 Juridisk og regler

- **Markedsføringsloven § 3:** markedsføring skal framstå som markedsføring, skjult reklame er forbudt. Et sponset produkt i spillet er produktplassering; vi merker det («Levert av X», «Annonse», «Sponset») og har en side «Sponsorer» som lister alle avtaler. Kulturdepartementets høring (2023) sier at produktplassering utenfor kringkasting vurderes etter det generelle forbudet mot skjult reklame; Forbrukertilsynets veileder om sosiale medier sier «merk når du er i tvil». Ingen egen veiledning for spill ble funnet 30.10.2026. **Første avtale bør sees av advokat.**
- **Barn:** 13-årsgrensen står, og reklamen rettes ikke mot barn (mfl. kap. 4). Ingen direkte kjøpsoppfordringer (UCPD vedlegg I nr. 28, som haill-tekstene alt følger).
- **Personvern:** `src/legal/personvern.html` sier «Vi viser ikke reklame, sporer deg ikke for reklame og selger ikke opplysninger til noen». Setningen må skrives om før første sponsor: «Spillet kan vise sponsede varer og skilt fra navngitte samarbeidspartnere. Vi måler hvor lenge slike skilt er synlige, samlet og uten å dele hvem du er. Ingen tredjepart får opplysninger om deg.» Vilkårene får et avsnitt om sponsede varer (ingen spillfordel). Ingen samtykkebanner trengs så lenge målingen er vår egen og uten informasjonskapsler (ekomloven § 3-15, slik `docs/lansering.md` D4–5 alt legger det opp).
- **CLAUDE.md-regelen «Ingen ekte firmanavn»** endres til: ingen ekte firmanavn *uten skriftlig avtale*. Alt uten avtale heter etter stedet som før. Offentlige organer kan nevnes som før. Navnet på en sponsor står i databasen, aldri hardkodet.
- **CLAUDE.md «Ingen reklame»** (under sosialt) presiseres: ingen belønningsreklame og ingen avbrytende reklame; sponsede varer og skilt etter denne planen er tillatt.
- **Konkurranser** (F3 med ekte premier): reglene for konkurranser i markedsføring (mfl. § 2 og Forbrukertilsynets veiledning om konkurranser) sjekkes før første.
- **Varemerker:** sponsorens logo brukes etter avtalen. Ingen andre merker, heller ikke «inspirert av» (`docs/systemer/baater.md`: forbildene står bare i kommentarer).

### 4.6 Salgsmateriell (det Jonas trenger for å ringe)

- **Mediekortet** (én side, lages fra admin): spillere (registrerte, aktive siste 30 dager), økter per dag og lengde, hjemhavner per fylke (fra `homePort`), båter i flåten per type, andel som har levert, og bildene: butikken i Finnsnes med et skilt, haleren på dekk, Lofotfisket-tavla. Oppdateres hver måned.
- **Et demobygg** med en oppdiktet sponsor («Nordlys Utstyr») som viser alle formatene, så en prospekt kan se det i spillet på nettbrettet. Det er samme bygg som testene bruker (sponsor i testdata, aldri i produksjon).
- **Lista over kandidater** (ikke kontaktet, bare funnet 30.10.2026): halere og dekksutstyr (Olsen Fangst og Kraftblokk, marinH i Bodø som representerer Solent og Spencer Carter), redskap til kystflåten (Frøystad, Skibs- & Fiskeriutstyr, Fiskevegn, Vónin Refa med kontor i Finnsnes), arbeidsklær, forsikring for fiskefartøy, en båtmegler i Nord-Norge (1881 lister en skipsmegler i Nord-Norge siden 1971 med fiskefartøy som spesialitet, medlem av Norsk Skipsmeglerforbund), verft som bygger 10,99-metere. Alt dette må Jonas sjekke selv; ingen av dem skal nevnes i spillet før en avtale finnes.

## 5. Teknisk design (så en ny avtale ikke krever utrulling)

- **Databasen** (`supabase/migrations/2026…_sponsors.sql`): `sponsors (id, name, kind, logo_url, site_url, from_at, to_at, active)` og `sponsor_placements (id, sponsor_id, kind: 'item'|'sign'|'event'|'press'|'look'|'broker'|'gift'|'link', target: equip-nøkkel, stedsid/region, event-id, …, data jsonb, from_at, to_at)`. RPC `sp_now()` gir aktive plasseringer (som `ev_now()`), lest ved oppstart og hver time. Admin-funksjoner for å legge til og slå av. Uten skyen (artifacten, testene): ingen sponsorer, bortsett fra testdataene.
- **Klienten:** `core/09j-sponsor.js` (lista, oppslag `spOf(kind, target)`), `ui/10q-sponsor.js` (varemerket på kortet, «Sponsorer»-siden i Håndboka, lenke ut). Varekortet (3.1) spør `spOf('item', k)` og viser merket; `EQUIP` røres ikke. Skiltet i `view3d/06-buildings-lights.js` spør `spOf('sign', sted)`; teksturen hentes som `peerLogo` henter logoer (mellomlagret per versjon). Kystposten får sakstypen `annonse` fra `spOf('press')`. Garderoben får plagg fra `spOf('look')` med egen farge og logo-tekstur.
- **Målingen:** `view3d/17-draw.js` (eller der skiltet tegnes) regner areal og vinkel per bilde for skilt innenfor 150 m, `SPV` samler per plassering, `10f-cloud.js` sender `sp_view` i `tm_batch` ved øktslutt og hvert 10. minutt. Admin-fanen leser `events` som trakten gjør.
- **Bruktmarkedet:** `core/09k-market.js` lager ukas oppføringer deterministisk (`h2(uke, frø)`), `S.market` holder det spilleren har sett og kjøpt. Med V3 B: tabellen `listings` på serveren med `listing_buy` som gir båten til én spiller. Meglerens oppføringer (F6) legges inn i admin eller importeres av `tools/broker/import.py` fra en CSV meglerne gir (lengde, år, skrog, pris, lenke), og mappes til nærmeste `VESSELS`-type etter lengde, materiale og år.
- **3D:** `anchors.sign` i `tools/harbour/butikk.py` og `steder.py` (s og y), en dekal-sone på halermodellene (`tools/boats/`/`tools/deck/`, sone som livery-sone 1 på båtene), varer ute på kaia som nye `kit`-festepunkter på havneenheten. Alt gjennom `/blender`-rørledningen.
- **Tester:** `sponsortest.py` (uten 3D: kortet merket, lenken merket og i ny fane, uten avtale ingen merker, generisk og merket vare har samme tall), `signshot.py` (3D: skiltet med og uten logo, målingen teller når det er synlig og ikke når siden er skjult), `markettest.py` (ukas oppføringer like på to enheter, takst, salg i kommisjon), `shopuitest.py` (varekortet i begge formater, Innkjøpslista). `COVER` får de nye filene.

## 6. Faser (én økt hver)

| Fase | Hva | Avhenger av |
|---|---|---|
| **M1 Varekortet** | Ett varekort for utstyr og redskap med bilde, én linje med tall, pris med anker, stand, én knapp, «Mer» til Håndboka. Leksikonteksten flyttes til Håndboka. «Prisene er foreløpige» bort. Skjermbilder i begge formater. | ingenting |
| **M2 Butikken på ny** | Tre faner, «Til «Idamor»» først, Innkjøpslista, Service som fane under Beholdning › Redskap, kjøpmannen med én linje. | M1 |
| **M3 Prøv før du kjøper** | Utstyr vist på egen båt i 3D før kjøpet (halere, juksamaskin, radar, krabbekar) med `paintView`-kameraet; kjøpsøyeblikket for utstyr (heises om bord, 10 s). | M1 |
| **M4 Bruktmarkedet** | Ukas oppføringer, kortene, tilstand og «følger med», takst (første gratis), prøvetur, salg i kommisjon, «Neste mål» på kortet. Faste tilbud beholdes. | V3 |
| **M5 Kjøpsøyeblikket for båt** | Om bord ved verftets kai, navnet, flagget, innbyttebåten blir liggende. | M4 |
| **M6 Sponsor-grunnmuren** | Tabellene, `sp_now`, admin-fanen med legg til/slå av, varemerket på kortet (F1), lenke ut (F8), «Sponsorer» i Håndboka og på kildesiden, personvern og vilkår oppdatert, CLAUDE.md-regelen endret, testsponsoren i testdata. | M1, V1 |
| **M7 Skilt og måling** | `anchors.sign` på butikk og verft, teksturen, målingen per IAB, `sp_view` i `tm_batch`, admin-rapporten med CSV. | M6, `/blender` |
| **M8 Resten av formatene** | Kystposten-annonse (F4), Garderoben og Malerverkstedet (F5), hendelser (F3), gaver (F7), megler-feed (F6) med import. | M6, M4 for F6 |
| **M9 Mediekortet og demobygget** | Mediekortet fra admin, demobygget med «Nordlys Utstyr», ett dokument Jonas kan sende. | M7 |

Rekkefølgen er valgt så spillerne får noe (M1–M5) før sponsorene får noe (M6–M9), og så grunnmuren står før første samtale. M1 og M6 kan gå parallelt i hver sin økt (ulike filer: `ui/phone/` mot `core/09j` og `supabase/`).

## 7. Valg for Jonas

1. **V1 Regelen om ekte navn.** A: «ingen ekte firmanavn uten skriftlig avtale» (anbefalt). B: regelen står, og sponsing bygges bare med oppdiktede merker (da er det ikke sponsing). C: avgjøres per avtale.
2. **V2 Formatene.** A: alle åtte, i rekkefølgen M6–M8 (anbefalt). B: bare F1, F2 og F6 (vare, skilt, megler). C: bare F1 og F8.
3. **V3 Bruktmarkedet.** A: lokalt og deterministisk, likt for alle, men to spillere kan kjøpe samme oppføring (enklest, ingen migrering) (anbefalt som første runde). B: felles på serveren, én kjøper per oppføring (ekte knapphet, en migrering). C: ingen bruktmarked, bare katalogen som i dag.
4. **V4 Takst og prøvetur.** A: begge, første takst gratis (anbefalt). B: bare prøvetur. C: ingen av delene.
5. **V5 Sponset vare og tall.** A: samme tall som det generiske, alltid (anbefalt). B: sponsoren kan få ±5 % på pris i spillpenger (aldri virkning). C: fritt.
6. **V6 Første år.** A: byttehandel og founding partners, ingen priser før rekkevidden er målt (anbefalt). B: priser fra dag én.
7. **V7 Garderoben.** A: sponsede plagg gratis for alle (anbefalt). B: sponsede plagg selges for spillpenger. C: ikke i Garderoben.
8. **V8 Kystposten.** A: én annonse per utgave, merket (anbefalt). B: ingen annonser i Kystposten.

## 8. Det vi ikke gjør

- Nedtellinger, «bare i dag», «3 andre ser på denne», falsk lagerstatus. Knapphet bare fra simuleringen (én båt per oppføring).
- Sponsorer på sjøen, i kartplotteren, i HUD, i Driftsplanen, i push, i Kystposten som push.
- Videoreklame, belønningsreklame, interstitials, tredjeparts annonse-SDK, retargeting, piksler.
- Sponsorvarer med bedre tall, haill eller Skippertak som sponsorgave, fartstid fra sponsorer.
- Sponsorlogoer i det som deles ut av spillet uten spillerens valg (Årboka, delingsbildet: bare om spilleren selv har plagget på eller designet på båten).
- Reklame rettet mot barn, direkte kjøpsoppfordringer.
- Patchnotes som nevner sponsing, priser, strategi eller psykologi.

## 9. Måling av om det virker (for spillerne)

- Andel av butikkbesøk som ender i kjøp, per butikk og kort (hendelsen `app`/`action` finnes; legg til `shop_view {page}` og `shop_buy {k}`).
- Tid fra «Neste mål» til kjøpt båt, før og etter M4.
- Andel båtkjøp med takst og prøvetur; andel som angrer (bytter innen en uke).
- Dag 7/30-retensjon for spillere som har brukt bruktmarkedet mot ikke.
- For sponsorene: 4.4.

## 10. Gjennomføringsplanen (30.10.2026, etter Jonas' svar)

Jonas 30.10.2026: «Reglen om "ingen ekte firmanavn eller organisasjonsnavn" skal endres til at det ikke skal være i spillet uten en skriftlig avtale. Personvernserklæringen og vilkårene kan skrives om. Jeg legger ved noen bilder jeg har funnet på sidene til skipsmeglere. La meg gjerne få en full plan for hva du tenker å gjøre og hvorfor før du går i gang med arbeidet.»

### 10.1 Avgjort

- **V1 = A.** Regelen i `CLAUDE.md` er endret samme dag: ingen ekte firma- eller organisasjonsnavn uten skriftlig avtale, og da bare gjennom sponsordataene i databasen, merket som samarbeid. Alt uten avtale heter etter stedet som før.
- **Personvernerklæringen og vilkårene kan skrives om.** Ordlyden står i 10.5 og bygges i M0, så Jonas ser den før den rulles ut.
- Ingenting annet er bygd. Resten av valgene (10.4) venter.

### 10.2 Det meglersidene lærer oss

Jonas sendte sider fra to meglere: en norsk skipsmegler med rundt 36 båter til salgs (medlem av Norsk Skipsmeglerforbund), og en internasjonal markedsplass med over 6 000 fartøy. Begge er forbilder for bruktmarkedet i M4, og den siste er også et eksempel på hva vi ikke skal gjøre. Firmaene nevnes ikke i spillet; de er bare forbilder her.

| Trekk på meglersidene | Hvorfor det virker | Slik gjør vi det i spillet |
|---|---|---|
| **Hver båt er én oppføring med nummer** («#4078», «Anse-ID 1960») | Én båt, én historie, én side. Nummeret gjør den omtalbar («den der 4078-en»). | Oppføringer med løpenummer per år («DSB-2027-041»), båtnavnet hun har, ikke typen. |
| **Nøkkelfakta-stripa** (Bygget 2003 · 65 m · dypgang 8,1 m) øverst, så detaljene | Tre tall som sier alt på ett blikk, før avsnittene. | Stripa på hvert kort og øverst i databladet: byggeår · lengde · motortimer · pris. Databladets åtte seksjoner beholdes under. |
| **Strukturert spesifikasjon** («Type skrog», «Hovedmotorer», «Timetall», «Kraner», «Instrumenter i rorhus», «Lugarer», «Marsfart / maksfart») | Det er slik kjøperne leser båter. Vårt datablad har alt dette alt (`specSecs`). | Databladet får to nye seksjoner for brukte båter: **Tilstand** (skrog, motor, elektronikk, redskap, med stand i prosent) og **Følger med** (haler, juksamaskiner, garn, VHF). |
| **Lang fritekst i selgerens stemme** («Alle opplysninger er gjort så korrekt som mulig, men uten ansvar for mulige feil og mangler») | Det er mennesker som selger. Forbeholdet er ekte, og det gir grunn til takst. | Hver oppføring får to–tre setninger i selgerens stemme (NPC-skipper, dødsbo, megler) på dialekt, og forbeholdet står. Taksten (M4) finner det forbeholdet skjuler. |
| **Selgerkortet** («Selger: Steve, firma, Kontakt selger, Alle brukerens oppføringer») | Et ansikt og en vei til å spørre. | Selgerkortet med navn og hjemsted (NPC fra B2), «Kontakt selger» åpner ett spørsmål og ett bud (10.4, V9), «Alle hans oppføringer» når en megler har flere. |
| **«Lagt til 11. nov 2021» og «3847 visninger»** | Dato sier hvor lenge den har stått (pris på vei ned), visninger er sosialt bevis. | «Lagt ut for 12 dager siden» og «sett av 31 skippere» fra felles telling (V3 B) eller anslått (V3 A). Prisen går ned 2 % i uka etter tre uker, synlig som «Prisen satt ned». |
| **Prisestimat + mva, «Our offers are standard valid for 30 days», «subject to prior sale»** | Prisen er et utgangspunkt, og båten kan bli solgt før deg. | «Prisantydning» i stedet for «Pris» på brukte båter, bud fra 90 % (V9), og oppføringen forsvinner når en annen (NPC eller spiller) kjøper. Det er den eneste knappheten vi lager, og den er ekte. |
| **GA-tegning til nedlasting** | Fagfolk vil se tegningen. | Sideriss-SVG-en er vår GA. Legg til riss ovenfra (dekksplanen fra kit-festepunktene: kar, stamper, kran) når modellen har det. |
| **Bildegalleri 1/27, også innvendig** | Bilder selger. | Tre–fire faste vinkler fra showroomet (baug, side, akter, dekk) tatt som bilder når oppføringen lages (`G3.showroom` + lerret), slik at kortet har bilde uten at 3D er oppe. Innredning finnes ikke (Jonas 06.10.2026), så ingen innvendige bilder. |
| **Fremhevede oppføringer med krone (betalt plass)** | Markedsplassen tjener på plassering, ikke på reklame. | Et sponsorformat (F6 utvidet): en megler kan kjøpe «fremhevet» på sine oppføringer, merket «Fremhevet · formidlet av X». Høyst to per fane. |
| **Kategorier og filtre** («Snurpenottråler», «Fiskebåt 26 m», land) | Finn det du leter etter. | Fanene (åpen, hjemmel, kyst, hav) beholdes, pluss sortering: nærmest, billigst, nyest, «passer meg» (egenkapital og blad B). |
| **«Forespørsler om ønskede fartøyer»** | Kjøpere som sier hva de vil ha. | «Ønsket båt» (V10): spilleren sier type og pris, og markedet varsler i Rederi når en slik dukker opp. Ingen push. |
| **«Solgte fartøyer»** | Prishistorikk gir trygghet og anker. | «Solgt siste måned» nederst i Båthandel: type, pris, sted, uten kjøpernavn. Gir ærlig ankerpris. |
| **«Tilbud om tidsleie»** | Leie i stedet for kjøp. | Ikke nå. Notert som idé for senere (en sesong med leid båt i lukket gruppe). |
| **Utstyrslistene nevner merker** (vinsjer, radar, ekkolodd, kraner, autopilot med modellnavn og årstall) | Slik er ekte båter beskrevet. Merkene er en del av verdien. | Det er F1: en sponsors haler eller radar står med modellnavn i «Følger med» på en brukt båt. Uten avtale står det «garnhaler», som nå. |
| **«Ekstern annonse. Markedsplassen er ikke selger, megler, agent …», «Tillit og samsvar», «Rapporter oppføring»** | Tydelig hvem som står bak, og en vei å klage. | «Formidlet av X» på meglerens oppføringer, og «Sponsorer»-siden sier at spillet ikke er part i noe ekte salg. Lenken ut er alltid merket. |
| **Det vi ikke tar med:** bannerannonser for kjoler nederst på en trålerside, samtykkebanner for annonser, «No photo available»-plassholdere, titler i store bokstaver over fem linjer | Reklamen er urelatert og ødelegger tilliten; plassholdere ser uferdig ut; store bokstaver leses dårlig. | Ingen tredjepartsannonser (regel). Hver oppføring har alltid bilde (vi lager det selv). Titler er båtnavnet og typen, i vanlig skrift. |

### 10.2b Hvor båter og utstyr kjøpes: Nettet-appen (Jonas 30.10.2026, «ja»)

Jonas: «Hvor tenker du feks man burde kunne kjøpe båter? Jeg tenker kanskje at det kan være en idé at man har en "internett-app" på telefonen der man går inn på skipsmegleren sin side og ser utvalget … Hvordan kan vi gjøre det så intuitivt og realistisk som mulig for brukeren uten å skade spill-opplevelsen.» Forbildet er telefonen i GTA (iFruit med nettleseren Eyefind, der forsiden er annonseruter for spillets egne firmaer).

Regelen i bunnen: **å se og velge skjer på telefonen, hvor som helst; å overta skjer der båten eller varen er.** Det er slik en fisker faktisk kjøper båt (FINN og megleren på telefonen om kvelden, visning der hun ligger, kontrakt og overtakelse der), og det skiller to ting som i dag er blandet i Båthandelen.

- **Nettet-appen** (`ui/phone/15-nettet.js`, ny app i rutenettet, ikon en jordklode): en liten nettleser med bokmerker. Første side er **meglerens** («Kystmegleren» til en avtale finnes): alle oppføringer langs kysten, fanene, sortering, søk, «Ønsket båt», «Solgt siste måned». På hver oppføring: nøkkelfakta, bilder, datablad, selgerkortet, «Kontakt megleren» (spørsmål og bud, V9), «Avtal visning» og «Se hvor hun ligger» (kartplotteren med Autonav dit). Alt kan leses hvor som helst, også om bord. Appen virker overalt; ingen dekningsregel (det ville vært friksjon som ikke gir spilleren noe).
- **Andre sider** kommer etter hvert, hver som et bokmerke: **nettbutikken** for utstyr (V12), verftets side med nybygg, og sponsorenes egne sider (F8 blir først en side i spillet, så en merket lenke ut). Forsiden i appen er bokmerkene, og med avtale får en samarbeidspartner en rute der, slik Eyefind har. Uten avtale står bare spillets egne sider.
- **Der båten ligger:** hver oppføring ligger ved en kai, i første runde et verft (liggeplassene `UNIT_Y` og kjøpslogikken finnes der), senere selgerens hjemhavn. Spilleren seiler dit, ser henne i 3D ved kaia, tar prøvetur og takst, og først der står «Kjøp». Regelen i `docs/handelssteder.md` (båter handles på verftet) står, presisert til «der båten ligger». Innbyttebåten leveres samme sted; bank og hjemmel ordnes i samme skuff som i dag.
- **Levering:** «Få henne levert» for spillpenger etter avstand: en NPC-skipper seiler båten til hjemhavna (som slep, `10o-ptow.js`-mønsteret), og den kommer etter seilingstida. En ærlig snarvei som koster spillpenger, aldri 💎.
- **Verftets knapp «Båthandel»** blir «Båter til salgs her» (bare de som ligger ved denne kaia) pluss «Selg» og «Legg ut hos megleren» for egen båt. Nybygg bestilles på verftets side i Nettet og hentes på verftet som i dag.
- **Visningsturen er innhold:** en lang tur for å se på en båt er nettopp innholdet `docs/engasjement.md` sier skal legges der betalingen (trim) blir fristende av seg selv, og turen er verdt å ta uten.
- **Utstyret, samme tanke (V12):** nettbutikken i Nettet viser hele utvalget med varekortet (M1) hvor som helst. «Bestill til henting i X utstyrsbutikk» legger varen klar, og den overtas og monteres når båten ligger der. Klikk og hent, som i virkeligheten; regelen om tre handelssteder står fordi varen overtas i butikken. Punktet i `docs/handelssteder.md` «Å fylle på» (telefonen kan ikke kjøpe fysiske ting borte fra stedet) presiseres: den kan bestille, ikke overta.
- **Én liste, to vinduer:** oppføringene finnes ett sted (`core/09k-market.js`), og både Nettet-appen og kaia leser den samme lista. Appen er ikke en ny meny oppå den gamle.
- **Appene på telefonen:** 18 i dag. Nettet kommer som den 19.; om Salgslaget og Fiskeguide senere skal bli sider i Nettet, er et eget valg (ikke nå).

### 10.3 Øktene, i rekkefølge, med hvorfor

Hver økt leser denne fila og systemdokumentet, bygger, oppdaterer status nederst og avslutter med `/lever` og `/okt-slutt`. Rekkefølgen: først det som bare er dokumenter og juss (M0), så det spillerne merker (M1–M5), så sponsor-grunnmuren (M6–M7), så formatene (M8) og salgsmateriellet (M9). M1 og M6 kan gå parallelt (ulike filer).

| Økt | Hva | Hvorfor nå | Filer | Tester | Måles |
|---|---|---|---|---|---|
| **M0 Reglene og vilkårene** | `docs/engasjement.md` «Det vi ikke gjør» presiseres (ingen belønnings- eller avbrytende reklame; sponsede varer og skilt etter planen er tillatt). `src/legal/personvern.html` og `vilkar.html` får avsnittene i 10.5. `kilder.html` får «Samarbeidspartnere» (tom til første avtale). `docs/handelssteder.md` får bruktmarkedet og sponsorformatene som regel. | Juss før kode. Jonas godkjenner ordlyden før den rulles ut (sidene bygges med `src/`, så en push ruller dem ut). | `docs/`, `src/legal/` | ingen (tekst) | – |
| **M1 Varekortet** | Ett varekort (3.1) for utstyr, redskap, klær, is og agn: bilde, én linje med tall, pris med anker, stand, én knapp med bekreftelse i knappen, «Mer» til Håndboka. Bildene lages av modellene (`vesselSVG`-mønsteret for `EQUIP`, ellers kontrollbilder). Leksikonteksten flyttes til Håndboka. «Prisene er foreløpige» bort. | Alt senere (sponsormerket, bruktmarkedets «Følger med») bruker kortet. | `ui/phone/12-utstyr-redskap.js`, `01-haill-fiske-service.js`, `02-havn-last-agn-ordre.js`, `07c-handbook.js`, `styles.css`, `tools/gear/pic.py` (nytt) | `shoptest`, `stedertest`, `caretest`, `icestep`, ny `shopuitest` (begge formater) | kjøp per butikkbesøk (`shop_view`, `shop_buy` i `tm_batch`) |
| **M2 Butikken på ny og Nettet-appen** | Nettet-appen (`ui/phone/15-nettet.js`) med bokmerkeforsiden og **nettbutikken** (V12): hele utvalget med varekortet hvor som helst, «Bestill til henting i X», varen overtas og monteres i butikken (`S.orders` per butikk, `buyGate` som før). Butikken på kaia: tre faner (Redskap, Elektronikk, Haler og dekk), «Til «Idamor»» først, Innkjøpslista og det som er bestilt til henting øverst, Service som fane under Beholdning › Redskap, kjøpmannen med navn, dialekt og én linje. Vifta i knappelinja får to knapper (Butikk, Service borte). | Det spillerne ser hver dag, og appen meglerens side skal inn i (M4). | `ui/phone/00-shell.js` (appen i rutenettet), `15-nettet.js` (ny, inn i malen), `ui/10c-dock.js`, `ui/phone/12-…`, `01-…`, `core/10-gear.js` (bestilling til henting), `core/09d-folk.js` (kjøpmannen) | `docktest`, `stedertest`, `caretest`, `shoptest`, `shopuitest`, ny `nettest` (bestill hvor som helst, overta bare i butikken, begge formater) | tid fra butikk åpnet til kjøp; andel kjøp bestilt på forhånd |
| **M3 Prøv før du kjøper** | Utstyr vist på egen båt i 3D før kjøpet (halere, juksamaskin, radar, krabbekar) med `paintView`-kameraet; kjøpsøyeblikket for utstyr (heises om bord fra kaia med kranen eller bæres, 10 s). | Eierskapseffekten, og modellene finnes alt. | `ui/10j-paint.js` (kameraet gjenbrukes), `view3d/10-gear.js`, `view3d/22-docks-air.js` | `maletest`, ny `trytest` (3D), `deckshot` | andel som prøver før kjøp |
| **M4 Bruktmarkedet i Nettet-appen** | Meglerens side i Nettet (10.2b): oppføringer etter 10.2 med nummer, navn, nøkkelfakta-stripa, bilder fra showroomet, Tilstand og Følger med, selgerkortet med fritekst, «Lagt ut for», «sett av», prisantydning som synker, sortering, «Ønsket båt» (V10), «Kontakt megleren» med bud (V9), «Avtal visning», «Se hvor hun ligger» (Autonav). Oppføringene ligger ved verft; der: båten i 3D ved kaia, prøvetur, takst (første gratis), «Kjøp», «Få henne levert». Verftets knapp blir «Båter til salgs her» med «Selg» og «Legg ut hos megleren» (kommisjon). «Solgt siste måned». Faste tilbud (nybygg, hjemmelstilbudene) beholdes på verftets side i Nettet. «Neste mål» på kortet. | Den største endringen for spillerne, og plassen megleren skal inn på. | `core/09k-market.js` (nytt), `ui/phone/15-nettet.js`, `10-fartoy.js`, `ui/10c-dock.js`, `core/05-vessels.js` (`vesselValue`), `core/07e-havn.js` (liggeplass for oppføringene), `supabase/migrations/…_listings.sql` (V3 B) | `fleet2test`, `vesseltest`, `stedertest`, ny `markettest` (ukas oppføringer like på to enheter, kjøp bare der hun ligger, levering, takst, bud, kommisjon, solgt-lista), `cloudtest` (V3 B) | tid fra «Neste mål» til kjøp, andel med visning og takst, andel levert mot hentet, angrede kjøp |
| **M5 Kjøpsøyeblikket for båt** | Om bord ved verftets kai i 3D, navnet males, flagget går opp, innbyttebåten blir liggende med «Til salgs» og kommer igjen i markedet med nytt navn (B2). 15 s, kan hoppes over. | Toppen og slutten av kjøpet. | `view3d/23-camera-frame.js`, `24-cinema.js`, `ui/10j-paint.js`, `core/09k-market.js` | `yardtest`, `kinotest`, `markettest` | – |
| **M6 Sponsor-grunnmuren** | Tabellene `sponsors` og `sponsor_placements`, `sp_now()`, admin-fanen «Sponsorer» (legg til, slå av, forhåndsvis), `core/09j-sponsor.js`, varemerket på varekortet (F1) med samme tall som det generiske (V5), lenke ut merket og i ny fane (F8), «Sponsorer» i Håndboka og på kildesiden, testsponsoren «Nordlys Utstyr» bare i testdata. | Grunnmuren alle formatene står på. En ny avtale er en rad i admin, ingen utrulling. | `supabase/migrations/…_sponsors.sql`, `src/admin/index.html`, `core/09j-sponsor.js` (nytt), `ui/10q-sponsor.js` (nytt), `ui/phone/12-…`, `07c-handbook.js` | `sqltest`, `admintest`, ny `sponsortest` (uten avtale ingen merker; merket og generisk like tall; lenken merket) | – |
| **M7 Skilt og måling** | `anchors.sign` på butikken (`shop_sign`, `board`, `gable_board` finnes som bokser i `butikk.py`) og verftet (`steder.py y`), teksturen som rederilogoen (`logo_put`-mønsteret, 256 × 256 WebP), målingen per IAB (areal, vinkel, tid, ikke når siden er skjult), `sp_view` i `tm_batch`, admin-rapporten med CSV. | Det er dokumentasjonen vi selger på. | `tools/harbour/butikk.py`, `steder.py` (`/blender`), `view3d/06-buildings-lights.js`, `view3d/17-draw.js`, `ui/10f-cloud.js`, `supabase/migrations/…_sp_view.sql`, admin | ny `signshot` (3D), `sponsortest`, `cloudtest` | synlige visninger og sekunder per plassering |
| **M8 Resten av formatene** | Kystposten-annonse (F4, sakstypen `annonse` i `PRESS_KINDS`, merket), Garderoben og Malerverkstedet (F5), sponsede hendelser (F3, feltet `sponsor` i `season_ev`), gaver (F7), meglerens oppføringer (F6) med «fremhevet» og import fra CSV (`tools/broker/import.py`). | Når grunnmuren og markedet står. | `core/09h-press.js`, `ui/10g-wardrobe.js`, `core/09i-look.js`, `ui/10j-paint.js`, `core/09c-seasons.js`, `core/09f-merker.js`, `core/09k-market.js`, `tools/broker/` | `presstest`, `wardtest`, `maletest`, `eventtest`, `markettest`, `sponsortest` | klikk ut per format |
| **M9 Mediekortet og demobygget** | Mediekortet fra admin (spillere, økter, hjemhavner per fylke, flåten, bilder), demobygget med testsponsoren (`KYST_DEMO=1 node build.mjs`), ett dokument Jonas kan sende. | Det Jonas trenger for å ringe. | admin, `build.mjs`, `docs/sponsor/mediekort.md` | `admintest`, `boottest` | – |

### 10.4 Valgene som står igjen

V1 er avgjort (A). V2–V8 står som i del 7, og to nye kom av meglersidene:

9. **V9 Bud og forhandling i bruktmarkedet.** A: «Kontakt selger» gir ett bud per oppføring per dag, fra 90 % av prisantydningen; selgeren svarer etter hvor lenge båten har stått og hvor mange som har sett den (anbefalt: det er slik båter kjøpes, og det er en liten ferdighet). B: fast pris, som i dag. C: bud også mellom spillere (krever V3 B og moderering; senere).
10. **V10 «Ønsket båt».** A: spilleren legger inn type og pris, og Rederi-appen varsler når en slik kommer, ingen push (anbefalt: det gir en grunn til å åpne spillet uten å mase). B: ikke nå.

11. **V11 Nettet-appen** (10.2b). A: ny app med meglerens side først, oppføringene ved verft, kjøp bare der båten ligger, levering for spillpenger (anbefalt, og Jonas sa «ja» 30.10.2026 til å ta det inn i planen). B: Båthandelen i skuffen som i dag, bare som bruktmarked. 
12. **V12 Henting i butikk.** A: nettbutikken i Nettet med «Bestill til henting i X», varen overtas i butikken (anbefalt: klikk og hent, og regelen om tre handelssteder står). B: utstyr velges og kjøpes bare i butikken som i dag.

Svar gjerne som før: «2A, 3A, 4A, 5A, 6A, 7A, 8A, 9A, 10A, 11A, 12A, kjør på», eller det du vil ha annerledes.

### 10.5 Ordlyden i reglene og vilkårene (bygges i M0, Jonas godkjenner)

- **`docs/engasjement.md`, «Det vi ikke gjør», linja «Reklame for belønning. Ingen reklame i spillet.»** blir: «Reklame for belønning, videoreklame, avbrytende bannere og tredjeparts annonsenettverk. Sponsede varer, skilt, hendelser, klær og meglerens oppføringer etter `docs/planer/butikker-og-sponsorer.md` er tillatt: alltid merket, aldri med spillfordel, aldri på sjøen, i kartplotteren, i HUD eller i push.»
- **`src/legal/personvern.html`, linja «Vi viser ikke reklame, sporer deg ikke for reklame og selger ikke opplysninger til noen.»** blir: «Spillet kan vise sponsede varer, skilt og annonser fra navngitte samarbeidspartnere, merket som samarbeid eller annonse. Vi måler hvor lenge slike skilt er synlige på skjermen, samlet for alle spillere og uten å dele hvem du er. Ingen samarbeidspartner får opplysninger om deg, og vi bruker ingen annonsenettverk, informasjonskapsler eller sporing fra andre.» Avsnittet om lagring (ekomloven § 3-15) står. Under «Hva vi lagrer» kommer «hvor lenge sponsede skilt var synlige i økta (bare når du deler statistikk)».
- **`src/legal/vilkar.html`, nytt punkt «Samarbeidspartnere»:** «Noen varer, skilt, hendelser og oppføringer i spillet er sponset av navngitte samarbeidspartnere og er merket som det. En sponset vare virker aldri bedre i spillet enn den usponsede. Lenker til en samarbeidspartners egne sider åpner utenfor spillet og er merket. Det Store Blå er ikke part i noe kjøp, salg eller avtale du gjør med en samarbeidspartner utenfor spillet.»
- **`src/legal/kilder.html`:** avsnittet «Samarbeidspartnere» med lista (tom: «Ingen ennå.»).
- **`docs/handelssteder.md`:** bruktmarkedet som regel under Verftet («båter overtas der de ligger»), «Nettet-appen: se og bestille hvor som helst, overta bare på stedet», og «Sponsede varer» med regelen om like tall.

### 10.6 Antatt og usikkert

- Tersklene i målingen (1,5 % av skjermen, 55°, 1 s) er anslag til den fulle IAB-teksten er lest. Vi selger ikke på tallene før det.
- Forbrukertilsynet har ingen veiledning for produktplassering i spill; vi følger mfl. § 3 og merker alt. Første avtale sees av advokat (Jonas).
- Konkurranseregler for ekte premier (F3) er ikke sjekket.
- Bruktmarkedets priser (±15 %, 2 % ned i uka etter tre uker, bud fra 90 %) er startverdier for spilltesting.
- Bildene fra showroomet forutsetter at `G3.showroom` kan tegne til et lerret uten at spilleren ser det; må prøves i M4, ellers brukes sideriss-SVG-en alene.
- Meglerens CSV-format er ukjent til første megler finnes; importen bygges for lengde, byggeår, skrogmateriale, pris og lenke, som alle meglersidene viser.

### 10.7 Det planen ikke gjør

- Tidsleie av båt, bud mellom spillere, og ekte båter som egne 3D-modeller (en meglers båt vises som nærmeste spilltype).
- Ingen endring i Kaiboden, haill, trim eller Skippertak.
- Ingen patchnotes om sponsing, priser eller psykologi. Patchnotes for M1–M5 sier bare hva butikkene og markedet gjør nytt.

## Status

- 30.10.2026: planen skrevet (del 1–9), gjennomføringsplanen med meglersidenes lærdommer (del 10), Nettet-appen (10.2b). Jonas: V1 = A (regelen endret samme dag), og «kjør» 30.10.2026 til hele lista: **V2–V12 = A** (alle formatene; bruktmarkedet lokalt og deterministisk først; takst og prøvetur; sponset vare har samme tall; byttehandel først; sponsede plagg gratis; én annonse per Kystposten-utgave; bud fra 90 %; «Ønsket båt»; Nettet-appen; henting i butikk).
- 30.10.2026: **M0 gjort** (gren `claude/marketplace-sponsor-integration-cacyur`): `CLAUDE.md` (ekte navn bare med avtale; reklameregelen presisert), `docs/engasjement.md` («Det vi ikke gjør»), `docs/handelssteder.md` (Nettet-appen, bruktmarkedet, sponsede varer), `docs/systemer/handel-og-steder.md`, `src/legal/personvern.html` (kortversjonen, nytt kort «Sponsede skilt og varer», avsnittet om lagring), `src/legal/vilkar.html` («Samarbeidspartnere» under 3), `src/legal/kilder.html` («Samarbeidspartnere: Ingen ennå.»). Bygget går; `cloudtest` sjekker bare at sidene finnes, så den ble ikke kjørt. Sidene rulles ut når grenen flettes inn i arbeidsgrenen; utkastbanneret på sidene står til Jonas godkjenner. Neste: M1 (varekortet).
- 30.10.2026: **M1 gjort** (samme gren): `ui/05a-itemcard.js` med kortet, bildene i SVG, linjene i tall fra kjernen og ankrene; Fiskeutstyr, Elektronikk og haler (med klærne), verftets utstyr, Is og Agn bruker det; Håndboka har kapittel 8 «Utstyr og redskap» med leksikonteksten, og «Mer om …» åpner én oppføring; bekreftelsen står i knappen og faller tilbake etter 4 s; «Prisene er foreløpige» er borte. Avvik fra planen: bildene er tegnet som SVG i stedet for kontrollbilder fra Blender (raskere, ingen filer; kan byttes senere), og utstyr, redskap og klær kjøpes fortsatt med ett trykk (bare juksa, kveiteutstyr og is bekrefter), fordi åtte tester trykker én gang; to trykk på dyrt utstyr tas i M2 sammen med de testene. Målingen `shop_view`/`shop_buy` er ikke lagt inn (M2). Testet: `itemcardtest` (20 OK, begge formater), `shoptest`, `geartest`, `docktest`, `fixtest`, `fleet3test`, `uishots`, `icestep`, `hbtest` grønne. Neste: M2 (butikken på ny og Nettet-appen).
- 30.10.2026: **M2 gjort** (samme gren): Nettet-appen med nettbutikken og bestilling til henting (`core/10c-pick.js`, `ui/phone/13b-nettet.js`), butikken på kaia med kjøpmann, det som er bestilt dit og det båten trenger nå, «Til båten» først, «Om bord» samlet og «Passer ikke» lukket, Service under Beholdning › Redskap, to trykk på utstyr fra 10 000 kr, og målingen `shop_view`, `shop_buy`, `shop_order`. Avvik fra planen: to faner i butikken i stedet for tre (Redskap og Elektronikk og haler; halerne står først på den siste), og betalingen skjer ved henting, ikke ved bestilling (da gjelder samme kjøp og samme regel som over disken, og ingenting må betales tilbake ved avbestilling). Systemdokumentet `handel-og-steder.md` har detaljene. Neste: M3 (prøv før du kjøper).

## Kilder

- IAB, Intrinsic In-Game Measurement Guidelines (2009, 2.0 2022): https://www.iab.com/blog/intrinsic-in-game-measurement-guidelines/ og https://www.iab.com/blog/first-update-to-intrinsic-in-game-standards-released-since-2009/
- IAB, Gaming Measurement Framework (juni 2025): https://www.iab.com/wp-content/uploads/2025/06/IAB_Gaming_Measurement_Framework_June_2025.pdf
- IAB, Creative Guidelines and Best Practices for Advertising in Gaming (mars 2024): https://www.iab.com/wp-content/uploads/2024/03/IAB_Creative_Guidelines_Best_Practices_Advertising_Gaming_March_2024.pdf
- Farming Simulator og produsentene: https://gameworldobserver.com/2023/03/27/farming-simulator-tractor-manufacturers-giants-software og https://guardian.pressreader.com/article/281797108245988
- Corteva som sponsor av Farming Simulator League: https://www.corteva.com/news/corteva-agriscience-sponsors-farming-simulator-video-game-and-competition.html
- Volvo CE og Giants Software: https://www.gamedeveloper.com/press-release/giants-software-announces-brand-partnership-with-volvo-construction-equipment
- Kulturdepartementets høring om produktplassering utenfor kringkasting (2023): https://forbrukertilsynet.no/wp-content/uploads/2023/01/vedlegg-1-kulturdepartementets-horing-av-eu-kommisjonens-forslag-til-endringer.pdf
- Forbrukertilsynets veileder om merking av reklame i sosiale medier: https://www.dataguidance.com/sites/default/files/forbrukertilsynets-veileder-om-merking-av-reklame-i-sosiale-medier.pdf
- Medietilsynets hurtigguide om merking av kommersielt innhold: https://www.medietilsynet.no/globalassets/dokumenter/veiledere/190318-yt-veileder-quickguide-merking-kommersielt-innhold.pdf
- Leverandører til kystflåten (bare som kandidater, ikke kontaktet): https://www.1881.no/emneknagger/fiskeredskap, https://www.finn.no/butikk/froystad, https://www.1881.no/emneknagger/salg-av-baat
- Psykologien: `docs/research/oppdragsdesign-psykologi.md` (SDT, flow, endowed progress, dark patterns) og de klassiske arbeidene nevnt i tabellen i del 2 (Kahneman, Knetsch og Thaler 1990; Tversky og Kahneman 1974; Nunes og Drèze 2006; Ariely 2008; Cialdini 1984; Thaler og Sunstein 2008). Tallene i del 4.3 og tersklene i 4.4 er anslag.
