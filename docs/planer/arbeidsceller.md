# Arbeidscellene: faste mål per stasjon på dekk (forslag til eget steg etter steg 125)

**Status: valgt og startet 14.11.2026 (se «Valgt 14.11.2026» under; det som står over valgene, er forslaget slik det var, og faste cellemål er IKKE valgt).** Jonas 14.11.2026, i femte økt av steg 125: «kan du huske dette som noe vi burde jobbe med etter steg 125». Steget begynner med `/planlegg` (valgene under er hans), og ikke før steg 125 er levert. Raden står i `docs/planer/koen.md` som 125b.

## Spørsmålet og svaret (14.11.2026, fjerde økt)

Jonas: «Burde vi i større grad standardisere hvordan arbeidsstasjonene ombord i båten er plassert? Ville det gjort animasjonene lettere? Gi meg dine tanker uten at du starter å jobbe med det».

Svaret: ja, som eget steg etter at steg 125 er levert.

**Det som ble sett i fjerde økt:**
- Høttingen og bløggingen var ikke først og fremst et animasjonsproblem, men et plassproblem. Pakkerens plass kommer fra hver modells egne ankere, mens bløggerens plass ble regnet ut fra haleren uten å se på pakkeren. På fem av åtte båttyper sto de 16–40 cm fra hverandre.
- Det ble løst med en søker som leter etter en ledig celle på hvert dekk. Den virker på nysjarken, hurtigsjarken og 21-meteren, men på sjarken og breisjarken finnes det ingen plass med nok rom, fordi iskassa og pakkeren står der de står i modellen.
- Hver stilling må i dag tåle at karet kan stå hvor som helst rundt mannen (bak, til høyre, 0,5–1,2 m unna). Derfor måtte høttetaket bygges om til å snu seg opptil 130°.

**Det femte økt la til (samme mønster, tre ganger til):**
- To sløyere ved samme bord arbeidet begge mot bordets midtpunkt: hendene 37 cm fra, kniven og sloet 8–14 cm i sidemannen. Rettet i stillingen (hver sin del av bordet etter bordets lengde), men fisken fra karet går fortsatt 6–13 cm gjennom sidemannen på vei til bordkanten.
- Sløyerens kar sto bak ham til høyre på noen båter, så venstre hånd var 17–27 cm for kort. Rettet ved at hånda på karets side henter.
- Egnerens agnbøtte sto på dekket bak setet, 31 cm utenfor rekkevidde. Rettet ved å sette den på en kasse ved kneet.
- Bløggerens fisk lå opptil 0,9 m til siden for ham. Rettet ved at han snur seg mot den.
Hver av dem er en stilling som regner seg fram til et mål som står et tilfeldig sted. Med celler ville målet stått fast.

**Hva standardisering ville gitt:**
- Én arbeidscelle per stasjon i stedet for ett punkt. I dag er en stasjon «her står han, den veien ser han». En celle sier også hvor det han arbeider mot står i hans egen ramme: karet 0,6 m til høyre, fisken slippes 0,5 m bak til venstre, iskassa på venstre side, kassa foran.
- Animasjonene skrives én gang mot faste mål. Høttetaket, spadens runde og sløyerens henting kan finjusteres til de ser riktige ut, og ser så like ut på alle båter.
- Ingenting i kroppen blir en egenskap ved cella, ikke noe som må måles per båt og per øyeblikk. Cellene får et fotavtrykk (for eksempel 1,0 × 1,2 m med svingrom), og to celler får ikke overlappe.
- Gangveiene legges mellom cellene, så den som bærer kassa ikke går gjennom noen.

**Hva det koster, og hvor grensa går:**
- Arbeid i Blender-skriptene og ankerne for hver båtmodell: stasjonene må flyttes så cellene får plass.
- De minste dekkene har ikke plass til fire fulle celler. Der er det ærlige svaret trolig færre samtidige stasjoner (på sjarken bløgger haleren selv, og én mann sløyer og iser), ikke trangere celler. Det er et valg om spillet, og det er Jonas'.
- Båtene skal fortsatt se ulike ut: cellens indre mål standardiseres (mannen og det han rekker), ikke hvor på dekket cella ligger.

**Foreslått rekkefølge:** (1) fire–fem celletyper med mål (haler, bløgger, sløyer, pakker, egner); (2) inn i ankerne båt for båt; (3) stillingene forenkles til å lese cellens mål. Stillingene som er rettet i steg 125, leser allerede målene sine fra ett sted (`HOLDT`, `BLEED` i `src/js/deckcrew.js`) og taper ikke på det.

## Valgt 14.11.2026 (Jonas, etter samtalen med Gemini; «Ja, jeg er enig»)

