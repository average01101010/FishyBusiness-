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

## 6. Runde 2 (OB11, 11.11.2026): det som er lært

Hva som ble gjort, står i `breisjark-grunnlag.md` 10.9. Det som gjelder neste båt:

- **En endring i skrogets bredde flytter spillets plasser, også når alt i skriptet stemmer.** Dekkskartet har ruter på 0,2 m, og `deckcrew.js` velger karenes losseplass (`landSlots`) og plassene ved ripa etter rutene. 4 cm mer dørk i en låring ga en ny losseplass og tok plassen til han som gir tegn. `check()` i skriptet ser det ikke; `crewclip` gjør. Kjør `crewclip` rett etter en eksport som endrer skrogets eller dørkens omriss, før bildene tas.
- **Bilder på skjermer og mønster på dørk uten teksturer:** et rutenett av små flater (11 mm på skjermene, 10 cm på dørken) med et eget materiale, farget i hjørnene av `wear()` etter punktets plass. Spillet og rendringen viser det samme, og fjernmodellen er uten.
- **Sklisikring som et lag 4 mm over dørken**, bare der ingenting står (`grip_free`): rennene langs skansene og rundt luka, casingen og føttene leser som glatt gelcoat fordi feltene stopper før dem.
- **En modell kan si hvor navnet og merket står** (`anchors.nameHouse`, `anchors.marks`), når spillets søk ikke finner plassen eieren vil ha. Merkets stripe trenger tette stasjoner i baugen (49 på 1,08 m): `stripProud` leser nærmeste stasjon, og bredden endrer seg 0,66 m per meter der. `regmarktest` var rød med ni.
- **En liten flis ved et boolsk kutt** (lensporten som slutter 3 cm fra en stasjon) ga den ene flata `flatnorm` fant i runde 1. Flytt åpningen så stasjonen går gjennom den.
- **Tekst i rendringene** lages med Blenders egen skrift gjort om til flater og lagt på skroget punkt for punkt (`render_only()`, aldri eksportert).
- **En plass for en teinestabel må prøves mot `potshot` før bildene tas, ikke etter.** `check()` regner mot skansen, masta og pullertene; `potshot` regner mot dekkskartets ruter på 0,2 m, der den ytterste ruta ved skansen ikke er gulv og unntaket for den gjelder fra `beam`/2 − 0,45. I runde 2 ble etter-bildene tatt og karakteren satt med stabelen på en plass testen siden felte.

## 7. Runde 3 (OB11, 12.11.2026): det som er lært

Hva som ble gjort, står i `breisjark-grunnlag.md` 10.10. Det som gjelder neste båt:

- **Flagget henger der spillet setter det, fra toppen av `anchors.pole`, og blåser med den tilsynelatende vinden** (`24-cinema.js`). En flaggstang på ripa ved hekken gir et flagg i hodehøyde over den som setter. På en båt med galge: sett stanga på galgen, og regn i `check()` at et flagg på 1,2 m ikke henger lavere enn 2,0 m over dekket.
- **To bokser med toppen i samme plan der de krysser hverandre gir svarte firkanter** i rendringen (tverrbjelkene gjennom sidebjelkene på galgen). La tverrbjelkene gå mellom sidebjelkenes innsider og være noen millimeter lavere.
- **Et stag som ender midt på toppen av en bjelke** har halve endeflata i lufta; la det gå inn i bjelken og stå i et øre.
- **Detaljer på 1–2 cm synes ikke i spillets bilder** (dørhåndtaket og hengslene var der i runde 2, sensoren så dem ikke). Et håndtak på 17 cm, et mørkt låsskilt og en mørk tetningslist rundt dørbladet leser.
- **Lister i skjøtene og beslag i stål** passer `clip_malo36` (stål er tillatt ved veggene); `alu` ble talt som gjennom siden.
- **Slitasje per hjørne** synes bare der flatene har mange hjørner (skansene, skroget). På store hvite bokser blir den en myk overgang mot foten; det er det som er mulig uten teksturer.

