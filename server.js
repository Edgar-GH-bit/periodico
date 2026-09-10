const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const authRoutes = require('./routes/auth');
const usuariosRoutes = require('./routes/usuarios');
const noticiasRoutes = require('./routes/noticias');
const eventosRoutes = require('./routes/eventos');
const emprendedoresRoutes = require('./routes/emprendedores');
const dinamicasRoutes = require('./routes/dinamicas');
const buzonRoutes = require('./routes/buzon');
const talentosRoutes = require('./routes/talentos');
const resenasRoutes = require('./routes/resenas');

const app = express();
const PORT = process.env.PORT || 3000;

// Render coloca la app detrás de un proxy; esto permite identificar
// correctamente la IP real de cada visitante (lo necesita express-rate-limit).
app.set('trust proxy', 1);

// =============================================
// MIDDLEWARES
// =============================================
const origenesPermitidos = (process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: origenesPermitidos.length > 0 ? origenesPermitidos : true
  // Nota: define FRONTEND_ORIGIN en .env con la URL de tu frontend en producción
  // (ej. https://tu-frontend.onrender.com) para restringir el acceso.
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =============================================
// RUTAS
// =============================================
app.get('/', (req, res) => {
  res.send('✅ Servidor funcionando correctamente');
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/noticias', noticiasRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/emprendedores', emprendedoresRoutes);
app.use('/api/dinamicas', dinamicasRoutes);
app.use('/api/buzon', buzonRoutes);
app.use('/api/talentos', talentosRoutes);
app.use('/api/resenas', resenasRoutes);

// Manejo de errores de Multer y otros errores no capturados
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: err.message || 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🖥️  Panel Admin: http://localhost:${PORT}/admin`);
});
