// Migra los datos de tus archivos .json antiguos a las tablas de PostgreSQL.
//
// PASO PREVIO: copia tus archivos .json viejos (noticias.json, eventos.json, etc.)
// dentro de una carpeta llamada "data-antiguo" en la raíz de este proyecto.
//
// IMPORTANTE: por seguridad, este script NO copia la contraseña vieja tal cual.
// En vez de eso, crea al usuario "propietario" con una contraseña NUEVA que tú
// defines en la variable de entorno NEW_ADMIN_PASSWORD antes de ejecutar:
//
//   NEW_ADMIN_PASSWORD="TuContraseñaNuevaySegura123!" node scripts/migrar-json.js
//
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const pool = require('../db/pool');

const DATA_DIR = path.join(__dirname, '../data-antiguo');

function leerJSON(nombre) {
  const archivo = path.join(DATA_DIR, nombre);
  if (!fs.existsSync(archivo)) {
    console.log(`(omitido) no se encontró ${nombre}`);
    return [];
  }
  return JSON.parse(fs.readFileSync(archivo, 'utf-8'));
}

async function migrar() {
  const client = await pool.connect();
  try {
    // --- Usuarios ---
    const usuariosViejos = leerJSON('usuarios.json');
    const nuevaPassword = process.env.NEW_ADMIN_PASSWORD;
    if (usuariosViejos.length && !nuevaPassword) {
      console.error('❌ Debes definir NEW_ADMIN_PASSWORD para migrar usuarios. Abortando esa parte.');
    } else {
      for (const u of usuariosViejos) {
        const hash = await bcrypt.hash(nuevaPassword, 12);
        await client.query(
          `INSERT INTO usuarios (username, password_hash, rol)
           VALUES ($1, $2, $3)
           ON CONFLICT (username) DO NOTHING`,
          [u.username, hash, u.rol]
        );
      }
      console.log(`✅ ${usuariosViejos.length} usuario(s) migrados (con contraseña nueva).`);
    }

    // --- Noticias ---
    const noticias = leerJSON('noticias.json');
    for (const n of noticias) {
      await client.query(
        `INSERT INTO noticias (titulo, resumen, contenido, categoria, imagen_url, destacada, fecha)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [n.titulo, n.resumen, n.contenido, n.categoria || 'General', n.imagen_url || '', !!n.destacada, n.fecha || new Date()]
      );
    }
    console.log(`✅ ${noticias.length} noticia(s) migradas.`);

    // --- Eventos ---
    const eventos = leerJSON('eventos.json');
    for (const e of eventos) {
      await client.query(
        `INSERT INTO eventos (titulo, descripcion, fecha, lugar) VALUES ($1,$2,$3,$4)`,
        [e.titulo, e.descripcion || '', e.fecha, e.lugar || 'Cobach']
      );
    }
    console.log(`✅ ${eventos.length} evento(s) migrados.`);

    // --- Emprendedores + votos ---
    const emprendedores = leerJSON('emprendedores.json');
    const votos = leerJSON('votos.json');
    for (const em of emprendedores) {
      const { rows } = await client.query(
        `INSERT INTO emprendedores (nombre, rubro, descripcion, logo_url, link, fecha_registro)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [em.nombre, em.rubro, em.descripcion || '', em.logo_url || '', em.link || '', em.fecha_registro || new Date()]
      );
      const nuevoId = rows[0].id;
      const votoViejo = votos.find(v => v.id === em.id);
      if (votoViejo) {
        await client.query(
          `INSERT INTO votos (emprendedor_id, likes) VALUES ($1,$2)
           ON CONFLICT (emprendedor_id) DO UPDATE SET likes = EXCLUDED.likes`,
          [nuevoId, votoViejo.likes]
        );
      }
    }
    console.log(`✅ ${emprendedores.length} emprendedor(es) migrados.`);

    // --- Dinámicas ---
    const dinamicas = leerJSON('dinamicas.json');
    for (const d of dinamicas) {
      await client.query(
        `INSERT INTO dinamicas (titulo, contenido) VALUES ($1,$2)`,
        [d.titulo, d.contenido]
      );
    }
    console.log(`✅ ${dinamicas.length} dinámica(s) migradas.`);

    // --- Buzón ---
    const buzones = leerJSON('buzones.json');
    for (const b of buzones) {
      await client.query(
        `INSERT INTO buzones (mensaje, fecha) VALUES ($1,$2)`,
        [b.mensaje, b.fecha || new Date()]
      );
    }
    console.log(`✅ ${buzones.length} mensaje(s) de buzón migrados.`);

    // --- Talentos ---
    const talentos = leerJSON('talentos.json');
    for (const t of talentos) {
      await client.query(
        `INSERT INTO talentos (nombre, titulo, descripcion, imagen_url, fecha_subida, aprobado)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [t.nombre, t.titulo, t.descripcion || '', t.imagen_url, t.fecha_subida || new Date(), !!t.aprobado]
      );
    }
    console.log(`✅ ${talentos.length} talento(s) migrados. (Nota: copia también la carpeta uploads/talentos)`);

    // --- Reseñas ---
    const resenas = leerJSON('resenas.json');
    for (const r of resenas) {
      await client.query(
        `INSERT INTO resenas (texto, puntuacion, usuario, fecha) VALUES ($1,$2,$3,$4)`,
        [r.texto, r.puntuacion, r.usuario || 'Anónimo', new Date()]
      );
    }
    console.log(`✅ ${resenas.length} reseña(s) migradas.`);

    console.log('\n🎉 Migración completada.');
  } catch (err) {
    console.error('❌ Error durante la migración:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrar();
