# Byggingen av trebåten: slik ble startbåten revidert (31.10.2026)

Kort byggedokument for revisjonen av `trebat` («Trebåt 23 fot (7,0 m), 8 hk semidiesel»), skriptet `tools/boats/snekke23.py`, etter
arbeidsmåten i `sulebas-bygging.md`. Målene, avvikslista og rundene står i `trebat-grunnlag.md`.

## 1. Kildene

Det fantes ingen tegning og ingen bilder av båten (Jonas 31.10.2026). Grunnlaget er spillets data (`VESSELS.trebat`: 7,00 × 2,26 m,
dypgang 0,62 m, 1,9 t, 1956, 8 hk semidiesel), Jonas' ord fra 05.10.2026 (klinkbygd spissgatter, gammelt ubehandlet treverk, ingen
fendere, ikke stevnbånd, rorkult) og 31.10.2026 (ingen flåte eller livbøye, «ganske simpel»), og vanlige mål for typen (en 23 fots
klinkbygd båt på FINN med 0,90 m dybde og 2,28 m bredde; en Sørlandssnekke på 7,01 m med Marna semidiesel). **Ingen mål er målt på
et bilde.** Overlegget sjekker at modellen følger sine egne tabeller, og `check()` sjekker tabellene mot dataene.

## 2. Skriptet

Skrevet på nytt etter `ringnot38.py` (det gamle skroget var ni løse bånd som overlappet og kunne ikke rettes). Funksjonene spillet og
ankrene bygger på, heter det samme (`hb`, `zs`, `sec`, `sec_n`, `Z_FLOOR`, `anchors`, `kit_places`, `bower`, `cap_obj`).

- **Linjene som tabeller i meter** med kilden i kommentaren: forstevnens forkant (`STEMF`) og bredden på stevnen, akterstevnens
  akterkant (`post_aft`), sponningen rundt hele ryggen (`_rabbet`: opp akterstevnen, over dødveden, langs kjølen og opp forstevnen),
  ripa (`zs`) og halvbredden (`_HB`). `Tab` er den samme monotone kubikken som `bpyutil.interp`, men med stigningene regnet én gang.
- **Snittene** (`sec`) går fra sponningen (y = `SID`, halve sidingen av kjølen) til ripa, med reising i kjølbordet og en slakk kimming;
  formen (`SEC_P`) og kjølens dybde (`ZR_K` = 0,22) er satt så volumet under vannlinja blir 2,11 t (`check()`).
- **Skroget er én flate per side** (`hull`): rutenettet har rader etter bordgangene, to rader i hvert land med bordkanten mellom, og
  bordet skrår fra landet (trinnet `LAP`) til neste land. Hvert bords hette lander på sponningen i sin egen høyde (`eaten`, `land_g`):
  ni landinger jevnt opp forstevnen og opp dødveden og akterstevnen. Landet høvles bort de siste 0,45 m inn mot sponningen (`lap`,
  gangene). Innsida er den samme flaten trukket inn bordtykkelsen langs normalen. Skroget skjæres langs vannlinja (`bisect_plane`), så
  tjæra og slimet får skarpe kanter.
- **Ryggen** (`backbone`) er én profil (kjøl, forfot, stevn, dødved, akterstevn) sidet 9 cm, med **propellbrønnen skåret ut som ekte
  hull** (boolsk differanse), kantene rundet (Bevel) og malt etter høyden; hogget og forstevnens innside er et smalere bånd innenfor
  sponningen, så det aldri ligger i plan med bordene.
- **Inni:** bøyde spant hver 25 cm (`frames`, satt inn der sida smalner så den smale kanten ikke går gjennom bordene), bunnstokker som
  følger bordenes innside, dørk av løse bord skåret etter skroget, tre tofter på tofteveger med kne, fordekk og akterdekk med bjelke,
  innvegret, ripebordet, skvettlista (smalner mot endene), baugband og hekkbord.
- **Motoren:** motorkassa av bord med not, hjørnestolper og lokk med to ekte hull (sylinderen og eksosen), sylinderen med vannkappe,
  topplokk med pinnebolter og glødehodet, blåselampeholderen, brennoljepumpa og smøreapparatet med kobberrør, eksosrøret med
  lyddemper, stag og sot ved munningen, svinghjulet, gir- og gasshendelen og fyllelokket på lokket.
