#!/usr/bin/env bash
# Installs OpenAI Codex CLI (@openai/codex) via npm, using the workspace's
# shared Node.js toolkit (installed by the "essentials" app — see
# dependencies.apps in aw-app.json; the reconciler installs it first).
# Symlinks the resulting `codex` binary into /usr/local/bin (regular
# system PATH — needs sudo since the container's default user is non-root).
# Idempotent — safe to re-run (on install, and on every reconcile pass
# after workspace recreation).
set -euo pipefail

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
AW_BIN_DIR="${AW_BIN_DIR:-/usr/local/bin}"

if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  echo "install_codex.sh: nvm not found at $NVM_DIR — the essentials app (a required dependency) should have installed it" >&2
  exit 1
fi
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh"
nvm use default >/dev/null

if [ -x "$AW_BIN_DIR/codex" ] && "$AW_BIN_DIR/codex" --version >/dev/null 2>&1; then
  echo "codex already installed: $("$AW_BIN_DIR/codex" --version)"
  exit 0
fi

# --cache points this npm call at a throwaway dir instead of the shared
# ~/.npm cache: a pre-existing, unrelated root-owned-file corruption in that
# shared cache made this npm install fail with EACCES (confirmed live on
# fredericowu's workspace, 2026-11-11).
codex_scratch_cache="$(mktemp -d)"
npm install -g @openai/codex --cache "$codex_scratch_cache" >/dev/null
rm -rf "$codex_scratch_cache"

NODE_BIN_DIR="$(dirname "$(nvm which default)")"
sudo ln -sf "$NODE_BIN_DIR/codex" "$AW_BIN_DIR/codex"

"$AW_BIN_DIR/codex" --version
