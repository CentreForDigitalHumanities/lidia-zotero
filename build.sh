#!/bin/bash
set -euo pipefail

rm -rf build
mkdir build
zip -r build/lidia-annotations_v0.1.0.xpi *
cd build
jq ".addons[\"lidia-annotations@dig.hum.uu.nl\"].updates[0].update_hash = \"sha256:`shasum -a 256 lidia-annotations_v0.1.0.xpi | cut -d' ' -f1`\"" ../updates.json.tmpl > updates.json
