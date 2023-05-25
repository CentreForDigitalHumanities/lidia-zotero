#!/bin/bash
set -euo pipefail

rm -rf build
mkdir build
# zip -r build/lidia-annotations-v0.2.0.xpi *
zip -r build/lidia-annotations-v0.2.0.xpi \
 chrome \
 vocabulary \
 bootstrap.js \
 chrome.manifest \
 install.rdf \
 LICENSE \
 manifest.json \
 out.js \
 package-lock.json \
 package.json \
 README.md \
 style.css
cd build
jq ".addons[\"lidia-annotations@cdh.uu.nl\"].updates[0].update_hash = \"sha256:`shasum -a 256 lidia-annotations-v0.2.0.xpi | cut -d' ' -f1`\"" ../updates.json.tmpl > updates.json
