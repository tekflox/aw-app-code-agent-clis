#!/usr/bin/env bash
# Installs Claude Code (@anthropic-ai/claude-code) via npm, using the
# workspace's shared Node.js toolkit (installed by the "essentials" app —
# see dependencies.apps in aw-app.json; the reconciler installs it first).
# Symlinks the resulting `claude` binary into /usr/local/bin (regular
# system PATH — needs sudo since the container's default user is non-root).
# Idempotent — safe to re-run (on install, and on every reconcile pass
# after workspace recreation).
set -euo pipefail

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
AW_BIN_DIR="/usr/local/bin"

if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  echo "install_claude.sh: nvm not found at $NVM_DIR — the essentials app (a required dependency) should have installed it" >&2
  exit 1
fi
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh"
nvm use default >/dev/null

if [ -x "$AW_BIN_DIR/claude" ] && "$AW_BIN_DIR/claude" --version >/dev/null 2>&1; then
  echo "claude already installed: $("$AW_BIN_DIR/claude" --version)"
  exit 0
fi

npm install -g @anthropic-ai/claude-code >/dev/null

NODE_BIN_DIR="$(dirname "$(nvm which default)")"
sudo ln -sf "$NODE_BIN_DIR/claude" "$AW_BIN_DIR/claude"

"$AW_BIN_DIR/claude" --version
