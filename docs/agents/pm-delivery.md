# PM delivery

One PM runs all work in this repository (see `AGENTS.md`). `AGENTS.md` owns the delivery routes
and the CRITICAL/NIT rule; this file owns the procedure. The commands below were verified on
27 September 2026.

## Before dispatch

- Create one worktree per writer from freshly fetched main:
  `git fetch origin main && git worktree add -b <branch> <path> origin/main`. Keep one writer and
  one heavy job (installs, builds, full suites, dev servers) per host.
- Keep an evidence folder outside the repository, for example
  `~/Claude/ppp-lane-evidence/<date>-<task>/`. Its `contract.md` records the outcome and
  non-goals, acceptance, the riskiest assumption and its first proof, the route, the timebox, and
  the repair-round count. Update it as each step lands.
- For uncertain work, prove the riskiest assumption first, on the real runtime (a Node 24
  production build served by `next start`), before building on it.

## Models

The owner's standing policy, `~/Claude/model-routing-policy.md`, sets models and effort and wins
over this file. As of 28 September 2026:
- gpt-6-sol at medium writes defined code;
- claude-opus-5-5 at xhigh reviews independently;
- gpt-6-sol and gpt-6-astra at high review work that Opus wrote.

Confirm the model each run reports. If a route is unavailable, say so; don't substitute.

Writer:

```bash
codex exec -m gpt-6-sol -c model_reasoning_effort=medium --sandbox workspace-write -C <worktree> - < <evidence>/brief.md > <evidence>/worker.log 2>&1
```

Opus review. `claude -p` reviews its working directory, so run it from the candidate worktree at
the frozen head, and check that `git rev-parse HEAD` there matches the SHA in the prompt. Check
that `modelUsage` in the JSON names `claude-opus-5-5`. Pass the prompt on stdin, because
`--add-dir` takes several values and swallows a trailing prompt.

```bash
cd <worktree> && claude -p --model claude-opus-5-5 --effort xhigh --output-format json --allowedTools "Read Grep Glob" --add-dir <evidence> < <evidence>/review-prompt.md > <evidence>/review.json
```

GPT review, for Opus-authored work. Use `gpt-6-astra` for a Rigorous sensitive-boundary review.

```bash
codex exec -m gpt-6-sol -c model_reasoning_effort=high --sandbox read-only -C <worktree> - < <evidence>/review-prompt.md > <evidence>/review.log 2>&1
```

## Writer brief

A brief states:
- the finish line and the contract path;
- the exact files in scope and out of scope;
- focused checks, run with Node 24 (CI's runtime);
- the proof the surface needs (`AGENTS.md` browser evidence for UI changes);
- the timebox.

The writer doesn't push, open PRs, merge, or change env or dependencies unless the brief says so.
It commits once, and returns:
- the SHA;
- `git diff --stat`;
- each command it ran and the result;
- anything it didn't verify.

## Review prompt

A review prompt gives:
- the exact merge-base and head SHAs;
- the acceptance sources: the contract, the diff and the evidence, without the writer's own
  account;
- what to verify;
- the CRITICAL/NIT rubric.

The reviewer stays read-only and returns one JSON verdict line. Collect every review before
changing the candidate. Put the CRITICAL fixes into one commit, then ask each reviewer to confirm
only that delta.

## Delivery

1. Read the PR's feedback: `gh api` on `issues/<n>/comments`, `pulls/<n>/reviews` and
   `pulls/<n>/comments` under `repos/iamjohnnymac/perthpintprices/`.
2. Confirm CI passed on the exact head with
   `gh api repos/iamjohnnymac/perthpintprices/commits/<sha>/check-runs`. A PR page or a message
   saying the checks are green is not evidence.
3. Merge only with the owner's authority for that PR:
   `gh pr merge <n> --merge --match-head-commit <sha>`.
4. Watch main's CI once: `gh run watch <run-id> --exit-status`.
5. Production ships on merge. Confirm the production domain serves the merge commit
   (`vercel inspect perthpintprices.com`, `vercel ls perthpintprices -m githubCommitSha=<sha>`), then
   check the changed endpoint without paid calls.
6. Record the SHAs, run IDs, deployment ID and results in the contract. Remove a task worktree
   with `git worktree remove <path>` (never `--force`) only when its branch is merged, the tree is
   clean, and no session, server or process is still using it. Otherwise record it as retained,
   with its owner and next action.

## Gotchas

- `codex exec` waits for stdin when none is given. Pass the brief with `-` and a redirect, or add
  `< /dev/null`.
- The Agent tool can't set reasoning effort, so don't use it for a release review.
- Vercel Preview Protection blocks headless browsers. Prove a candidate on a local `next start` of
  the exact build, or through the owner's signed-in browser.
- For a flaky CI failure, run `gh run rerun --failed` once and record a diagnosis. A passing rerun
  doesn't prove the cause.
- Setting a production environment variable is a production change: it goes live on the next
  deploy, whichever PR triggers it.
- In a branch clean-up, exclude the default branch by name. A stale local `main` counts as
  "merged into origin/main", so a merged-branch list will include it.
- For a squash-merged branch, `git branch -d` reports "not fully merged". Delete it only when its
  tip equals the head of the merged PR (`gh pr view <n> --json headRefOid`).
- `git stash push -u` can leave some untracked files behind. Check `git status` before switching
  branches, and back up anything that blocks the switch rather than forcing it.
- A major SDK upgrade can change privacy defaults. Sentry 11 replaced `sendDefaultPii` with a
  `dataCollection` option whose defaults collect IPs, cookies, headers and bodies, so set it
  explicitly (#290).
