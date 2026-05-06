---
name: oneshot
description: One-command pipeline — plans, implements, and opens an auto-merge PR for a single feature. Takes the feature description as its sole argument. Use when the user types `/oneshot "<description>"`.
---

# Oneshot Skill

End-to-end pipeline that takes a feature description and lands a PR with auto-merge enabled. Four phases run sequentially in this session: pre-flight → plan (subagent) → execute (subagent) → PR + auto-merge.

**The user's input is the feature description.** Everything after `/oneshot` is the request. If `args` is empty, abort and tell the user to provide a description.

---

## Safety contract

- Auto-merge will land code on `main` without a human reading it. CI is the only gate. Only run this on changes the user is prepared to accept sight-unseen.
- Plan quality will be lower than interactive `/feature-planning` because the planner cannot ask questions.
- If ANY phase fails, STOP. Do not proceed. Report the failure with the branch name so the user can inspect.

---

## Phase 0 — Pre-flight (do all of these inline)

Run these checks. If any fail, abort with a clear message and make no further changes.

1. **Working tree clean**:
   ```bash
   git status --porcelain
   ```
   Must be empty. If not, abort: "Working tree dirty — commit or stash before running /oneshot."

2. **On main (or designated branch), up to date with origin/main**:
   ```bash
   git rev-parse --abbrev-ref HEAD
   git fetch origin main
   git rev-list --count HEAD..origin/main
   ```
   If the harness has pinned a development branch (system reminder names a branch like `claude/...`), use that branch instead of creating a new one and skip step 5. Otherwise must be on `main`. Either way, if behind `origin/main`, abort: "Local branch is behind origin/main — pull or rebase first."

