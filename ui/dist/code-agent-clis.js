function se({ apiUrl: e, fetchImpl: S = fetch }) {
  async function x(s) {
    const f = await S(e(`/agent-sessions?type=${encodeURIComponent(s)}`));
    if (!f.ok) throw new Error(`GET /agent-sessions -> ${f.status}`);
    const T = await f.json();
    return Array.isArray(T) ? T : [];
  }
  async function m(s, f, { restore: T = !1 } = {}) {
    const U = `type=${encodeURIComponent(s)}${T ? "&restore=1" : ""}`, E = await S(e(`/agent-sessions/${encodeURIComponent(f)}?${U}`), {
      method: "DELETE"
    });
    if (!E.ok) throw new Error(`DELETE /agent-sessions/${f} -> ${E.status}`);
    return E.json();
  }
  return { listSessions: x, hideSession: m };
}
const le = /* @__PURE__ */ new Set(["claude", "codex", "copilot", "cursor"]);
function ce(e) {
  const S = se({
    apiUrl: e.app.apiUrl,
    fetchImpl: e.app.fetch
  }), { useState: x, useRef: m, useCallback: s, useEffect: f } = e.React, { createPortal: T } = e.ReactDOM, U = {
    bolt: (o) => /* @__PURE__ */ e.h("svg", { className: "w-3 h-3 shrink-0", viewBox: "0 0 24 24", fill: "currentColor", style: { color: o } }, /* @__PURE__ */ e.h("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z" })),
    copilot: (o) => /* @__PURE__ */ e.h("svg", { className: "w-3 h-3 shrink-0", viewBox: "0 0 24 24", fill: "currentColor", style: { color: o } }, /* @__PURE__ */ e.h("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" })),
    cursor: (o) => /* @__PURE__ */ e.h("svg", { className: "w-3 h-3 shrink-0", viewBox: "0 0 24 24", fill: "currentColor", style: { color: o } }, /* @__PURE__ */ e.h("path", { d: "M4 0l16 12.279-6.985 1.205 2.854 10.516L4 0z" })),
    codex: (o) => /* @__PURE__ */ e.h("svg", { className: "w-3 h-3 shrink-0", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", style: { color: o } }, /* @__PURE__ */ e.h("path", { d: "M12 3l7.5 4.25v8.5L12 20l-7.5-4.25v-8.5L12 3z" }), /* @__PURE__ */ e.h("path", { d: "M8.5 9.5L12 7.5l3.5 2v5L12 16.5l-3.5-2v-5z" })),
    terminal: () => /* @__PURE__ */ e.h("svg", { className: "w-3 h-3 shrink-0 text-[var(--color-accent)]", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("polyline", { points: "4 17 10 11 4 5" }), /* @__PURE__ */ e.h("line", { x1: "12", y1: "19", x2: "20", y2: "19" }))
  };
  function E({ iconName: o, color: l }) {
    const i = U[o];
    return i ? i(l) : /* @__PURE__ */ e.h(
      "span",
      {
        className: "w-3 h-3 shrink-0 rounded-sm text-[8px] font-bold flex items-center justify-center leading-none",
        style: { backgroundColor: l || "#888", color: "#fff" }
      },
      (o || "?")[0].toUpperCase()
    );
  }
  function J({
    launcher: o,
    terminals: l,
    runningAgentSessionMap: i,
    liveAgentSessions: O,
    onLaunch: B,
    onResume: A,
    onOpenRunningAgentSession: W,
    onOpenRunningTerminal: F,
    onCloseRunningTerminal: G,
    onFlyoutEnter: c,
    onFlyoutLeave: d
  }) {
    const [y, v] = x(!1), [b, Y] = x({ top: 0, left: 0 }), [u, D] = x(null), [h, I] = x(!1), [w, j] = x(null), k = m(null), $ = m(null), N = m(!1), r = o.key === "terminal", a = le.has(o.key), g = r || a, P = m(!1), K = s(() => {
      N.current || (N.current = !0, c == null || c());
    }, [c]), L = s(() => {
      N.current && (N.current = !1, d == null || d());
    }, [d]), C = s(() => {
      clearTimeout($.current);
    }, []), Q = s(() => {
      C(), $.current = setTimeout(() => {
        P.current = !1, v(!1), L();
      }, 150);
    }, [C, L]);
    f(() => () => {
      clearTimeout($.current), L();
    }, [L]);
    const z = s(() => {
      C(), P.current = !1, v(!1), L();
    }, [C, L]), ee = s(() => {
      var n;
      if (!g) return;
      C();
      const t = (n = k.current) == null ? void 0 : n.getBoundingClientRect();
      t && Y({ top: t.top, left: t.right + 4 }), P.current = !0, v(!0), K(), !r && !h && (I(!0), j(null), S.listSessions(o.key).then((p) => D(p)).catch((p) => j(p.message || "Failed to load")).finally(() => I(!1)));
    }, [g, C, K, r, h]), te = [...l || []].sort((t, n) => {
      const p = (t.name || "").toLowerCase(), R = (n.name || "").toLowerCase();
      return p.localeCompare(R);
    }), re = new Set((u || []).map((t) => t.session_id)), X = (O || []).filter(
      (t) => t.type === o.key && t.alive && (!t.agent_session_id || !re.has(t.agent_session_id))
    ), oe = [...u || []].sort((t, n) => {
      const p = !!i[`${o.key}:${t.session_id}`], R = !!i[`${o.key}:${n.session_id}`];
      if (p !== R) return p ? -1 : 1;
      const _ = (t.updated_at || t.created_at || 0) * 1e3, H = (n.updated_at || n.created_at || 0) * 1e3;
      if (_ !== H) return H - _;
      const M = (t.name || "(untitled)").toLowerCase(), q = (n.name || "(untitled)").toLowerCase();
      return M.localeCompare(q);
    });
    return /* @__PURE__ */ e.h(e.React.Fragment, null, /* @__PURE__ */ e.h(
      "button",
      {
        ref: k,
        onMouseEnter: ee,
        onMouseLeave: Q,
        onClick: (t) => {
          t.stopPropagation(), z(), B();
        },
        className: "w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/[0.06] cursor-pointer text-left"
      },
      /* @__PURE__ */ e.h(E, { iconName: o.icon, color: o.color }),
      /* @__PURE__ */ e.h("span", { className: "flex-1 text-[13px] text-[var(--color-text-primary)]" }, o.label),
      g ? /* @__PURE__ */ e.h("svg", { className: "w-3 h-3 text-[var(--color-text-muted)] opacity-60", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M9 6l6 6-6 6" })) : /* @__PURE__ */ e.h("svg", { className: "w-3 h-3 text-[var(--color-accent)] opacity-60", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M12 5v14M5 12h14" }))
    ), y && g && T(
      /* @__PURE__ */ e.h(
        "div",
        {
          onMouseEnter: C,
          onMouseLeave: Q,
          className: "fixed bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-2xl shadow-black/60",
          style: {
            top: b.top - 5,
            left: b.left,
            zIndex: 99999,
            width: 320,
            maxHeight: "70vh",
            overflowY: "auto"
          }
        },
        /* @__PURE__ */ e.h(
          "button",
          {
            onClick: (t) => {
              t.stopPropagation(), z(), B();
            },
            title: r ? "New terminal" : "New session",
            "aria-label": r ? "Start new terminal" : `Start new ${o.label} session`,
            className: "w-full text-left px-3 py-2 text-xs text-[var(--color-accent)] hover:bg-white/5 border-b border-[var(--color-border)] flex items-center gap-1.5"
          },
          /* @__PURE__ */ e.h("svg", { className: "w-3 h-3 shrink-0", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M12 5v14M5 12h14" })),
          /* @__PURE__ */ e.h("span", { className: "font-medium" }, r ? "New Terminal" : "New Session"),
          /* @__PURE__ */ e.h("span", { className: "ml-auto text-[10px] text-[var(--color-text-muted)]" }, r ? (l == null ? void 0 : l.length) || 0 : (u == null ? void 0 : u.length) || 0)
        ),
        r ? /* @__PURE__ */ e.h(e.React.Fragment, null, !l || l.length === 0 ? /* @__PURE__ */ e.h("div", { className: "px-3 py-3 text-xs text-[var(--color-text-muted)]" }, "No running terminals.") : te.map((t) => /* @__PURE__ */ e.h(
          "div",
          {
            key: t.id,
            className: "group relative w-full hover:bg-white/5 transition-colors border-b border-[var(--color-border)] last:border-0"
          },
          /* @__PURE__ */ e.h(
            "button",
            {
              onClick: (n) => {
                n.stopPropagation(), z(), F(t.id);
              },
              className: "w-full text-left px-3 py-2 pr-9",
              title: `Open ${t.name}`
            },
            /* @__PURE__ */ e.h("div", { className: "text-xs font-medium text-[var(--color-text-primary)] truncate flex items-center gap-2" }, /* @__PURE__ */ e.h("span", { className: "w-2 h-2 rounded-full bg-emerald-400 shrink-0" }), /* @__PURE__ */ e.h("span", { className: "truncate" }, t.name))
          ),
          /* @__PURE__ */ e.h(
            "button",
            {
              onClick: (n) => {
                n.stopPropagation(), G(t.id);
              },
              className: "absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--color-danger)]/20 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-opacity cursor-pointer",
              title: "Close terminal"
            },
            /* @__PURE__ */ e.h("svg", { className: "w-3 h-3", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M18 6L6 18M6 6l12 12" }))
          )
        ))) : /* @__PURE__ */ e.h(e.React.Fragment, null, h && /* @__PURE__ */ e.h("div", { className: "px-3 py-3 text-xs text-[var(--color-text-muted)]" }, "Loading…"), w && !h && /* @__PURE__ */ e.h("div", { className: "px-3 py-3 text-xs text-[var(--color-danger)]" }, "Failed to load: ", w), !h && !w && u && u.length === 0 && X.length === 0 && /* @__PURE__ */ e.h("div", { className: "px-3 py-3 text-xs text-[var(--color-text-muted)]" }, "No previous sessions for this project."), X.map((t) => /* @__PURE__ */ e.h(
          "div",
          {
            key: t.id,
            className: "group relative w-full hover:bg-white/5 transition-colors border-b border-[var(--color-border)] last:border-0"
          },
          /* @__PURE__ */ e.h(
            "button",
            {
              onClick: (n) => {
                n.stopPropagation(), z(), W(t.id);
              },
              className: "w-full text-left px-3 py-2 pr-9",
              title: `Open running session "${t.name}" (session ID not yet detected)`
            },
            /* @__PURE__ */ e.h("div", { className: "text-xs font-medium text-[var(--color-text-primary)] truncate flex items-center gap-2" }, /* @__PURE__ */ e.h("span", { className: "w-2 h-2 rounded-full bg-emerald-400 shrink-0" }), /* @__PURE__ */ e.h("span", { className: "truncate" }, t.name)),
            /* @__PURE__ */ e.h("div", { className: "text-[10px] text-[var(--color-text-muted)] mt-0.5" }, "starting…")
          )
        )), !h && !w && u && oe.map((t) => {
          const n = t.name || "(untitled)", p = t.session_id ? `${t.session_id.slice(0, 8)}-${t.session_id.slice(9, 13)}…` : "";
          let R = "";
          const _ = t.updated_at ? new Date(t.updated_at * 1e3) : t.created_at ? new Date(t.created_at * 1e3) : null;
          _ && !isNaN(_) && (R = `${_.toLocaleDateString()} ${_.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
          const H = [p, R].filter(Boolean).join(" · "), M = i[`${o.key}:${t.session_id}`], q = (V) => {
            V.stopPropagation(), D((ne) => (ne || []).filter((ae) => ae.session_id !== t.session_id)), S.hideSession(o.key, t.session_id).catch(() => {
            });
          };
          return /* @__PURE__ */ e.h(
            "div",
            {
              key: t.session_id,
              className: "group relative w-full hover:bg-white/5 transition-colors border-b border-[var(--color-border)] last:border-0"
            },
            /* @__PURE__ */ e.h(
              "button",
              {
                onClick: (V) => {
                  V.stopPropagation(), z(), M ? W(M) : A(o.key, t.session_id, n);
                },
                className: "w-full text-left px-3 py-2 pr-9",
                title: `${M ? "Open" : "Resume"} "${n}" (${t.session_id})`
              },
              /* @__PURE__ */ e.h("div", { className: "text-xs font-medium text-[var(--color-text-primary)] truncate flex items-center gap-2" }, M && /* @__PURE__ */ e.h("span", { className: "w-2 h-2 rounded-full bg-emerald-400 shrink-0" }), /* @__PURE__ */ e.h("span", { className: "truncate" }, n)),
              /* @__PURE__ */ e.h("div", { className: "text-[10px] text-[var(--color-text-muted)] mt-0.5 truncate" }, H)
            ),
            /* @__PURE__ */ e.h(
              "button",
              {
                onClick: q,
                className: "absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--color-danger)]/20 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-opacity cursor-pointer",
                title: "Hide from picker (transcript kept on disk)"
              },
              /* @__PURE__ */ e.h("svg", { className: "w-3 h-3", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("polyline", { points: "3 6 5 6 21 6" }), /* @__PURE__ */ e.h("path", { d: "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" }), /* @__PURE__ */ e.h("path", { d: "M10 11v6M14 11v6" }), /* @__PURE__ */ e.h("path", { d: "M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" }))
            )
          );
        }))
      ),
      document.body
    ));
  }
  function Z({
    aiAgents: o,
    agentSessions: l,
    terminals: i,
    onCreateAgent: O,
    onCreateTerminal: B,
    onToggleAgent: A,
    onToggleTerminal: W,
    onCloseTerminal: F
  }) {
    const [G, c] = x(!1), d = m(null), y = m(0), v = m(!1), b = s(() => {
      clearTimeout(d.current), d.current = setTimeout(() => {
        !v.current && y.current === 0 && c(!1);
      }, 150);
    }, []), Y = s(() => {
      v.current = !0, clearTimeout(d.current), c(!0);
    }, []), u = s(() => {
      v.current = !1, b();
    }, [b]), D = s(() => {
      y.current += 1, clearTimeout(d.current);
    }, []), h = s(() => {
      y.current = Math.max(0, y.current - 1), y.current === 0 && !v.current && b();
    }, [b]);
    f(() => () => clearTimeout(d.current), []);
    const I = ((l == null ? void 0 : l.length) || 0) + ((i == null ? void 0 : i.length) || 0), w = (() => {
      const r = (o || []).map((a) => ({
        key: a.type,
        label: a.type === "terminal" ? "Terminals" : a.label || a.type,
        icon: a.icon,
        color: a.color,
        action: a.type === "terminal" ? () => B() : () => O(a.type)
      }));
      return r.some((a) => a.key === "terminal") || r.push({
        key: "terminal",
        label: "Terminals",
        icon: "terminal",
        color: "var(--color-accent)",
        action: () => B()
      }), r;
    })(), j = w.filter((r) => r.key !== "terminal"), k = w.find((r) => r.key === "terminal"), $ = {};
    (l || []).forEach((r) => {
      r.type && r.agent_session_id && ($[`${r.type}:${r.agent_session_id}`] = r.id);
    });
    const N = {
      terminals: i,
      runningAgentSessionMap: $,
      liveAgentSessions: l,
      onOpenRunningAgentSession: (r) => {
        c(!1), A(r);
      },
      onOpenRunningTerminal: (r) => {
        c(!1), W(r);
      },
      onCloseRunningTerminal: (r) => {
        F(r);
      },
      onFlyoutEnter: D,
      onFlyoutLeave: h
    };
    return /* @__PURE__ */ e.h("div", { className: "relative", onMouseEnter: Y, onMouseLeave: u }, /* @__PURE__ */ e.h(
      "button",
      {
        onClick: () => c((r) => !r),
        className: "px-3 py-1 text-xs rounded transition-colors cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5"
      },
      "Agents",
      I > 0 && /* @__PURE__ */ e.h("span", { className: "ml-1.5 inline-flex items-center justify-center min-w-[16px] h-[16px] rounded-full text-[9px] font-bold px-1 bg-[var(--color-accent)]/20 text-[var(--color-accent)]" }, I)
    ), G && /* @__PURE__ */ e.h(
      "div",
      {
        className: "absolute left-0 top-full mt-2 z-50 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-2xl p-2",
        style: { minWidth: 280, maxWidth: 360 }
      },
      j.map((r) => /* @__PURE__ */ e.h(
        J,
        {
          key: r.key,
          launcher: r,
          onLaunch: () => {
            c(!1), r.action();
          },
          onResume: (a, g, P) => {
            c(!1), O(a, g, P);
          },
          ...N
        }
      )),
      k && /* @__PURE__ */ e.h(e.React.Fragment, null, /* @__PURE__ */ e.h("div", { className: "border-t border-[var(--color-border)] my-1" }), /* @__PURE__ */ e.h(
        J,
        {
          key: k.key,
          launcher: k,
          onLaunch: () => {
            c(!1), k.action();
          },
          onResume: (r, a, g) => {
            c(!1), O(r, a, g);
          },
          ...N
        }
      ))
    ));
  }
  e.registerSlot("core.nav", Z);
}
export {
  ce as default,
  ce as register
};
