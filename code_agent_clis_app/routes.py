"""code-agent-clis's mode-agnostic FastAPI sub-app (same dual-mode shape as
aw-app-template — see ``docs/knowledge_base/docs/architecture/
adr-app-front-back-routes-dual-mode.md``), mounted by ``ctx.routes.register``
at ``/api/apps/code-agent-clis``.

Replaces the aw-workspace core stub that used to live at
``/api/v2/agent-sessions`` (always returned ``[]`` — see MIGRATION.md and the
2026-08-03 decision to decouple Terminals+AgentsNav's session-history piece
out of core into this app, which is the one that actually installs the CLIs
and therefore is the one that can discover their on-disk sessions).

  GET    /agent-sessions?type=<claude|codex|copilot|cursor>
  DELETE /agent-sessions/{session_id}?type=<...>&restore=<0|1>   (soft delete)
"""

from __future__ import annotations

from fastapi import FastAPI, Query

from .sessions import AGENT_TYPES, SessionStore


def build_routes(store: SessionStore) -> FastAPI:
    app = FastAPI(title="code-agent-clis")

    @app.get("/agent-sessions")
    async def list_agent_sessions(type: str = Query(...)) -> list[dict]:
        if type not in AGENT_TYPES:
            return []
        return store.list_sessions(type)

    @app.delete("/agent-sessions/{session_id}")
    async def hide_agent_session(session_id: str, type: str = Query(...),
                                  restore: int = Query(0)) -> dict:
        store.hide_session(type, session_id, restore=bool(restore))
        return {"success": True, "id": session_id, "visible": bool(restore)}

    return app
