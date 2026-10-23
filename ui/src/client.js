// Framework-free client core (same shape as aw-app-template's client.js) —
// talks to this app's own /agent-sessions endpoints (routes.py).
//
//   apiUrl:    (sub) => string   e.g. sub="/agent-sessions" -> ".../api/apps/code-agent-clis/agent-sessions"
//   fetchImpl: (path, init) => Promise<Response>

export function createClient({ apiUrl, fetchImpl = fetch }) {
  // No-arg call keeps the legacy bare-array contract (TerminalWindow.jsx,
  // MobileApp.jsx both still fetch this way). Passing { limit, before }
  // opts into the paginated envelope { sessions, total, has_more } instead
  // — the backend only resolves names for the requested page then.
  async function listSessions(type, { limit, before } = {}) {
    let qs = `type=${encodeURIComponent(type)}`;
    if (limit != null) qs += `&limit=${encodeURIComponent(limit)}`;
    if (before != null) qs += `&before=${encodeURIComponent(before)}`;
    const res = await fetchImpl(apiUrl(`/agent-sessions?${qs}`));
    if (!res.ok) throw new Error(`GET /agent-sessions -> ${res.status}`);
    const data = await res.json();
    if (limit == null) return Array.isArray(data) ? data : [];
    return {
      sessions: Array.isArray(data?.sessions) ? data.sessions : [],
      total: typeof data?.total === 'number' ? data.total : 0,
      hasMore: !!data?.has_more,
    };
  }

  async function hideSession(type, sessionId, { restore = false } = {}) {
    const qs = `type=${encodeURIComponent(type)}${restore ? '&restore=1' : ''}`;
    const res = await fetchImpl(apiUrl(`/agent-sessions/${encodeURIComponent(sessionId)}?${qs}`), {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`DELETE /agent-sessions/${sessionId} -> ${res.status}`);
    return res.json();
  }

  return { listSessions, hideSession };
}
