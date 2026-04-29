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

3. **`gh` authenticated**:
   ```bash
   gh auth status
   ```
   Non-zero exit → abort.

4. **Repo has auto-merge enabled**:
   ```bash
   gh repo view --json autoMergeAllowed --jq .autoMergeAllowed
   ```
   Must print `true`. If `false`, abort: "GitHub auto-merge not enabled on this repo. Enable it in Settings → General → 'Allow auto-merge' before running /oneshot."

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

3. **Commit, push, PR, enable auto-merge**:
   ```bash
   git add -A
   git commit -m "$(cat <<'EOF'
   <title>

   <body: one-line summary, then a "Task: <task_path>" line, then $SUMMARY>

   🤖 Generated with /oneshot
   EOF
   )"
   git push -u origin "$BRANCH"
   PR_URL=$(gh pr create --title "<title>" --body "$(cat <<'EOF'
   ## Summary
   $SUMMARY

   ## Task
   See `<task_path>` for the full plan and acceptance criteria.

   ## Auto-merge
   This PR was opened by `/oneshot` and is configured to auto-merge once required checks pass.

   🤖 Generated with /oneshot
   EOF
   )")
   gh pr merge --auto --squash --delete-branch "$PR_URL"
   ```

4. **Report**: print the PR URL and a one-line status: "PR opened with auto-merge enabled. Will land on green CI."

---

## Failure modes — what to do

| Failure point | Action |
|---|---|
| Pre-flight check fails | Abort before creating branch. No cleanup needed. |
| Phase 1 subagent produces bad output | Branch exists but no commits. Tell user to delete with `git checkout main && git branch -D $BRANCH`. |
| Phase 2 subagent fails | Task file may be in `in-progress.md`. Branch has working-tree changes. Leave for user inspection. |
| Phase 3 build fails | Don't push. Same cleanup as Phase 2 failure. |
| `gh pr create` fails | Branch is pushed but no PR. User can open manually or delete the branch. |
| `gh pr merge --auto` fails | PR exists without auto-merge. User can enable manually via GitHub UI. |

In every failure case: **report what happened, the branch name, and the next step the user should take. Never silently fail.**
