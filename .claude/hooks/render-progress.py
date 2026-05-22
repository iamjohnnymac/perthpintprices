#!/usr/bin/env python3
"""Render `.pm-loop/progress.md` from state.json + per-iteration audit files.

Invoked by `.claude/hooks/maybe-render-progress.py` as a PostToolUse hook
after the PM writes `.pm-loop/state.json`. Reads only — never writes anything
except progress.md. Never throws: errors are caught and emitted as a one-line
diagnostic banner in progress.md so the user sees "renderer broken" rather
than silent staleness.

Run from the loop's worktree root (cwd = where `.pm-loop/` lives).
"""
import datetime
import glob
import json
import sys
from pathlib import Path

STATE_PATH = Path(".pm-loop/state.json")
PROGRESS_PATH = Path(".pm-loop/progress.md")
MAX_TASK_CHARS = 200
MAX_BLOCKER_CHARS = 60


def _row(num, phase, status, detail=""):
    return f"| {num} | {phase} | {status} | {detail} |"


def _first_blocker(review_path):
    if not review_path.exists():
        return ""
    try:
        r = json.loads(review_path.read_text())
    except Exception:
        return ""
    blockers = r.get("blockers") or []
    if not blockers:
        return ""
    first = blockers[0]
    if len(first) > MAX_BLOCKER_CHARS:
        first = first[:MAX_BLOCKER_CHARS] + "…"
    return first


def render(state):
    now = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    phase = state.get("phase", "?")
    iters = state.get("iterations") or []
    branch = state.get("branch", "?")
    final = state.get("final_verdict")
    task = (state.get("task") or "")[:MAX_TASK_CHARS]
    in_conductor = state.get("in_conductor", False)
    timeout_cmd = state.get("timeout_cmd", "?")
    has_hooks = state.get("has_hooks", False)
    softened = state.get("softened_to_lgtm", False)
    overridden = state.get("pm_override_to_lgtm", False)

    phase_label = phase
    if phase == "done" and final:
        phase_label = f"done · {final}"

    rows = []
    mode = "Conductor" if in_conductor else "Vanilla"
    rows.append(_row(
        0, "Environment", "✓ done",
        f"{mode} · timeout={timeout_cmd} · branch: {branch} · hooks: {has_hooks}",
    ))
    rows.append(_row(1, "Task validation", "✓ done", "concrete spec"))

    for it in iters:
        n = it.get("n", "?")
        re_run = it.get("re_run", 0)
        nonce = (it.get("nonce") or "")[:8]
        codex_exit = it.get("codex_exit")
        tip_sha = (it.get("tip_sha") or "")[:7]
        verdict = it.get("verdict")
        suffix = f" (re_run {re_run})" if re_run else ""

        # 2a — done iff entry exists
        rows.append(_row(
            f"2a · iter {n}{suffix}", "Codex prompt", "✓ done",
            f"nonce={nonce}" if nonce else "",
        ))
        # 2b — codex run
        if codex_exit is None:
            rows.append(_row(f"2b · iter {n}{suffix}", "Codex run", "⟳ running", ""))
        else:
            status = "✓ done" if codex_exit == 0 else f"✗ exit {codex_exit}"
            detail = f"exit {codex_exit}"
            rows.append(_row(f"2b · iter {n}{suffix}", "Codex run", status, detail))
        # 2c — PM commit
        if tip_sha:
            rows.append(_row(f"2c · iter {n}{suffix}", "PM commit", "✓ done", tip_sha))
        elif codex_exit is not None:
            rows.append(_row(f"2c · iter {n}{suffix}", "PM commit", "⟳ running", ""))
        else:
            rows.append(_row(f"2c · iter {n}{suffix}", "PM commit", "…", ""))
        # 2d — reviewer
        if verdict:
            detail = verdict
            if verdict in ("REVISE", "BLOCKED_ON_USER"):
                first = _first_blocker(Path(f".pm-loop/review-{n}.json"))
                if first:
                    detail = f"{verdict} — {first}"
            rows.append(_row(f"2d · iter {n}{suffix}", "Reviewer", "✓ done", detail))
        elif tip_sha:
            rows.append(_row(f"2d · iter {n}{suffix}", "Reviewer", "⟳ running", ""))
        else:
            rows.append(_row(f"2d · iter {n}{suffix}", "Reviewer", "…", ""))
        # 2e — researcher (only if a research file exists for this iter)
        research_files = sorted(glob.glob(f".pm-loop/research-{n}-*.json"))
        if research_files:
            verdicts = []
            for rf in research_files:
                try:
                    r = json.loads(Path(rf).read_text())
                    verdicts.append(r.get("verdict", "?"))
                except Exception:
                    verdicts.append("?")
            rows.append(_row(
                f"2e · iter {n}{suffix}", "Researcher", "✓ done",
                f"{len(research_files)} fact-check(s): {', '.join(verdicts)}",
            ))

    if phase == "done":
        s3_detail = f"final: {final or '?'}"
        if overridden:
            s3_detail += " (PM override via researcher)"
        elif softened:
            s3_detail += " (reviewer softened)"
        rows.append(_row(3, "Finalize", "✓ done", s3_detail))
    else:
        rows.append(_row(3, "Finalize", "…", ""))

    lines = [
        f"# pm-loop · {branch}",
        f"**Last update: {now} · Current phase: {phase_label}**",
        "",
        f"Task: {task}",
        "",
        "_Auto-rendered from `.pm-loop/state.json` on every state write via `.claude/hooks/maybe-render-progress.py`._",
        "",
        "| # | Phase | Status | Detail |",
        "|---|---|---|---|",
    ]
    lines.extend(rows)
    lines += [
        "",
        "---",
        "**Audit trail (gitignored):** `.pm-loop/state.json`, `review-<N>.json`, `research-<N>-<M>.json`, `codex-<N>.{out,err}`, `commit-msg-<N>.txt`, `prompt-<N>.txt`.",
        "",
    ]
    return "\n".join(lines)


def main():
    if not STATE_PATH.exists():
        return
    try:
        state = json.loads(STATE_PATH.read_text())
    except Exception:
        # state.json transiently invalid mid-write — leave existing progress.md
        return
    try:
        rendered = render(state)
    except Exception as e:
        # Diagnostic banner so the user sees "renderer broken" not silent staleness
        rendered = (
            "# pm-loop · render error\n\n"
            f"`render-progress.py` failed: `{e!r}`\n\n"
            "`.pm-loop/state.json` is still the authoritative state.\n"
        )
    PROGRESS_PATH.write_text(rendered)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        pass
    sys.exit(0)
