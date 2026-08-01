#!/usr/bin/env bash
# Standalone test — no framework runtime required. Run this INSIDE the
# aw-workspace container (with the "essentials" app already installed, so
# nvm/node/npm exist) to prove every install script here actually installs
# its tool and that it resolves after.
#
# Usage (from inside the container, with this repo copied in):
#   bash tests/standalone_test.sh
set -euo pipefail
cd "$(dirname "$0")/.."

AW_BIN_DIR="/usr/local/bin"

echo "== npm-based agent CLIs: claude/codex/copilot =="
bash scripts/install_claude.sh
bash scripts/install_codex.sh
bash scripts/install_copilot.sh

echo "== cursor-agent (vendor installer) =="
bash scripts/install_cursor.sh

echo "== resolution check (bin dir: $AW_BIN_DIR) =="
export PATH="$AW_BIN_DIR:$PATH"
for bin in claude codex copilot cursor-agent; do
  which "$bin"
done

echo "== versions =="
claude --version
codex --version
copilot --version
cursor-agent --version

echo "== idempotency re-run (each install script must be safe to run twice) =="
for s in install_claude install_codex install_copilot install_cursor; do
  bash "scripts/${s}.sh"
done

echo "OK: all 4 code-agent CLIs installed and resolve"
