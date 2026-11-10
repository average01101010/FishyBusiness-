#!/bin/sh
# films the shots named on the command line (GPU): the setup, the summary and the first errors per shot.
#   JOBS=3 ARGS="--scale 2 --fps 60 --jpeg 97" sh trailer/tools/film-all.sh 01-naust-trebat 02-trebat-naert ...
# JOBS films that many shots at once (each film.py serves the game on its own free port); with more than one, each shot's
# lines are printed when it is done. ARGS goes to film.py after --gpu (the 4K master: --scale 2 --fps 60 --jpeg 97).
cd "$(dirname "$0")/../.." || exit 1
PY="${PY:-$LOCALAPPDATA/Programs/Python/Python312/python.exe}"; [ -x "$PY" ] || PY=python3
export PY ARGS
one() {
  s="$1"
  { echo "=== $s"
    PYTHONIOENCODING=utf-8 "$PY" trailer/tools/film.py "trailer/shots/$s.json" --gpu $ARGS 2>&1 | awk '/^(kurs|løpet|fortøyd|ligger|arbeid|dyr|lastet|film|feil|video)/ { print; fflush() } /^(FEIL|Traceback|playwright)/ { if (n++ < 4) { print substr($0, 1, 200); fflush() } } /^   / { if (m++ < 4) { print substr($0, 1, 200); fflush() } }'
  } > "trailer/out/.film-$s.log" 2>&1
  cat "trailer/out/.film-$s.log"
}
mkdir -p trailer/out
if [ "${JOBS:-1}" -le 1 ]; then for s in "$@"; do one "$s"; done; exit 0; fi
n=0
for s in "$@"; do
  one "$s" &
  n=$((n + 1)); [ $((n % JOBS)) -eq 0 ] && wait
done
wait
