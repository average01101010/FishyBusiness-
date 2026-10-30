# Oppdragene i Det Store Blå mot researchen: gap-analyse

*Researchnotat del 2, 30.10.2026. Bygger på `oppdragsdesign-psykologi.md` (del 1) og på gjennomgang av `ccr-5e1ba2f4-pusvyd`: `docs/engasjement.md`, `docs/systemer/oppdrag-og-kystposten.md`, `core/09g-turer.js`, `ui/05f-turer.js`, `docs/forslag.md`, `docs/planer/onboarding-2.md`, playtest-intervjuet, og hendelsene i skyen (`events`, 5.–29.10.2026).*

---

## 0. Kortversjon

**Grunnmuren er alt på plass, og den er bedre enn de fleste MMO-er.** Friction for Flow i `docs/engasjement.md` er i praksis Self-Determination Theory og dark-pattern-forskningen omsatt til regler: ingen straff for fravær, variabel belønning fra sjøen, endowed progress, alt kan nås uten å betale, sosialt er additivt, trakten måles. Oppdragssystemet (`09g-turer.js`) har sju typer, treffsikker tilbudssjekk mot båt og vær, faste priser, og en tilbudsbrems som holder fisket som hovedinntekt. Det meste av del 1 er altså ikke nytt for dette prosjektet.

**Det som mangler er ikke flere regler, men fire ting researchen peker på og som oppdragene i dag ikke har:**

1. **Ansikt og hook.** Oppdragene er kontrakter uten avsender. Ingen husker at du leverte, ingenting følger av det senere. Dette er det RuneScape, CDPR og Sea of Thieves peker på som forskjellen mellom en plikt og en opplevelse.
2. **Noe som skjer underveis.** Oppdraget sjekkes så det er gjennomførbart, og så skjer ingenting før du er framme. Emergensen (vær, bestand, andre båter) brukes til å *filtrere* oppdrag, ikke til å *forandre* dem.
3. **Terskelen inn.** Spilleren i intervjuet så oppdragene og «turte ikke». 4 av 14 aktive spillere har tatt et oppdrag. Første oppdrag må være garantert trygt og ligge på veien.
4. **Måling.** De 13 feilede oppdragene kan ikke skilles (gitt fra seg, frist ute, på land), og 17 av 52 tatte har ikke noe utfall i hendelsene. Sesongflyttingen feiler 7 av 11 ganger. Dette er signaler, ikke bevis (14 spillere), men de peker tydelig. (Målingen er bygd 30.10.2026.)

---

## 1. Hva spillet alt gjør riktig (og som del 1 anbefalte)

| Research (del 1) | I spillet | Hvor |
|---|---|---|
| SDT: kompetanse, autonomi, tilhørighet | Friction for Flow, «alt kan nås uten å betale», valgfri tavle, «Kjør dit» | `engasjement.md` |
| Variabel belønning fra naturen, aldri for penger | «Variabel belønning kommer fra sjøen, ikke fra lommeboka», ingen loot boxes | `engasjement.md`, CLAUDE.md |
| Endowed progress, aldri start på null | Tre milepæler krysset av fra første tur, Neste mål-stripa teller leveringen | `09f-merker.js`, onboarding-2 prinsipp 2 |
| «2 av 3»-prinsippet mot daily-fella | Kapittel åpner ved 5 av 7 milepæler | `ACH_OPEN` |
| Ingen straff for fravær, ingen streak som nulles | `STREAK.decay`, push knyttet til egen drift | `push-plan.md` |
| Blindveier: første tap er gratis | Første slep og første reparasjon gratis, beholder fangsten | `freeFirst` |
| Oppdrag må være lønnsomme men ikke slå fisket | Betalt etter båtens kurve × 1,0/1,1/1,25, tilbudsbrems ved 30 % andel | `turPay`, `turSlow` |
| Treffsikre tilbud (flow: utfordring møter ferdighet) | `turCan`: drivstoff, eksponering, varsel, kvote, hender om bord | `09g-turer.js` |
| Autentisitet som læring (Koster) | Bergelønn etter sjøloven, Kystreferanseflåten, fyrregisteret, kvoterom | `turSlep`, `turProve`, `turRoom` |
| Alone together | Felles verden, Kystposten, AIS, topplister, synlige båter uten tvungen gruppering | `skyen-og-felles-verden.md` |
| Målbar trakt | Konvolutt → fangst → levering → registrert → D1/7/30 | `admin_funnel` |
| Spillerens tid respekteres | Fristen inkluderer fisketida (alternativ A), omvei vises, «på veien din» først | #92/#93, `turDetour` |

