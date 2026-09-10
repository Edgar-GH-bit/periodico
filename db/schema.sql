-- Esquema de base de datos para Periódico Azteca
-- Ejecutar una vez contra tu base PostgreSQL (ver scripts/init-db.js)

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('propietario', 'editor')),
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS noticias (
  id SERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  resumen TEXT NOT NULL,
  contenido TEXT NOT NULL,
  categoria VARCHAR(50) DEFAULT 'General',
  imagen_url TEXT DEFAULT '',
  destacada BOOLEAN DEFAULT FALSE,
  fecha TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP
);

CREATE TABLE IF NOT EXISTS eventos (
  id SERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  fecha TIMESTAMP NOT NULL,
  lugar VARCHAR(100) DEFAULT 'Cobach'
);

CREATE TABLE IF NOT EXISTS emprendedores (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  rubro VARCHAR(100) NOT NULL,
  descripcion TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  link TEXT DEFAULT '',
  aprobado BOOLEAN DEFAULT FALSE,
  fecha_registro TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS votos (
  emprendedor_id INTEGER PRIMARY KEY REFERENCES emprendedores(id) ON DELETE CASCADE,
  likes INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS dinamicas (
  id SERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS buzones (
  id SERIAL PRIMARY KEY,
  mensaje VARCHAR(500) NOT NULL,
  fecha TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS talentos (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  imagen_url TEXT NOT NULL,
  fecha_subida TIMESTAMP DEFAULT NOW(),
  aprobado BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS resenas (
  id SERIAL PRIMARY KEY,
  texto TEXT NOT NULL,
  puntuacion SMALLINT NOT NULL CHECK (puntuacion BETWEEN 1 AND 5),
  usuario VARCHAR(100) DEFAULT 'Anónimo',
  fecha TIMESTAMP DEFAULT NOW()
);
