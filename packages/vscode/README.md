# Visual Studio Code Extension Packs

A collection of curated Visual Studio Code extension packs for various development environments.

## Overview

This package provides a set of extension packs for Visual Studio Code that include recommended extensions for various development environments. These packs are designed to be paired with VS Code workspaces to provide a consistent development experience across projects and team members.

## Available Extension Packs

- **rogwilco.defaults-vscode** - Complete collection of all recommended extensions
- **rogwilco.defaults-vscode-general** - Essential extensions for general development
- **rogwilco.defaults-vscode-golang** - Recommended extensions for Go development
- **rogwilco.defaults-vscode-markdown** - Markdown editing extensions, optimized for GitHub-flavored markdown
- **rogwilco.defaults-vscode-others** - Extensions for miscellaneous languages and tools
- **rogwilco.defaults-vscode-python** - Python development toolkit
- **rogwilco.defaults-vscode-shell** - Shell scripting extensions for various systems
- **rogwilco.defaults-vscode-themes** - Collection of VS Code themes and related resources
- **rogwilco.defaults-vscode-typescript** - TypeScript and JavaScript development extensions
- **rogwilco.defaults-vscode-web** - Web development extensions

## Usage

### With VS Code Workspaces

A great use case for these extension packs is pairing them with VS Code workspaces. To use them this way:

1. Install the desired extension pack from the VS Code Marketplace
2. In your workspace settings file (`.vscode/settings.json`), recommend the extension pack:

```json
{
  "recommendations": [
    "rogwilco.defaults-vscode-typescript",
    "rogwilco.defaults-vscode-web"
  ]
}
```

This will prompt team members to install the recommended extensions when they open the workspace.

### Manual Installation

You can also install these extension packs directly from the VS Code Marketplace:

1. Open VS Code
2. Go to the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`)
3. Search for the desired extension pack (e.g., `rogwilco.defaults-vscode-typescript`)
4. Click "Install"

## Development

### Prerequisites

- [Bun](https://bun.sh/) - JavaScript runtime and package manager
- Node.js and npm

### Setup

```bash
# Install dependencies
bun install
```

### Generating Extension Packs

```bash
# Generate all extension packs
bun run generate
```

### Structure

- `bin/` - Scripts for generating extension packs
- `etc/extensions/` - Extension pack configurations
- `etc/template/` - Templates for generating package files

## License

BSD-2-Clause
