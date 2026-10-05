# Slagplan for Det Store Blå (05.10.2026)

Alt som er diskutert fram til natt til 05.10.2026, i den rekkefølgen jeg vil gjøre det. Status oppdateres her etter hvert. Tallene i parentes viser til forslagslista Jonas valgte fra (2, 3, 4, 5, 7, 9 og musikken).

## Fase 0: I gang nå (natt til 05.10)

| Oppgave | Status |
|---|---|
| 3D på Adreno-telefoner: sjøskyggeren lenkes ikke | Tre reserveutgaver feilet på Jonas' telefon. Nå får pikselskyggeren egne kopier av bølgetabellene (det eneste sjøen har som ingen annen skygger har), og den enkle sjøen tar over hvis ingenting lenkes. Feilrapporten sier hvilken halvdel driveren nekter. |
| Fars trebåt som startbåt | Modell, rorkult og ror som svinger sammen, semidiesellyd, svarte eksospuffer, lokket mot sjøen inne i båten, fiskekasser og sløyebord. Nye spill starter med den, gamle lagringer beholder båten. |
| Admin: vis brevet og start nytt spill | Bygget, testes med neste runde. |
| Autonav ved siden av zoomknappene | Ferdig (pushet). |

## Fase 1: UI for telefon, nettbrett og PC

Toppraden i kartplotteren (HDG, COG, SOG, DYBDE, EKKOLODD) går i hverandre på telefon, og det er ikke det eneste stedet. En hel runde:

1. **Testskript `uishots.py`:** alle hovedvisningene (havn, sjø i 3D, kartplotter, rute, telefonen, butikk, båthandel, boka, innstillinger) i fem størrelser: telefon stående (390 × 844) og liggende, nettbrett stående (800 × 1280) og liggende, og PC (1440 × 900). Skriptet tar bilder og finner selv elementer som overlapper, går utenfor skjermen eller har trykkflater under 40 px.
2. **Rette det som skriptet finner,** skjerm for skjerm. Toppraden på telefon får to linjer eller kortere felt, og ekkoloddskalaen flyttes.
3. **Felles regler i CSS:** én skala for luft og skrift per størrelse, trykkflater på minst 44 px, safe areas på telefoner med hakk, ingen tekst under 12 px.

## Fase 2: Starten langs hele kysten

Venter på to svar fra Jonas (se under). Planen fra 04.10:

1. Fiskemottakene langs kysten inn i spillet (M2), og Salgslaget viser de 8–10 nærmeste.
2. «Hvor vil du starte?» etter brevet: kartet over kysten med anbefalte steder der det er torsk i sesongen.
3. Naustet (modellen er ferdig) står på startstedet, og «Første tur» virker fra hvor som helst.
4. Tester for start i sør, midt og nord.

**Spørsmål til Jonas:**
- Skal alle de rundt 255 mottakene med kai være med, eller et utvalg på 20–30? Jeg anbefaler alle, med de anbefalte torskestedene merket.
- Eksisterende spillere: blir de på Senja med én gratis flytting? Det anbefaler jeg.

## Fase 3: Det som får folk til å komme tilbake (Jonas' valg)

