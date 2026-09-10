const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const pool = require('../db/pool');
const { verificarToken, requiereRol } = require('../middleware/auth');

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Formato de imagen no permitido. Usa JPG, PNG, WEBP o GIF.'));
  }
});

function subirACloudinary(buffer, carpeta) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: carpeta }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// --- Público: solo emprendedores ya aprobados ---
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT e.*, COALESCE(v.likes, 0) AS likes
     FROM emprendedores e
     LEFT JOIN votos v ON v.emprendedor_id = e.id
     WHERE e.aprobado = TRUE
     ORDER BY e.fecha_registro DESC`
  );
  res.json(rows);
});

// --- Auto-registro público (queda pendiente de aprobación) ---
router.post('/registro', upload.single('logo'), async (req, res) => {
  try {
    const { nombre, rubro, descripcion, link } = req.body;
    if (!nombre || !rubro) {
      return res.status(400).json({ error: 'Faltan datos (nombre, rubro)' });
    }

    let logoUrl = '';
    if (req.file) {
      const resultado = await subirACloudinary(req.file.buffer, 'periodico-azteca/emprendedores');
      logoUrl = resultado.secure_url;
    }

    const { rows } = await pool.query(
      `INSERT INTO emprendedores (nombre, rubro, descripcion, logo_url, link, aprobado)
       VALUES ($1,$2,$3,$4,$5,FALSE) RETURNING *`,
      [nombre, rubro, descripcion || '', logoUrl, link || '']
    );
    res.json({ success: true, message: 'Registro enviado, en espera de aprobación', data: rows[0] });
  } catch (err) {
    console.error('Error en registro de emprendedor:', err);
    res.status(500).json({ error: 'Error al registrar' });
  }
});

// --- Creación directa por un admin/editor (queda aprobada de una vez) ---
router.post('/', verificarToken, requiereRol('propietario', 'editor'), async (req, res) => {
  const { nombre, rubro, descripcion, logo_url, link } = req.body;
  if (!nombre || !rubro) return res.status(400).json({ error: 'Faltan datos (nombre, rubro)' });
  const { rows } = await pool.query(
    `INSERT INTO emprendedores (nombre, rubro, descripcion, logo_url, link, aprobado)
     VALUES ($1,$2,$3,$4,$5,TRUE) RETURNING *`,
    [nombre, rubro, descripcion || '', logo_url || '', link || '']
  );
  res.json({ success: true, data: rows[0] });
});

// --- Moderación (solo propietario/editor) ---
router.get('/pendientes', verificarToken, requiereRol('propietario', 'editor'), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM emprendedores WHERE aprobado = FALSE ORDER BY fecha_registro ASC`
  );
  res.json(rows);
});

router.patch('/:id/aprobar', verificarToken, requiereRol('propietario', 'editor'), async (req, res) => {
  const { rows } = await pool.query(
    `UPDATE emprendedores SET aprobado = TRUE WHERE id = $1 RETURNING *`,
    [req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Emprendedor no encontrado' });
  res.json({ success: true, data: rows[0] });
});

router.put('/:id', verificarToken, requiereRol('propietario', 'editor'), async (req, res) => {
  const { nombre, rubro, descripcion, logo_url, link } = req.body;
  const { rows } = await pool.query(
    `UPDATE emprendedores SET
       nombre = COALESCE($1, nombre),
       rubro = COALESCE($2, rubro),
       descripcion = COALESCE($3, descripcion),
       logo_url = COALESCE($4, logo_url),
       link = COALESCE($5, link)
     WHERE id = $6 RETURNING *`,
    [nombre, rubro, descripcion, logo_url, link, req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Emprendedor no encontrado' });
  res.json({ success: true, data: rows[0] });
});

router.delete('/:id', verificarToken, requiereRol('propietario', 'editor'), async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM emprendedores WHERE id = $1', [req.params.id]);
  if (rowCount === 0) return res.status(404).json({ error: 'Emprendedor no encontrado' });
  res.json({ success: true, message: 'Emprendedor eliminado' });
});

// --- Votos (solo para aprobados, pero no hace falta filtrar aquí) ---
router.get('/:id/votos', async (req, res) => {
  const { rows } = await pool.query('SELECT likes FROM votos WHERE emprendedor_id = $1', [req.params.id]);
  res.json({ likes: rows[0] ? rows[0].likes : 0 });
});

router.post('/:id/like', async (req, res) => {
  const { rows } = await pool.query(
    `INSERT INTO votos (emprendedor_id, likes) VALUES ($1, 1)
     ON CONFLICT (emprendedor_id) DO UPDATE SET likes = votos.likes + 1
     RETURNING likes`,
    [req.params.id]
  );
  res.json({ success: true, likes: rows[0].likes });
});

module.exports = router;
