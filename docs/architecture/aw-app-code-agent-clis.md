---
repo: architecture
path: docs/architecture/aw-app-code-agent-clis.md
source: generated
edited: false
checksum: sha256:90a511a2c9acc3f6c4d20aeb6985fa8748ce96b668edfe42fb5e1d8db1f797fa
---
# Code Agent CLIs

- **repo**: aw-app-code-agent-clis
- **layer**: app
- **technologies**: python, react
- **health** (derived): planned

Installs AI coding-agent CLIs into the workspace: Claude Code (claude), OpenAI Codex (codex), GitHub Copilot CLI (copilot), and Cursor's cursor-agent — each CLI still needs its own auth (e.g. `claude login`, `codex login`, `copilot`, `cursor-agent login`) run from a workspace terminal before use. Also owns the Agents nav menu (launch/resume sessions per CLI type) and the agent-session-history API/DB backing it — decoupled from aw-workspace core per the 2026-08-03 architecture decision.

## Connections
- `db` → **postgres** — app-owned tables in the workspace schema
- `http` → **aw-workspace** — routes mounted at /api/apps/code-agent-clis
- `other` → **aw-app-essentials** — claude/codex/copilot are npm-published packages, installed through the Node

## MCP tools
_none exposed_

## Requirements
_none documented_
