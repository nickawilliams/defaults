# Agent Guidelines

Instructions for AI coding agents working on this project. Cross-repo
conventions (naming, Make style, repository layout) live in
[docs/conventions.md](docs/conventions.md); this file holds only what a
session working *here* must inherit.

## Entry Points

Make is the entrypoint for every operation; CI workflows are thin
wrappers over the same targets. `make help` lists them. Fan-out uses `%`
stem targets: `make build/eslint`, `make verify/typescript`.

## GitHub Conventions

### Issue titles

`<pkg>: <Summary>` — the prefix names the package the change touches
(`eslint: Adopt ESLint 10`). This deliberately diverges from bosun's
no-prefix rule: in a monorepo the prefix carries the package, and the
colon strips cleanly when tools derive slugs from the title.

Keep the summary short (roughly five words) and free of characters that
slug badly — no slashes (`6/7`), scoped package paths (`@eslint/js`),
commas, or parentheses. Spell those out in words; detail goes in the
body.

### Branches and PRs

Branches follow `<issue>-<slug>` (the `gh issue develop` default). The
enforce workflow (`.github/workflows/enforce.yaml`) parses the issue
number from the branch, rewrites the PR title to `pr(#<issue>):
<subject>`, and injects a `Closes #<issue>` reference into the body.

The repo is **merge-commit only** — squash and rebase merging are
disabled, and the merge commit title is the PR title. This is
load-bearing: the branch's individual conventional commits are what
reach the changelog, while the `pr(#N)` merge commit is conventional but
skipped. A squash merge would collapse a PR into a single skipped `pr`
commit and its changes would silently never release.

## Versioning

Releases are cut automatically per package by git-cliff from
conventional commit types alone (`.github/workflows/release.yaml`,
`cliff.toml`). Tags are `<pkg>/v<semver>`. A push to main starts a
five-minute debounce window; each further push resets it, and releases
cut only once main has been quiet for the full window.

### Commit types

The type decides whether a commit reaches the release notes — pick it
for the audience, not the diff. Nothing validates it: a type outside
this table fails `require_conventional` or is skipped, so a typo costs
the entry.

| Type       | Use for                                    | Release notes |
| ---------- | ------------------------------------------ | ------------- |
| `feat`     | New user-facing capability                 | New Features  |
| `fix`      | Corrected behavior                         | Fixes         |
| `refactor` | Internal restructuring, behavior unchanged | Improvements  |
| `perf`     | Faster, behavior unchanged                 | Improvements  |
| `docs`     | Documentation                              | Documentation |
| `chore`    | Maintenance, code formatting               | Miscellaneous |
| `build`    | Build, tooling, dependencies, **and CI**   | skipped       |
| `test`     | Tests and harness                          | skipped       |

Unlike bosun, `docs` and `chore` **render** here. That has a sharp
consequence: any rendering-type commit touching `packages/<pkg>/**`
makes that package releasable — a docs-only commit to a package cuts a
version bump. Scope commits accordingly; repo-root docs are safe.

**`build` covers CI.** Use `build(ci)`, `build(make)`,
`build(release)` — one type, area in the scope. `ci` and `release`
still parse (and skip) for the commits already in history; don't use
`ci` for new work. `release(<bump>): <version>` commits are created by
the pipeline, never by hand.

### The breaking-change bar

All packages are 0.x, where the project's policy is that breaking
changes land as **minor** bumps (0.x semver: minor is the breaking
slot). Peer-range widenings and dependency floor raises are minors, per
explicit decision — do not mark them with `!`.

The public surface is the shipped configs' observable behavior: which
lint rules are enabled, which compiler options a preset sets, which
plugins run, and the peer dependency ranges. Reserve the `!` marker for
changes that break a consumer's working setup with no diagnostic; a
change that fails loudly and names the migration is a warned migration,
not a break. `protect_breaking_commits` is on, so the marker is the
version decision — treat it as one.

## Polish-Before-Refactor Discipline

When work surfaces an architectural smell that's out of scope for the
current branch, capture the discovery — don't fix it silently and don't
expand scope. Paired action:

1. **At the smell site**, drop a one-line TODO referencing the open
   issue: `// TODO(arch #NN): <short smell name>`.
2. **In that issue**, append a one-line bullet describing the
   discovery. The issue holds the context; the inline TODO is how a
   future reader of the code finds it.

Both, not either. TODOs scatter without aggregate visibility; issues
are invisible at the point of patching.
