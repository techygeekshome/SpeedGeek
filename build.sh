#!/usr/bin/env bash
# Builds the release packages into dist/.
#   SpeedGeek.zip          Chrome, Edge, Brave, Opera, Vivaldi (unzip, then Load unpacked)
#   SpeedGeek-chrome.zip   same files, named for Chrome users
#   SpeedGeek-edge.zip     same files, named for Edge users
#   SpeedGeek-firefox.zip  Firefox package (Firefox manifest, files at the root)
set -euo pipefail
cd "$(dirname "$0")"
FILES="background.js defaults.js content.js popup.html popup.css popup.js options.html options.js icons"
OUT=dist; TMP=$(mktemp -d)
mkdir -p "$OUT"
rm -f "$OUT"/SpeedGeek*.zip

mkdir "$TMP/speedgeek"
cp -r $FILES manifest.json LICENSE "$TMP/speedgeek/"
(cd "$TMP" && zip -qr -X pkg.zip speedgeek)
for n in SpeedGeek SpeedGeek-chrome SpeedGeek-edge; do cp "$TMP/pkg.zip" "$OUT/$n.zip"; done

mkdir "$TMP/ff"
cp -r $FILES LICENSE "$TMP/ff/"
cp manifest.firefox.json "$TMP/ff/manifest.json"
(cd "$TMP/ff" && zip -qr -X ../ff.zip .)
cp "$TMP/ff.zip" "$OUT/SpeedGeek-firefox.zip"

rm -r "$TMP"
ls -l "$OUT"
