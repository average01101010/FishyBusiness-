# Sikkerhetsgjennomgangen av skyen (Ø6, A7, 05.11.2026)

Økt Ø6 i `docs/planer/okter-etter-backloggen.md`, punkt A7 i `docs/planer/verktoy-fra-game-studios.md`. Jonas sa «kjør på» 05.11.2026. Økta har bare lest: ingen kode, ingen migrering og ingenting skrevet til databasen. Rettingene er forslag og bygges i egne økter (forslag til rekkefølge nederst).

## Hva som er lest

- `supabase/migrations/` (59 filer) og den levende databasen, bare med lesende spørringer: tabellene med RLS og rettigheter (`pg_class`, `pg_policy`, `has_table_privilege`), alle 150 funksjonene i `public` med hvem som kan kjøre dem (`has_function_privilege`) og kroppen til de som skriver eller deler noe om spillerne, triggerne, lagringsbøtta og jobbene i `cron.job`. Supabases sikkerhetsråd (`get_advisors security`) er tatt med.
- `supabase/functions/` (alle fem pluss `_shared/report.ts`).
- `ui/10f-cloud.js`, `ui/10g-push.js`, `ui/10l-share.js`, `ui/10h-world.js`, `src/admin/index.html`, `src/data/cloud.json` (lest av en lesende agent; funnene er sjekket mot linjene).
- `tools/server/setup.sh`, `tools/server/Caddyfile`, `.github/workflows/autofix.yml` og `deploy.yml`, og et søk etter hemmeligheter i hele git-historikken.

Det databasen faktisk har, er det som gjelder. Der migreringene sier noe annet, står det under funnet.

## Kort svar på spørsmålene

| Spørsmål | Svar |
|---|---|
| Hva kan en innlogget spiller lese om andre? | Bare det funksjonene gir: posisjon, båtnavn, brukernavn, fartstid, redskap i sjøen, landinger (kg, art, havn, båt) og topplistene. Aldri WorkOS-ID, e-post, lagring, penger eller kjøp: alle tabellene har RLS, ingen har policy for spillere, og ID-en ut er `md5('dsb'‖id)` kuttet til 10 tegn. Ingen tabell kan leses rett. |
| Hva kan en gjest eller en uten innlogging gjøre? | Uten innlogging: skrive feil (`tm_error`) og bildetakt (`tm_perf`) uten grense, lese sponsorene (`sp_now`, med vilje). En gjest (anonym Supabase-bruker) kan alt en spiller kan unntatt kjøp, navn, hilsen, venner, delte merker, nyheter og Kystposten, **også levere landinger og fangst som teller i den felles verdenen** (funn 1–2). |
| Kan haill, landinger, topplista eller lagringene forfalskes? | **Ja, landingene og fangsten** (funn 1–2), og med dem topplistene, kvoten for åpen gruppe, prisene i mottakene, fiskarlagets mål og ukas push. **Lagringen** er klientens egen (penger, haill og alt), men treffer bare spilleren selv (funn 5). **Kjøpet av haill** avgjøres av Stripe-webhooken på serveren og kan ikke forfalskes (sjekket). |
| Er admin og tilbakemeldingene stengt? | Ja. Alle `admin_*`/`sp_admin_*` sjekker `is_admin()` (Supabase Auth-bruker i `admins` og `aal2`). `agent_*` kan bare kjøres av `service_role` gjennom `feedback-agent` med tokenet, sammenlignet i konstant tid. Lagringsbøtta for video er privat. Restrisiko: tilbakemeldingstekst går via rutinen til PR-er som kan flettes og rulles ut av seg selv (funn 9). |
| Hemmeligheter i koden? | Ingen funnet, heller ikke i historikken. `cloud.json` har bare offentlige verdier (publiserbar nøkkel, WorkOS-klient-ID). |
| Viser noe som deles, haill? | (fylles inn etter klientgjennomgangen) |

## Funnene

Alvorlighet: **høy** = én spiller kan ødelegge for alle eller ta penger; **middels** = jukseveier eller misbruk som merkes av andre; **lav** = herding.

(fylles inn)
