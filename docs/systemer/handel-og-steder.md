# Handelsstedene: butikken, verftet og mottaket som steder

> Flyttet ordrett fra `docs/OVERLEVERING.md` 26.10.2026 (`docs/utviklingsplan.md`, fase A). Tallene i overskriftene er de gamle kapittelnumrene; `docs/systemer/gamle-numre.md` viser hvor hvert nummer havnet. Nytt skrives inn her, under det systemet det gjelder.

## 5.25k Butikken: haill, trim og verftet for ekte penger (05.10.2026)

Jonas: «hele spillet skal være free-to-play, men med betalte boostere i form av haill-appen og trim-appen og betaling for å hoppe over verkstedtid». Først «Ja til Managed Payments», så «Nei til managed payments. Vi kan eventuelt aktivere dette når vi går internasjonalt». Om samtykket: «Gjør dette på en intuitiv måte som tar fokuset bort fra handlingen, vi må tenke salg salg salg», «gjør det nesten usynlig».

- **Varene** (`products` i databasen, `supabase/migrations/20261006040000_shop.sql`):

  | id | Vare | Pris |
  |---|---|---|
  | `haill`, `luksus` | Haill, luksushaill | 29 kr, 59 kr |
  | `trim_pump`, `trim_ic`, `trim_turbo` | Trim +50 % / +75 % / dobbel fart | 29 kr, 39 kr, 49 kr |
  | `verft_na` | Verftet ferdig nå | 19 kr |

  Prisen som trekkes, står i databasen. Spillet viser sine egne (`HAILL`, `BOOSTS`, `YARD_NOW_NOK`), så de må stemme overens.
- **Kjøpet** (`ui/10i-shop.js`):
  1. Kjøpsknappen går rett til betalingen, uten noe vindu imellom (`payBuy`, `shopGo`, ikke `shopBuy`, som er butikken på kaia).
  2. Edge Function `shop-checkout` henter varen med spillerens egen innlogging (`shop_quote`), lager en Stripe Checkout-side i NOK med prisen inkludert MVA og skatteklassen `txcd_10201001`, og skriver kjøpet som åpent (`purchases`, med båten i `data`).
  3. Stripe sender spilleren tilbake med `?kjop=<økt>`.
- **Bokføringen** (Edge Function `stripe-webhook`, signaturen sjekkes først):
  - Betalt: `shop_paid` bokfører kjøpet og lager én `grants`-rad per kjøp, uansett hvor mange ganger Stripe sier fra.
  - Utløpt eller feilet: `shop_ended`.
  - Refundert i sin helhet: `shop_refund` tar tilbake en vare spillet ikke har gitt ennå.
- **Leveringen:** spillet spør `shop_pending` ved start, når det kommer tilbake fra Stripe (flere ganger de første 45 sekundene) og når det blir synlig igjen. Det gir varen (`shopGive`: haill i beholdningen, trim på båten kjøpet gjaldt, eller verftet ferdig på den båten), husker id-ene i `S.shopGiven`, så ingenting gis to ganger, og sier fra med `shop_done`.
- **Hvem som får kjøpe** (`shopMode`):
  - `live`: innlogget, og Stripe er satt opp (`GET shop-checkout` gir `ready`).
  - `test`: uten skyen (artifacten og testene), og for admin før Stripe er satt opp. Varen gis med én gang, uten betaling.
  - `off`: «Snart i salg». Ingen får noe gratis på detstorebla.no.
  - Den gratis luksushaillen i «Første tur» går utenom butikken som før.
- **Angreretten:** en liten, dempet linje under hver kjøpsknapp (`shopFine`, `.shop-fine`) og den samme setningen ved betalingsknappen hos Stripe (`custom_text`): varen leveres med én gang, og angreretten faller da bort (angrerettloven § 22 bokstav n). Linja må være lesbar for at samtykket skal gjelde.
- **Brytere** (hemmeligheter i Supabase): `STRIPE_SECRET_KEY` og `STRIPE_WEBHOOK_SECRET`. `STRIPE_MANAGED=1` gjør Stripe til selger (Managed Payments), og er av. `STRIPE_TAX=1` lar Stripe Tax legge på MVA når foretaket er MVA-registrert.
- **Tester:** `tests/kjoptest.py` (spillet med stand-ins for Stripe og Supabase) og `tests/sqltest.py` (databasen).

## Butikker, markeder og sponsorer (plan 30.10.2026, M0 gjort)

