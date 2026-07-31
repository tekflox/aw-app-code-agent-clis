"""
Install/uninstall logic for the four coding-agent CLIs this app installs:
Claude Code (claude), OpenAI Codex (codex), GitHub Copilot CLI (copilot),
and Cursor's cursor-agent. Invoked directly by tests/test_installer.py
(subprocess mocked) and tests/standalone_test.sh (real, out-of-framework).
CodeAgentClisAppPlugin's activate() goes through
ctx.commands.install_system_cli() instead (the gated/journaled framework
path) — this module is the plain, framework-free version of the same
install logic.
"""

from __future__ import annotations

import os
import subprocess
from pathlib import Path

APP_ROOT = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = APP_ROOT / "scripts"


class InstallError(RuntimeError):
    pass


def _run_script(script: str) -> str:
    path = SCRIPTS_DIR / script
    result = subprocess.run(
        ["bash", str(path)],
        capture_output=True,
        text=True,
        check=False,
        env=dict(os.environ),
    )
    if result.returncode != 0:
        raise InstallError(
            f"{script} failed (exit {result.returncode}): {result.stderr.strip()}"
        )
    return result.stdout.strip()


def install_claude() -> str:
    return _run_script("install_claude.sh")


def install_codex() -> str:
    return _run_script("install_codex.sh")


def install_copilot() -> str:
    return _run_script("install_copilot.sh")


def install_cursor_agent() -> str:
    return _run_script("install_cursor.sh")


def install_all() -> dict[str, str]:
    return {
        "claude": install_claude(),
        "codex": install_codex(),
        "copilot": install_copilot(),
        "cursor-agent": install_cursor_agent(),
    }


def uninstall_all() -> None:
    _run_script("uninstall.sh")
