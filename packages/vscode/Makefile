ROOT_DIR := $(shell pwd)
ROOT_CONFIG := $(ROOT_DIR)/etc/extensions
ROOT_INPUT := $(ROOT_DIR)/etc/template
ROOT_BUILD := $(ROOT_DIR)/var/build
ROOT_DIST := $(ROOT_DIR)/var/dist

# bunx resolves the @vscode/vsce devDependency's binary regardless of
# the recipe's working directory; a bare vsce is never on CI's PATH.
VSCE ?= bunx vsce

## Clean up all generated files
clean:
	@ rm -rf \
		node_modules \
		var

## Validate all extensions
validate:
	@ for extension in $(wildcard $(ROOT_CONFIG)/*); do \
		extname=$$(basename $$extension); \
		$(MAKE) validate/$$extname; \
	done

## Validate a specific extension
validate/%:
	@ bin/validate.sh "$(ROOT_CONFIG)/$(subst *,,$*)"

## Build all extensions
build:
	@ for extension in $(wildcard $(ROOT_CONFIG)/*); do \
		extname=$$(basename $$extension); \
		$(MAKE) build/$$extname; \
	done

## Build a specific extension
build/%: node_modules validate/%
	@ bin/generate.ts "$(ROOT_CONFIG)/$(subst *,,$*)" "$(ROOT_INPUT)" "$(ROOT_BUILD)/$(subst *,,$*)"

dist:
	@ for extension in $(wildcard $(ROOT_CONFIG)/*); do \
		extname=$$(basename $$extension); \
		$(MAKE) dist/$$extname; \
	done

## Create the distributable for a specific extension
dist/%: build/%
	@ cd "$(ROOT_BUILD)/$(subst *,,$*)" && \
		$(VSCE) package && \
		mkdir -p "$(ROOT_DIST)" && \
		mv *.vsix "$(ROOT_DIST)/"

## Publish all extensions
publish:
	@ for extension in $(wildcard $(ROOT_CONFIG)/*); do \
		extname=$$(basename $$extension); \
		$(MAKE) publish/$$extname; \
	done

## Publish a specific extension
publish/%: dist/%
	@ cd "$(ROOT_DIST)" && \
		if [ "$*" = "_all" ]; then \
			$(VSCE) publish --packagePath defaults-vscode-*.vsix; \
		else \
			$(VSCE) publish --packagePath defaults-vscode-$(subst *,,$*)-*.vsix; \
		fi

.PHONY: clean validate validate/% build/% dist/% publish/% publish

node_modules:
	@ bun install
