#!/usr/bin/env bash

# A script to scaffold a new vanilla userscript using .meta.user.js as a template

set -e

if [ -z "$1" ]; then
    echo "Usage: pnpm run new:vanilla <script-name-without-extension>"
    echo "Example: pnpm run new:vanilla my-awesome-script"
    exit 1
fi

SCRIPT_NAME=$1
TEMPLATE_FILE=".meta.user.js"
TARGET_FILE="src/${SCRIPT_NAME}.user.js"

if [ -f "$TARGET_FILE" ]; then
    echo "Error: $TARGET_FILE already exists."
    exit 1
fi

if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "Error: $TEMPLATE_FILE template not found in the root directory."
    exit 1
fi

# Copy the template and replace placeholders
cat "$TEMPLATE_FILE" | sed -e "s/<>/${SCRIPT_NAME}/g" > "$TARGET_FILE"

echo "" >> "$TARGET_FILE"
echo "(function() {" >> "$TARGET_FILE"
echo "    'use strict';" >> "$TARGET_FILE"
echo "    // Your code here..." >> "$TARGET_FILE"
echo "})();" >> "$TARGET_FILE"

echo "Created new vanilla userscript: $TARGET_FILE"
