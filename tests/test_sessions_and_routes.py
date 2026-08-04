"""End-to-end test of sessions.py + routes.py against a real FastAPI
TestClient, with ``ctx.db`` faked by an in-memory sqlite3 connection (same
pattern as aw-app-presentations' test_storage_and_routes.py) and on-disk
discovery monkeypatched so this doesn't depend on real CLI session files
being present on the test machine.

Run: .venv/aw/bin/python -m pytest tests/test_sessions_and_routes.py
"""
from __future__ import annotations

import sqlite3
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from code_agent_clis_app import routes as routes_mod  # noqa: E402
from code_agent_clis_app import sessions as sessions_mod  # noqa: E402
from code_agent_clis_app.sessions import SessionStore  # noqa: E402


class FakeDb:
    def __init__(self):
        self.conn = sqlite3.connect(":memory:", check_same_thread=False)
        self.conn.row_factory = sqlite3.Row

    def create(self, name, columns_sql):
        # Real DbTables._qualified() double-quotes the table name (see
        # aw-workspace's src/apps/db_tables.py) — table names carry the
        # app id, which may contain hyphens (e.g. "app__code-agent-clis__
        # sessions"), invalid as a bare sqlite/postgres identifier. Mirror
        # that quoting here so this fake matches the real backend.
        self.conn.execute(f'CREATE TABLE IF NOT EXISTS "{name}" ({columns_sql})')
        self.conn.commit()
        return name

    def execute(self, name, sql, params=None):
        stmt = sql.replace("{table}", f'"{name}"')
        cur = self.conn.execute(stmt, params or {})
        self.conn.commit()
        if stmt.strip().lower().startswith("select"):
            return [_Row(dict(r)) for r in cur.fetchall()]
        return cur


class _Row:
    """Mimics SQLAlchemy Row's ``._mapping`` access used by sessions.py."""

    def __init__(self, d):
        self._mapping = d


class FakeCtx:
    def __init__(self):
        self.db = FakeDb()


FAKE_CLAUDE_SESSIONS = [
    {"session_id": "aaa-1", "name": "fix the bug", "created_at": 100.0, "updated_at": 300.0},
    {"session_id": "bbb-2", "name": "add feature", "created_at": 100.0, "updated_at": 200.0},
]


@pytest.fixture(autouse=True)
def fake_discovery(monkeypatch):
    monkeypatch.setitem(sessions_mod._DISCOVER, "claude", lambda: list(FAKE_CLAUDE_SESSIONS))
    monkeypatch.setitem(sessions_mod._DISCOVER, "codex", lambda: [])


@pytest.fixture
def store():
    return SessionStore(FakeCtx())


@pytest.fixture
def client(store):
    app = routes_mod.build_routes(store)
    return TestClient(app)


def test_list_sessions_sorted_by_updated_at_desc(client):
    resp = client.get("/agent-sessions", params={"type": "claude"})
    assert resp.status_code == 200
    ids = [s["session_id"] for s in resp.json()]
    assert ids == ["aaa-1", "bbb-2"]


def test_list_sessions_unknown_type_returns_empty(client):
    resp = client.get("/agent-sessions", params={"type": "gemini"})
    assert resp.status_code == 200
    assert resp.json() == []


def test_hide_session_removes_it_from_listing(client):
    resp = client.delete("/agent-sessions/aaa-1", params={"type": "claude"})
    assert resp.status_code == 200
    assert resp.json() == {"success": True, "id": "aaa-1", "visible": False}

    remaining = client.get("/agent-sessions", params={"type": "claude"}).json()
    assert [s["session_id"] for s in remaining] == ["bbb-2"]


def test_restore_hidden_session_brings_it_back(client):
    client.delete("/agent-sessions/aaa-1", params={"type": "claude"})
    resp = client.delete("/agent-sessions/aaa-1", params={"type": "claude", "restore": 1})
    assert resp.json()["visible"] is True

    remaining = client.get("/agent-sessions", params={"type": "claude"}).json()
    assert {s["session_id"] for s in remaining} == {"aaa-1", "bbb-2"}


def test_hidden_session_scoped_per_type(store):
    # Hiding "aaa-1" under claude must not affect a same-id session of another type.
    store.hide_session("claude", "aaa-1")
    sessions_mod._DISCOVER["codex"] = lambda: [
        {"session_id": "aaa-1", "name": None, "created_at": 1.0, "updated_at": 1.0},
    ]
    assert [s["session_id"] for s in store.list_sessions("codex")] == ["aaa-1"]
