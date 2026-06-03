import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { chmod, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(process.cwd());
const args = new Set(process.argv.slice(2));
const webOnly = args.has("--web-only");
const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const version = packageJson.version;
const distDir = join(root, "dist");
const pagesDir = join(distDir, "github-pages");
const hostedManifestPath = join(distDir, "manifest.github.xml");
const releaseBaseName = `three-line-table-word-${version}-github`;
const dmgRoot = join(distDir, `${releaseBaseName}-dmg-root`);
const dmgPath = join(distDir, `${releaseBaseName}.dmg`);
const dmgHashPath = join(distDir, `${releaseBaseName}.dmg.sha256`);
const localBaseUrl = "https://localhost:3000";

function normalizePublicBaseUrl(value) {
  if (!value) {
    throw new Error(
      [
        "Missing PUBLIC_BASE_URL.",
        "Example:",
        "  PUBLIC_BASE_URL=https://yourname.github.io/your-repo npm run release:github"
      ].join("\n")
    );
  }

  const url = new URL(value);
  if (url.protocol !== "https:") {
    throw new Error("PUBLIC_BASE_URL must start with https://");
  }

  return url.toString().replace(/\/$/, "");
}

const publicBaseUrl = normalizePublicBaseUrl(process.env.PUBLIC_BASE_URL);

function run(command, argsToRun, options = {}) {
  const result = spawnSync(command, argsToRun, {
    cwd: options.cwd || root,
    encoding: "utf8",
    stdio: options.stdio || "pipe"
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${argsToRun.join(" ")} failed\n${result.stderr || result.stdout}`);
  }

  return result.stdout;
}

async function sha256(filePath) {
  const bytes = await readFile(filePath);
  return createHash("sha256").update(bytes).digest("hex");
}

async function copyWebItem(item) {
  const source = join(root, item);
  if (!existsSync(source)) {
    throw new Error(`Missing web item: ${item}`);
  }

  await cp(source, join(pagesDir, item), {
    recursive: true,
    filter: (sourcePath) => {
      const name = basename(sourcePath);
      return name !== ".DS_Store" && !name.startsWith("~$");
    }
  });
}

async function buildPagesAndManifest() {
  await rm(pagesDir, { recursive: true, force: true });
  await mkdir(pagesDir, { recursive: true });

  for (const item of ["taskpane.html", "commands.html", "assets", "src"]) {
    await copyWebItem(item);
  }

  await writeFile(
    join(pagesDir, "index.html"),
    [
      "<!doctype html>",
      '<html lang="zh-CN">',
      "  <head>",
      '    <meta charset="utf-8">',
      '    <meta name="viewport" content="width=device-width, initial-scale=1">',
      "    <title>一键三线表插件</title>",
      '    <meta http-equiv="refresh" content="0; url=taskpane.html">',
      "  </head>",
      "  <body>",
      '    <p><a href="taskpane.html">打开一键三线表插件加载页</a></p>',
      "  </body>",
      "</html>",
      ""
    ].join("\n")
  );

  const manifest = await readFile(join(root, "manifest.xml"), "utf8");
  const hostedManifest = manifest.replaceAll(localBaseUrl, publicBaseUrl);
  await writeFile(hostedManifestPath, hostedManifest);
  await cp(hostedManifestPath, join(pagesDir, "manifest.xml"));
}

async function writeInstallerApp(hostedManifest) {
  const appPath = join(dmgRoot, "一键三线表插件安装器.app");
  const contentsPath = join(appPath, "Contents");
  const macosPath = join(contentsPath, "MacOS");
  const resourcesPath = join(contentsPath, "Resources");

  await mkdir(macosPath, { recursive: true });
  await mkdir(resourcesPath, { recursive: true });

  await writeFile(
    join(contentsPath, "Info.plist"),
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
      '<plist version="1.0">',
      "<dict>",
      "  <key>CFBundleDevelopmentRegion</key>",
      "  <string>zh_CN</string>",
      "  <key>CFBundleDisplayName</key>",
      "  <string>一键三线表插件安装器</string>",
      "  <key>CFBundleExecutable</key>",
      "  <string>install</string>",
      "  <key>CFBundleIdentifier</key>",
      "  <string>com.threelinetable.word.installer</string>",
      "  <key>CFBundleInfoDictionaryVersion</key>",
      "  <string>6.0</string>",
      "  <key>CFBundleName</key>",
      "  <string>一键三线表插件安装器</string>",
      "  <key>CFBundlePackageType</key>",
      "  <string>APPL</string>",
      "  <key>CFBundleShortVersionString</key>",
      `  <string>${version}</string>`,
      "  <key>CFBundleVersion</key>",
      `  <string>${version}</string>`,
      "  <key>LSMinimumSystemVersion</key>",
      "  <string>11.0</string>",
      "  <key>NSHighResolutionCapable</key>",
      "  <true/>",
      "</dict>",
      "</plist>",
      ""
    ].join("\n")
  );

  await writeFile(join(resourcesPath, "manifest.xml"), hostedManifest);
  await writeFile(
    join(resourcesPath, "README.txt"),
    [
      "一键三线表插件",
      "",
      "双击“一键三线表插件安装器.app”后，它会把 Word 加载项清单复制到当前用户的 Word 侧载目录。",
      "安装后请完全退出并重新打开 Microsoft Word。",
      "",
      `插件页面：${publicBaseUrl}/taskpane.html`,
      ""
    ].join("\n")
  );

  const executable = [
    "#!/bin/zsh",
    "set -euo pipefail",
    "",
    'RESOURCES_DIR="$(cd "$(dirname "$0")/../Resources" && pwd)"',
    'WEF_DIR="$HOME/Library/Containers/com.microsoft.Word/Data/Documents/wef"',
    'mkdir -p "$WEF_DIR"',
    'cp "$RESOURCES_DIR/manifest.xml" "$WEF_DIR/manifest.xml"',
    "",
    "button=$(osascript <<'APPLESCRIPT'",
    'set dialogResult to display dialog "一键三线表插件已安装到 Word。请完全退出并重新打开 Microsoft Word，然后在“开始 > 加载项”中选择“一键三线表插件”。" buttons {"打开 Word", "完成"} default button "打开 Word" with title "一键三线表插件安装器"',
    "button returned of dialogResult",
    "APPLESCRIPT",
    ")",
    "",
    'if [[ "$button" == "打开 Word" ]]; then',
    '  open -a "Microsoft Word" || true',
    "fi",
    ""
  ].join("\n");

  const executablePath = join(macosPath, "install");
  await writeFile(executablePath, executable);
  await chmod(executablePath, 0o755);

  const signResult = spawnSync("codesign", ["--force", "--deep", "--sign", "-", appPath], {
    cwd: root,
    encoding: "utf8",
    stdio: "pipe"
  });

  if (signResult.status !== 0) {
    console.warn(`Ad-hoc codesign skipped: ${signResult.stderr || signResult.stdout}`);
  }
}

async function buildDmg(hostedManifest) {
  await rm(dmgRoot, { recursive: true, force: true });
  await rm(dmgPath, { force: true });
  await rm(dmgHashPath, { force: true });
  await mkdir(dmgRoot, { recursive: true });

  await writeInstallerApp(hostedManifest);
  await writeFile(
    join(dmgRoot, "安装说明.txt"),
    [
      "一键三线表插件",
      "",
      "1. 双击“一键三线表插件安装器.app”。",
      "2. 安装完成后，完全退出并重新打开 Microsoft Word。",
      "3. 在 Word 的“开始 > 加载项”中打开“一键三线表插件”。",
      "4. 选中表格后点击“一键三线表”。",
      "",
      "若 macOS 提示无法打开未认证开发者的应用，请右键点击安装器并选择“打开”。",
      `插件页面：${publicBaseUrl}/taskpane.html`,
      ""
    ].join("\n")
  );

  run("hdiutil", ["create", "-volname", "一键三线表插件", "-srcfolder", dmgRoot, "-ov", "-format", "UDZO", dmgPath]);
  run("hdiutil", ["verify", dmgPath]);

  const hash = await sha256(dmgPath);
  await writeFile(dmgHashPath, `${hash}  ${basename(dmgPath)}\n`);
}

await buildPagesAndManifest();
const hostedManifest = await readFile(hostedManifestPath, "utf8");

if (!webOnly) {
  await buildDmg(hostedManifest);
}

console.log(`GitHub Pages files: ${pagesDir}`);
console.log(`Hosted manifest: ${hostedManifestPath}`);
console.log(`Public base URL: ${publicBaseUrl}`);

if (!webOnly) {
  console.log(`DMG created: ${dmgPath}`);
  console.log(`SHA-256: ${await sha256(dmgPath)}`);
}
