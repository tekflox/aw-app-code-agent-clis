#!/usr/bin/env bash
# Installs Google Antigravity CLI from Google's official native installer.
# The vendor binary is kept under AW_WORKSPACE_HOME so it survives workspace
# recreation, then exposed through the framework-owned system bin directory.
set -euo pipefail

AW_HOME="${AW_WORKSPACE_HOME:-$HOME/.aw-workspace}"
AW_BIN_DIR="${AW_BIN_DIR:-/usr/local/bin}"
ANTIGRAVITY_HOME="$AW_HOME/antigravity-cli"
ANTIGRAVITY_BIN="$ANTIGRAVITY_HOME/.local/bin/agy"
mkdir -p "$ANTIGRAVITY_HOME/.local/bin"

command -v curl >/dev/null 2>&1 || {
  echo "install_antigravity.sh: curl not found on this system — unsupported base image" >&2
  exit 1
}

if [ -x "$ANTIGRAVITY_BIN" ]; then
  # agy has an official update command; use it on every reconcile/reinstall so
  # an idempotent install does not pin the first downloaded version forever.
  HOME="$ANTIGRAVITY_HOME" "$ANTIGRAVITY_BIN" update >/dev/null
else
  curl -fsSL https://antigravity.google/cli/install.sh \
    | HOME="$ANTIGRAVITY_HOME" bash -s -- --dir "$ANTIGRAVITY_HOME/.local/bin"
fi

if [ -w "$AW_BIN_DIR" ]; then
  ln -sf "$ANTIGRAVITY_BIN" "$AW_BIN_DIR/agy"
else
  sudo ln -sf "$ANTIGRAVITY_BIN" "$AW_BIN_DIR/agy"
fi
HOME="$ANTIGRAVITY_HOME" "$AW_BIN_DIR/agy" --version