Planen `docs/planer/butikker-og-sponsorer.md` (Jonas: «kjør» 30.10.2026, alle valg etter anbefalingen: V1–V12 = A) bygger butikkene om i ni økter M0–M9: ett felles varekort, butikken på ny med Nettet-appen (se og bestille på telefonen, overta på stedet), prøv før du kjøper, bruktmarkedet i meglerens side, kjøpsøyeblikket, sponsor-grunnmuren i databasen, skilt med måling etter IAB, de andre formatene og mediekortet. **M0 (30.10.2026):** reglene (`CLAUDE.md`, `docs/engasjement.md`, `docs/handelssteder.md`), personvernerklæringen (nytt kort «Sponsede skilt og varer», måling bare med samtykke til statistikk), vilkårene (avsnittet «Samarbeidspartnere» under 3) og kildesiden («Samarbeidspartnere: Ingen ennå.»). Ingen spillkode er endret i M0; sidene rulles ut først når grenen flettes inn i arbeidsgrenen. Status per økt står nederst i planfila.

**M1 Varekortet (30.10.2026):** `ui/05a-itemcard.js` har kortet (`itemCard(o)`: bilde, navn, én linje med tall, pris med anker, stand, «om bord», knapper, «Mer»), bildene (`ICPIC`, små sideriss i SVG for hver vare, ingen WebGL og ingen ekstra filer), linjene (`ICFX`, regnet av kjernens egne tall: `JIG`, `GEAR[k].hand`, `LINE_KINDS`, `POTS`, `EQUIP.motor90.boost`), ankrene (`ICANCHOR`: for hånd mot haleren, håndjuksa mot juksamaskinen) og koblingen til Håndboka (`ICMORE`). Brukt i Fiskeutstyr (`fiske`, `redskap('kjop')`), Elektronikk og haler og verftets Oppgrader (`utstyr`, utstyret og klærne), Is (`iceCard`) og Agn (`agn`). Bekreftelsen står i selve knappen («Bekreft · pris» med ✕ ved siden) og faller tilbake etter `IC_CONFIRM_MS` (4 s). Leksikonteksten som sto på kortene, er flyttet til Håndboka som kapittel 8 «Utstyr og redskap» (`lex_*` i `HB`, `lex:true`: drypper aldri, ingen prikk, ingen «Jeg kan dette»); «Mer om …» åpner den ene oppføringen (`HBUI.only`, `data-hbid`) med «Hele Håndboka» tilbake. «Prisene er foreløpige» er borte fra butikken. Kjøp av utstyr, redskap og klær er fortsatt ett trykk (bare juksa, kveiteutstyr og is bekrefter), fordi mange tester trykker én gang; to trykk på dyrt utstyr kan tas i M2. Test: `itemcardtest.py` (begge formater, skjermbilder `itemcard_*.png`).

## 5.29b Handelssteder (regel, 07.10.2026)

- Tre steder handler man: utstyrsbutikken, fiskemottaket og verftet. Fars naust og rorbuene selger ingenting. Hele regelen, den vedtatte første turen og det som mangler (verftsmodellen, plassering av butikker og verft langs kysten), står i `docs/handelssteder.md`. Dagens spill har fortsatt alt på kaia i hver havn, også fra naustet.

## 5.32 De tre handelsstedene (Jonas 07.10.2026)

Regelen står i `docs/handelssteder.md`. Spillet har tre steder man handler: **fiskemottaket** (levere fisk, kjøpe is, agn og diesel), **utstyrsbutikken** (redskap, haler, juksamaskin, elektronikk, klær) og **verftet** (båter, motor og lasterom, antigro, vedlikehold, maling, diesel). Fars naust og rorbuene selger ingenting.