| # | Hva | Innhold |
|---|---|---|
| 2 | **Fars notatbok** | Notatboka ligger i naustet. Den har fars méd (fiskeplasser med landmerker), skisser, gåter og små historier. Du finner stedene langs kysten, og hvert funn gir en historie og en belønning (penger, utstyr eller et nytt méd). Den bygger rett på brevet. |
| 3 | **Drømmefisken** | Sjeldne kjemper med egen spenning når de biter: kveite over 100 kg, en skrei på 30 kg og en gammel uer. Trofeveggen ligger i naustet, med vekt, dato og sted. |
| 4 | **Naustet som hjem** | Du setter i stand naustet trinn for trinn: tak, ovn, kaffekjel, verktøy, bilder og trofévegg. Når det er landligge, sitter du der og hører regnet på taket (lyd). Oppgraderingene gir små fordeler, som raskere egning og bedre hvile. |
| 5 | **Sesongene som hendelser** | «Skreien er kommet» varsles på VHF, i Kystposten og på puben. Hver sesong har sitt fiske, sine priser og sine folk (skrei, vårtorsk, sei, makrell, kongekrabbe). En kalender viser hva som kommer. |
| 7 | **Folk på kaia** | Faste personer med egne historier: den gamle som kjente far, mottakssjefen som husker deg, kona i butikken og mannskap med navn, lojalitet og egne meninger. Relasjonene utvikler seg, og noen gir oppdrag. |
| 9 | **Push-varsler i appen** | Du velger selv å slå dem på: «Fint vær og torsk på feltet ditt i morgen», «Kvota di går ut om tre dager», «Garnet har stått i to døgn». Det krever web push (VAPID-nøkler som hemmelighet og en liten funksjon i Supabase). På Android virker det, på iPhone bare når appen er lagt på hjemskjermen. |
| 10 | **Musikk** | Svak, rolig ambient uten vokal i bakgrunnen, med av/på og volum i Innstillinger. Jeg foreslår musikk som lages i spillet (WebAudio: flater, langsomme akkorder, litt piano og vind). Da trengs ingen filer eller lisenser, og den følger vær og tid på døgnet. Alternativet er CC0-spor, som gir 3–5 MB per spor. |

Rekkefølgen jeg foreslår: musikken (liten og rask), så notatboka og drømmefisken sammen (notatboka kan peke mot drømmefisken), så naustet som hjem, så sesongene, så folkene, så push.

## Fase 4: Havn og utseende

- Utstyrsbutikken på kaia i Finnsnes plasseres, og Jonas får nye bilder.
- Innloggings- og innlastingsskjerm med Blender-bilder og bedre skrift.
- To nye mottaksmodeller (gammelt bruk og stort anlegg), og kaimottaket ved hvert mottak (M3).
- Kongekrabbeteine og animasjon for haling.

## Fase 5: Eldre åpne punkter

- Kino-visningen viser ofte ikke båten, båten vibrerer i bro-visningen, og vannlinja i kartplotteren er ikke nøyaktig nok.
- Regler (R4): varsel før feil, Autonav som unngår stengte felt, og tips første gang.
- Vær og klima: klima etter sted, snø som legger seg, årstider i landskapet, lavtrykk som flytter seg (V1–V4). Nordlys.
- Sikkerhet SK1–SK6: vest, drakt, mann over bord og nestenulykker.
- Lansering: WorkOS i produksjon med eget domene, «Slett kontoen» som også sletter WorkOS-brukeren, Stripe, skriftene på egen server, kildesiden og det engelske navnet.

## Flere forslag som gir verdi og lyst til å fortsette

1. **«Din uke på sjøen»:** hver søndag en kort oppsummering med største fisk, fortjeneste, distanse og et bilde. Den kan deles.
2. **Bragder og titler:** første 100 kg, første storm, første kveite og 1000 nautiske mil. Titlene går fra Lærling via Skipper og Fiskeskipper til Legende på kaia (ryktet finnes allerede).
3. **Dagens oppdrag fra mottaket:** «Vi trenger 50 kg hyse før kl. 16, 20 % ekstra.» Korte mål for en kort økt.
4. **Øyeblikk:** sjeldne ting som hval ved båten, nordlys over fjorden eller speilblank sjø i midnattssol lagres i et album, med fotomodus (kino-visningen finnes).
5. **Båten forteller en historie:** fars gamle turer i notatboka og dine egne i dekksdagboka, side om side.
6. **Restaurering av fars båt** (forslag 1 fra lista): fra slitt til pen, synlig på modellen. Slitasjesystemet i Blender gjør det mulig.
7. **Fiskefestival:** én helg i skreisesongen med konkurranse om største fisk, egen premie og tavle.
8. **Velkommen tilbake:** har du vært borte en stund, har naboen passet båten og har noe å fortelle, i stedet for at alt bare har stått stille.
9. **Lag og venner (senere):** fiske på samme felt, dele méd med venner og en felles kvote i et lite lag.
10. **Langsiktige drømmer:** kjøp fars gamle sjark tilbake fra en samler, eller bygg nytt naust. Det gir mål som tar uker.
