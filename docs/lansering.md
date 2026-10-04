# Lansering av Det Store Blå: sjekkliste

Laget 04.10.2026, da spillet fikk navnet Det Store Blå og domenet detstorebla.no. Den viser det Jonas må gjøre selv (kontoer, avtaler, penger), valgene som må tas, og det Claude bygger når valgene er tatt. Lover og satser må sjekkes med regnskapsfører før lansering. Det som er merket «sjekk», er ikke bekreftet.

## A. Det du må gjøre selv

### 1. Domenet (først, det tar tid å slå gjennom)

Spillet skal ligge på Hetzner-serveren din, ikke på GitHub Pages (se G).

1. Legg inn DNS-postene hos registraren der du kjøpte detstorebla.no:
   - `A` for `detstorebla.no`: IPv4-adressen til Hetzner-serveren
   - `AAAA` for `detstorebla.no`: IPv6-adressen til serveren
   - `CNAME` for `www`: `detstorebla.no`
   - Det kan også gjøres gjennom Cloudflare (gratis): flytt navnetjenerne dit og legg inn de samme postene. Da får du hurtigbuffer for kartpakkene nær spillerne og beskyttelse mot angrep.
2. Si fra når postene er lagt inn. Serveren henter selv HTTPS-sertifikat fra Let's Encrypt (Caddy).
3. Lag e-post på domenet, for eksempel `post@` og `support@`. Det går hos registraren eller hos Google Workspace eller Zoho.

**Viktig om lagringene:** Lagringen ligger i nettleseren og hører til adressen. Når appen flytter fra `average01101010.github.io` til `detstorebla.no`, følger ikke lagringen med av seg selv. Spillet har alt lagringskoden under Innstillinger → Lagret spill («Kopier lagringen» og «Lim inn lagring»), som flytter spillet mellom artifacten og appen. Før byttet bør spillet varsle om koden, slik at spillerne tar den med seg. Det kan jeg legge inn.

### 2. Firma, bank og regnskap

- **Selskapsform:** ENK er raskt og billig, men du står personlig ansvarlig. Med AS er ansvaret begrenset, men det koster 30 000 kr i aksjekapital pluss gebyr og regnskap. Begge registreres i Brønnøysundregistrene via Altinn. Ta valget med regnskapsfører.
- **Bank:** en egen bedriftskonto. Stripe trenger den.
- **Regnskap:** et program (for eksempel Fiken eller Tripletex) og helst en regnskapsfører.
- **MVA:** i Norge blir du MVA-pliktig når salget passerer 50 000 kr på tolv måneder. Til forbrukere i EU skal det betales EU-moms fra første krone, gjennom ordningen non-Union OSS (sjekk). Stripe Tax kan regne ut og samle inn riktig sats.

### 3. Stripe (betaling)

1. Opprett konto på stripe.com med organisasjonsnummer, bedriftskonto og BankID.
2. Slå på Stripe Tax.
3. Lag produktene og prisene når forretningsmodellen er valgt (se C1).
4. Gi meg testnøklene. Den publiserbare nøkkelen (`pk_test_…`) kan stå i koden. Den hemmelige nøkkelen (`sk_…`) og webhook-hemmeligheten skal **aldri** i chatten eller i repoet. De legges i hemmelighetene til databasen (Supabase) og i GitHub Actions.
5. Signer databehandleravtalen (DPA) i Stripe-konsollen.

### 4. Database og innlogging

- **Anbefaling:** Supabase (Postgres, innlogging og serverfunksjoner) i EU-regionen Stockholm eller Frankfurt. Gratisnivået holder for test. Pro koster 25 USD i måneden og har daglig sikkerhetskopi.
1. Opprett organisasjon og prosjekt i Supabase (region EU).
2. Gi meg prosjektadressen og den offentlige `anon`-nøkkelen. `service_role`-nøkkelen holdes hemmelig, som Stripe-nøkkelen.
3. Velg innloggingsmåter: e-post med magisk lenke er enklest. Google kan komme i tillegg. Apple må med hvis appen kommer i App Store med Google-innlogging. Vipps Login kan komme senere.
4. Signer databehandleravtalen (DPA) i Supabase.

