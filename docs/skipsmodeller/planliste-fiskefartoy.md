# Planliste for realistiske fiskefartøy i Blender

Standard detaljliste for modellering av fiskefartøy i FishyBusiness. Listen dekker alle
fartøytyper, fra sjark til fabrikktråler, og brukes til to ting:

1. **Sjekkliste under modellering:** hvilke detaljer et fartøy må ha for å se ekte ut.
2. **Benchmark:** et felles poengsystem for å vurdere ferdige modeller (kap. 30).

Utfylt eksempel mot et ekte foto: [`eksempel-sulebas-sf-100-su.md`](eksempel-sulebas-sf-100-su.md).
Analyse av ti flere referansebilder: [`referanseanalyse-runde-2.md`](referanseanalyse-runde-2.md).

---

## Innhold

- [0. Slik brukes listen](#0-slik-brukes-listen)
- [1. Fartøytyper](#1-fartøytyper)
  - [1.2 Epoker og alder (EPO)](#12-epoker-og-alder-epo)
- [2. Prosjektark per fartøy](#2-prosjektark-per-fartøy)
- **Fellesmoduler (gjelder alle fartøy)**
  - [3. Skrog (SKR)](#3-skrog-form-og-konstruksjon-skr)
  - [4. Dekk og dekksstruktur (DKS)](#4-dekk-og-dekksstruktur-dks)
  - [5. Overbygg og styrehus (OVB)](#5-overbygg-og-styrehus-ovb)
  - [6. Master og elektronikk (MST)](#6-master-og-elektronikk-mst)
  - [7. Forskip, anker og fortøyning (FOR)](#7-forskip-anker-og-fortøyning-for)
  - [8. Fremdrift og maskin (FRM)](#8-fremdrift-og-maskin-frm)
  - [9. Lys og signaler (LYS)](#9-lys-og-signaler-lys)
  - [10. Sikkerhet og redning (SIK)](#10-sikkerhet-og-redning-sik)
  - [11. Fangsthåndtering (FSK)](#11-fangsthåndtering-fsk)
  - [12. Kraner og løfteutstyr (KRN)](#12-kraner-og-løfteutstyr-krn)
  - [13. Merking og dekaler (IDN)](#13-merking-og-dekaler-idn)
  - [14. Farger og materialer (MAT)](#14-farger-og-materialer-mat)
  - [15. Slitasje og liv (SLT)](#15-slitasje-og-liv-slt)
  - [16. Mannskap, skala og ergonomi (MAN)](#16-mannskap-skala-og-ergonomi-man)
  - [17. Miljø og presentasjon (MIL)](#17-miljø-og-presentasjon-mil)
- **Typemoduler (velg etter fartøytype)**
  - [18. Ringnot (RNG)](#18-ringnot-rng)
  - [19. Pelagisk trål (PTR)](#19-pelagisk-trål-ptr)
  - [20. Bunntrål og hekktråler (BTR)](#20-bunntrål-og-hekktråler-btr)
  - [21. Snurrevad og fly-shooting (SNV)](#21-snurrevad-og-fly-shooting-snv)
  - [22. Line (LIN)](#22-line-lin)
  - [23. Garn (GRN)](#23-garn-grn)
  - [24. Teine og krabbe (TEI)](#24-teine-og-krabbe-tei)
  - [25. Fabrikktråler (FAB)](#25-fabrikktråler-fab)
  - [26. Sjark og små kystfartøy (SJK)](#26-sjark-og-små-kystfartøy-sjk)
  - [27. Internasjonale varianter (INT)](#27-internasjonale-varianter-int)
- **Arbeidsflyt og kvalitet**
  - [28. Byggerekkefølge](#28-byggerekkefølge)
  - [29. Vanlige feil](#29-vanlige-feil-som-gjør-modeller-urealistiske)
  - [30. Benchmark](#30-benchmark-og-kvalitetskrav)
  - [31. Tekniske Blender-standarder](#31-tekniske-blender-standarder)

---

## 0. Slik brukes listen

1. Velg **fartøytype** og **epoke** i kap. 1. Typen bestemmer hvilke typemoduler (kap. 18–27) som gjelder.
2. Kopier **prosjektarket** (kap. 2) og fyll inn mål, referanser og valgte moduler.
3. Gå gjennom **alle fellesmoduler** (kap. 3–17) og de **valgte typemodulene**. Merk hvert punkt
   med poeng (kap. 30) eller «IR» (ikke relevant).
4. Følg **byggerekkefølgen** (kap. 28) og de **tekniske standardene** (kap. 31).
5. Vurder modellen med **benchmarken** (kap. 30).

### Kolonner

| Kolonne | Betydning |
|---|---|
| **ID** | `KAT-nn`. Brukes i oppgaver, commit-meldinger og som `bench_id` på Blender-objekter. |
| **Element** | Komponenten. |
| **Detaljer som gir realisme** | Det som må modelleres eller tekstures for at elementet skal se ekte ut. |
| **Varianter / typisk** | Hvordan elementet varierer mellom fartøytyper, med veiledende mål. Dette er tommelfingerregler. Bruk registerdata og tegninger når de finnes. |
| **Pri.** | Prioritet, se under. |
| **☐** | Poeng 0–3 eller «IR». |

### Prioritet

| Pri. | Betydning | LOD-krav |
|---|---|---|
| **P1** | Silhuett og identitet, synlig på lang avstand | Geometri i alle LOD |
| **P2** | Sekundær form | Geometri i LOD0–1, normal map/tekstur i LOD2 |
| **P3** | Mikrodetalj | LOD0, som geometri eller normal map |

### Retningsbegreper

**Forut / akter** = mot baug / mot hekk. **BB** = babord (venstre sett forover), **SB** = styrbord.
**CL** = senterlinje.

---

## 1. Fartøytyper

### 1.1 Typer

Fellesmodulene gjelder alle typer. Tabellen viser hvilke typemoduler som kommer i tillegg.

| Kode | Type | Typisk lengde | Silhuett og kjennetegn | Typemoduler |
|---|---|---|---|---|
| **SJK** | Sjark, snekke | 6–15 m | Lite styrehus (akter, midt eller forut) eller åpen båt. Lavt fribord. GRP, tre eller aluminium. Juksamaskiner eller haler på rekka. | SJK + GRN/LIN/TEI |
| **KYS** | Kystfartøy | 15–28 m (noen større) | Styrehus forut med åpent arbeidsdekk akter (snurrevad, kystnot), eller styrehus akter (garn, line). Nyere har ofte bulb og høy bakk. | SNV, RNG, GRN, LIN eller TEI |
| **RNG** | Ringnotfartøy (snurper) | 40–90 m | Høy baug, overbygg forut eller midtskips, kraftblokk på kran, notbinge akter, notgjerde forut, mange antenner og radomer. | RNG (+ PTR) |
| **PTR** | Pelagisk tråler | 50–90 m | Ofte kombinert med ringnot. Nettromler og galge akter, trålvinsjer, pumpeslange for pumping fra trålposen. | PTR (+ RNG) |
| **BTR** | Bunntråler/hekktråler (fersk eller fryse) | 40–80 m | Overbygg langt forut, lukket shelterdekk, hekkslipp med galge, tråldører på hekken, flere nettromler. | BTR |
| **FAB** | Fabrikktråler | 60–130 m | Som BTR, men større og høyere: flere dekk, fabrikkvinduer, lossekraner, store luker, kraftig skorstein. | BTR + FAB |
| **SNV** | Snurrevad/fly-shooting | 15–45 m | Styrehus forut, langt åpent arbeidsdekk akter, store tauspoler, nettrommel. | SNV |
| **LIN** | Autoline/linefartøy | 30–60 m | Lukket shelterdekk, haleport i skutesiden forut, setteluke akter, bøyer og staker på dekk. | LIN |
| **GRN** | Garnfartøy | 10–40 m | Garnhaler ved rekka, garnbinger, bøyestaker med flagg. | GRN |
| **TEI** | Teine-/krabbefartøy | 10–60 m | Teiner stablet på dekk, teinehaler på davit, kran for stabling, tanker for levende fangst. | TEI |
| **REK** | Reketråler | 20–70 m | I Norge: hekktråler med tvillingtrål. Internasjonalt: utriggerbommer. | BTR (+ INT) |
| **TUR** | Ombygd fartøy (turistfiske, fritid) | 15–35 m | Eldre fiskefartøy med passasjerinnredning: flybru, benker, stangholdere, lyslenker. | EPO-05 + SJK |

### 1.2 Epoker og alder (EPO)

Alderen styrer formspråk og detaljer like mye som fartøytypen. Velg epoke i prosjektarket og sjekk
punktet under i tillegg til modulene. Årstallene er veiledende.

| ID | Epoke | Kjennetegn som må med | Pri. | ☐ |
|---|---|---|---|---|
| EPO-01 | Trebåter (klassisk, før ca. 1960) | Klink- eller kravellbygd skrog med synlige bord, spisshekk eller rund hekk, tjæret eller malt tre, lite styrehus i tre, tremast med støttesegl, rorkult eller ratt. | P1 | ☐ |
| EPO-02 | Tidlig stål (ca. 1950–1975) | Kraftige buler mellom spantene, rund «cruiser»-hekk, lav skanse med rekke, runde lysventiler med tykke rammer, tredører, anker i klyss på skrogsiden, master med salinger og lastebom, okergule eller hvite master og bommer, tydelig skorstein. | P1 | ☐ |
| EPO-03 | Moderne klassisk (ca. 1975–2000) | Styrehus forut, lukket shelterdekk og hekkslipp på trålere, rektangulære vinduer, rørrekkverk, stålmaster med radar, skorstein med rederimerke, få radomer. | P1 | ☐ |
| EPO-04 | Moderne (2000–) | Bulb eller X-bow, høy (ofte overbygd) bakk, stramme eller skulpturerte flater, store skråstilte panoramavinduer, radomer, eksos i masta eller frittstående eksosrør, LED-lys, kameraer, store grafiske logoer. | P1 | ☐ |
| EPO-05 | Ombygd fartøy | Eldre skrog med nyere innredning: passasjerbenker, flybru, stangholdere, lyslenker, rester av gammelt fiskeutstyr. | P2 | ☐ |

---

## 2. Prosjektark per fartøy

Kopier blokken inn i en egen fil per fartøy, for eksempel `docs/skipsmodeller/<kortkode>.md`.

```markdown
## Prosjektark: <navn>

| Felt | Verdi |
|---|---|
| Kortkode (3 bokstaver) | |
| Fartøytype (kap. 1) | |
| Typemoduler | |
| Ekte forbilde eller fiktivt | |
| LOA / LPP | |
| Bredde / dypgang | |
| Fribord forut / akter | |
| Byggeår / epoke (kap. 1.2) | |
| Skrogmateriale | |
| Registreringsmerke / kallesignal / hjemmehavn | |
| Fargeskjema (RAL eller hex) | |
| Slitasjenivå (kap. 15.2) | |
| Avvik fra standardlisten | |

Referanser:
- [ ] BB side          - [ ] SB side
- [ ] Forfra           - [ ] Akterfra
- [ ] Ovenfra eller GA-tegning
- [ ] Undervannsskrog (dokk)
- [ ] Detaljbilder av hovedutstyr
- [ ] Nattbilde
```

---

## 3. Skrog: form og konstruksjon (SKR)

| ID | Element | Detaljer som gir realisme | Varianter / typisk | Pri. | ☐ |
|---|---|---|---|---|---|
| SKR-01 | Hovedproporsjoner | L/B, B/T og fribord avgjør mer av helhetsinntrykket enn noen detalj. Blokk ut skroget fra registermål før noe annet. | L/B: sjark 2,5–3,2 · kystfartøy 3–3,8 · ringnot/tråler 4–5 · fabrikktråler 4,5–5,5 | P1 | ☐ |
| SKR-02 | Spring og dekkslinje | Dekkslinjen stiger mot baugen, med bakk forut. Arbeidsdekket akter ligger lavt på trålere og snurrevadbåter. | Moderne havfiske: høy bakk og lukket shelterdekk. Eldre: kraftig spring og lav akter. | P1 | ☐ |
| SKR-03 | Stevn og baug | Stevnprofil, flare og overgang til bulb. Stevnplate og sveis langs stevnen. | Rett eller skrå stevn, X-bow (omvendt baug), klassisk skrå stevn uten bulb | P1 | ☐ |
| SKR-04 | Bulbbaug | Form (spiss, rund, «nese»), lengde foran stevnen og høyde mot vannlinja. Bryter overflaten når fartøyet er lett. | Vanlig over ca. 25 m. Mangler ofte på sjarker og eldre fartøy. | P1 | ☐ |
| SKR-05 | Hekk | Profil sett fra siden og bakfra, overgang til skeg. | Tverrhekk (speil), rund «cruiser»-hekk (eldre), hekkslipp (trålere), åpen hekk med hekkrull (snurrevad) | P1 | ☐ |
| SKR-06 | Spantform og kimming | Tverrsnittet: rund kimming, hard knekk eller V-bunn. | Stål havfiske: rund kimming og flat bunn midtskips. Aluminium/stålsjark: knekkspant. Planende småbåt: V-bunn. | P1 | ☐ |
| SKR-07 | Kjøl og slingrekjøl | Slingrekjøler langs kimmingen midtskips (tynn plate). Kassekjøl eller kjølplate. | Slingrekjøl ca. 0,3–0,6 m dyp, 25–40 % av lengden. Nesten alle stålfartøy har det. | P2 | ☐ |
| SKR-08 | Skeg og propellåpning | Skeg foran propellen, propellbrønn, hæl under roret. | Se FRM | P2 | ☐ |
| SKR-09 | Plater og sveis | Plateskjøter (felt ca. 1,5–3 × 6–10 m), sveisestrenger, innbuling mellom spantene («hungry horse», synlig i skrått lys). | Gamle og hardt brukte fartøy har sterkere buler. GRP: glatt med støpeskjøter. Tre: bordganger og kalfatring. | P3 | ☐ |
| SKR-10 | Skansekledning | Høyde, tykkelse, avrundet topp (skandekk/rekkeprofil), **stag på innsiden** ca. hver 1–1,5 m, overgang til rekkverk der skansen slutter. | Ca. 1,0–1,2 m, høyere på bakken | P1 | ☐ |
| SKR-11 | Lenseporter og spygatt | Rektangulære lenseporter nederst i skansen (ofte med klaff eller rist) og spygatt fra dekket, med rennestriper under. | Ca. 0,25–0,5 m høye, antall etter dekkslengde | P2 | ☐ |
| SKR-12 | Overbordsutløp | Runde utløp med krage (kjølevann, sanitær, lens) og større utløp fra RSW-anlegg/avvanner nær vannlinja. Vannstråle som VFX. | – | P2 | ☐ |
| SKR-13 | Sjøkister | Innløpsrister i bunn eller side under vann. | Synlig kun i dokk eller under vann | P3 | ☐ |
| SKR-14 | Thrustertunneler | Rund tunnelåpning i baugen (og eventuelt akter) med boltet rist av buede loddrette og rette vannrette stag. Thrusterpropellen synes inne i tunnelen. Symbol over vannlinja. Senkbar azimut-thruster under bunnen på større fartøy. | 1–2 forut, 0–1 akter | P2 | ☐ |
| SKR-15 | Sonar og senkekjøl | Senkekjøl/sonarstamme gjennom bunnen, hydrofonåpninger. | Ringnot og trålere har flere sonarer | P3 | ☐ |
| SKR-16 | Slitelister og beskyttelse | Halvrør-slitelist langs skroget, forsterkningsplater der redskap gnir (galge, sidehaler, pumpe), gummifendere. Ramme med skrå eller loddrette stålrør på skrogsiden der teiner og redskap hales over. Rustfrie bøyler på hekken. | Sjark: gummilist og bildekk som fendere | P2 | ☐ |
| SKR-17 | Isforsterkning | Tykkere isbelte rundt vannlinja forut, ofte synlig som plateskjøt. | Vanlig på fartøy som fisker i Barentshavet | P3 | ☐ |
| SKR-18 | Skrogmateriale | Styrer alle detaljer: stål (sveis, plater), aluminium (tynnere profiler, malt eller umalt), GRP (gelcoat, avrundede støpte former), tre (bord, nagler, kalfatring). | – | P1 | ☐ |
| SKR-19 | Offeranoder | Avlange sink- eller aluminiumsklosser, boltet eller sveiset, på ror, rorhæl, skroget rundt propellen, i thrustertunneler og ved sjøkister. Matt grå, ofte med hvite oksidflekker. | 10–40 stk. under vann på et havfiskefartøy | P3 | ☐ |
| SKR-20 | Skrogåpninger og porter | Sideporter og dører i skrogsiden (haleport, losdør), vinduer i bakken eller skrogsiden, innfelte paneler. Åpne porter trenger en innside med lys og utstyr. | – | P2 | ☐ |
| SKR-21 | Innfelte leidertrinn | Loddrett rad med innfelte trinn fra vannlinja opp til dekk, ofte midtskips. | Vanlig på nyere fartøy | P3 | ☐ |
| SKR-22 | Ventilasjonsrister i skrogsiden | Lange, smale lamellrister eller spalter i skrogsiden eller skansen, for maskinrom og shelterdekk. Ofte sorte. | – | P2 | ☐ |

---

## 4. Dekk og dekksstruktur (DKS)

| ID | Element | Detaljer som gir realisme | Varianter / typisk | Pri. | ☐ |
|---|---|---|---|---|---|
| DKS-01 | Dekksinndeling | Hoveddekk, shelterdekk (lukket arbeidsdekk), bakk, akterdekk, båtdekk og brodekk. Avklar hva som er åpent og lukket. | Bunntråler og autoline: lukket shelter. Ringnot: åpent akterdekk med notbinge. Sjark: åpent dekk. | P1 | ☐ |
| DKS-02 | Dekksbelegg | Grov antisklimaling, tårepletter (checker plate) på gangveier, tredekk med plankestriper på eldre båter, gummimatter på arbeidsplasser. Ofte tofarget: grå flate med kantbånd i en annen farge langs skansen. | Ofte grått, grønt, rødbrunt eller blått | P2 | ☐ |
| DKS-03 | Luker og karmer | Laste- og tankluker med høy karm, hengsler, hydrauliske sylindre eller skruelukker. Mannhull med boltede lokk. Fiskeluker inn til fangstmottaket. | Karm ofte 0,3–0,6 m | P2 | ☐ |
| DKS-04 | Lufterør og peilerør | Lufterør med svanehals eller lufterørshode langs skansen og på bakken. Peilerør med skrulokk. | Ofte 10–30 stk. på større fartøy | P2 | ☐ |
| DKS-05 | Ventilasjon | Soppventiler, ventilasjonshetter, lamellrister på skott, store maskinrominntak. | – | P2 | ☐ |
| DKS-06 | Rørgater og kabelbaner | Hydraulikk- og spylerør langs skott og under rekka, kabelbaner med klammer, gjennomføringer og rørbend ved utstyr. | Gir mye realisme på nært hold | P2 | ☐ |
| DKS-07 | Dører | Vanntette ståldører med hendler, høy karm og gummitetning. | Karm 0,3–0,6 m på værdekk | P2 | ☐ |
| DKS-08 | Trapper, leidere, gangveier | Steile trapper med rekkverk, vertikale leidere (høye leidere med ryggbøyle), gitterrister, gangbaner rundt overbygget. | Se MAN for mål | P2 | ☐ |
| DKS-09 | Brannutstyr | Brannhydranter med røde slangeskap, slukkerskap, landtilkobling. | – | P3 | ☐ |
| DKS-10 | Drenering og spyling | Dekksrenner, lensebrønner med rister, spyleslanger på kroker. | – | P3 | ☐ |
| DKS-11 | Le-tak og skjermer | Sprutskjermer, le-tak over arbeidsplasser, presenninger. | Ringnot: tak over notbingen. Snurrevad: le-tak ved tauspolene. | P2 | ☐ |
| DKS-12 | Løst dekksutstyr | Fiskekasser og isolerte kar i stabler, tau i kveiler, presenninger, verktøykasser, paller og slanger. Gjør dekket levende. | Mengde etter scene | P3 | ☐ |
| DKS-13 | Gass- og trykkflasker | Flasker i stativ med stropper: propan til byssa, CO2, oksygen og acetylen til sveising. Ofte bak rist eller i skap. | – | P3 | ☐ |
| DKS-14 | Landgang | Landgang i aluminium med rekkverk, lagret flatt på dekk eller i stativ. | – | P3 | ☐ |

---

## 5. Overbygg og styrehus (OVB)

| ID | Element | Detaljer som gir realisme | Varianter / typisk | Pri. | ☐ |
|---|---|---|---|---|---|
| OVB-01 | Plassering og nivåer | Overbyggets for- og akterkant som % av LOA, og antall dekk. | Forut: bunntråler, autoline, snurrevad, kystnot. Midtskips: mange ringnotfartøy. Akter: eldre og små garn- og linebåter. | P1 | ☐ |
| OVB-02 | Formspråk | Kantete eller avrundet, avfasede hjørner, skrå fronter, overheng. Noen nyere har skulpturerte, avrundede former med sorte lamellbånd som designelement. | Moderne: stramme flater. Eldre: avrundet, mindre vinduer. | P1 | ☐ |
| OVB-03 | Styrehusvinduer | Antall, høyde, stolpebredde og skråstilling. Rundtsikt inkludert aktervinduer mot arbeidsdekket. Styrehuset kan være kantete eller avrundet/elliptisk sett ovenfra. Småbåter har ofte et sort vindusbånd rundt hele vindusrekka. | Moderne: toppen lener ut ca. 10–15° mot refleks. Eldre: loddrette eller innoverskrå. | P1 | ☐ |
| OVB-04 | Klarsiktsruter og visker | Roterende klarsiktsruter (runde glassdisker med motor) og/eller pendelviskere på frontvinduene, spylerør. | Svært typisk på fiskefartøy | P2 | ☐ |
| OVB-05 | Takskjerm | Takoverheng over vinduene, regnrenne, eventuelle solgardiner innvendig. | – | P2 | ☐ |
| OVB-06 | Brovinger | Åpne eller lukkede brovinger med styrepult, rekkverk og sidelanterner. | Lukket på nyere havfiskefartøy | P2 | ☐ |
| OVB-07 | Akterstyreplass | Styreplass med vinduer mot arbeidsdekket (vinsj- og kranstyring). | Trålere, snurrevad, ringnot | P2 | ☐ |
| OVB-08 | Vinduer og lysventiler | Lugarvinduer (firkantet med runde hjørner) og runde lysventiler med blindlokk. Gardiner eller enkel interiørtekstur bak glasset. | Eldre: runde lysventiler med tykke rammer (messing eller malt) | P2 | ☐ |
| OVB-09 | Skorstein og eksos | Skorsteinshus eller eksosrør integrert i masta, regnhatt, lyddemper, sot. Rederimerke og fargebånd på skorsteinen. | Eksos i masta (røyk fra mastetoppen) · frittstående eksosrør, ofte to, med skrå avskjæring og sotet tupp · eget skorsteinshus i skrogfarge med mast og leider på toppen · klassisk skorstein med fargebånd og emblem · sjark: rør gjennom taket med regnhatt | P1 | ☐ |
| OVB-10 | Utstyr på skott | AC-enheter, lamellrister, lys, høyttalere, kameraer, koblingsbokser og kabelføringer. | – | P3 | ☐ |
| OVB-11 | Styrehustak | Rekkverk, gangbane, radarer, søkelys, magnetkompass, nødpeilesender, flåter. Kallesignalet står ofte på et frittstående skilt fremst på taket, eller er malt på taket. | – | P2 | ☐ |
| OVB-12 | Interiør bak glass | Minimum styrepult, stoler, skjermer, takpanel og lys. Fullt interiør bare hvis spillet har bro-visning. | – | P2 | ☐ |
| OVB-13 | Takflater sett ovenfra | Tak og øvre dekk synes fra drone og skrått spillkamera. Fyll dem med antisklimaling, luker, ventiler, AC-enheter, kabelbaner, lys, flåter, kister og avløp. | Vanlig feil: tomme, flate tak | P2 | ☐ |
| OVB-14 | Skylight | Takvindu med glassfelt og beskyttelsesstenger over maskinrom eller messe. | Eldre fartøy | P3 | ☐ |
| OVB-15 | Flybru | Åpen styreplass på styrehustaket med rekkverk, sitteplasser og enkel styrepult. | Eldre, ombygde og mindre fartøy | P3 | ☐ |
| OVB-16 | Navn på styrehuset | Navnet malt på et fargebånd over vinduene eller på brofronten. | Vanlig på sjarker og kystfartøy | P2 | ☐ |

---

## 6. Master og elektronikk (MST)

| ID | Element | Detaljer som gir realisme | Varianter / typisk | Pri. | ☐ |
|---|---|---|---|---|---|
| MST-01 | Signal-/radarmast | Konstruksjon (kasse, rør eller gitter), plattformer, leidere og trinn, rå med lys, kabelføring. | Over eller bak styrehuset | P1 | ☐ |
| MST-02 | Formast/aktermast | Formast på bakken med lys, søkelys og signalutstyr. Aktermast eller galgemast på trålere. | Eldre: salinger og gitterplattform på toppen. Småbåter: A- eller trebeinsmast i rør. | P1 | ☐ |
| MST-03 | Radarer | Open array-antenner på roterende girhus. Størrelsen er viktig for skalaen. | X-bånd 4–8 fot (1,2–2,5 m), S-bånd 10–12 fot (3–3,7 m). Havfiske: 2–3 radarer. Sjark: radom ca. 0,5–0,6 m. | P1 | ☐ |
| MST-04 | Radomer | Kupler for VSAT/bredbånd og TV, med flat bunnflens, sokkel eller stativ, logo og varseldekal. | 0,6–1,5 m Ø, 1–3 stk. | P1 | ☐ |
| MST-05 | Piskantenner | VHF-pisker (1–2,5 m), MF/HF-pisker (6–10 m, ofte med skjøtehylse), Navtex. Festebraketter. | Lange pisker preger silhuetten på avstand | P2 | ☐ |
| MST-06 | Småantenner | Soppantenner for GPS/AIS/Inmarsat-C, avlangt satellittkompass, 4G-antenner. | 3–10 stk. | P3 | ☐ |
| MST-07 | Sensorer | Vindmåler/værstasjon, kameraer, lynavleder. | – | P3 | ☐ |
| MST-08 | Tyfon og klokke | Tyfon på masta, ankerklokke forut. | – | P3 | ☐ |
| MST-09 | Signalfigurer | Svarte figurer i flaggline: to kjegler spiss mot spiss (fiske), kule (ankret). | Under 20 m kan bruke kurv i stedet for kjegler | P3 | ☐ |
| MST-10 | Flagg | Flaggstang akter (nasjonalflagg) i havn, flagg i flaggline i masta under gange, rederflagg. Animeres med cloth eller shape keys. | – | P3 | ☐ |
| MST-11 | Skjult elektronikk | Ekkolodd, sonar og trålsensorer under skroget. Bare hullåpningene synes (SKR-15). | – | P3 | ☐ |
| MST-12 | Vant, stag og barduner | Wire fra master og bommer til dekk og skanse, med strekkfisker, sjakler og festeøyer. Riktig tykkelse og nedheng. | Svært synlig på småbåter og eldre fartøy | P2 | ☐ |
| MST-13 | Flaggalun | Signalflagg i line fra baugen over mastetoppene til hekken. | Dåp, 17. mai og andre anledninger | P3 | ☐ |

---

## 7. Forskip, anker og fortøyning (FOR)

| ID | Element | Detaljer som gir realisme | Varianter / typisk | Pri. | ☐ |
|---|---|---|---|---|---|
| FOR-01 | Ankerspill | Kjettinghjul, brems, kjettingstopper, kjettingrør ned til kjettingkassen, varpkopp. | – | P2 | ☐ |
| FOR-02 | Anker og ankerlomme | Stokkløst anker i ankerlomme (ofte med utstikkende krage under) eller trukket inn i ankerklyss på skrogsiden, med kjetting. Riggbart for senking. | 1–2 ankere. Eldre: anker i klyss på skrogsiden. Sjark: anker surret på dekk med kjetting fra vinsjen. | P2 | ☐ |
| FOR-03 | Fortøyningsvinsjer | Trossetromler, ofte med fargerikt syntetisk tau. Forut og akter. | – | P2 | ☐ |
| FOR-04 | Pullerter og klyss | Doble pullerter, kryssholter, panamaklyss og rullklyss, forut, midtskips og akter på begge sider. | 4–10 par på havfiskefartøy | P2 | ☐ |
| FOR-05 | Fendere | Faste gummifendere, løse fendere/bøyer i tau, bildekk på småbåter. | – | P3 | ☐ |
| FOR-06 | Bakk | Bakkrekkverk, baugkran, utstyrsbokser, eventuelt bølgebryter og notgjerde (RNG-11). | Overbygd bakk («whaleback»): tak over bakken, åpen akterover, med vinsjer, tau og brannskap inne | P2 | ☐ |
| FOR-07 | Stevnbeslag og baugrull | Stevnbeslag (ofte sort) på småbåter, baugrull eller ring for anker og fortøyning. | Sjark og kystfartøy | P3 | ☐ |

---

## 8. Fremdrift og maskin (FRM)

| ID | Element | Detaljer som gir realisme | Varianter / typisk | Pri. | ☐ |
|---|---|---|---|---|---|
| FRM-01 | Propell | Antall blader, vridbar (CPP) eller fast, diameter. CPP: stort nav med konisk, blank navhette og boltekrans, bladene boltet til navet. Bronse med synlige slipemerker (MAT-10). | 4–5 blader. Diameter ofte 60–75 % av dypgangen. | P2 | ☐ |
| FRM-02 | Dyse | Propelldyse (ring rundt propellen) som gir skyvekraft ved lav fart. | Vanlig på trålere og snurrevad | P2 | ☐ |
| FRM-03 | Ror | Flapror, «fiskehale»-ror eller balansert ror, med rorstamme og flapledd. Rorhæl (sålestykke) fra skegen under roret, boltet inspeksjonsluke, små løftehull, offeranoder (SKR-19). | – | P2 | ☐ |
| FRM-04 | Aksel, akterrør og tauvern | Tauvern (sylinder rundt akselen mellom nav og skrog som beskytter mot tau og not), akselbrakett ved dobbel propell. | – | P3 | ☐ |
| FRM-05 | Thrustere | Se SKR-14. | – | P2 | ☐ |
| FRM-06 | Eksos og kjølevann | Eksos gjennom skorstein, eller våt eksos i skrogsiden på småbåter. Kjølevannsutløp. VFX for røyk og damp. | – | P2 | ☐ |
| FRM-07 | Bunnstoff og vannlinje | Bunnstoff (rødbrunt, sort, blått eller grått), vannlinjestripe, vannlinje som avhenger av last. | – | P1 | ☐ |

---

## 9. Lys og signaler (LYS)

Regler fra de internasjonale sjøveisreglene (COLREG) og norsk sjøveisforskrift. Hver lyskilde skal
ha eget emitter-objekt som kan slås av og på.

| ID | Element | Detaljer som gir realisme | Varianter / typisk | Pri. | ☐ |
|---|---|---|---|---|---|
| LYS-01 | Toppanterne | Hvit, 225° sektor, forut på masta. | Fartøy ≥ 50 m har to, der den akterste står høyest | P2 | ☐ |
| LYS-02 | Sidelanterner | Rød BB og grønn SB, 112,5° sektor. **Skjermene er matt sorte innvendig.** På brovinger eller styrehussidene. | – | P2 | ☐ |
| LYS-03 | Akterlanterne | Hvit, 135° sektor, akterut. | – | P3 | ☐ |
| LYS-04 | Fiskelys | Rundtlys i vertikal linje. **Tråling:** grønt over hvitt. **Annet fiske:** rødt over hvitt. Ekstra hvitt rundtlys mot redskapet når det går over 150 m ut. | COLREG regel 26 | P2 | ☐ |
| LYS-05 | Tilleggslys | Tråler: 2 hvite (setter), hvitt over rødt (haler), rødt over rødt (fast). Ringnot: 2 gule vekselblinkende lys i vertikal linje. | COLREG vedlegg II | P3 | ☐ |
| LYS-06 | Ankerlys og NUC | Hvitt rundtlys forut (og akter ved ≥ 50 m). Ikke manøvreringsdyktig: 2 røde. | – | P3 | ☐ |
| LYS-07 | Arbeidslys | LED-flomlys på mast, galge, kraner og skott som lyser opp dekket. Spotlys i takkanten rundt styrehuset og downlights under hvert dekksoverheng. | 10–40 stk. på havfiskefartøy | P2 | ☐ |
| LYS-08 | Søkelys | Kromhus, stor linse, pan/tilt. På styrehustaket og formasta. | 1–4 stk. | P2 | ☐ |
| LYS-09 | Innvendig lys og nattlys | Rødt nattlys på broen, røde lys i gangveier og på dekk, varmt lys i lugarer og messe (lysende vinduer om natta). | – | P3 | ☐ |
| LYS-10 | Lysstilstander | Forhåndsdefinerte sett: I havn · Gange · Fiske (per redskap) · Ankret · Natt med arbeidslys. | – | P2 | ☐ |
| LYS-11 | Pyntelys | Lyslenker mellom master og overbygg. | Turistbåter, jul | P3 | ☐ |

---

## 10. Sikkerhet og redning (SIK)

| ID | Element | Detaljer som gir realisme | Varianter / typisk | Pri. | ☐ |
|---|---|---|---|---|---|
| SIK-01 | Redningsflåter | Hvite GRP-beholdere med bånd, i stativ med hydrostatisk utløser og fangline. Står i par på hver side, eller stablet loddrett i en nisje i overbygget. | Antall etter mannskap. Sjark: rektangulær hard kasse på styrehustaket. | P2 | ☐ |
| SIK-02 | MOB-båt og davit | Mann-over-bord-båt (oransje eller rød, åpen RIB, hurtig MOB-båt eller lukket) i egen davit eller kran, med vugge. Ofte under presenning. | Påkrevd på større fartøy | P2 | ☐ |
| SIK-03 | Redningsbøyer | Oransje eller rød/hvit ring med lys og line, i holdere på rekka og broen. | 4–8 stk. | P3 | ☐ |
| SIK-04 | Nødpeilesender | Liten oransje eller gul beholder med utløser på styrehustaket eller brovingen. | – | P3 | ☐ |
| SIK-05 | Rekkverk | Rørrekkverk 1,0–1,1 m med 2–3 vanger, fotlist og stolper ca. 1,2–1,5 m fra hverandre. Rørene er tynne. Bruk modulære deler. | Vanlig feil: for tykke rør | P2 | ☐ |
| SIK-06 | Skilting | IMO-symboler (flåte, bøye, brann, rømning), ofte som små røde skilt på hvite skott, gul/sort fareskilting, merkede soner rundt vinsjer. | – | P3 | ☐ |
| SIK-07 | Livliner og nett | Sikkerhetsnett under gangbaner, livliner på arbeidsdekk, fallsikring ved notbinge og hekkslipp. | – | P3 | ☐ |
| SIK-08 | Kister for redningsutstyr | Gule, oransje eller hvite kister på dekk for redningsvester og overlevelsesdrakter. | – | P3 | ☐ |

---

## 11. Fangsthåndtering (FSK)

| ID | Element | Detaljer som gir realisme | Varianter / typisk | Pri. | ☐ |
|---|---|---|---|---|---|
| FSK-01 | Fiskepumpe | Vakuumpumpe eller nedsenkbar pumpe, slangekobling på skutesiden, stålrør og bend inn til avvanneren. | Alltid på pelagiske fartøy | P2 | ☐ |
| FSK-02 | Pumpeslange | Svart gummislange (sugeslange) med flenskoblinger, som henger i kran eller i kjedelinje langs skutesiden. Lagres på slangetrommel på kranspissen eller på egen slangevinsj. | 0,25–0,5 m Ø | P2 | ☐ |
| FSK-03 | Avvanner og renner | Avvanningskasse i rustfritt stål og renner ned til tankene. Vannutløp gjennom skroget. | – | P3 | ☐ |
| FSK-04 | Fangstmottak | Mottaksbinge eller fiskeluke der fangsten kommer inn. | Trål: fra sekken. Line: fra haleporten. | P2 | ☐ |
| FSK-05 | Bløgge- og sløyeplass | Sorteringsbord, bløggekar, transportbånd, sløyemaskin og spylevann. | På dekk (småbåter) eller under shelterdekket | P3 | ☐ |
| FSK-06 | Kar og kasser | Isolerte plastkar og fiskekasser i stabler, isslanger. | Kar ca. 300–1000 l | P3 | ☐ |
| FSK-07 | Tankluker | Luker til kjølte sjøvannstanker (RSW), ofte på rad på dekket. | Mange på pelagiske fartøy | P2 | ☐ |

---

## 12. Kraner og løfteutstyr (KRN)

| ID | Element | Detaljer som gir realisme | Varianter / typisk | Pri. | ☐ |
|---|---|---|---|---|---|
| KRN-01 | Kranfundament | Sylindrisk eller konisk sokkel, svingkrans, operatørplass eller fjernstyring, plattform og leider. | – | P1 | ☐ |
| KRN-02 | Bom og sylindre | Knekk- eller teleskopbom med hydraulikksylindre og blanke sylinderstenger. Sylindrene må følge leddene i animasjon. | – | P1 | ☐ |
| KRN-03 | Hydraulikkslanger | Slangebunter langs bommen, **løkker ved hvert ledd**, slangeklammer. | Glemmes ofte | P2 | ☐ |
| KRN-04 | Kranspiss | Rotator/svivel, vaierskiver, krok med sikringsklaff, eventuelt hengende verktøy (kraftblokk, teinehaler) eller slangetrommel. | – | P2 | ☐ |
| KRN-05 | Bomstøtte | Krybbe der bommen parkeres under gange. | – | P3 | ☐ |
| KRN-06 | Galge og A-ramme | Portal over hekken eller på siden, med blokker og hydraulikk. | Se typemodulene | P1 | ☐ |
| KRN-07 | Hjelpevinsjer | Gilsonvinsjer, hivevinsjer, provianteringskran. | – | P3 | ☐ |
| KRN-08 | Blokker og wire | Vaierskiver med sidebeslag, wire eller tau mellom vinsj og blokk med riktig nedheng. | – | P2 | ☐ |
| KRN-09 | Lastebom | Bom fra mast eller skorstein med toppløftwire, gajer, talje og krokblokk. | Eldre fartøy, småbåter, og som hjelpebom på nyere | P2 | ☐ |

---

## 13. Merking og dekaler (IDN)

| ID | Element | Detaljer som gir realisme | Varianter / typisk | Pri. | ☐ |
|---|---|---|---|---|---|
| IDN-01 | Registreringsmerke | Norsk fiskerimerke: fylkesbokstaver–nummer–kommunebokstaver (f.eks. `SF-100-SU`, `M-65-G`). Store bokstaver på begge sider av baugen, ofte også på styrehustaket. Sort på lyst skrog, hvitt på mørkt, eller på eget kontrastfelt (sort plate med hvit tekst) på småbåter. | Sjekk Fiskeridirektoratets merkeforskrift. Andre land: Storbritannia havnebokstaver + nummer (`PD 379`), Spania f.eks. `SS-3-345`. | P1 | ☐ |
| IDN-02 | Navn og hjemmehavn | Navn på baugen eller overbygget, og navn + hjemmehavn på hekken. | – | P2 | ☐ |
| IDN-03 | Kallesignal | På styrehussidene og/eller taket (stort, synlig fra helikopter). | Norske kallesignal starter på L | P2 | ☐ |
| IDN-04 | IMO-nummer | «IMO 1234567» på hekken eller overbygget. | Kun fartøy med IMO-nummer | P3 | ☐ |
| IDN-05 | Rederilogo og striper | Logo på baugen og/eller skorsteinen, fartsstriper, rederifarger. | – | P2 | ☐ |
| IDN-06 | Dypgangsmerker | Sveiste og malte tall forut (på stevnen), akter og ofte midtskips, på begge sider. Metrisk: tall 10 cm høye med 20 cm mellomrom (2, 4, 6, 8), hele meter med «M» (f.eks. «4M»). | Eldre fartøy kan ha skala i fot | P3 | ☐ |
| IDN-07 | Fribordsmerke | Sirkel med linje midtskips på fartøy som har det. | – | P3 | ☐ |
| IDN-08 | Skrogsymboler | Thrustersymbol (hvit sirkel med propell), bulbsymbol (stilisert baugprofil som ligner «3»), og pil- eller V-merker som markerer posisjonen. Over vannlinja forut og akter. | Utvalget varierer: «V V ⊕», «⊕ 3 ▽», «> ⊕ <» | P3 | ☐ |
| IDN-09 | Produsentmerker | På kraner, vinsjer, radomer, flåter og maskiner. Bruk fiktive merker hvis ekte merker er et problem i spillet. | – | P3 | ☐ |
| IDN-10 | Dekaler som eget lag | Tekst og logo som dekal-mesh eller eget atlas, slik at samme skrog kan få nytt navn og merke. | Teknisk krav | P1 | ☐ |
| IDN-11 | Stor skroggrafikk | Logoer eller striper som dekker store deler av skroget og går over plateskjøter og krumning. Krever projisert dekal eller egen UV for å unngå strekk. | Nyere fartøy | P2 | ☐ |

---

## 14. Farger og materialer (MAT)

| ID | Element | Detaljer som gir realisme | Varianter / typisk | Pri. | ☐ |
|---|---|---|---|---|---|
| MAT-01 | Fargeskjema | Skrog, skanse, overbygg, dekk og utstyr. Noter RAL- eller hex-verdier. | Blått, rødt, grønt eller sort skrog med hvitt overbygg · kremfarget/beige overbygg og skanse · sort skrog med tynne hvite striper (vanlig i Storbritannia) · hvitt skrog med farget list (sjark) · okergule master og bommer (eldre) | P1 | ☐ |
| MAT-02 | Fargegrenser | Skarpe malingsgrenser mellom skrog og skanse, vannlinjestripe og bunnstoff. Grensene følger skrogets linjer, ikke en flat høyde, og stiger ofte mot baugen. | – | P1 | ☐ |
| MAT-03 | Marinemaling | Halvblank (roughness ca. 0,3–0,5), svak rulletekstur, malingslag (primer under toppstrøk) som synes ved slitasje. | – | P2 | ☐ |
| MAT-04 | Dekk | Antisklimaling (grov og matt), tårepletter, galvaniserte rister, tre. | – | P2 | ☐ |
| MAT-05 | Metaller | Galvanisert stål, rustfritt (blankt eller børstet), aluminium, bronse/messing, krom på sylinderstenger. | – | P2 | ☐ |
| MAT-06 | Gummi og plast | Slanger, fendere, kar, bøyer, flottører, flåtebeholdere. | – | P3 | ☐ |
| MAT-07 | Tau og nett | Slått eller flettet tau (tiling-tekstur, geometri på nært hold), wire, kjetting. Nett med alpha-tekstur på avstand og geometri på nært hold. | – | P2 | ☐ |
| MAT-08 | Glass | Tonet glass med refleks, smuss i kantene, saltrester. | – | P2 | ☐ |
| MAT-09 | Tekstiler | Presenninger, flagg, seil, sikkerhetsnett. | – | P3 | ☐ |
| MAT-10 | Propellbronse | Bronse med anisotrop refleks fra slipemerker (buede, radielle striper), blank navhette i rustfritt stål eller bronse. | – | P3 | ☐ |
| MAT-11 | Tre | Lakkert tre (dører, rekker, innredning), tjæret eller malt tre (skrog og dekk på trebåter), gråbleket der det er utsatt. | – | P2 | ☐ |

---

## 15. Slitasje og liv (SLT)

### 15.1 Detaljer

| ID | Element | Detaljer som gir realisme | Varianter / typisk | Pri. | ☐ |
|---|---|---|---|---|---|
| SLT-01 | Kantslitasje | Avskallet maling på kanter, trinn, rekkverk og karmer, med primer eller stål under. | – | P2 | ☐ |
| SLT-02 | Rennestriper | Rustrenner under lenseporter, spygatt, klyss, ankerlomme og lufterør. | – | P2 | ☐ |
| SLT-03 | Redskapsslitasje | Blankslitt stål der wire, tau og redskap gnir: hekkslipp, galge, sidehaler, rullklyss, toppen av skansen. | – | P2 | ☐ |
| SLT-04 | Vekst ved vannlinja | Grønn/brun algelinje og kalk, mest i baugen og ved hekken. | – | P2 | ☐ |
| SLT-05 | Salt og sot | Hvite saltavleiringer på overbygg og glass, hvite skrapestriper på mørke skrog, sot rundt eksosen. | – | P3 | ☐ |
| SLT-06 | Flekkmaling | Lysere eller annen nyanse der det er flekket med ny maling. | – | P3 | ☐ |
| SLT-07 | Arbeidsspor | Olje rundt vinsjer, fiskeskjell og blod på arbeidsdekket, våte flater, tang i redskap. | – | P3 | ☐ |
| SLT-08 | Bulker | Bulker i skansen, bøyde rekkverk, innbuling mellom spant (SKR-09). | Svært tydelig på eldre stålskrog, særlig i motlys | P3 | ☐ |
| SLT-09 | Is og snø | Ising på tak, rekkverk, master og dekk, snø i hjørner. Viktig for vinterfiske i nord. | Variant eller dynamisk effekt | P2 | ☐ |

### 15.2 Slitasjenivåer

Brukes til varianter i spillet, for eksempel brukte båter til salgs.

| Nivå | Beskrivelse | Weathering-styrke |
|---|---|---|
| 1 Ny | Rett fra verftet | 0–0,1 |
| 2 Velholdt | Rene flater, litt slitasje i arbeidssoner | 0,1–0,3 |
| 3 Normal drift | Rust i renner, slitasje i alle arbeidssoner, flekkmaling | 0,3–0,5 |
| 4 Slitt | Mye rust, falmet maling, bulker | 0,5–0,8 |
| 5 Forfallen | Opplagt eller vrak | 0,8–1,0 |

---

## 16. Mannskap, skala og ergonomi (MAN)

Feil skala avsløres raskt når en spillfigur står ved siden av utstyret. Verdiene er veiledende.

| ID | Element | Typisk mål | Pri. | ☐ |
|---|---|---|---|---|
| MAN-01 | Rekkverk og skanse | 1,0–1,1 m | P1 | ☐ |
| MAN-02 | Dører | Høyde 1,8–2,0 m, bredde 0,6–0,8 m, karm 0,3–0,6 m på værdekk | P2 | ☐ |
| MAN-03 | Dekkshøyde (dekk til dekk) | 2,3–2,8 m | P1 | ☐ |
| MAN-04 | Trapper og leidere | Trapper ca. 50–70°. Leidertrinn ca. 0,3 m fra hverandre. | P2 | ☐ |
| MAN-05 | Styrehusvinduer | Underkant ca. 1,0–1,1 m over dørken, høyde 1,0–1,5 m | P2 | ☐ |
| MAN-06 | Rør i rekkverk | Rør 30–50 mm, stolper 40–60 mm | P2 | ☐ |
| MAN-07 | Mannskapsfigur | 1,80 m skalareferanse, med hjelm, flytedress eller oljehyre, refleks, hansker og støvler | P1 | ☐ |
| MAN-08 | Arbeidshøyder | Sorteringsbord ca. 0,9 m, kontrollpulter ved vinsjer og kraner | P3 | ☐ |

---

## 17. Miljø og presentasjon (MIL)

| ID | Element | Detaljer som gir realisme | Pri. | ☐ |
|---|---|---|---|---|
| MIL-01 | Vannlinje og skum | Kontaktlinje mellom skrog og vann, skum ved baug og hekk, våt sone over vannlinja. | P1 | ☐ |
| MIL-02 | Baugbølge og kjølvann | VFX som avhenger av fart. Fra drone synes det V-formede kjølvannet og den lysere, turkise propellstrømmen tydelig. | P2 | ☐ |
| MIL-03 | Sprut | Sjøsprut over baugen i sjøgang. | P3 | ☐ |
| MIL-04 | Måker | Fugler rundt fartøyet under fiske og pumping. | P3 | ☐ |
| MIL-05 | Lysscenarier | Sol, overskyet, skumring, natt med arbeidslys, tåke. | P2 | ☐ |
| MIL-06 | Sjøtilstand | Stille, moderat og hard sjø, som styrer rulling og stamping. | P2 | ☐ |
| MIL-07 | Havn og kai | Fortøyningstau til kai, fendere mot kaikanten, refleksjoner i vannet, nabofartøy, kveldslys. | P2 | ☐ |
| MIL-08 | Kyst og fjord | Fjell, skjær og tåke, som endrer lyset og refleksene på skroget. | P3 | ☐ |
| MIL-09 | Dokk | Fartøyet på kjølblokker med hele undervannsskroget synlig, krittmerker og tall fra dokkingen. Til visning og verkstedscener. | P3 | ☐ |

---

## 18. Ringnot (RNG)

| ID | Element | Detaljer som gir realisme | Varianter / typisk | Pri. | ☐ |
|---|---|---|---|---|---|
| RNG-01 | Kraftblokk | Hydraulisk blokk (V-skive med gummiforing, eller trommel med store flenser/hjulskiver med eiker eller lettelseshull) som henger i svivel fra kran eller bom. Hydraulikkslanger og fri pendel. | – | P1 | ☐ |
| RNG-02 | Notkran eller blokkbom | Kranen eller bommen som bærer kraftblokka, ofte høyt plassert akter. | Eldre: bom fra masta | P1 | ☐ |
| RNG-03 | Notbinge | Stor binge akter der nota ligger: lave skott, slitesterk bunn, nota som mørk masse med flottører og ringer. | – | P1 | ☐ |
| RNG-04 | Nothaler og notlegger | Nothaler med tre valser (Triplex-prinsippet), mellomvalser, og notkran eller legger som stabler nota i bingen. Egne stablere for korkline og blytelne. | – | P2 | ☐ |
| RNG-05 | Sidehaler | Hydraulisk enhet med gummibelagte valser på skutesiden, til haling av nota. | – | P2 | ☐ |
| RNG-06 | Snurpevinsj | To-trommels vinsj midtskips med snurpewire. | – | P2 | ☐ |
| RNG-07 | Snurpeblokker | Blokker på siden (galge eller utligger) der snurpewiren går ut. | – | P2 | ☐ |
| RNG-08 | Ringer og ringstokk | Snurperinger i stål i bunnen av nota, ringstokk eller ringnål der de samles ved haling. | – | P3 | ☐ |
| RNG-09 | Korkline | Flottørline med tett rad av flottører. | Gule, oransje eller hvite | P2 | ☐ |
| RNG-10 | Notbøye | Stor bøye med lys og radarreflektor som markerer notenden når nota settes. | – | P2 | ☐ |
| RNG-11 | Notgjerde | Høye stolper med tau langs bakken som hindrer at nota fester seg. | – | P2 | ☐ |
| RNG-12 | Pumping | Fiskepumpe med sugeslange og slangekran (FSK-01/02). Nota «tørkes» langs siden og fisken suges ut. | – | P1 | ☐ |
| RNG-13 | Sonarer | Senkbare sonarer forut. Bare hullåpningene synes. | – | P3 | ☐ |
| RNG-14 | RSW-tanker | Mange tankluker, lufterør og kjøleanlegg. | – | P2 | ☐ |
| RNG-15 | Nottrakt | Stort buet rør med utvidet trakteåpning under kraftblokka, skrått ned mot skutesiden. Nota trekkes trolig gjennom når den hales og legges ombord (ikke verifisert). | Sett på Sulebas og Trønderhav | P1 | ☐ |

---

## 19. Pelagisk trål (PTR)

| ID | Element | Detaljer som gir realisme | Varianter / typisk | Pri. | ☐ |
|---|---|---|---|---|---|
| PTR-01 | Nettromler | Store tromler akter med trålen viklet på (farget nett, flottører og tauverk synlig). | 1–3 stk. | P1 | ☐ |
| PTR-02 | Trålvinsjer | Splittvinsjer med wire (varp), ofte under dekk eller i vinsjrom med åpninger. | – | P2 | ☐ |
| PTR-03 | Galge og hekkrull | Portal over hekken med blokker for varpene, hekkrull. Rustfrie beskyttelsesbøyler på hekken. | Hekkportal med to høye tårn og navnet mellom | P1 | ☐ |
| PTR-04 | Pelagiske tråldører | Store, krumme dører, ofte malt i rederfarger, hengende i galgen eller på hekken under gange. | – | P1 | ☐ |
| PTR-05 | Sondevinsj | Kabelvinsj for trålsonden. | – | P3 | ☐ |
| PTR-06 | Trål | Trålpose (sekk) og vinger, på dekk, på trommel eller i sjøen (egen redskapsmodell). | – | P2 | ☐ |
| PTR-07 | Pumping fra sekk | Sekken ligger langs siden, og pumpeslangen føres inn med kran. | – | P2 | ☐ |
| PTR-08 | Slangekran | Kran med slangetrommel på spissen for pumpeslangen, ofte på hekkhjørnet. | – | P2 | ☐ |

---

## 20. Bunntrål og hekktråler (BTR)

| ID | Element | Detaljer som gir realisme | Varianter / typisk | Pri. | ☐ |
|---|---|---|---|---|---|
| BTR-01 | Hekkslipp | Skrå rampe i hekken ned til vannet, med slitejern, ofte port og sideskott. Blankslitt stål. | – | P1 | ☐ |
| BTR-02 | Galge/A-ramme | Hekkportal over slippen og/eller sidegalger, med blokker. | – | P1 | ☐ |
| BTR-03 | Tråldører | Tunge ståldører som henger i galgene på hekken, med rust og blankslitt sko. | Rektangulære, ovale eller V-formede | P1 | ☐ |
| BTR-04 | Trålvinsjer | Splittvinsjer på dekk eller under shelter, med wire til galgen. | 2–4 stk. | P2 | ☐ |
| BTR-05 | Nettromler | Tromler over eller foran slippen, ofte i tandem, med trål. | 2–4 stk. | P1 | ☐ |
| BTR-06 | Hjelpevinsjer | Vinsjer for å dra sekken opp slippen, splitte fangst og håndtere dørene. | – | P2 | ☐ |
| BTR-07 | Fiskeluke | Hydraulisk luke i dekket der sekken tømmes ned i fangstmottaket. | – | P2 | ☐ |
| BTR-08 | Grunnline | Bobbins eller rockhopper (gummiskiver på kjetting eller wire), på dekk eller trommel. | – | P2 | ☐ |
| BTR-09 | Tvillingtrål | Midtvekt (klump) og tre wire for dobbeltrål. | Reketrål | P3 | ☐ |
| BTR-10 | Shelterdekk | Lukket arbeidsdekk med åpning akter mot slippen, vinduer langs siden. | – | P1 | ☐ |

---

## 21. Snurrevad og fly-shooting (SNV)

| ID | Element | Detaljer som gir realisme | Varianter / typisk | Pri. | ☐ |
|---|---|---|---|---|---|
| SNV-01 | Tauspoler | Store hydrauliske spoler eller tautromler for de lange tauene, ofte i par. | – | P1 | ☐ |
| SNV-02 | Snurrevadvinsj | To-trommels vinsj for tauene. | – | P2 | ☐ |
| SNV-03 | Nettrommel | Trommel for voden, ofte akter. | – | P1 | ☐ |
| SNV-04 | Hekkrull eller sidegalge | Valse eller galge der tau og vod går ut. | – | P2 | ☐ |
| SNV-05 | Tau | Lange tau med blykjerne, ofte sorte eller grønne, i kveiler. | – | P2 | ☐ |
| SNV-06 | Bøye | Flaggbøye med radarreflektor for første tauende. | – | P3 | ☐ |
| SNV-07 | Arbeidsdekk | Langt, åpent dekk akter med fangstbinge og sorteringsbord. | – | P1 | ☐ |

---

## 22. Line (LIN)

| ID | Element | Detaljer som gir realisme | Varianter / typisk | Pri. | ☐ |
|---|---|---|---|---|---|
| LIN-01 | Haleport | Åpning med luke i skutesiden der lina hales inn, med haleplass innenfor. En åpen port viser lys og utstyr innenfor. | Ofte SB forut | P1 | ☐ |
| LIN-02 | Linehaler | Hydraulisk haleskive ved haleporten, krokløser, gaffel. | – | P2 | ☐ |
| LIN-03 | Setteluke | Åpning eller renne akter der lina settes ut. | – | P2 | ☐ |
| LIN-04 | Magasiner og egnemaskin | Linemagasiner (stativ med krokskinner) under dekk, synlig gjennom åpninger. | – | P3 | ☐ |
| LIN-05 | Bøyer og staker | Blåser, bøyer og høye staker med flagg, radarreflektor og blinklys, lagret i stativ på dekk. | – | P2 | ☐ |
| LIN-06 | Ankre | Lineankre og dregger. | – | P3 | ☐ |
| LIN-07 | Shelterdekk | Lukket dekk med overbygget forut. | – | P1 | ☐ |
| LIN-08 | Linebaljer | Baljer eller kar med opplagt line og kroker. | Småbåtline | P2 | ☐ |

---

## 23. Garn (GRN)

| ID | Element | Detaljer som gir realisme | Varianter / typisk | Pri. | ☐ |
|---|---|---|---|---|---|
| GRN-01 | Garnhaler | Hydraulisk garnspill på rekka, med rulle eller valse på skutekanten. | Ofte SB forut | P1 | ☐ |
| GRN-02 | Garnbinger | Binger eller kasser der garnene legges. | – | P2 | ☐ |
| GRN-03 | Settebord | Bord eller renne for setting akter. | – | P2 | ☐ |
| GRN-04 | Bøyestaker | Staker med flagg, radarreflektor og lys, pluss blåser. | – | P2 | ☐ |
| GRN-05 | Garn | Nett med flottører på overtelna og søkke på undertelna. | – | P2 | ☐ |
| GRN-06 | Utplukking | Plass og utstyr for å plukke fisk ut av garnet. | – | P3 | ☐ |

---

## 24. Teine og krabbe (TEI)

| ID | Element | Detaljer som gir realisme | Varianter / typisk | Pri. | ☐ |
|---|---|---|---|---|---|
| TEI-01 | Teiner | Riktig teinetype, stablet i sjikt på dekk og surret. | Snøkrabbe: konisk, ofte grønne og sorte i tette rader. Kongekrabbe: stor firkantet stålramme. Krabbe/hummer: små. | P1 | ☐ |
| TEI-02 | Teinehaler | Hydraulisk haler eller blokk på davit ved rekka. | – | P1 | ☐ |
| TEI-03 | Teinebord | Bord eller rampe der teinene tømmes og egnes, med sklie for utsetting. | – | P2 | ☐ |
| TEI-04 | Kran | Kran for stabling av teiner. | Stor på havgående krabbefartøy | P2 | ☐ |
| TEI-05 | Levendetanker | Tanker eller kar med sirkulert sjøvann for levende fangst. | – | P2 | ☐ |
| TEI-06 | Bøyer og liner | Bøyer merket med fartøyets merke, tau i kveiler. | – | P2 | ☐ |
| TEI-07 | Sorteringsbord | Bord for sortering av fangsten. | – | P3 | ☐ |

---

## 25. Fabrikktråler (FAB)

| ID | Element | Detaljer som gir realisme | Varianter / typisk | Pri. | ☐ |
|---|---|---|---|---|---|
| FAB-01 | Høyt skrog | Flere dekk over vannlinja, fabrikkdekk med vinduer langs siden. | – | P1 | ☐ |
| FAB-02 | Lossekraner | Store kraner for lossing av frossenfisk og paller. | – | P1 | ☐ |
| FAB-03 | Lasteluker | Store luker til fryselasterommet. | – | P2 | ☐ |
| FAB-04 | Skorstein og avtrekk | Kraftig skorstein, avtrekk fra fryseanlegg og eventuell fiskemelfabrikk. | – | P1 | ☐ |
| FAB-05 | Større innredning | Flere lugarvinduer og større bro. | – | P2 | ☐ |
| FAB-06 | Helikoptervinsjing | Merket vinsjeområde på dekk. | Bare noen fartøy | P3 | ☐ |

---

## 26. Sjark og små kystfartøy (SJK)

| ID | Element | Detaljer som gir realisme | Varianter / typisk | Pri. | ☐ |
|---|---|---|---|---|---|
| SJK-01 | Skrogmateriale | GRP (gelcoat, støpte detaljer), tre (klink eller kravell, bord og spant) eller aluminium (knekkspant). | – | P1 | ☐ |
| SJK-02 | Styrehus | Lite styrehus akter, midtskips eller forut, ofte med mange vinduer og takrekke. | Eldre: kalesje eller åpen båt | P1 | ☐ |
| SJK-03 | Juksamaskiner | Elektriske juksamaskiner (boks med display, ofte rød eller grå) på stolpe ved rekka. | 2–4 stk. | P2 | ☐ |
| SJK-04 | Haler | Liten hydraulisk line- eller garnhaler på rekka. | – | P2 | ☐ |
| SJK-05 | Eksos | Eksosrør gjennom styrehustaket eller våt eksos i skrogsiden. | – | P2 | ☐ |
| SJK-06 | Mast | Liten mast med radom, lanterner og antenner, ofte nedfellbar. | – | P2 | ☐ |
| SJK-07 | Fendere og lister | Gummilist, fendere, bildekk. | – | P2 | ☐ |
| SJK-08 | Dekksutstyr | Fiskekasser, kar, tau, bøyer, presenning, lensepumpe. | – | P3 | ☐ |
| SJK-09 | Klassisk snekke | Åpen trebåt med lite motorhus, rorkult og tofter. | Variant, f.eks. startbåt i spillet | P2 | ☐ |
| SJK-10 | Arbeidsdekk | Rustfrie sorterings- og bløggekar, bøtter, baljer, kasser, spyleslange, renne over hekken, rørramme med opprullede hydraulikkslanger. | – | P2 | ☐ |
| SJK-11 | Støttesegl | Lite seil på aktermasta som holder baugen mot vinden, satt eller rullet på bom. | Blått, rødt eller hvitt | P2 | ☐ |
| SJK-12 | Masterigg | A- eller trebeinsmast i rør med radom, lanterner og antenner, bommer med blokker, vant og stag (MST-12). | – | P2 | ☐ |
| SJK-13 | Bøyer og flagg | Oransje og rosa bøyer (også brukt som fendere), vakeflagg på stokker, grønne eller oransje flagg på staker. | – | P3 | ☐ |

---

## 27. Internasjonale varianter (INT)

| ID | Element | Detaljer som gir realisme | Varianter / typisk | Pri. | ☐ |
|---|---|---|---|---|---|
| INT-01 | Utriggerfartøy | Utriggerbommer på hver side med blokker, for bomtrål eller dobbeltrål. | Amerikanske rekebåter, nederlandske bomtrålere | P1 | ☐ |
| INT-02 | Tunfisksnurper | Helikopterdekk, notbåt (skiff) på hekkslippen, kråkereir i masta, speedbåter. | – | P1 | ☐ |
| INT-03 | Blekksprutjigger | Rader med store lamper over dekket, jiggemaskiner langs rekka. | – | P1 | ☐ |
| INT-04 | Havgående krabbefartøy | Høye teinestabler, kran midtskips, overbygg forut. | Beringhavet | P1 | ☐ |
| INT-05 | Troller | Lange trollingstenger og stabilisatorbommer med paravaner. | Stillehavet | P2 | ☐ |
| INT-06 | Stang-og-line tunfiskbåt | Stenger stående i stativ, tanker for levende agn, vannsprederør langs rekka, to master med bommer, tredekk. | Baskerland/Spania | P1 | ☐ |

---

## 28. Byggerekkefølge

1. Prosjektark og referanser (kap. 2).
2. Blokkmodell av P1-silhuetten, med referansebilder som kamerabakgrunn.
3. Skrog fra linjer eller tegning (SKR), deretter dekk og skanse (DKS).
4. Overbygg og master (OVB, MST).
5. Hovedutstyr fra typemodulen (P1).
6. Sekundærdetaljer (P2), deretter mikrodetaljer (P3).
7. UV, materialer og trim sheets (MAT).
8. Dekaler (IDN).
9. Slitasje (SLT).
10. Rigging og lys (KRN, LYS, kap. 30.4).
11. LOD og kollisjon (kap. 31.4).
12. Benchmark-renders og vurdering (kap. 30).

---

## 29. Vanlige feil som gjør modeller urealistiske

- For tykke rekkverk og rør.
- Skansekledning uten stag på innsiden.
- Helt flate skrogplater, uten skjøter eller buler.
- Symmetrisk utstyr. Ekte fiskefartøy er asymmetriske (kraner, haler, pumper, tekst).
- Kraner uten hydraulikkslanger og slangeløkker ved leddene.
- Tau og wire uten nedheng.
- Vannlinje uten bunnstoff, vannlinjestripe eller algelinje.
- Manglende lenseporter, spygatt og overbordsutløp, og ingen rennestriper under dem.
- Vinduer uten skråstilling, karm og refleks, og ingenting bak glasset.
- For få lys, antenner og småting på mast og tak.
- Dører uten karm.
- Feil størrelse på radar og radomer, noe som ødelegger skalaen.
- Altfor rent fartøy, eller jevn skitt overalt i stedet for slitasje der det faktisk slites.
- Fargegrense i rett horisontal linje i stedet for å følge skrogets linjer.
- Tomme tak og øvre dekk, som synes fra drone og skrått spillkamera.
- Undervannsskrog uten offeranoder, rorhæl, tauvern og thrusterrister.
- Småbåter uten vant og stag.
- Ingen dypgangsmerker eller skrogsymboler.

---

## 30. Benchmark og kvalitetskrav

### 30.1 Poeng per element

| Poeng | Kriterium |
|---|---|
| **0** | Mangler. |
| **1** | Forenklet, eller bare som tekstur/normal map der det kreves geometri. |
| **2** | Korrekt form, proporsjon og plassering mot referansen. |
| **3** | Som 2, med ferdige PBR-materialer, riktige dekaler/farger og (der det kreves) rigging/animasjon. |

### 30.2 Vekting og terskler

- Vekt: **P1 × 3**, **P2 × 2**, **P3 × 1**. Elementer merket «IR» (ikke relevant) holdes utenfor.
- **Score** = Σ(poeng × vekt) / Σ(3 × vekt) × 100 %.
- **Hardkrav:** alle relevante P1-elementer må ha minst 2 poeng, ellers er modellen ikke godkjent
  uansett score.

| Nivå | Score |
|---|---|
| Hero-klar (nærbilder, cutscenes) | ≥ 90 % |
| Spillklar | 75–89 % |
| Under arbeid | < 75 % |

### 30.3 Standard kameraer

Render alle modeller fra de samme kameraene, så de kan sammenlignes med hverandre og med foto.

| Kamera | Oppsett | Formål |
|---|---|---|
| K1 | SB baug-kvarter, 30–45° fra baugen, 2–5 m over sjøen, 85–135 mm | Sammenligning med typiske fartøyfoto |
| K2 | BB hekk-kvarter, samme høyde | Arbeidsdekk og hekk |
| K3 | Rett fra siden, ortografisk | Profil mot tegning |
| K4 | Ovenfra, ortografisk | Dekksplan mot GA |
| K5 | På arbeidsdekket i øyehøyde (1,7 m) | Skala og detaljer på nært hold |
| K6 | K1 om natta, lysstilstand «Fiske» | Lys og emittere |
| K7 | Drone, 30–60 m høyde, 40–60° ned mot fartøyet | Tak, dekk og kjølvann sett ovenfra |

Ved foto-referanse: legg renderet over fotoet med 50 % opasitet og sjekk silhuett, plassering av
overbygg, master, kraner og fargegrenser.

### 30.4 Funksjonskrav for rigging og animasjon

| Objekt | Krav |
|---|---|
| Radarer (MST-03) | Rotasjon om egen akse, ca. 24–48 rpm |
| Kraner (KRN) | Sving, løft, knekk/teleskop med constraints. Hydraulikksylindre følger leddene. |
| Kraftblokk, haler, tromler | Rotasjon. Hengende blokker pendler fritt i svivel. |
| Slanger, tau og wire | Kurve/bones med fysikk eller drevet kjedelinje og riktig nedheng |
| Redskap i sjøen | Kurvebaserte tau med spenning, flottører som følger tauet |
| Bøyer og fendere | Pendel og oppdrift |
| Søkelys (LYS-08) | Pan/tilt med lyskjegle |
| Anker (FOR-02) | Kan senkes, kjetting som kurve/array |
| Luker og porter | Åpne/lukke (luker, hekkport, haleport) |
| Lys (kap. 9) | Lysstilstander kan byttes (LYS-10) |
| Flagg (MST-10) | Vind-animasjon |

---

## 31. Tekniske Blender-standarder

### 31.1 Skala og orientering

- Metrisk, **1 Blender-enhet = 1 m**, scale applied (1,1,1) på alle mesher.
- Baugen peker mot **−Y**, slik at Front-visning (numpad 1) viser baugen. Opp = +Z.
- Origin i skjæringspunktet **senterlinje × midtskips × konstruksjonsvannlinje**. Det forenkler
  oppdrift og bølgebevegelse i spillmotoren.

### 31.2 Navngiving

```
<SKIP>_<KAT>_<Element>[_<Side>][_<Nr>]_LOD<n>

Eksempler: SUL_KRN_Akterkran_Bom_LOD0
           SUL_FOR_Ankerlomme_BB_LOD0
           SUL_MST_Radar01_Antenne_LOD0
```

- `SKIP` = 3-bokstavers kortkode fra prosjektarket. `KAT` = kategorikoden i denne listen.
  `Side` = `BB`, `SB` eller `CL`.
- Custom property `bench_id` på objektet = ID fra listen (f.eks. `RNG-01`).

### 31.3 Collections

```
<SKIP>
├── <SKIP>_SKR   Skrog
├── <SKIP>_DKS   Dekk og struktur
├── <SKIP>_OVB   Overbygg
├── <SKIP>_MST   Master og elektronikk
├── <SKIP>_FOR   Forskip, anker og fortøyning
├── <SKIP>_FRM   Fremdrift
├── <SKIP>_KRN   Kraner
├── <SKIP>_FSK   Fangsthåndtering
├── <SKIP>_<TYPE>  Typemodul(er), f.eks. RNG, BTR
├── <SKIP>_RED   Redskap i sjøen (separat, byttes per fiskescene)
├── <SKIP>_LYS   Lys og emittere
├── <SKIP>_SIK   Sikkerhetsutstyr
├── <SKIP>_IDN   Tekst og logoer (dekaler)
├── <SKIP>_RIG   Armatures, constraints, kurver
├── <SKIP>_COL   Kollisjon (forenklede convex hulls) og oppdriftspunkter
└── <SKIP>_LOD1 / _LOD2 / _LOD3
```

### 31.4 Budsjett

Veiledende for et stort havfiskefartøy. Skaler ned for mindre båter og juster etter spillmotoren.

| LOD | Bruk | Trekanter | Teksturer |
|---|---|---|---|
| LOD0 | Hero/nærbilde | 150–300 k | Skrog med tiling og masker. Hero-detaljer ca. 512 px/m. |
| LOD1 | Normal spillavstand | 60–100 k | Ca. 256 px/m |
| LOD2 | Lang avstand | 15–30 k | P2-detaljer bakt til normal map |
| LOD3 | Silhuett/horisont | 2–5 k | Bare P1 |

### 31.5 Gjenbruk

- Rekkverk, leidere, trinn, rister, lenseporter og lufterør som **trim sheet** og modulære deler i
  et felles bibliotek for alle fartøy.
- Felles bibliotek også for antenner, radarer, radomer, lanterner, søkelys, flåter, redningsbøyer,
  pullerter, klyss, kar og kasser.
- Tekst og logoer som dekaler (IDN-10).
- Speil BB/SB der det går, men husk at utstyret **ikke** er symmetrisk.

---

## Endringslogg

| Dato | Endring |
|---|---|
| 2026-10-29 | Første versjon. Generell liste for alle fartøytyper, med Sulebas som utfylt eksempel. |
| 2026-10-30 | Utvidet etter analyse av ti nye referansebilder ([referanseanalyse-runde-2.md](referanseanalyse-runde-2.md)): epoker (kap. 1.2), fartøytypen TUR, nye punkter i SKR, DKS, OVB, MST, FOR, FRM, LYS, SIK, KRN, IDN, MAT, SLT, MIL, RNG, PTR, LIN, SJK og INT, og dronekamera K7. K1/K2 byttet side. |
