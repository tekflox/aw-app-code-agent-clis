# aw-app-code-agent-clis

AW workspace app that installs AI coding-agent CLIs into the workspace and
keeps them present across restarts. It has no login, settings, or secrets —
it follows the same pure command-install shape as
[`aw-app-essentials`](https://github.com/tekflox/aw-app-essentials), just for
a different set of tools. Category: **Runnables**.

## What it installs

- **[Claude Code](https://www.anthropic.com/claude-code)** (`claude`) — npm
  package `@anthropic-ai/claude-code`.
- **[OpenAI Codex CLI](https://developers.openai.com/codex/cli)** (`codex`) —
  npm package `@openai/codex`.
- **[GitHub Copilot CLI](https://github.com/github/copilot-cli)** (`copilot`)
  — npm package `@github/copilot`.
- **[Cursor's cursor-agent](https://cursor.com/cli)** (`cursor-agent`) —
  Cursor's own vendor installer (not npm-published).

Every install is idempotent — safe to re-run on every boot / workspace
recreation (the reconciler does exactly that).

**Not included:** logging each CLI in. After install, a user runs the CLI's
own auth flow from a workspace terminal (`claude login` / `codex login` /
`copilot` / `cursor-agent login`) — this app only makes the binaries present
and on `PATH`; API keys/OAuth are each vendor's own concern.

## Dependency: essentials

`claude`, `codex`, and `copilot` are npm packages, installed through the
shared Node.js dev toolkit (`nvm`/`node`/`npm`) that
[`aw-app-essentials`](https://github.com/tekflox/aw-app-essentials) owns.
`aw-app.json` declares `essentials` as a required `dependencies.apps` entry
— the aw-workspace reconciler installs/loads it first automatically (see
`aw-workspace`'s `aw-workspace-app-dependencies-enforced` note). `cursor-agent`
needs no Node.js — it ships as a standalone binary via its own installer.

## Layout

- `aw-app.json` — the manifest (id `code-agent-clis`, tier `inprocess`,
  `category: "Runnables"`), 4 `contributes.system_clis` entries, and the
  `essentials` app dependency. No `config_schema`/`routes`/`windows`/`nav`/
  `settings_panels` — this app contributes CLIs only.
- `schemas/aw-app.schema.json` — local structural validator (same manifest
  schema every `aw-app-*` repo validates against).
- `scripts/install_claude.sh` / `install_codex.sh` / `install_copilot.sh` —
  same shape: source the essentials app's `nvm`, `npm install -g <pkg>`,
  symlink the resulting binary into `/usr/local/bin` (regular system PATH —
  needs `sudo` since the container's default user is non-root).
- `scripts/install_cursor.sh` — Cursor's vendor installer, `$HOME` redirected
  to a dir under the workspace's persistent home (same reasoning
  `tools/aw-sandbox/Dockerfile` in the main `agentic-workspace` repo uses for
  its own `cursor-agent` install — the binary must land outside anything a
  bind-mount could shadow), then symlinked into `/usr/local/bin` the same way.
- `scripts/uninstall.sh` — reverses all 4 (npm uninstall + symlink/dir
  removal). Does **not** remove `nvm`/`node` — that belongs to `essentials`.
- `code_agent_clis_app/plugin.py` — `CodeAgentClisAppPlugin` entrypoint;
  `activate(ctx)` installs every CLI via `ctx.commands`. Revert is driven by
  the framework's journal reverse-replay (runs `scripts/uninstall.sh` once).
- `code_agent_clis_app/installer.py` — the same install logic as a plain
  subprocess-calling module (no framework `ctx` needed) — used by
  `tests/test_installer.py` and `tests/standalone_test.sh`.
- `tests/test_installer.py` — unit tests (subprocess mocked, no real
  installs) verifying every install function invokes the correct script path.
  Runs in CI on every push (see below).
- `tests/validate_manifest.py` — validates `aw-app.json` against the schema
  + checks every `system_clis` installer path exists on disk.
- `tests/standalone_test.sh` — installs all 4 CLIs for real and checks
  resolution (`which`) + version output; run inside the aw-workspace
  container with `essentials` already installed (not part of CI — needs
  npm/network).

## CI/CD

`tests/validate_manifest.py` and `tests/test_installer.py` both run in
`tekflox/aw-marketplace`'s shared `app-release.yml` reusable workflow on
every push to `master` — a failure stops the release **before** any version
bump, tag, or marketplace catalog sync happens.

## NOT done here (explicitly out of scope)

- No install into the production workspace by this repo's own CI — install/
  update happens from the AW Marketplace panel (or `aw-workspace marketplace
  install code-agent-clis`), after review.
- No frontend/settings UI — this app has none by design (pure command
  install, no config to expose).
- No auth/login automation for any of the four CLIs.
