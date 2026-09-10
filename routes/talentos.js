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

function subirACloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'periodico-azteca/talentos' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// --- Público: solo lo ya aprobado ---
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM talentos WHERE aprobado = TRUE ORDER BY fecha_subida DESC'
  );
  res.json(rows);
});

router.post('/upload', upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, titulo, descripcion } = req.body;
    if (!nombre || !titulo || !req.file) {
      return res.status(400).json({ error: 'Faltan datos (nombre, titulo, imagen)' });
    }

    const resultado = await subirACloudinary(req.file.buffer);

    const { rows } = await pool.query(
      `INSERT INTO talentos (nombre, titulo, descripcion, imagen_url, aprobado)
       VALUES ($1,$2,$3,$4,FALSE) RETURNING *`,
      [nombre, titulo, descripcion || '', resultado.secure_url]
    );
    res.json({ success: true, message: 'Participación enviada, en espera de aprobación', data: rows[0] });
  } catch (err) {
    console.error('Error al subir talento:', err);
    res.status(500).json({ error: 'Error al subir el archivo' });
  }
});

// --- Moderación ---
router.get('/pendientes', verificarToken, requiereRol('propietario', 'editor'), async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM talentos WHERE aprobado = FALSE ORDER BY fecha_subida ASC'
  );
  res.json(rows);
});

router.patch('/:id/aprobar', verificarToken, requiereRol('propietario', 'editor'), async (req, res) => {
  const { rows } = await pool.query(
    'UPDATE talentos SET aprobado = TRUE WHERE id = $1 RETURNING *',
    [req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Talento no encontrado' });
  res.json({ success: true, data: rows[0] });
});

router.delete('/:id', verificarToken, requiereRol('propietario', 'editor'), async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM talentos WHERE id = $1', [req.params.id]);
  if (rowCount === 0) return res.status(404).json({ error: 'Talento no encontrado' });
  res.json({ success: true, message: 'Talento eliminado' });
});

module.exports = router;
