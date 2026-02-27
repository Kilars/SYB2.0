---
name: push-code
description: Commit and push code with automatic task discovery. Finds completed tasks from done/ since last commit and includes them in the commit message. Runs pre-push build validation.
---

# Push Code Skill

Commit and push code changes with intelligent commit message generation that includes completed tasks from the task board.

---

## When to Use

Use this skill when:
- Ready to commit and push changes
- User says "push", "commit", "push code", "ship it"
- Work session complete and changes need to be committed

---

## Workflow

### Phase 1: Gather State

Run these commands in parallel:

```bash
# Get git status
git status --porcelain

# Get staged and unstaged changes
git diff --stat

# Find tasks moved to done/ since last commit
git diff --name-status HEAD -- "task-board/done/"

# Recent commit history
git log -3 --oneline
```

### Phase 2: Pre-Push Validation

**CRITICAL**: Run build verification before committing.

```bash
# Backend build
dotnet build --configuration Release

# Frontend build (if frontend files changed)
cd client && npm run build
```

**If either build fails**: STOP. Fix the build errors before committing. Do NOT commit broken code.

### Phase 3: Identify Completed Tasks

Parse the git diff output for `task-board/done/` folder:

**Look for**:
- `A task-board/done/XXX-TYPE-name.md` — New task completed (added to done/)
- Files with pattern: `{number}-{TYPE}-{description}.md`

**Extract from each task file**:
- Task number (e.g., `001`)
- Task type (e.g., `FEATURE`, `REFACTOR`)
- Short description from filename

**Example**:
```
A task-board/done/001-FEATURE-guest-upgrade-flow.md
A task-board/done/002-REFACTOR-consolidate-utils.md
```

Becomes:
- `#001 FEATURE: guest-upgrade-flow`
- `#002 REFACTOR: consolidate-utils`

### Phase 4: Build Commit Message

**Format**:
```
{summary}

Tasks completed:
- #{number} {TYPE}: {description}

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Summary rules**:
- If 1 task: Use task description as summary
- If 2-3 tasks: Combine into short summary
- If 4+ tasks: Use "Multiple tasks completed" or group by type
- If no tasks: Summarize file changes

**Example — Single task**:
```
Add guest upgrade flow

Tasks completed:
- #001 FEATURE: guest-upgrade-flow

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Example — Multiple tasks**:
```
Improve user management and code quality

Tasks completed:
- #001 FEATURE: guest-upgrade-flow
- #002 REFACTOR: consolidate-utils
- #003 BUG: fix-leaderboard-flawless

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Example — No tasks**:
```
Update frontend styling and fix minor bugs

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Phase 5: Commit and Push

1. **Stage all changes**:
   ```bash
   git add -A
   ```

2. **Commit with generated message** (HEREDOC for multiline):
   ```bash
   git commit -m "$(cat <<'EOF'
   {commit message here}
   EOF
   )"
   ```

3. **Push to remote**:
   ```bash
   git push
   ```

4. **Verify**:
   ```bash
   git status
   git log -1 --oneline
   ```

---

## Edge Cases

### No changes to commit
```
Nothing to commit, working tree clean.
```

### Unpushed commits exist
Push existing commits before creating new one (or just push without committing).

### Task files modified but not moved to done/
Only include tasks that were ADDED to `done/` folder (status `A`), not modified (`M`).

### Build fails
STOP and fix the build before committing. Report the error to the user.

---

## Critical Rules

1. **Always run pre-push validation** — `dotnet build --configuration Release` + `cd client && npm run build`
2. **Always check git status first** — Don't commit if nothing to commit
3. **Only include tasks ADDED to done/** — Status `A`, not `M` or `D`
4. **Use HEREDOC for commit messages** — Ensures proper multiline formatting
5. **Never skip hooks** — No `--no-verify` flag
6. **Never force push** — No `--force` flag unless explicitly requested
7. **Report final state** — Show git status and last commit after push

---

## Triggering This Skill

User can invoke with:
- "push code"
- "commit and push"
- "ship it"
- "push changes"
- "commit this"
