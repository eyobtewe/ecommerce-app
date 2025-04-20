#!/bin/bash
mkdir -p dist-zip

for file in dist/*.js; do
  name=$(basename "$file" .js)
  zip -j "dist-zip/$name.zip" "$file"
done

echo "✅ Zipped all Lambda functions to dist-zip/"