- **Ikke standardiserte stasjoner.** Jonas: «Jeg ønsker jo i utgangspunktet ikke at det skal være standardiserte arbeidsstasjoner ombord i båtene, da jeg vil ha litt variasjon for realismens del.» Ingen faste avstander mellom utstyret, og ingenting flyttes i modellene.
- **Arbeidssonen i stedet:** de faste tingene (haleren, bordet, karet, iskassa, luka) leses der de står på hver båt. **Mannens ståplass regnes ut fra tingene**, så det han arbeider med, ligger i en romslig sone foran ham (innen rekkevidde, uten å vri seg rundt). De løse tingene (fiskekassa, agnbøtta, isbaljen ved siden av ham, stedet fisken slippes) settes ut av koden i forhold til ham. Fotavtrykkene overlapper ikke.
- **Færre stasjoner på små dekk**, ikke trangere soner. De uten stasjon er inne; på åpne båter vises ikke flere på dekk enn det er stasjoner til. Fangsten endres ikke (figurene er utsikt).
- **Ankerne og gripepunktene i koden**, ikke i Blender.
- **Der ingen ståplass har alt i sonen,** er valget Jonas': slå sammen stasjoner, eller flytte en ting i modellen. Økta velger ikke selv.
- **Rekkefølgen:** (1) en test i Node som for hver båttype og stasjon sier om tingene ligger i sonen, og lister dem som ikke gjør det; lista vises Jonas før stillingene røres om mange faller utenfor; (2) stillingene leser gripepunktene; (3) banen rundt kroppen (én regel i stedet for lappene fra sjette økt). Første runde: haler, bløgger, sløyer, pakker, egner. Pausene, kaia, håndbåten og gangen røres ikke.
- **Rammene:** reglene i `CLAUDE.md` («Animasjon stemmes ikke i det uendelige», bildeklipp). **Høyst to økter**, så utrulling til testadressen og Jonas avgjør på nettbrettet.

## Sonetesten, første kjøring (14.11.2026): stoppet her, lista til Jonas

`node tests/unit/run.mjs arbeidssone` (ny, `tests/unit/arbeidssone.test.mjs`; uten nettleser, samme svar hver gang) leser plassene og tingene på hver båttype og sier om det mannen arbeider med, ligger i sonen foran ham (holder: 0,3–0,75 m og 60° til hver side; henter eller kaster: inntil 1,05 m og 110°). **52 av 93 ting ligger utenfor, på 37 av 52 stasjoner, og mønsteret er det samme på alle åtte kystbåtene:**

- **Sløyeren og bløggekaret:** karet står 1,4–4,1 m fra sløyeren, bak ham eller på den andre sida av dekket (sjarken 2,3 m, nysjarken 4,1 m, 21-meteren 1,9 m; bare snekka har det nær, 0,5 m, men rett bak ham). Stillingen i dag strekker hånda en halv meter i karets retning og tar en fisk ut av lufta. Det kan ingen stilling rette: det er ikke en bevegelse som finnes.
- **Sløyeren og pakkerens kasse:** 1,2–4,0 m unna og bak ham. Den sløyde fisken kastes dit i dag.
- **Bløggeren og karet:** 1,3–1,7 m (kastet), i retning 14–53° (foran ham: det er greit som kast, men lenger enn sonen).
- **Haleren og stedet fisken slippes:** 0,45–0,8 m rett bak ham (120–160°). Derfor snur han seg 130° i høttetaket.
- **Pakkeren og iskassa:** i sonen der den finnes; på snekka 1,5 m.
- Innenfor på alle: haleren ved haleren, sløyeren ved bordet (utenom autolineren og ringnota), bløggeren ved fisken.
- Havbåtene (snøkrabbe, trålerne, ringnot) har karet 6–16 m fra plassene: de har fabrikk og er ikke med i første runde.

**Dette er et valg om spillet, ikke om animasjon (Jonas):** hva tar sløyeren fisken fra, og hvor legger han den? Se meldingen til Jonas 14.11.2026 og svaret hans her når det kommer. Stillingene er ikke rørt.

**Klippene:** `tests/folk2klipp.py` er skrevet. Første forsøk med hele dekket ga 53 s per bilde (40 min for ett klipp), kameraet sto ikke på sløyeren, og HUD-en og sjøen var ikke skrudd av. Ikke sendt til Gemini. Det hvite rommet (12 s per bilde) virker, men viser ikke bordet og karet.

## Valgene som må tas før det bygges (Jonas)

- A/B: færre samtidige stasjoner på de minste dekkene, eller trangere celler der.
- Om cellene legges i modellenes ankere (Blender-skriptene, alle båttypene) eller regnes av `places()` i `deckcrew.js` fra ankerne som finnes.
- Hvilke celletyper som er med i første runde.

## Tallene steget kan begynne fra

Tabellen «Alle handlingene» i 5.33d i `docs/systemer/folk-om-bord.md`: radene med andres ting i en kropp og de plassbundne handlingene (`gutw`, `pack`, `bleed`, `gaff`, `egn`) er de cellene skal få til null uten søk per båt. `node tests/unit/run.mjs arbeidsplass` skriver plassene på åtte båttyper.
