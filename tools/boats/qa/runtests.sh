#!/bin/bash
# The tests that cover a boat, one after the other and alone (never two SwiftShader pages at once, never beside a Blender render):
#     tools/boats/qa/runtests.sh "vessel3d snekke" "brotest snekke" lanterntest regmarktest vesseltest maletest walktest penshot
# one log per test in tests/out/logs/sn_<name>.log, the red lines printed. Start it in the background and wait for it to end; a
# foreground command stops after 10 minutes, and loops waiting on it in the background are stopped after 30.
# Its own limit is 90 minutes a test (vessel3d for all types takes about 60 in the cloud; run.py stops it at 40).
cd "$(dirname "$0")/../../../tests" || exit 1
for t in "$@"; do n=${t%% *}; a=${t#$n}; echo "== $t $(date +%H:%M)"; timeout 5400 python3 $n.py $a > out/logs/sn_$n.log 2>&1; echo "exit $?"; grep -E "^FEIL|^OK|sidefeil|Error" out/logs/sn_$n.log | grep -v "^OK" | head -8; done
