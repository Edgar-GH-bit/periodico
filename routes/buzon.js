const express = require('express');
const pool = require('../db/pool');
const { verificarToken, requiereRol } = require('../middleware/auth');

const router = express.Router();

router.post('/', async (req, res) => {
  const { mensaje } = req.body;
  if (!mensaje || typeof mensaje !== 'string' || mensaje.length > 500) {
    return res.status(400).json({ error: 'Mensaje inválido' });
  }
  const { rows } = await pool.query(
    `INSERT INTO buzones (mensaje) VALUES ($1) RETURNING id`,
    [mensaje]
  );
  res.json({ success: true, message: 'Mensaje enviado', id: rows[0].id });
});

router.get('/', verificarToken, requiereRol('propietario'), async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM buzones ORDER BY fecha DESC');
  res.json(rows);
});

router.delete('/:id', verificarToken, requiereRol('propietario'), async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM buzones WHERE id = $1', [req.params.id]);
  if (rowCount === 0) return res.status(404).json({ error: 'Mensaje no encontrado' });
  res.json({ success: true, message: 'Mensaje eliminado' });
});

module.exports = router;
