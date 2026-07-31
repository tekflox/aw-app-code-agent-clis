#!/usr/bin/env bash
# Reverses every install_*.sh in this repo. Called on app uninstall
# (journal replay per the ADR's Decision 7 — this script IS the revert
# action for every commands:install journal entry from this app).
set -euo pipefail

AW_BIN_DIR="${AW_WORKSPACE_HOME:-$HOME/.aw-workspace}/bin"

# claude / codex / copilot — npm global packages installed through the
# shared Node.js toolkit owned by the "essentials" app dependency (nvm/node
# themselves are NOT removed here — that's essentials' own uninstall.sh).
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
  nvm use default >/dev/null 2>&1 || true
  npm uninstall -g @anthropic-ai/claude-code @openai/codex @github/copilot >/dev/null 2>&1 || true
fi
rm -f "$AW_BIN_DIR"/{claude,codex,copilot}

# cursor-agent — vendor installer, own $HOME sandbox dir under the
# workspace's persistent home.
rm -f "$AW_BIN_DIR/cursor-agent"
rm -rf "${AW_WORKSPACE_HOME:-$HOME/.aw-workspace}/cursor-agent"
