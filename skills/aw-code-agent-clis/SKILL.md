---
name: aw-code-agent-clis
description: Product behaviour and gotchas of the coding-agent CLIs this app installs (claude, codex, copilot, cursor-agent, agy). First covers the Codex CLI's silent --model fallback — codex --model <value> not resolving, a model alias that doesn't seem to take effect, or needing to verify which model actually ran a Codex-backed session. Use whenever configuring or debugging a Codex-backed agent's model selection, or picking between these CLIs' behaviour in general.
---

# aw-code-agent-clis — CLI product knowledge

Product behaviour of the coding-agent CLIs this app installs — things that
hold true on any fresh install, not specific to any one workspace's data or
accounts. Each CLI still needs its own authentication run before use; see
the app's README for that setup. This skill collects behavioural gotchas of
the CLIs themselves, starting with Codex's model-selection flag.

## Codex CLI's `--model` ignores unrecognised values instead of erroring

Unlike Claude Code, which resolves a versionless alias (`--model sonnet`,
`--model opus`) to its current pinned snapshot and **errors** on an
unrecognised value, OpenAI's Codex CLI does neither for an unresolved
`--model` value: it silently substitutes some default model and proceeds.

This means:

1. **A successful run on `--model <value>` is not evidence that value
   resolved.** Codex "succeeds" identically whether the value was a real
   model id, a real-but-wrong one, or complete garbage — the exit status
   and the quality of the answer tell you nothing about which model
   actually ran.
2. **Always verify via the run's own recorded model**, not exit status or
   answer quality. Pull the run's own events/detail and check which model
   id actually served the request.
3. **Run a negative control** whenever wiring up a new Codex model/alias
   end-to-end: push an obviously-invalid `--model` value through the exact
   same path. If the garbage value also "succeeds", the flag is being
   ignored rather than resolved — whatever model served both requests is
   Codex's own fallback default, and the intended value never took effect.

Applies to any workflow that configures a Codex-backed agent's model via
`--model` — confirm the mapping actually took hold before trusting it, don't
infer it from a single trial run.
