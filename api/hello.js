const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  // Servir login.html en root
  if (req.url === '/' || req.url === '') {
    const filePath = path.join(__dirname, '../public/login.html');
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      res.setHeader('Content-Type', 'text/html');
      res.status(200).end(content);
    } catch (e) {
      res.status(404).json({ error: 'Not found' });
    }
    return;
  }

  // Servir otros archivos de public
  if (req.url.startsWith('/public/')) {
    const filePath = path.join(__dirname, '..', req.url);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      res.setHeader('Content-Type', 'text/html');
      res.status(200).end(content);
    } catch (e) {
      res.status(404).json({ error: 'Not found' });
    }
    return;
  }

  res.status(200).json({ message: 'Server is running' });
};
