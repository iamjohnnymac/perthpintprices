#!/bin/bash
# PreToolUse hook for the code-reviewer subagent.
#
# Strategy: this subagent is read-only by design, so we reject ALL shell composition
# (pipes, redirections, command substitution, logical operators, heredocs)
# and validate only the single, top-level command.
# Prevents bypass via `cat foo | rm -rf /` or `git status $(rm -rf /)` patterns.
#
# Receives Claude Code's hook JSON via stdin; exits with code 2 to block.
#
# Important: this hook is registered in BOTH .claude/agents/code-reviewer.md (subagent
# frontmatter) AND .claude/settings.json (project-level) to work around GitHub issue
# anthropics/claude-code#18392 where frontmatter hooks may not fire reliably.
# The agent_type gate below ensures the restrictions only apply when the reviewer is
# the caller — the PM's own Bash calls pass through untouched.

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

# Gate: only enforce restrictions when a /pm-loop subagent is calling.
# Both code-reviewer and code-researcher have the same read-only Bash restriction.
# The hook input includes agent_type when fired inside a subagent (per Claude Code hooks docs).
AGENT_TYPE=$(parse_field "agent_type")
case "$AGENT_TYPE" in
  code-reviewer|code-researcher)
    ;; # fall through to validation
  *)
    exit 0 ;; # not one of our subagents — don't enforce
esac

COMMAND=$(parse_field "tool_input.command")

if [ -z "$COMMAND" ]; then
  exit 0
fi

# Reject any shell metacharacter that enables composition or side effects.
if echo "$COMMAND" | grep -qE '[|;&<>`]|\$\('; then
  echo "BLOCKED: reviewer commands cannot contain shell metacharacters (| ; & < > \` \$( ). Run one read-only command per Bash invocation." >&2
  exit 2
fi

if echo "$COMMAND" | grep -qE '<<|<\(|>\('; then
  echo "BLOCKED: reviewer commands cannot use heredocs or process substitution." >&2
  exit 2
fi

# Single simple invocation. Get the first token.
FIRST_CMD=$(echo "$COMMAND" | sed 's/^[[:space:]]*//' | awk '{print $1}')

case "$FIRST_CMD" in
  git)
    GIT_SUB=$(echo "$COMMAND" | sed 's/^[[:space:]]*//' | awk '{print $2}')
    case "$GIT_SUB" in
      diff|log|show|status|rev-parse|rev-list|symbolic-ref|remote|ls-files|cat-file|describe|blame|grep)
        exit 0
        ;;
      config)
        if echo "$COMMAND" | grep -qE 'config[[:space:]]+(--get|--list|--show-origin|--show-scope)'; then
          exit 0
        fi
        echo "BLOCKED: 'git config' only allowed in read mode (--get/--list/--show-origin/--show-scope)." >&2
        exit 2
        ;;
      *)
        echo "BLOCKED: reviewer can only use read-only git subcommands. Got: git $GIT_SUB" >&2
        echo "Allowed git subcommands: diff, log, show, status, rev-parse, rev-list, symbolic-ref, remote, ls-files, cat-file, describe, blame, grep, config (read-only flags)" >&2
        exit 2
        ;;
    esac
    ;;
  grep|rg|cat|ls|find|head|tail|wc|awk|sort|uniq|cut|tr|file|stat|echo|test|true|false|pwd|which|type|jq)
    exit 0
    ;;
  sed)
    if echo "$COMMAND" | grep -qE 'sed[[:space:]]+([^[:space:]]*[[:space:]]+)*(-i|--in-place)([[:space:]]|$|=)'; then
      echo "BLOCKED: reviewer cannot use sed -i (in-place edit)." >&2
      exit 2
    fi
    exit 0
    ;;
  *)
    echo "BLOCKED: reviewer command '$FIRST_CMD' is not on the read-only allowlist." >&2
    echo "Allowed top-level commands: git (read-only subcommands), grep, rg, cat, ls, find, head, tail, wc, awk, sed (read-only), sort, uniq, cut, tr, file, stat, echo, test, true, false, pwd, which, type, jq" >&2
    exit 2
    ;;
esac
