const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const memory = {};

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    // Servir archivos HTML estáticos
    if (pathname === '/' || pathname === '/public/login.html') {
      const filePath = path.join(__dirname, 'public/login.html');
      const content = fs.readFileSync(filePath, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
      return;
    }

    if (pathname === '/public/dashboard.html') {
      const filePath = path.join(__dirname, 'public/dashboard.html');
      const content = fs.readFileSync(filePath, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
      return;
    }

    // Redirigir a Google Maps
    if (pathname.startsWith('/r/')) {
      const code = pathname.split('/')[2];
      const piece = memory[`piece:${code}`];

      if (!piece) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Pieza no encontrada' }));
        return;
      }

      const source = query.s === 'q' ? 'qr' : query.s === 'n' ? 'nfc' : 'web';
      memory[`stats:${code}:${source}`] = (memory[`stats:${code}:${source}`] || 0) + 1;

      res.writeHead(302, { Location: piece.link });
      res.end();
      return;
    }

    // API: obtener piezas
    if (pathname === '/api/admin/pieces') {
      if (req.method === 'GET') {
        const total = process.env.TOTAL_PIECES || 100;
        const pieces = [];

        for (let i = 1; i <= total; i++) {
          const code = String(i).padStart(3, '0');
          const piece = memory[`piece:${code}`];
          pieces.push({
            code,
            name: piece?.name || null,
            link: piece?.link || null,
            status: piece ? 'configurada' : 'libre',
          });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(pieces));
        return;
      }

      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          try {
            const { code, name, link } = JSON.parse(body);
            memory[`piece:${code}`] = { name, link };
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } catch (e) {
            res.writeHead(400);
            res.end('Invalid JSON');
          }
        });
        return;
      }
    }

    // API: estadísticas
    if (pathname === '/api/admin/stats') {
      const total = process.env.TOTAL_PIECES || 100;
      const stats = {};

      for (let i = 1; i <= total; i++) {
        const code = String(i).padStart(3, '0');
        const qr = memory[`stats:${code}:qr`] || 0;
        const nfc = memory[`stats:${code}:nfc`] || 0;
        const web = memory[`stats:${code}:web`] || 0;

        if (qr > 0 || nfc > 0 || web > 0) {
          stats[code] = { qr, nfc, web, total: qr + nfc + web };
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(stats));
      return;
    }

    // API: generar QR placeholder con número
    if (pathname === '/api/admin/qr') {
      const code = query.code;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="250" height="300">
        <rect width="250" height="300" fill="white"/>
        <rect x="25" y="25" width="200" height="200" fill="lightgray" stroke="black" stroke-width="2"/>
        <text x="125" y="140" font-size="20" font-weight="bold" text-anchor="middle" dy="0.3em">${code}</text>
        <text x="125" y="250" font-size="16" text-anchor="middle">Pieza #${code}</text>
      </svg>`;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ qr: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}` }));
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  } catch (error) {
    console.error(error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
