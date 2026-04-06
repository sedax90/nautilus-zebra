#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/build"
UUID="nautilus-zebra@cristian"
ZIP_NAME="$UUID.zip"

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Version bump prompt
CURRENT_VERSION=$(grep -o '"version":[[:space:]]*[0-9]*' "$SCRIPT_DIR/metadata.json" | grep -o '[0-9]*')
echo "Current version: $CURRENT_VERSION"
read -p "Bump version to $((CURRENT_VERSION + 1))? [y/N] " BUMP
if [[ "$BUMP" =~ ^[yY]$ ]]; then
    NEW_VERSION=$((CURRENT_VERSION + 1))
    sed -i "s/\"version\":[[:space:]]*${CURRENT_VERSION}/\"version\": ${NEW_VERSION}/" "$SCRIPT_DIR/metadata.json"
    echo "Version: $CURRENT_VERSION -> $NEW_VERSION"
fi

# Copy source files
cp "$SCRIPT_DIR/metadata.json" "$BUILD_DIR/"
cp "$SCRIPT_DIR/extension.js" "$BUILD_DIR/"
cp "$SCRIPT_DIR/prefs.js" "$BUILD_DIR/"
cp "$SCRIPT_DIR/LICENSE" "$BUILD_DIR/"

# Copy schemas (GNOME Shell compiles them at install time)
mkdir -p "$BUILD_DIR/schemas"
cp "$SCRIPT_DIR/schemas/org.gnome.shell.extensions.nautilus-zebra.gschema.xml" "$BUILD_DIR/schemas/"

# Compile translations
for po in "$SCRIPT_DIR"/locale/*/LC_MESSAGES/nautilus-zebra.po; do
    lang_dir="$(dirname "$po")"
    lang="$(basename "$(dirname "$lang_dir")")"
    out_dir="$BUILD_DIR/locale/$lang/LC_MESSAGES"
    mkdir -p "$out_dir"
    msgfmt "$po" -o "$out_dir/nautilus-zebra.mo"
done

# Create ZIP
cd "$BUILD_DIR"
zip -r "$SCRIPT_DIR/$ZIP_NAME" .

# Cleanup
rm -rf "$BUILD_DIR"

echo "Created $SCRIPT_DIR/$ZIP_NAME"
