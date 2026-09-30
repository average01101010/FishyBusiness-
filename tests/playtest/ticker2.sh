#!/bin/bash
# Emit one line every ~2 minutes while a run is live, with a frozen copy of the tribune data and screenshot
# (the harness rewrites the live files all the time). Exits with AGENT_EXIT when the tester's process ends.
#   ticker.sh <run> [interval-seconds]
RUN=$1; IV=${2:-120}
O=/root/playtest-obs/$RUN; T=$O/tick
mkdir -p $T
seq=$(ls $T/*.json 2>/dev/null | wc -l)
last=""
while true; do
  sleep $IV
  pid=$(cat $O/agent.pid 2>/dev/null)
  m=$(stat -c %Y $O/tribune.json 2>/dev/null)
  if [ "$m" != "$last" ]; then
    last=$m; seq=$((seq + 1)); id=$(printf '%s-%03d' $RUN $seq)
    cp $O/tribune.jpg $T/$id.jpg && cp $O/tribune.json $T/$id.json
    new=$(md5sum < $T/$id.jpg); img=nytt; [ "$new" = "$prev" ] && img=samme; prev=$new
    echo "tick $id bilde=$img $(python3 -c "import json;d=json.load(open('$T/$id.json'));print('phase',d.get('phase'),'acts',d.get('acts'),'cash',d.get('cash'),'|',d.get('clock'),'|',d.get('boat'))" 2>&1)"
  fi
  if [ -n "$pid" ] && ! kill -0 $pid 2>/dev/null; then echo "AGENT_EXIT $RUN $(date -u +%H:%M)"; exit 0; fi
done
