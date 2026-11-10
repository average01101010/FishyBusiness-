#!/bin/sh
# films the shots named on the command line one after the other (GPU, full size): the setup, the summary and the first errors per shot
cd "$(dirname "$0")/../.." || exit 1
PY="${PY:-$LOCALAPPDATA/Programs/Python/Python312/python.exe}"
for s in "$@"; do
  echo "=== $s"
  PYTHONIOENCODING=utf-8 "$PY" trailer/tools/film.py "trailer/shots/$s.json" --gpu 2>&1 | awk '/^(kurs|løpet|fortøyd|ligger|arbeid|dyr|lastet|film|feil|video)/ { print; fflush() } /^(FEIL|Traceback|playwright)/ { if (n++ < 4) { print substr($0, 1, 200); fflush() } } /^   / { if (m++ < 4) { print substr($0, 1, 200); fflush() } }'
done
