---
name: kontroll
description: Uavhengig kontroll før levering: en fersk agent får endringen og «Ferdig når»-punktene, ikke øktas egen oppsummering, og leter etter det som mangler eller er galt. Brukes i /lever når et steg har endret src/.
---

# /kontroll

En økt som vurderer sitt eget arbeid, finner sjelden hullene selv (Jonas 12.11.2026, `docs/utviklingsplan.md` D10; båtmodellene har hatt en uavhengig sensor siden OB-stegene, og det var den som fant 70/100). Kontrollen tas etter lukkerunden og før commit i `/lever`, når steget har endret `src/`. Ikke for rene dokumentendringer.

1. **Skriv endringen til en fil** i scratchpad: `git diff $(git merge-base origin/ccr-5e1ba2f4-pusvyd HEAD)` (pluss det som ikke er committet), og lista over filene.
2. **Start én fersk agent** (`Agent`, vanlig type, ikke `fork`: den skal ikke arve det økta mener). Briefen inneholder bare:
   - «Ferdig når»-punktene fra `docs/planer/start/<steg>.md`, ordrett, og stien til planens kapittel og systemdokumentet;
   - stien til diff-fila og fillista;
   - oppgaven: «For hvert punkt: vis med fil og linje at det holder, eller si hva som mangler. Let så etter feil i endringen: grensetilfeller, hele kysten og ikke bare Senja, en lagring uten de nye feltene, tiden som går mens spillet er lukket, begge formater, og om en regel i `CLAUDE.md` er brutt. Svar med en liste: punkt, holder eller holder ikke, bevis. Ikke gjengi diffen. Ikke foreslå nytt arbeid utenfor steget.»
   - **Aldri** øktas egen oppsummering, hva den mener er svakt, eller hva den tror svaret er.
3. **Det agenten finner, er lukkerunden om igjen:** det som ikke holder, rettes i økta, og testene for det som ble rettet, kjøres. Er du uenig i et funn, vis hvorfor med fil og linje i meldingen til Jonas; et funn forsvinner ikke stille.
4. **Meldingen til Jonas** sier én linje: hvor mange punkter kontrollen sjekket, hva den fant, og hva som ble rettet.

Én kontroll per steg, ikke én per commit. Båtmodellene bruker sensoren sin (`/blender`) i stedet. `/code-review` i rutinens port leter etter kodefeil; kontrollen spør om steget er *ferdig*.