### 5. Juridisk

- **Personvernerklæring og vilkår (utkast 04.10.2026):** `src/legal/personvern.html` og `src/legal/vilkar.html`, bygget til `personvern.html` og `vilkar.html` ved siden av spillet (`/personvern` og `/vilkar` på serveren, som Googles innloggingsskjerm lenker til). De bygger på det spillet faktisk lagrer, og det gule står igjen for deg:
  - en e-postadresse på domenet (for eksempel videresending hos domeneselgeren). Organisasjonsnummeret (935 600 820) og adressen (Sandvikveien 131, 9300 Finnsnes) er fylt inn.
  - Aktiviteten i Enhetsregisteret er skipper- og matrostjenester. Spillsalg bør legges til med Samordnet registermelding i Altinn (sjekk næringskoden for utgivelse av dataspill).
  - regionen Supabase-prosjektet ligger i
  - varselet før nedleggelse (forslaget er 90 dager)
  - Google Fonts-linja går ut når skriftene ligger på vår egen server (punkt 181), og kildesiden må lages
  - når du godkjenner, fjernes utkastbanneret
- **Hull som må tettes før lansering:** «Slett kontoen» sletter alt hos oss, men ikke brukeren hos WorkOS (e-post og navn). Det krever et kall med WorkOS-hemmeligheten fra serveren, og det lages som en Supabase Edge Function sammen med Stripe-webhooken.
- **Tvister:** Mekling skjer i Forbrukertilsynet (ikke lenger Forbrukerrådet). Forbrukerklageutvalget kan bare avgjøre saker om varer, håndverkertjenester og angreretten, ikke om digitale ytelser ellers ([Forbrukertilsynet](https://www.forbrukertilsynet.no/forbrukerklageutvalget/behandling-forbrukerklageutvalget)). EUs klageportal (ODR) ble lagt ned 20.07.2025 og skal ikke nevnes.
- **Salgs- og brukervilkår:** For digitalt innhold faller angreretten bort når kjøperen uttrykkelig ber om levering med en gang og bekrefter at angreretten da går tapt (angrerettloven § 22 bokstav n). Det løses med en avkrysning i kassen som ikke er krysset av på forhånd, og bekreftelsen må stå i kvitteringen. Feil og mangler følger digitalytelsesloven (i kraft 01.01.2023).
- **Alder:** I Norge er aldersgrensen 13 år for å samtykke selv til nettjenester (personopplysningsloven § 5). Kjøp fra mindreårige bør kreve en voksen (sjekk).
- **Varemerke:** Søk opp «Det Store Blå» i Patentstyrets base (search.patentstyret.no). Det store blå er også den norske tittelen på filmen *Le Grand Bleu* fra 1988. Registrer navnet i klasse 9 (programvare) og 41 (spill). Gebyrene står hos Patentstyret.
- **Kartdata og kilder:** Spillet bygger på OpenStreetMap via Overture (ODbL), Kartverket (CC BY 4.0), Fiskeridirektoratet (NLOD), Råfisklaget og Havforskningsinstituttet.
  - ODbL krever at OpenStreetMap oppgis som kilde.
  - Kartpakkene er avledet fra OSM-data. Trolig må de da tilbys under ODbL når appen er offentlig (sjekk).
  - Spillet trenger en side med kildene.

### 6. App-butikkene (senere, kan vente)

- **Google Play:** utviklerkonto til 25 USD én gang. Appen kan pakkes som TWA (Bubblewrap). Digitale kjøp inne i Play-appen må gå gjennom Google Play Billing eller EUs ordning for alternativ betaling, med gebyr. Stripe kan bare brukes på nettet.
- **App Store:** 99 USD i året. Reglene for kjøp i appen er de samme, og WebGL i Safari må testes.
- **Begge butikkene** krever et D-U-N-S-nummer for firmakontoer. Det er gratis, men tar noen dager.

### 7. Drift

- **Besøkstall** uten informasjonskapsler, for eksempel Plausible eller Umami, eller ingen.
- **Feilrapporter** fra spillerne (Sentry har et gratisnivå). Valgfritt.
- **Kontakt:** support-e-post og eventuelt en Discord.

## B. Det Claude bygger (når valgene er tatt)

1. **Lagringskoden finnes alt** (Innstillinger → Lagret spill). Før domenet byttes, kommer et varsel i spillet om å ta med koden til den nye adressen.
2. **Domenebyttet:** PWA-en på detstorebla.no. Artifacten blir værende som testutgave.
3. **Innlogging og skylagring** i Supabase: lagringen følger kontoen på alle enheter, og den lokale lagringen synkes.
4. **Betaling** med Stripe Checkout og en webhook (serverfunksjon i Supabase) som låser opp det som er kjøpt. Kjøpet følger kontoen.
5. **Sidene** Personvern, Vilkår, Kilder og Kontakt.
6. **Ny logo fra Blender:** app-ikonene og et bilde for deling i sosiale medier.

## C. Valg som må tas

1. **Forretningsmodell.**
   - Anbefaling: gratis å spille rundt Senja, med ett engangskjøp (for eksempel 149–249 kr) som låser opp hele kysten og de større båtene. Det passer et simuleringsspill, og det er enklest med MVA og vilkår.
   - Andre muligheter: abonnement, eller gratis spill med kjøp av kosmetikk.
2. **Innlogging:** frivillig (anbefalt), slik at alle kan spille uten konto og logger inn for skylagring og kjøp. Eller påkrevd.
3. **Database:** Supabase (anbefalt) eller en annen.
4. **Selskapsform:** ENK eller AS.
5. **Engelsk navn** til lanseringen i utlandet. «The Big Blue» er tittelen på samme film, så det bør unngås.

## D. De 20 punktene fra TikTok-lista, for Norge og EU

Lista er amerikansk («so your app doesn't get sued»). Her er hvert punkt vurdert for Det Store Blå, med norske og europeiske regler. «Claude» betyr at jeg kan bygge eller skrive det. «Du» betyr at det er din avgjørelse eller avtale. Det som er merket «sjekk», er ikke bekreftet mot lovteksten.

| # | Punkt | Gjelder oss? | Hva vi gjør |
|---|---|---|---|
| 1 | Personvernerklæring | Ja (GDPR art. 13), så snart vi har kontoer, betaling eller besøkstall | Utkast i `src/legal/personvern.html` (04.10.2026), du godkjenner |
| 2 | Brukervilkår | Ja | Utkast i `src/legal/vilkar.html` (04.10.2026), du godkjenner |
| 3 | Refusjon | Ja, som angrerett: 14 dager, men den faller bort for digitalt innhold når kjøperen samtykker til levering med en gang (angrerettloven § 22 n) | Avkrysning i kassen og en tekst i salgsvilkårene (Claude) |
| 4–5 | Informasjonskapsler og samtykkebanner | Bare for det som ikke er strengt nødvendig (ekomloven § 3-15, i kraft 01.01.2025). Lagringen i nettleseren og innloggingen er nødvendige for spillet og krever ikke samtykke. | Ingen sporing og ingen reklamepiksler, så vi slipper banneret. Statistikken spør spillet om selv. Kommer det Google Analytics, Meta- eller TikTok-piksel, trengs banneret. |
| 6 | Samtykke i skjemaer | Ja: vilkår og angrerett ved kjøp, og eget samtykke til nyhetsbrev, aldri forhåndskrysset | Claude |
| 7 | Ikke samle unødvendige data | Ja (GDPR art. 5, dataminimering) | Bare e-post, lagringen og kjøp |
| 8 | Gå gjennom tredjeparter | Ja | Google Fonts sender IP-adressen til Google (tysk dom fra 2022). Skriftene bør ligge i appen selv. Ellers bare Supabase og Stripe, ingen reklame (Claude) |
| 9 | Ingen mørke mønstre | Ja (markedsføringsloven, EUs regler for forbrukerbeskyttelse) | Ingen falske nedtellinger eller press. Et abonnement skal være like lett å si opp som å starte |
| 10 | Ingen skjulte gebyrer | Ja: forbrukerpriser skal vises med MVA (prisopplysningsforskriften) | Prisen med MVA vises før kjøpet |
| 11 | Ingen falske anmeldelser | Ja (markedsføringsloven) | Vi har ingen |
| 12 | Ingen udokumenterte påstander | Ja | Ikke antyd at Fiskeridirektoratet, Råfisklaget eller Kartverket står bak spillet. Regler-appen må si at reglene er forenklet og kan være utdaterte, og at Fiskeridirektoratet gjelder for ekte fiske (Claude) |
| 13–15 | Alt-tekst, kontrast og tastatur | Delvis: forskriften om universell utforming av IKT (WCAG 2.1 AA) gjelder nettløsninger for allmennheten. Om spillet selv er unntatt, er ikke avklart (sjekk). | Kjøp, konto og vilkårssidene skal oppfylle WCAG. Menyene i spillet forbedres etter hvert (Claude) |
| 16 | Firmaopplysninger | Ja (ehandelsloven § 8): navn, adresse, e-post og organisasjonsnummer | På Kontakt-siden og i butikkene (du gir opplysningene, Claude lager siden) |
| 17 | Alder | Ja: barn under 13 år kan ikke samtykke selv (personopplysningsloven § 5). Butikkene krever også en aldersgrense (IARC/PEGI-skjemaet, gratis). | Spør om alder når kontoen lages. Du fyller ut IARC-skjemaet. |
| 18 | Avmelding i e-post | Bare for markedsføring: samtykke på forhånd og enkel avmelding (markedsføringsloven § 15). Innloggingslenker og kvitteringer er unntatt. | Lenke for avmelding hvis vi sender nyhetsbrev |
| 19 | Lisenser for skrift og bilder | Ja | Skriftene (Archivo og Source Serif 4) har OFL-lisens og er i orden. Modellene er laget selv i Blender. Kartdata og kilder må oppgis (se A5). En side med kildene (Claude) |
| 20 | Sletting av data | Ja (GDPR art. 17). Google Play og App Store krever også at kontoen kan slettes inne i appen. | En knapp for å slette kontoen, som sletter lagringen og personopplysningene. Kjøpene beholdes så lenge bokføringsloven krever (Claude) |

**Det som kan gjøres nå, uten å vente på valgene:** legge skriftene i appen, sette inn forbeholdet i Regler-appen og lage siden med kildene.

## E. Admin-dashbordet (plan, venter på klarsignal)

Jonas' ønske 04.10.2026 er et dashbord med all bruksinformasjon, og lista hans har 40 punkter. Planen nedenfor dekker de fleste. Noen punkter krever funksjoner som spillet ikke har ennå, og de er merket.

### Slik henger det sammen

1. **Målingen i spillet** (en ny `core/18-telemetry.js`):
   - Hendelsene legges i en kø i nettleseren og sendes samlet hvert minutt. Uten nett blir de liggende til nettet kommer tilbake.
   - **Øktene:** start og slutt, aktiv tid (stopper når fanen er skjult) og et livstegn hvert minutt for sanntidsoversikten.
   - **Spillet:** appene som åpnes, rigg, setting og trekking av redskap, kast loss og fortøying, leveringer (kr, kg, art, felt, mottak, tiden fra kast loss til levering), ruter og Autonav, grunnstøtinger og skader, båtkjøp, lån, rekka (streak) og kassa.
   - **Teknikk:** feil og krasj (`window.onerror` og avviste løfter), bildetakt og hakk, 3D-kvalitet, nettleser og plattform, og om appen er installert som PWA.
   - **Avbrudd:** en økt som slutter mindre enn 60 sekunder etter en grunnstøting, et tap eller en avvist levering, telles som et mulig «rage quit».
2. **Databasen** (Supabase, EU):
   - **Tabellene:** hendelser, økter, spillere (en tilfeldig ID og eventuelt kontoen), feil, kjøp (fra Stripe-webhooken) og daglige sammendrag.
   - **Tilgang:** spillet kan bare skrive. Bare admin kan lese.
   - **Sammendragene:** hver time regnes daglige tall, ukedag × time, tilbakekomst og churn-indeks ut i SQL (`pg_cron`).
3. **Dashbordet** på `detstorebla.no/admin`, med innlogging der bare kontoen din har adminrolle. Det er en egen side med diagrammer, ikke en del av spillet.

### Fanene og punktene dine

- **Oversikt:**
  - antall brukere (daglig, ukentlig og månedlig) og aktive brukere nå
  - registrert total spilltid, avsluttede økter, gjennomsnittlig og median øktlengde
  - tilbakekomstandel og gjennomsnittlig streak
- **Spilletid:**
  - søylediagram per dag (dato, timer, økter og nettlesere)
  - heatmap over ukedag × time og fordeling over året
  - svingdørindeksen: mange korte økter sammenlignet med få lange (forslag til definisjon: spredningen i øktlengde delt på medianen, per spiller)
- **Frafall:**
  - churn-indeks fra 0 til 100 per spiller, fra dager siden sist, synkende øktlengde og stopp i framgangen
  - inaktivitetsvarsler og listen over spillere i faresonen
  - tapsanalyse: rage quit og den døde sonen, det vil si stedene og øyeblikkene i spillet der spillerne slutter
- **Spillbruk:**
  - bruken av appene og funksjonene
  - mest brukte redskap og båt
  - grunnstøtinger og skader (hvor, båttype, fart)
  - ruter og fiskefelt (kart), og tiden fra kast loss til levering ved mottaket
  - flere spillstatistikker etter ønske
- **Økonomi i spillet:** Gini-koeffisienten for kassa og for flåten, kr per tur og rikdom over tid.
- **Penger** (når Stripe er på plass):
  - konverteringsrate, ARPU, tid til første kjøp, kjøpshyppighet og gjenkjøpsandel
  - transaksjonsloggen fra Stripe, refusjoner og andelen som forlater kassen
  - bruk av betalte boostere, når slike finnes
- **Teknikk:**
  - feil- og krasjlogg, gruppert etter melding og versjon
  - bildetakt og hakk per enhet
  - nettlesere, plattformer og PWA-installasjoner
- **Geografi:** land og fylke fra nettverket, uten å lagre IP-adressen, og hjemhavna i spillet.

### Det som må vente på nye funksjoner i spillet

- **Push-varsler** finnes ikke, så push-åpningsraten må vente.
- **Spillet har ingen venner, deling eller invitasjoner.** Disse punktene må derfor vente:
  - sosial klyngedynamikk og nettverkskoeffisient
  - viralitet og deling
  - invite-to-churn
  - den sosiale utløseren for kjøp
- **Betalte boostere** finnes ikke ennå.

### Tilgang: bare Jonas (hans krav 04.10.2026: «Dette må ingen andre enn meg ha tilgang til»)

- **Låsen ligger i databasen, ikke i siden.**
  - Reglene i tabellene (Row Level Security) gir lesetilgang til målingene bare til én bruker-ID, din.
  - Spillerne kan bare skrive sine egne hendelser og kan ikke lese noe.
  - Adminsiden har ingen data og ingen hemmelige nøkler i seg. Uten innloggingen din viser den ingenting.
- **Totrinnsinnlogging er påkrevd.** Regelen krever at innloggingen er gjort med kode fra en autentiseringsapp (Supabase MFA, `aal2`), så et stjålet passord er ikke nok.
- **Den hemmelige nøkkelen** (`service_role`) skal aldri ligge i nettleseren eller i repoet, bare i hemmelighetene til Supabase og GitHub.
- **Slå på totrinnsinnlogging** også hos Supabase, GitHub, Stripe, domeneregistraren og e-posten. Den som kommer inn der, kommer inn overalt.
- **Ingen lenke fra spillet** til `/admin`, og siden er merket `noindex`. Sikkerheten hviler likevel ikke på at siden er skjult.
- **Claude** ser ikke dataene med mindre du gir meg nøkler. Under utviklingen bruker jeg testdata.

### Personvern (må på plass for at dette er lov)

- En fast nettleser-ID for statistikk krever samtykke (ekomloven, sjekk). Ved første start spør spillet: «Vil du dele bruksstatistikk for å gjøre spillet bedre?»
  - **Ja:** fast ID og alle målingene.
  - **Nei:** bare anonyme feil og bildetakt uten ID.
  - Banneret fra D4–5 trengs da likevel, i denne enkle formen.
- **Dataminimering:** ingen IP-adresser, ingen nøyaktig posisjon og ingen fritekst lagres.
- **Lagringstid:** rådataene slettes etter 13 måneder, og sammendragene beholdes.
- Personvernerklæringen beskriver målingen, og «slett kontoen» sletter også hendelsene.
- **Uten samtykke** lagres bare kontoen (WorkOS-ID, når den ble laget og sist brukt) og lagringen. Utstyret, landet og fødselsåret lagres bare med et ja. Et nei etterpå sletter øktene, hendelsene, utstyret og spilltilstanden og fjerner navnet fra feilrapportene (`tm_hello`, `tm_consent`, `sqltest.py`).

### Rekkefølge

1. Supabase, samtykket, målingen og dashbordets faner for oversikt, spilletid, frafall, spillbruk, økonomi i spillet, teknikk og geografi.
2. Pengefanen når Stripe er på plass.
3. De sosiale punktene og push når de funksjonene finnes.

## F. Valgene (Jonas, 04.10.2026)

1. **Forretningsmodell:** gratis å spille, med frivillige kjøp av boostere, båter og skins via Stripe.
   - **Prisene vises i kroner.** Ingen egen spillvaluta skal skjule hva ting koster. EUs forbrukermyndigheter (CPC) la fram prinsipper for valuta i spill i 2025 (sjekk).
   - **Ingen tilfeldige kjøp (lootbokser).** Den som kjøper, vet hva hen får. Forbrukertilsynet er kritisk til lootbokser (sjekk).
   - **Ingen direkte oppfordring til barn om å kjøpe** (markedsføringsloven og EUs liste over forbudt praksis, UCPD vedlegg I nr. 28).
   - **Balansen:** en båt kjøpt for ekte penger bør ikke gjøre spillet om til «betal for å vinne». Forslag: kjøpte båter er egne utgaver eller utseender, eller en snarvei til det som kan tjenes i spillet. Det tar vi når produktene skal lages.
   - **Bare på nettet:** Stripe fungerer i appen på detstorebla.no. I Google Play og App Store må kjøp inne i appen gå gjennom butikkenes betaling, eller EU-ordningen for alternativ betaling.
   - **MVA:** 25 % på digitale varer til norske forbrukere, og EU-moms til forbrukere i EU (Stripe Tax).
2. **Innlogging er påkrevd, med WorkOS (AuthKit):** Google, Apple, e-post og totrinnsinnlogging.
   - Supabase godtar WorkOS-nøklene direkte som tredjepartsinnlogging. Reglene i databasen bruker bruker-ID-en fra WorkOS (`sub`).
   - Admin er WorkOS-ID-en din, og totrinnsinnlogging er påkrevd.
   - Artifacten på claude.ai kan ikke bruke WorkOS-innlogging, fordi den kjører i en innebygd ramme. Den blir værende som testutgave uten konto.
3. **Database:** Supabase i EU-regionen.
4. **Samtykke:** spillet spør om samtykke til statistikk ved første start.
5. **Selskap:** det eksisterende enkeltpersonforetaket Johansen Havbruksdrift.
   - **Ny virksomhet:** Legg den til i Enhetsregisteret med Samordnet registermelding i Altinn. Ny næringskode er for eksempel 58.210, «Utgivelse av programvare for dataspill» (sjekk koden), og formålet utvides med utvikling og salg av dataspill.
   - **MVA:** Er foretaket alt MVA-registrert, kommer spillsalget med i samme registrering. Utleie av arbeidskraft er ofte MVA-pliktig, så sjekk dette. Er det ikke registrert, gjelder grensen på 50 000 kr for alt MVA-pliktig salg til sammen.
   - **Stripe:** Kontoen registreres på foretakets organisasjonsnummer. Kontoutskriften kan vise «DETSTOREBLA.NO», og kassen kan vise navnet Det Store Blå. Det juridiske navnet og organisasjonsnummeret skal likevel stå på Kontakt-siden (ehandelsloven § 8).
   - **Regnskap:** Før spillet som eget prosjekt eller egen avdeling. Overskudd og underskudd blir en del av næringsinntekten. Over tid må det se ut som næring og ikke hobby (sjekk med regnskapsfører).
   - **Ansvar:** I et ENK står du personlig ansvarlig for alt, også kundekrav og eventuelle GDPR-bøter. Når inntekten eller risikoen vokser, bør spillet flyttes til et AS.

### Det du oppretter (så kan Claude koble det på)

- **WorkOS:** en konto og AuthKit med Google, Apple og e-post, totrinnsinnlogging slått på og adressen `https://detstorebla.no` som tillatt. Gi meg klient-ID-en. API-nøkkelen holdes hemmelig.
- **Supabase:** et prosjekt i EU med WorkOS lagt til under Third-party auth. Gi meg prosjektadressen og `anon`-nøkkelen.
- **Stripe:** en konto på foretaket, med testnøklene klare.

### Rekkefølgen for byggingen (venter på «kjør på»)

1. **Supabase-skjemaet** som SQL i repoet (`supabase/migrations/`):
   - tabellene for spillere, lagringer, økter, hendelser, feil, produkter, kjøp og rettigheter
   - reglene (RLS) med admin bare for deg
   - sammendragene i SQL
2. **Målingen** (`core/18-telemetry.js`) med samtykkedialogen. Den er av til nøklene er satt, så artifacten og testene går som før.
3. **Innloggingen og skylagringen** i appen. Lagringen synkes til kontoen.
4. **Admin-dashbordet** (`/admin`) med alle fanene fra E. Det kan vises med testdata før de ekte dataene kommer.
5. **Butikken:** Stripe Checkout, webhooken i Supabase og rettighetene i spillet, når produktene (boostere, båter og skins) er bestemt.
6. **Juridiske sider** (personvern, vilkår, kilder, kontakt) og sletting av konto.

## G. Server og drift: trengs det en egen server?

**Kort svar:** Nei, ikke for spillets logikk. Supabase tar databasen og serverfunksjonene, også webhooken og kassen til Stripe. WorkOS tar innloggingen. Spillet selv er statiske filer.

**Men spillet må flyttes fra GitHub Pages før lansering:**
- Pages er ikke lov å bruke for nettsteder som først og fremst driver handel eller kommersiell programvare ([GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)).
- Pages har en myk grense på 100 GB trafikk i måneden. Kartpakkene for hele kysten er 227 MB, så bare noen hundre nye spillere i måneden kan nå grensen.

**Forslag: Hetzner-serveren din serverer spillfilene.**
- **Caddy** serverer `dist-pwa/` og henter HTTPS-sertifikat selv.
- **Hetzner** har 20 TB trafikk i måneden inkludert i de fleste servere, og datasentrene i EU passer med GDPR.
- **GitHub Actions** bygger og laster opp med `rsync` over SSH når spillet endres, slik `pwa.yml` gjør til Pages i dag. SSH-nøkkelen ligger som hemmelighet i GitHub.
- **Cloudflare** foran serveren er valgfritt. Det gir hurtigbuffer for kartpakkene og beskyttelse mot angrep.
- **Serveren** kan gjøre det den gjør i dag i tillegg, så lenge den har plass.

**Det du gjør på serveren** (Claude skriver oppsettskriptet `tools/server/setup.sh`):
1. Lag en egen bruker for utrulling, med en SSH-nøkkel bare for dette. Den private nøkkelen legges som hemmelighet i GitHub (`DEPLOY_KEY`, `DEPLOY_HOST`).
2. Kjør oppsettskriptet:
   - Caddy
   - brannmur som bare slipper inn port 22, 80 og 443
   - automatiske sikkerhetsoppdateringer
3. Slå på totrinnsinnlogging i Hetzner-konsollen.

**Alternativ uten server:** Cloudflare Pages for siden og Cloudflare R2 for kartpakkene. Det har gratis trafikk, men en grense på 25 MB per fil.

**Supabase på egen server** går også, men da må du drifte databasen, sikkerhetskopiene og oppdateringene selv. Det anbefales ikke nå.
