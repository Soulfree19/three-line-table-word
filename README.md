# 一键三线表插件

一键三线表插件是一个面向 Microsoft Word 的表格格式化工具，优先服务 Mac 用户。用户只需要在 Word 文稿中选中表格，或者把光标放进表格里，点击插件按钮，就可以把普通表格转换为科研论文常用的三线表。

当前版本：`1.0.0`

## 下载

推荐 Mac 用户下载 DMG 安装包：

[下载一键三线表插件 v1.0.0 DMG](https://github.com/Soulfree19/three-line-table-word/releases/download/v1.0.0/three-line-table-word-1.0.0-github.dmg)

也可以进入 GitHub 发布页查看所有文件：

[打开 GitHub Releases](https://github.com/Soulfree19/three-line-table-word/releases/latest)

## 适用环境

- macOS
- Microsoft Word for Mac
- 建议使用 `.docx` 文档
- 安装后需要能访问 GitHub Pages，因为插件页面托管在 GitHub Pages 上

## 安装方法

1. 下载 `three-line-table-word-1.0.0-github.dmg`。
2. 打开 DMG 文件。
3. 双击 `一键三线表插件安装器.app`。
4. 安装完成后，完全退出并重新打开 Microsoft Word。
5. 在 Word 的“开始 > 加载项”中找到“一键三线表插件”。

如果 macOS 提示“无法打开来自未认证开发者的应用”，请右键点击 `一键三线表插件安装器.app`，选择“打开”，再确认打开。

## 使用方法

1. 打开 Word 文稿。
2. 选中整个表格，或者把光标放在表格内部。
3. 点击 Word“开始”选项卡里的“一键三线表”。
4. 表格会自动调整为三线表格式。

需要自定义格式时，打开“三线表设置”，可以调整线宽、字体、字号、颜色，并保存为自己的模板。保存后的模板可以一键套用到新的表格。

## 功能

- 表格按窗口宽度自动调整。
- 表格、行、单元格底纹统一清为空白。
- 清除全部原有框线。
- 恢复整体表格上框线和下框线，默认 `0.75 pt` 黑色单线。
- 恢复第一行下框线，默认 `0.5 pt` 黑色单线。
- 可设置字体、字号、字体颜色和首行是否加粗。
- 可保存多个模板。
- 点击模板即可直接套用到当前选中的表格。

## 常见问题

### Word 中没有看到插件

请完全退出 Microsoft Word，然后重新打开。如果仍然没有看到，请再次打开 DMG，双击 `一键三线表插件安装器.app`。

### 插件页面打不开

请确认电脑可以访问：

[https://soulfree19.github.io/three-line-table-word/](https://soulfree19.github.io/three-line-table-word/)

### 表格没有变化

请确认已经选中表格，或者光标已经放在表格内部。旧版兼容模式文档建议先另存为 `.docx` 后再使用。

### 这个插件会上传我的文档吗

不会。插件代码在 Word 中运行，用来修改当前文档里的表格格式；项目没有后台服务器，也不需要用户登录账号。

## 开发者说明

本项目是 Office.js Word 加载项。普通用户不需要安装 Node，也不需要运行本地服务；下面内容仅用于开发和维护。

本地预览任务窗格：

```bash
npm run start
```

Mac 本地 HTTPS 侧载调试：

```bash
npm run cert
npm run start:https
npm run install:mac
```

代码检查：

```bash
npm run check
```

生成 GitHub Pages 和 DMG 发布包：

```bash
PUBLIC_BASE_URL=https://soulfree19.github.io/three-line-table-word npm run release:github
```

更多发布说明见：

- [Mac 安装与使用](docs/MAC_INSTALL.md)
- [GitHub DMG 发布](docs/GITHUB_RELEASE.md)
- [打包说明](docs/PACKAGING.md)