Konklusjon: del 1 bekrefter retningen. Ingenting i grunnreglene bør endres.

---

## 2. Hva tallene sier (events, 5.–29.10.2026)

Bare spillere som deler statistikk. 14 aktive spillere, 5 har solgt fisk, 4 har tatt oppdrag, 3 har fullført.

| | Tatt | Fullført | Feilet (også gitt fra seg) | Uten utfall |
|---|---|---|---|---|
| Alle | 52 | 22 | 13 | 17 |
| Kort | 9 | 5 | 3 | 1 |
| Middels | 9 | 3 | 1 | 5 |
| Lang | 23 | 12 | 2 | 9 |
| Sesong | 11 | 2 | 7 | 2 |

Per type: fyrbilde (lang) 9 tatt, 6 fullført, 2 feilet. Bestilling lang 7/4/0. Frakt lang 7/2/0 (5 umålt). Slep 4/2/1. Prøvefiske 1/1/0. Sesong 11/2/7.

Oppdragsinntekt 596 000 kr mot fiskeinntekt 4,45 millioner, altså 12 %. Godt under bremsen på 30 %, så oppdragene truer ikke fisket. Ingen oppdrag ble fullført med trim på.

**Lesning:**

- **De lange oppdragene tas mest.** 23 av 52. Jonas' tese («lange turer med god belønning») holder. Fyrbildet er den mest populære og mest fullførte typen, og det er den eneste med en opplevelse i seg (lyset, bildet, avisa). Det støtter del 1: hook slår kontrakt.
- **Sesongflyttingen feiler.** 7 av 11. En hel spilluke, tre lastrom, 40–250 nm unna. Den er den eneste uten delbelønning underveis, og den eneste der et tap betyr en ukes innsats uten utfall. Goal gradient-forskningen sier at lange mål trenger synlige mellomtrinn.
- **Frakt gis fra seg.** 14 tatt, 5 fullført, 1 feilet, 8 umålt. Trolig fordi lasta tar plass i lasterommet og kolliderer med fisket. Verdt å spørre spillerne.
- **Terskelen er høy.** 4 av 14 har prøvd. Intervjuet (spørsmål 29): «Jeg så dem, men turte ikke ta oppdrag. Ideen er god.» Dette er den største enkeltgevinsten: få 10 av 14 til å ta ett.

---

## 3. Gapene, sortert etter research-tyngde

### 3.1 Ingen avsender, ingen hukommelse, ingen konsekvens senere

Oppdragene kommer fra «mottaket», «Havforskningsinstituttet», «Kystposten» og en forsikringskunde med navn fra en liste. Ingen av dem husker deg. `repOf` finnes (0,8–1,2 på bonusen) men er usynlig. Forslag B1 «Folk som husker deg» er skrevet men ikke bestilt.

Research: RuneScape krever en hook per oppdrag. Sasko (CDPR): konsekvenser som dukker opp senere er det som gjør oppdrag minneverdige. Yee: framgang og immersion er topp to motivasjoner i MMO.

