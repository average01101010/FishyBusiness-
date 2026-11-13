# «Ferdig nå» overalt der det monteres, og lettvint betaling (plan, ikke bygd)

**Jonas 13.11.2026 (i D5-økta):** «Jeg mener også at alle sider i butikker der det tar tid å installere utstyr og det lages en arbeidskø burde vise en timer, samt muligheten til å skippe ventetiden med betaling. Det må være "lettvint" å betale for å skippe tiden, om du skjønner. Det må være tilpasset slik at vi tjener penger.»

## Hva som finnes i dag

- **Arbeidskøen** (`S.jobs`, `queueJob` og `jobOk` i `core/06-services.js`): høyst seks jobber, som starter når de bestilles i havn. Verkstedjobbene (`YARD_KINDS`: `fit`, `svc`, `hull`, `hold`, `eng`, `prop`, `upg`, `repair`) tar `YARD_H` = 3 timer i spillet, altså 30 minutter i ekte tid (dobbelt med egen montering). Det gjelder også det utstyrsbutikken monterer («Kjøp og monter», `kind:'fit'` i `ui/phone/13b-nettet.js`). Mannskapets egne jobber (egning, bøting, kroker) og frakt går for seg.
- **«Ferdig nå»** (Jonas 05.10.2026): 19 kr (`YARD_NOW_NOK`) gjør alle verkstedjobbene på båten ferdige med én gang. Den tilbys bare mens en jobb har mer enn 5 minutter igjen (`YARD_NOW_MIN`), og et kjøp som kommer for sent, blir stående som kreditt til neste jobb (`S.yardCredit`). **Den vises bare på verftets side Vedlikehold** (`verksted` i `ui/phone/01-haill-fiske-service.js`), med arbeidskøen, «ferdig kl.» og en stolpe per jobb. Ved siden av står «Overtid, halv tid» for spillkroner.
- **Utenfor Vedlikehold** står bare «ferdig kl.» i statusboksen i havn (`ui/04-panels-instruments.js`) og en toast når man prøver å kaste loss (`ui/08-actions.js`). Utstyrsbutikken, Service og Oppgraderinger viser ikke køen etter et kjøp, og ikke «Ferdig nå».
- **Betalingen** (`ui/10i-shop.js`): et kjøp sender spilleren til en Stripe Checkout-side utenfor spillet (`location.href`) og tilbake med `?kjop=`. Prisen står i kroner med 💎. Kjøp er stengt for kontoer laget etter bryteren (P5, 10.11.2026). Bare på nettet: i Google Play og App Store må kjøp gå gjennom butikkenes egen betaling (`docs/lansering.md`).

## Reglene som gjelder (`CLAUDE.md`, `docs/engasjement.md`)

- «Ferdig nå» er avgjort og beholdes, «med regelen over: ventetiden forlenges aldri for å selge mer». Planen rører ikke `YARD_H` eller andre ventetider.
- «Ingen nedtelling i butikken» handler om tilbud som går ut («bare i dag»). Timeren her er jobbens egen ferdigtid, ikke et tilbud. Den står ved jobben, ikke ved en vare.
- Ekte penger (`ui/10i-shop.js`, `ui/10q-buymoment.js`, Stripe, `shop_*`) og `src/legal/` går som PR til Jonas og rulles ikke ut uten at han har sett den.

## Fasene

**F1 Timeren og knappen der kjøpet skjer** (én økt; ingen endring i betalingskoden). En stripe «Arbeid på båten» øverst på hver side der et kjøp legger en jobb i køen, så lenge en jobb går: utstyrsbutikken (begge faner), Service, Oppgraderinger, Vedlikehold, Båthandel (overtakelse), Malerverkstedet, og Om bord. Hver jobb med navn, nedtelling i ekte tid (mm:ss, tikker hvert sekund mens siden er åpen) og stolpe; under dem «Ferdig nå · 19 kr 💎» (den samme handlingen som i dag, `yardnow`), og «Overtid» som før. Rett etter «Kjøp og monter» står stripa øverst med en gang. Filene: en felles `jobStrip()` i `ui/phone/01-haill-fiske-service.js`, kalt fra sidene i `ui/phone/`, tikkingen i `ui/phone/06-render.js` og `ui/10c-dock.js`, stilen i `src/styles.css`. Testene: en ny `jobbstripe.py` (stripa på hver side etter et kjøp, tida teller ned, borte når jobben er ferdig, «Ferdig nå» gjør dem ferdige i testmodus), `docktest`, `itemcardtest`, `shoptest`, `telefonflate`, `kontrast.py`. Patchnotat uten pris og uten hvorfor.

