"""Unit tests for scripts/persist_home.sh — the fix for CLI logins (claude/
codex) not surviving a workspace container recreate (2026-08-04).

Runs the real bash script against a throwaway $HOME/$AW_WORKSPACE_HOME so
nothing touches the actual machine's state.

Run: .venv/aw/bin/python -m pytest tests/test_persist_home.py -q
"""
from __future__ import annotations

import os
import subprocess
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "persist_home.sh"


def _run(rel: str, kind: str, home: Path, aw_home: Path) -> subprocess.CompletedProcess:
    env = {**os.environ, "HOME": str(home), "AW_WORKSPACE_HOME": str(aw_home)}
    return subprocess.run(
        ["bash", str(SCRIPT), rel, kind], env=env, capture_output=True, text=True,
    )


class PersistHomeTest(unittest.TestCase):
    def test_first_run_moves_existing_dir_and_symlinks(self):
        with TemporaryDirectory() as tmp:
            home = Path(tmp) / "home"
            aw_home = Path(tmp) / "aw-home"
            (home / ".claude").mkdir(parents=True)
            (home / ".claude" / "settings.json").write_text('{"a": 1}')

            r = _run(".claude", "dir", home, aw_home)
            self.assertEqual(r.returncode, 0, r.stderr)

            live = home / ".claude"
            self.assertTrue(live.is_symlink())
            target = aw_home / "cli-homes" / ".claude"
            self.assertEqual(os.readlink(live), str(target))
            self.assertEqual((target / "settings.json").read_text(), '{"a": 1}')

    def test_first_run_moves_existing_file_and_symlinks(self):
        with TemporaryDirectory() as tmp:
            home = Path(tmp) / "home"
            aw_home = Path(tmp) / "aw-home"
            home.mkdir(parents=True)
            (home / ".claude.json").write_text('{"session": "abc"}')

            r = _run(".claude.json", "file", home, aw_home)
            self.assertEqual(r.returncode, 0, r.stderr)

            live = home / ".claude.json"
            self.assertTrue(live.is_symlink())
            target = aw_home / "cli-homes" / ".claude.json"
            self.assertEqual(target.read_text(), '{"session": "abc"}')

    def test_no_existing_state_creates_empty_target(self):
        with TemporaryDirectory() as tmp:
            home = Path(tmp) / "home"
            aw_home = Path(tmp) / "aw-home"
            home.mkdir(parents=True)

            r = _run(".codex", "dir", home, aw_home)
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertTrue((home / ".codex").is_symlink())
            self.assertTrue((aw_home / "cli-homes" / ".codex").is_dir())

    def test_simulated_container_recreate_keeps_prior_login_state(self):
        """The scenario that was actually broken: a fresh $HOME (container
        recreate wiped it) but AW_WORKSPACE_HOME already has state from a
        prior boot — that prior state must win, not the empty fresh dir."""
        with TemporaryDirectory() as tmp:
            home = Path(tmp) / "home"
            aw_home = Path(tmp) / "aw-home"

            # Boot 1: user logs in, .claude gets real content.
            (home / ".claude").mkdir(parents=True)
            (home / ".claude" / "creds.json").write_text('{"token": "secret"}')
            r1 = _run(".claude", "dir", home, aw_home)
            self.assertEqual(r1.returncode, 0, r1.stderr)

            # Simulate "container recreate": $HOME is gone, a fresh empty one
            # appears (as the container's writable layer would give it).
            import shutil
            shutil.rmtree(home)
            (home / ".claude").mkdir(parents=True)  # fresh, empty — no creds.json

            # Boot 2: persist_home.sh runs again on the fresh $HOME.
            r2 = _run(".claude", "dir", home, aw_home)
            self.assertEqual(r2.returncode, 0, r2.stderr)

            live = home / ".claude"
            self.assertTrue(live.is_symlink())
            # The durable copy (with the real login) is what's now visible.
            self.assertEqual((live / "creds.json").read_text(), '{"token": "secret"}')

    def test_idempotent_when_already_symlinked(self):
        with TemporaryDirectory() as tmp:
            home = Path(tmp) / "home"
            aw_home = Path(tmp) / "aw-home"
            home.mkdir(parents=True)
            _run(".codex", "dir", home, aw_home)
            r2 = _run(".codex", "dir", home, aw_home)
            self.assertEqual(r2.returncode, 0, r2.stderr)
            self.assertTrue((home / ".codex").is_symlink())


if __name__ == "__main__":
    unittest.main()
