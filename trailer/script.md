# Manus v4: stemme, undertekster og tekst på skjermen

> **Klippekart 4 (m4, 10.11.2026, `audio/music-edit-4.json`)** er det gjeldende. Endret fra klippekart 3 under: nordlyset kommer før Svalbard (S6: «mørket» over nordlyset, «Alt følger med» over krabbebåten); ingen stedsnavn før droppet (T1–T5 ute), bare Midnattssol og montasjen; montasjen er Hvaler · Bodø · Tromsø · Kirkenes · Færøyene · Svalbard (Skottland og Grønland ute: flatt land uten høyder); undertekstene er 54 px; musikken stiger 6 dB inn i droppet og går ned til +2,5 dB for siste linje, stemmen ligger 5 LU over hele låta (rundt 7,5 dB over musikken der det snakkes), S8 er løftet 2 dB. Målt i fila: stemmen rundt −21,7 dB RMS, musikken mellom linjene −29,1, droppet −19,7; ut −21,6 LUFS, topp −6,0 dBTP. Stemmens tider er som i tabellen under.

*10.11.2026, klippekart 3 (`audio/music-edit-3.json`, grovklipp m3). Stemmen bærer historien (ElevenLabs, en venns modell; Jonas 10.11.2026). Stemmens linjer står også som undertekst, så filmen virker med lyden av. Stedsnavnene følger klippene sine. «Fra trebåt …» og «… til snurper» (T6 og T8 i v3) er ute: de fortalte en annen historie enn stemmen. Alt tegnes av `tools/titles.py` i Source Serif 4 Display Semibold (spillets egen, OFL), hvit med myk skygge. v3 (uten stemme, m2) ligger i `audio/music-edit-2.json`.*

## Stemmen og undertekstene

Ett opptak, som klippes i linjer og føres inn som `voice` i klippekartet (`tools/START-4K-MASTER.md` punkt 9). 37 ord. Stille fra 27,4 til 41,5 s (kystnotbåten under brua, hvalen, montasjen), der bildet og musikken står alene. Starttidene er mål: hver linje skal begynne 0,2–0,4 s etter klippet den hører til, aldri på selve klippet, og ingen linje går inn i stillheten.

| # | Stemmen (s) | Underteksten (s) | Linje | Bildet |
|---|---|---|---|---|
| S1 | 0,80–2,06 | 0,80–2,56 | Det store blå. | naustet |
| S2 | 2,90–6,42 | 2,90–6,92 | Båten er fra femtiseks. Naustet er eldre. | naustet og nærbildet («Naustet er eldre» begynner 0,2 s etter klippet) |
| S3 | 7,70–10,43 | 7,70–10,93 | Han far sa alltid at havet ikke skylder deg noe. | under brua |
| S4 | 12,70–14,38 | 12,70–14,88 | Noen dager gir sjøen. | garnene i Lofoten |
| S5 | 15,20–16,55 | 15,20–17,05 | Andre dager tar ho. | kulingen ved Vardø |
| S6 | 17,80–21,50 | 17,80–22,00 | Kulda, mørket, regningene. Alt følger med. | Svalbard og nordlyset |
| S7 | 25,10–26,30 | 25,10–26,80 | Men så letter det. | Senja fra lufta, siste takt før droppet |
| – | 27,4–41,5 | | (stille) | kystnotbåten under brua, hvalen, montasjen |
| S8 | 41,50–42,79 | 41,50–43,29 | Nå er det din tur. | de to båtene ved kaia |

**Opptak 1** (ElevenLabs, 10.11.2026, 19,4 s) er klippet i de åtte linjene ved pausene (`from` i klippekartet); fila ligger bare på maskinen (`audio/voice/` er ikke i git). S2 og S3 er flyttet fra målene (2,6 og 8,0) til 2,9 og 7,7 så ingen setning begynner på et klipp. Linjene i opptaket var ujevne (9 dB mellom den svakeste og den sterkeste), så hver linje jevnes til samme styrke, komprimeres 4:1 og toppbegrenses (`voice_af` i `tools/enc.py`). Målt i m3: stemmen −28 LUFS mot musikken −36,8 i miksen før løftet (8 LU), ut −24,2 LUFS med topp −6,0 dBTP; i fila ligger stemmen rundt −22 dB RMS, musikken mellom linjene −32 og droppet −28,6.

**Undertekstene** (`SUBS` i `tools/titles.py`, `subs` i klippekartet): vanlig setningsskrift, 46 px ved 1080 bredde, midtstilt, øverste linje 66 % ned fra toppen, høyst to linjer, 13 % luft på hver side (unna nederste fjerdedel og høyre kant). Toner mykt inn over 0,5 s og ut over 0,45 s (stedsnavnene 0,6 og 0,5, navnene i montasjen 0,2). Ingen bånd bak teksten, bare svart glød rundt bokstavene (Jonas 10.11.2026). Hver undertekst står så lenge linja sies pluss 0,5 s.

Innstillinger å begynne med i ElevenLabs (fra Laksebaronen): stability 50 %, similarity 75 %. Stemmen skal ligge minst 8 LU over musikken, og musikken senkes aldri bare mens stemmen snakker (`tools/enc.py`).

## Tekst på skjermen

Stedsnavn i store bokstaver med tynn strek under, 27 % ned fra toppen. Ingen utropstegn.

| # | Tid (s) | Tekst | Faller på |
|---|---|---|---|
| T1 | 7,70–10,30 | Finnsnes | trebåten under Gisundbrua |
| T2 | 12,53–14,63 | Lofotfisket | garnene i Lofoten |
| T3 | 15,07–17,17 | Varanger | kulingen ved Vardø |
| T4 | 17,53–19,63 | Svalbard | snøkrabbefartøyet |
| T5 | 22,50–24,60 | Lofoten | Reine fra lufta |
| T7 | 33,00–36,60 | Midnattssol | hvalen ved Bleik |
| T9 | 37,40–41,10 | Hvaler · Tromsø · Kirkenes · Skottland · Færøyene · Grønland | ett slag hver, montasjen |
| T10 | 44,87 | (logo) | slaget der utgangen begynner |
| T11 | 45,50–50,00 | Spill gratis på detstorebla.no | ett slag etter logoen |

Ingen stedsnavn over naustet, nærbildet, nordlyset, Senja fra lufta, droppet og de to båtene ved kaia. Ingen kildehenvisning i bildet (Jonas 10.11.2026); den står i teksten under videoen.
