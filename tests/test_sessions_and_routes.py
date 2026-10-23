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


def test_rename_overrides_the_transcript_derived_name(client):
    resp = client.put("/agent-sessions/aaa-1", params={"type": "claude"}, json={"name": "Rotacao de chaves"})
    assert resp.status_code == 200
    assert resp.json() == {"success": True, "id": "aaa-1", "name": "Rotacao de chaves"}

    sessions = client.get("/agent-sessions", params={"type": "claude"}).json()
    renamed = next(s for s in sessions if s["session_id"] == "aaa-1")
    assert renamed["name"] == "Rotacao de chaves"
    # The other session, never renamed, still shows its transcript-derived name.
    other = next(s for s in sessions if s["session_id"] == "bbb-2")
    assert other["name"] == "add feature"


def test_rename_survives_repeated_discovery_calls(client, store):
    # Regression for the reported bug: the transcript-derived name must not
    # win back the slot on a later re-fetch (e.g. the flyout re-opening).
    store.rename_session("claude", "aaa-1", "Rotacao de chaves")
    for _ in range(3):
        sessions = client.get("/agent-sessions", params={"type": "claude"}).json()
        renamed = next(s for s in sessions if s["session_id"] == "aaa-1")
        assert renamed["name"] == "Rotacao de chaves"


def test_rename_scoped_per_type(store):
    sessions_mod._DISCOVER["codex"] = lambda: [
        {"session_id": "aaa-1", "name": "codex transcript name", "created_at": 1.0, "updated_at": 1.0},
    ]
    store.rename_session("claude", "aaa-1", "Rotacao de chaves")
    assert store.list_sessions("claude")[0]["name"] == "Rotacao de chaves"
    assert store.list_sessions("codex")[0]["name"] == "codex transcript name"


def test_rename_unknown_type_rejected(client):
    resp = client.put("/agent-sessions/aaa-1", params={"type": "gemini"}, json={"name": "x"})
    assert resp.status_code == 200
    assert resp.json()["success"] is False


def test_rename_empty_name_rejected(client):
    resp = client.put("/agent-sessions/aaa-1", params={"type": "claude"}, json={"name": "   "})
    assert resp.status_code == 200
    assert resp.json()["success"] is False
    sessions = client.get("/agent-sessions", params={"type": "claude"}).json()
    renamed = next(s for s in sessions if s["session_id"] == "aaa-1")
    assert renamed["name"] == "fix the bug"


def test_rename_does_not_unhide_a_hidden_session(client):
    client.delete("/agent-sessions/aaa-1", params={"type": "claude"})
    client.put("/agent-sessions/aaa-1", params={"type": "claude"}, json={"name": "Rotacao de chaves"})
    remaining = client.get("/agent-sessions", params={"type": "claude"}).json()
    assert [s["session_id"] for s in remaining] == ["bbb-2"]


# --- pagination envelope (GET /agent-sessions?limit=...) ----------------
# Kanban card 4025bf3b-9510-8124-9a9c-f8bdb1f9ae47: without ``limit`` the
# response MUST stay the bare array above (byte-compatible with today's
# TerminalWindow.jsx/MobileApp.jsx callers) — ``limit`` opts into the new
# {sessions, total, has_more} envelope.

PAGINATION_SESSIONS = [
    {"session_id": f"s-{i}", "name": f"session {i}", "created_at": float(i), "updated_at": float(100 - i)}
    for i in range(10)
]


def test_no_limit_still_returns_a_bare_array(client):
    resp = client.get("/agent-sessions", params={"type": "claude"})
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_limit_returns_envelope_with_total_and_has_more(client, store, monkeypatch):
    monkeypatch.setitem(sessions_mod._DISCOVER, "claude", lambda: list(PAGINATION_SESSIONS))
    resp = client.get("/agent-sessions", params={"type": "claude", "limit": 3})
    assert resp.status_code == 200
    body = resp.json()
    assert set(body.keys()) == {"sessions", "total", "has_more"}
    assert body["total"] == 10
    assert body["has_more"] is True
    assert len(body["sessions"]) == 3
    # Sorted by updated_at desc: session 0 has the highest updated_at (100).
    assert [s["session_id"] for s in body["sessions"]] == ["s-0", "s-1", "s-2"]


