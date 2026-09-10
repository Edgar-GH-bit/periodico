const express = require('express');
const pool = require('../db/pool');
const { verificarToken, requiereRol } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM noticias ORDER BY fecha DESC');
  res.json(rows);
});

router.post('/', verificarToken, requiereRol('propietario', 'editor'), async (req, res) => {
  const { titulo, resumen, contenido, categoria, imagen_url, destacada } = req.body;
  if (!titulo || !resumen || !contenido) {
    return res.status(400).json({ error: 'Faltan datos' });
  }
  const { rows } = await pool.query(
    `INSERT INTO noticias (titulo, resumen, contenido, categoria, imagen_url, destacada)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [titulo, resumen, contenido, categoria || 'General', imagen_url || '', !!destacada]
  );
  res.json({ success: true, data: rows[0] });
});

router.put('/:id', verificarToken, requiereRol('propietario', 'editor'), async (req, res) => {
  const { titulo, resumen, contenido, categoria, imagen_url, destacada } = req.body;
  const { rows } = await pool.query(
    `UPDATE noticias SET
       titulo = COALESCE($1, titulo),
       resumen = COALESCE($2, resumen),
       contenido = COALESCE($3, contenido),
       categoria = COALESCE($4, categoria),
       imagen_url = COALESCE($5, imagen_url),
       destacada = COALESCE($6, destacada),
       fecha_actualizacion = NOW()
     WHERE id = $7 RETURNING *`,
    [titulo, resumen, contenido, categoria, imagen_url, destacada, req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Noticia no encontrada' });
  res.json({ success: true, data: rows[0] });
});

router.delete('/:id', verificarToken, requiereRol('propietario', 'editor'), async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM noticias WHERE id = $1', [req.params.id]);
  if (rowCount === 0) return res.status(404).json({ error: 'Noticia no encontrada' });
  res.json({ success: true, message: 'Noticia eliminada' });
});

module.exports = router;
