function he({ apiUrl: e, fetchImpl: R = fetch }) {
  async function f(s, { limit: N, before: E } = {}) {
    let T = `type=${encodeURIComponent(s)}`;
    N != null && (T += `&limit=${encodeURIComponent(N)}`), E != null && (T += `&before=${encodeURIComponent(E)}`);
    const C = await R(e(`/agent-sessions?${T}`));
    if (!C.ok) throw new Error(`GET /agent-sessions -> ${C.status}`);
    const l = await C.json();
    return N == null ? Array.isArray(l) ? l : [] : {
      sessions: Array.isArray(l == null ? void 0 : l.sessions) ? l.sessions : [],
      total: typeof (l == null ? void 0 : l.total) == "number" ? l.total : 0,
      hasMore: !!(l != null && l.has_more)
    };
  }
  async function k(s, N, { restore: E = !1 } = {}) {
    const T = `type=${encodeURIComponent(s)}${E ? "&restore=1" : ""}`, C = await R(e(`/agent-sessions/${encodeURIComponent(N)}?${T}`), {
      method: "DELETE"
    });
    if (!C.ok) throw new Error(`DELETE /agent-sessions/${N} -> ${C.status}`);
    return C.json();
  }
  return { listSessions: f, hideSession: k };
}
const ve = /* @__PURE__ */ new Set(["claude", "codex", "copilot", "cursor", "antigravity"]), se = {
  type: "antigravity",
  label: "Antigravity",
  command: "agy",
  color: "#4285f4",
  icon: "antigravity"
}, le = 50;
function ge(e) {
  const R = he({
    apiUrl: e.app.apiUrl,
    fetchImpl: e.sdk.api.fetch
  }), { useState: f, useRef: k, useCallback: s, useEffect: N } = e.React, { createPortal: E } = e.ReactDOM, T = {
    bolt: (o) => /* @__PURE__ */ e.h("svg", { className: "w-3 h-3 shrink-0", viewBox: "0 0 24 24", fill: "currentColor", style: { color: o } }, /* @__PURE__ */ e.h("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z" })),
    copilot: (o) => /* @__PURE__ */ e.h("svg", { className: "w-3 h-3 shrink-0", viewBox: "0 0 24 24", fill: "currentColor", style: { color: o } }, /* @__PURE__ */ e.h("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" })),
    cursor: (o) => /* @__PURE__ */ e.h("svg", { className: "w-3 h-3 shrink-0", viewBox: "0 0 24 24", fill: "currentColor", style: { color: o } }, /* @__PURE__ */ e.h("path", { d: "M4 0l16 12.279-6.985 1.205 2.854 10.516L4 0z" })),
    codex: (o) => /* @__PURE__ */ e.h("svg", { className: "w-3 h-3 shrink-0", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", style: { color: o } }, /* @__PURE__ */ e.h("path", { d: "M12 3l7.5 4.25v8.5L12 20l-7.5-4.25v-8.5L12 3z" }), /* @__PURE__ */ e.h("path", { d: "M8.5 9.5L12 7.5l3.5 2v5L12 16.5l-3.5-2v-5z" })),
    antigravity: () => /* @__PURE__ */ e.h("svg", { className: "w-3 h-3 shrink-0", viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true" }, /* @__PURE__ */ e.h("path", { d: "M12 2.5c.7 5.3 4.2 8.8 9.5 9.5-5.3.7-8.8 4.2-9.5 9.5-.7-5.3-4.2-8.8-9.5-9.5 5.3-.7 8.8-4.2 9.5-9.5Z", fill: "#4285F4" }), /* @__PURE__ */ e.h("path", { d: "M12 2.5c.7 5.3 4.2 8.8 9.5 9.5H12V2.5Z", fill: "#34A853" }), /* @__PURE__ */ e.h("path", { d: "M12 12h9.5c-5.3.7-8.8 4.2-9.5 9.5V12Z", fill: "#FBBC04" }), /* @__PURE__ */ e.h("path", { d: "M2.5 12H12v9.5c-.7-5.3-4.2-8.8-9.5-9.5Z", fill: "#EA4335" })),
    terminal: () => /* @__PURE__ */ e.h("svg", { className: "w-3 h-3 shrink-0 text-[var(--color-accent)]", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("polyline", { points: "4 17 10 11 4 5" }), /* @__PURE__ */ e.h("line", { x1: "12", y1: "19", x2: "20", y2: "19" }))
  };
  function C({ iconName: o, color: i }) {
    const x = T[o];
    return x ? x(i) : /* @__PURE__ */ e.h(
      "span",
      {
        className: "w-3 h-3 shrink-0 rounded-sm text-[8px] font-bold flex items-center justify-center leading-none",
        style: { backgroundColor: i || "#888", color: "#fff" }
      },
      (o || "?")[0].toUpperCase()
    );
  }
  function l({
    launcher: o,
    terminals: i,
    runningAgentSessionMap: x,
    liveAgentSessions: O,
    onLaunch: P,
    onResume: V,
    onOpenRunningAgentSession: D,
    onOpenRunningTerminal: Y,
    onCloseRunningTerminal: q,
    onFlyoutEnter: d,
    onFlyoutLeave: v
  }) {
    const [$, _] = f(!1), [S, J] = f({ top: 0, left: 0 }), [c, z] = f(null), [U, I] = f(0), [M, j] = f(!1), [h, H] = f(!1), [g, r] = f(!1), [p, a] = f(null), G = k(null), K = k(null), Z = k(!1), y = o.key === "terminal", ce = ve.has(o.key), F = y || ce, Q = k(!1), oe = s(() => {
      Z.current || (Z.current = !0, d == null || d());
    }, [d]), B = s(() => {
      Z.current && (Z.current = !1, v == null || v());
    }, [v]), L = s(() => {
      clearTimeout(K.current);
    }, []), ne = s(() => {
      L(), K.current = setTimeout(() => {
        Q.current = !1, _(!1), B();
      }, 150);
    }, [L, B]);
    N(() => () => {
      clearTimeout(K.current), B();
    }, [B]);
    const W = s(() => {
      L(), Q.current = !1, _(!1), B();
    }, [L, B]), de = s(() => {
      var n;
      if (!F) return;
      L();
      const t = (n = G.current) == null ? void 0 : n.getBoundingClientRect();
      t && J({ top: t.top, left: t.right + 4 }), Q.current = !0, _(!0), oe(), !y && !g && (r(!0), a(null), R.listSessions(o.key, { limit: le }).then(({ sessions: u, total: b, hasMore: m }) => {
        z(u), I(b), j(m);
      }).catch((u) => a(u.message || "Failed to load")).finally(() => r(!1)));
    }, [F, L, oe, y, g]), X = s(() => {
      if (h || !M || !c || c.length === 0) return;
      H(!0);
      const t = c[c.length - 1].updated_at;
      R.listSessions(o.key, { limit: le, before: t }).then(({ sessions: n, total: u, hasMore: b }) => {
        z((m) => {
          const A = new Set((m || []).map((w) => w.session_id));
          return [...m || [], ...n.filter((w) => !A.has(w.session_id))];
        }), I(u), j(b);
      }).catch(() => {
      }).finally(() => H(!1));
    }, [h, M, c, o.key]), ue = s((t) => {
      if (y || !M || h) return;
      const n = t.currentTarget;
      n.scrollHeight - n.scrollTop - n.clientHeight < 120 && X();
    }, [y, M, h, X]), pe = [...i || []].sort((t, n) => {
      const u = (t.name || "").toLowerCase(), b = (n.name || "").toLowerCase();
      return u.localeCompare(b);
    }), me = new Set((c || []).map((t) => t.session_id)), ae = (O || []).filter(
      (t) => t.type === o.key && t.alive && (!t.agent_session_id || !me.has(t.agent_session_id))
    ), fe = [...c || []].sort((t, n) => {
      const u = !!x[`${o.key}:${t.session_id}`], b = !!x[`${o.key}:${n.session_id}`];
      if (u !== b) return u ? -1 : 1;
      const m = (t.updated_at || t.created_at || 0) * 1e3, A = (n.updated_at || n.created_at || 0) * 1e3;
      if (m !== A) return A - m;
      const w = (t.name || "(untitled)").toLowerCase(), ee = (n.name || "(untitled)").toLowerCase();
      return w.localeCompare(ee);
    });
    return /* @__PURE__ */ e.h(e.React.Fragment, null, /* @__PURE__ */ e.h(
      "button",
      {
        ref: G,
        onMouseEnter: de,
        onMouseLeave: ne,
        onClick: (t) => {
          t.stopPropagation(), W(), P();
        },
        className: "w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/[0.06] cursor-pointer text-left"
      },
      /* @__PURE__ */ e.h(C, { iconName: o.icon, color: o.color }),
      /* @__PURE__ */ e.h("span", { className: "flex-1 text-[13px] text-[var(--color-text-primary)]" }, o.label),
      F ? /* @__PURE__ */ e.h("svg", { className: "w-3 h-3 text-[var(--color-text-muted)] opacity-60", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M9 6l6 6-6 6" })) : /* @__PURE__ */ e.h("svg", { className: "w-3 h-3 text-[var(--color-accent)] opacity-60", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M12 5v14M5 12h14" }))
    ), $ && F && E(
      /* @__PURE__ */ e.h(
        "div",
        {
          onMouseEnter: L,
          onMouseLeave: ne,
          onScroll: ue,
          className: "fixed bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-2xl shadow-black/60",
          style: {
            top: S.top - 5,
            left: S.left,
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
              t.stopPropagation(), W(), P();
            },
            title: y ? "New terminal" : "New session",
            "aria-label": y ? "Start new terminal" : `Start new ${o.label} session`,
            className: "w-full text-left px-3 py-2 text-xs text-[var(--color-accent)] hover:bg-white/5 border-b border-[var(--color-border)] flex items-center gap-1.5"
          },
          /* @__PURE__ */ e.h("svg", { className: "w-3 h-3 shrink-0", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M12 5v14M5 12h14" })),
          /* @__PURE__ */ e.h("span", { className: "font-medium" }, y ? "New Terminal" : "New Session"),
          /* @__PURE__ */ e.h("span", { className: "ml-auto text-[10px] text-[var(--color-text-muted)]" }, y ? (i == null ? void 0 : i.length) || 0 : U)
        ),
        y ? /* @__PURE__ */ e.h(e.React.Fragment, null, !i || i.length === 0 ? /* @__PURE__ */ e.h("div", { className: "px-3 py-3 text-xs text-[var(--color-text-muted)]" }, "No running terminals.") : pe.map((t) => /* @__PURE__ */ e.h(
          "div",
          {
            key: t.id,
            className: "group relative w-full hover:bg-white/5 transition-colors border-b border-[var(--color-border)] last:border-0"
          },
          /* @__PURE__ */ e.h(
            "button",
            {
              onClick: (n) => {
                n.stopPropagation(), W(), Y(t.id);
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
                n.stopPropagation(), q(t.id);
              },
              className: "absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--color-danger)]/20 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-opacity cursor-pointer",
              title: "Close terminal"
            },
            /* @__PURE__ */ e.h("svg", { className: "w-3 h-3", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M18 6L6 18M6 6l12 12" }))
          )
        ))) : /* @__PURE__ */ e.h(e.React.Fragment, null, g && /* @__PURE__ */ e.h("div", { className: "px-3 py-3 text-xs text-[var(--color-text-muted)]" }, "Loading…"), p && !g && /* @__PURE__ */ e.h("div", { className: "px-3 py-3 text-xs text-[var(--color-danger)]" }, "Failed to load: ", p), !g && !p && c && c.length === 0 && ae.length === 0 && /* @__PURE__ */ e.h("div", { className: "px-3 py-3 text-xs text-[var(--color-text-muted)]" }, "No previous sessions for this project."), ae.map((t) => /* @__PURE__ */ e.h(
          "div",
          {
            key: t.id,
            className: "group relative w-full hover:bg-white/5 transition-colors border-b border-[var(--color-border)] last:border-0"
          },
          /* @__PURE__ */ e.h(
            "button",
            {
              onClick: (n) => {
                n.stopPropagation(), W(), D(t.id);
              },
              className: "w-full text-left px-3 py-2 pr-9",
              title: `Open running session "${t.name}" (session ID not yet detected)`
            },
            /* @__PURE__ */ e.h("div", { className: "text-xs font-medium text-[var(--color-text-primary)] truncate flex items-center gap-2" }, /* @__PURE__ */ e.h("span", { className: "w-2 h-2 rounded-full bg-emerald-400 shrink-0" }), /* @__PURE__ */ e.h("span", { className: "truncate" }, t.name)),
            /* @__PURE__ */ e.h("div", { className: "text-[10px] text-[var(--color-text-muted)] mt-0.5" }, "starting…")
          )
        )), !g && !p && c && fe.map((t) => {
          const n = t.session_id ? `${t.session_id.slice(0, 8)}-${t.session_id.slice(9, 13)}…` : "", u = t.name || n || "(untitled)";
          let b = "";
          const m = t.updated_at ? new Date(t.updated_at * 1e3) : t.created_at ? new Date(t.created_at * 1e3) : null;
          m && !isNaN(m) && (b = `${m.toLocaleDateString()} ${m.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
          const A = [n, b].filter(Boolean).join(" · "), w = x[`${o.key}:${t.session_id}`], ee = (te) => {
            te.stopPropagation(), z((re) => (re || []).filter((xe) => xe.session_id !== t.session_id)), I((re) => Math.max(0, re - 1)), R.hideSession(o.key, t.session_id).catch(() => {
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
                onClick: (te) => {
                  te.stopPropagation(), W(), w ? D(w) : V(o.key, t.session_id, u);
                },
                className: "w-full text-left px-3 py-2 pr-9",
                title: `${w ? "Open" : "Resume"} "${u}" (${t.session_id})`
              },
              /* @__PURE__ */ e.h("div", { className: "text-xs font-medium text-[var(--color-text-primary)] truncate flex items-center gap-2" }, w && /* @__PURE__ */ e.h("span", { className: "w-2 h-2 rounded-full bg-emerald-400 shrink-0" }), /* @__PURE__ */ e.h("span", { className: "truncate" }, u)),
              /* @__PURE__ */ e.h("div", { className: "text-[10px] text-[var(--color-text-muted)] mt-0.5 truncate" }, A)
            ),
            /* @__PURE__ */ e.h(
              "button",
              {
                onClick: ee,
                className: "absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--color-danger)]/20 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-opacity cursor-pointer",
                title: "Hide from picker (transcript kept on disk)"
              },
              /* @__PURE__ */ e.h("svg", { className: "w-3 h-3", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("polyline", { points: "3 6 5 6 21 6" }), /* @__PURE__ */ e.h("path", { d: "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" }), /* @__PURE__ */ e.h("path", { d: "M10 11v6M14 11v6" }), /* @__PURE__ */ e.h("path", { d: "M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" }))
            )
          );
        }), !g && !p && M && // Terminal fallback row for when 50 rows don't overflow
        // the flyout's own scrollbar (no scroll event ever fires
        // then, so page 2 would otherwise be unreachable).
        /* @__PURE__ */ e.h(
          "button",
          {
            onClick: (t) => {
              t.stopPropagation(), X();
            },
            disabled: h,
            className: "w-full text-left px-3 py-2 text-xs text-[var(--color-text-muted)] hover:bg-white/5 disabled:opacity-60"
          },
          h ? "Loading…" : `Load more (${Math.max(0, U - ((c == null ? void 0 : c.length) || 0))} remaining)`
        ))
      ),
      document.body
    ));
  }
  function ie({
    aiAgents: o,
    agentSessions: i,
    terminals: x,
    onCreateAgent: O,
    onCreateTerminal: P,
    onToggleAgent: V,
    onToggleTerminal: D,
    onCloseTerminal: Y
  }) {
    const [q, d] = f(!1), v = k(null), $ = k(0), _ = k(!1), S = s(() => {
      clearTimeout(v.current), v.current = setTimeout(() => {
        !_.current && $.current === 0 && d(!1);
      }, 150);
    }, []), J = s(() => {
      _.current = !0, clearTimeout(v.current), d(!0);
    }, []), c = s(() => {
      _.current = !1, S();
    }, [S]), z = s(() => {
      $.current += 1, clearTimeout(v.current);
    }, []), U = s(() => {
      $.current = Math.max(0, $.current - 1), $.current === 0 && !_.current && S();
    }, [S]);
    N(() => () => clearTimeout(v.current), []);
    const I = ((i == null ? void 0 : i.length) || 0) + ((x == null ? void 0 : x.length) || 0), M = (() => {
      const r = [...o || []];
      r.some((a) => a.type === se.type) || r.push(se);
      const p = r.map((a) => ({
        key: a.type,
        label: a.type === "terminal" ? "Terminals" : a.label || a.type,
        icon: a.icon,
        color: a.color,
        action: a.type === "terminal" ? () => P() : () => O(a.type)
      }));
      return p.some((a) => a.key === "terminal") || p.push({
        key: "terminal",
        label: "Terminals",
        icon: "terminal",
        color: "var(--color-accent)",
        action: () => P()
      }), p;
    })(), j = M.filter((r) => r.key !== "terminal"), h = M.find((r) => r.key === "terminal"), H = {};
    (i || []).forEach((r) => {
      r.type && r.agent_session_id && (H[`${r.type}:${r.agent_session_id}`] = r.id);
    });
    const g = {
      terminals: x,
      runningAgentSessionMap: H,
      liveAgentSessions: i,
      onOpenRunningAgentSession: (r) => {
        d(!1), V(r);
      },
      onOpenRunningTerminal: (r) => {
        d(!1), D(r);
      },
      onCloseRunningTerminal: (r) => {
        Y(r);
      },
      onFlyoutEnter: z,
      onFlyoutLeave: U
    };
    return /* @__PURE__ */ e.h("div", { className: "relative", onMouseEnter: J, onMouseLeave: c }, /* @__PURE__ */ e.h(
      "button",
      {
        onClick: () => d((r) => !r),
        className: "px-3 py-1 text-xs rounded transition-colors cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5"
      },
      "Agents",
      I > 0 && /* @__PURE__ */ e.h("span", { className: "ml-1.5 inline-flex items-center justify-center min-w-[16px] h-[16px] rounded-full text-[9px] font-bold px-1 bg-[var(--color-accent)]/20 text-[var(--color-accent)]" }, I)
    ), q && /* @__PURE__ */ e.h(
      "div",
      {
        className: "absolute left-0 top-full mt-2 z-50 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-2xl p-2",
        style: { minWidth: 280, maxWidth: 360 }
      },
      j.map((r) => /* @__PURE__ */ e.h(
        l,
        {
          key: r.key,
          launcher: r,
          onLaunch: () => {
            d(!1), r.action();
          },
          onResume: (p, a, G) => {
            d(!1), O(p, a, G);
          },
          ...g
        }
      )),
      h && /* @__PURE__ */ e.h(e.React.Fragment, null, /* @__PURE__ */ e.h("div", { className: "border-t border-[var(--color-border)] my-1" }), /* @__PURE__ */ e.h(
        l,
        {
          key: h.key,
          launcher: h,
          onLaunch: () => {
            d(!1), h.action();
          },
          onResume: (r, p, a) => {
            d(!1), O(r, p, a);
          },
          ...g
        }
      ))
    ));
  }
  e.registerSlot("core.nav", ie);
}
export {
  ge as default,
  ge as register
};
