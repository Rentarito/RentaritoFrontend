const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

// 1. Servir estáticos sin protección
app.use(express.static(path.join(__dirname, 'build')));

// 2. Middleware para proteger SOLO las rutas que devuelven index.html (NO estáticos)
function spaProtection(req, res, next) {
  // Archivos estáticos, manifest, favicon, etc: dejar pasar
  if (
    req.path.startsWith('/static/') ||
    req.path.startsWith('/assets/') ||
    req.path === '/favicon.ico' ||
    req.path === '/manifest.json' ||
    req.path === '/asset-manifest.json' ||
    req.path.endsWith('.png') ||
    req.path.endsWith('.svg') ||
    req.path.endsWith('.js') ||
    req.path.endsWith('.css') ||
    req.path.endsWith('.map')
  ) {
    return next();
  }
  // Todas las demás rutas: proteger por cabecera
  const appSecret = req.headers['x-app-secret'];
  if (appSecret !== 'Rentarito.2025') {
    return res.status(403).send('Acceso solo permitido desde la app');
  }
  next();
}

// 3. Aplica el middleware a todas las rutas
app.use(spaProtection);

// 4. SPA fallback: devuelve index.html en cualquier ruta no estática
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor frontend escuchando en el puerto ${PORT}`);
});
