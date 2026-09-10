const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM resenas ORDER BY fecha DESC');
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { texto, puntuacion, usuario } = req.body;
  const puntuacionNum = Number(puntuacion);
  if (!texto || !Number.isInteger(puntuacionNum) || puntuacionNum < 1 || puntuacionNum > 5) {
    return res.status(400).json({ error: 'Faltan datos o la puntuación debe ser un entero entre 1 y 5' });
  }
  const { rows } = await pool.query(
    `INSERT INTO resenas (texto, puntuacion, usuario) VALUES ($1,$2,$3) RETURNING *`,
    [texto, puntuacionNum, usuario || 'Anónimo']
  );
  res.json({ success: true, data: rows[0] });
});

module.exports = router;
