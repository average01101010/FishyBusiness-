# Designombyggingen: Geminis svar 13.11.2026 (hele, uredigert)

Spurt med 92 skjermbilder (46 skjermer × stående og liggende, `tools/ui/designshots.py`) og toppen av `src/styles.css`. Spørsmålene står i `docs/planer/design-ombygging.md`. Det den sier om koden og om hva som skjer ved trykk, er påstander og er ikke sjekket.

### 1. Information architecture

#### Where the same thing lives in two places
* **Catch & Hold (`Lasterom`)**:
  * **SEE** in `05-skuff-lever-liggende.jpg` (right drawer, middle) and `19-skuff-last-liggende.jpg` (right drawer, top): Both show the exact same `Lasterom` block (`Lastet 0 / 500 kg`, `Is 0 / 150 kg`, `Drivstoff 60 / 60 L`, `Sløy om bord` checkbox, `Ingen fangst om bord.`).
  * **SEE** in `20-skuff-beholdning-liggende.jpg` (right drawer, top tab bar): `Lasterom` is also the 3rd tab inside `Om bord`.
* **Gear (`Redskap`)**:
  * **SEE** in `17-skuff-redskap-liggende.jpg` (right drawer, tabs `I sjøen | Om bord | Kjøp`) vs. `20-skuff-beholdning-staaende.jpg` (bottom sheet under `Om bord → Redskap` tab): `20-skuff-beholdning-staaende.jpg` literally appends the `Ingen redskap i sjøen. Trykk «Sett ut»...` block from `17-skuff-redskap` at the bottom of the page, and `17-skuff-redskap` duplicates the shop via a `Kjøp` tab.
* **Crew & Operations Plan (`Mannskap` & `Driftsplan`)**:
  * **SEE** in `21-skuff-drift-liggende.jpg` (standalone `Driftsplan` drawer), `13-skuff-mannskap-liggende.jpg` (drawer `Mannskap` with `Om bord | Mannskapsbørs` tabs and an `Åpne Driftsplan` card), `22-skuff-arbeid-liggende.jpg` (drawer `Om bord → Mannskap` tab with `Driftsplan → Åpne` and `Ansatte | Mannskapsbørs` buttons), AND `23-telefon-hjem-liggende.jpg` (phone `DRIFT → Driftsplan` icon).
  * **SEE** in `46-dekksdagbok-liggende.jpg` (right page top): The logbook also has a `DRIFTSPLAN` column.
* **Orders (`Oppdrag` / `Bestillinger`)**:
  * **SEE** in `08-skuff-oppdrag-liggende.jpg` (`Oppdrag` drawer showing `Nye bestillinger` + `Omdømme`) AND `31-app-ordl-liggende.jpg` (phone `Oppdrag` app with tabs `Turer | Bestillinger | Kappløp`) AND `23-telefon-hjem-liggende.jpg` (`DRIFT → Oppdrag`).
* **Shops & Boat Market (`Butikk` / `Båthandel` vs. `Nettet`)**:
  * **SEE** in `02-skuff-fiske-liggende.jpg` / `03-skuff-utstyrb-liggende.jpg` vs. `45-app-nett-butikk-liggende.jpg` (`Nettbutikken` inside the `Nettet` phone app).
  * **SEE** in `09-skuff-fartoy-liggende.jpg` (middle: `Alle båter hos Kystmegleren >`) vs. `32-app-nett-liggende.jpg` (`Kystmegleren` card inside phone).
* **Service vs. Maintenance**:
  * **SEE** in `04-skuff-service-liggende.jpg` (`Service` in Finnsnes shop), `20-skuff-beholdning-liggende.jpg` (top card inside `Om bord → Redskap`: `Service i butikken her → Til service`), and `12-skuff-verksted-liggende.jpg` (`Vedlikehold` at the yard).
* **Fish Prices, Accounting & Quotas**:
  * **SEE** in `16-skuff-havn-liggende.jpg` (right drawer: `Priser hos mottakene i dag` + `Regnskap`), `28-app-salg-liggende.jpg` (phone `Salgslaget`: `Førstehåndspriser, kr/kg`), `23-telefon-hjem-liggende.jpg` (`BEST BETALT TORSK`), `15-skuff-bank-liggende.jpg` (`Kontoer | Regnskap` tabs), `27-app-rederi-liggende.jpg` (`Regnskap 2027 ... Bank >`), and `46-dekksdagbok-liggende.jpg` (`Salg`, `Utstyr`, `Sesonger` left tabs).
  * **SEE** in `09-skuff-fartoy-liggende.jpg` (top-right card: `Blad B i fiskermanntallet` + `Se papirene`) vs. `29-app-kvote-liggende.jpg` (`Fiskermanntallet, blad B`).

#### Where a first-time player won't know Drawer vs. Phone
* **INFER** (from `01`–`45`):
  1. *Checking fish prices*: Is it `Havn` (`16`), `Salgslaget` (`28`), or Phone Home (`23`)?
  2. *Managing crew & routes*: Should they tap `Bygd`, `Om bord` (`22`), or Phone → `Driftsplan` (`23`)?
  3. *Finding orders*: `Mottak → Oppdrag` (`08`) vs. Phone → `Oppdrag` (`31`)—especially since `08` has `Omdømme` while `31` has `Turer` and `Kappløp`.
  4. *Buying gear & boats*: `Butikk` (`02/03`) / `Verft` (`09`) vs. Phone → `Nettet` (`32/45`).
  5. *Checking papers/finances*: `Båthandel` (`09`) shows Blad B, `Havn` (`16`) shows Regnskap, `Bank` (`15`) shows Regnskap, and Phone (`27`, `29`) shows both.

#### What to merge or cut
* **Cut `17-skuff-redskap`**: Merge `I sjøen` + `Om bord` into `20-skuff-beholdning` (`Om bord → Redskap`), and drop its redundant `Kjøp` tab (shopping belongs in `Butikk` / `Nettbutikken`).
* **Cut `19-skuff-last` as a standalone drawer**: Keep `Lasterom` solely as a tab under `Om bord` (`20`) and embedded at the top of `Lever fangst` (`05`).
* **Merge `13-skuff-mannskap`, `14-skuff-bors`, `21-skuff-drift`, and `22-skuff-arbeid`**: `Om bord → Mannskap & Drift` handles assigned crew + `Driftsplan`; `Bygd → Mannskapsbørs` (`14`) is only for hiring.
* **Merge `08-skuff-oppdrag` into `31-app-ordl` (or vice versa)**: Keep one `Oppdrag & Omdømme` screen (`Turer | Bestillinger | Kappløp | Omdømme`) accessible both from Mottak and Phone.
* **Cut duplicate `Regnskap` from `16-skuff-havn` and `Blad B` from `09-skuff-fartoy`**: Keep `Regnskap` inside `Bank`/`Rederi` (`15`/`27`) and `Blad B` inside `Kvote` (`29`), linking only when a boat purchase is actually blocked.
* **Merge `33/34/40` (`Kaiboden`)** under one store entry (already one app with tabs `Haill | Trim | Skippertak`).
* **Cut `04-skuff-service` as a separate page** if empty when undamaged; fold gear repair directly into `Butikk` as a compact top bar or `Service`-tab alongside `Redskap | Elektronikk og haler`.

#### Proposed 5-destination navigation model
Keep a 5-button bottom bar (**Kaia**, **Bygd & Verft**, **Om bord**, **Telefon**, **Dagbok**) where **Kaia** and **Bygd & Verft** adapt to the current harbour (and show "Til sjøs — se nærmeste havn" when at sea):

