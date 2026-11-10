# Manus v4: stemme, undertekster og tekst på skjermen

*10.11.2026, klippekart 3 (`audio/music-edit-3.json`, grovklipp m3). Stemmen bærer historien (ElevenLabs, en venns modell; Jonas 10.11.2026). Stemmens linjer står også som undertekst, så filmen virker med lyden av. Stedsnavnene følger klippene sine. «Fra trebåt …» og «… til snurper» (T6 og T8 i v3) er ute: de fortalte en annen historie enn stemmen. Alt tegnes av `tools/titles.py` i Source Serif 4 Display Semibold (spillets egen, OFL), hvit med myk skygge. v3 (uten stemme, m2) ligger i `audio/music-edit-2.json`.*

## Stemmen og undertekstene

Ett opptak, som klippes i linjer og føres inn som `voice` i klippekartet (`tools/START-4K-MASTER.md` punkt 9). 37 ord. Stille fra 27,4 til 41,5 s (kystnotbåten under brua, hvalen, montasjen), der bildet og musikken står alene. Starttidene er mål: hver linje skal begynne 0,2–0,4 s etter klippet den hører til, aldri på selve klippet, og ingen linje går inn i stillheten.

| # | Starter (s) | Linje | Bildet |
|---|---|---|---|
| S1 | 0,8 | Det store blå. | naustet |
| S2 | 2,6 | Båten er fra femtiseks. Naustet er eldre. | naustet og nærbildet |
| S3 | 8,0 | Han far sa alltid at havet ikke skylder deg noe. | under brua |
| S4 | 12,7 | Noen dager gir sjøen. | garnene i Lofoten |
| S5 | 15,2 | Andre dager tar ho. | kulingen ved Vardø |
| S6 | 17,8 | Kulda, mørket, regningene. Alt følger med. | Svalbard og nordlyset |
| S7 | 25,1 | Men så letter det. | Senja fra lufta, siste takt før droppet |
| – | 27,4–41,5 | (stille) | kystnotbåten under brua, hvalen, montasjen |
| S8 | 41,5 | Nå er det din tur. | de to båtene ved kaia |

**Undertekstene** (`SUBS` i `tools/titles.py`, `subs` i klippekartet): vanlig setningsskrift, 46 px ved 1080 bredde, midtstilt, øverste linje 66 % ned fra toppen, høyst to linjer, 13 % luft på hver side (unna nederste fjerdedel og høyre kant). Inn på 0,25 s, ut på 0,2 s. Til stemmefila finnes, er lengden anslått til 0,45 s per ord pluss 0,6 s, kortet så ingen linje står inn i den neste eller i stillheten (S1 1,7 s, S2 3,75, S3 4,6, S4 2,4, S5 2,4, S6 3,3, S7 2,2, S8 2,85). Når opptaket kommer, rettes tidene og lengdene etter det.

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
