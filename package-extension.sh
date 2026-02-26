#!/bin/bash

# Script to package the Chrome extension for Chrome Web Store upload

echo "🎁 Packaging Chrome Extension for Web Store..."
echo ""

# Check if dist folder exists
if [ ! -d "dist" ]; then
  echo "❌ Error: dist folder not found. Please run 'npm run build' first."
  exit 1
fi

# Check if manifest exists in dist
if [ ! -f "dist/manifest.json" ]; then
  echo "❌ Error: manifest.json not found in dist folder."
  exit 1
fi

# Check if icons exist
if [ ! -d "dist/icons" ]; then
  echo "⚠️  Warning: icons folder not found in dist. Extension may be rejected."
fi

# Remove old package if it exists
if [ -f "wdywfm-chrome-extension.zip" ]; then
  echo "🗑️  Removing old package..."
  rm wdywfm-chrome-extension.zip
fi

# Create the zip file
echo "📦 Creating zip package..."
cd dist
zip -r ../wdywfm-chrome-extension.zip . -x "*.DS_Store" -x "__MACOSX/*"
cd ..

# Check if zip was created successfully
if [ -f "wdywfm-chrome-extension.zip" ]; then
  FILE_SIZE=$(du -h wdywfm-chrome-extension.zip | cut -f1)
  echo ""
  echo "✅ Package created successfully!"
  echo "📄 File: wdywfm-chrome-extension.zip"
  echo "📊 Size: $FILE_SIZE"
else
  echo "❌ Error: Failed to create package"
  exit 1
fi
