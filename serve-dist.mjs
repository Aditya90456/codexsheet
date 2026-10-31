import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".webmanifest": "application/manifest+json",
  ".json": "application/json",
  ".glb": "model/gltf-binary",
  ".jpg": "image/jpeg",
};

createServer((request, response) => {
  const path = decodeURIComponent((request.url ?? "/").split("?")[0]);
  const safe = normalize(path).replace(/^(\.\.[/\\])+/, "");
  const file = join("dist", safe);
  const target = existsSync(file) && !extname(file) ? join(file, "index.html") : file;
  const hit = existsSync(target) ? target : "dist/index.html";
  response.writeHead(200, { "content-type": types[extname(hit)] ?? "application/octet-stream" });
  response.end(readFileSync(hit));
}).listen(4399, "127.0.0.1", () => console.log("serving dist on http://127.0.0.1:4399"));
