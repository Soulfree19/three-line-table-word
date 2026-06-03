import { createServer as createHttpServer } from "node:http";
import { createServer as createHttpsServer } from "node:https";
import { createReadStream, existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const args = new Set(process.argv.slice(2));
const portArg = process.argv.find((arg) => arg.startsWith("--port="));
const hostArg = process.argv.find((arg) => arg.startsWith("--host="));
const port = Number(portArg ? portArg.split("=")[1] : process.env.PORT || 3000);
const host = hostArg ? hostArg.split("=")[1] : process.env.HOST || "localhost";
const useHttps = args.has("--https");
const root = resolve(process.cwd());

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".xml", "application/xml; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".ico", "image/x-icon"]
]);

function send(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, {
    "Cache-Control": "no-store",
    ...headers
  });
  res.end(body);
}

function resolveRequestPath(url) {
  const pathname = decodeURIComponent(new URL(url, "http://localhost").pathname);
  const relative = pathname === "/" ? "taskpane.html" : pathname.slice(1);
  const filePath = normalize(join(root, relative));

  if (!filePath.startsWith(root)) {
    return "";
  }

  return filePath;
}

function handleRequest(req, res) {
  const filePath = resolveRequestPath(req.url || "/");
  if (!filePath) {
    send(res, 403, "Forbidden", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    send(res, 404, "Not found", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  const contentType = mimeTypes.get(extname(filePath)) || "application/octet-stream";
  res.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Type": contentType
  });
  createReadStream(filePath).pipe(res);
}

async function createServer() {
  if (!useHttps) {
    return createHttpServer(handleRequest);
  }

  const keyPath = resolve(root, "certs/localhost.key");
  const certPath = resolve(root, "certs/localhost.crt");

  if (!existsSync(keyPath) || !existsSync(certPath)) {
    console.error("Missing local HTTPS certificate.");
    console.error("Run: npm run cert");
    process.exit(1);
  }

  const [key, cert] = await Promise.all([readFile(keyPath), readFile(certPath)]);
  return createHttpsServer({ key, cert }, handleRequest);
}

const server = await createServer();
server.listen(port, host, () => {
  const protocol = useHttps ? "https" : "http";
  console.log(`Three Line Table add-in server running at ${protocol}://${host}:${port}/taskpane.html`);
});