**F2 Lettvint betaling** (én økt; ekte penger og vilkårene, PR til Jonas, ikke rullet ut før han har sett den). Etter valg 3 under. Med A: et ark i spillet med Stripes knapper for Google Pay, Apple Pay og Link og kortfelt, uten å forlate spillet; Link husker kortet, så neste kjøp er ett trykk og en bekreftelse. Nytt i Edge-funksjonen (`shop-checkout` lager en betaling i stedet for en Checkout-side), Stripes skript fra `js.stripe.com` i sidens innholdsregler (CSP), webhooken som før, linja om angreretten (angrerettloven § 22 n) før betalingen som i dag. Testes i Stripes testmodus på testprosjektet; Jonas kjører migreringen og setter nøklene der.

**F3 Måle** (del av F2): trakten i admin-dashbordet (`CLAUDE.md`, «Mål og se») får «Ferdig nå» vist, trykket og betalt per side, så det kan leses hvilke sider som selger før neste endring.

## Valgene

1. **Hvor timeren og «Ferdig nå» står.**
   **A (anbefalt):** på alle butikk- og verftssidene som lager jobber, og i Om bord. Spilleren ser køen der kjøpet skjedde og der båten styres, og det er der betalingen er mest naturlig.
   **B:** bare på siden kjøpet ble gjort, og Vedlikehold som i dag.
   **C:** som A, og i tillegg i statusboksen i havn (en ny knapp i HUD-en; du har sagt nei til nye HUD-knapper uten at du ber om dem).
2. **Prisen.**
   **A (anbefalt):** som i dag, 19 kr for alle verkstedjobbene på båten. Én pris som er lett å si ja til, og jobbene er høyst 30 minutter (60 med egen montering) i ekte tid.
   **B:** etter tida som er igjen, for eksempel 9 kr under 10 minutter og 19 kr ellers. Lavere terskel for de korte, samme for de lange.
   **C:** 19 kr per jobb. Mer per kjøp når flere jobber går, men tyngre å si ja til.
3. **Betalingen.**
   **A (anbefalt):** betaling i et ark i spillet med Google Pay, Apple Pay og Link, uten å forlate spillet; kortet huskes, så neste gang er det ett trykk og en bekreftelse. Størst forskjell for et kjøp på 19 kr, der det å forlate spillet er det som stopper folk.
   **B:** behold Stripe Checkout, men slå på lommebøkene og fyll inn e-posten. Mindre arbeid, men spilleren forlater fortsatt spillet.
   **C:** som i dag.

## Antatt eller usikkert

- At betaling uten å forlate spillet selger mer, er antatt og ikke målt; F3 måler det.
- At Google Pay og Apple Pay virker i spillet som installert app fra nettstedet (PWA) og i nettleseren på Android og iPhone, må prøves på enhetene; Apple Pay krever at domenet registreres hos Stripe.
- Om vilkårene (`src/legal/vilkar.html`) må endres når kortet huskes, avgjøres i F2 med Jonas; det er juss og går som PR.
- Butikken er stengt for nye kontoer til L2 og HS1–HS5 er ute (P5). F1 viser knappen, men den sier «Snart i salg» for dem.

## Hva planen ikke gjør

- Forlenger ingen ventetid og legger ingen ny ventetid inn.
- Selger ikke mannskapets egne jobber (egning, bøting, kroker) eller frakt; «Ferdig nå» gjelder verkstedjobbene som i dag.
- Lager ingen fiktiv valuta, ingen pakker med ukjent innhold og ingen nedtelling på tilbud.
- Rører ikke kjøp i Google Play eller App Store.

## Status

13.11.2026: planen skrevet i D5-økta, venter på Jonas' valg.
