#!/usr/bin/env bash
# Redirects a CLI's config/credential path (normally under the real $HOME,
# which is NOT host-mounted — only $AW_WORKSPACE_CONTAINER_DIR is, see
# aw-remote-host's bootstrap/workspace/install.sh) into a symlink pointing at
# AW_WORKSPACE_HOME, which DOES survive a container recreate/update. Without
# this, `claude login` (and codex's/copilot's own login) has to be redone
# after every workspace update — found 2026-08-04 chasing exactly that
# complaint. Mirrors the pattern install_cursor.sh already uses (HOME=
# redirected to $AW_WORKSPACE_HOME/cursor-agent for its OWN installer) —
# applied here to the OTHER three CLIs, which run directly against the
# terminal's real $HOME instead of a redirected one at install time, so a
# post-hoc symlink swap is the only thing that works for them.
#
# Usage: persist_home.sh <relative-path-under-HOME> <file|dir>
#   e.g. persist_home.sh .claude dir
#        persist_home.sh .claude.json file
#
# Idempotent — safe to call on every boot (the reconciler re-runs activate()
# every time, per plugin.py's docstring).
set -euo pipefail

rel="${1:?usage: persist_home.sh <relative-path-under-HOME> <file|dir>}"
kind="${2:?usage: persist_home.sh <relative-path-under-HOME> <file|dir>}"
AW_HOME="${AW_WORKSPACE_HOME:-$HOME/.aw-workspace}"
persist_dir="$AW_HOME/cli-homes"
mkdir -p "$persist_dir"

live="$HOME/$rel"
target="$persist_dir/$rel"

if [ -L "$live" ]; then
  # Already a symlink from a prior boot. If it's pointing anywhere else
  # (path layout changed under us), fix it; otherwise nothing to do.
  current="$(readlink "$live")"
  if [ "$current" != "$target" ]; then
    rm -f "$live"
    ln -s "$target" "$live"
  fi
  exit 0
fi

mkdir -p "$(dirname "$target")"
if [ -e "$live" ]; then
  if [ -e "$target" ]; then
    # A persisted copy from a previous boot already exists — the live one is
    # freshly created THIS boot (container recreate wiped $HOME), so it's
    # safe to discard in favor of the durable copy.
    rm -rf "$live"
  else
    # First time this path is being persisted — move today's content over.
    mv "$live" "$target"
  fi
else
  # Neither exists yet (e.g. the CLI hasn't been logged into at all) —
  # pre-create an empty target so the symlink has somewhere real to land.
  if [ "$kind" = "dir" ]; then
    mkdir -p "$target"
  else
    : > "$target"
  fi
fi

ln -s "$target" "$live"
