#!/usr/bin/env bash
# Installs GitHub Copilot CLI (@github/copilot) via npm, using the
# workspace's shared Node.js toolkit (installed by the "essentials" app —
# see dependencies.apps in aw-app.json; the reconciler installs it first).
# Symlinks the resulting `copilot` binary into /usr/local/bin (regular
# system PATH — needs sudo since the container's default user is non-root).
# Idempotent — safe to re-run (on install, and on every reconcile pass
# after workspace recreation).
set -euo pipefail

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
AW_BIN_DIR="/usr/local/bin"

if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  echo "install_copilot.sh: nvm not found at $NVM_DIR — the essentials app (a required dependency) should have installed it" >&2
  exit 1
fi
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh"
nvm use default >/dev/null

if [ -x "$AW_BIN_DIR/copilot" ] && "$AW_BIN_DIR/copilot" --version >/dev/null 2>&1; then
  echo "copilot already installed: $("$AW_BIN_DIR/copilot" --version)"
  exit 0
fi

npm install -g @github/copilot >/dev/null

NODE_BIN_DIR="$(dirname "$(nvm which default)")"
sudo ln -sf "$NODE_BIN_DIR/copilot" "$AW_BIN_DIR/copilot"

"$AW_BIN_DIR/copilot" --version