- **Stedene** (`core/06c-steder.js`, `src/data/steder.json`, `tools/steder/steder.py`): butikker og verft er egne havner med egen kai, havneenhet og navn av byen (aldri et firma): «Egersund verft», «Avaldsnes utstyrsbutikk». De lages som kystmottakene (`COASTQ`, `UNITS` med utseendene `s` og `y`, `PORTS` med `sted:'butikk'|'verft'`, `coastal`). Data: Overture Maps places (punkter, ingen navn, adresser eller telefon) lagt på nærmeste kai i vec-pakkene (minst 25 m, 3 m vann, innen 1,2 km, minst 130 m fra andre kaier), og oppdiktede steder der et mottak er langt fra et verft (50 km) eller en butikk (28 km). Nå 103 butikker og 157 verft, 206 av dem ekte punkter. Det lengste fra et mottak til nærmeste verft er 34 nm og til butikk 25 nm (indre Finnmark). Finnsnes har butikken og båthallen i ett (`sted:'butikk verft'`). `python3 tools/steder/steder.py` lager filen på nytt (trenger vec-pakkene fra `tools/map/game.py` og nett).
- **Hva et sted tilbyr** (`portServices(pt, berth)`): `{mottak, butikk, verft, bunker}`; ved naustet (berth `naust`) og rorbuer tom. `placesNear(p, kind, n)` gir de nærmeste.
- **Knappene** (`ui/10c-dock.js`): Mottak (Lever, Is, Agn, Bunkring), Butikk (Fiskeutstyr, Elektronikk og haler) og Verft (Båthandel, Oppgrader, Vedlikehold, Malerverksted, Bunkring) vises bare der stedet har dem, og Bygd finnes alle steder. Siden `utstyr` ble delt i verftets (lasterom, motor, antigro, påhengsmotor) og butikkens (`utstyrb`: resten av utstyret og klærne).
- **Kjøp bare der det hører til:** `shopBuy` (håndjuksa og kveiteutstyr bare i butikken, is bare på mottaket), `buyGear` (redskap i butikken, agn på mottaket) og telefonsidene (`atKind` i `ui/05-phone.js`). Siden sier hvor hun finner det, med nærmeste sted og «Autonav dit» (`nearHint`, handlingen `goplace`), også i Salgslaget.
- **3D:** stedene bruker harbour-unit-utseendene `s` og `y` (`harbour-unit-s/y.b64`); til de er laget tegnes mottaksutseendet `a`. Stedene er ikke mottak (`U.sted`), så kran, truck og folk legges ikke ut der.
- **Tester:** `stedertest.py` (stedene, tjenestene, knappene, kjøp og nærmeste), `docktest.py`, `shoptest.py` og `icestep.py`.

## 5.34 Verftet og utstyrsbutikken som havneenheter (Jonas 08.10.2026)

`tools/harbour/steder.py s|y` lager `harbour-unit-s` (butikken: toetasjes butikk fra Finnsnes-modellen, uten is og drivstoff, på plantenes kai) og `harbour-unit-y` (verftet). Verftet står på en **stor enhet** (`UNIT_Y` i `01-world.js`, `ugeo(U)`, `U.y`): kai på 120 m, dekk 34 m, basseng mudret til 13 m (ca. 11,5 m ved lavvann), hovedliggeplass x = -20 (90 m), bunkersliggeplass x = 30. Alt som før leste `UNIT.*` leser nå `ugeo(U)` (kjerne, 3D-terreng, 2D-kart). Det gjør at den største båten, den pelagiske tråleren (75 m, 15,5 m bred, 7,5 m dypgang), får plass og vann under kjølen. `BEAM` har nå også havbåtene, så de ligger en bredde ut fra kaia.

Modellen har hall (40 × 20 m, port mot kaia, skiltet VERFT · BÅTSALG), tilhenger- og blokkbåt, tønner og tømmer, dieselstasjonen (som plantens, så bunkringen er den samme) og skipsløftet: 14 vinsjhus langs kanten med trinse over kaifronten, og fire plattformer (14 × 6,4, 26 × 9,6, 56 × 14 og 90 × 21 m) med kjølblokker, og en kabel (`yard_cable`). Spillet (`liftStep`, `drawYardLift` i `view3d.js`) velger minste plattform som rommer båten (lengde + 3 m, bredde + 1,2 m) og skalerer den litt. Ved jobb av typen `hull` eller `repair` (slippen) stiger plattformen under kjølen (40 s), løfter båten til kaidekket, og senker den når jobben er ferdig. Båten ligger stille (ingen sjø, ingen fortøyningstau) mens den står oppe. Test: `tests/yardtest.py` (3D) og `stedertest.py` (geometri og dybde).

Ikke gjort: animert mannskap og kran ved løftet, lyd, og at stedene i `steder.json` er valgt for en 120 m enhet (de er valgt for 55 m; samsvar med nabohavner sjekkes ikke).

## 5.35 Plassering, ikoner, mottaksnavn og rutelistens tab (08.10.2026)

