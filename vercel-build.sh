#!/bin/bash
# This script ensures that ESLint warnings don't fail the build process

# Set environment variable to prevent warnings from failing build
export CI=false
export ESLINT_NO_DEV_ERRORS=true
export DISABLE_ESLINT_PLUGIN=true

# Update browserslist database
echo "Updating browserslist database..."
npx update-browserslist-db@latest

# Run the build script
echo "Starting build process..."
npm run build