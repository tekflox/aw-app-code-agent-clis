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
                         [&limit=<1-200>&before=<updated_at float>]
  DELETE /agent-sessions/{session_id}?type=<...>&restore=<0|1>   (soft delete)
  PUT    /agent-sessions/{session_id}?type=<...>   {name}        (rename override)

Without ``limit``, the response is the bare array it always was — a hard
back-compat constraint: ``aw-workspace-ui``'s ``TerminalWindow.jsx:750`` and
``MobileApp.jsx:1282`` both parse it as a plain list with no param. With
``limit``, the response is the envelope ``{sessions, total, has_more}``, and
only the requested page gets its (expensive, on-disk) name resolved — see
``sessions.py::SessionStore.list_sessions``.
"""

from __future__ import annotations

from fastapi import Body, FastAPI, Query

from .sessions import AGENT_TYPES, SessionStore


def build_routes(store: SessionStore) -> FastAPI:
    app = FastAPI(title="code-agent-clis")

    @app.get("/agent-sessions")
    async def list_agent_sessions(
        type: str = Query(...),
        limit: int | None = Query(None, ge=1, le=200),
        before: float | None = Query(None),
    ) -> list[dict] | dict:
        if type not in AGENT_TYPES:
            return [] if limit is None else {"sessions": [], "total": 0, "has_more": False}
        if limit is None:
            return store.list_sessions(type)
        sessions, total, has_more = store.list_sessions(type, limit=limit, before=before)
        return {"sessions": sessions, "total": total, "has_more": has_more}

    @app.delete("/agent-sessions/{session_id}")
    async def hide_agent_session(session_id: str, type: str = Query(...),
                                  restore: int = Query(0)) -> dict:
        store.hide_session(type, session_id, restore=bool(restore))
        return {"success": True, "id": session_id, "visible": bool(restore)}

    @app.put("/agent-sessions/{session_id}")
    async def rename_agent_session(session_id: str, type: str = Query(...),
                                    data: dict = Body(...)) -> dict:
        if type not in AGENT_TYPES:
            return {"success": False, "error": "unknown type"}
        name = (data.get("name") or "").strip()
        if not name:
            return {"success": False, "error": "name required"}
        store.rename_session(type, session_id, name)
        return {"success": True, "id": session_id, "name": name}

    return app
