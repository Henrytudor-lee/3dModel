#!/bin/bash

# 3D Model Tool - Development Server Startup Script
# This script is used by the agent harness to start the development server
# and verify the application is working correctly.

set -e

echo "=== 3D Model Tool - Development Server Startup ==="
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Check environment variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "Warning: NEXT_PUBLIC_SUPABASE_URL is not set"
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "Warning: NEXT_PUBLIC_SUPABASE_ANON_KEY is not set"
fi

echo ""
echo "Starting development server on http://localhost:3000"
echo "Press Ctrl+C to stop"
echo ""

# Start the development server
npm run dev
