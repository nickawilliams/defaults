SHELL := /usr/bin/env bash

# Package registry
PACKAGES := eslint prettier typescript vscode
NPM_PACKAGES := eslint prettier typescript

GIT_CLIFF ?= git-cliff
OUT_DIR := .out
DRY_RUN ?= 0

# Main Targets
# ============================================================================

.PHONY: default deps preflight build clean lint format format/check verify \
	changed release publish help \
	$(addprefix build/,$(PACKAGES)) \
	$(addprefix clean/,$(PACKAGES)) \
	$(addprefix verify/,$(PACKAGES)) \
	$(addprefix changed/,$(PACKAGES)) \
	release/github_actions \
	$(addprefix publish/,$(NPM_PACKAGES)) \
	publish/vscode

default: build

## Check required tools are available
preflight:
	@missing=0; \
	for tool in bun git $(GIT_CLIFF); do \
		if ! command -v "$$tool" >/dev/null 2>&1; then \
			echo "ERROR: Required tool not found: $$tool" >&2; \
			missing=1; \
		fi; \
	done; \
	if [ "$$missing" -eq 1 ]; then exit 1; fi; \
		echo "All required tools available"

## Install all dependencies
deps:
	@bun install
	@for pkg in $(PACKAGES); do \
		if [ -f "packages/$${pkg}/package.json" ] && grep -q '"dependencies"\|"devDependencies"' "packages/$${pkg}/package.json"; then \
			(cd "packages/$${pkg}" && bun install); \
		fi; \
	done

# Build
# ============================================================================

## Build all packages
build: $(addprefix build/,$(PACKAGES))

## Build eslint package
build/eslint:
	@echo "Building eslint..."
	@cd packages/eslint && bun run dist

## Build prettier package
build/prettier:
	@echo "Building prettier..."
	@cd packages/prettier && bun run dist

## Build typescript package
build/typescript:
	@echo "Building typescript (no-op)..."

## Build vscode extensions
build/vscode:
	@echo "Building vscode..."
	@$(MAKE) -C packages/vscode build

# Clean
# ============================================================================

## Clean all build artifacts
clean: $(addprefix clean/,$(PACKAGES))
	@rm -rf $(OUT_DIR)

## Clean eslint artifacts
clean/eslint:
	@rm -rf packages/eslint/dist

## Clean prettier artifacts
clean/prettier:
	@rm -rf packages/prettier/dist

## Clean typescript artifacts
clean/typescript:
	@echo "Nothing to clean for typescript"

## Clean vscode artifacts
clean/vscode:
	@$(MAKE) -C packages/vscode clean

# Lint & Format
# ============================================================================

## Lint entire repo
lint:
	@bun run lint

## Format entire repo
format:
	@bun run format

## Format check (no writes)
format/check:
	@bun run format:check

# Verify
# ============================================================================

## Full verification (lint + format check + build + verify per package)
verify: lint format/check build $(addprefix verify/,$(PACKAGES))

## Verify eslint package
verify/eslint: build/eslint
	@echo "Verifying eslint..."
	@cd packages/eslint && bun run verify

## Verify prettier package
verify/prettier: build/prettier
	@echo "Verifying prettier..."
	@cd packages/prettier && bun run verify

## Verify typescript package
verify/typescript:
	@echo "Verifying typescript (no-op)..."

## Verify vscode extensions
verify/vscode: build/vscode
	@echo "Verifying vscode..."
	@$(MAKE) -C packages/vscode validate

# Change Detection
# ============================================================================

## List packages with unreleased changes (one per line)
changed:
	@for pkg in $(PACKAGES); do \
		latest_tag=$$(git tag -l "$${pkg}/v*" --sort=-v:refname | head -n1); \
		if [ -z "$$latest_tag" ]; then \
			echo "$$pkg"; \
			continue; \
		fi; \
		changes=$$(git log "$${latest_tag}..HEAD" --oneline -- "packages/$${pkg}/"); \
		if [ -n "$$changes" ]; then \
			echo "$$pkg"; \
		fi; \
	done

## Check if a specific package has unreleased changes (exit 0=changed, 1=unchanged)
changed/%:
	@pkg="$*"; \
	latest_tag=$$(git tag -l "$${pkg}/v*" --sort=-v:refname | head -n1); \
	if [ -z "$$latest_tag" ]; then \
		exit 0; \
	fi; \
	changes=$$(git log "$${latest_tag}..HEAD" --oneline -- "packages/$${pkg}/"); \
	if [ -n "$$changes" ]; then \
		exit 0; \
	else \
		exit 1; \
	fi

