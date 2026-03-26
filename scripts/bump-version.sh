#!/usr/bin/env bash
# Bump version in package.json and src-tauri/tauri.conf.json simultaneously.
# Usage: ./scripts/bump-version.sh <major.minor.patch>
# Example: ./scripts/bump-version.sh 1.0.0

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PACKAGE_JSON="$REPO_ROOT/package.json"
TAURI_CONF="$REPO_ROOT/src-tauri/tauri.conf.json"

# --- Validation ---

if [ $# -ne 1 ]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 1.0.0"
  exit 1
fi

NEW_VERSION="$1"

# Validate semver format (major.minor.patch, optional pre-release)
if ! echo "$NEW_VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$'; then
  echo "Error: '$NEW_VERSION' is not a valid semver version."
  echo "Expected format: major.minor.patch (e.g., 1.0.0, 2.1.3-beta.1)"
  exit 1
fi

# --- Read current versions ---

OLD_PKG_VERSION=$(grep -o '"version": *"[^"]*"' "$PACKAGE_JSON" | head -1 | grep -o '"[^"]*"$' | tr -d '"')
OLD_TAURI_VERSION=$(grep -o '"version": *"[^"]*"' "$TAURI_CONF" | head -1 | grep -o '"[^"]*"$' | tr -d '"')

if [ "$OLD_PKG_VERSION" != "$OLD_TAURI_VERSION" ]; then
  echo "Warning: versions are out of sync!"
  echo "  package.json:      $OLD_PKG_VERSION"
  echo "  tauri.conf.json:   $OLD_TAURI_VERSION"
fi

if [ "$OLD_PKG_VERSION" = "$NEW_VERSION" ]; then
  echo "Version is already $NEW_VERSION. Nothing to do."
  exit 0
fi

# --- Apply version bump ---

# Use sed for in-place replacement to preserve exact file formatting
sed -i.bak "s/\"version\": \"$OLD_PKG_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$PACKAGE_JSON"
rm -f "$PACKAGE_JSON.bak"

sed -i.bak "s/\"version\": \"$OLD_TAURI_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$TAURI_CONF"
rm -f "$TAURI_CONF.bak"

# Also update Cargo.toml version
CARGO_TOML="$REPO_ROOT/src-tauri/Cargo.toml"
if [ -f "$CARGO_TOML" ]; then
  sed -i.bak "s/^version = \"[^\"]*\"/version = \"$NEW_VERSION\"/" "$CARGO_TOML"
  rm -f "$CARGO_TOML.bak"
fi

# --- Summary ---

echo ""
echo "Version bumped: $OLD_PKG_VERSION -> $NEW_VERSION"
echo ""
echo "Updated files:"
echo "  - package.json"
echo "  - src-tauri/tauri.conf.json"
echo "  - src-tauri/Cargo.toml"
echo ""
echo "Next steps:"
echo "  git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml"
echo "  git commit -m \"chore: bump version to $NEW_VERSION\""
echo "  git tag v$NEW_VERSION"
echo "  git push origin main --tags"
