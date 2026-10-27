"""Release-contract regressions for every CLI managed by this app."""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent


def test_manifest_declares_all_supported_clis_and_real_installers():
    manifest = json.loads((ROOT / "aw-app.json").read_text())
    declared = {
        item["name"]: item["installer"]
        for item in manifest["contributes"]["system_clis"]
    }
    assert declared == {
        "claude": "scripts/install_claude.sh",
        "codex": "scripts/install_codex.sh",
        "copilot": "scripts/install_copilot.sh",
        "cursor-agent": "scripts/install_cursor.sh",
        "agy": "scripts/install_antigravity.sh",
    }
    assert all((ROOT / path).is_file() for path in declared.values())


def test_frontend_bundle_keeps_existing_agents_and_adds_antigravity():
    source = (ROOT / "ui" / "src" / "plugin.jsx").read_text()
    bundle = (ROOT / "ui" / "dist" / "code-agent-clis.js").read_text()
    for agent_type in ("claude", "codex", "copilot", "cursor", "antigravity"):
        assert f"'{agent_type}'" in source
        assert agent_type in bundle
    assert "Antigravity" in source
    assert "Antigravity" in bundle
    assert "agy" in source
    assert "agy" in bundle
