#!/bin/bash

echo "Testing LGTM Dog MCP Server..." >&2
echo "Node version: $(node --version)" >&2
echo "Working directory: $(pwd)" >&2

# Start the server
/Users/usu-shin/.anyenv/envs/nodenv/shims/node /Users/usu-shin/dev/lgtm-dog-mcp/dist/index.js