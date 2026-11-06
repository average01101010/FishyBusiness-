#!/bin/bash
# A2 (docs/planer/verktoy-fra-game-studios.md, Ø17 06.11.2026): where the session is, written into it when it starts and again
# after every compaction (SessionStart runs then too, with source "compact"). It is a compass, not the reading: the index, the
# system document and the backlog are still read. It never stops a session: every step may fail on its own, and it always exits 0.
W=ccr-5e1ba2f4-pusvyd
inp=''; [ -t 0 ] || inp=$(head -c 4000 2>/dev/null)
src=$(printf '%s' "$inp" | sed -n 's/.*"source" *: *"\([a-z]*\)".*/\1/p' 2>/dev/null)
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" 2>/dev/null || exit 0
if [ "$src" = compact ]; then echo "Etter komprimeringen (.claude/hooks/okt-start.sh): dette er stedet, les det du trenger på nytt med offset og limit."
else echo "Øktstart (.claude/hooks/okt-start.sh${src:+, $src}):"; fi
{
  b=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
  if [ -z "$b" ]; then echo "- Gren: ingen git her."
  else
    if [ "$b" = "$W" ]; then on="arbeidsgrenen selv"
    elif git merge-base --is-ancestor "origin/$W" HEAD 2>/dev/null; then on="bygd på arbeidsgrenen $W"
    else on="HAR IKKE arbeidsgrenen i seg (main er tom). Hent den: git fetch origin $W && git checkout -B $b origin/$W"; fi
    behind=$(git rev-list --count "HEAD..origin/$W" 2>/dev/null); ahead=$(git rev-list --count "origin/$W..HEAD" 2>/dev/null)
    dirty=$(git status --porcelain 2>/dev/null | grep -c .)
    echo "- Gren: $b, $on.${behind:+ $behind bak og $ahead foran origin/$W (sist hentet; git fetch origin $W).} Ikke committet: ${dirty:-?} filer."
    echo "- Siste commits:"; git log --oneline -5 2>/dev/null | cut -c1-140 | sed 's/^/    /'
  fi
  if [ -f docs/BACKLOG.md ]; then
    items=$(awk '/^## Spillarbeid som venter/{on=1; next} /^## /{on=0} on && /^- \*\*/' docs/BACKLOG.md 2>/dev/null | sed -E 's/^- \*\*([^*]*)\*\*.*/\1/' | cut -c1-120)
    n=$(printf '%s\n' "$items" | grep -c .)
    echo "- Spillarbeid som venter (docs/BACKLOG.md), $n punkter, de 12 øverste:"; printf '%s\n' "$items" | head -12 | sed 's/^/    /'
  else echo "- Spillarbeid som venter: docs/BACKLOG.md finnes ikke her."; fi
  if [ -d tools/map/out/game ]; then echo "- Hele kysten: i tools/map/out/game/ ($(ls tools/map/out/game 2>/dev/null | wc -l | tr -d ' ') filer), så bygget tar den."
  else echo "- Hele kysten: ikke i tools/map/out/game/; bygget har bare Senja. Testene som trenger kysten (routetest K9, havtur, lybtest, tutcoast, fiskeplay) krever python3 tools/map/release.py og python3 tools/map/game.py først."; fi
  if [ ! -f dist/index.html ]; then echo "- dist/: ikke bygd (node build.mjs)."
  else
    new=$(find src build.mjs -type f -newer dist/index.html 2>/dev/null | head -1)
    if [ -n "$new" ]; then echo "- dist/: eldre enn src/ ($new er nyere), bygg før testene: node build.mjs."; else echo "- dist/: nyere enn src/."; fi
  fi
} 2>/dev/null
exit 0
