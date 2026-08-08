/**
 * ProConnect backend — zero external dependencies.
 * Serves the frontend from /public (or root) and a small REST API from /api/*,
 * persisting data to data/db.json (or db.json).
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const DATA_FILE = fs.existsSync(path.join(__dirname, "data", "db.json"))
  ? path.join(__dirname, "data", "db.json")
  : path.join(__dirname, "db.json");

const PUBLIC_DIR = fs.existsSync(path.join(__dirname, "public"))
  ? path.join(__dirname, "public")
  : __dirname;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function readDB() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}
function writeDB(db) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}
function newId(prefix) {
  return prefix + Date.now().toString(36) + Math.floor(Math.random() * 1000);
}
function sendJSON(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}
function serveStatic(req, res) {
  let reqPath = decodeURIComponent(req.url.split("?")[0]);
  if (reqPath === "/") reqPath = "/index.html";
  const filePath = path.join(PUBLIC_DIR, reqPath);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("Not found");
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(content);
  });
}

async function handleCollection(req, res, resourceKey, id, extraFields) {
  const db = readDB();
  const list = db[resourceKey];

  if (req.method === "GET" && !id) {
    return sendJSON(res, 200, list);
  }

  if (req.method === "POST" && !id) {
    let body;
    try {
      body = await readBody(req);
    } catch {
      return sendJSON(res, 400, { error: "Invalid JSON body." });
    }
    if (!body.name || !body.email || !body.mobile) {
      return sendJSON(res, 400, { error: "Name, email, and mobile are required." });
    }
    const record = {
      ...body,
      id: newId(resourceKey === "professionals" ? "p" : "s"),
      createdAt: new Date().toISOString(),
      ...extraFields,
    };
    list.unshift(record);
    writeDB(db);
    return sendJSON(res, 201, record);
  }

  if (req.method === "PUT" && id) {
    let body;
    try {
      body = await readBody(req);
    } catch {
      return sendJSON(res, 400, { error: "Invalid JSON body." });
    }
    const idx = list.findIndex((item) => item.id === id);
    if (idx === -1) return sendJSON(res, 404, { error: "Profile not found." });
    list[idx] = { ...list[idx], ...body, id };
    writeDB(db);
    return sendJSON(res, 200, list[idx]);
  }

  if (req.method === "DELETE" && id) {
    const idx = list.findIndex((item) => item.id === id);
    if (idx === -1) return sendJSON(res, 404, { error: "Profile not found." });
    const [removed] = list.splice(idx, 1);
    writeDB(db);
    return sendJSON(res, 200, { success: true, removed });
  }

  return sendJSON(res, 405, { error: "Method not allowed." });
}

async function handleLogin(req, res) {
  let body;
  try {
    body = await readBody(req);
  } catch {
    return sendJSON(res, 400, { error: "Invalid JSON body." });
  }
  const db = readDB();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const match = db.admins.find(
    (a) => a.email.toLowerCase() === email && a.password === password
  );
  if (!match) return sendJSON(res, 401, { error: "Incorrect email or password." });
  return sendJSON(res, 200, { name: match.name, email: match.email });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  const urlPath = req.url.split("?")[0];
  const parts = urlPath.split("/").filter(Boolean); // e.g. ["api","professionals","p1"]

  if (parts[0] !== "api") {
    return serveStatic(req, res);
  }

  try {
    if (parts[1] === "professionals") {
      return await handleCollection(req, res, "professionals", parts[2], { verified: false });
    }
    if (parts[1] === "students") {
      return await handleCollection(req, res, "students", parts[2]);
    }
    if (parts[1] === "auth" && parts[2] === "login" && req.method === "POST") {
      return await handleLogin(req, res);
    }
    return sendJSON(res, 404, { error: "Unknown API route." });
  } catch (err) {
    console.error(err);
    return sendJSON(res, 500, { error: "Server error." });
  }
});

server.listen(PORT, () => {
  console.log(`ProConnect server running at http://localhost:${PORT}`);
});
