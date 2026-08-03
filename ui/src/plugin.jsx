// Integrated-mode entrypoint — dynamic-imported by aw-workspace-ui's
// loadComponentPlugin() (src/apps/loadPlugin.js) once this app is installed
// with "ui:code" granted. Built by `npm run build` -> ui/dist/code-agent-clis.js,
// referenced from aw-app.json's contributes.frontend.bundle.
//
// register(host) is the ONE required export. `host` is the APP-SCOPED handle
// from aw-workspace-ui's hostForApp() (src/apps/pluginHost.js) — host.React /
// host.h are the shared instances (never import your own React), host.app.*
// are this app's own `/api/apps/code-agent-clis/...` helpers, host.registerSlot
// is how this fills the `core.nav` slot aw-workspace-ui renders (see App.jsx).
//
// JSX in this file compiles to host.h(...)/host.React.Fragment calls, not
// react's own createElement — see vite.config.js's esbuild.jsxFactory. Every
// component below is a plain function DECLARED INSIDE register(host) so it
// closes over `host` without importing react itself (ADR "one shared React
// instance" — external: ['react','react-dom'] in vite.config.js).
//
// This ports aw-workspace-ui's src/components/AgentsNav.jsx (the "Agents" nav
// menu: launch/resume a claude/codex/copilot/cursor session, or a plain
// terminal) into this app, per the 2026-08-03 decision to decouple it out of
// core — see docs/knowledge_base/docs/architecture/monolith-migration-roadmap.md.
// The plain-terminal PTY shell (TerminalWindow chrome, /ws/terminal/*) stays
// core: this component only owns the AGENT-CLI-specific menu/session-picker,
// driving terminal creation/toggling through the same callback props
// aw-workspace-ui's App.jsx already threads to this slot (onCreateAgent,
// onCreateTerminal, onToggleAgent, onToggleTerminal, onCloseTerminal) — no new
// host capability was needed since AppSlot already forwards arbitrary `props`
// to whatever fills the slot.

import { createClient } from './client.js';

const SLUG = 'code-agent-clis'; // must match aw-app.json's "id"

// The CLI types this app installs and can discover on-disk sessions for
// (routes.py/sessions.py AGENT_TYPES) — kept in sync manually; gemini isn't
// one of them (this app never installed/managed a gemini CLI).
const AGENT_TYPES_WITH_SESSIONS = new Set(['claude', 'codex', 'copilot', 'cursor']);

