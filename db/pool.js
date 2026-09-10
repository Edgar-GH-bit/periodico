const { Pool } = require('pg');

// En Render, DATABASE_URL se provee automáticamente al conectar
// tu Web Service con tu base de datos PostgreSQL.
// En local, defínela en tu archivo .env
//
// Render exige SSL tanto para la URL interna como la externa, así que
// activamos SSL siempre, salvo que estés apuntando a una base 100% local
// (localhost/127.0.0.1), donde no hace falta.
const urlBaseDatos = process.env.DATABASE_URL || '';
const esLocal = urlBaseDatos.includes('localhost') || urlBaseDatos.includes('127.0.0.1');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: esLocal ? false : { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
});

module.exports = pool;
