require('dotenv').config();

const raw = process.env.DATABASE_URL || '(no definida)';

try {
  const url = new URL(raw);
  console.log('Protocolo:', url.protocol);
  console.log('Host:', url.hostname);
  console.log('Puerto:', url.port);
  console.log('Base de datos:', url.pathname);
  console.log('Longitud total de la URL:', raw.length);
} catch (e) {
  console.log('❌ No se pudo interpretar como URL válida.');
  console.log('Primeros 15 caracteres:', raw.slice(0, 15));
  console.log('Últimos 15 caracteres:', raw.slice(-15));
  console.log('Longitud total:', raw.length);
}