export function register(host) {
  const client = createClient({
    apiUrl: host.app.apiUrl,
    fetchImpl: host.app.fetch,
  });

  const { useState, useRef, useCallback, useEffect } = host.React;
  const { createPortal } = host.ReactDOM;

  const ICONS = {
    bolt: (color) => (
      <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor" style={{ color }}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z" />
      </svg>
    ),
    copilot: (color) => (
      <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor" style={{ color }}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
      </svg>
    ),
    cursor: (color) => (
      <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor" style={{ color }}>
        <path d="M4 0l16 12.279-6.985 1.205 2.854 10.516L4 0z" />
      </svg>
    ),
    codex: (color) => (
      <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color }}>
        <path d="M12 3l7.5 4.25v8.5L12 20l-7.5-4.25v-8.5L12 3z" />
        <path d="M8.5 9.5L12 7.5l3.5 2v5L12 16.5l-3.5-2v-5z" />
      </svg>
    ),
    terminal: () => (
      <svg className="w-3 h-3 shrink-0 text-[var(--color-accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    ),
  };

  function AgentIcon({ iconName, color }) {
    const render = ICONS[iconName];
    if (render) return render(color);
    return (
      <span
        className="w-3 h-3 shrink-0 rounded-sm text-[8px] font-bold flex items-center justify-center leading-none"
        style={{ backgroundColor: color || '#888', color: '#fff' }}
      >
        {(iconName || '?')[0].toUpperCase()}
      </span>
    );
  }

  function LauncherRow({
    launcher,
    terminals,
    runningAgentSessionMap,
    liveAgentSessions,
    onLaunch,
    onResume,
    onOpenRunningAgentSession,
    onOpenRunningTerminal,
    onCloseRunningTerminal,
    onFlyoutEnter,
    onFlyoutLeave,
  }) {
    const [flyoutOpen, setFlyoutOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const [sessions, setSessions] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const rowRef = useRef(null);
    const closeTimer = useRef(null);
    const reportedOpenRef = useRef(false);

    const isTerminalLauncher = launcher.key === 'terminal';
    const hasSessions = AGENT_TYPES_WITH_SESSIONS.has(launcher.key);
    const supportsFlyout = isTerminalLauncher || hasSessions;

    const flyoutOpenRef = useRef(false);

    const reportOpen = useCallback(() => {
      if (reportedOpenRef.current) return;
      reportedOpenRef.current = true;
      onFlyoutEnter?.();
    }, [onFlyoutEnter]);

    const reportClose = useCallback(() => {
      if (!reportedOpenRef.current) return;
      reportedOpenRef.current = false;
      onFlyoutLeave?.();
    }, [onFlyoutLeave]);

    const cancelClose = useCallback(() => {
      clearTimeout(closeTimer.current);
    }, []);

    const scheduleClose = useCallback(() => {
      cancelClose();
      closeTimer.current = setTimeout(() => {
        flyoutOpenRef.current = false;
        setFlyoutOpen(false);
        reportClose();
      }, 150);
    }, [cancelClose, reportClose]);

    useEffect(() => () => {
      clearTimeout(closeTimer.current);
      reportClose();
    }, [reportClose]);

    const closeFlyout = useCallback(() => {
      cancelClose();
      flyoutOpenRef.current = false;
      setFlyoutOpen(false);
      reportClose();
    }, [cancelClose, reportClose]);

    const openFlyout = useCallback(() => {
      if (!supportsFlyout) return;
      cancelClose();
      const rect = rowRef.current?.getBoundingClientRect();
      if (rect) setPos({ top: rect.top, left: rect.right + 4 });
      flyoutOpenRef.current = true;
      setFlyoutOpen(true);
      reportOpen();
      // Re-fetch every time the flyout opens — this app has no WS push (that
      // was monolith-only PromptDetector plumbing); a plain poll-on-open keeps
      // this simple and correct enough for a picker menu.
      if (!isTerminalLauncher && !loading) {
        setLoading(true);
        setError(null);
        client.listSessions(launcher.key)
          .then((list) => setSessions(list))
          .catch((e) => setError(e.message || 'Failed to load'))
          .finally(() => setLoading(false));
      }
    }, [supportsFlyout, cancelClose, reportOpen, isTerminalLauncher, loading]); // eslint-disable-line react-hooks/exhaustive-deps

    const sortedTerminals = [...(terminals || [])].sort((a, b) => {
      const aName = (a.name || '').toLowerCase();
      const bName = (b.name || '').toLowerCase();
      return aName.localeCompare(bName);
    });

    // Live terminals whose agent_session_id isn't discovered on disk yet
    // (e.g. right after launch, before the CLI has written its session file).
    const knownSessionIds = new Set((sessions || []).map(s => s.session_id));
    const undetectedLive = (liveAgentSessions || []).filter(s =>
      s.type === launcher.key && s.alive &&
      (!s.agent_session_id || !knownSessionIds.has(s.agent_session_id))
    );

    const sortedSessions = [...(sessions || [])].sort((a, b) => {
      const aRunning = !!runningAgentSessionMap[`${launcher.key}:${a.session_id}`];
      const bRunning = !!runningAgentSessionMap[`${launcher.key}:${b.session_id}`];
      if (aRunning !== bRunning) return aRunning ? -1 : 1;

      const aTs = (a.updated_at || a.created_at || 0) * 1000;
      const bTs = (b.updated_at || b.created_at || 0) * 1000;
      if (aTs !== bTs) return bTs - aTs;

      const aName = (a.name || '(untitled)').toLowerCase();
      const bName = (b.name || '(untitled)').toLowerCase();
      return aName.localeCompare(bName);
    });

    return (
      <>
        <button
          ref={rowRef}
          onMouseEnter={openFlyout}
          onMouseLeave={scheduleClose}
          onClick={(e) => {
            e.stopPropagation();
            closeFlyout();
            onLaunch();
          }}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/[0.06] cursor-pointer text-left"
        >
          <AgentIcon iconName={launcher.icon} color={launcher.color} />
          <span className="flex-1 text-[13px] text-[var(--color-text-primary)]">{launcher.label}</span>
          {supportsFlyout ? (
            <svg className="w-3 h-3 text-[var(--color-text-muted)] opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 6l6 6-6 6" />
            </svg>
          ) : (
            <svg className="w-3 h-3 text-[var(--color-accent)] opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          )}
        </button>

        {flyoutOpen && supportsFlyout && createPortal(
          <div
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            className="fixed bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-2xl shadow-black/60"
            style={{
              top: pos.top - 5,
              left: pos.left,
              zIndex: 99999,
              width: 320,
              maxHeight: '70vh',
              overflowY: 'auto',
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeFlyout();
                onLaunch();
              }}
              title={isTerminalLauncher ? 'New terminal' : 'New session'}
              aria-label={isTerminalLauncher ? 'Start new terminal' : `Start new ${launcher.label} session`}
              className="w-full text-left px-3 py-2 text-xs text-[var(--color-accent)] hover:bg-white/5 border-b border-[var(--color-border)] flex items-center gap-1.5"
            >
              <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
              <span className="font-medium">{isTerminalLauncher ? 'New Terminal' : 'New Session'}</span>
              <span className="ml-auto text-[10px] text-[var(--color-text-muted)]">
                {isTerminalLauncher ? (terminals?.length || 0) : (sessions?.length || 0)}
              </span>
            </button>

            {isTerminalLauncher ? (
              <>
                {!terminals || terminals.length === 0 ? (
                  <div className="px-3 py-3 text-xs text-[var(--color-text-muted)]">No running terminals.</div>
                ) : (
                  sortedTerminals.map((t) => (
                    <div
                      key={t.id}
                      className="group relative w-full hover:bg-white/5 transition-colors border-b border-[var(--color-border)] last:border-0"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          closeFlyout();
                          onOpenRunningTerminal(t.id);
                        }}
                        className="w-full text-left px-3 py-2 pr-9"
                        title={`Open ${t.name}`}
                      >
                        <div className="text-xs font-medium text-[var(--color-text-primary)] truncate flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                          <span className="truncate">{t.name}</span>
                        </div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCloseRunningTerminal(t.id);
                        }}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--color-danger)]/20 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-opacity cursor-pointer"
                        title="Close terminal"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))
                )}
              </>
            ) : (
              <>
                {loading && (
                  <div className="px-3 py-3 text-xs text-[var(--color-text-muted)]">Loading…</div>
                )}
                {error && !loading && (
                  <div className="px-3 py-3 text-xs text-[var(--color-danger)]">Failed to load: {error}</div>
                )}
                {!loading && !error && sessions && sessions.length === 0 && undetectedLive.length === 0 && (
                  <div className="px-3 py-3 text-xs text-[var(--color-text-muted)]">No previous sessions for this project.</div>
                )}
                {undetectedLive.map((t) => (
                  <div
                    key={t.id}
                    className="group relative w-full hover:bg-white/5 transition-colors border-b border-[var(--color-border)] last:border-0"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeFlyout();
                        onOpenRunningAgentSession(t.id);
                      }}
                      className="w-full text-left px-3 py-2 pr-9"
                      title={`Open running session "${t.name}" (session ID not yet detected)`}
                    >
                      <div className="text-xs font-medium text-[var(--color-text-primary)] truncate flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        <span className="truncate">{t.name}</span>
                      </div>
                      <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">starting…</div>
                    </button>
                  </div>
                ))}
                {!loading && !error && sessions && sortedSessions.map((s) => {
                  const display = s.name || '(untitled)';
                  const idSlice = s.session_id ? `${s.session_id.slice(0, 8)}-${s.session_id.slice(9, 13)}…` : '';
                  let when = '';
                  const tsSrc = s.updated_at
                    ? new Date(s.updated_at * 1000)
                    : (s.created_at ? new Date(s.created_at * 1000) : null);
                  if (tsSrc && !isNaN(tsSrc)) {
                    when = `${tsSrc.toLocaleDateString()} ${tsSrc.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                  }
                  const sub = [idSlice, when].filter(Boolean).join(' · ');
                  const runningTerminalId = runningAgentSessionMap[`${launcher.key}:${s.session_id}`];
                  const hideSession = (e) => {
                    e.stopPropagation();
                    // Optimistic local removal; no WS push in this app yet, so
                    // the next flyout open is what re-syncs from the server.
                    setSessions((prev) => (prev || []).filter((x) => x.session_id !== s.session_id));
                    client.hideSession(launcher.key, s.session_id).catch(() => {});
                  };
                  return (
                    <div
                      key={s.session_id}
                      className="group relative w-full hover:bg-white/5 transition-colors border-b border-[var(--color-border)] last:border-0"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          closeFlyout();
                          if (runningTerminalId) {
                            onOpenRunningAgentSession(runningTerminalId);
                          } else {
                            onResume(launcher.key, s.session_id, display);
                          }
                        }}
                        className="w-full text-left px-3 py-2 pr-9"
                        title={`${runningTerminalId ? 'Open' : 'Resume'} "${display}" (${s.session_id})`}
                      >
                        <div className="text-xs font-medium text-[var(--color-text-primary)] truncate flex items-center gap-2">
                          {runningTerminalId && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                          )}
                          <span className="truncate">{display}</span>
                        </div>
                        <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5 truncate">{sub}</div>
                      </button>
                      <button
                        onClick={hideSession}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--color-danger)]/20 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-opacity cursor-pointer"
                        title="Hide from picker (transcript kept on disk)"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </div>,
          document.body
        )}
      </>
    );
  }

  function AgentsNavSlot({
    aiAgents,
    agentSessions,
    terminals,
    onCreateAgent,
    onCreateTerminal,
    onToggleAgent,
    onToggleTerminal,
    onCloseTerminal,
  }) {
    const [open, setOpen] = useState(false);
    const closeTimer = useRef(null);
    const flyoutCountRef = useRef(0);
    const mouseInsideRef = useRef(false);

    const scheduleClose = useCallback(() => {
      clearTimeout(closeTimer.current);
      closeTimer.current = setTimeout(() => {
        if (!mouseInsideRef.current && flyoutCountRef.current === 0) {
          setOpen(false);
        }
      }, 150);
    }, []);

    const handleEnter = useCallback(() => {
      mouseInsideRef.current = true;
      clearTimeout(closeTimer.current);
      setOpen(true);
    }, []);

    const handleLeave = useCallback(() => {
      mouseInsideRef.current = false;
      scheduleClose();
    }, [scheduleClose]);

    const onFlyoutEnter = useCallback(() => {
      flyoutCountRef.current += 1;
      clearTimeout(closeTimer.current);
    }, []);

    const onFlyoutLeave = useCallback(() => {
      flyoutCountRef.current = Math.max(0, flyoutCountRef.current - 1);
      if (flyoutCountRef.current === 0 && !mouseInsideRef.current) {
        scheduleClose();
      }
    }, [scheduleClose]);

    useEffect(() => () => clearTimeout(closeTimer.current), []);

    const totalCount = (agentSessions?.length || 0) + (terminals?.length || 0);

    const launchers = (() => {
      const list = (aiAgents || []).map((a) => ({
        key: a.type,
        label: a.type === 'terminal' ? 'Terminals' : (a.label || a.type),
        icon: a.icon,
        color: a.color,
        action: a.type === 'terminal'
          ? () => onCreateTerminal()
          : () => onCreateAgent(a.type),
      }));
      if (!list.some((o) => o.key === 'terminal')) {
        list.push({
          key: 'terminal',
          label: 'Terminals',
          icon: 'terminal',
          color: 'var(--color-accent)',
          action: () => onCreateTerminal(),
        });
      }
      return list;
    })();

    const agentLaunchers = launchers.filter((o) => o.key !== 'terminal');
    const terminalLauncher = launchers.find((o) => o.key === 'terminal');

    const runningAgentSessionMap = {};
    (agentSessions || []).forEach((s) => {
      if (s.type && s.agent_session_id) {
        runningAgentSessionMap[`${s.type}:${s.agent_session_id}`] = s.id;
      }
    });

    const sharedLauncherProps = {
      terminals,
      runningAgentSessionMap,
      liveAgentSessions: agentSessions,
      onOpenRunningAgentSession: (sessionId) => {
        setOpen(false);
        onToggleAgent(sessionId);
      },
      onOpenRunningTerminal: (sessionId) => {
        setOpen(false);
        onToggleTerminal(sessionId);
      },
      onCloseRunningTerminal: (sessionId) => {
        onCloseTerminal(sessionId);
      },
      onFlyoutEnter,
      onFlyoutLeave,
    };

    return (
      <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="px-3 py-1 text-xs rounded transition-colors cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5"
        >
          Agents
          {totalCount > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center min-w-[16px] h-[16px] rounded-full text-[9px] font-bold px-1 bg-[var(--color-accent)]/20 text-[var(--color-accent)]">
              {totalCount}
            </span>
          )}
        </button>

        {open && (
          <div
            className="absolute left-0 top-full mt-2 z-50 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-2xl p-2"
            style={{ minWidth: 280, maxWidth: 360 }}
          >
            {agentLaunchers.map((opt) => (
              <LauncherRow
                key={opt.key}
                launcher={opt}
                onLaunch={() => { setOpen(false); opt.action(); }}
                onResume={(type, sessionId, label) => {
                  setOpen(false);
                  onCreateAgent(type, sessionId, label);
                }}
                {...sharedLauncherProps}
              />
            ))}
            {terminalLauncher && (
              <>
                <div className="border-t border-[var(--color-border)] my-1" />
                <LauncherRow
                  key={terminalLauncher.key}
                  launcher={terminalLauncher}
                  onLaunch={() => { setOpen(false); terminalLauncher.action(); }}
                  onResume={(type, sessionId, label) => {
                    setOpen(false);
                    onCreateAgent(type, sessionId, label);
                  }}
                  {...sharedLauncherProps}
                />
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  host.registerSlot('core.nav', AgentsNavSlot);
}

export default register;
