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

2. **On main, up to date**:
   ```bash
   git rev-parse --abbrev-ref HEAD
   git fetch origin main
   git rev-list --count HEAD..origin/main
   ```
   If not on `main`, abort. If behind `origin/main`, abort: "Local main is behind origin — pull first."

3. **GitHub access available**:
   - Preferred: GitHub MCP tools (`mcp__github__*`). These are available in Claude Code on the web.
   - Fallback: the `gh` CLI (`gh auth status` returns 0).
   - If neither is available, abort: "No GitHub access — install `gh` or enable the GitHub MCP server."

4. **Repo has auto-merge enabled**: GitHub auto-merge must be turned on in repo settings.
   - With `gh`: `gh repo view --json autoMergeAllowed --jq .autoMergeAllowed` must print `true`.
   - With MCP only: there's no direct check, so proceed and treat a later `enable_pr_auto_merge` rejection with `auto-merge is not enabled for the repository` as the abort signal.
   - If disabled, abort: "GitHub auto-merge not enabled on this repo. Enable it in Settings → General → 'Allow auto-merge' before running /oneshot."

5. **Create branch** (slug = first ~40 chars of description, lowercased, non-alnum → `-`, collapsed):
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

3. **Commit and push**:
   ```bash
   git add -A
   git commit -m "$(cat <<'EOF'
   <title>

   <body: one-line summary, then a "Task: <task_path>" line, then $SUMMARY>

   🤖 Generated with /oneshot
   EOF
   )"
   git push -u origin "$BRANCH"
   ```

4. **Open the PR**:
   - With MCP: call `mcp__github__create_pull_request` (`base: "main"`, `head: $BRANCH`, `draft: false`). Capture the returned `number` as `$PR_NUMBER`.
   - With `gh`: `PR_URL=$(gh pr create --title "<title>" --body "...")` then derive `$PR_NUMBER` from the URL.

5. **Enable auto-merge — robustly** (this is the part that historically broke):

   **Why it's tricky:** GitHub computes `mergeable_state` asynchronously after a PR is opened. Calling `enable_pr_auto_merge` while the state is `unknown` or while checks are still queueing returns an error like `"The pull request is in unstable status (required checks are failing)"` — even when no check has actually failed. **A failed call does NOT set the auto-merge flag**, so if you don't retry, the PR will sit forever after CI goes green.

   Use this loop (MCP form shown; `gh pr merge --auto --squash` for the CLI form):

   ```
   for attempt in 1..6:
     status = mcp__github__pull_request_read(method="get", pullNumber=$PR_NUMBER)
     mergeable_state = status.mergeable_state
     # possible values: unknown, clean, unstable, blocked, behind, dirty, has_hooks, draft

     if mergeable_state == "clean":
       # All required checks already passed — just merge now, no auto-merge needed.
       mcp__github__merge_pull_request(pullNumber=$PR_NUMBER, merge_method="squash")
       BREAK with success

     if mergeable_state in ("unstable", "blocked", "behind"):
       # unstable = mergeable but checks running/failing
       # blocked = required reviews/checks not satisfied yet
       # These are valid auto-merge targets — try to schedule.
       try:
         mcp__github__enable_pr_auto_merge(pullNumber=$PR_NUMBER, mergeMethod="SQUASH")
         BREAK with success ("auto-merge scheduled")
       except error:
         if "auto-merge is not enabled for the repository" in error:
           ABORT — repo setting is off
         # otherwise transient — fall through to retry

     if mergeable_state == "dirty":
       ABORT — merge conflict, needs human resolution

     if mergeable_state == "draft":
       ABORT — PR was created as draft, cannot auto-merge

     # mergeable_state == "unknown" or transient enable_pr_auto_merge failure
     sleep 5 seconds
     # continue loop

   if no BREAK:
     ABORT — "Could not enable auto-merge after 6 attempts. PR $PR_NUMBER is open; enable manually."
   ```

   **Verification (mandatory):** after a successful `enable_pr_auto_merge`, re-fetch the PR and confirm `auto_merge` is non-null. If it's null, retry once more, then abort with instructions.

6. **Report**: print the PR URL and one of:
   - "PR #N merged directly (CI was already green)."
   - "PR #N opened with auto-merge scheduled (squash). Will land on green CI."
   - "PR #N opened but auto-merge could not be scheduled — enable manually: <reason>."

---

## Failure modes — what to do

| Failure point | Action |
|---|---|
| Pre-flight check fails | Abort before creating branch. No cleanup needed. |
| Phase 1 subagent produces bad output | Branch exists but no commits. Tell user to delete with `git checkout main && git branch -D $BRANCH`. |
| Phase 2 subagent fails | Task file may be in `in-progress.md`. Branch has working-tree changes. Leave for user inspection. |
| Phase 3 build fails | Don't push. Same cleanup as Phase 2 failure. |
| PR creation fails (`gh pr create` / `mcp__github__create_pull_request`) | Branch is pushed but no PR. User can open manually or delete the branch. |
| `enable_pr_auto_merge` rejected with `unstable` / `unknown` state | Re-fetch PR status and retry per the loop in Phase 3 step 5. A single failed call leaves auto-merge UNSET — never assume it succeeded without verifying `auto_merge` is non-null on the PR. |
| `enable_pr_auto_merge` rejected with `auto-merge is not enabled for the repository` | Repo setting is off. Abort and ask the user to enable it in Settings → General. |
| `mergeable_state == "dirty"` | Merge conflict — abort and ask the user to rebase. Auto-merge cannot proceed. |
| All retries exhausted | PR is open, auto-merge is NOT scheduled. Report the PR URL and tell the user to either merge manually or enable auto-merge from the GitHub UI. |

In every failure case: **report what happened, the branch name, and the next step the user should take. Never silently fail.**
