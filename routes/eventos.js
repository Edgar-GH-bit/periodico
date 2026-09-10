const express = require('express');
const pool = require('../db/pool');
const { verificarToken, requiereRol } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM eventos ORDER BY fecha ASC');
  res.json(rows);
});

router.post('/', verificarToken, requiereRol('propietario', 'editor'), async (req, res) => {
  const { titulo, descripcion, fecha, lugar } = req.body;
  if (!titulo || !fecha) return res.status(400).json({ error: 'Faltan datos' });
  const { rows } = await pool.query(
    `INSERT INTO eventos (titulo, descripcion, fecha, lugar) VALUES ($1,$2,$3,$4) RETURNING *`,
    [titulo, descripcion || '', fecha, lugar || 'Cobach']
  );
  res.json({ success: true, data: rows[0] });
});

router.put('/:id', verificarToken, requiereRol('propietario', 'editor'), async (req, res) => {
  const { titulo, descripcion, fecha, lugar } = req.body;
  const { rows } = await pool.query(
    `UPDATE eventos SET
       titulo = COALESCE($1, titulo),
       descripcion = COALESCE($2, descripcion),
       fecha = COALESCE($3, fecha),
       lugar = COALESCE($4, lugar)
     WHERE id = $5 RETURNING *`,
    [titulo, descripcion, fecha, lugar, req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Evento no encontrado' });
  res.json({ success: true, data: rows[0] });
});

router.delete('/:id', verificarToken, requiereRol('propietario', 'editor'), async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM eventos WHERE id = $1', [req.params.id]);
  if (rowCount === 0) return res.status(404).json({ error: 'Evento no encontrado' });
  res.json({ success: true, message: 'Evento eliminado' });
});

module.exports = router;