- **Plassering** (regelen står i `docs/handelssteder.md`, «Plassering av stedene»): `tools/steder/steder.py` og `tools/rorbu/rorbuer.py` lager `steder.json` og `rorbuer.json` på nytt. Ingen to steder (mottak, butikk, verft, rorbu, fars naust) nærmere enn 1,5 km, unntatt landsbyer uten andre kaier (0,6 km, aldri under 0,5). Kaia velges etter ly (eksponering fra `national.expo`) og gangavstand. Ekte verft kan flytte seg inntil 2 km til en bedre kai, verft tynnes ut (5 km mellom), og det legges inn oppdiktede verft der et mottak er mer enn 34 km (rundt 20 nm) fra nærmeste. Én utstyrsbutikk per poststed (ekte før oppdiktet, ingen i Finnsnes, der butikken står på kaia). Rorbuene ved mottakene står 1,5–4 km fra mottaket, i det mest skjermede (eksponering høyst 0,3) skjæret. `07d-rorbu.js` finner rett strand nær punktet. Kjente hull: 5 av 202 mottak ligger 37–44 km fra nærmeste verft, og 27 er over 37 km fra nærmeste butikk (størst 65 km: Båtsfjord, Røst, Kiberg), fordi kartpakkene ikke har noen ledig kai i de landsbyene. `tests/placetest.py` måler det.
- **Mottaksnavn:** `portLabel(p)` (`01-world.js`) gir «Stedet fiskemottak», «Stedet mottak» eller «Stedet fiskebruk» (utseende b = det gamle bruket), alltid det samme for samme mottak. Kartplotteren viser dem; teksten ellers sier fortsatt stedet.
- **Kartikoner** (`portIcon` i `03-map.js`, `portKind` i `01-world.js`): mottak en fisk i blå ring, utstyrsbutikk en krok i oransje firkant, verft et skrog på løft i grønn ring, fars naust et lite hus, ellers den gamle ruten.
- **Mannskapets dialekt og tekst over hodet** (08.10.2026, tilbakemelding #44): linjene er skrevet på nordnorsk. `crewDialect` (`14-crewlife.js`) bytter ord etter hvor mannskapet kommer fra (`homePort`, ellers spillerens hjemhavn): nord for 65° N som de står, så trøndersk, møring, vestlandsk og sørlandsk (`DIALECTS`). I 3D står linja som en boble over hodet på den som sier den i ti sekunder (`say3d` i `view3d.js`, `.say3d` i `styles.css`, kalt fra `hooks.onSay`); uten 3D er det en melding som før. `tests/saytest.py`.
- **Mottakets arbeidere kommenterer fangsten** (Jonas 08.10.2026): når sluttseddelen er utbetalt, sier én av de fire arbeiderne en linje (`plantSay`/`plantLine` i `09d-folk.js`, kalt fra `sell()` etter 0,9 s). Situasjonene vektes: mengde (`none`/`small`/`mid`/`big`/`huge`), haill-spørsmål ved lite fangst (`noLuck`, eller `luckFail` når haillen var på), kveite, blåkveite, kongekrabbe, skrei, sei, dårlig kvalitet, ferskt, inndratt kvote og første levering, pluss en regional replikk (`PSAYR`) skrevet på stedets egen dialekt. De andre linjene er skrevet nordnorsk og byttes med `dialectText` (`14-crewlife.js`, `dialectAt` etter breddegrad). Samme linje sies ikke to ganger på rad (`S.psayLast`). I 3D henger linja over hodet på arbeideren (`G3.sayWorker`, `P.wpos` fra `drawWorker`), ellers er det en melding; den står også i loggen. `tests/plantsaytest.py` (uten 3D). Boblen over hodet i 3D er ikke verifisert i en 3D-test.
- **Dybdelinjer og dybdetall** (08.10.2026, tilbakemelding #43): `chartRaster` (`03-map.js`) tegner dybdelinjer for hele kysten fra dybderasteret, i et eget gjennomløp etter at flisa er malt: Senjas nivåer (5 … 800) og 1000 m, færre jo lenger ut utsnittet er (200/500/1000 øverst). Utenfor kystflisene brukes havbunnslaget (`offDepth`, Terrarium, til 2500 m), ikke modellen. Linjer tegnes ikke der de to kildene møtes eller der lagret dybde har et trinn brattere enn en havbunn kan ha (10 piksler på tvers). `soundingsSvg` skriver dybdetall (hele meter, ett desimal under 10) i et rutenett som ligger fast når kartet dras, ca. hver 150. piksel. De gamle vektorlinjene (`.depc`) skjules i kartplotteren.
- **Knappene på kartet:** like store (48 px) og firkantige: start/pause, slett ruta (`#rClear`, tømmer det lagde utkastet), angre, gjør om og navigasjonspilen (`#zboat`). Zoomknappene er fjernet.
- **Rutelistens tab** (`#sideTab` i `08-actions.js`, CSS sist i `styles.css`): i kartplotteren skyver tab-en (ÅPNE/LUKK) rutelisten ut til høyre (liggende, `body.sidehide`, kartet blir like bredt som skjermen) eller ned (stående, `body.drawer`). Rute-knappen i toppen er skjult stående. `tests/sidetab.py`.
