# Lansering av Det Store Blå: sjekkliste

Laget 04.10.2026, da spillet fikk navnet Det Store Blå og domenet detstorebla.no. Den viser det Jonas må gjøre selv (kontoer, avtaler, penger), valgene som må tas, og det Claude bygger når valgene er tatt. Lover og satser må sjekkes med regnskapsfører før lansering. Det som er merket «sjekk», er ikke bekreftet.

## A. Det du må gjøre selv

### 1. Domenet (først, det tar tid å slå gjennom)

1. Legg inn DNS-postene hos registraren der du kjøpte detstorebla.no:
   - `A` for `detstorebla.no`: 185.199.108.153, 185.199.109.153, 185.199.110.153 og 185.199.111.153
   - `AAAA` for `detstorebla.no`: 2606:50c0:8000::153, 2606:50c0:8001::153, 2606:50c0:8002::153 og 2606:50c0:8003::153
   - `CNAME` for `www`: `average01101010.github.io`
2. Verifiser domenet på GitHub, slik at ingen andre kan ta det: profilbildet → Settings → Pages → «Add a domain». GitHub gir deg en `TXT`-post som du legger inn hos registraren.
3. Si fra når postene er lagt inn. Da kobler vi domenet til Pages: repoet → Settings → Pages → Custom domain `detstorebla.no`, og så «Enforce HTTPS» når sertifikatet er klart. Vent med dette til lagringseksporten er ute (se B1).
4. Lag e-post på domenet, for eksempel `post@` og `support@`. Det går hos registraren eller hos Google Workspace eller Zoho.

**Viktig om lagringene:** Lagringen ligger i nettleseren og hører til adressen. Når appen flytter fra `average01101010.github.io` til `detstorebla.no`, følger ikke lagringen med av seg selv. Derfor må lagringseksporten eller skylagringen være ute før domenet byttes.

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

1. **Eksport og import av lagringen**, som fil eller kode, før domenet byttes. Gjøres raskt.
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
