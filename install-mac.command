#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

scripts/install-manifest-mac.sh

open -a "Microsoft Word" || true

echo "按任意键关闭这个窗口..."
read -r -n 1
