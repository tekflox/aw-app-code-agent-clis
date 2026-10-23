function xe({ apiUrl: e, fetchImpl: L = fetch }) {
  async function m(a, { limit: k, before: R } = {}) {
    let M = `type=${encodeURIComponent(a)}`;
    k != null && (M += `&limit=${encodeURIComponent(k)}`), R != null && (M += `&before=${encodeURIComponent(R)}`);
    const N = await L(e(`/agent-sessions?${M}`));
    if (!N.ok) throw new Error(`GET /agent-sessions -> ${N.status}`);
    const l = await N.json();
    return k == null ? Array.isArray(l) ? l : [] : {
      sessions: Array.isArray(l == null ? void 0 : l.sessions) ? l.sessions : [],
      total: typeof (l == null ? void 0 : l.total) == "number" ? l.total : 0,
      hasMore: !!(l != null && l.has_more)
    };
  }
  async function w(a, k, { restore: R = !1 } = {}) {
    const M = `type=${encodeURIComponent(a)}${R ? "&restore=1" : ""}`, N = await L(e(`/agent-sessions/${encodeURIComponent(k)}?${M}`), {
      method: "DELETE"
    });
    if (!N.ok) throw new Error(`DELETE /agent-sessions/${k} -> ${N.status}`);
    return N.json();
  }
  return { listSessions: m, hideSession: w };
}
const he = /* @__PURE__ */ new Set(["claude", "codex", "copilot", "cursor"]), ae = 50;
function ve(e) {
  const L = xe({
    apiUrl: e.app.apiUrl,
    fetchImpl: e.sdk.api.fetch
  }), { useState: m, useRef: w, useCallback: a, useEffect: k } = e.React, { createPortal: R } = e.ReactDOM, M = {
    bolt: (o) => /* @__PURE__ */ e.h("svg", { className: "w-3 h-3 shrink-0", viewBox: "0 0 24 24", fill: "currentColor", style: { color: o } }, /* @__PURE__ */ e.h("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z" })),
    copilot: (o) => /* @__PURE__ */ e.h("svg", { className: "w-3 h-3 shrink-0", viewBox: "0 0 24 24", fill: "currentColor", style: { color: o } }, /* @__PURE__ */ e.h("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" })),
    cursor: (o) => /* @__PURE__ */ e.h("svg", { className: "w-3 h-3 shrink-0", viewBox: "0 0 24 24", fill: "currentColor", style: { color: o } }, /* @__PURE__ */ e.h("path", { d: "M4 0l16 12.279-6.985 1.205 2.854 10.516L4 0z" })),
    codex: (o) => /* @__PURE__ */ e.h("svg", { className: "w-3 h-3 shrink-0", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", style: { color: o } }, /* @__PURE__ */ e.h("path", { d: "M12 3l7.5 4.25v8.5L12 20l-7.5-4.25v-8.5L12 3z" }), /* @__PURE__ */ e.h("path", { d: "M8.5 9.5L12 7.5l3.5 2v5L12 16.5l-3.5-2v-5z" })),
    terminal: () => /* @__PURE__ */ e.h("svg", { className: "w-3 h-3 shrink-0 text-[var(--color-accent)]", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("polyline", { points: "4 17 10 11 4 5" }), /* @__PURE__ */ e.h("line", { x1: "12", y1: "19", x2: "20", y2: "19" }))
  };
  function N({ iconName: o, color: i }) {
    const f = M[o];
    return f ? f(i) : /* @__PURE__ */ e.h(
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
    runningAgentSessionMap: f,
    liveAgentSessions: B,
    onLaunch: z,
    onResume: Y,
    onOpenRunningAgentSession: D,
    onOpenRunningTerminal: V,
    onCloseRunningTerminal: Z,
    onFlyoutEnter: d,
    onFlyoutLeave: h
  }) {
    const [$, C] = m(!1), [S, J] = m({ top: 0, left: 0 }), [c, W] = m(null), [U, E] = m(0), [_, j] = m(!1), [x, H] = m(!1), [v, r] = m(!1), [s, I] = m(null), G = w(null), K = w(null), q = w(!1), g = o.key === "terminal", ie = he.has(o.key), F = g || ie, Q = w(!1), oe = a(() => {
      q.current || (q.current = !0, d == null || d());
    }, [d]), O = a(() => {
      q.current && (q.current = !1, h == null || h());
    }, [h]), T = a(() => {
      clearTimeout(K.current);
    }, []), ne = a(() => {
      T(), K.current = setTimeout(() => {
        Q.current = !1, C(!1), O();
      }, 150);
    }, [T, O]);
    k(() => () => {
      clearTimeout(K.current), O();
    }, [O]);
    const A = a(() => {
      T(), Q.current = !1, C(!1), O();
    }, [T, O]), ce = a(() => {
      var n;
      if (!F) return;
      T();
      const t = (n = G.current) == null ? void 0 : n.getBoundingClientRect();
      t && J({ top: t.top, left: t.right + 4 }), Q.current = !0, C(!0), oe(), !g && !v && (r(!0), I(null), L.listSessions(o.key, { limit: ae }).then(({ sessions: u, total: y, hasMore: p }) => {
        W(u), E(y), j(p);
      }).catch((u) => I(u.message || "Failed to load")).finally(() => r(!1)));
    }, [F, T, oe, g, v]), X = a(() => {
      if (x || !_ || !c || c.length === 0) return;
      H(!0);
      const t = c[c.length - 1].updated_at;
      L.listSessions(o.key, { limit: ae, before: t }).then(({ sessions: n, total: u, hasMore: y }) => {
        W((p) => {
          const P = new Set((p || []).map((b) => b.session_id));
          return [...p || [], ...n.filter((b) => !P.has(b.session_id))];
        }), E(u), j(y);
      }).catch(() => {
      }).finally(() => H(!1));
    }, [x, _, c, o.key]), de = a((t) => {
      if (g || !_ || x) return;
      const n = t.currentTarget;
      n.scrollHeight - n.scrollTop - n.clientHeight < 120 && X();
    }, [g, _, x, X]), ue = [...i || []].sort((t, n) => {
      const u = (t.name || "").toLowerCase(), y = (n.name || "").toLowerCase();
      return u.localeCompare(y);
    }), pe = new Set((c || []).map((t) => t.session_id)), se = (B || []).filter(
      (t) => t.type === o.key && t.alive && (!t.agent_session_id || !pe.has(t.agent_session_id))
    ), me = [...c || []].sort((t, n) => {
      const u = !!f[`${o.key}:${t.session_id}`], y = !!f[`${o.key}:${n.session_id}`];
      if (u !== y) return u ? -1 : 1;
      const p = (t.updated_at || t.created_at || 0) * 1e3, P = (n.updated_at || n.created_at || 0) * 1e3;
      if (p !== P) return P - p;
      const b = (t.name || "(untitled)").toLowerCase(), ee = (n.name || "(untitled)").toLowerCase();
      return b.localeCompare(ee);
    });
    return /* @__PURE__ */ e.h(e.React.Fragment, null, /* @__PURE__ */ e.h(
      "button",
      {
        ref: G,
        onMouseEnter: ce,
        onMouseLeave: ne,
        onClick: (t) => {
          t.stopPropagation(), A(), z();
        },
        className: "w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/[0.06] cursor-pointer text-left"
      },
      /* @__PURE__ */ e.h(N, { iconName: o.icon, color: o.color }),
      /* @__PURE__ */ e.h("span", { className: "flex-1 text-[13px] text-[var(--color-text-primary)]" }, o.label),
      F ? /* @__PURE__ */ e.h("svg", { className: "w-3 h-3 text-[var(--color-text-muted)] opacity-60", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M9 6l6 6-6 6" })) : /* @__PURE__ */ e.h("svg", { className: "w-3 h-3 text-[var(--color-accent)] opacity-60", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M12 5v14M5 12h14" }))
    ), $ && F && R(
      /* @__PURE__ */ e.h(
        "div",
        {
          onMouseEnter: T,
          onMouseLeave: ne,
          onScroll: de,
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
              t.stopPropagation(), A(), z();
            },
            title: g ? "New terminal" : "New session",
            "aria-label": g ? "Start new terminal" : `Start new ${o.label} session`,
            className: "w-full text-left px-3 py-2 text-xs text-[var(--color-accent)] hover:bg-white/5 border-b border-[var(--color-border)] flex items-center gap-1.5"
          },
          /* @__PURE__ */ e.h("svg", { className: "w-3 h-3 shrink-0", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M12 5v14M5 12h14" })),
          /* @__PURE__ */ e.h("span", { className: "font-medium" }, g ? "New Terminal" : "New Session"),
          /* @__PURE__ */ e.h("span", { className: "ml-auto text-[10px] text-[var(--color-text-muted)]" }, g ? (i == null ? void 0 : i.length) || 0 : U)
        ),
        g ? /* @__PURE__ */ e.h(e.React.Fragment, null, !i || i.length === 0 ? /* @__PURE__ */ e.h("div", { className: "px-3 py-3 text-xs text-[var(--color-text-muted)]" }, "No running terminals.") : ue.map((t) => /* @__PURE__ */ e.h(
          "div",
          {
            key: t.id,
            className: "group relative w-full hover:bg-white/5 transition-colors border-b border-[var(--color-border)] last:border-0"
          },
          /* @__PURE__ */ e.h(
            "button",
            {
              onClick: (n) => {
                n.stopPropagation(), A(), V(t.id);
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
                n.stopPropagation(), Z(t.id);
              },
              className: "absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--color-danger)]/20 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-opacity cursor-pointer",
              title: "Close terminal"
            },
            /* @__PURE__ */ e.h("svg", { className: "w-3 h-3", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M18 6L6 18M6 6l12 12" }))
          )
        ))) : /* @__PURE__ */ e.h(e.React.Fragment, null, v && /* @__PURE__ */ e.h("div", { className: "px-3 py-3 text-xs text-[var(--color-text-muted)]" }, "Loading…"), s && !v && /* @__PURE__ */ e.h("div", { className: "px-3 py-3 text-xs text-[var(--color-danger)]" }, "Failed to load: ", s), !v && !s && c && c.length === 0 && se.length === 0 && /* @__PURE__ */ e.h("div", { className: "px-3 py-3 text-xs text-[var(--color-text-muted)]" }, "No previous sessions for this project."), se.map((t) => /* @__PURE__ */ e.h(
          "div",
          {
            key: t.id,
            className: "group relative w-full hover:bg-white/5 transition-colors border-b border-[var(--color-border)] last:border-0"
          },
          /* @__PURE__ */ e.h(
            "button",
            {
              onClick: (n) => {
                n.stopPropagation(), A(), D(t.id);
              },
              className: "w-full text-left px-3 py-2 pr-9",
              title: `Open running session "${t.name}" (session ID not yet detected)`
            },
            /* @__PURE__ */ e.h("div", { className: "text-xs font-medium text-[var(--color-text-primary)] truncate flex items-center gap-2" }, /* @__PURE__ */ e.h("span", { className: "w-2 h-2 rounded-full bg-emerald-400 shrink-0" }), /* @__PURE__ */ e.h("span", { className: "truncate" }, t.name)),
            /* @__PURE__ */ e.h("div", { className: "text-[10px] text-[var(--color-text-muted)] mt-0.5" }, "starting…")
          )
        )), !v && !s && c && me.map((t) => {
          const n = t.session_id ? `${t.session_id.slice(0, 8)}-${t.session_id.slice(9, 13)}…` : "", u = t.name || n || "(untitled)";
          let y = "";
          const p = t.updated_at ? new Date(t.updated_at * 1e3) : t.created_at ? new Date(t.created_at * 1e3) : null;
          p && !isNaN(p) && (y = `${p.toLocaleDateString()} ${p.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
          const P = [n, y].filter(Boolean).join(" · "), b = f[`${o.key}:${t.session_id}`], ee = (te) => {
            te.stopPropagation(), W((re) => (re || []).filter((fe) => fe.session_id !== t.session_id)), E((re) => Math.max(0, re - 1)), L.hideSession(o.key, t.session_id).catch(() => {
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
                  te.stopPropagation(), A(), b ? D(b) : Y(o.key, t.session_id, u);
                },
                className: "w-full text-left px-3 py-2 pr-9",
                title: `${b ? "Open" : "Resume"} "${u}" (${t.session_id})`
              },
              /* @__PURE__ */ e.h("div", { className: "text-xs font-medium text-[var(--color-text-primary)] truncate flex items-center gap-2" }, b && /* @__PURE__ */ e.h("span", { className: "w-2 h-2 rounded-full bg-emerald-400 shrink-0" }), /* @__PURE__ */ e.h("span", { className: "truncate" }, u)),
              /* @__PURE__ */ e.h("div", { className: "text-[10px] text-[var(--color-text-muted)] mt-0.5 truncate" }, P)
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
        }), !v && !s && _ && // Terminal fallback row for when 50 rows don't overflow
        // the flyout's own scrollbar (no scroll event ever fires
        // then, so page 2 would otherwise be unreachable).
        /* @__PURE__ */ e.h(
          "button",
          {
            onClick: (t) => {
              t.stopPropagation(), X();
            },
            disabled: x,
            className: "w-full text-left px-3 py-2 text-xs text-[var(--color-text-muted)] hover:bg-white/5 disabled:opacity-60"
          },
          x ? "Loading…" : `Load more (${Math.max(0, U - ((c == null ? void 0 : c.length) || 0))} remaining)`
        ))
      ),
      document.body
    ));
  }
  function le({
    aiAgents: o,
    agentSessions: i,
    terminals: f,
    onCreateAgent: B,
    onCreateTerminal: z,
    onToggleAgent: Y,
    onToggleTerminal: D,
    onCloseTerminal: V
  }) {
    const [Z, d] = m(!1), h = w(null), $ = w(0), C = w(!1), S = a(() => {
      clearTimeout(h.current), h.current = setTimeout(() => {
        !C.current && $.current === 0 && d(!1);
      }, 150);
    }, []), J = a(() => {
      C.current = !0, clearTimeout(h.current), d(!0);
    }, []), c = a(() => {
      C.current = !1, S();
    }, [S]), W = a(() => {
      $.current += 1, clearTimeout(h.current);
    }, []), U = a(() => {
      $.current = Math.max(0, $.current - 1), $.current === 0 && !C.current && S();
    }, [S]);
    k(() => () => clearTimeout(h.current), []);
    const E = ((i == null ? void 0 : i.length) || 0) + ((f == null ? void 0 : f.length) || 0), _ = (() => {
      const r = (o || []).map((s) => ({
        key: s.type,
        label: s.type === "terminal" ? "Terminals" : s.label || s.type,
        icon: s.icon,
        color: s.color,
        action: s.type === "terminal" ? () => z() : () => B(s.type)
      }));
      return r.some((s) => s.key === "terminal") || r.push({
        key: "terminal",
        label: "Terminals",
        icon: "terminal",
        color: "var(--color-accent)",
        action: () => z()
      }), r;
    })(), j = _.filter((r) => r.key !== "terminal"), x = _.find((r) => r.key === "terminal"), H = {};
    (i || []).forEach((r) => {
      r.type && r.agent_session_id && (H[`${r.type}:${r.agent_session_id}`] = r.id);
    });
    const v = {
      terminals: f,
      runningAgentSessionMap: H,
      liveAgentSessions: i,
      onOpenRunningAgentSession: (r) => {
        d(!1), Y(r);
      },
      onOpenRunningTerminal: (r) => {
        d(!1), D(r);
      },
      onCloseRunningTerminal: (r) => {
        V(r);
      },
      onFlyoutEnter: W,
      onFlyoutLeave: U
    };
    return /* @__PURE__ */ e.h("div", { className: "relative", onMouseEnter: J, onMouseLeave: c }, /* @__PURE__ */ e.h(
      "button",
      {
        onClick: () => d((r) => !r),
        className: "px-3 py-1 text-xs rounded transition-colors cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5"
      },
      "Agents",
      E > 0 && /* @__PURE__ */ e.h("span", { className: "ml-1.5 inline-flex items-center justify-center min-w-[16px] h-[16px] rounded-full text-[9px] font-bold px-1 bg-[var(--color-accent)]/20 text-[var(--color-accent)]" }, E)
    ), Z && /* @__PURE__ */ e.h(
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
          onResume: (s, I, G) => {
            d(!1), B(s, I, G);
          },
          ...v
        }
      )),
      x && /* @__PURE__ */ e.h(e.React.Fragment, null, /* @__PURE__ */ e.h("div", { className: "border-t border-[var(--color-border)] my-1" }), /* @__PURE__ */ e.h(
        l,
        {
          key: x.key,
          launcher: x,
          onLaunch: () => {
            d(!1), x.action();
          },
          onResume: (r, s, I) => {
            d(!1), B(r, s, I);
          },
          ...v
        }
      ))
    ));
  }
  e.registerSlot("core.nav", le);
}
export {
  ve as default,
  ve as register
};
