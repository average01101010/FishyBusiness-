# Handlingene mannskapet gjør: lista for IK og prosedyrestyrt bevegelse

Jonas 14.11.2026: «Lag så en liste over alle handlingene mannskapet gjør på båtene som vi må animere med inverse kinematics og procedural animation.» Lista er hentet fra koden slik den er i dag (`switch (st.task)` i `drawWorker`, `view3d/08-plants.js`; `workLow`; hendelsene i `DKDUR`; `handSpecs` i `view3d/09-landing-deck.js`), ikke fra hukommelsen: 50 stillinger og fire hendelser med fisk. Reglene for hvordan de bygges, står i «Arkitekturen for bevegelsen» i `docs/planer/folk-2.md`; tallene i 5.33d i `docs/systemer/folk-om-bord.md`.

**Slik leses lista.** «Navn» er oppgavens navn i koden. «Holder» er tingen som må eie grepet (regel 7). «Trenger» er det bevegelsen krever utover to-ledds IK for armene, som alle har. «Står» er hvor den er i dag med `#folk2`, målt eller sett 14.11.2026:

- **sett** = sett av økta på bilde i det hvite rommet eller i spillet, og ser riktig ut
- **målt** = hendene innen 2 cm og ingenting i kroppen i `folk2deck` eller `folk2diag`, men ikke sett på bilde
- **avvik** = et kjent avvik, skrevet ut
- **urørt** = går som den gamle figuren gjorde, ikke gjennomgått med den nye kroppen

Ingen av dem er ferdige i den forstand at Jonas har sett dem og sagt ja.

## 1. Fisket: redskapet over rekka

| Handling | Navn | Holder | Trenger | Står |
|---|---|---|---|---|
| Haler line eller garn ved haleren | `haul` | spaken, lina | begge hender på lina hånd over hånd, ryggen bøyd over rekka, føtter plantet mot draget | målt (1,9 cm) |
| Høtter fisken inn over rekka | `gaff` + hendelse | høtten (90 cm), fisken på den | høtten eier linja, dreies om spissen, overkroppen ut over rekka, vekta i kroppen når fisken løftes | avvik: 5 cm fra grepet med fisk; halerens høtte går 17 cm gjennom bløggeren ved siden av |
| Tar fisk av garnet | `pick` + hendelse | garnet, fisken | fingrene i maskene, fisken vris løs, løftes og slippes | målt (0 cm), ikke sett |
| Jukser for hånd, napper i snøret | `jig` | snøret | den ene hånda napper, den andre fører ved rekka; snøret følger begge | rettet 14.11 (snøret gikk fra feil hånd), ikke sett etterpå |
| Drar opp juksafisken hånd over hånd | `jigup` hendelse | snøret, fisken | hånd over hånd, løft inn over rekka | urørt |
| Setter line eller garn | `sett` | bruket | hånd over hånd utover, like innenfor der det går ut | avvik i sveipet: 6–13 cm utenfor rekkevidde |
| Teinemannen og krabbesortereren | `tend` | teina, krabben | hendene lavt foran, sortering | urørt |
| Ser over redskapet | `gear` | bruket | hendene lavt, snur det | urørt |
| Fisken som glipper | `slip` hendelse | ingenting | griper etter den mot rekka, hånda til lua etterpå | urørt |

## 2. Fisken om bord

