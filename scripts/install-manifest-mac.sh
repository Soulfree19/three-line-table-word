#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEF_DIR="$HOME/Library/Containers/com.microsoft.Word/Data/Documents/wef"

mkdir -p "$WEF_DIR"
cp "$ROOT_DIR/manifest.xml" "$WEF_DIR/manifest.xml"

cat <<MESSAGE

Word add-in manifest installed:
  $WEF_DIR/manifest.xml

Next:
  1. Restart Microsoft Word.
  2. Open a document with a table.
  3. Use Home > Add-ins > 一键三线表插件.

MESSAGE
