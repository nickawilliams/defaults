#!/usr/bin/env bash
set -euo pipefail

# Usage: stamp-version.sh <package.json path> <version>
# Writes the given version into the specified package.json using bun.

PACKAGE_JSON="${1:?Usage: stamp-version.sh <package.json> <version>}"
VERSION="${2:?Usage: stamp-version.sh <package.json> <version>}"

if [ ! -f "$PACKAGE_JSON" ]; then
  echo "ERROR: File not found: $PACKAGE_JSON" >&2
  exit 1
fi

# Use bun to update the version field in-place
bun -e "
  const fs = require('fs');
  const path = process.argv[1];
  const version = process.argv[2];
  const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
  pkg.version = version;
  fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
  console.log('Stamped ' + path + ' -> ' + version);
" "$PACKAGE_JSON" "$VERSION"
