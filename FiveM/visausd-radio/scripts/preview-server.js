#!/usr/bin/env node
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { pipeline } = require('node:stream');

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ogg': 'audio/ogg', '.webp': 'image/webp' };

function createPreviewServer(root = path.resolve(__dirname, '..')) {
  const realRoot = fs.realpathSync(root);
  const isPublicFile = filename => {
    const relative = path.relative(realRoot, filename);
    return !relative.startsWith('..') && !path.isAbsolute(relative) &&
      ['web', 'core', 'config', 'audio'].includes(relative.split(path.sep)[0]);
  };
  return http.createServer((request, response) => {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return;
    }
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
    catch { response.writeHead(400); response.end('Invalid path'); return; }
    if (pathname === '/') { response.writeHead(302, { Location: '/web/' }); response.end(); return; }
    if (pathname.endsWith('/')) pathname += 'index.html';
    if (!/^\/(web|core|config|audio)\//.test(pathname) || pathname.includes('\0') || pathname.includes('\\')) {
      response.writeHead(404); response.end('Not found'); return;
    }
    if (pathname.startsWith('/config/') && !/^\/config\/(playlist|station)\.json$/.test(pathname)) {
      response.writeHead(404); response.end('Not found'); return;
    }
    const candidate = path.resolve(realRoot, `.${pathname}`);
    if (!isPublicFile(candidate)) { response.writeHead(403); response.end(); return; }
    fs.realpath(candidate, (realError, filename) => {
      if (realError || !isPublicFile(filename)) {
        response.writeHead(404); response.end('Not found'); return;
      }
      fs.stat(filename, (error, stat) => {
        if (error || !stat.isFile()) { response.writeHead(404); response.end('Not found'); return; }
        const headers = { 'Content-Type': MIME[path.extname(filename).toLowerCase()] || 'application/octet-stream',
          'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' };
        let start = 0;
        let end = stat.size - 1;
        let status = 200;
        if (request.headers.range) {
          const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
          if (!match || (!match[1] && !match[2])) {
            response.writeHead(416, { ...headers, 'Content-Range': `bytes */${stat.size}` }); response.end(); return;
          }
          if (match[1]) {
            start = Number(match[1]);
            end = match[2] ? Number(match[2]) : end;
          } else {
            start = Math.max(0, stat.size - Number(match[2]));
          }
          end = Math.min(end, stat.size - 1);
          if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= stat.size) {
            response.writeHead(416, { ...headers, 'Content-Range': `bytes */${stat.size}` }); response.end(); return;
          }
          status = 206;
          headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
        }
        headers['Content-Length'] = stat.size === 0 ? 0 : end - start + 1;
        response.writeHead(status, headers);
        if (request.method === 'HEAD' || stat.size === 0) { response.end(); return; }
        pipeline(fs.createReadStream(filename, { start, end }), response, () => {});
      });
    });
  });
}

if (require.main === module) {
  const host = process.env.HOST || '127.0.0.1';
  const port = Number(process.env.PORT || 4173);
  const server = createPreviewServer();
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, host, () => console.log(`VisaUSD™ Radio preview: http://${host}:${server.address().port}/web/`));
}

module.exports = { createPreviewServer };
