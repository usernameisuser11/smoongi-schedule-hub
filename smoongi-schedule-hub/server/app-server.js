const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { getCurrentAcademicSchedules } = require("./schedule-current-service");
const { getCleanNotices } = require("./notice-clean-service");

const PORT = Number(process.env.PORT || 4174);
const STATIC_ROOT = path.resolve(__dirname, "..");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    sendJson(res, {});
    return;
  }

  if (url.pathname === "/api/academic-schedules") {
    const year = url.searchParams.get("year") || String(new Date().getFullYear());
    const campus = url.searchParams.get("campus") || "seoul";
    const force = url.searchParams.get("refresh") === "true";
    const payload = await getCurrentAcademicSchedules({ campus, year, force });
    sendJson(res, payload, payload.ok ? 200 : 206);
    return;
  }

  if (url.pathname === "/api/notices") {
    const payload = await getCleanNotices({
      campus: url.searchParams.get("campus") || "seoul",
      force: url.searchParams.get("refresh") === "true",
      source: url.searchParams.get("source") || "all",
      department: url.searchParams.get("department") || "",
      category: url.searchParams.get("category") || "",
      query: url.searchParams.get("query") || "",
      sort: url.searchParams.get("sort") || "latest",
      page: Number(url.searchParams.get("page") || 1),
      pageSize: Number(url.searchParams.get("pageSize") || 15),
    });
    sendJson(res, payload, payload.ok ? 200 : 206);
    return;
  }

  if (req.method === "GET" || req.method === "HEAD") {
    serveStaticFile(req, res, url.pathname);
    return;
  }

  sendJson(res, { ok: false, error: "Not found" }, 404);
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Smoongi Schedule Hub: http://localhost:${PORT}`);
  });
}

function serveStaticFile(req, res, requestPath) {
  const pathname = decodeURIComponent(requestPath.split("?")[0]);
  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const filePath = path.resolve(STATIC_ROOT, relativePath);

  if (!filePath.startsWith(STATIC_ROOT)) {
    sendJson(res, { ok: false, error: "Not found" }, 404);
    return;
  }

  fs.stat(filePath, (statError, stat) => {
    if (statError || !stat.isFile()) {
      const indexPath = path.join(STATIC_ROOT, "index.html");
      fs.readFile(indexPath, (indexError, indexBuffer) => {
        if (indexError) {
          sendJson(res, { ok: false, error: "Not found" }, 404);
          return;
        }
        sendBuffer(res, indexBuffer, "text/html; charset=utf-8", req.method);
      });
      return;
    }

    fs.readFile(filePath, (readError, buffer) => {
      if (readError) {
        sendJson(res, { ok: false, error: "Not found" }, 404);
        return;
      }
      sendBuffer(res, buffer, getContentType(filePath), req.method);
    });
  });
}

function sendBuffer(res, buffer, contentType, method = "GET") {
  res.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "no-cache",
  });
  if (method === "HEAD") {
    res.end();
    return;
  }
  res.end(buffer);
}

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return (
    {
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon",
      ".txt": "text/plain; charset=utf-8",
    }[extension] || "application/octet-stream"
  );
}

function sendJson(res, payload, statusCode = 200) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-cache",
  });
  res.end(JSON.stringify(payload, null, 2));
}

module.exports = { server };
