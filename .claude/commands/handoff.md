Write a session handoff document to `HANDOFF.md` at the repo root.

This is used to transfer context between Claude Code sessions. The next session reads this file to understand where work left off.

Source of truth is the **code**. `spec/` documents intent; if a doc and the code disagree, the code wins and the doc gets fixed. The handoff records where work stopped — it never overrides what the code actually says.

Steps:

1. Read the current state of the repo:
   - `git branch --show-current` (expect `dev` for work; `main` is the PR target)
   - `git log --oneline -10` for recent commits
   - `git status` for uncommitted work
   - What changed under `backend/` (`apps/`, `api/v1/`, `core/`) and `frontend/src/` (`features/`, `pages/`, `routes/`)
   - Whether any `spec/` doc was touched or now drifts from the change (see `spec/README.md` for the doc map)
   - If servers were run: backend `:8998`, frontend `:5995` — note if left running

2. Write `HANDOFF.md` with these sections:

   ## Last Session Summary
   - What was accomplished this session (2-3 sentences max)

   ## Branch & State
   - Current branch, ahead/behind origin, any uncommitted/unpushed work

   ## Completed
   - Tasks/changes finished and committed this session (with commit short-SHAs)

   ## In Progress
   - What was being worked on when the session ended; any partially done work

   ## Blocked or Needs Decision
   - Blockers, open questions, or decisions needed before continuing

   ## Next Steps
   - The specific next action to take
   - Any context the next session needs to pick up cleanly (files, area, why)

   ## Key Files Changed This Session
   - Files created or modified (path list)

   ## Reality Notes
   - Any place the code diverged from a `spec/` doc, and whether the doc was fixed or still needs fixing (cross-ref `spec/conventions.md` → "Known reality flags")

3. Keep it concise. The goal is a 60-second read that gets the next session productive immediately. No restating the spec — link to it (`spec/<file>.md`).

4. After writing, confirm to the user that the handoff is saved and state what the next session should start with.
