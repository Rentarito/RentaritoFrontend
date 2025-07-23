const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware para restringir acceso por cabecera
app.use((req, res, next) => {
  const appSecret = req.headers['x-app-secret'];
  if (appSecret !== 'Rentarito.2025') { // Usa tu clave secreta aquí
    return res.status(403).send('Acceso solo permitido desde la app');
  }
  next();
});

// Servir archivos estáticos del build de React/Vite/etc
app.use(express.static(path.join(__dirname, 'build')));

// Para cualquier otra ruta, servir index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor frontend escuchando en el puerto ${PORT}`);
});