def test_limit_last_page_has_more_false(client, monkeypatch):
    monkeypatch.setitem(sessions_mod._DISCOVER, "claude", lambda: list(PAGINATION_SESSIONS))
    resp = client.get("/agent-sessions", params={"type": "claude", "limit": 20})
    body = resp.json()
    assert body["total"] == 10
    assert body["has_more"] is False
    assert len(body["sessions"]) == 10


def test_before_cursor_pages_through_without_overlap(client, monkeypatch):
    monkeypatch.setitem(sessions_mod._DISCOVER, "claude", lambda: list(PAGINATION_SESSIONS))
    page1 = client.get("/agent-sessions", params={"type": "claude", "limit": 4}).json()
    assert [s["session_id"] for s in page1["sessions"]] == ["s-0", "s-1", "s-2", "s-3"]

    last_updated_at = page1["sessions"][-1]["updated_at"]
    page2 = client.get(
        "/agent-sessions",
        params={"type": "claude", "limit": 4, "before": last_updated_at},
    ).json()
    assert [s["session_id"] for s in page2["sessions"]] == ["s-4", "s-5", "s-6", "s-7"]
    assert page2["has_more"] is True

    page3 = client.get(
        "/agent-sessions",
        params={"type": "claude", "limit": 4, "before": page2["sessions"][-1]["updated_at"]},
    ).json()
    assert [s["session_id"] for s in page3["sessions"]] == ["s-8", "s-9"]
    assert page3["has_more"] is False


def test_hidden_sessions_are_dropped_before_slicing_not_after(client, store, monkeypatch):
    # Hiding one session must not shrink the page below `limit` just
    # because a hidden row would otherwise have occupied a slot in it.
    monkeypatch.setitem(sessions_mod._DISCOVER, "claude", lambda: list(PAGINATION_SESSIONS))
    store.hide_session("claude", "s-1")
    resp = client.get("/agent-sessions", params={"type": "claude", "limit": 3})
    body = resp.json()
    assert len(body["sessions"]) == 3
    assert "s-1" not in [s["session_id"] for s in body["sessions"]]
    assert body["total"] == 9


def test_override_name_wins_even_though_it_is_applied_after_slicing(client, store, monkeypatch):
    monkeypatch.setitem(sessions_mod._DISCOVER, "claude", lambda: list(PAGINATION_SESSIONS))
    store.rename_session("claude", "s-0", "Rotacao de chaves")
    resp = client.get("/agent-sessions", params={"type": "claude", "limit": 2})
    renamed = next(s for s in resp.json()["sessions"] if s["session_id"] == "s-0")
    assert renamed["name"] == "Rotacao de chaves"


def test_name_resolution_call_count_equals_page_size_not_total(store, monkeypatch):
    # The whole point of this fix: paginate the EXPENSIVE name resolution,
    # not just the response. A page of 3 must resolve exactly 3 names, even
    # when there are 10 claude sessions carrying a `path` to resolve from.
    discovered = [
        {"session_id": f"c-{i}", "name": None, "created_at": float(i),
         "updated_at": float(100 - i), "path": f"/fake/c-{i}.jsonl"}
        for i in range(10)
    ]
    monkeypatch.setitem(sessions_mod._DISCOVER, "claude", lambda: list(discovered))

    calls = []

    def fake_first_user_message(path, max_len=60):
        calls.append(path)
        return f"name for {path}"

    monkeypatch.setattr(sessions_mod, "_first_user_message", fake_first_user_message)
    sessions_mod._name_cache.clear()

    page, total, has_more = store.list_sessions("claude", limit=3)
    assert total == 10
    assert has_more is True
    assert len(calls) == 3
    assert len(page) == 3
