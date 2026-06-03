# 一键三线表插件

这是一个优先服务 Word for Mac 的 Office.js 加载项。用户先选中 Word 表格，点击功能区里的“一键三线表”，即可按当前模板把表格改成科研论文常用三线表。

当前版本：`1.0.0`

## 已实现功能

- 表格按窗口宽度自动调整。
- 表格、行、单元格底纹统一清为空白。
- 清除全部原有框线。
- 恢复整体表格上框线和下框线，默认 `0.75 pt` 黑色单线。
- 恢复第一行下框线，默认 `0.5 pt` 黑色单线。
- 可设置字体、字号、字体颜色和首行是否加粗。
- 可保存多个模板；点击模板会立即按模板应用到选中表格。
- 功能区按钮支持直接使用当前模板一键应用。

## 本地运行

先生成图标：

```bash
npm run icons
```

浏览器预览任务窗格：

```bash
npm run start
```

打开：

```text
http://localhost:3000/taskpane.html
```

## Word for Mac 侧载

Office 加载项开发建议使用 HTTPS。本项目不依赖 npm 包，使用本地自签名证书。

### Mac 快速方式

首次安装或更新插件清单：

```bash
./install-mac.command
```

日常使用前启动本地 HTTPS 服务：

```bash
./start-mac.command
```

也可以直接在 Finder 里双击这两个 `.command` 文件。`start-mac.command` 对应的终端窗口需要保持打开，Word 才能加载插件页面。

### 手动方式

1. 生成证书。

```bash
npm run cert
```

2. 在“钥匙串访问”中信任 `certs/localhost.crt`。

3. 启动 HTTPS 服务。

```bash
npm run start:https
```

4. 复制 `manifest.xml` 到 Word 的侧载目录。若 `wef` 文件夹不存在，请创建它。

```text
/Users/<你的用户名>/Library/Containers/com.microsoft.Word/Data/Documents/wef
```

也可以运行：

```bash
npm run install:mac
```

5. 重启 Word，打开任意文档，在“开始 > 加载项”中选择“一键三线表插件”。

## 使用方式

1. 在 Word 文稿中选中整个表格，或把光标放在表格内。
2. 点击“开始”选项卡里的“一键三线表”。
3. 如需改线宽、字体或颜色，打开“三线表设置”。
4. 设置好后输入模板名称并保存；之后点击模板即可直接套用。

## 发布打包

生成 Mac 本地发布包：

```bash
npm run release:mac
```

生成的文件位于 `dist/`：

```text
three-line-table-word-1.0.0-mac-local.zip
three-line-table-word-1.0.0-mac-local.sha256
```

更多说明见 `docs/MAC_INSTALL.md` 和 `docs/PACKAGING.md`。

## GitHub DMG 分发

面向普通用户分发时，可以使用 GitHub Pages 托管插件网页，并在 GitHub Releases 提供 DMG：

```bash
PUBLIC_BASE_URL=https://你的GitHub用户名.github.io/你的仓库名 npm run release:github
```

DMG 发布流程见 `docs/GITHUB_RELEASE.md`。

## 开发检查

```bash
npm run check
```

## 参考依据

- Microsoft Learn: Word add-ins use Office.js and support Word on Mac.
- Microsoft Learn: Mac testing can sideload an add-in-only `manifest.xml`.
- Microsoft Learn: Word table APIs include `autoFitWindow()`, `shadingColor`, `getBorder()` and row/cell formatting.
