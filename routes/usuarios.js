const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db/pool');
const { verificarToken, requiereRol } = require('../middleware/auth');

const router = express.Router();

router.get('/', verificarToken, requiereRol('propietario'), async (req, res) => {
  const { rows } = await pool.query('SELECT id, username, rol, creado_en FROM usuarios ORDER BY id');
  res.json(rows);
});

router.post('/', verificarToken, requiereRol('propietario'), async (req, res) => {
  const { username, password, rol } = req.body;
  if (!username || !password || !rol) {
    return res.status(400).json({ error: 'Faltan datos' });
  }
  if (!['propietario', 'editor'].includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }

  try {
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO usuarios (username, password_hash, rol) VALUES ($1,$2,$3)
       RETURNING id, username, rol`,
      [username, hash, rol]
    );
    res.json({ success: true, message: 'Usuario creado', data: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.delete('/:id', verificarToken, requiereRol('propietario'), async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM usuarios WHERE id = $1', [req.params.id]);
  if (rowCount === 0) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  res.json({ success: true, message: 'Usuario eliminado' });
});

module.exports = router;
