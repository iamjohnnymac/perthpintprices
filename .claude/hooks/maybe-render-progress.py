#!/usr/bin/env python3
"""PostToolUse hook trigger: re-render `.pm-loop/progress.md` after every
Write to `.pm-loop/state.json`.

Reads Claude Code's hook event JSON from stdin. Returns silently (exit 0)
for all events that don't match — no chat output, no errors that would
bubble up into the user's session.

Registered in `.claude/settings.json` under `hooks.PostToolUse[Write]`.
"""
import json
import os
import subprocess
import sys
from pathlib import Path


def main():
    try:
        event = json.load(sys.stdin)
    except Exception:
        return  # malformed or empty stdin; nothing to do

    if event.get("tool_name") != "Write":
        return

    tool_input = event.get("tool_input") or {}
    file_path = (tool_input.get("file_path") or "")
    if not file_path.endswith(".pm-loop/state.json"):
        return

    # Locate the renderer next to this script (avoids relying on
    # CLAUDE_PROJECT_DIR pointing at the right place if the hook is invoked
    # from a different cwd than expected).
    renderer = Path(__file__).resolve().parent / "render-progress.py"
    if not renderer.exists():
        return

    # The renderer needs to run in the same cwd as the PM (so its relative
    # ".pm-loop/state.json" path resolves). The hook event JSON gives us
    # that cwd explicitly.
    cwd = event.get("cwd") or os.getcwd()

    try:
        subprocess.run(
            ["python3", str(renderer)],
            cwd=cwd,
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=5,
        )
    except Exception:
        pass  # renderer errors must never break the hook chain


if __name__ == "__main__":
    try:
        main()
    except Exception:
        pass
    sys.exit(0)
