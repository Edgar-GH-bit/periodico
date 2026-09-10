// Ejecuta el esquema SQL contra la base de datos configurada en DATABASE_URL.
// Uso: node scripts/init-db.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../db/pool');

async function init() {
  const schema = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf-8');
  try {
    await pool.query(schema);
    console.log('✅ Tablas creadas/verificadas correctamente.');
  } catch (err) {
    console.error('❌ Error al crear las tablas:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

init();
