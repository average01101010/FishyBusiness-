# Etter Tonys spilltest: rund eller sløyd, kø ved mottakene, båtsalg mellom spillere (plan 07.11.2026)

Jonas 07.11.2026, etter rapporten fra Tonys spilltest (`docs/BACKLOG.md`, «Strøket 06.11.2026 (Tonys spilltest)»): «Vi må finne ut hva som er normalen når det kommer til rund eller sløyd fisk», «La det være mulig at det blir kø ved mottakene … Det insentiverer at brukerne sprer seg i landet», og «Her må vi bygge salg mellom spillere, med en liten kommisjon til skipsmegleren … båtene som ligger til salgs hos skipsmegleren skal utelukkende være båter andre brukere selger … quicksell … EAFC/FIFA … Om en spiller ikke finner båten han ønsker hos skipsmegleren skal den alltids kunne kjøpes på verftet til fullpris.»

Dette er en plan med valg, ikke noe som er bygd. Rettingene fra samme dag (varselet for vann i båten, blåsesettets navn) står i `docs/systemer/`.

## 1. Rund eller sløyd fisk: normalen, og det spillet gjør

### 1.1 Slik er det i virkeligheten

- **Sluttseddelen og kvoten føres i rund vekt** (levende vekt). Det som leveres sløyd, regnes om med Fiskeridirektoratets offisielle omregningsfaktorer: torsk sløyd uten hode × 1,5, hyse × 1,4, sei × 1,35 ([J-216-2021, offisielle norske omregningsfaktorer](https://www.fiskeridir.no/j-meldinger/J-216-2021/_/attachment/download/169c44ca-6d42-4794-8486-16f70c2ac130:9f24d6b2e1b4e196865ddee2f4d69c6db780073b/offisielle-norske-omregningsfaktorer-for-fisk.pdf)).
- **Minsteprisene settes per produkt.** Råfisklagets liste er for sløyd uten hode (torsk over 2,5 kg 55,00 kr/kg fra 1.7.2026, 1–2,5 kg 45,00, under 1 kg 37,00; [Vest-Norges Fiskesalslag gjengir lista](https://www.vnf.no/media/1383/minstepriser-2026.pdf)). Prisen for rund fisk er den samme delt på faktoren: 55,00 / 1,5 = 36,67 kr per kg rund. For hyse og sei trekkes 30 øre per kg rund som vederlag for kjøperens sløying ([Råfisklaget: nye faktorer for omregning av minstepriser rund torsk og hyse](https://gammel.rafisklaget.no/portal/page/portal/RafisklagetDokumenter/Utgatte_meldinger/Nye%20faktorer%20for%20omregning%20av%20minstepriser%20rund%20torsk%20og%20hyse)). Fiskeren betaler ikke sløyingen når fisken selges rund; biproduktene (lever, rogn, hoder) tilfaller kjøperen ([Råfisklaget rundskriv 2013](https://gammel.rafisklaget.no/portal/page/portal/RafisklagetDokumenter/Rundskriv/Rundskriv_2013_9.pdf); [Høyesterett 2016, Tufjordbruket](https://www.domstol.no/globalassets/upload/hret/avgjorelser/2016/avgjorelser-april-2016/sak-2015-2147.pdf)).
- **Umiddelbar sløying på mottaket regnes som en del av landingen** (landingsforskriften § 3; [Fiskeridirektoratets høring 2016](https://www.fiskeridir.no/Yrkesfiske/Dokumenter/Hoeringer/Omregningsfaktorer-for-produkter-av-torsk-nord-for-62-N-i-vintersesongen-og-umiddelbar-sloeying-som-del-av-landingen/_/attachment/download/98f03f43-6075-40ab-afe3-31ee9c34f1b7:f2b053cbbcac831c293e3fd4d9cac29c86968b01/Hoering-Omregningsfaktorer2016.pdf)). Det er det de små båtene gjør i vintersesongen: fisken bløgges om bord og leveres rund, og mottakets sløyelinje tar resten. Regjeringen har sagt at når torsk landes rund og sløyes på mottaket før veiing, skal en reell faktor brukes for rund vekt ([regjeringen.no](https://www.regjeringen.no/no/aktuelt/vil-klargjore-regelverket-for-bruk-av-omregningsfaktor/id3053906/)).
- **Kvalitetsforskriften** (FOR-2013-06-28-844 § 7 og § 8) krever bløgging i takt med opptaket og sløying snarest mulig etter utblødning; fisk med mye åte skal sløyes før buktæring ([Mattilsynet: bløgging og sløying](https://www.mattilsynet.no/mat-og-drikke/matproduksjon/fisk-og-sjomat/regler-ved-fiske-landing-og-omsetning-av-fisk/blogging-og-sloying)). Den gamle 12-timersregelen sto i 1996-forskriften og er trolig borte; ikke bekreftet.
- **Normalen, kort:** sjarker og andre småbåter med én eller to om bord leverer ofte rund, bløgget fisk som mottaket sløyer, særlig i skreisesongen. Båter med mannskap sløyer om bord og leverer sløyd (med eller uten hode), og får da lever og rogn i tillegg. Begge er vanlige, og begge er lovlige.

### 1.2 Det spillet gjør i dag (og hvorfor det ikke er feil)

- Prisene står per kg rund vekt som i virkeligheten (`docs/systemer/priser-og-salg.md` 5.4). Håndteringen betales alt: bløgging (ublødd holder halvparten så lenge, klassen faller), ising (ferskheten og klassen E/A/B/X/V), og sløying om bord gir lever og rogn og slipper sløyetrekket på 0,30 kr/kg for hyse og sei.
- **Valget finnes alt:** «Sløy fangsten» under Innstillinger (`S.settings.gut`, `catchGut()`): av, og fisken leveres rund; mottaket sløyer, trekker 0,30 kr/kg for hyse og sei, og lever og rogn er borte. Men valget ligger gjemt i Innstillinger, sluttseddelen sier ikke «rund» eller «sløyd» per linje, og ingen forteller spilleren forskjellen i kroner.

### 1.3 Forslag (fase R)

- **R1 Valget synlig der det gjelder.** «Sløy om bord» som en bryter på Om bord-siden og i Driftsplanen (per båt, ikke en global innstilling), med én linje: «Rund: mottaket sløyer, −0,30 kr/kg på hyse og sei, ingen lever og rogn. Sløyd: lever og rogn på seddelen (torsk 5 % lever, rogn 4 % i januar–april).»
- **R2 Sluttseddelen sier det.** Hver linje merkes «rund» eller «sløyd u/h», og seddelen får en linje «Sløyd på mottaket: −N kr» når det er rund fisk av hyse og sei. Lever og rogn står alt.
- **R3 Torskens sløyetrekk.** Råfisklaget trekker ikke for torsk; mottaket tjener i stedet på biproduktene. Spillet gjør det samme i dag. Ingen endring.
- **R4 Småbåtene alene.** Alene om bord kan du ikke sløye mens du fisker (regelen fra 23.10.2026). Rund levering er da den naturlige veien for en som fisker mye, og R1 gjør det synlig at det er et valg og ikke en straff.

**Valg V1:** A: R1 + R2 (anbefalt, én økt). B: bare R2. C: la det stå som i dag.

## 2. Kø ved mottakene

### 2.1 Slik er det i virkeligheten

I sesongen står båtene i kø ved mottakene i Lofoten og på Senja; mottaket losser én eller to båter om gangen etter kranene og kaiplassen, og resten venter på fortøyningsplass eller på svai utenfor. Søket fant ingen kilde som tallfester køene (Fiskeribladet og Kystmagasinet skriver om det hver vinter, men sidene er bak betalingsmur). Tallene under er anslag.

### 2.2 Slik er det i spillet i dag

Hver spiller losser i sin egen simulering. Mottakskaia reserveres ikke, kranen er alltid ledig, og to spillere losser samtidig uten at noen merker det. De andres båter vises ved kaia (presence), men blokkerer ingenting. Mottakets kai har lengde og dybde fra kjøperregisteret (`mottak.json` `q`, `06b-coastports.js`).

### 2.3 Forslag (fase K)

- **K1 Losseplasser per mottak.** `slots = clamp(floor(kailengde / 25 m), 1, 4)` fra registerets kaifront (Husøy 62 m: 2; de store med 100 m: 4; de små: 1). Havbåtenes paller teller to plasser. Tallene justeres i spilltesting.
- **K2 Køen på serveren.** Tabellen `landing_q (port, player_id, vessel, kg, since, until)` med RPC `land_begin(port, kg, dur)` som gir plassen eller plassen i køen, `land_end`, og en opprydding: en rad utløper ved `until` + 3 min, så en lukket fane aldri holder kaia. Køen er FIFO etter `since`. Serveren er sannheten; klienten spør hvert 15. sekund mens den ligger i kø, som posisjonene.
- **K3 Slik ser spilleren det.** Ved ankomst med fisk: «Kø ved mottaket: 2 båter foran deg, ca. 11 min» på stripa og i boksen, med «Vent» (båten ligger fortøyd ved ventekaia eller på svai) og «Lever et annet sted» som åpner kartet med de tre nærmeste mottakene og deres kø nå (det er dette som sprer spillerne). Lossingen starter av seg selv når plassen er ledig, og push-varselet «Framme» får en søster: «Din tur ved kaia i Senjahopen». Driftsplanen venter som ved stengt mottak (`portBusy`).
- **K4 Tiden i kø teller.** Fisken ligger iset og holder seg som i lasten (ingen ekstra straff); den som leverer rund fisk uten is, taper ferskhet som i dag.
- **K5 NPC-flåten tar ikke plasser** i første runde (de losser i sin egen verden). Kan slås på senere som et sesongtrykk: i skreisesongen tar kystflåten 0–1 plass ved hvert mottak etter fangstdataene (`mk.boats`).
- **K6 Juks.** Køen holdes av serveren, og en spiller kan bare ha én plass. Et mottak «fullt» av lukkede faner er umulig på grunn av utløpet.

**Valg V2:** A: K1–K4 nå, K5 senere (anbefalt, én økt pluss migrering). B: bare synlig kø uten venting (de andres lossinger vises, men du losser uansett). C: la det stå.
**Valg V3 plasser:** A: etter kailengden (K1, anbefalt). B: alle mottak 1 plass, de store 2. C: Jonas setter tallene i admin per mottak.

## 3. Båtsalg mellom spillere (Kystmegleren)

### 3.1 Jonas' bestilling

Bare brukte båter fra spillere hos megleren, ingen NPC-oppføringer; kommisjon til megleren; quicksell for den som ikke vil følge opp; EAFC/FIFA-mønsteret; verftet selger alltid nytt til full pris.

### 3.2 Slik er det i dag

`core/09k-market.js` lager ukas NPC-oppføringer deterministisk av klokka (M4, like for alle, bud én gang om dagen, takst, kjøp der hun ligger). `vesselValue` (70 % av nyprisen + halve 90-hesteren + 95 % av tillatelsene) er det «Selg» gir, straks. Ingen tabell på serveren.

### 3.3 Forslag (fase B), etter EAFC-mønsteret

- **B1 Oppføringen.** «Legg ut til salgs» fra Rederi eller verftet: startpris, «Kjøp nå»-pris (valgfri) og varighet (1 time, 6 timer, 1 døgn, 3 døgn i ekte tid). Båten låses (kan ikke seiles) og ligger ved nærmeste verft til salget er over. Med følger utstyret om bord (listen som i dag), tilstanden (skrog, motortimer) og hjemmelen om Jonas vil (V5).
- **B2 Budene.** Et bud binder pengene (escrow i `cash_flags`-stil på serveren), høyeste bud vinner når tiden går ut, «Kjøp nå» avslutter straks. Minste bud = startprisen, neste bud minst 2 % over. Et overbudt bud frigis. Grenser mot juks: startprisen minst 40 % og «Kjøp nå» høyst 160 % av `vesselValue`, høyst 3 oppføringer per spiller, og en båt som ikke selges, kommer tilbake til eieren ved verftet.
- **B3 Oppgjøret.** Selgeren får prisen minus kommisjonen (5 %, V4) når salget er over; kjøperen henter båten der hun ligger («hent selv», som i dag) eller lar megleren levere til et verft nær kjøperen for 2 % av prisen (en ekte meglertjeneste). Lån på båten innfris først, som ved «Selg».
- **B4 Quicksell.** «Selg nå» til megleren for `vesselValue` × 0,9 (han tar 10 % for risikoen), straks. Båter megleren kjøper slik, legges ikke ut igjen i første runde (V6).
- **B5 Markedet uten NPC-oppføringer.** `mktEvery` tas ut av Nettet; Kystmegleren viser bare spillernes oppføringer, sortert etter avstand, pris og tid igjen, med søk og «ønske» som i dag (ønsket varsler med push når en passende båt legges ut). Tomt marked sier: «Ingen båter til salgs nå. Verftet selger nye til full pris.»
- **B6 Verftet.** Som i dag: alle typer til nypris, alltid. Det er gulvet som gjør at ingen blir stående uten båt.
- **B7 Server.** Tabellene `listings (id, seller, vessel json, start, buynow, until, port, state)` og `bids (listing, player, kr, at)`, RPC-er `listing_put`, `listing_bid`, `listing_buy`, `listing_cancel`, `listings_get(x, y, r)`, og en edge-funksjon eller pg_cron hvert minutt som gjør opp utløpte oppføringer (vinneren får `vessel json` i en innboks, `grants`-mønsteret, så båten kommer inn i flåten når spillet åpner). Juks mot seg selv (to kontoer) begrenses av kommisjonen og grensene i B2.
- **B8 Hjemmelen.** I virkeligheten følger ikke en deltakeradgang automatisk med båten (deltakerloven § 4, § 29 for åpen gruppe). Spillet selger i dag hjemmelen med båten (`licValue`). Beholdes slik i første runde, men merket på kortet.

**Valg V4 kommisjon:** A: 5 % (anbefalt). B: 3 %. C: 10 %.
**Valg V5 hjemmelen:** A: følger båten som i dag, merket (anbefalt første runde). B: selges separat («hjemmel til salgs»), som i virkeligheten der kvoter omsettes.
**Valg V6 quicksell:** A: 90 % av `vesselValue`, båten forsvinner (anbefalt). B: 80 %, og megleren legger den ut igjen til 110 % (gir markedet tilbud fra start).
**Valg V7 rekkefølge:** A: K (køen) først, så B, så R (anbefalt: køen er liten og sprer spillerne nå). B: B først.

## 4. Antatt og usikkert

- Køtallene (K1) og kommisjonen er anslag. Omregningsfaktorene og minsteprisene er fra kildene over (2026-lista via VNF; Råfisklagets egen side bør sjekkes mot den).
- Kvalitetsforskriftens gjeldende ordlyd om tid til sløying er ikke bekreftet (bare § 7 og § 8 via Mattilsynet).
- Spillerbasert marked uten NPC-tilbud blir tomt de første ukene med få spillere. B6 og «ønske»-varselet er svaret; alternativet er å la de tre siste NPC-oppføringene stå til det finnes ti spillere (ikke anbefalt, Jonas vil ikke ha flooding).

## Jonas' valg (07.11.2026)

- **V1 A, V2 A, V3 A, V4 A, V5 A, V6 A, V7 A.**
- **Om V5:** Jonas: «Kvoter kan vel selges med båten på ekte også? Men planen min er å lage et kvotemarked også der man kan kjøpe og selge kvoter.» Svaret: ja, i praksis følger kvotegrunnlaget båten når den selges «for fortsatt drift» og Fiskeridirektoratet godkjenner kjøperen (deltakerloven §§ 6–7: aktiv fisker, ervervstillatelse); strukturkvoter kan flyttes mellom fartøy i samme gruppe. Et eget kvotemarked (kjøp og salg av kvoter mellom spillere) er en egen plan som kommer etter B, og B8 holder hjemmelen med båten til den er skrevet.

## Status

- Planen skrevet 07.11.2026, gren `ccr-a9ff699b-re4zwf`. Valgene tatt 07.11.2026 (alle A). Rekkefølgen etter V7 A: K (køen, med migreringen `landing_q`), så B (båtsalget, med `listings` og `bids`), så R (rund/sløyd synlig). Jonas 07.11.2026: «Fiks det du» (migreringen kjørt herfra). K1–K4 og K6 bygd 07.11.2026 (`docs/systemer/havner-og-mottak.md`, «Køen ved mottakene»); K5 venter. Neste: B.