**Minste versjon:** hver bestilling og frakt får en avsender med navn fra `09d-folk.js` (bestyreren, kjøpmannen). Én linje ved levering som viser at hen husker («Det var du som kom med agnet i kulingen i forrige uke»). Tredje fullførte oppdrag fra samme person åpner en bedre bestilling (kvalitetstillegg, lenger frist). Ingen tall på skjermen. Dette er Sea of Thieves' rykte-modell i miniatyr.

### 3.2 Ingenting skjer underveis

`turCan` sjekker varsel, drivstoff og eksponering før tilbudet. Det er riktig (flow, ingen umulige oppdrag). Men etter at oppdraget er tatt, er det bare seiling. Slepet er unntaket (hun driver, faren settes ved ankomst).

Research: emergens er «det billigste retention-verktøyet» (CCP). Sea of Thieves: «det kommer IKKE til å gå som planlagt». Kaplan: variasjon i rytmen.

**Minste versjon:** én hendelse per langt oppdrag, trukket fra simuleringen, aldri oppdiktet: været snur tidligere enn varslet (båten må søke havn, fristen står), mottaket ringer og vil ha 100 kg til for 30 % mer, en NPC-båt på VHF melder at fisken har flyttet seg, Kystvakta tar kontroll ved kai (regelmotoren finnes). Hendelsen skal kunne tapes på en måte som ikke er en blindvei: oppdraget står, bare bonusen ryker.

### 3.3 Terskelen inn: «turte ikke»

Første oppdrag er i dag et vanlig kort oppdrag på tavla, med frist, og spilleren vet ikke hva som skjer om det går galt.

Research: endowed progress, første mestring raskt, Zeigarnik (en uløst oppgave ved slutten). Onboarding-2 prinsipp 5 sier alt «Kapittel 1 slutter med én konkret, liten oppgave».

**Minste versjon:** ett garantert «første oppdrag» i Første uke, kapittel 2: frakt av post på under 10 minutter til mottaket spilleren uansett skal til («på veien din»), ingen frist som kan ryke, kjent belønning, og en setning om at ingenting tapes om det ikke blir gjort. Det er milepælen «Første oppdrag» og teller mot kapittelet. Måles som andel som tar et andre oppdrag innen 7 dager.

### 3.4 Sesongflyttingen trenger trinn

Tre lastrom på en uke uten mellomtrinn. 7 av 11 feiler.

Research: goal gradient (innsatsen øker nær målet, men bare når målet er synlig og nært), endowed progress, Deep Rock Galactics «deep dive» i tre etapper.

**Minste versjon:** tre etapper (ett lastrom hver), hver med sin del av belønningen og en linje i Kystposten etter den andre. Går uka ut etter to etapper, er to tredeler betalt og oppdraget står som «delvis» i Tidligere, ikke «ikke fullført». Samme totalbelønning som i dag.

### 3.5 Oppdragene er alene

Alle sju typer er solo. Slep av spillere (`10o-ptow.js`, 25 000 kr) finnes men står ikke på tavla. Fiskarlag er «vurderes senere». A2 Lofotfisket (felles tavle) er planlagt men ikke bestilt.

Research: sosiale bånd er den sterkeste prediktoren for at folk blir, achievement alene forutsier churn. Retention-driverne skifter fra framgang (tidlig) til venner (senere). Alone together: nærhet uten tvang.

**Minste versjon:** når en spiller innen 30 nm sender nødanrop, dukker det opp som et kort på tavla («Hjelp på sjøen», som slep i dag) med bergelønn etter samme regel. Ingen tvang, additivt. Så A2 (felles sesongtavle), som alt er planlagt og er den riktige neste byggesteinen for «denne uka»-sløyfen.

### 3.6 Oppdragene lærer lite

Prøvefiske og fyrbilde lærer noe (målebrettet, lyset, fyrene). Bestilling og frakt lærer ingenting om hav eller fiske.

Research: Koster, moro er læring. Spillets fortrinn er ekte data.

