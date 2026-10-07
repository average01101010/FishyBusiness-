# Push-varsler: plan for «båten venter på deg» (Jonas 07.10.2026)

Jonas: «vi aktivt burde bruke push-varsler som sier i fra når båten ankommer sine destinasjoner, eller når ventetider er ferdig … slik at brukeren blir varslet og ikke glemmer spillet av. Lag gjerne en god plan … på en intuitiv og taktfull måte som er til det beste for alle parter.»
Dette er en plan, ikke bygget. Den bygger på det som finnes (`ui/10g-push.js`, `supabase/migrations/20261005120000_push.sql` og `20261006030000_push_rules.sql`, `supabase/functions/push-send`).

## Det som finnes

- Spillet legger en plan på serveren når appen går i bakgrunnen (`pushItems` → `push_plan`), og tømmer den når spilleren er tilbake. Ingenting kommer mens man spiller.
- Serveren sender høyst **4 i døgnet**, **ingenting 22–08**, flere varsler som forfaller samtidig blir **ett**, og hvert varsel har en levetid (`exp`) før det kastes usendt.
- Kategorier spilleren kan slå av: Fangst og båter, Verftet, Kvoter, Topplista, Sesonger. På som standard der nettleseren tillater det, og et spørsmål etter første levering (høyst tre ganger).
- Dekket i dag: redskap som har stått lenge nok, fisk som snart blir dårligere, båten framme i havn **med fisk**, verftsjobb ferdig, kvotestopp, topplista og sesongene.
- Hullene: båten framme uten fisk (verft, butikk), ruta er slutt og båten ligger og venter ute på havet, lasten er full, motorstopp, uthvilt i naustet eller rorbua, og at varselet tar deg rett til riktig side.

## Prinsipper (taktfullt)

1. **Bare det spilleren kan gjøre noe med.** Et varsel betyr at noe i verden står og venter på henne, eller at en ventetid hun selv startet er slutt. Aldri «kom tilbake».
2. **Aldri straff for fravær** og aldri noe om tapt bonus eller tapt plass (regel i CLAUDE.md). Fisk som blir dårligere er simuleringens egen friksjon og står med det den koster å la være, ikke som trussel.
3. **Aldri penger i varselet.** Ingen «Ferdig nå», ingen haill, ingen butikk. Varselet beskriver bare verden.
4. **Rolig språk.** Båtens navn, hva som har skjedd, hva hun kan gjøre nå. Ingen utropstegn, ingen tall som tikker. Spilletid i ord («i natt», «fremme i Båtsfjord»); selve varselet kommer i ekte tid.
5. **Ta det viktigste først når taket på 4 nås.** I dag tas de eldste først. Vi gir hvert varsel en prioritet.
6. **Hold det rolig om natta.** Det som forfaller 22–08 samles til ett «Mens du sov»-varsel kl. 08 hvis det fortsatt har noe å si.
7. **Spilleren styrer.** Hver gruppe kan slås av, nattestid kan gjøres lengre, og et prøvevarsel viser hva hun får.

## Hva som varsles

| Hendelse | Gruppe | Prioritet | Levetid | Tekst (eksempel) |
|---|---|---|---|---|
| Motorstopp eller båten driver | Båten | 0 | 3 t | «Havbris har fått motorstopp ved Gisundet. Ring etter hjelp i appen.» |
| Framme i havn etter ei rute (mottak, butikk, verft), også uten fisk | Båten | 1 | 12 t | «Havbris er framme i Båtsfjord med 320 kg. Fisken er fersk til i ettermiddag.» |
| Ruta er slutt og båten ligger stille ute | Båten | 1 | 6 t | «Havbris er ferdig med fisket ved Nordkapp og venter på ordre.» |
| Lasten er full og fisket har stoppet | Båten | 1 | 6 t | «Lasten på Havbris er full. Tid for å gå inn.» |
| Redskap har stått lenge nok (finnes) | Fangst og båter | 1 | 6 t | som i dag |
| Fisk går snart ned en kvalitet (finnes) | Fangst og båter | 1 | 2 t | som i dag |
| Montering av utstyr ferdig (butikk eller verft) | Verftet | 2 | 12 t | «Ekkoloddet er montert. Havbris er klar.» |
| Kulingvarsel mens båten er ute eller redskap står i sjøen | Båten | 1 | 6 t | «Kuling i natt. Havbris ligger ute ved Gisundet, og garnene står.» |
| Verftsjobb ferdig (finnes); med dokka: «Klar til sjøsetting» | Verftet | 2 | 12 t | «Verftet er ferdig med skrogrensen. Havbris er klar til å gå ut.» |
| Uthvilt i naust eller rorbu | Båten | 3 | 12 t | «Du er uthvilt. Havbris ligger klar i Finnsnes.» |
| Turoppdrag utløper (bare antatte oppdrag), 6 spilletimer før | Båten | 3 | 6 t | «Oppdraget fra Vardø går ut i kveld.» |
| Kvotestopp, sesong, festival (finnes) | Kvoter / Sesonger | 3 | 12–24 t | som i dag |
| Noen går forbi deg på topplista (finnes) | Topplista | 4 | 4 t | som i dag |

Aldri: tapt innloggingsbonus, «du har ikke spilt på en stund», tilbud, nedtellinger, andre spilleres navn utover topplista, noe om haill eller kjøp.

## Takten (revidert 07.10.2026, Jonas: «dynamisk tilnærming … 24 i døgnet så lenge de er knyttet direkte til driften»)

To grupper, to tak:

