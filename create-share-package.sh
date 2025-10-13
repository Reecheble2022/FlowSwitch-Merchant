#!/bin/bash

# FlowSwitch Project - Create Share Package
# This script creates a ZIP file ready to share with developers

echo "🚀 Creating FlowSwitch Share Package..."
echo ""

# Go to parent directory
cd "$(dirname "$0")/.."

PROJECT_NAME="flowswitch-project"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="${PROJECT_NAME}_${TIMESTAMP}.zip"

echo "📦 Creating ZIP file (excluding node_modules and dist)..."
echo ""

# Create ZIP excluding large folders
zip -r "$OUTPUT_FILE" project/ \
  -x "project/node_modules/*" \
  -x "project/dist/*" \
  -x "project/.git/*" \
  -x "project/.DS_Store" \
  -x "project/*.log"

# Get file size
SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')

echo ""
echo "✅ Done! Created: $OUTPUT_FILE"
echo "📊 File size: $SIZE"
echo ""
echo "📤 Share this file via:"
echo "   • Email (if under 25MB)"
echo "   • Google Drive / Dropbox"
echo "   • WeTransfer"
echo "   • GitHub"
echo ""
echo "⚠️  Remember to share the .env file separately via secure channel!"
echo ""
