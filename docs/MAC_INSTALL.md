# Mac 安装与使用

## 首次安装

1. 解压发布包。
2. 双击 `install-mac.command`。
3. 双击 `start-mac.command`。
4. 如果首次启动时生成了证书，请打开“钥匙串访问”，信任 `certs/localhost.crt`。
5. 退出并重新打开 Microsoft Word。

## 日常使用

1. 双击 `start-mac.command`。
2. 保持终端窗口打开。
3. 打开 Word 文稿。
4. 选中整个表格，或把光标放进表格。
5. 点击 Word“开始”选项卡里的“一键三线表”。
6. 需要自定义时，打开“三线表设置”并保存模板。

## 常见问题

### Word 中没有看到插件

先完全退出 Word，再双击 `install-mac.command`，然后重新打开 Word。

### 插件页面加载不出来

确认 `start-mac.command` 的终端窗口还在运行，并且本机能打开：

```text
https://localhost:3000/taskpane.html
```

### 证书提示不可信

打开“钥匙串访问”，找到 `localhost` 证书，将“信任 > 使用此证书时”设置为“始终信任”，然后重启 Word。

### 表格没有变化

请先选中整个表格，或至少把光标放在表格内部。若文档是旧版兼容模式，建议先另存为 `.docx` 后再试。
