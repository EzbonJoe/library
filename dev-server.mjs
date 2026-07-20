// Local dev server for this static site — no dependencies, just Node.
// Run with: node dev-server.mjs [port]   (defaults to 8080)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const port = process.argv[2] ? Number(process.argv[2]) : 8080;

if (!Number.isInteger(port) || port < 0 || port > 65535) {
  console.error(`Invalid port "${process.argv[2]}" — expected a number between 0 and 65535, e.g.: node dev-server.mjs 8080`);
  process.exit(1);
}

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  let filePath = path.join(root, urlPath);

  if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found: ' + urlPath);
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(port, () => console.log(`GadZeke running at http://localhost:${port}`));
