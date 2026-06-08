# Mac 安装与使用

这份说明面向普通 Mac 用户。安装一键三线表插件不需要安装 Node，也不需要打开终端运行本地服务。

## 下载

从 GitHub Releases 下载最新 DMG：

[一键三线表插件 Releases](https://github.com/Soulfree19/three-line-table-word/releases/latest)

当前版本的直接下载地址：

[three-line-table-word-1.1.0-github.dmg](https://github.com/Soulfree19/three-line-table-word/releases/download/v1.1.0/three-line-table-word-1.1.0-github.dmg)

## 首次安装

1. 下载并打开 `three-line-table-word-1.1.0-github.dmg`。
2. 双击 `一键三线表插件安装器.app`。
3. 看到安装完成提示后，完全退出 Microsoft Word。
4. 重新打开 Microsoft Word。
5. 在 Word 的“开始 > 加载项”中选择“一键三线表插件”。

如果 macOS 提示无法打开应用，请右键点击 `一键三线表插件安装器.app`，选择“打开”，再确认打开。

## 日常使用

1. 打开 Word 文稿。
2. 选中整个表格，或把光标放进表格。
3. 点击 Word“开始”选项卡里的“一键三线表”。
4. 如果需要自定义线宽、字体、字号或颜色，打开“三线表设置”。
5. 设置完成后可以保存为模板，下次点击模板即可直接套用。

## 常见问题

### Word 中没有看到插件

请完全退出 Word，然后重新打开。仍然没有看到时，请重新打开 DMG，再双击 `一键三线表插件安装器.app` 安装一次。

### 插件页面加载不出来

请确认电脑可以访问插件页面：

[https://soulfree19.github.io/three-line-table-word/](https://soulfree19.github.io/three-line-table-word/)

如果网络无法访问 GitHub Pages，Word 里也可能无法加载插件。

### 表格没有变化

请先选中整个表格，或至少把光标放在表格内部。若文档是旧版兼容模式，建议先另存为 `.docx` 后再试。

### 这个插件会上传我的文档吗

不会。插件代码在 Word 内运行，只修改当前文档里的表格格式；项目没有后台服务器，也不要求用户登录账号。
