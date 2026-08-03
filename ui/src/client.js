// Framework-free client core (same shape as aw-app-template's client.js) —
// talks to this app's own /agent-sessions endpoints (routes.py).
//
//   apiUrl:    (sub) => string   e.g. sub="/agent-sessions" -> ".../api/apps/code-agent-clis/agent-sessions"
//   fetchImpl: (path, init) => Promise<Response>

export function createClient({ apiUrl, fetchImpl = fetch }) {
  async function listSessions(type) {
    const res = await fetchImpl(apiUrl(`/agent-sessions?type=${encodeURIComponent(type)}`));
    if (!res.ok) throw new Error(`GET /agent-sessions -> ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
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