# Versioning
# ============================================================================

## Print next semver for package (via git-cliff --bumped-version)
version/%:
	@pkg="$*"; \
	next=$$($(GIT_CLIFF) --config cliff.toml \
		--include-path "packages/$${pkg}/**" \
		--tag-pattern "$${pkg}/v[0-9].*" \
		--bumped-version 2>/dev/null); \
	if [ -z "$$next" ]; then \
		echo "ERROR: Unable to determine next version for $${pkg}" >&2; \
		exit 1; \
	fi; \
	echo "$$next"

## Print bump type (major/minor/patch)
version/bump_type/%:
	@pkg="$*"; \
	current=$$($(MAKE) --no-print-directory version/$$pkg); \
	prev_tag=$$(git tag -l "$${pkg}/v*" --sort=-v:refname | head -n1); \
	if [ -z "$$prev_tag" ]; then prev_tag="$${pkg}/v0.0.0"; fi; \
		clean_prev=$${prev_tag#$${pkg}/v}; \
		clean_curr=$${current#$${pkg}/v}; \
		prev_major=$$(printf '%s' "$$clean_prev" | cut -d. -f1); \
		prev_minor=$$(printf '%s' "$$clean_prev" | cut -d. -f2); \
		prev_patch=$$(printf '%s' "$$clean_prev" | cut -d. -f3); \
		curr_major=$$(printf '%s' "$$clean_curr" | cut -d. -f1); \
		curr_minor=$$(printf '%s' "$$clean_curr" | cut -d. -f2); \
		curr_patch=$$(printf '%s' "$$clean_curr" | cut -d. -f3); \
		prev_major=$${prev_major:-0}; prev_minor=$${prev_minor:-0}; prev_patch=$${prev_patch:-0}; \
		curr_major=$${curr_major:-0}; curr_minor=$${curr_minor:-0}; curr_patch=$${curr_patch:-0}; \
		bump=patch; \
		if [ "$$curr_major" != "$$prev_major" ]; then \
			bump=major; \
		elif [ "$$curr_minor" != "$$prev_minor" ]; then \
			bump=minor; \
		elif [ "$$curr_patch" != "$$prev_patch" ]; then \
			bump=patch; \
		fi; \
	echo "$$bump"

# Changelog & Release Notes
# ============================================================================

## Generate CHANGELOG.md for a package
changelog/%:
	@pkg="$*"; \
	version=$$($(MAKE) --no-print-directory version/$$pkg); \
	$(GIT_CLIFF) --config cliff.toml \
		--include-path "packages/$${pkg}/**" \
		--tag-pattern "$${pkg}/v[0-9].*" \
		--tag "$$version" \
		--output "packages/$${pkg}/CHANGELOG.md"

## Print release notes for a package to stdout
releasenotes/%:
	@pkg="$*"; \
	args=(--config cliff.toml \
		--include-path "packages/$${pkg}/**" \
		--tag-pattern "$${pkg}/v[0-9].*" \
		--strip header \
		--latest); \
	notes="$$($(GIT_CLIFF) "$${args[@]}" 2>/dev/null)"; \
	if [ -z "$$notes" ]; then exit 0; fi; \
	first_line=$$(printf '%s\n' "$$notes" | head -n1); \
	rest=$$(printf '%s\n' "$$notes" | tail -n +2); \
	if printf '%s' "$$first_line" | grep -q '^## '; then \
		first_line='## Release Notes'; \
	fi; \
	printf '%s\n' "$$first_line"; \
	if [ -n "$$rest" ]; then printf '%s\n' "$$rest"; fi

# Version Stamping
# ============================================================================

## Write version into package.json (requires RELEASE_VERSION=)
stamp/%:
	@if [ -z "$(RELEASE_VERSION)" ]; then \
		echo "ERROR: RELEASE_VERSION is required" >&2; \
		exit 1; \
	fi
	@pkg="$*"; \
	version=$${RELEASE_VERSION#$${pkg}/v}; \
	./scripts/stamp-version.sh "packages/$${pkg}/package.json" "$$version"

# Release
# ============================================================================

## Release all changed packages (generate artifacts, commit, tag — per package)
release:
	@changed_pkgs=$$($(MAKE) --no-print-directory changed); \
	if [ -z "$$changed_pkgs" ]; then \
		echo "No packages have unreleased changes"; \
		exit 0; \
	fi; \
	for pkg in $$changed_pkgs; do \
		version=$$($(MAKE) --no-print-directory version/$$pkg); \
		bump=$$($(MAKE) --no-print-directory version/bump_type/$$pkg); \
		echo "=== Releasing $${pkg} ($${version}, $${bump}) ==="; \
		$(MAKE) --no-print-directory release/$$pkg; \
		git add -A; \
		if ! git diff --cached --quiet; then \
			git commit -m "release($${bump}): $${version}"; \
		fi; \
		if git rev-parse "$${version}" >/dev/null 2>&1; then \
			git tag -d "$${version}" >/dev/null 2>&1 || true; \
		fi; \
		git tag -a "$${version}" -m "release($${bump}): $${version}"; \
		echo "Tagged $${version}"; \
		echo ""; \
	done

## Generate release artifacts for a specific package (no git ops)
release/%:
	@pkg="$*"; \
	version=$$($(MAKE) --no-print-directory version/$$pkg); \
	echo "Generating release artifacts for $${pkg} ($${version})..."; \
	RELEASE_VERSION="$$version" $(MAKE) --no-print-directory changelog/$$pkg; \
	RELEASE_VERSION="$$version" $(MAKE) --no-print-directory stamp/$$pkg; \
	echo "Release artifacts generated for $${pkg} ($${version})"

## Output release metadata to GITHUB_OUTPUT
release/github_actions:
	@output_file="$$GITHUB_OUTPUT"; \
	if [ -z "$$output_file" ]; then \
		echo "ERROR: GITHUB_OUTPUT is not set" >&2; \
		exit 1; \
	fi; \
	set -euo pipefail; \
	changed_pkgs=$$($(MAKE) --no-print-directory changed); \
	if [ -z "$$changed_pkgs" ]; then \
		echo "has_releases=false" >> "$$output_file"; \
		echo "release_tags=" >> "$$output_file"; \
		echo "release_json=[]" >> "$$output_file"; \
		exit 0; \
	fi; \
	tags=""; \
	json="["; \
	first=true; \
	for pkg in $$changed_pkgs; do \
		version=$$($(MAKE) --no-print-directory version/$$pkg); \
		tag="$$version"; \
		tags="$$tags $$tag"; \
		if [ "$$first" = true ]; then first=false; else json="$$json,"; fi; \
			json="$${json}{\"package\":\"$${pkg}\",\"tag\":\"$${tag}\"}"; \
		done; \
	json="$$json]"; \
	tags=$$(echo "$$tags" | sed 's/^ //'); \
	echo "has_releases=true" >> "$$output_file"; \
	echo "release_tags=$$tags" >> "$$output_file"; \
	echo "release_json=$$json" >> "$$output_file"

# Publish
# ============================================================================

## Publish all packages
publish: $(addprefix publish/,$(NPM_PACKAGES)) publish/vscode

## Publish a specific NPM package
publish/eslint publish/prettier publish/typescript:
	@pkg=$(subst publish/,,$@); \
	echo "Publishing $${pkg}..."; \
	cd packages/$${pkg}; \
	if [ "$(DRY_RUN)" = "1" ]; then \
		bun publish --dry-run; \
	else \
		bun publish; \
	fi

## Publish all VS Code extensions (delegates to vscode Makefile)
publish/vscode:
	@if [ "$(DRY_RUN)" = "1" ]; then \
		echo "Dry-run: packaging vscode extensions..."; \
		$(MAKE) -C packages/vscode dist; \
	else \
		$(MAKE) -C packages/vscode publish; \
	fi

## Publish a specific VS Code extension
publish/vscode/%:
	@if [ "$(DRY_RUN)" = "1" ]; then \
		echo "Dry-run: packaging vscode extension $*..."; \
		$(MAKE) -C packages/vscode dist/$*; \
	else \
		$(MAKE) -C packages/vscode publish/$*; \
	fi

# Help
# ============================================================================

## This help screen
help:
	@printf "Available targets:\n\n"
	@awk '/^[a-zA-Z\-\_0-9%:\\\/]+/ { \
		helpMessage = match(lastLine, /^## (.*)/); \
		if (helpMessage) { \
			helpCommand = $$1; \
			helpMessage = substr(lastLine, RSTART + 3, RLENGTH); \
			gsub("\\\\", "", helpCommand); \
			gsub(":+$$", "", helpCommand); \
			printf "  \x1b[32;01m%-35s\x1b[0m %s\n", helpCommand, helpMessage; \
		} \
	} \
	{ lastLine = $$0 }' $(MAKEFILE_LIST) | sort -u
	@printf "\n"