| Destination | Mapped Drawer Pages (`02`–`22`) | Mapped Phone Apps & Book (`23`–`46`) |
| :--- | :--- | :--- |
| **1. Kaia** *(Trade at current pier)* | `02` Fiskeutstyr (Redskap), `03` Elektronikk og haler, `04` Service, `05` Lever fangst, `06` Is, `07` Agn og egning, `08` Oppdrag (Bestillinger/Omdømme), `16` Havn (harbour services & local prices) | — *(links to `45` Nettbutikken if item/service unavailable at this pier)* |
| **2. Bygd & Verft** *(Hull, fleet, crew hire, bank)* | `09` Båthandel, `10` Oppgraderinger, `11` Malerverksted, `12` Vedlikehold, `14` Mannskapsbørs, `15` Kystbanken (`Kontoer` + `Regnskap`) | `32` Kystmegleren (via `Båthandel` tab/link) |
| **3. Om bord** *(Boat state & setup)* | `17` Redskap, `18` Rigg, `19` Lasterom, `20` Om bord (`Beholdning`), `21` Driftsplan, `22` Mannskap om bord (`13` `Om bord` tab) | `Driftsplan` app icon (`23`) |
| **4. Telefon** *(Remote/networked coastal services)* | — | `23` Hjem, `24` Vær, `25` Kystposten, `26` Meldinger, `27` Rederi, `28` Salgslaget, `29` Kvote, `30` Regler, `31` Oppdrag (`Turer/Bestillinger/Kappløp`), `32/45` Nettet & Nettbutikken, `33/34/40` Kaiboden (`Haill/Trim/Skippertak`), `35` Sesong, `36` Fiskeguide, `37` Venner, `38` Milepæler, `39` Redning, `41` Håndboka, `42` Patchnotes, `43` Tilbakemelding, `44` Innstillinger |
| **5. Dagbok** *(Ship's historical record)* | — | `46` Dekksdagbok (`Dagbok`, `Sesonger`, `Hendelser`, `Utstyr`, `Salg`) |

*(Note: inside `Telefon`, the 24 screens can be grouped cleanly on `23-telefon-hjem` without clipping, and `Salgslaget` `28` owns live coast-wide fish prices while `Kaia` `16` only shows local pier prices.)*

---

### 2. The 8 worst screens (worst first)

1. **`23-telefon-hjem-staaende.jpg` & `23-telefon-hjem-liggende.jpg` (Phone Home)**
   * **What is wrong**:
     * **SEE** in `23-telefon-hjem-staaende.jpg` (bottom-center/right): The phone bezel physically overlaps and hides the `Verft` and `Om bord` buttons in the main bottom bar, while leaving ~65% of the screen blank black above it.
     * **SEE** in both `23-telefon-hjem-liggende.jpg` and `-staaende.jpg` (bottom of phone screen under `DEG`): All 4 app icons (`Venner`, `?`, `Innstillinger`, etc.) are sliced in half vertically above the phone's `<` / `×` bar with no scroll affordance.
     * **SEE** (middle of phone): `Neste mål: Første juksamaskin` shows `34 000 kr / 34 000 kr` (100% full gold bar) with no tap target/CTA to buy it; `Første uke` and `BEST BETALT TORSK` have identical dark-glass styling, blurring status vs. navigation; app icon hitboxes look ~38–42 px inside the mini bezel (**INFER** <44 px on tablet).
   * **Rebuilt top to bottom**:
     1. Expanded tablet sheet/frame positioned cleanly *above* the main bottom bar (no overlap).
     2. Phone status bar (`06:02 · man 1. mar`, `Kystnett`, weather chip `NØ 5 m/s · -1 °C`, cash `500 000 kr`).
     3. 2-column widget strip (Actionable `Neste mål` with `Til butikken >` link | `Beste torskepris` + `Første uke 1/21`).
     4. Full unclipped app grid grouped cleanly (`Drift`, `Handel & Regler`, `Mer & Innstillinger`) with ≥56×56 px touch targets and zero hidden rows.

2. **`16-skuff-havn-liggende.jpg` (Havn — Wide)**
   * **What is wrong**:
     * **SEE** (right column, `Priser hos mottakene i dag` table): The table clips off the right edge—`Uer  K` is cut mid-letter and `Kveite` + `Blåkveite` are missing (compare `16-skuff-havn-staaende.jpg`, which fits all 9 species).
     * **SEE** (right column, top action row): Three inconsistent button styles sit together—dashed `Fyll drivstoff, 0 L (0 kr)`, solid white `Kjøp 50 kg is · 100 kr`, and full-width `Fiskeutstyr: juksa, is og kveiteutstyr`.
     * **SEE** (bottom of column): `Regnskap` duplicates `15-skuff-bank` and pushes off the bottom.
   * **Rebuilt top to bottom**:
     1. Header: `Finnsnes` + available facilities badges (`Drivstoff`, `Utstyrsbutikk`, `Verft`).
     2. 2-button quick-service bar (`Fyll drivstoff` disabled state cleanly styled, `Kjøp is`, `Åpne butikk`).
     3. Horizontally spacious (wide modal) or 5-column condensed price table (`Mottak`, `Torsk`, `Hyse`, `Sei`, `Kveite` + expandable `Alle arter`) so nothing ever clips.
     4. Link to `Bank → Regnskap` instead of repeating accounting rows.

3. **`11-skuff-maler-liggende.jpg` & `11-skuff-maler-staaende.jpg` (Malerverksted)**
   * **What is wrong**:
     * **SEE** in `11-skuff-maler-staaende.jpg` (entire screen): The opaque white bottom sheet covers ~80% of the screen, completely hiding the 3D boat even though the instruction says *"Trykk på en farge, så vises den på skroget"*.
     * **SEE** in both `-liggende` and `-staaende`: All 16+ colour swatches for `Skrogfarge`, `Ripestripe`, `Totone`, `Vannlinjestripe`, and 30+ `Flagg` render simultaneously as a ~90-tile mosaic of tiny squares (**INFER** <44 px in `-liggende`, where 16 swatches wrap into 9 + 7 + orphan `Av` button).
   * **Rebuilt top to bottom**:
     1. **In `-staaende`**: Compact 45% bottom sheet so the 3D boat remains fully visible in the upper half!
     2. Compact `DU ER HER` badge removed (already shown in HUD).
     3. Tabbed/accordion selector (`Skrogfarge | Striper | Lakk | Flagg`) showing one active palette at a time in ≥44×44 px swatches.
     4. Sticky bottom bar with live selected preview + price (`Original · 0 kr` / `Mal skrog · 29 kr`) so checkout doesn't scroll away.

4. **`02-skuff-fiske-liggende.jpg` & `03-skuff-utstyrb-liggende.jpg` (Tackle Shop)**
   * **What is wrong**:
     * **SEE** (top header): In `02`, the dark bar says `Fiskeutstyr` with tab `Redskap`; tapping tab `Elektronikk og haler` (`03`) changes the header title to `Elektronikk og haler`, breaking orientation.
     * **SEE** (upper half of drawer in `02` and `03`): Four pre-product stacked boxes (`DU ER HER Finnsnes`, `Montering skjer i havn...`, NPC `Solveig` quote, `Det «T-658-LK» trenger nå`) push the first buyable product halfway down the screen; in `02-skuff-fiske-liggende.jpg`, the second product's `Kjøp trinn 2` button is clipped at the bottom edge.
     * **SEE** (`03-skuff-utstyrb-liggende.jpg`): `Kjøp og monter · 3 t (30 min i ekte tid)` wraps awkwardly inside the magenta button; dotted underlines (`Juksa`, `sløyer`, `haler`) look like spellcheck errors.
   * **Rebuilt top to bottom**:
     1. Fixed header `Fiskeutstyr · Finnsnes` + segmented tabs (`Redskap | Elektronikk og haler | Service`).
     2. Single dismissible/compact tip banner if crew/boat lacks something (`Trenger varmt arbeidstøy →`), no `DU ER HER` card and no redundant 3-line quote box taking 180 px.
     3. Product cards (2-column grid in wide mode) with image, clean 1-line perk, price, and concise CTA (`Kjøp · 2 490 kr` or `Kjøp og monter · 68 000 kr` with `3 t / 30 min` as a sub-label).

5. **`09-skuff-fartoy-liggende.jpg` & `09-skuff-fartoy-staaende.jpg` (Båthandel)**
   * **What is wrong**:
     * **SEE** in `09-skuff-fartoy-liggende.jpg` (top 65% of drawer): Five stacked non-boat blocks (`DU ER HER`, `Neste mål` with `Til butikken`, `Blad B` with `Se papirene`, `Båter til salgs her` with `Kystmegleren`, 4 wrapped filter pills, and a 4-line paragraph) push the first boat (`Aluminiumsbåt 19 fot`) off the bottom edge so its price `95 000 kr` is sliced in half.
     * **SEE** in `09-skuff-fartoy-staaende.jpg` (middle): `Trebåt 23 fot` has a bright green outline that looks like an active selection or featured deal rather than "Din nåværende båt".
   * **Rebuilt top to bottom**:
     1. Header `Båthandel · Finnsnes` + compact `Kystmegleren (bruktbåtmarked) >` pill in header/subbar.
     2. Single-row horizontal filter tabs (`Åpen gruppe | Med hjemmel | Kystflåten | Havfiske`) + 1-line eligibility status (`Din båt: T-658-LK · Innbytte 31 500 kr`).
     3. Boat cards (2-col grid in wide mode) with explicit `DIN BÅT` badge on owned vessel and clear net trade-in price on upgrades. (Move `Neste mål` and `Blad B` out completely.)

6. **`20-skuff-beholdning-liggende.jpg` & `20-skuff-beholdning-staaende.jpg` (Om bord → Redskap)**
   * **What is wrong**:
     * **SEE** (top card): `Service i butikken her` uses a bright magenta primary CTA (`Til service`) right at the top of the boat inventory, falsely signaling it as the primary boat action.
     * **SEE** (`Juksa` card, middle): Seven tiny species tags (`torsk`, `hyse`, `sei`, `lyr`, `lange`, `brosme`, `uer`) sit in ~20 px pills (**INFER** far below 44 px if tappable, or visual noise if static).
     * **SEE** (`20-skuff-beholdning-staaende.jpg`, bottom): Loose uncarded paragraphs (`Ingen redskap i sjøen...`) repeat `17-skuff-redskap` verbatim.
   * **Rebuilt top to bottom**:
     1. Unified `Om bord` tabs (`Redskap & Rigg | Lasterom | Mannskap & Drift | Båten`).
     2. `I sjøen` summary card at top (only if gear is deployed, else 1-line empty state).
     3. Gear cards (`Juksa`, `Line`, `Garn`, `Blåser og agn`) with condition bar, clean species list (plain dot-separated text or proper 44 px filter chips), and subtle secondary link `Service i butikk >` only when wear <100%.

7. **`10-skuff-utstyr-liggende.jpg` & `10-skuff-utstyr-staaende.jpg` (Oppgraderinger)**
   * **What is wrong**:
     * **SEE** (`10-skuff-utstyr-staaende.jpg`): Cards 1–4 have no images while Card 5 (`Antigro-belegg`) suddenly has a large paint-tin illustration, breaking visual consistency.
     * **SEE** (`10-skuff-utstyr-liggende.jpg`, `Propell` card bottom): Key-value alignment collapses—left label `Neste / trinn` wraps onto 2 lines in a ~40 px column while the right side crams 5 data points (`Polert propell med justert stigning (+5 %) · 7,4 kn · 0,9 l/t ved 6,0 kn · 2 500 kr · 3 t (30 min i ekte tid)`) into an unreadable block.
   * **Rebuilt top to bottom**:
     1. Header `Oppgraderinger · Finnsnes` + 1-line mounting note (`Montering i havn: 3 t / 30 min`).
     2. Uniform card template for all 5 upgrades (thumbnail icon/illustration on left for *all* or *none*) with 2-line max summary.
     3. Clean 2-row comparison table (`Nå` vs. `Neste trinn`: power/speed/consumption) and separate `Pris` + `Bytt motor · 5 000 kr` primary button.

8. **`44-app-innst-liggende.jpg` & `44-app-innst-staaende.jpg` (Innstillinger — representative of cramped phone apps)**
   * **What is wrong**:
     * **SEE** (bottom card `Grafikk i 3D` in *both* `-liggende` and `-staaende`): The 4th pill button is literally clipped by the right edge of the card (`Hø` cut mid-word, and **INFER** `Ultra` is completely hidden off-screen because the prose below mentions `Ultra`)!
     * **SEE** (bottom of phone): The 9-line prose explanation runs behind the bottom navigation bar.
   * **Rebuilt top to bottom**:
     1. Expand into tablet-sized modal/sheet (see Q5) so pill rows never clip.
     2. `Konto` card (login status + 1 CTA).
     3. `Språk` + `Tema` row.
     4. `Grafikk i 3D` with wrapping/full-width 5-segment grid (`Auto`, `Lav`, `Middels`, `Høy`, `Ultra`) and concise 1-line dynamic description of *only* the currently selected preset.

---

### 3. Consistency audit

#### Distinct button styles seen
1. **Solid magenta rectangle** (`--r-btn: 8px`): `Kjøp · 2 490 kr` (`02-skuff-fiske-liggende.jpg`), `Ta oppdraget` (`08-skuff-oppdrag-liggende.jpg`), `Ansett · 1,1 lott` (`14-skuff-bors-liggende.jpg`).
2. **Solid dark navy rectangle**: `Til butikken` / `Se papirene` (`09-skuff-fartoy-liggende.jpg`), `Forhandle ned` (`14-skuff-bors-liggende.jpg`), `Verkstedet · 2 000 kr` (`12-skuff-verksted-staaende.jpg`), `Vis meg` (`41-app-handbok-liggende.jpg`).
3. **Solid teal-green rectangle**: `Lag driftsplan` (`21-skuff-drift-liggende.jpg`).
4. **Light grey fill rectangle** (`--s-card-2`): `Prøv på båten` (`03-skuff-utstyrb-staaende.jpg`), `Sett inn 10 000 kr` (`15-skuff-bank-liggende.jpg`), `Gjør det selv · 700 kr` (`12-skuff-verksted-staaende.jpg`), `Flytt båten ut på trygt vann` (`39-app-redning-liggende.jpg`).
5. **White bordered outline button**: `Kjøp 50 kg is · 100 kr` (`16-skuff-havn-liggende.jpg`), `Alle båter hos Kystmegleren >` (`09-skuff-fartoy-liggende.jpg`).
6. **Dashed-border button**: `Fyll drivstoff, 0 L (0 kr)` (`16-skuff-havn-liggende.jpg`), `Skrogrens på slipp · 4 300 kr` (`12-skuff-verksted-staaende.jpg`).
7. **Pill-shaped outline button**: `Klær til alle om bord >` (`02-skuff-fiske-staaende.jpg`).
8. **Dark circular/squircle glass HUD buttons**: `Butikk / Bygd / Verft / Om bord` and top-right camera buttons (`01-havn-liggende.jpg`).
9. **Inline text/chevron links**: Blue `Mer om kveiteutstyr >` (`02-skuff-fiske-liggende.jpg`), dark `Mer ▾` (`15-skuff-bank-liggende.jpg`).

#### Distinct card styles seen
1. **Standard white card** (`#FBFCF8`, `--r-card: 14px`): `02-skuff-fiske-liggende.jpg`.
2. **Green-bordered card** (owned boat): `09-skuff-fartoy-staaende.jpg` (`Trebåt 23 fot`).
3. **Mint/sage location banner** (`DU ER HER`): `04-skuff-service-liggende.jpg`.
4. **Left-accent-stripe card**: `31-app-ordl-liggende.jpg` (`Havforskningsinstituttet` green stripe).
5. **Colored-header-bar cards**: `29-app-kvote-liggende.jpg` (brown + slate bars), `27-app-rederi-liggende.jpg` (purple bar).
6. **Newsprint ruled blocks** (no card container): `25-app-post-liggende.jpg`.
7. **Dark translucent glass card**: `01-havn-liggende.jpg` HUD, `23-telefon-hjem-liggende.jpg`.
8. **Flat borderless list rows**: `05-skuff-lever-liggende.jpg` (`Lasterom`), `16-skuff-havn-liggende.jpg` (`Regnskap`).

#### Distinct tab styles seen
1. **Dark navy active pill + white bordered inactive pills**: `02-skuff-fiske-liggende.jpg`, `13-skuff-mannskap-liggende.jpg`, `15-skuff-bank-liggende.jpg`, `29-app-kvote-liggende.jpg`.
2. **App-tinted active pill**: Brown active pill `Haill` in `33-app-kaiboden-liggende.jpg`.
3. **Vertical coloured book dividers**: `46-dekksdagbok-liggende.jpg` (`Dagbok`, `Sesonger`, `Hendelser`, `Utstyr`, `Salg`).
4. **Compact vertical month capsules**: `36-app-guide-liggende.jpg` (`jan`–`des`).

#### Distinct header styles seen
1. **Dark slate bar + white title + circular `×`**: `02`–`22` drawers.
2. **15+ per-app coloured phone headers** (no close button; `<` / `×` at bottom): `24`–`45`.
3. **Editorial masthead**: `Kystposten` (`25-app-post-liggende.jpg`).
4. **Logbook page header** (uppercase tracking + italic date): `46-dekksdagbok-liggende.jpg`.

#### Distinct accent colours seen
* **Magenta `#B5227A`**: Primary CTAs (`02`, `08`, `14`, `33`).
* **Green `#2E7D57` / `#2FA0A0`**: `Lag driftsplan` (`21`), `Mest for pengene` (`33`), `Ja` badge (`30`), `Skattekonto` bar (`15`), boat selection border (`09`), `Neste mål` bar (`09`).
* **Gold/Ochre**: Reputation bars (`08`), crew stars (`14`), `Neste mål` bar (`23`), warning `!` (`30`).
* **Blue**: `Mer om...` links (`02`), `Kulde` (`01-havn-liggende.jpg`).
* **Red**: `×` closed rules (`30`), vertical margin (`46`).
* **15+ app header colours**: Blue (`24`), rust (`25`), bright green (`26`), slate (`27`, `32`, `44`), teal (`28`, `35`, `36`), olive (`29`), dark green (`30`, `31`, `41`), brown (`33`, `37`), ochre (`38`), red-orange (`39`, `43`), purple (`42`).

#### What survives into one design system
Keep:
* **Drawers/Sheets**: Dark header (`--s-deep`), `--s-card-2` (`#EEF2F0`) sheet background, white `--s-card` (`#FBFCF8`) cards, dark-pill tabs (`--s-deep` active), magenta `#B5227A` primary CTA, `#15252F` & `#EEF2F0` secondary/tertiary buttons, and `--ok`/`--warn`/`--bad` semantic badges.
* **Fiction surfaces**: `--s-glass` (`rgba(11,23,32,0.78)`) exclusively for HUD/map (`01`), and `--s-paper` (`#F2E8D2`) exclusively for `Kystposten` (`25`) and `Dekksdagbok` (`46`).
* **Retire**: Dashed action buttons (`12`, `16`), green `Lag driftsplan` button (`21`), green card borders (`09`), pill-shaped action buttons (`02-staaende`), and dotted spellcheck-like glossary underlines (`02`, `03`, `14`).

---

### 4. Wide vs. upright tablets (`-liggende` vs. `-staaende`)

* **Is it the right use of each format today? No.**
  * **SEE** in `-liggende` (`02`–`22`): The drawer is locked to a ~30% (~380 px) right column. While leaving 70% black/3D space on the left works for light status views (`04`, `21`), it breaks tables (`16-skuff-havn-liggende.jpg` clips 2 fish columns), wraps swatch rows awkwardly (`11-skuff-maler-liggende.jpg`), and forces 2-column specs to crush labels (`10-skuff-utstyr-liggende.jpg`).
  * **SEE** in `-staaende` (`02`–`22`): Every drawer opens as a tall ~80% bottom sheet regardless of content. On `11-skuff-maler-staaende.jpg` this hides the boat you are painting; on `04-skuff-service-staaende.jpg`, `17-skuff-redskap-staaende.jpg`, `19-skuff-last-staaende.jpg`, and `21-skuff-drift-staaende.jpg` it leaves ~65–75% empty white/grey sheet.
* **Recommended wide (`-liggende`) shop layout (`02`, `03`, `09`, `10`, `45`)**:
  * Use a **65% width right-docked modal (~820 px)** while keeping the left 35% (~460 px) open for the chart, HUD, and boat silhouette:
    1. **Left category rail (~180 px)**: Vertical navigation (`Redskap`, `Elektronikk og haler`, `Service`, plus quick filters like `Passer min båt`).
    2. **Center 2-column product grid (~380 px)**: Compact product cards (painted illustration, name, 1-line stat, price, `Om bord` badge).
    3. **Right sticky detail/checkout pane (~260 px)**: Full description, prerequisites, mounting time (`3 t / 30 min`), `Prøv på båten`, and primary `Kjøp` CTA—eliminating long card scrolling and keeping checkout one tap away.
  * For `11-skuff-maler` only: keep a narrower 35% right drawer in `-liggende` and a **45% half-sheet in `-staaende`** so the 3D boat is never covered.

---

### 5. The phone-in-the-game (`23`–`45`)

* **Is the fiction worth the lost space? Not in its current tiny corner-bezel size.**
  * **SEE** in `23`–`45`: On both `800×1280` and `1280×800`, rendering a ~320 px phone in the bottom-right leaves huge unused black areas while causing severe UI breakage: `23-telefon-hjem-staaende.jpg` overlaps the bottom navigation bar (`Verft`/`Om bord`), `23` clips all 4 `DEG` icons, `44-app-innst` clips `Høy`/`Ultra`, and `29-app-kvote` wraps numbers (`0 /\n 10`).
* **Best alternative that preserves the fiction**:
  * Keep the phone/Kystnett identity (top `06:02 · Kystnett` status bar, app header colours, bottom `<` / home / `×` bar), **but expand it into a tablet-sized "Kystnett-skjerm / nettbrett" overlay**:
    * Wide (`-liggende`): Centered/right-anchored ~680×720 px frame (stops clear of top-right camera icons and bottom bar).
    * Upright (`-staaende`): ~92% width × 78% height frame anchored cleanly above the bottom bar (never overlapping `Verft` or `Om bord`).
    * Real smartphones: Edge-to-edge full screen with *no* inner fake bezel.
* **What breaks if you simply scale the frame up**:
  1. Single-column prose and key-value rows (`24-app-vaer`, `25-app-post`, `28-app-salg`, `42-app-patch`) will stretch to >85 characters wide unless converted to 2-column layouts or `max-width: 58ch` reading columns.
  2. `23-telefon-hjem` widget cards (`Neste mål`, `Første uke`, `Beste pris`) + app icons must reflow into a 2-column dashboard (widgets left, 4-column app grid right) or it will look sparse.
  3. `30-app-regler`, `36-app-guide`, and `31-app-ordl` have wide margins/spacing tuned for 300 px and need responsive 2-column grids (`31`, `36`).

---

### 6. The buying flow (`02` → `03` and `45`)

#### Tap count from harbour (`01`) to owning an item
* **Direct at harbour (`01` → `02`/`03`)**:
  1. Tap `Butikk` in bottom bar (`01`).
  2. **INFER** tap `Fiskeutstyr` in the fan menu (`styles-tokens.css` defines `--z-fan:10`, and `Butikk` holds both `02/03` Fiskeutstyr and `04` Service, matching `Verft`'s 4 pages).
  3. *(For electronics, `03`)* Tap `Elektronikk og haler` tab (`02`).
  4. Tap `Kjøp · 2 490 kr` (`02`) or `Kjøp og monter · 3 t (30 min i ekte tid)` (`03`).
  *(+1 tap if a confirmation modal `--z-modal:65` opens.)* **Total: 3–5 taps.**
* **Web shop (`01` → `45` → fetch at harbour)**:
  1. Tap phone button bottom-right (`01`).
  2. Tap `Nettet` (`23`).
  3. Tap `Nettbutikken` (`32`).
  4. Select pickup harbour pill if not current (`45`).
  5. Tap `Elektronikk og haler` tab if needed (`45`).
  6. Scroll below fold and tap order button (`45`).
  7. Sail to harbour, dock, open `Butikk → Fiskeutstyr`, and complete pickup/payment (+3–4 taps).
  **Total: 6 taps to order + sailing + 3–4 taps to collect = 9–10+ taps.**

#### What happens on «Kjøp og monter» & what is unclear
* **SEE** in `03-skuff-utstyrb-liggende.jpg`: Button reads `Kjøp og monter · 3 t (30 min i ekte tid)`. Top banner reads `Montering skjer i havn og tar 3 t (30 min i ekte tid)`.
* **INFER**: Pressing it deducts `68 000 kr` and queues a 3-hour in-game / 30-minute real-time yard/shop installation job (matching `Arbeidskø` in `12-skuff-verksted-staaende.jpg`).
* **What is unclear**:
  1. **Blocking behavior**: Does `30 min i ekte tid` lock the boat in harbour for 30 real minutes unless you sleep, or progress while the app is closed? (`12-skuff-verksted` explains `En planlagt avgang venter til alt er ferdig`, `03` does not.)
  2. **«Prøv på båten» (`03`)**: Unclear whether this is a 3D visual preview on deck or a sea trial, and it stays active on `Linesetter` (`03-skuff-utstyrb-staaende.jpg`) right next to the text saying you can't use it without a `Linehaler`.
  3. **Confirmation**: At `68 000 kr`, there is no visual cue whether one tap buys immediately or opens a confirmation dialog.
  4. **Web shop pickup (`45-app-nett-butikk`)**: `Håndjuksa` displays `Om bord` in green with no button—unclear if you can't buy a spare or if it's disabled. Also unclear how `Du bestiller nå og betaler når du henter. Utstyr monteres der.` interacts with mounting queue time.

#### Search, filters, or sorting?
* **Too few items for search** in `02` / `03` / `45` (**SEE**: ~4–10 items per tab; a search input adds clutter—keep search only in `41-app-handbok` where there are `49` entries).
* **Use lightweight filters instead**: 2 quick filter chips (`Passer min båt` / `Kan kjøpes nå`) to hide items with unmet prerequisites (`Linesetter krever linehaler`) and group gear (`Fangstredskap`, `Kvalitet`, `Elektronikk`).

---

### 7. Design system proposal (building on `styles-tokens.css`)

* **Type scale** (`--sans: "Archivo", system-ui, sans-serif`; tabular numerals on all numbers):
  * Screen title: `20px` bold (`--fs-h3: 20px`)
  * Card title: `17px` semibold (`--fs-lg: 17px`)
  * Body: `15px` regular (`--fs-body: 15px`, line-height `1.45`)
  * Small / meta / label: `13px` (`--fs-sm: 13px`)
  * Minimum floor: raise `--fs-cap` from `11px` to **`12px`** (never smaller on touch screens).
  * Keep `--serif` (`26px` italic) only for `Kystposten` (`25`) and `--hand` (`20px`) only for `Dekksdagbok` (`46`).
* **Spacing scale** (keep existing): `4px` (`--sp-1`), `8px` (`--sp-2`), `12px` (`--sp-3`), `16px` (`--sp-4`), `24px` (`--sp-5`), `32px` (`--sp-6`).
* **Corner radii**: `--r-tag: 4px`, `--r-btn: 8px` (all standard buttons), `--r-card: 14px`, `--r-pill: 999px` (strictly for tabs & filter chips, never action buttons).
* **Colour roles (hex)**:
  * Surface: `#FBFCF8` (`--s-card`), `#EEF2F0` (`--s-card-2` sheet bg), `#0B1720` (`--s-deep` headers), `rgba(11,23,32,0.78)` (`--s-glass` HUD), `#F2E8D2` (`--s-paper` book/news), `#D3DCDD` (`--line`)
  * Ink: `#16323F` (`--t-ink`), `#5B727C` (`--t-muted`), `#EEF4F7` (`--t-on-dark`)
  * Primary action: **`#B5227A`** (`--mag`, text `#FBFCF8`) — dark mode: `#E05AAE` with `#0B1720` ink
  * Secondary action: `#15252F` (`--s-raised`, text `#EEF4F7`) for high-priority non-purchase actions; `#EEF2F0` with `1px solid #D3DCDD` (text `#16323F`) for standard secondary
  * Success: `#2E7D57` (`--ok`), Warning: `#A96C07` (`--warn`), Danger: `#BF2F2A` (`--bad`), Info/Link: `#2F6D86` (`--water`)
* **Keep or change magenta `#B5227A`? Keep it.**
  * **Why**: Against `#FBFCF8` white cards, `#B5227A` gives ~6.2:1 contrast; in a UI saturated with navy (`#0B1720`), water blue (`#2F6D86`), and success green (`#2E7D57`), magenta stands completely apart as the single unmistakable *"commit / buy / accept"* signal. (Replacing green `Lag driftsplan` in `21` and dark `Til service` / `Sett inn` ambiguities makes magenta carry real semantic weight.)
* **Button hierarchy** (all `min-height: 44px`, `--r-btn: 8px`):
  1. *Primary*: Solid `#B5227A` (only 1 per card/screen for buying/accepting/confirming).
  2. *Secondary*: Solid `#15252F` or tinted `#EEF2F0` + `#D3DCDD` border (`Forhandle ned`, `Prøv på båten`, `Åpne`).
  3. *Tertiary*: Borderless text link (`#2F6D86` + chevron `>`) for `Mer om...` (`min-height: 44px` hit area).
  4. *Destructive*: `#BF2F2A` outline or solid (for cancelling orders / firing crew / risky actions).
* **Item-sold card anatomy**:
  `[80×80 painted thumbnail] + [Title (17px) + Level/Owned badge] / [1–2 line perk (15px)] / [Price (18px tabular bold) + Time meta (13px muted)]` -> full-width `44px` Primary CTA + optional Secondary/Tertiary row below.
* **Status-row anatomy**:
  `[Left label (15px #16323F) + optional 1-line subtext (13px #5B727C)]` | `[Right-aligned tabular value (15–17px bold) + optional compact progress bar beneath]`, `min-height: 48px`, separated by `1px solid #D3DCDD`.
* **Tab style**:
  Single horizontal row (`overflow-x: auto` if needed, never wrapping into 2 messy lines), `--r-pill` capsules (`min-height: 36px` inside `44px` touch wrapper), active `#0B1720` fill / `#EEF4F7` text, inactive `#FBFCF8` fill / `1px solid #D3DCDD` / `#16323F` text.

---

### 8. Phased rebuild plan (6 sessions)

1. **Phase 1 — Token & Component Cleanup (CSS-only lift, lowest risk)**
   * Unify all buttons (`44px` min height, `--r-btn: 8px`, remove dashed actions, move `Lag driftsplan` `21` from green to primary/secondary), unify cards/tabs, raise `--fs-cap` to `12px`, replace dotted glossary underlines with subtle info icons or clean links.
   * *Measure/test*: Automated contrast & touch-target audit (zero buttons <44×44 px across `02`–`45`).
2. **Phase 2 — Responsive Sheet Geometry (`-liggende` & `-staaende`)**
   * Convert `-liggende` shops/tables (`02`, `03`, `09`, `10`, `16`) to the 65%-wide split layout (rail + 2-col grid + detail) and fix `16` price table clipping; make `-staaende` sheets content-sized (`11` at 45% height so the boat is visible; sparse sheets `04`, `17`, `19`, `21` auto-height).
   * *Measure/test*: Visual verification on `800×1280` and `1280×800` ensuring 0 clipped table columns and full boat visibility in `11-skuff-maler`.
3. **Phase 3 — Information Architecture & Navigation Consolidation**
   * Implement the 5-destination bottom bar (`Kaia`, `Bygd & Verft`, `Om bord`, `Telefon`, `Dagbok`), merge `17` into `20`, fold `19` into `20`/`05`, unify `13/21/22`, and move `Neste mål`/`Blad B` out of `09` and `Regnskap` out of `16`.
   * *Measure/test*: 5-task findability test with 3–5 players (*"check cod prices"*, *"change rig"*, *"hire crew"*, *"find operations plan"*): target <3 taps and 0 wrong-menu detours.
4. **Phase 4 — Shop & Checkout Flow (`02`, `03`, `09`, `10`, `45`)**
   * Fix `Fiskeutstyr` header persistence (`02`→`03`), remove the 4 pre-product stacked boxes, unify `10` card thumbnails & `Propell` specs, clarify `3 t / 30 min` mounting behavior, `Prøv på båten` disabled states, and `Nettbutikken` (`45`) pickup status.
   * *Measure/test*: Think-aloud checkout test on `Linehaler` (`03`) and `Nettbutikken` (`45`)—verify players accurately explain what happens when pressing `Kjøp og monter`.
5. **Phase 5 — Tablet-Sized Phone Expansion (`23`–`45`)**
   * Expand the phone container on tablets so `23` clears the bottom bar and stops slicing `DEG` icons; fix clipped `Grafikk i 3D` pills (`44`) and wrapped quota figures (`29`); add 2-column layouts for `23`, `24`, `31`, `36`.
   * *Measure/test*: Tap-error and readability check on `23` and `44` on both tablet orientations plus a 390 px phone viewport.
6. **Phase 6 — HUD Parity & Final Polish**
   * Restore date and `Kulde` telemetry on `01-havn-staaende.jpg` (matching `01-havn-liggende.jpg`), refine `11-skuff-maler` category accordion, and test `46-dekksdagbok` swipe/tab readability in upright mode.
   * *Measure/test*: Full end-to-end harbour → shop → yard → phone → logbook regression run in both orientations.

---

### 9. What is good today and must not be lost

* **Nautical chart + HUD (`01-havn-liggende.jpg`, top-left)**: The ECDIS chart with `lite / mye` bathymetry and tabular coordinates/telemetry (`DIESEL`, `LAST`, `ENERGI`, `SJØ`, `Kulde`) is crisp, atmospheric, and authentic.
* **Dekksdagbok (`46-dekksdagbok-liggende.jpg`, plus `01` bottom-left spine)**: The physical logbook with cream ruled pages, blue pen handwriting, red margin rule, and coloured edge tabs is standout worldbuilding.
* **Kystposten (`25-app-post-liggende.jpg`)**: The newsprint palette and serif editorial headlines give real coastal flavour.
* **Visual-first fish & rules tools (`30-app-regler-liggende.jpg`, `36-app-guide-liggende.jpg`)**: The colour-coded species × gear matrix (`✓ / ! / ×`) in `30` and the 12-month strip + abundance bars in `36` communicate complex regulations and seasons at a glance.
* **Painted equipment & boat art (`02`, `03`, `06`, `07`, `09-staaende`, `45`)**: The custom painted illustrations give tactile warmth and immediate item recognition.
* **Ethical, calm UX & token foundation (`33-app-kaiboden`, `styles-tokens.css`)**: Zero dark patterns, no fake urgency/countdowns, calm Norwegian explanations, and well-engineered mobile touch/safe-area/surface tokens in `styles-tokens.css`.


---

# Runde to, 13.11.2026 (hele, uredigert)

99 bilder: underfanene, dagbokas faner, innlastingen, og skjermene med 3D (`hud..`). Tre av «funnene» er feil i skjermbildene, ikke i spillet; se «Runde to» i `design-ombygging.md`.

### 1. With 3D visible (`hud01`–`hud08`)

* **Coverage of boat and sea:**
  * `hud01-havn-liggende.jpg` & `hud01-havn-staaende.jpg`: **SEE** — HUD leaves ~80–85% of the scene clear; the boat at the yellow-edged concrete pier sits cleanly in the lower-middle in both orientations.
  * `hud03-maler-over-3d-staaende.jpg`: **SEE** — The `Malerverksted` bottom sheet covers ~85% of the vertical screen, squeezing the boat into a narrow ~140 px top strip. The top-left status card (`06:33 · I havn i Finnsnes`) covers the bow, the compass numbers (`60 75 Ø 105`) sit across the white fish tub and wheelhouse, and the bottom HUD bar (`Butikk`, `Bygd`, `Verft`, `Om bord`) covers the `Flagg` row at the bottom of the sheet and clips `DEKKSDAGBOK` to `DEKKSDAGB`.
  * `hud04-telefon-over-3d-liggende.jpg`: **SEE** — The phone mockup sits on the right (~28% width, ~85% height), leaving the boat and harbour completely uncovered.
  * `hud04-telefon-over-3d-staaende.jpg`: **SEE** — The phone covers ~45% width × ~60% height in the bottom-right, slicing straight across the stern of the boat and physically covering the bottom bar (`Verft` is half-covered, `Om bord` and the phone toggle button are hidden behind the phone bezel).
  * `hud05`–`hud08`: **SEE** — No menus open; the boat sits unobstructed in the middle of the sea.
* **Does the HUD compete with or support the 3D picture?**
  * **Competes — Chart glare:** In `hud01` (night harbour) the mini-chart uses dark olive land; in `hud04` (same night harbour!) the mini-chart suddenly flips to bright beige land; in `hud05`/`hud06` (at sea) the mini-chart turns into a bright white/yellow/green heatmap square in the top-left corner that visually overpowers the moody twilight sea.
  * **Competes — Attribution bar & floating elements:** In `hud01`–`hud08`, the bright light-grey `© Kartverket...` pill at bottom-left glows against dark water and crowds the `DEKKSDAGBOK` spine. In `hud05-til-sjos-staaende.jpg`, a seagull wing sticks out from behind the status card.
  * **Supports — Placement in `hud01` / `hud05` wide:** Top-left stacking of chart + status card and bottom-center grouping of action circles keep the center viewport clean when no overlay is open.
* **Unreadable against 3D (contrast / size):**
  * **Top-center compass tape** (`hud01-havn-liggende/staaende`, `hud05-06`): **SEE** — Bare white/grey tick marks and numbers (`15`, `30`, `105`) have almost no dark backing container; in `hud01-havn-staaende` and `hud03` they blend into dark mountains, night sky, and the boat’s hull/cabin.
  * **At-sea toast pill** (`hud05-til-sjos-liggende/staaende`): **SEE** — `Kystposten: Rekordpris på torsk: 58,86 kr/kg` above the bottom buttons uses muted grey text on a dark translucent pill over dark water (low contrast).
  * **Upright status card omissions** (`hud01-havn-staaende`, `hud05-til-sjos-staaende`): **SEE** — The upright card shrinks to 3 lines, dropping the fuel/load/energy progress bars and dropping `Regler ✓ Lov her ›` completely at sea (`hud05-staaende` vs `hud05-liggende`). **INFER** — Upright players lose their at-a-glance legality indicator (`Lov her`) and visual tank/battery bars.
* **Impact on round-one layout proposals:**
  * **Upright sheet height:** **SEE** in `hud03` — "content-sized" is not enough when content is long; upright sheets over 3D need a strict max-height (~55–60%) or must hide the top HUD/compass and re-frame the boat, and must sit *above* (or replace) the bottom bar so they never clip rows or cover buttons.
  * **Wide drawer width:** **SEE** in `hud01-havn-liggende` & `hud04-telefon-over-3d-liggende` — the boat sits slightly right of center. Widening the side drawer to ~550 px will cover the boat unless the 3D camera shifts left when a drawer opens.
  * **Phone size:** **SEE** in `hud04-telefon-over-3d-staaende` — even the small phone already collides with the bottom bar; an expanded tablet-sized phone must act as a full modal/overlay (hiding the bottom bar), not float over active HUD buttons.

---

### 2. At sea (`hud05`–`hud08`)

* **Primary actions needed & visibility:**
  * **Steer / throttle / autopilot:** **SEE** — Speed (`0,6 kn`) and heading (`306°`) are shown, and `hud07` has `Autonav` at bottom-right, but on the primary sea HUD (`hud05`, `hud06`) there is **no visible rudder, throttle, helm, or chart button**. **INFER** — Players must either tap/drag blindly on the water or discover that tapping the top-left mini-chart opens `hud07`.
  * **Fish / anchor / inspect boat:** **SEE** — All three are clearly visible at bottom-center (`hud05`, `hud06`).
  * **Check rules / prices / log:** **SEE** — Phone button (bottom-right) and `DEKKSDAGBOK` (bottom-left) are visible; `Regler ✓ Lov her ›` is visible in `hud05-liggende` only, missing in `hud05-staaende`.
* **What each bottom button does (`hud05`, `hud06`):**
  * `Jukse` (hook icon, bright magenta ring): **SEE / INFER** — Primary/active fishing mode; starts or controls handline/jigging (`juksa`).
  * `Kast anker` (`For dypt`, dimmed grey anchor): **SEE** — Drop anchor, currently disabled because depth (`21,4 m` in `hud07`) is too deep.
  * `Om bord` (cube icon): **SEE** — Opens the `Om bord` management drawer.
* **Chart plotter (`hud07`) & route (`hud08`) vs. 3D view:**
  * **Not distinguishable in content:** **SEE** — In `hud07-kartplotter-liggende/staaende` and `hud08-rute-liggende/staaende`, **no 2D nautical chart or route line is rendered at all**. The viewport shows the exact same 3D boat and dark ocean as `hud05`/`hud06`, with only the mini-chart removed, a top telemetry strip added, and white map buttons (`Zoom`, `Autonav`, `North arrow`) floating on empty water. **INFER** — The chart canvas failed to draw or is occluded/transparent, making `hud07`/`hud08` unusable for navigation.
* **Top bar legibility (`hud07`, `hud08`):**
  * **SEE** — Primary white readouts (`300°`, `0,6 kn`, `21,4 m`, `+0,3 m ↓ fjære 13:12`, `↑07:20 ↓16:55`) and magenta `Lukk` are readable, though tightly packed in upright (`hud07-staaende`). However, the muted blue/grey labels (`HDG`, `SOG`, `POS`, `DYBDE`, `TIDEVANN`, `SOL`) with tiny dotted underlines and secondary `COG 210°` are very small (~9–10 px) and low-contrast against the dark navy bar.

---

### 3. Sub-tabs (`rest02`–`rest38`)

* **Too many tabs / scrolling without affordance:**
  * **`Milepæler` (`rest32`–`rest37-app-merker-fane2..7`):** **SEE** — Only 3 tab pills (`Første uke`, `Merker`, `Rekordfisk`) are visible in the row, yet `rest34` (`Fra gamle dager`), `rest35` (`Tatoveringer`), `rest36` (`Kystfareren`), and `rest37` (`Kystkartet`) show **all 3 visible pills unselected (white)**. There are 7 tabs total with 4 hidden off-screen and zero scroll indicator, fade, or arrow.
  * **`Kvote` (`rest24`–`rest26-app-kvote-fane2..4`):** **SEE** — Only 3 pills (`Mine kvoter`, `Åpen gruppe`, `Bestand`) show, yet `rest26` (`Den felles kvoten 2027`) leaves all 3 visible pills unselected—a 4th tab is hidden off-screen without affordance. Inside `rest26`, 5 sub-pills (`Registeret`, `Hjemler`, `Strukturkvoter`, `Dine`, `Solgt`) also wrap across two rows.
  * **`Båthandel` (`rest02`–`rest04-skuff-fartoy-fane2..4`):** **SEE** — In wide mode (`rest02-liggende`), the 4 pills (`Åpen gruppe`, `Med hjemmel`, `Kystflåten`, `Havfiske`) wrap to 2 lines; in `rest38-app-nett-megler`, two separate filter groups both wrap onto 2 lines inside the narrow phone.
* **Near-empty or broken/duplicate tabs (both files named):**
  * **Broken / stuck tab state:** `rest05` through `rest10-skuff-bank-fane2..7` (`Kystbanken`) **SEE** — All 6 pairs (12 screenshots) show the exact same `Regnskap` tab with `Kontoer` unselected; tabs 3–7 do not visibly exist or failed to switch.
  * **Full-page drawer duplicate:** `rest13..16-skuff-beholdning-fane2..5` and `rest17..20-skuff-arbeid-fane2..5` **SEE** — Both open the exact same `Om bord` drawer with identical 5 tabs (`Redskap`, `Rigg`, `Lasterom`, `Båten`, `Mannskap`): `rest13`=`rest17`, `rest14`=`rest18`, `rest15`=`rest19`, `rest16`=`rest20`.
  * **Cross-drawer duplicate:** `Redskap` drawer (`rest11`–`rest12-skuff-redskap`) duplicates tab 1 (`Redskap`) of `Om bord` (`rest13`–`rest20`).
  * **Market duplicate:** `Båthandel` (`rest02-skuff-fartoy-fane2` has `Alle båter hos Kystmegleren ›`) duplicates `Nettet -> kystmegleren` (`rest38-app-nett-megler`).
  * **Near-empty tabs:**
    * `Om bord -> Lasterom` (`rest14` / `rest18-staaende`): **SEE** — 3 bar rows + 1 checkbox + `Ingen fangst om bord.` leaves ~70% of the upright sheet blank white.
    * `Om bord -> Mannskap` (`rest16` / `rest20-staaende`): **SEE** — 3 small cards leave ~55% blank white.
    * `Oppdrag -> Bestillinger` (`rest29-app-ordl-fane2`): **SEE** — Single 3-line card (`Ingen aktive oppdrag...`), ~75% blank white.
    * `Salgslaget -> Mine landinger` (`rest22-app-salg-fane2`): **SEE** — 3 zero rows + `Ingen landinger ennå`, ~55% blank white.
    * `Redskap -> Om bord` (`rest11-skuff-redskap-fane2`): **SEE** — `Garn` and `Line` cards each contain only 1–2 lines of "none on board" text.
* **Tab rows with a different style:**
  * `rest39`–`rest42-dagbok-fane2..5`: **SEE** — Uses vertical, rotated, color-coded physical notebook tabs along the left edge instead of horizontal pills.
  * `rest02`–`rest04-skuff-fartoy`: **SEE** — Places its 4 category pills halfway down the scrolled body *below* 3 summary cards (`DU ER HER`, `Neste mål`, `Båter til salgs her`) instead of pinned under the header like `Kystbanken` (`rest05`), `Redskap` (`rest11`), and `Om bord` (`rest13`).

---

### 4. Deck log (`rest39`–`rest42-dagbok`)

* **Worth keeping, or duplicate?** **Not worth keeping as a 5-tab book.** Four of its five tabs duplicate existing phone apps or drawers:
  * `Sesonger` (`rest39-dagbok-fane2`) overlaps seasonal species timing in `Fiskeguide` (`rest31-app-guide-fane2`).
  * `Hendelser` (`rest40-dagbok-fane3`) duplicates price/weather event news in `Kystposten` (`rest21-app-post-fane2`).
  * `Utstyr` (`rest41-dagbok-fane4`) duplicates `Redskap -> I sjøen` (`rest11` tab 1).
  * `Salg` (`rest42-dagbok-fane5`) duplicates `Salgslaget -> Mine landinger` (`rest22-app-salg-fane2`).
  * Only the narrative `Dagbok` log (tab 1) adds unique flavor, and that belongs as a simple scrollable log feed rather than a fixed 2-page spread.
* **What breaks upright (`rest39`–`rest42-dagbok-fane2..5-staaende`):**
  * **SEE** — The fixed landscape 2-page book shrinks to ~50% of screen height with huge black bars top and bottom, making the italic handwriting text tiny (~8–9 px) and cramped.
  * **SEE** — The left index tabs (`Dagbok`, `Sesonger`, `Hendelser`, `Utstyr`, `Salg`) are squeezed flush against the left bezel (~20 px wide) with sideways text—too narrow for reliable touch.
  * **SEE** — In the bottom-left corner behind the dimmed backdrop, the closed `DEKKSDAGBOK` spine remains visibly sticking out even while the book is open.

---

### 5. Three dense data screens most needing redesign

1. **`Kvote` (`rest24`–`rest26-app-kvote-fane2..4`):**
   * **Why:** **SEE** — Crammed inside a narrow phone frame with a hidden 4th tab (`rest26`), 5 wrapped sub-pills (`Registeret`, `Hjemler`, `Strukturkvoter`, `Dine`, `Solgt`) pushing the data off-screen, multi-column tonne tables, and tiny illegible chart legends (`B_pa`, `B_lim` in `rest25`).
   * **Rebuilt shows first:** **Your boat’s remaining quota right now** (`Din kvote: X / Y t torsk` + progress bar + active group rule), with group tables, structure-quota registry, and stock biology charts in secondary tabs/accordions at tablet width.
2. **`Regler -> Sjekk` (`rest27-app-regler-fane2`):**
   * **Why:** **SEE** — Four stacked groups of **32 filter chips** (`Art`, `Redskap`, `Båtlengde`, `Når` including all 12 months) fill 100% of the phone screen; the actual rule answer is pushed completely off the bottom.
   * **Rebuilt shows first:** **A live Yes/No verdict card for your current boat, gear, position, and date** ("Lov å fiske torsk med juksa her nå" + exact gear/size limits), with compact dropdowns below only if you want to check another month or vessel class.
3. **`Kystbanken -> Regnskap` (`rest05`–`rest10-skuff-bank-fane2..7`):**
   * **Why:** **SEE** — A dense wall of accounting lines mostly reading `0 kr` / `-` / `-1 023 kr` (`Avskrivning på båtene`, `saldogruppe e`, `Penger utenom resultatet`, `Balanse nå`) squeezed into a ~380 px drawer column (`rest05-liggende`).
   * **Rebuilt shows first:** **3 headline numbers** (`Konto`, `Gjeld`, `Resultat i år`) + a simple "Inntekter vs. utgifter denne uka" breakdown, with tax depreciation and full balance sheet collapsed under `Detaljer`.

---

### 6. Loading screen (`rest43-aapning-innlasting`)

* **What it promises:** **SEE** — Both `rest43-aapning-innlasting-liggende.jpg` and `staaende.jpg` are **completely blank mid-grey screens** with only a faint radial gradient—no title, no boat/coast art, no spinner or loading text. It looks like an unstyled placeholder or frozen app rather than a coastal fishing game.
* **Do the menus live up to it?** **SEE** — The UI is split across four disconnected visual styles (dark translucent 3D HUD `hud01`, stark-white mobile cards `rest02–20`, a smartphone mockup `rest21–38`, and an antique handwritten notebook `rest39–42`), none of which connect to the grey void in `rest43`.

---

### 7. Final owner design decisions (A/B) before rebuild

1. **Phone container (`hud04`, `rest21–38`):** Floating narrow phone bezel over 3D (A) vs. Tablet-width modal/dashboard with phone only as launcher icon (B) -> **Recommend B** (fixes wrapped chips, clipped `Kvote` sub-tabs, and `hud04-staaende` HUD collisions).
2. **Duplicate management surfaces (`rest11–20`, `rest39–42`):** Keep separate `Redskap`, `Om bord` (`beholdning` & `arbeid`), and 5-tab `Dekksdagbok` (A) vs. One `Om bord` hub + fold logbook tabs into `Kystposten`/`Salgslaget`/`Logg` (B) -> **Recommend B**.
3. **Upright sheet height over 3D (`hud03`):** Content-sized sheets up to 85% height (A) vs. Hard 55–60% max-height above the bottom bar, or hide top HUD and frame boat above sheet (B) -> **Recommend B**.
4. **Wide drawer width (`rest02–20`):** Keep narrow ~360 px column (A) vs. Widen to ~540–600 px with 2-column grid and pan 3D camera left when open (B) -> **Recommend B**.
5. **At-sea helm & plotter (`hud05–08`):** Keep chart plotter separate with hidden mini-map trigger and no helm UI (A) vs. Fix 2D chart rendering in `hud07/08`, add explicit `Kart` button, and show steering/throttle/autopilot controls on sea HUD (B) -> **Recommend B**.
6. **Sub-tab navigation (`rest26`, `rest32–37`):** Horizontal pill strips that overflow off-screen silently (A) vs. Cap top-level tabs at ≤4 per view (or use a left sidebar on tablet) with visible scroll/active state (B) -> **Recommend B**.
7. **Orientation parity on status HUD (`hud01`, `hud05`):** Strip `Kulde`, bars, and `Regler` in upright (A) vs. Keep one unified compact status bar that always preserves `Regler`-status and critical gauges (B) -> **Recommend B**.
8. **Chart palette (`hud01`, `hud04`, `hud05`):** Flip between dark, tan, and blinding white/yellow heatmap (A) vs. Consistent low-glare twilight chart palette with translucent heatmap overlay (B) -> **Recommend B**.
9. **Component & HUD contrast (`hud01`, `hud03`, `rest12`, `rest15`):** Mixed dark-navy/magenta buttons and unbacked compass/toasts (A) vs. One component set (magenta primary CTA, ≥44 px targets) and dark frosted backing on compass/toasts (B) -> **Recommend B**.
10. **Loading screen (`rest43`):** Blank grey vignette (A) vs. Branded coastal title art + real loading progress indicator (B) -> **Recommend B**.

---

### 8. Changes / retractions from round one

* **Changed — "Content-sized sheets upright":** Seeing `hud03-maler-over-3d-staaende` proves content-sized sheets still grow to ~85% height, crushing the boat under the top HUD and colliding with the bottom bar (`Flagg` clipped, `DEKKSDAGBOK` cut). Upright sheets must enforce a **hard max-height (~55–60%)** or replace the HUD/re-frame the camera, and must never overlap the bottom bar.
* **Changed — "Wider drawer in wide format":** Seeing `hud01-havn-liggende` and `hud04-telefon-over-3d-liggende` shows the boat is positioned slightly right of center. Expanding wide drawers to 550–600 px requires **shifting the 3D camera target left** (or treating full-management drawers as dimmed overlays) so the drawer doesn't bury the boat.
* **Changed — "Expand the in-game phone to tablet size":** Seeing `hud04-telefon-over-3d-staaende` shows even the *small* phone already covers `Verft` and `Om bord` in the bottom bar. An expanded tablet-sized phone **cannot float over the HUD**—it must behave as a dedicated modal that hides the bottom bar and uses its own close button.
* **Expanded — Merge list:** Round two revealed `rest17–20` (`skuff-arbeid`) is a 100% duplicate of `rest13–16` (`skuff-beholdning`), and `Dekksdagbok` tabs 2–5 (`rest39–42`) duplicate `Fiskeguide`, `Kystposten`, `Redskap`, and `Salgslaget`. Retiring `skuff-arbeid` and dismantling the 5-tab book are now higher-priority merges than seen in round one.
