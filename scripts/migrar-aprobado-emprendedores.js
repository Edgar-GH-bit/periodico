// Agrega la columna "aprobado" a la tabla emprendedores si no existe todavía.
// Uso: node scripts/migrar-aprobado-emprendedores.js
require('dotenv').config();
const pool = require('../db/pool');

async function migrar() {
  try {
    await pool.query(
      `ALTER TABLE emprendedores ADD COLUMN IF NOT EXISTS aprobado BOOLEAN DEFAULT FALSE`
    );
    // Los emprendedores que ya tenías publicados (agregados antes de este cambio)
    // se marcan como aprobados automáticamente, para que no desaparezcan del sitio.
    await pool.query(
      `UPDATE emprendedores SET aprobado = TRUE WHERE aprobado IS NULL OR aprobado = FALSE`
    );
    console.log('✅ Columna "aprobado" lista en emprendedores.');
  } catch (err) {
    console.error('❌ Error en la migración:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrar();
