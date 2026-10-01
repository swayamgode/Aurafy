# AI INSTRUCTIONS

You are working on this project as a coding agent.

Before modifying code:

1. Read PROJECT.md
2. Read DESIGN.md
3. Read CODE_RULES.md
4. Read COMPONENTS.md
5. Read UX.md
6. Read TASKS.md

These files are the project's source of truth.

Priority:

TASKS.md
→ current task and decisions

DESIGN.md
→ visual appearance

UX.md
→ interaction behavior

COMPONENTS.md
→ reusable UI architecture

CODE_RULES.md
→ implementation rules

PROJECT.md
→ project context

Do not invent conflicting rules.

Do not redesign existing UI unless explicitly requested.

Do not rewrite working code unnecessarily.

Before finishing a task:

- Verify the requested feature works.
- Verify responsive behavior.
- Verify design consistency.
- Update TASKS.md with completed work and important decisions.

Keep changes focused on the current task.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
