const http = require('http');
const url = require('url');
const QRCode = require('qrcode');

let redis = null;
const memory = {};

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { Redis } = require('@upstash/redis');
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (e) {
  console.log('Redis no configurado, usando almacenamiento en memoria');
}

const getRedis = async (key) => {
  if (redis) return await redis.get(key);
  return memory[key] || null;
};

const setRedis = async (key, value) => {
  if (redis) await redis.set(key, value);
  memory[key] = value;
};

const incrRedis = async (key) => {
  if (redis) return await redis.incr(key);
  memory[key] = (memory[key] || 0) + 1;
  return memory[key];
};

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
    // Redirigir a Google Maps
    if (pathname.startsWith('/r/')) {
      const code = pathname.split('/')[2];
      const piece = await getRedis(`piece:${code}`);

      if (!piece) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Pieza no encontrada' }));
        return;
      }

      const source = query.s === 'q' ? 'qr' : query.s === 'n' ? 'nfc' : 'web';
      await incrRedis(`stats:${code}:${source}`);

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
          const piece = await getRedis(`piece:${code}`);
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
        req.on('end', async () => {
          const { code, name, link } = JSON.parse(body);
          await setRedis(`piece:${code}`, { name, link });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
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
        const qr = await getRedis(`stats:${code}:qr`) || 0;
        const nfc = await getRedis(`stats:${code}:nfc`) || 0;
        const web = await getRedis(`stats:${code}:web`) || 0;

        if (qr > 0 || nfc > 0 || web > 0) {
          stats[code] = { qr, nfc, web, total: qr + nfc + web };
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(stats));
      return;
    }

    // API: generar QR
    if (pathname === '/api/admin/qr') {
      const code = query.code;
      const appUrl = `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/r/${code}?s=q`;

      const qrCode = await QRCode.toDataURL(appUrl);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ qr: qrCode }));
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
