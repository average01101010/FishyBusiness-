# Lansering av Det Store Blå: sjekkliste

Laget 04.10.2026, da spillet fikk navnet Det Store Blå og domenet detstorebla.no. Den viser det Jonas må gjøre selv (kontoer, avtaler, penger), valgene som må tas, og det Claude bygger når valgene er tatt. Lover og satser må sjekkes med regnskapsfører før lansering. Det som er merket «sjekk», er ikke bekreftet.

## A. Det du må gjøre selv

### 1. Domenet (først, det tar tid å slå gjennom)

1. Legg inn DNS-postene hos registraren der du kjøpte detstorebla.no:
   - `A` for `detstorebla.no`: 185.199.108.153, 185.199.109.153, 185.199.110.153 og 185.199.111.153
   - `AAAA` for `detstorebla.no`: 2606:50c0:8000::153, 2606:50c0:8001::153, 2606:50c0:8002::153 og 2606:50c0:8003::153
   - `CNAME` for `www`: `average01101010.github.io`
2. Verifiser domenet på GitHub, slik at ingen andre kan ta det: profilbildet → Settings → Pages → «Add a domain». GitHub gir deg en `TXT`-post som du legger inn hos registraren.
3. Si fra når postene er lagt inn. Da kobler vi domenet til Pages: repoet → Settings → Pages → Custom domain `detstorebla.no`, og så «Enforce HTTPS» når sertifikatet er klart.
4. Lag e-post på domenet, for eksempel `post@` og `support@`. Det går hos registraren eller hos Google Workspace eller Zoho.

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

- **Personvernerklæring (GDPR):** hva som lagres (e-post, lagringen, kjøp), hvem som behandler det (Supabase, Stripe, GitHub), hvor lenge og hvilke rettigheter spilleren har. Jeg kan lage et utkast som du godkjenner.
- **Salgs- og brukervilkår:** For digitalt innhold faller angreretten bort når kjøperen uttrykkelig ber om levering med en gang og bekrefter at angreretten da går tapt (angrerettloven § 22). Det løses med en avkrysning i kassen.
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
| 1 | Personvernerklæring | Ja (GDPR art. 13), så snart vi har kontoer, betaling eller besøkstall | Claude skriver utkast, du godkjenner |
| 2 | Brukervilkår | Ja | Claude skriver utkast, du godkjenner |
| 3 | Refusjon | Ja, som angrerett: 14 dager, men den faller bort for digitalt innhold når kjøperen samtykker til levering med en gang (angrerettloven § 22 n) | Avkrysning i kassen og en tekst i salgsvilkårene (Claude) |
| 4–5 | Informasjonskapsler og samtykkebanner | Bare for det som ikke er nødvendig (ekomloven, sjekk). Lagringen i nettleseren er nødvendig for spillet og krever ikke samtykke. | Ingen sporing, og besøkstall uten informasjonskapsler, så slipper vi banneret |
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

### Rekkefølge

1. Supabase, samtykket, målingen og dashbordets faner for oversikt, spilletid, frafall, spillbruk, økonomi i spillet, teknikk og geografi.
2. Pengefanen når Stripe er på plass.
3. De sosiale punktene og push når de funksjonene finnes.
