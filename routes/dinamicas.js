const express = require('express');
const pool = require('../db/pool');
const { verificarToken, requiereRol } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM dinamicas ORDER BY id');
  if (rows.length === 0) {
    return res.json([{ id: 1, titulo: 'Gánate un espacio', contenido: 'Envía tu dibujo y aparece en nuestra edición impresa.' }]);
  }
  res.json(rows);
});

router.put('/:id', verificarToken, requiereRol('propietario', 'editor'), async (req, res) => {
  const { titulo, contenido } = req.body;
  const { rows } = await pool.query(
    `UPDATE dinamicas SET
       titulo = COALESCE($1, titulo),
       contenido = COALESCE($2, contenido),
       fecha_actualizacion = NOW()
     WHERE id = $3 RETURNING *`,
    [titulo, contenido, req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Dinámica no encontrada' });
  res.json({ success: true, data: rows[0] });
});

module.exports = router;