- **Drift** (egen båt og eget redskap, noe spilleren selv har satt i gang): framme, lasten full, motorstopp, uthvilt, montering og verftsjobb ferdig, redskap som har stått lenge, fisk som snart blir dårligere, driftsplan som stoppet, kulingvarsel mens båten er ute eller redskap står i sjøen. **Tak etter hvor aktiv spilleren er:** 6 i døgnet som grunnlag, 12 med to økter om dagen de siste tre døgnene, opptil 24 med fire eller flere. 24 er et tak, ikke et mål. Tallene er forslag.
- **Verden** (kvote som rammer spillerens gruppe, sesong, festival, topplista): fortsatt høyst 4 i døgnet til sammen, og de teller ikke mot driftstaket.
- **Dempere:** fem uåpnede på rad gir høyst 2 i døgnet til hun åpner appen igjen. Taket styres av det spilleren bruker, ikke av at vi vil ha henne inn.
- **Samling:** drift-varsler om samme båt som forfaller innen 15 minutter blir ett. Flere samtidige blir ett (som i dag).
- **Valg for spilleren:** «Få, Normal eller Mange» i Innstillinger, som skrur driftstaket ned eller opp. Grupper kan slås av hver for seg.
- **Natt:** 22–08 som i dag (valgfritt lengre); det som forfaller da kommer som ett «Mens du sov» kl. 08. «Varsle også om natta for båten min» er av som standard.
- **Prioritet** når taket nås: motorstopp, så båten som venter (framme, full, ruta slutt), så redskap og fisk, så verft og montering, så uthvilt.
- Serveren trenger: `level` i `push_subs` (få/normal/mange), `kind` ('drift' eller 'verden') og `pri` i `push_queue`, og `push_claim` som teller de to gruppene hver for seg. Antall økter siste tre døgn finnes alt i målingen (sessions).

## Kystposten og verdensnytt

Ingen push for vanlige artikler: det blir støy. Appen får en prikk, som i dag. Bare to typer får push:

1. **Saken handler om spilleren:** «Kystposten skriver om Havbris: ukas største torsk». Sjelden og hyggelig, og kommer av noe hun har gjort. Verden-taket.
2. **Det endrer hva hun kan gjøre i dag og gjelder hennes gruppe eller felt:** kvotestopp som rammer gruppa hennes, et felt som stenges der redskapet står.

Valgfritt, av som standard: «Ukas Kystpost», ett varsel i uka. Topplista (noen gikk forbi deg) er av som standard, siden den ikke er drift.

## Eget varsel for ei rute du selv har sendt (Jonas 07.10.2026)

Jonas: en spiller som lager en rute, sender båten avgårde og lukker telefonen, vil sannsynligvis sette pris på et varsel hver gang båten er framme. Det er handlingsbasert og i hennes egen interesse. Enig, med disse justeringene:

- **«Hver gang» er hver gang båten stopper og venter på deg:** slutten på ruta, og stopp i havn der hun må gjøre noe. Fiskestopp og mellompunkt er planen hennes og får ikke eget varsel. Går båten automatisk fram og tilbake etter en driftsplan, sendes ett varsel når planen stopper eller trenger henne, ikke ett per ankomst.
- **Eget tak:** verdenshendelsene (kvote, sesong, topplista, redskap som har stått for lenge) beholder taket på 4 i døgnet. Rutevarsler får et eget, høyere tak (forslag: 8), slik at femte ankomst ikke forsvinner uten at spilleren skjønner hvorfor. Valget er Jonas', fordi det avviker fra «4 i døgnet» fra 05.10.2026.
- **Natt:** ankomst mellom 22 og 08 kommer som «Mens du sov» kl. 08. En bryter «Varsle også om natta for båten min» er av som standard.
- **Åpenhet:** ved «Kast loss» står «Du får beskjed når Havbris er framme», med en liten knapp for å slå det av for akkurat denne turen.

## Klikk og innstillinger

- **Dypere lenke:** varselet bærer en side (`lever`, `verft`, `beholdning` …). Når spilleren trykker, åpner spillet rett på siden hvis båten ligger i havn, ellers på kartet. Service worker sender siden med (`notificationclick`).
- **Grupper i Innstillinger:** Båten venter, Fangst og redskap, Verftet, Kvoter, Topplista, Sesonger.
- **Prøvevarsel:** en knapp som sender ett ekte eksempel nå, så spilleren ser hva hun får.
- **Første spørsmål:** etter første levering som i dag, men med et eksempel på varselet og en rolig setning om taket: «Høyst fire i døgnet, aldri om natta.»
- **iPhone:** web-push virker bare i appen lagt til på hjemskjermen. Innstillingene sier det rett ut der det gjelder.

## Mål og se

I admin-trakten: andel som slår på varsler, sendt per spiller per døgn, **åpnet innen 30 minutter** per gruppe, og andel som slår av en gruppe etter et varsel. Hvis en gruppe slås av av mer enn hver fjerde, skrur vi den ned eller endrer teksten før vi legger til flere. Ingen varsler flere enn dette uten at tallene viser at de blir åpnet.

## Bygging i trinn

1. **P1 Hullene:** nye hendelser i `pushItems` (framme uten fisk, ruta slutt, last full, motorstopp, uthvilt), gruppen «Båten venter», og prioritet i serveren. Test: `pushtest.py` og `sqltest.py`.
2. **P2 Klikk og kontroll:** dyp lenke fra varselet, prøvevarsel, lengre natt, «Mens du sov»-samling.
3. **P3 Dempere og måling:** den voksende pausen ved uåpnede varsler og tallene i admin.
4. **P4 Verftet:** «Klar til sjøsetting» når dokka kommer (handelsstedene, trinn 3).

Forutsetning: VAPID-nøklene må være laget og lagt inn av Jonas (aldri i git), ellers vises ikke bryteren. Sjekkes før P1.
