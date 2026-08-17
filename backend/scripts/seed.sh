#!/bin/bash
set -e

echo "=== Running Data Migrations (Private Labels) ==="
for file in prisma/data-migrations/*.ts; do
  if [ -f "$file" ]; then
    echo "Running $file..."
    npx @dotenvx/dotenvx run -- npx tsx "$file"
  fi
done

echo "=== Loading Keepa Exports ==="
for file in ../keepa/exports/*.xlsx; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    npx @dotenvx/dotenvx run -- npx tsx scripts/parse-keepa.ts "$file"
  fi
done

echo "=== Seeding Complete ==="
