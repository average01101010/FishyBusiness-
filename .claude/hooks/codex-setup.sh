#!/bin/bash
# Cloud sessions only: installs the OpenAI Codex CLI that the codex plugin (openai/codex-plugin-cc, enabled in
# .claude/settings.json) wraps, and signs it in with the environment's OPENAI_API_KEY. Never fails the session start:
# without the key or without network access to api.openai.com the session runs as before, only /codex:* will not answer.
set -uo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

log() { echo "[codex-setup] $*" >&2; }

if ! command -v codex >/dev/null 2>&1; then
  log "installing @openai/codex"
  if ! npm install -g @openai/codex >/dev/null 2>&1; then
    log "npm install -g @openai/codex failed; /codex:* will not work in this session"
    exit 0
  fi
fi
log "codex $(codex --version 2>/dev/null | tail -1)"

if codex login status >/dev/null 2>&1; then
  log "already signed in"
elif [ -n "${OPENAI_API_KEY:-}" ]; then
  if printenv OPENAI_API_KEY | codex login --with-api-key >/dev/null 2>&1; then
    log "signed in with OPENAI_API_KEY"
  else
    log "codex login --with-api-key failed"
  fi
else
  log "OPENAI_API_KEY is not set in the environment; add it in the cloud environment's settings"
fi
exit 0
