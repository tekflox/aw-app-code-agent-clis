#!/usr/bin/env python3
"""Unit tests for code_agent_clis_app/installer.py with subprocess mocked
out — no real network/npm/curl involved, so this is safe to run in CI on a
plain GitHub-hosted runner.

For each of the four CLIs, asserts the install function invokes bash on
the EXACT expected script path under SCRIPTS_DIR.

Run: .venv/aw/bin/python -m pytest tests/test_installer.py -q
(or plain unittest: .venv/aw/bin/python -m unittest tests/test_installer.py)
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import patch, MagicMock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from code_agent_clis_app import installer  # noqa: E402


def _ok(stdout: str = ""):
    return MagicMock(returncode=0, stdout=stdout, stderr="")


def _script_path(call_args) -> str:
    """The script path bash was invoked with — last element of argv."""
    args, _kwargs = call_args
    return args[0][-1]


class CliInstallersTest(unittest.TestCase):
    CASES = [
        (installer.install_claude, "install_claude.sh"),
        (installer.install_codex, "install_codex.sh"),
        (installer.install_copilot, "install_copilot.sh"),
        (installer.install_cursor_agent, "install_cursor.sh"),
    ]

    @patch("code_agent_clis_app.installer.subprocess.run")
    def test_each_installer_runs_its_own_script_at_the_correct_path(self, mock_run):
        for fn, script_name in self.CASES:
            with self.subTest(script=script_name):
                mock_run.return_value = _ok(f"installed {script_name}")
                fn()
                self.assertEqual(
                    _script_path(mock_run.call_args),
                    str(installer.SCRIPTS_DIR / script_name),
                )

    @patch("code_agent_clis_app.installer.subprocess.run")
    def test_failure_raises_install_error(self, mock_run):
        mock_run.return_value = MagicMock(returncode=1, stdout="", stderr="boom")
        with self.assertRaises(installer.InstallError):
            installer.install_claude()


class AggregateInstallTest(unittest.TestCase):
    @patch("code_agent_clis_app.installer.subprocess.run")
    def test_install_all_covers_every_declared_cli(self, mock_run):
        mock_run.return_value = _ok("ok")
        result = installer.install_all()
        self.assertEqual(
            set(result.keys()),
            {"claude", "codex", "copilot", "cursor-agent"},
        )

    @patch("code_agent_clis_app.installer.subprocess.run")
    def test_uninstall_all_runs_the_uninstall_script(self, mock_run):
        mock_run.return_value = _ok()
        installer.uninstall_all()
        self.assertEqual(
            _script_path(mock_run.call_args),
            str(installer.SCRIPTS_DIR / "uninstall.sh"),
        )


if __name__ == "__main__":
    unittest.main()
