<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project context

**next-0000 is a multi-tenant portfolio platform.** Anyone registers; each
approved user gets a portfolio at `/:username` plus an admin panel. The root
serves the platform itself — homepage, registration, sign-in — not any one
person's portfolio. Many users.

The running code is not there yet: branch `development` is still single-tenant,
and the tenant surface lives unmerged on `feature/release-awesome/0010`. Read
`.claude/steering/product.md` for the target and `current-state.md` for the gap
**before** assuming what a route does.

Authoritative context lives in [`.claude/steering/`](.claude/steering/index.md).
Read it before writing code — it is maintained; comments and older docs are not.

| Read this | When |
|-----------|------|
| [`.claude/steering/current-state.md`](.claude/steering/current-state.md) | **First, always.** Branch topology, build health, known gaps. The repo is mid-flight. |
| [`.claude/steering/architecture.md`](.claude/steering/architecture.md) | Adding a route, a data path, or anything crossing a boundary. C4 diagrams + request flows + invariants. |
| [`.claude/steering/tech.md`](.claude/steering/tech.md) | Before writing code. Conventions and the Next.js 16 breaking changes that bind this repo. |
| [`.claude/steering/product.md`](.claude/steering/product.md) | What a route is for; what the content model means. |
| [`.claude/steering/structure.md`](.claude/steering/structure.md) | Deciding where a new file goes. |
| [`.claude/steering/decisions.md`](.claude/steering/decisions.md) | Before changing something that looks wrong. It may be deliberate. |
| [`.claude/steering/workflow.md`](.claude/steering/workflow.md) | Starting a feature. The spec-driven loop and the definition of done. |
| [`.claude/specs/`](.claude/specs/README.md) | Planned work, as `requirements.md` → `design.md` → `tasks.md`. |

Two things that bite immediately:

- **The build gate fails on a clean checkout.** Run `npm install` and
  `rm -rf .next` first, and confirm all four of `typecheck`, `lint`, `test`,
  `build` are green *before* starting, so you can tell your breakage from the
  pre-existing kind.
- **`.kiro/` is not authoritative.** It describes the unmerged multi-tenant
  branch and contradicts the running code in places — including the accent
  colour. When the two trees disagree, `.claude/steering/` wins.
