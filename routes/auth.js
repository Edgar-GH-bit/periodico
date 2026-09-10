const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const pool = require('../db/pool');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Máximo 10 intentos de login por IP cada 15 minutos.
const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/login', limitadorLogin, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Faltan credenciales' });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username]);
    const usuario = rows[0];

    // Comparación en tiempo constante evitando revelar si el usuario existe o no.
    const hashComparar = usuario ? usuario.password_hash : '$2b$12$invalidoinvalidoinvalidoinvalidoinvalido';
    const passwordOk = await bcrypt.compare(password, hashComparar);

    if (!usuario || !passwordOk) {
      return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
    }

    const token = jwt.sign(
      { id: usuario.id, username: usuario.username, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      usuario: { username: usuario.username, rol: usuario.rol },
      message: '✅ Login exitoso'
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

module.exports = router;