| Handling | Navn | Holder | Trenger | Står |
|---|---|---|---|---|
| Bløgger en juksafisk | `bleed` hendelse | kniven, fisken | tar den av ved rekka, løfter etter hodet, snitt i strupen, ned i karet; ned til dekket når den ligger der (knærne) | avvik: 8 cm (høyre hånd) |
| Bløggeren mellom fiskene | `bleedst` | kniven | klar, kniven lavt | målt (2–3 cm) |
| Sløyer ved bordet | `gutw` | kniven, fisken, sloet | henter fisk i bløggekaret (overkroppen vris), hodet mot bordkanten, buken åpnes, sloet kastes | avvik: 17 cm i ett øyeblikk som ikke er funnet (før 39) |
| Sløyer uten bord | `gut` | kniven, fisken | som over, stående fritt | urørt |
| Pakker og iser | `pack` | spaden, fisken | fisken legges rett med begge hender; spaden svinges fra isen til kassa, overkroppen følger | målt (1,5 cm); avvik: bladet 3–4 cm i leggen |
| Iser | `ice` | spaden | som spaden over, fra isbingen | avvik i sveipet: 10 cm utenfor rekkevidde |
| Bærer en full kasse til luka | `carry` | fiskekassa | hendene under bunnen, kassa mot magen, lent bakover, gangen med last | sett (Jonas' bilder som forbilde) |
| Senker kassa i rommet | `stow` | fiskekassa | knærne bøyes, kassa ned gjennom luka | avvik i sveipet: 5 cm i kroppen |
| Stabler kasser | `stack` | fiskekassa | løft fra dekk til bryst med knærne | avvik i sveipet: 6 cm i kroppen |
| Kutter seg | `cut` hendelse | kniven | venstre hånd opp og ristes, kniven holdt lavt unna | urørt |

## 3. Bruket mellom trekkene

| Handling | Navn | Holder | Trenger | Står |
|---|---|---|---|---|
| Egner line | `egn` | kroken, agnet | sittende; krok fra stampen, agn fra bøtta, på kroken, ned i stampen | avvik i sveipet: 6–14 cm; agnbitene 5–8 cm i kroppen (bøtta ved siden av) |
| Tar av gammelt agn | `strip` | kroken, agnet | som over, og kaster bøttas innhold over rekka | som `egn` |
| Bøter garn | `mend` | nåla, garnet | nåla føres gjennom maskene | avvik i sveipet: 4–5 cm |
| Kveiler tau | `coil` | tauet | den ene hånda i ring, den andre holder kveilen | avvik i sveipet: 8–10 cm |
| Bryner kniven | `knife` | kniven, brynet | kniven dras langs brynet | avvik i sveipet: 6 cm |

## 4. Dekket og båten

| Handling | Navn | Holder | Trenger | Står |
|---|---|---|---|---|
| Feier dekket | `sweep` | kosten | kosten eier linja til kostehodet på dekket, begge hender på skaftet, ser ned | rettet 14.11 (nederste hånd gled), blikket sett, hendene ikke |
| Spyler | `hose` | slangen | munnstykket føres, slangen følger | avvik i sveipet: 8 cm |
| Bunkrer | `nozzle` | fyllepistolen | hånda på pistolen i påfyllingen | urørt |
| Ved rattet, stående og sittende | `helm`, `helmsit` | rattet | hendene på rattet, følger rorutslaget | urørt |
| Skipperen og mannen i håndbåten | (egne: `figBake`, `figLive`) | rattet eller rorkulten, juksamaskinen | armene til det de styrer | sett (stillbilder) |
| Hånda mot døra før han går inn | `door` | dørhåndtaket | hånda til håndtaket | urørt |
| Går | (gang) | ingenting, eller kassa | føtter som plantes og svinges, ikke glir (FB3); hofta ned og opp | avvik: føttene glir (FB3 er ikke bygd) |
| Sjøbein | (`seaLegs`) | rekka når det krenger | beina tar krengingen, en hånd tar rekka, overkroppen holder seg loddrett | bygd (steg 121), ikke kjørt med den nye figuren etter 14.11 |

## 5. Ved kai: lossing og kran

| Handling | Navn | Holder | Trenger | Står |
|---|---|---|---|---|
| Gir tegn til kranføreren | `signal` | ingenting | armen opp, håndtegn | urørt |
| Tar imot lasten som kommer ned | `guide` | lasten | hendene opp mot den, følger den ned | urørt |
| Hekter av | `unhook` | kroken | hendene til kroken over lasten | avvik i sveipet: 8 cm for nær skulderen |
| Teller | `tally` | tavla | tavla i den ene hånda, skriver med den andre | avvik i sveipet: 4 cm |
| Kranens fjernkontroll | `remote` | fjernkontrollen | begge hender på den foran magen | målt (1 cm) |
| Truckføreren | `drive` | rattet | sittende, hendene på rattet | urørt |

## 6. Pausene

| Handling | Navn | Holder | Trenger | Står |
|---|---|---|---|---|
| Drikker kaffe, stående og sittende | `coffee`, `sitkaffe` | kruset, termosen | kruset til munnen og tippes, ser på kruset | sett: kruset ved munnen, tippet riktig vei |
| Spiser | `lunch`, `sitmat` | maten | biten til munnen, dreies mot den | avvik: maten roteres ikke |
| Røyker | `smoke` | sigaretten | til munnen og dreies mot leppene, røyken etterpå | rettet 14.11, trekket ikke fanget på bilde |
| Tar snus | `snus` | boksen | boksen fram, fingrene til overleppa | avvik i sveipet: 10 cm |
| Ser på mobilen | `phone` | mobilen | begge hender, tommelen arbeider, hodet ned | avvik: 2 cm; mobilen roteres ikke med hendene |
| Kikkert | `binoc` | kikkerten | til øynene, hodet og kikkerten svinger sammen | sett: ved øynene (1,2 cm mot ansiktet) |
| Fryser, slår floke | `cold` | ingenting | gnir hendene, blåser i dem, slår armene rundt seg | rettet 14.11 (ble skjøvet 30 cm), ikke sett |
| Lener seg på rekka | `lean` | rekka | begge hender flatt på rekka, vekta på dem | avvik i sveipet: 13 cm utenfor rekkevidde |
| Ryggen mot rekka, armene i kors | `back` | ingenting | armene i kors på brystet, beina i kryss | urørt |
| Sitter | `sit` | ingenting | hendene på knærne | avvik i sveipet: 9 cm |
| Prater | `chat` | ingenting | den ene hånda gestikulerer | målt (2 cm) |
| Ser utover | `look` | ingenting | hendene i sida, hodet svinger | målt (3 cm) |
| Ser på nordlyset | `aurora` | ingenting | hodet opp, armene ned | målt (4 cm) |
| Sjøsyk | `seasick` | rekka | over rekka, holder seg fast | avvik i sveipet: 5 cm |
| Legger fra seg pausetingen | (`st.put`) | tingen | kikkerten til brystet, sneipen over rekka, koppen ned | urørt |

## Det som går igjen i alle (ikke egne handlinger)

- **Tingen eier grepet og roterer selv.** Bygd for kassa, spaden, høtten, kruset, kosten. Mangler: maten, mobilen, kikkerten (roterer ikke med hendene), kniven og fisken i sløyingen, snøret og lina i hendene, tavla, fjernkontrollen, slangen.
- **Hånda dreies med tingen.** Ikke bygd: håndas retning kommer fra underarmen, ikke fra tingen (Geminis råd 14.11).
- **Blikket.** Bygd: ser ikke i kameraet under arbeid. Ikke bygd: ser på det hånda gjør i hver handling (bare et fast hodenikk per oppgave).
- **Vekt i kroppen** (regel 7): hofta ned og overkroppen mot lasten. Bygd bare for kassa (lening og knær).
- **Føttene** plantes og svinges (FB3): ikke bygd; de glir i gangen.
- **Fjærdemping** på hode, skuldre og hender (FB8, lukket løsning): ikke bygd.
- **Overgangene** mellom to handlinger (`st.blend`): finnes for gang til arbeid; ikke gjennomgått med den nye kroppen.
- **Andres ting og andres kropper:** plassene på dekk står for tett for høtten og kassene; ikke rettet.

## Forslag til rekkefølge (Jonas avgjør)

1. Det spilleren ser mest: `haul`, `gaff`, `gutw`, `pack`, `jig`, `carry` (linetrekk og juksa), til de er sett i det hvite rommet og hendene er innen 2 cm.
2. Pausene som holdes mot ansiktet: `coffee`, `lunch`, `smoke`, `snus`, `binoc`, `phone`, med rotasjon på tingen og blikket på den.
3. Bruket: `egn`, `strip`, `mend`, `coil`, `knife`, `sett`, `pick`.
4. Kaia og resten: `signal`, `guide`, `unhook`, `tally`, `remote`, `drive`, `nozzle`, `hose`, `sweep`, `door`.
5. Det som går igjen: hånda dreies med tingen, føttene (FB3), fjærene (FB8).
