#!/bin/bash
# Deploy script for Bazzani Arcade

set -e

DEPLOY_DIR="/opt/caddy/sites/arcade"
VERSION=$(date +%Y%m%d%H%M%S)

echo "Building Expo web app..."
npx expo export --platform web

echo "Updating service worker cache version to $VERSION..."
sed -i "s/bazzani-arcade-v[0-9]*/bazzani-arcade-v$VERSION/" public/sw.js

echo "Copying public files to dist..."
cp -r public/* dist/

echo "Copying files to Caddy..."
sudo cp -r dist/* $DEPLOY_DIR/

echo "Done! Site updated at https://arcade.bazzani.info (v$VERSION)"