3. **GitHub MCP tools available**: this skill uses `mcp__github__*` tools (NOT the `gh` CLI — the harness doesn't have it). Confirm `mcp__github__create_pull_request`, `mcp__github__enable_pr_auto_merge`, `mcp__github__merge_pull_request`, and `mcp__github__pull_request_read` are loadable via `ToolSearch`. If any are missing, abort: "GitHub MCP tools unavailable — cannot proceed."

4. **Repo allows auto-merge**: there is no MCP tool that exposes `autoMergeAllowed`. Skip the explicit check and rely on the Phase 3 enable-auto-merge call to surface the failure. The skill MUST handle a "auto-merge not enabled on this repo" error gracefully (see Phase 3).

5. **Create branch** (skip if the harness has pinned a branch — see step 2). Slug = first ~40 chars of description, lowercased, non-alnum → `-`, collapsed:
   ```bash
   TS=$(date +%Y%m%d-%H%M%S)
   SLUG=<derive from description>
   BRANCH="oneshot/${TS}-${SLUG}"
   git checkout -b "$BRANCH"
   ```
   Remember `$BRANCH` for later phases.

---

## Phase 1 — Planning (one Plan subagent)

Launch ONE subagent via the Agent tool with `subagent_type: "Plan"`. Use this prompt verbatim, substituting `<description>`:

> You are running in unattended mode as part of a `/oneshot` pipeline. Use the project's `feature-planning` skill (at `.claude/skills/feature-planning/SKILL.md`) to produce ONE task file in `task-board/backlog/` for this request:
>
> `<description>`
>
> **You MUST NOT ask the user any clarifying questions.** Make reasonable assumptions and document each assumption in an "Assumptions" section inside the task file so a reviewer can see your reasoning. Follow the project's task file template and ensure the task has clear acceptance criteria and a testable definition of done.
>
> When you are completely finished, output ONLY the absolute path to the created task file as the LAST line of your response. Nothing after the path.

After the subagent returns:
- Extract the last non-empty line of its response.
- Validate it matches `task-board/backlog/.+\.md$` and the file exists (`test -f "$TASK_FILE"`).
- If validation fails, abort: "Planning subagent did not produce a valid task file. Aborting on branch $BRANCH — inspect manually."

---

## Phase 2 — Execution (one general-purpose subagent, model=sonnet)

Launch ONE subagent via the Agent tool with `subagent_type: "general-purpose"` and `model: "sonnet"`. Use this prompt verbatim, substituting `<task_path>`:

> You are running in unattended mode as part of a `/oneshot` pipeline. Implement the task at `<task_path>`.
>
> **Follow the rules in `.claude/skills/start-working/SKILL.md`** — load CLAUDE.md, respect domain invariants, run build verification (`dotnet build --configuration Release` for backend changes, `cd client && npm run build` for frontend changes), and move the task file from `backlog/` to `done/` with the Resolution section filled when complete.
>
> **DO NOT run any git commands.** No `git add`, `git commit`, `git push`, `git status`, `git diff` — none. The orchestrator handles all git operations after you finish.
>
> If you cannot complete the task (ambiguous requirements, unfixable build failure, missing dependency), STOP and explain the blocker. Do not push through with a half-broken implementation.
>
> When finished, output a one-paragraph summary of what changed (files touched, why, how it was verified). This summary will be used in the PR description.

After the subagent returns:
- Verify task file moved to `task-board/done/`. If not, abort: "Subagent did not complete task. Branch $BRANCH preserved for inspection."
- Verify the subagent did not commit (`git log origin/main..HEAD --oneline` should be empty). If it did, abort and tell the user to inspect.
- Save the subagent's summary paragraph as `$SUMMARY` for the PR body.

---

## Phase 3 — Commit, push, PR, auto-merge (orchestrator inline)

Mechanical work — no subagent needed.

1. **Re-verify builds locally** before pushing:
   ```bash
   dotnet build --configuration Release
   ```
   And if `client/` was touched:
   ```bash
   cd client && npm run build && cd ..
   ```
   If either fails, abort: do NOT push. Tell the user the branch name and which build failed.

2. **Derive title from task file**: read the H1 of the moved task file in `done/`; use it as the PR title prefixed with a conventional-commit type inferred from the changes (`feat:`, `fix:`, `refactor:`, etc.).

3. **Commit and push** (git via Bash):
   ```bash
   git add -A
   git commit -m "$(cat <<'EOF'
   <title>

   <body: one-line summary, then a "Task: <task_path>" line, then $SUMMARY>
   EOF
   )"
   git push -u origin "$BRANCH"
   ```

4. **Open the PR** with `mcp__github__create_pull_request`. Use the title from step 2; body should contain the Summary and a "Task: `<task_path>`" reference. Save the returned `number` as `$PR_NUMBER`.

5. **Enable auto-merge — robust loop**. Call `mcp__github__enable_pr_auto_merge` with `mergeMethod: "SQUASH"`. The MCP tool has two known quirks that the skill MUST handle:

   - **Quirk A — pre-CI gating**: when the PR's `mergeable_state` is `unstable` (= GitHub's term for "checks pending"), the tool returns `"required checks are failing"` even though no check has actually failed. This contradicts the whole purpose of auto-merge.
   - **Quirk B — post-CI gating**: when `mergeable_state` is `clean` (all checks passed), the tool refuses with `"already in clean status — merge directly"`.

   Handle both:

   ```
   result = enable_pr_auto_merge(SQUASH)
   if result is success:
       report success and exit
   if result.error contains "already" or "clean":
       # Quirk B — checks passed during the window between push and call
       merge_pull_request(merge_method: "squash") and exit
   if result.error contains "failing" or "unstable":
       # Could be Quirk A (pending) OR genuinely failed checks. Disambiguate:
       check_runs = pull_request_read(method: "get_check_runs")
       any_failed = any run with conclusion in {failure, cancelled, timed_out, action_required}
       all_done   = every run has status == "completed"
       if any_failed:
           abort: "CI failed before auto-merge could engage. PR #$PR_NUMBER left open for inspection. Failing checks: <list>."
       if all_done and not any_failed:
           # All green during the window — merge directly
           merge_pull_request(merge_method: "squash") and exit
       # else: still pending — this is Quirk A. Subscribe and wait.
       subscribe_pr_activity(prNumber: $PR_NUMBER)
       report: "Auto-merge enable was rejected by MCP tool while CI pending (known quirk). Subscribed to PR #$PR_NUMBER — will merge on green CI via webhook handler."
       exit (the session's webhook handler will merge when checks complete)
   if result.error contains "auto-merge" and "not enabled":
       # Repo doesn't allow auto-merge
       abort: "Repo has auto-merge disabled. Enable in Settings → General → 'Allow auto-merge', then merge PR #$PR_NUMBER manually."
   # any other error
   abort: "Failed to enable auto-merge on PR #$PR_NUMBER: <error>. PR is open; resolve manually."
   ```

   When handling the webhook in the "still pending" case, on each `<github-webhook-activity>` event for this PR: re-check `get_check_runs`. If all complete with no failures, call `merge_pull_request(squash)`. If any failed, report and stop.

6. **Report**: print the PR URL and the actual outcome — one of: "auto-merge enabled, will land on green CI" / "merged directly (CI was already green)" / "subscribed to PR — will merge when CI completes" / "merge blocked: <reason>".

---

## Failure modes — what to do

| Failure point | Action |
|---|---|
| Pre-flight check fails | Abort before creating branch. No cleanup needed. |
| Phase 1 subagent produces bad output | Branch exists but no commits. Tell user to delete with `git checkout main && git branch -D $BRANCH`. |
| Phase 2 subagent fails | Task file may be in `in-progress.md`. Branch has working-tree changes. Leave for user inspection. |
| Phase 3 build fails | Don't push. Same cleanup as Phase 2 failure. |
| `mcp__github__create_pull_request` fails | Branch is pushed but no PR. User can open manually or delete the branch. |
| `mcp__github__enable_pr_auto_merge` fails | Phase 3 step 5 logic dispatches to direct merge, webhook subscription, or hard abort depending on the error. The skill never just leaves a PR with no plan. |

In every failure case: **report what happened, the branch name, and the next step the user should take. Never silently fail.**
