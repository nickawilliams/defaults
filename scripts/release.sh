#!/usr/bin/env bash
set -euo pipefail

# Local release orchestration script.
# Detects changed packages, generates changelogs, stamps versions, commits, and tags.
# Does NOT push — prints the push command for manual execution.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

make release

echo ""
echo "============================================"
echo "Release complete (local only). To push:"
echo ""
echo "  git push origin HEAD:main --tags"
echo ""
echo "============================================"
