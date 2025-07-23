const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

// 1. Servir archivos estáticos SIN PROTECCIÓN
app.use(express.static(path.join(__dirname, 'build')));

// 2. SOLO proteger la ruta raíz con cabecera
app.get('/', (req, res, next) => {
  const appSecret = req.headers['x-app-secret'];
  if (appSecret !== 'Rentarito.2025') {
    return res.status(403).send('Acceso solo permitido desde la app');
  }
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// 3. Todas las demás rutas del SPA (React)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor frontend escuchando en el puerto ${PORT}`);
});
