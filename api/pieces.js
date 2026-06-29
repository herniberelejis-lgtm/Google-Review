const memory = {};

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

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

    res.status(200).json(pieces);
    return;
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const { code, name, link } = JSON.parse(body);
        memory[`piece:${code}`] = { name, link };
        res.status(200).json({ success: true });
      } catch (e) {
        res.status(400).json({ error: 'Invalid JSON' });
      }
    });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
