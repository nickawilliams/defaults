# Conventions

The prose layer over what this repo already ships as code. `packages/`
publishes the ESLint, Prettier, and TypeScript configs; `static/` holds
files meant to be copied into a project verbatim. This document records
the conventions that surround them — the ones that live in habit and
repetition rather than in a package.

It is descriptive of practice as of 2026-08, derived from `bosun`,
`shedoc`, `mcp`, `infrastructure`, `matchbox`, and the SuperAgent repos.
Where a rule has an obvious exception in an older repo, that is noted
rather than smoothed over.

**Scope.** Toolchain, naming, and repository layout. Infrastructure
conventions — partitions, state keys, DNS, zone ownership — are
normative in `infrastructure/docs/environments.md` and are not
duplicated here.

**Structure.** One file for now. The natural seams are Naming, Make,
TypeScript, and Repository Layout; split when one of them earns its own
file rather than in advance.

## Naming

### Slash separates levels; dash joins words within one level

A dash is not a stylistic alternative to a slash. It is what you fall
back to when the context has **no hierarchy to express**.

| Context | Separator | Why |
| --- | --- | --- |
| Make targets | `/` | A command tree: verb → what it applies to |
| S3 state keys | `/` | A real object path |
| SSM parameter paths | `/` | A real hierarchical namespace |
| npm package names | `-` | Flat namespace |
| 1Password item titles | `-` | Flat namespace |
| AWS resource names | `-` | Flat namespace — `Name` tags hold no path |
| Tag values | `-` | Flat namespace |

`common-mcp-vpc` is env + app + resource *flattened*, because an AWS
`Name` tag cannot hold a path. That makes
`replace(name_prefix, "-", "/")` an inverse operation rather than a
trick — it reconstitutes the hierarchy for a context that supports one.

**The inverse is lossy when a single level's own name contains a dash.**
`prod-mcp` → `prod/mcp` is correct; `prod-shipyard-mcp-console` →
`prod/shipyard/mcp/console` over-splits, because a within-name dash is
indistinguishable from a level boundary. Set the path explicitly in that
case rather than deriving it.

### Identifiers are `<repo>-<subthing>`

The same shape across every flat namespace:

| Axis | Example |
| --- | --- |
| npm packages | `@nickawilliams/defaults-eslint` |
| 1Password items | `mcp-bearer-graphiti`, `auth0-client-mcp-gc` |
| Service accounts | `op-service-account-mcp-terraform` |
| Owner tags | `terraform:mcp` |

1Password titles follow `<system>-<component>[-<instance>]`, kebab-case
— slot one is the system whose authority the credential covers.
Kebab-case matters because `op://` references then never need shell
quoting.

### Scope

`@nickawilliams/` is current. `@rogwilco/` is legacy and still present
in pre-rename repos; do not use it for new work.

For a monorepo, the package is `@nickawilliams/<repo>-<pkg>`. Name it
that way even when it is consumed as workspace source and not published
— the name is written into every import, so changing it later is a
repo-wide rename, while everything else about publishing is additive.

## Files and editors

`.editorconfig` is copied verbatim from `static/.editorconfig`. That is
the canonical copy; this repo's own root `.editorconfig` is narrower and
should be re-synced from `static/` rather than the reverse.

The Make override is load-bearing, not cosmetic:

```ini
[{[Mm]akefile,*.mk}]
indent_style = tab
```

Make requires literal tabs to open a recipe line while everything else
is 2-space. Without the override an editor silently converts recipe
indentation and every target fails with `missing separator`. The
`static/` pattern also catches lowercase `makefile` and `.mk` includes,
which a bare `[Makefile]` does not.

## TypeScript

Presets come from `@nickawilliams/defaults-typescript`, selected by
runtime rather than by project type:

| Preset | For |
| --- | --- |
| `base` | Any environment; strict baseline |
| `node` | Node.js runtime; adds `@types/node` globals |
| `bun` | Bun runtime |
| `bun-direct` | Scripts run directly, no emit |
| `bun-package` | Publishable packages, declaration emit |
| `web` / `web-bundler` | Browser, bundler-driven |
| `production` / `debug` | Overlays |

