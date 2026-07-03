import { createServer } from "node:http";
import { readFile, stat, mkdir, writeFile } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const root = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(root, "public");
const dataDir = join(root, "data");
const dataFile = join(dataDir, "messages.json");
const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || "0.0.0.0";

const clients = new Set();
let messages = [];

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

async function loadMessages() {
  await mkdir(dataDir, { recursive: true });
  if (!existsSync(dataFile)) {
    await writeFile(dataFile, "[]\n", "utf8");
  }

  try {
    const raw = await readFile(dataFile, "utf8");
    messages = JSON.parse(raw);
  } catch {
    messages = [];
    await saveMessages();
  }
}

async function saveMessages() {
  await writeFile(dataFile, `${JSON.stringify(messages, null, 2)}\n`, "utf8");
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload)
  });
  res.end(payload);
}

function broadcast(event, payload) {
  const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients) {
    client.write(message);
  }
}

function cleanText(value, maxLength) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function roomMessages(room) {
  return messages.filter((message) => message.room === room).slice(-200);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
    if (Buffer.concat(chunks).length > 64_000) {
      throw new Error("Payload too large");
    }
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const safePath = normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(publicDir, safePath);

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) throw new Error("Not a file");

    res.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

await loadMessages();

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (req.method === "GET" && url.pathname === "/api/health") {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/messages") {
      const room = cleanText(url.searchParams.get("room") || "general", 40) || "general";
      sendJson(res, 200, roomMessages(room));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/messages") {
      const body = await readBody(req);
      const text = cleanText(body.text, 700);
      const author = cleanText(body.author, 36) || "Guest";
      const room = cleanText(body.room, 40) || "general";
      const color = cleanText(body.color, 24) || "#2563eb";

      if (!text) {
        sendJson(res, 400, { error: "Message text is required." });
        return;
      }

      const message = {
        id: crypto.randomUUID(),
        author,
        color,
        room,
        text,
        createdAt: new Date().toISOString()
      };

      messages.push(message);
      if (messages.length > 1000) messages = messages.slice(-1000);
      await saveMessages();
      broadcast("message", message);
      sendJson(res, 201, message);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/stream") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive"
      });
      res.write("event: ready\ndata: {}\n\n");
      clients.add(res);
      req.on("close", () => clients.delete(res));
      return;
    }

    await serveStatic(req, res);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Something went wrong." });
  }
});

server.listen(port, host, () => {
  console.log(`Chat app running on ${host}:${port}`);
});
