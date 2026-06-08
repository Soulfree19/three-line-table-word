# GitHub DMG 发布

这个项目可以做成 GitHub Pages + GitHub Releases 的分发方式：

- GitHub Pages 托管 Word 加载项页面。
- GitHub Releases 提供 `.dmg` 下载。
- DMG 里只有一个安装器 App，它会把远程版 `manifest.xml` 安装到用户的 Word 侧载目录。
- 用户电脑不需要安装 Node，也不需要保持终端服务运行。

## 1. 设置 GitHub Pages 地址

普通项目仓库默认地址通常是：

```text
https://你的GitHub用户名.github.io/仓库名
```

如果使用自定义域名，或仓库名不是默认 Pages 路径，请在 GitHub 仓库里设置变量：

```text
Settings > Secrets and variables > Actions > Variables
PUBLIC_BASE_URL=https://你的正式HTTPS地址
```

## 2. 推送到 GitHub

```bash
git add .
git commit -m "Prepare GitHub DMG release"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

推送到 `main` 后，`Deploy GitHub Pages` 工作流会发布插件网页。

## 3. 创建 Release DMG

```bash
git tag v1.1.0
git push origin v1.1.0
```

推送标签后，`Build DMG Release` 工作流会生成并上传：

```text
three-line-table-word-1.1.0-github.dmg
three-line-table-word-1.1.0-github.dmg.sha256
manifest.github.xml
```

用户进入 GitHub Releases 下载 `.dmg` 即可安装。

## 4. 本地生成 DMG

```bash
PUBLIC_BASE_URL=https://你的GitHub用户名.github.io/你的仓库名 npm run release:github
```

生成结果：

```text
dist/three-line-table-word-1.1.0-github.dmg
dist/three-line-table-word-1.1.0-github.dmg.sha256
dist/manifest.github.xml
dist/github-pages/
```

## 重要说明

当前 DMG 是未 notarize 的本地构建包。普通用户下载后，macOS 可能提示“无法打开来自未认证开发者的应用”。要做到更顺滑的双击安装体验，需要 Apple Developer ID 证书，并在发布流程里加入签名和 notarization。
