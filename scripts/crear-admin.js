// Crea (o actualiza la contraseña de) un usuario con rol "propietario"
// directamente en la base de datos, sin pasar por la API.
//
// Uso:
//   node scripts/crear-admin.js <username> <password>
//
// Ejemplo:
//   node scripts/crear-admin.js edgar "MiContraseñaNuevaYSegura123!"
require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../db/pool');

async function crearAdmin() {
  const [, , username, password] = process.argv;
  if (!username || !password) {
    console.error('Uso: node scripts/crear-admin.js <username> <password>');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('❌ La contraseña debe tener al menos 8 caracteres.');
    process.exit(1);
  }

  try {
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO usuarios (username, password_hash, rol)
       VALUES ($1, $2, 'propietario')
       ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id, username, rol`,
      [username, hash]
    );
    console.log('✅ Usuario propietario listo:', rows[0]);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

crearAdmin();
