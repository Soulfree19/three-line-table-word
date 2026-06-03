import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { chmod, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(process.cwd());
const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const version = packageJson.version;
const releaseName = `three-line-table-word-${version}-mac-local`;
const distDir = join(root, "dist");
const releaseDir = join(distDir, releaseName);
const archivePath = join(distDir, `${releaseName}.zip`);

const releaseItems = [
  ".gitignore",
  "README.md",
  "RELEASE_NOTES.md",
  "install-mac.command",
  "start-mac.command",
  "manifest.xml",
  "package.json",
  "taskpane.html",
  "commands.html",
  "assets",
  "docs",
  "scripts",
  "src"
];

async function copyItem(item) {
  const source = join(root, item);
  if (!existsSync(source)) {
    throw new Error(`Missing release item: ${item}`);
  }

  await cp(source, join(releaseDir, item), {
    recursive: true,
    filter: (sourcePath) => {
      const name = basename(sourcePath);
      return name !== ".DS_Store" && name !== "dist" && !name.startsWith("~$");
    }
  });
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || root,
    encoding: "utf8",
    stdio: options.stdio || "pipe"
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed\n${result.stderr || result.stdout}`);
  }
}

async function sha256(filePath) {
  const bytes = await readFile(filePath);
  return createHash("sha256").update(bytes).digest("hex");
}

await rm(releaseDir, { recursive: true, force: true });
await rm(archivePath, { force: true });
await mkdir(releaseDir, { recursive: true });

for (const item of releaseItems) {
  await copyItem(item);
}

await chmod(join(releaseDir, "install-mac.command"), 0o755);
await chmod(join(releaseDir, "start-mac.command"), 0o755);
await chmod(join(releaseDir, "scripts/install-manifest-mac.sh"), 0o755);
await chmod(join(releaseDir, "scripts/create-local-cert.sh"), 0o755);

await writeFile(
  join(releaseDir, "VERSION.txt"),
  [
    `一键三线表插件 ${version}`,
    "发布类型：Mac 本地侧载版",
    "入口：先运行 install-mac.command，再运行 start-mac.command。",
    ""
  ].join("\n")
);

run("zip", ["-qry", archivePath, releaseName], { cwd: distDir });

const hash = await sha256(archivePath);
await writeFile(join(distDir, `${releaseName}.sha256`), `${hash}  ${releaseName}.zip\n`);

console.log(`Release created: ${archivePath}`);
console.log(`SHA-256: ${hash}`);
