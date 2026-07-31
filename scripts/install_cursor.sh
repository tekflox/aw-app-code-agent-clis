#!/usr/bin/env bash
# Installs cursor-agent via Cursor's official installer — not npm-published,
# unlike the other three CLIs this app installs. The installer is
# $HOME-aware and drops the binary at $HOME/.local/bin/cursor-agent (a
# symlink into a versioned $HOME/.local/share/cursor-agent/versions/<v>/),
# so $HOME is redirected to a dir under the workspace's persistent home
# (survives container recreation — same reasoning the aw-sandbox image's
# own cursor-agent install uses, see tools/aw-sandbox/Dockerfile in the
# main agentic-workspace repo) rather than the workspace's real $HOME.
# The resolved binary is then symlinked into the workspace's persistent bin
# dir (same tree the F4 command-shim facade uses — always on PATH).
# Idempotent — safe to re-run (on install, and on every reconcile pass
# after workspace recreation).
#
# `HOME=...` MUST be on the bash side of the pipe — `HOME=X curl | bash`
# only applies the env var to curl, while bash inherits the parent shell's
# HOME. `curl | HOME=X bash` is the correct form.
set -euo pipefail

AW_HOME="${AW_WORKSPACE_HOME:-$HOME/.aw-workspace}"
AW_BIN_DIR="$AW_HOME/bin"
CURSOR_HOME="$AW_HOME/cursor-agent"
mkdir -p "$AW_BIN_DIR" "$CURSOR_HOME"

if [ -x "$AW_BIN_DIR/cursor-agent" ] && "$AW_BIN_DIR/cursor-agent" --version >/dev/null 2>&1; then
  echo "cursor-agent already installed: $("$AW_BIN_DIR/cursor-agent" --version)"
  exit 0
fi

command -v curl >/dev/null 2>&1 || { echo "install_cursor.sh: curl not found on this system — unsupported base image" >&2; exit 1; }

curl -fsS https://cursor.com/install | HOME="$CURSOR_HOME" bash

ln -sf "$CURSOR_HOME/.local/bin/cursor-agent" "$AW_BIN_DIR/cursor-agent"

"$AW_BIN_DIR/cursor-agent" --version
