# Byggingen av plastsjarken: slik ble 31-foteren revidert (01.11.2026)

Kort byggedokument for revisjonen av `plastsjark` («Plastsjark 31 fot (9,45 m), 100 hk»), skriptet `tools/boats/plast31.py`, etter
arbeidsmåten i `sulebas-bygging.md` (kap. 7, 11, 12 og 13). Avvikslista, kravlista, lanternene og rundene står i `plastsjark-grunnlag.md`.

## 1. Kildene

Ingen bilder fulgte med bestillingen. Grunnlaget er spillets data (`VESSELS.plastsjark`: 9,45 × 3,30 m, 1,35 m dypgang med kjølen, 6 t,
100 hk, 1992, plotter og VHF som standard), målene det første skriptet leste i registrene og bruktannonsene for forbildet 17.10.2026
(kildene står i skriptets kommentar), og søkeutdrag av flere finn.no-annonser 01.11.2026 (sidene selv var stengt for økta). Ripa, bredden
ved ripa, stevnen og planen for dekket er det første skriptets; alt under vann, vannlinjebredden og alt inni er antatt for typen. **Ingen
mål er målt på et bilde i denne økta.** `check()` sjekker modellen mot dataene og lanternereglene; `qa/lines.py` tegner spantrisset og
profilen fra tabellene.

**Jonas 01.11.2026, midt i økta:** «Jeg synes kanskje denne modellen er den minst estetisk pene modellen så her har du en utfordring, og
jeg gir deg ganske frie tøyler til å skape en pen båt.» Målene, planen for dekket og ankrene er beholdt; formen og overbygget er gjort
penere (kap. 3).

## 2. Skriptet

Skrevet på nytt etter `snekke26.py` og `ringnot38.py` (det gamle snittet var en superellipse fra kjølens underkant til ripa, som ga
21,9 t mot 6 t; kjølen var en egen kropp inni skroget, og propellen lå inne i skroget).

- **Rammen:** x forover fra speilets topp, y til babord, z opp fra kjølens underkant; vannlinja z = 1,35. Speilet heller akterover
  (`RAKE` 0,10), stasjonene akter for 0,8 m følger rakingen (`x_of`), og hekken er avrundet i plan inn til 72 % av bredden (`stern_round`).
- **Snittet** (`section`): kjølens underkant på senterlinja, kjølens bunn og side opp til roten (kjølen smalner fra 0,15 m ved roten til 0,08
  nede), så kroppen (`body`): under vannlinja en kubisk kurve som forlater kjølen bratt (hul kjølrot), runder kimmingen og møter vannlinja
  langs utfallets helning (ingen knekk), over vannlinja utfallet opp til ripa. Øverst den marineblå stripa og teaklista (scueringslista,
  3,2 cm ut, tynnes ut mot stevnen). Antallet punkter er fast; der kjølen ikke finnes, samles punktene i roten.
- **Ett nett** (`Mesh`): kjølen, sidene, speilet, teakkappen på skansekledningen og speilets topp, innsida av skansekledningen, dekket
  med bue, ruffen med sider som heller inn og buet topp, ruffens akterside og fordekket deler punktene. Dekket og speilets innside
  begynner 6 cm forut for speilets utside (`TT`; i runde 3 lå innsida i samme plan som utsida).
- **Malingsgrensene** skjæres i flaten (`bisect_plane`) på plan som stiger 12 mm per meter forover.
- **Ekte hull** (`cutters`, `cut_holes`, `linings`): koøyene i ruffen (rustfri ring, lysning, glass, mørkt bak, vrider), nedgangen
  (teakdør med lameller), forluka (aluminiumsramme og røykfarget lokk), lasteromsluka (karm opp fra dekket, mørkt ned i rommet, lokket
  med leppe, klinker og ringer), lensportene gjennom skansekledningen (med gummiklaff på hengselstang utenpå), kjølevannsutløpet og
  lensepumpens utløp, og dekket inne i styrhuset (dørken er senket 0,30 m).
- **Styrhuset** (`wheelhouse`): kremhvite vegger med et svart bånd rundt hele vindusrekka (planlisten OVB-03), rutene i ekte åpninger med
  gummikarm og lysning, fronten som lener forover med tre ruter og viskere, døra forut om babord med karm, terskel, vindu, hengsler og
  håndtak og et trinn ned inne, et tynt tak med marineblå kant, dryppkant og visir over fronten, rekke og håndlister på taket.
- **Styreplassen** (`helm`): konsollen til styrbord under frontrutene med lyst dashbord som skrår opp forover, plotteren, ekkoloddet og
  motorpanelet i mørke rammer vendt opp og akterover mot skipperen, kompasset, bryterpanelet, rattet (`F.helm_wheel`) 0,42 m forut for
  øyet, enspaken (`F.single_lever`), VHF-en under taket, styrestolen (`F.helm_seat`); benken, kartbordet og kokeplata til babord.
- **Masta** på taket akter i tabernakel med saling, plattformen for spillets radar, den hvite rundtlysende (`F.allround_lantern`), VHF-pisken
  (`F.whip`), GPS-en (`F.gps`), hornet; den tørre eksosen ved siden av med stag til masta; lyskasteren (`F.searchlight`) og arbeidslysene.
- **Lanternene:** sidelanternene (`F.side_lantern`, med skjerm) på en plate på styrhussidene under takkanten, akterlanterna
  (`F.stern_lantern`) på flaggstanga.
- **På dekk:** pulpiten, pullertene (`F.cleat`), ankervinsjen med gypsy og varpkopp, kjettingrøret, baugrulla (`F.bow_roller`), håndlister og
  soppventil på ruffen, påfyllingen og lufteren, fendere og slange.
- **Under vann:** bronsesko fra kjølen til rorets hæl, profilroret (`F.foil_rudder`) med stamme og lager, akselen ut gjennom lageret i
  kjølens akterkant, akselanoden, propellen (`F.propeller`, Ø 0,54, tre blad), anoder på kjølen og speilet, ekkoloddgiveren og
  sjøvannsinntaket.
- **Arbeidet om bord:** båtens eget sløyebord i stål over babord ripe (`gutting_table`, `work.own`), blødekaret akter for fiskeren ved
  haleren på styrbord, lasteromsluka mellom dem (grunnlaget kap. 6.2).
- **Fjernmodellen** (`build(False)`) har færre rader og ingen pullerter, karmer eller dørbeslag, så den holder `vessel3d`s grense på
  12 000 punkter (3 803 trekanter).

## 3. Det som er gjort for at båten skal bli pen

Mer spring forut (ripa fra 2,41 m ved 3,2 m til 3,04 m ved stevnen) og litt akterover, utfall i baugen, avrundet hekk, teak scueringslist og
teakkapp mot den hvite skansekledningen og den marineblå stripa, et lavere styrhus (dørken senket 0,30 m) med svart vindusbånd og
marineblå takkant, rustfri eksos med svart topp, og et ryddig dekk med de faste tingene i rustfritt stål og teak.

## 4. Kritikksløyfen og spillet

`qa/shots.py` (K1–K7, K6 om natta, nærbildene i `CLOSE`), `qa/sheet.py`, `qa/lines.py` (ny, for alle skript), `qa/stubcheck.py`,
`qa/clip_plast31.py`, `qa/deckpoints.py` (ny: hvor spillets dekkskart setter plassene), `qa/runtests.sh` (nå med `P=` for loggnavnet). Spillet viste Blender-modellen også før revisjonen
(`glbHas('plastsjark')`, 7 077 trekanter). Før- og etter-bildene i begge formater: `tests/p31shot.py` (`TAG=for`/`etter`).