**Minste versjon:** én setning sann kontekst på kortet, fra dataene som alt finnes: «Seien står på grunnene nå fordi …», «Mottaket mangler hyse fordi linebåtene ligger inne i kulingen», «Denne lykta ble tent i 1868». Kystposten-saken etter et langt oppdrag kan bære det samme.

### 3.7 Målingen har hull

- Et oppdrag som gis fra seg logges som `tur_fail`, likt med et som gikk ut på tid eller en båt som drev på land. De 13 feilene kan ikke skilles. (Rettet fra første utkast, som sa at det ikke ble logget.)
- 17 av 52 `tur_take` har verken `tur_done` eller `tur_fail`. Uten en id på oppdraget kan vi ikke se om de fortsatt står, eller om hendelsen aldri kom fram (lukket fane, konflikt i lagringen).
- `pay` mangler i 14 av 22 `tur_done`, men bare i dem fra før 17.10.2026 (feltet kom med oppdragsøkonomien). Ikke et hull i koden i dag.
- Ingen hendelse for at tavla ble sett uten at noe ble tatt.
- Ingen måling av tid brukt mot frist (backlog 10.5 ber om det).

**Minste versjon:** `how` i `tur_fail` (gitt fra seg, frist, på land, Redningsselskapet); `id` på alle tre så tatt kan kobles til utfall; `tur_show` én gang per sett på tavla; `frac` (brukt tid / frist). Dette er en liten jobb og bør gå først, fordi alt annet skal leses av i tallene. **Bygd 30.10.2026**, se `docs/systemer/oppdrag-og-kystposten.md` (Måling).

---

## 4. Det som ikke bør endres

- **Tilbudsbremsen** (30 %, `turSlow`). Oppdragene ligger på 12 %. Fisket er hovedinntekten, som Jonas vil.
- **Faste priser** på tavla. Forsøket 16.–17.10 med priser som endret seg under hendene på spillerne ga umiddelbar frustrasjon. Research: tydelige mål og umiddelbar tilbakemelding (flow).
- **Ingen daglige oppdrag.** Slagplanens forslag 3 («Dagens oppdrag fra mottaket») er en daily. Bygges det, må det følge 2-av-3-logikken og aldri være det eneste korte tilbudet.
- **Fristen flyttes aldri.** Riktig. Men delbelønning (3.4) er ikke det samme som å flytte fristen.

---

## 5. Foreslått rekkefølge

Hver linje passer i én økt etter `docs/utviklingsplan.md`.

| # | Hva | Hvorfor først | Måles som |
|---|---|---|---|
| 1 | Måling: `how` i `tur_fail`, `id`, `tur_show`, `frac` (bygd 30.10.2026) | Alt etterpå skal leses av her | Andel uten utfall → 0 |
| 2 | Garantert første oppdrag i Første uke, kapittel 2 | Største terskel, 4 av 14 | Andel som tar oppdrag nr. 2 innen 7 dager |
| 3 | Sesongflytting i tre etapper med delbelønning | 7 av 11 feiler | Fullført + delvis mot feilet |
| 4 | Avsender med navn og én linje hukommelse ved levering | Hook, immersion, billig med `09d-folk.js` | Gjentatte oppdrag fra samme sted |
| 5 | Én sann hendelse underveis per langt oppdrag | Emergens, variasjon | Fullføringsgrad lange, økt-lengde |
| 6 | Nødanrop fra spillere på tavla | Sosialt, additivt | Andel med venn etter 7 dager |
| 7 | A2 Lofotfisket som felles tavle | «Denne uka»-sløyfen | D7/D30 med merke mot uten |

---

## 6. Forbehold

Tallene er fra 14 spillere over 25 dager, de fleste testere med takk-haill. Det er signaler. Intervjuet er én person. Researchen i del 1 er solid på SDT, flow og sosial retention, svakere på FOMO og utbrenthet. Forslagene over er skrevet for å passe reglene i `docs/engasjement.md` og CLAUDE.md, men ingen av dem er bestilt. Jonas sier «kjør på».
