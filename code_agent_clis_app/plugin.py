"""
Entrypoint referenced by aw-app.json's runtime.entrypoint
("code_agent_clis_app.plugin:CodeAgentClisAppPlugin").

Plugs into the real F4 framework runtime: activate(ctx) (1) installs each
declared system CLI THROUGH the gated ``ctx.commands`` facade (capability
``commands:install``), so every install is journaled and the framework
reverts them on uninstall by replaying the journal (running
scripts/uninstall.sh once), and (2) registers the agent-session-history
sub-app (``routes.py``, backed by ``sessions.py``'s ``ctx.db`` overlay)
THROUGH the gated ``ctx.routes``/``ctx.db`` facades, mounted by the runtime
at ``/api/apps/code-agent-clis``. The install scripts are idempotent, so the
reconciler safely re-runs activate on every boot / workspace recreation.

Three of the four CLIs (claude, codex, copilot) are npm packages installed
through the shared Node.js toolkit the "essentials" app owns — declared as
a required dependency in aw-app.json, so the reconciler installs/loads
essentials before this app. cursor-agent ships via its own vendor
installer and needs no Node.js.
"""

from __future__ import annotations

import json
import logging
import os

from . import routes as routes_mod
from .sessions import SessionStore

log = logging.getLogger("aw_apps.code_agent_clis")


class CodeAgentClisAppPlugin:
    async def activate(self, ctx) -> None:
        with open(os.path.join(ctx.package_dir, "aw-app.json"), encoding="utf-8") as f:
            manifest = json.load(f)

        clis = manifest.get("contributes", {}).get("system_clis", [])
        installed = []
        for cli in clis:
            ctx.commands.install_system_cli(
                cli["name"], cli["installer"], uninstall="scripts/uninstall.sh"
            )
            installed.append(cli["name"])

        store = SessionStore(ctx)
        ctx.routes.register(routes_mod.build_routes(store))

        log.info("aw-app-code-agent-clis activated: installed %s, routes mounted", installed)

    async def deactivate(self) -> None:
        # Revert is driven by the framework's journal reverse-replay (it runs
        # scripts/uninstall.sh once on uninstall) — nothing to undo here.
        log.info("aw-app-code-agent-clis deactivated")
