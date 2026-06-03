#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [[ ! -f "certs/localhost.crt" || ! -f "certs/localhost.key" ]]; then
  echo "首次启动：正在生成本地 HTTPS 证书..."
  npm run cert
  echo ""
  echo "请先在“钥匙串访问”中信任 certs/localhost.crt，然后重新双击 start-mac.command。"
  echo "按任意键关闭这个窗口..."
  read -r -n 1
  exit 0
fi

if curl -ksSfI https://localhost:3000/taskpane.html >/dev/null 2>&1; then
  echo "三线表插件服务已经在运行："
  echo "  https://localhost:3000/taskpane.html"
  open -a "Microsoft Word" || true
  echo "可以回到 Word 使用加载项。按任意键关闭这个窗口..."
  read -r -n 1
  exit 0
fi

echo "正在启动三线表插件服务..."
echo "保持这个窗口打开，Word 才能加载插件页面。"
open -a "Microsoft Word" || true
npm run start:https
