#!/bin/bash
# PreToolUse hook for the code-reviewer subagent.
# Blocks any Write that isn't to .pm-loop/review-<N>.json.
# Receives Claude Code's hook JSON via stdin; exits with code 2 to block.

set -euo pipefail

INPUT=$(cat)

# JSON parsing: prefer python3 (ubiquitous), fall back to jq.
parse_field() {
  local field="$1"
  if command -v python3 >/dev/null 2>&1; then
    echo "$INPUT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('${field}','') if '.' not in '${field}' else d.get('${field%%.*}',{}).get('${field#*.}',''))" 2>/dev/null || echo ""
  elif command -v jq >/dev/null 2>&1; then
    echo "$INPUT" | jq -r ".${field} // empty" 2>/dev/null || echo ""
  else
    echo "BLOCKED: hook needs python3 or jq to parse input. Install one." >&2
    exit 2
  fi
}

# Gate: only enforce when a /pm-loop subagent is the caller.
# code-reviewer writes review-*.json; code-researcher writes research-*.json. Both scoped to .pm-loop/.
AGENT_TYPE=$(parse_field "agent_type")
case "$AGENT_TYPE" in
  code-reviewer|code-researcher)
    ;; # fall through to validation
  *)
    exit 0 ;; # not one of our subagents — don't enforce
esac

WRITE_PATH=$(parse_field "tool_input.file_path")

if [ -z "$WRITE_PATH" ]; then
  exit 0
fi

# Tight allowlist via anchored regex (NOT shell case-globs — those match across `/` and
# allow path-traversal payloads like `review-9/../../etc/passwd.json`).
# Reviewer must write .pm-loop/review-<digits>.json
# Researcher must write .pm-loop/research-<digits>-<digits>.json
# Both must be inside CLAUDE_PROJECT_DIR.
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Resolve to a canonical absolute path to defeat ../ shenanigans before regex matches.
# realpath is available on Linux and modern macOS (coreutils); fall back to readlink -f.
canonicalize() {
  if command -v realpath >/dev/null 2>&1; then
    realpath -m -- "$1" 2>/dev/null || echo "$1"
  elif command -v readlink >/dev/null 2>&1 && readlink -f / >/dev/null 2>&1; then
    readlink -f -- "$1" 2>/dev/null || echo "$1"
  else
    # No canonicalizer available — refuse rather than risk a bypass.
    echo "BLOCKED: hook needs realpath or readlink -f to validate write paths." >&2
    exit 2
  fi
}

CANONICAL_PATH=$(canonicalize "$WRITE_PATH")
CANONICAL_PROJECT=$(canonicalize "$PROJECT_DIR")

# Build regex. Escape the project-dir prefix for safe regex use.
escape_for_regex() {
  printf '%s' "$1" | sed 's/[][\\.*^$/()+?{}|]/\\&/g'
}
ESCAPED_PROJECT=$(escape_for_regex "$CANONICAL_PROJECT")

case "$AGENT_TYPE" in
  code-reviewer)
    if [[ "$CANONICAL_PATH" =~ ^${ESCAPED_PROJECT}/\.pm-loop/review-[0-9]+\.json$ ]]; then
      exit 0
    fi
    ;;
  code-researcher)
    if [[ "$CANONICAL_PATH" =~ ^${ESCAPED_PROJECT}/\.pm-loop/research-[0-9]+-[0-9]+\.json$ ]]; then
      exit 0
    fi
    ;;
esac

echo "BLOCKED: $AGENT_TYPE cannot Write to $WRITE_PATH (canonicalized: $CANONICAL_PATH)." >&2
echo "  Reviewer must write to $CANONICAL_PROJECT/.pm-loop/review-<N>.json" >&2
echo "  Researcher must write to $CANONICAL_PROJECT/.pm-loop/research-<N>-<M>.json" >&2
exit 2
