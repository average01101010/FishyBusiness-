#!/bin/bash
# Start (or resume) the blind tester as its own Claude session.
#   run_agent.sh <run> <prompt-file> [session-id-to-resume]
# It runs in an empty folder, sees no project instructions, and may only use the player bridge and look at
# the screenshots. Its stream goes to /root/playtest-obs/<run>/agent-<n>.jsonl.
set -e
RUN=$1; PROMPT=$2; RESUME=$3
OBS=/root/playtest-obs/$RUN
mkdir -p "$OBS" /tmp/spilltest-agent
N=$(ls "$OBS"/agent-*.jsonl 2>/dev/null | wc -l)
OUT="$OBS/agent-$((N + 1)).jsonl"
echo "$OUT" > "$OBS/transcript.txt"
ARGS=(-p "$(cat "$PROMPT")" --model "${MODEL:-claude-opus-5-5}" --tools Bash Read
      --allowedTools "Bash(/tmp/playtest/bro:*)" "Read(//tmp/playtest/bilder/**)"
      --permission-mode dontAsk --max-turns 1500 --output-format stream-json --verbose)
[ -n "$RESUME" ] && ARGS+=(--resume "$RESUME")
cd /tmp/spilltest-agent
nohup /tmp/playtest/agent-env.sh claude "${ARGS[@]}" < /dev/null > "$OUT" 2> "$OBS/agent-stderr.log" &
echo $! > "$OBS/agent.pid"
echo "started $! -> $OUT"
