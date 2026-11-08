# Kickoff prompt for Claude Code

Paste this as your first message in Claude Code, from the root of the new repo.

```text
We're building Formkoll, a phone-first PWA for my winter training and diet plan.

Read CLAUDE.md first, then docs/spec.md, docs/plan.md and seed/plan.json, and look at
the mockups in docs/mockups/ (start with index.html). The spec is the source of truth.

Start with Milestone 1 (Foundation) from the spec's build order, then Milestone 2 (Schedule)
once I approve. Before writing code, give me:

1. The repo layout you'll create.
2. The Drizzle schema for the tables Milestones 1 and 2 need, plus seed loading from
   seed/plan.json (targets, locations, schedule templates, weeks).
3. The lib/rules functions for Milestone 2 (week generation, Tuesday-frisbee variant,
   deload and diet-break flags, day type, targets lookup) with the test cases you'll write,
   including DST weeks in Europe/Stockholm.
4. The Railway setup: services, env vars, migrations on deploy.
5. Anything in the spec that's ambiguous or that you'd change, as a short list.

Wait for my OK, then implement Milestone 1. Use current docs for every library.
Keep docs/progress.md updated, and stop at the end of the milestone.
```

## After each milestone

```text
Milestone N looks good. Update docs/progress.md, then post your plan for Milestone N+1
the same way (layout changes, schema, lib/rules functions and tests, open questions)
and wait for my OK.
```