- **Felles beslag fra `fittings.py`:** propellen (`F.propeller`, tre blad, fast stigning), rørene (`F.pipe`), og grunnlaget for naglene
  (`F._onb`). Det som er eget for en trebåt (nagler, spant, kne, ror av bord), ligger i skriptet.
- **Lanternene:** sidelanternene i lyktehus med halvrund linse og skjerm innenbords på ripa ved fremre tofte; den hvite rundtlysende på
  en stake surret til babord ripe like forut for akterste tofte, 1,03 m over sidelanternene (vedlegg I 2(d)) og utenfor rorkultens
  sveip (rorkulten svinger 41° hver vei i spillet, så hele akterdekket ligger i sveipet).
- **Delene:** `prop` (propellen), `tiller` (rorkult, ror og flaggstang, origo i rorhodet), `cap` (lokket innenfor ripa). Roret er av tre
  bord med jernbånd og tapper, hengt på akterstevnen med rorhaker.

## 3. Kritikksløyfen

Verktøyene ligger i økta sin kladdemappe (`scratchpad/t23/`) og er små nok til å skrives på nytt: `shots.py` (tolv vinkler, ortografisk
fra siden, forfra og akterfra, skrått, ovenfra, inni, under), `overlay.py` (linjene fra tabellene over den ortografiske siderendringen),
`clipcheck.py` (punktene i innredningen og utstyret mot bordenes innside, langs normalen i snittet), `snekke23.py check` og eksporten
(`fast dry`). Rundene står i grunnlaget kap. 6.1.

Det sløyfen fant: bunnstokkene stakk ut gjennom bunnen (5 028 punkter), spantenes smale kant gikk gjennom bordene i akterskipet,
innvegret og dekkskanten gikk gjennom bordene der sida har utfall, akterste tofte var målt midt på i stedet for i den smale enden,
deplasementet var 3,26 t mot 1,9 t (arvet fra det gamle skroget), og den hvite lykta sto i rorkultens sveip. Klasjsjekken endte på 0.

## 4. Tall

| | Før | Etter |
|---|---|---|
| Nær (`lod0`) | 17 906 trekanter | 81 616 trekanter |
| Middels (`lodm`) | – | 36 499 (Decimate; delene rorkult og propell kommer i tillegg) |
| Fjern (`lod1`) | 1 416 | 2 694 |
| GLB | 853 KB | 5 294 KB (7,2 MB i base64) |

GLB-en er stor for en båt alle laster først. Den største delen er skroget (to flater per side med 45 og 36 rader på 161 stasjoner).
Vil vi ha den ned, er det første å ta antallet stasjoner midtskips, der skroget er nesten rett.

## 5. Kjøring

    uv venv -p /usr/bin/python3.11 /opt/bpyenv && VIRTUAL_ENV=/opt/bpyenv uv pip install bpy==4.5.4 pillow   (bpy 4.5.4 krever Python 3.11)
    /opt/bpyenv/bin/python tools/boats/snekke23.py check       kontrollene mot tabellene
    /opt/bpyenv/bin/python tools/boats/snekke23.py fast dry    GLB-en bare i tools/boats/out
    /opt/bpyenv/bin/python tools/boats/snekke23.py export      til src/data (og kontrollbildene uten fast)
    python3 tests/t23shot.py                                   skjermbilder fra spillet i begge formater (TAG=navn)

## 6. Det som ikke kan måles, og hva som ville gjort det bedre

- Alle mål er antatt for typen; ingen er lest av et bilde av denne båten. Et bilde rett fra siden av en 23 fots motorsnekke med kjent
  lengde (museumsbåt eller annonse), et rett forfra eller akterfra og et ovenfra inn i båten ville låst formen, toftene og motorkassa.
- Deplasementet blir 2,11 t mot 1,9 t i dataene (11 % over). Lenger ned blir bunnen en skarp V som ikke ligner en snekke. Dataene er
  ikke endret.
- Materialene (F2): treverket er farger og slitasje per hjørne; årringer, kalfatring og skiftende farge per bord i lengderetningen
  kommer først med teksturer.

## Endringslogg

- 31.10.2026: første versjon.
