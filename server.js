import "dotenv/config";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { generateRecipes, requestSchema } from "./lib/recipes.js";

const port = process.env.PORT || 3000;
const publicDir = join(process.cwd(), "public");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

const server = createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/api/recipes") {
      return handleRecipes(req, res);
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      return sendJson(res, 405, { error: "Method not allowed." });
    }

    return serveStatic(req, res);
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { error: "Unexpected server error." });
  }
});

async function handleRecipes(req, res) {
  const body = await readRequestBody(req);
  const parsedBody = body ? JSON.parse(body) : {};
  const parsed = requestSchema.safeParse(parsedBody);

  if (!parsed.success) {
    return sendJson(res, 400, { error: "Tell me what ingredients you have first." });
  }

  try {
    const payload = await generateRecipes(parsed.data);
    return sendJson(res, 200, payload);
  } catch (error) {
    console.error(error);
    return sendJson(res, error.statusCode || 500, {
      error:
        error.statusCode === 500
          ? error.message
          : "Recipe generation failed. Check the server logs and API key.",
    });
  }
}

async function serveStatic(req, res) {
  const url = new URL(req.url || "/", `http://localhost:${port}`);
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const normalized = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(publicDir, normalized);

  if (!filePath.startsWith(publicDir)) {
    return sendJson(res, 403, { error: "Forbidden." });
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return sendJson(res, 404, { error: "Not found." });
    }

    res.writeHead(200, {
      "Content-Type": contentTypes[extname(filePath)] || "application/octet-stream",
      "Content-Length": fileStat.size,
    });

    if (req.method === "HEAD") {
      return res.end();
    }

    return createReadStream(filePath).pipe(res);
  } catch {
    const indexHtml = await readFile(join(publicDir, "index.html"));
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Length": indexHtml.byteLength,
    });
    return res.end(indexHtml);
  }
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 32 * 1024) {
        req.destroy();
        reject(new Error("Request body too large."));
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  return res.end(body);
}

server.listen(port, () => {
  console.log(`Pantry Recipe Finder running at http://localhost:${port}`);
});
