# Steering Index

**next-0000 is a multi-tenant portfolio platform.** Anyone registers, and each
approved user gets a portfolio at `/:username` plus an admin panel. The root is
the platform's own surface — homepage, registration, sign-in. There can be many
users.

The running code is not there yet. [product.md](./product.md) states the target
and marks the gap; [current-state.md](./current-state.md) says exactly where the
code stands.

Authoritative context for agents and developers working on **next-0000**. Read
these before writing code. They are the ground truth for *how this codebase
works*; the code is the ground truth for *what it currently does*.

## Read order

| # | Document | Read it when |
|---|----------|--------------|
| 1 | [current-state.md](./current-state.md) | **Always first.** Branch topology, build health, known gaps. The repo is mid-flight; this file says where. |
| 2 | [product.md](./product.md) | You need to know what a route is *for*, or what the content model means. |
| 3 | [architecture.md](./architecture.md) | You are adding a route, a data path, or anything crossing a boundary. C4 L1–L4 + request flows. |
| 4 | [tech.md](./tech.md) | You are about to write code. Stack, conventions, Next.js 16 traps. |
| 5 | [structure.md](./structure.md) | You are creating a new file and need to know where it goes. |
| 6 | [decisions.md](./decisions.md) | You disagree with how something is built, or are about to change it. |
| 7 | [workflow.md](./workflow.md) | You are starting a feature. The spec-driven loop this repo uses. |

## Relationship to `.kiro/`

This repo carries two doc trees. They are **not** interchangeable:

| Tree | Owner | Status |
|------|-------|--------|
| `.claude/steering/`, `.claude/specs/` | Claude Code (`.claude/settings/kfc-settings.json`) | **Authoritative.** Baselined on branch `development`. |
| `.kiro/steering/`, `.kiro/specs/` | Kiro IDE | Historical. Describes the multi-tenant design that landed with the `0010` merge, but states some things that were never true of the running code — including a violet accent where `globals.css` is emerald. A design record, not a description. |

When the two disagree, `.claude/steering/` wins for `development`. See
[current-state.md](./current-state.md#branch-history--0010-is-merged) for what the merge brought in.

## Rules for maintaining these docs

1. **A doc that lies is worse than no doc.** If you change behaviour these files
   describe, update them in the same commit as the code.
2. **Never describe aspiration as fact.** Planned work goes in `.claude/specs/`,
   with a status marker. Steering docs describe what exists.
3. **Cite the file.** Every claim about behaviour names the file that implements
   it, so a reader can verify it in one jump.
4. **Architecture decisions go in [decisions.md](./decisions.md)**, appended, never
   rewritten. Supersede an ADR; do not edit history.