`extends` is written as an explicit array when chaining, even though the
presets self-chain:

```json
"extends": [
  "@nickawilliams/defaults-typescript/base",
  "@nickawilliams/defaults-typescript/bun-package"
]
```

### Split tsconfig for bundler projects

A project with both browser source and Bun-executed tooling files needs
two projects joined by a solution file. `vite.config.ts` and
`eslint.config.ts` cannot typecheck under a DOM/`noEmit` web preset, so
a single tsconfig does not work.

```jsonc
// tsconfig.json — solution file, owns no files
{ "files": [], "references": [
    { "path": "./tsconfig.web.json" },
    { "path": "./tsconfig.tools.json" }
] }

// tsconfig.web.json   → web-bundler, include ["src"]
// tsconfig.tools.json → bun-direct, include ["eslint.config.ts", "vite.config.ts"]
```

Reference implementation: `SuperAgent/console`.

## ESLint and Prettier

`.prettierrc` contains only the package name:

```json
"@nickawilliams/defaults-prettier"
```

`eslint.config.ts` puts `ignores` first, then spreads:

```ts
import config from '@nickawilliams/defaults-eslint'
import type { Linter } from 'eslint'

export default [
  { ignores: ['**/dist'] },
  ...config,
] satisfies Linter.Config[]
```

Framework rules are appended *after* the spread — `SuperAgent/console`
adds `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh` this
way.

`defaults-eslint` ships `typescript-eslint` and `eslint-config-prettier`
as real dependencies. A consumer should not redeclare them unless its
own config file imports them directly.

## Bun and workspaces

### `bunfig.toml`

Required, not optional — the scope block is what resolves the
`@nickawilliams/*` packages:

```toml
[run]
bun = true

[install.scopes]
nickawilliams = { url = "https://registry.npmjs.org/", token = "${NPM_TOKEN}" }
```

Private-registry variants exist (`docker-lambda-bun` points its scope at
GitHub Packages with `${GITHUB_TOKEN}`).

### Dependency placement

In a real workspace, the axis is root versus leaf:

- **Root** — universal policy and toolchain: the `defaults-*` packages,
  `typescript`, `eslint`, `prettier`, `@types/bun`.
- **Leaf** — framework tooling only: `vite`, `tailwindcss`, `@types/react`,
  and anything that leaf's own files directly import.

The SuperAgent repos duplicate the root set into every project, but only
because they are independent repos with no parent manifest — not as a
preference. `syncpack` appears there solely to police the resulting
version drift; a workspace removes the duplication and the need for the
tool.

### React in a shared package

A shared component package declares React as a **peerDependency**, never
a regular dependency. A second React copy in the tree breaks every hook
with "invalid hook call" — an install-time mistake that only surfaces at
runtime.

```jsonc
"peerDependencies": { "react": "^19.0.0", "react-dom": "^19.0.0" },
"devDependencies":  { "react": "^19.0.0", "react-dom": "^19.0.0" }
```

## Make

Make is the entrypoint for every project operation. CI invokes the same
targets, so anything CI does is reproducible locally by running the
identical command.

### Style

- `SHELL := /usr/bin/env bash` on line 1, blank line after
- `default: help` as a **real rule**. `.DEFAULT_GOAL` is not used, nor
  are `.ONESHELL`, `MAKEFLAGS`, `.DELETE_ON_ERROR`, or `.SHELLFLAGS`
- **`/`-namespaced, verb-first targets.** Bare verb = all;
  `verb/noun` = one thing; `verb/all` = explicit fan-out
- `# ====` sandwich dividers; all variables at the top, grouped by
  section
- `:=` for computed values; `?=` reserved for the override surface
  (tool binaries, prefixes, registries, knobs)
- One `.PHONY:` per section, not one block at the top
- `##` above every user-facing target; internal targets left
  unannotated
