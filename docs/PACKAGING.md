# 发布打包

## 生成 Mac 本地发布包

```bash
npm run release:mac
```

生成结果：

```text
dist/three-line-table-word-1.1.0-mac-local.zip
dist/three-line-table-word-1.1.0-mac-local.sha256
```

发布包会包含运行所需的 HTML、CSS、JavaScript、图标、清单、Mac 安装脚本和用户文档；不会包含测试文档、证书私钥、Word 临时锁文件或开发生成的 `dist` 内容。

## 正式公开发布前

当前包是本地侧载版。公开发布前建议完成：

- 将 `taskpane.html`、`commands.html`、`src/`、`assets/` 部署到正式 HTTPS 域名。
- 将 `manifest.xml` 中所有 `https://localhost:3000` 替换为正式域名。
- 根据目标分发方式准备组织集中部署或 AppSource 审核材料。
- 增加隐私说明和支持页面地址。

## GitHub DMG 分发

见 `docs/GITHUB_RELEASE.md`。
