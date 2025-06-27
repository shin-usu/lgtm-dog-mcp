#!/bin/bash

echo "Installing dependencies for LGTM Dog MCP..."
cd "$(dirname "$0")"

# Use nodenv node/npm
export PATH="/Users/usu-shin/.anyenv/envs/nodenv/shims:$PATH"

echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

echo "Installing dependencies..."
npm install

echo "Done!"