- `@` on essentially every recipe line, except where the raw command is
  meant to be visible
- `ERROR:` / `WARN:` / `INFO:` / `NOTE:` message prefixes. `ERROR:`
  always goes to `>&2` and is followed by `exit 1`. `->` for
  destinations
- Anything past roughly 20 recipe lines moves to `./scripts/*.sh`,
  invoked as `@./scripts/name.sh "$(ARG1)"`

### Parameterization

`%` stem targets, not override variables: `make build/eslint`, not
`make build PKG=eslint`. Override variables are for things that are not
the target's subject — `RELEASE_VERSION=`, `DRY_RUN=`, `PREFIX=`.

`$(MAKE) --no-print-directory <target>` is used as a function call to
reuse logic between targets.

### There is no `ci` target

CI calls the individual targets. `mcp/AGENTS.md` states workflows are
thin wrappers over them. `verify` is the local aggregate gate where one
is wanted.

### The Utils block

`help`, `vars`, and `_print-var` are copied verbatim into every project
and belong last, under a `# Utils` divider. `help` reads the `##`
annotations; `vars` introspects the Makefile's own variable assignments.

**Use the `\\\/` variant of the help awk regex.** Older copies
(`dcalc`, `matchbox`, `github-agent`) omit `/` from the character class,
so every `/`-namespaced target silently vanishes from `make help`:

```make
@awk '/^[a-zA-Z\-\_0-9%:\\\/]+/ { ...
```

Reference implementations: `defaults/Makefile` for a Bun monorepo,
`bosun/Makefile` for the fullest expression of the style.

There is no shared `.mk` include anywhere; the block is duplicated. That
is a known cost, accepted so far.

## Repository layout

### Directories

- `etc/` — configuration that is not required to sit at the root
- `var/` — build, test, and coverage output; gitignored
- `scripts/` — logic extracted out of Makefile recipes
- `docs/` — prose that outgrows the README

### Standard files

- **`AGENTS.md`** — the current convention for agent instructions
  (`bosun`, `mcp`). `CLAUDE.md` appears only in older repos. Keep it to
  what a session must inherit: build and CI entry points, deployment,
  commit conventions, and the project-specific rules that are not
  discoverable from the code.
- **`README.md`** — every repo.
- **`LICENSE.md`** — note the `.md` extension. BSD-2-Clause.
- **`ROADMAP.md`** — common, optional.
- **`.env` / `.env.example`** — `.env` holds only `op://` references,
  never literals, and is gitignored. Commit the example: it contains no
  secrets, and without it a fresh clone has no template. `bosun` does
  this; `mcp` and `infrastructure` currently do not.
- **`cliff.toml`** — git-cliff changelog config, for repos that publish.
- **`.tflint.hcl`** — for repos carrying Terraform. Identical in `mcp`
  and `infrastructure`; the `recommended` preset is what enforces
  documented variables.

### `.gitignore`

Composed per repo, but the Bun and Terraform halves are stable:

```
node_modules
dist
var

**/.terraform/*
*.tfstate
*.tfstate.*
*.tfplan

**/.env

.vscode
!.vscode/extensions.json
```

The `!.vscode/extensions.json` un-ignore shares recommended extensions
while keeping personal editor state out.

## CI

Workflows are thin wrappers over make targets. `defaults`'
`.github/workflows/verify.yaml` is the reference: every step is
literally `make <target>`, fan-out uses the `%` stem targets
(`make build/${{ matrix.package }}`), and `workflow_call:` lets
`release.yaml` reuse it rather than duplicating steps.

Because CI only ever calls targets, the workflow shape can be decided
late. A repo whose CI topology is not yet obvious should ship its
Makefile first and add the workflow once there is something real to
wrap.

## Commits

Conventional commits. Type `iac` scoped to the module for
infrastructure changes — `iac(mcp):`, `iac(common):`. Release commits
are `release(<bump>): <version>`.

`bosun` allows only merge commits — squash and rebase merging are
disabled — so merge subjects are the PR title plus ` (#N)`.
