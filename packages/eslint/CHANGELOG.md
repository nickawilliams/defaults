# Changelog
## [eslint/v0.4.1](https://github.com/nickawilliams/defaults/compare/8c7af69297cf018989d5fa27ca869ad4d1f8da9c...eslint/v0.4.1) - 2026-08-30

### Fixes

- **Eslint:** Use the directory form for repository metadata - ([8c7af69](https://github.com/nickawilliams/defaults/commit/8c7af69297cf018989d5fa27ca869ad4d1f8da9c))

## [eslint/v0.4.0](https://github.com/nickawilliams/defaults/compare/4ed66da8544ba4573cc915f9b59468dd0680a8a5...eslint/v0.4.0) - 2026-08-30

### New Features

- **Eslint:** Adopt ESLint 10 - ([4ed66da](https://github.com/nickawilliams/defaults/commit/4ed66da8544ba4573cc915f9b59468dd0680a8a5))

### Improvements

- **Eslint**

  - Drop the deprecated eol-last rule - ([b5dc673](https://github.com/nickawilliams/defaults/commit/b5dc673b7fdc6f7d7dc8bc30d7aadff37f0dd32a))
  - Migrate from ts.config() to defineConfig - ([4a6e154](https://github.com/nickawilliams/defaults/commit/4a6e15456343d14a9c5c6d9659b5a46cc9fd3ce4))

### Fixes

- **Eslint**

  - Make the CJS entry point reachable - ([7edb5d1](https://github.com/nickawilliams/defaults/commit/7edb5d1da0292dbc540fd8325a45cfe3a673666a))
  - Remove tsconfigRootDir override from the shared config - ([b1532ad](https://github.com/nickawilliams/defaults/commit/b1532addfb39d00089293bb94c391f5d0f9c4065))
  - Flatten the CJS default export to module.exports - ([a94b343](https://github.com/nickawilliams/defaults/commit/a94b343206c32a005c0bea2e437fba4d3e57e6f9))

## [eslint/v0.3.0](https://github.com/nickawilliams/defaults/compare/e8a8ec720abac4450bb25be8d60056a106bf839e...eslint/v0.3.0) - 2026-02-09

### New Features

- **Eslint**

  - Added eslint defaults - ([e8a8ec7](https://github.com/nickawilliams/defaults/commit/e8a8ec720abac4450bb25be8d60056a106bf839e))
  - Added bin execeutable for initializing the eslint config - ([1fc9bf0](https://github.com/nickawilliams/defaults/commit/1fc9bf08b34afb7406e20e87c82f6f54cee441f9))
  - Configured @typescript-eslint/no-unused-vars to ignore variables prefixed with "_" - ([f43a16e](https://github.com/nickawilliams/defaults/commit/f43a16e44466ec01c837cdf9ea1c4e5614e96580))

### Fixes

- **Eslint**

  - Moved @types/eslint-config-prettier to dependencies so that consumers get the needed types - ([2caf342](https://github.com/nickawilliams/defaults/commit/2caf34255da7c33f33037968bc17b006edba54c3))
  - Added jiti as a dependency so eslint stops complaining - ([cedf63b](https://github.com/nickawilliams/defaults/commit/cedf63b35c2dc080e716c065ba32a111fd8b1904))
  - Removed incorrect type for the default config export - ([77931da](https://github.com/nickawilliams/defaults/commit/77931da174ddf77d7a9a8a7dd74e39a0b5f53b73))
  - Updated incorrect type for the default config export - ([181c986](https://github.com/nickawilliams/defaults/commit/181c9865b68e0fc54d7e20a27513e58bccda21a8))
  - Add missing repository field to package.json - ([2b943d6](https://github.com/nickawilliams/defaults/commit/2b943d6c91cc636bf3123e538e8e695ac6e82933))

### Miscellaneous

- Updated packages to dogfood the typescript defaults - ([0f7d80b](https://github.com/nickawilliams/defaults/commit/0f7d80ba1eeee7d110ee8460221f75e53b9e9b67))
- **Eslint:** Migrate npm scope to @nickawilliams - ([083af02](https://github.com/nickawilliams/defaults/commit/083af02eea1e106b2e2cca19d84b4b25a8812967))

