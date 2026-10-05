import { createServer } from "node:http";

// Windows preview only. The actual iOS app loads this URL with native WKWebView.
const url = "https://www.jagdlatein.de/";
const server = createServer((request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") { response.writeHead(405); response.end(); return; }
  response.writeHead(302, { Location: url, "Cache-Control": "no-store" });
  response.end();
});
server.on("error", error => { console.error(error.message); process.exitCode = 1; });
server.listen(4180, "127.0.0.1", () => console.log(`Website-Vorschau: http://127.0.0.1:4180/ -> ${url}\nDie native iOS-Bedienleiste wird auf dem Mac/iPhone getestet.`));
