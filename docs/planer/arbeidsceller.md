# Arbeidscellene: faste mål per stasjon på dekk (forslag til eget steg etter steg 125)

**Status: forslag, ikke planlagt og ikke bygd.** Jonas 14.11.2026, i femte økt av steg 125: «kan du huske dette som noe vi burde jobbe med etter steg 125». Steget begynner med `/planlegg` (valgene under er hans), og ikke før steg 125 er levert. Raden står i `docs/planer/koen.md` som 125b.

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

## Valgene som må tas før det bygges (Jonas)

- A/B: færre samtidige stasjoner på de minste dekkene, eller trangere celler der.
- Om cellene legges i modellenes ankere (Blender-skriptene, alle båttypene) eller regnes av `places()` i `deckcrew.js` fra ankerne som finnes.
- Hvilke celletyper som er med i første runde.

## Tallene steget kan begynne fra

Tabellen «Alle handlingene» i 5.33d i `docs/systemer/folk-om-bord.md`: radene med andres ting i en kropp og de plassbundne handlingene (`gutw`, `pack`, `bleed`, `gaff`, `egn`) er de cellene skal få til null uten søk per båt. `node tests/unit/run.mjs arbeidsplass` skriver plassene på åtte båttyper.
