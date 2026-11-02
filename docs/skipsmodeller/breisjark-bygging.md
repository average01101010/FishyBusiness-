# Breisjarken: slik ble modellen bygd på nytt (02.11.2026)

Det korte byggedokumentet for `breisjark` («Sjark 36 fot med bakk og ly», `tools/boats/malo36.py`). Grunnlaget med avvikslista, lanternene,
arbeidsflyten, kritikksløyfen og selvvurderingen står i `breisjark-grunnlag.md`; arbeidsmåten i `sulebas-bygging.md`.

## 1. Kildene

Tabellene i det gamle skriptet, målt på generalarrangementet og databladet 02.10.2026 (92,4 px/m). Tegningen ligger ikke i repoet og var
ikke med i økta, så overlegget er lagt mot den gamle modellens profil (K3), som ble lagt over tegningen da. Alt på tvers og under
vannlinja er valgt og veid i `check()`.

## 2. Skriptet

- **Malen:** `havsjark35.py` for koden (`Mesh`, snittet med kjølen, `hull_shell`, hullene, lysningene, broa, `check()`), formen fra tegningens
  tabeller lest med `pchip`.
- **Snittet:** kroppen som én kubisk kurve fra kjølrota til ripa. To ting var nye her:
  1. Ripa hopper 0,9 m opp ved bakken og 0,7 m ned akter for lyet. Kurven tegnes derfor til en jevn linje over ripa (`z_ref`, `h_ref`:
     halvbredden ført opp langs utfallet fra en glattet ripe) og klippes ved den ekte ripa.
  2. I baugen står ripa så høyt over kjølen at bunnlinja og sidelinja møtes under kjølen, og så ikke i det hele tatt (bunnreisning +
     utfall over 90°). Hjørnet tas med en myk positiv del og et mykt minimum, så snittet går jevnt over til en V.
- **Lyet:** veggene står på kappen, 4 mm utenpå skroget så skjøten synes. Babord har to vinduer i ekte hull. Styrbord er åpen fra
  3,10 til 5,88 for arbeidet (Jonas), med halerulla forut i åpningen. Taket henger over akterdekket på to stolper ned til skansens kapp.
- **Styrhuset:** tegningens plan med frontruter som heller forover. Veggene går 8 cm høyere enn på tegningen, så dørken får 1,85 m fri
  høyde. Dørken ligger i bakkens høyde, og veggene går ned til akterdekket bak bakken. Skallet er åpent oppe, og takets underside
  lukker det.
- **Broa:** konsollen om styrbord med skrått dashbord og skjermene mot skipperen, felles ratt, enspak og sete (`fittings.py`). VHF-en
  henger i taket, og om babord står benk og kartbord.
- **Galgen over hekken** står på to stolper på speilets kapp og på mastas bein, med nettrulla under.
- **Fjernmodellen** (`build(False)`): lyets vegger med fem stasjoner og én rad, grovere sylindre, ingen bordbein eller detaljer på
  vinsjen. Den har 3 918 trekanter, som blir 11 754 punkter i lokalflåten.

## 3. Spillet

- `13-instruments.js` `JIG_Z` tar nå plassene per side (`{1: [...], '-1': [...]}`); breisjarken får juksamaskinene om styrbord i den åpne
  sida og på akterdekket.
- Ingen andre endringer i spillet. Typenavnet, malingssonene (1 skrog, 2 vannlinjestripa, 3 skansen og overbygget, 4 dekket) og alle
  ankrene står; `stairs` er nytt (trinnene fra gangen til bakken om styrbord).

## 4. Verktøy

`qa/clip_malo36.py`: klasjsjekken for denne båten. Den måler skansens innside etter høyden, fra foten til under kappen; den vannrette
målingen ved foten ga falske treff i den høye akterskansen. `tests/ma36shot.py` tar bildene i spillet (`TAG=for`/`etter`).

## 5. Tall

61 259 trekanter nær, `lodm` 39 999, fjern 3 918, glass 194, GLB 3,6 MB (før: 25 133 / 2 815, 0,84 MB). Deplasementet er 21,9 t ved
tegningens vannlinje (før 29,5). Dypgangen er 2,00 m med skoen. Lengden i båndet til `vessel3d` er 11,12 m og bredden 4,11 m.
