Read the session handoff and prepare to continue work.

Source of truth is the **code**, not the handoff or the spec. Use the handoff to find *where* work stopped, then verify everything against the actual codebase before trusting it.

Steps:

1. Read `HANDOFF.md` at the repo root. If it doesn't exist, say so and orient from the spec instead: `spec/README.md` (entry point + read order), then `spec/product.md` (what's live vs WIP) and `spec/workflows.md` (branch/DB/commands).

2. Read the `spec/` docs relevant to the handoff's "Next Steps" area:
   - Backend work → `spec/backend.md`, `spec/api.md`, `spec/data-models.md`
   - Frontend work → `spec/frontend.md`, `spec/api.md`
   - Behavior/rules → `spec/domain.md`
   - Always skim `spec/conventions.md` (do's/don'ts + known reality flags)

3. Check the actual state of the repo and verify the handoff against it:
   - `git branch --show-current`, `git log --oneline -5`, `git status`
   - Confirm the files the handoff claims it changed actually changed
   - Spot-check the claims against code (and, if relevant, run the project: `make dev`, backend `:8998` / frontend `:5995`) — if the handoff or a spec doc disagrees with the code, the **code is right**; flag the doc for fixing

4. Present a brief summary to the user:
   - Where we left off (from handoff)
   - What's next (the specific next action and why)
   - Any blockers or decisions needed
   - Whether the codebase matches the handoff — explicitly flag any discrepancy

5. Ask the user whether to continue with the next step or do something else.

Keep the summary short — 10 lines max. The user wants to get moving, not re-read the plan.
