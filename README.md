# Periódico Azteca — Backend (v2)

Backend reescrito con PostgreSQL en vez de archivos JSON, contraseñas cifradas
con bcrypt, y estructura por rutas.

## Qué cambió respecto a la versión anterior

- Los datos ya no viven en archivos `.json`, sino en tablas de PostgreSQL.
- Las contraseñas se guardan cifradas con bcrypt (nunca en texto plano).
- El `JWT_SECRET` ya no tiene un valor por defecto inseguro: si falta, el
  servidor no arranca (a propósito, para forzar a configurarlo bien).
- El código se organizó en carpetas: `routes/`, `middleware/`, `db/`.
- Se corrigió la ruta `POST /api/emprendedores`, que antes no revisaba el rol.
- Las URLs de la API (`/api/noticias`, `/api/eventos`, etc.) **no cambiaron**,
  así que tu `admin.html` y cualquier frontend existente siguen funcionando igual.

## 1. Configurar en tu WSL (Ubuntu + VS Code)

Abre la terminal de Ubuntu dentro de VS Code y ejecuta:

```bash
cd ruta/a/tu/proyecto/periodico-backend
npm install
cp .env.example .env
```

Edita `.env` (puedes abrirlo directo en VS Code) y rellena:
- `DATABASE_URL` — la obtienes en el paso 2.
- `JWT_SECRET` — genera una con:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
  y pégala en `.env`.

## 2. Crear la base de datos en Render

1. En tu dashboard de Render, clic en **New +** → **PostgreSQL**.
2. Dale un nombre (ej. `periodico-db`) y crea la base (plan gratuito).
3. Cuando esté lista, copia el **Internal Database URL** (para cuando tu
   backend también esté en Render) o el **External Database URL** (para
   probar desde tu WSL local mientras desarrollas).
4. Pega esa URL en tu `.env` local como `DATABASE_URL`.

## 3. Crear las tablas

Desde tu terminal de Ubuntu, con el `.env` ya configurado:

```bash
npm run init-db
```

Esto crea todas las tablas (`usuarios`, `noticias`, `eventos`, etc.) si no existen.

## 4. (Opcional) Migrar tus datos viejos

Si quieres conservar las noticias/eventos/etc. que ya tenías en los `.json`:

1. Copia tus archivos `.json` antiguos dentro de una carpeta nueva llamada
   `data-antiguo/` en la raíz de este proyecto.
2. Ejecuta, definiendo una contraseña nueva para tu usuario admin:
   ```bash
   NEW_ADMIN_PASSWORD="TuContraseñaNuevaYSegura123!" npm run migrar-json
   ```
3. Si tenías imágenes de talentos subidas, copia también la carpeta
   `uploads/talentos/` vieja dentro de `uploads/talentos/` de este proyecto.

Si no te importa conservar los datos viejos (es un proyecto de práctica),
puedes saltarte este paso — la primera vez que inicie sesión con el usuario
que quieras crear a mano, usando la ruta `POST /api/usuarios` o insertándolo
tú mismo con SQL.

## 5. Probar en local

```bash
npm run dev
```

Visita `http://localhost:3000` y `http://localhost:3000/admin`.

## 6. Subir a GitHub

Como ahora sí existe `.gitignore`, `node_modules` y `.env` no se subirán.
Si tu repositorio viejo ya tenía `node_modules` o la contraseña expuesta en
su historial, es importante limpiarlo (pregúntame si quieres que te ayude
con esto — implica reescribir el historial de git).

```bash
git add .
git commit -m "Reescritura del backend con PostgreSQL y seguridad mejorada"
git push
```

## 7. Desplegar en Render

1. En Render: **New +** → **Web Service** → conecta tu repositorio de GitHub.
2. Configura:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
3. En la pestaña **Environment**, agrega las variables:
   - `DATABASE_URL` → el **Internal Database URL** de tu base (paso 2)
   - `JWT_SECRET` → la misma clave que generaste (o una nueva)
   - `FRONTEND_ORIGIN` → la URL de tu frontend cuando la tengas desplegada
   - `NODE_ENV` → `production`
4. Despliega. La primera vez, entra a la **Shell** de Render (o corre
   localmente apuntando al `DATABASE_URL` externo) y ejecuta `npm run init-db`
   una sola vez para crear las tablas en producción.

### ⚠️ Nota sobre las imágenes de talentos

Render **no conserva archivos subidos** entre reinicios/despliegues, incluso
con PostgreSQL ya migrado — el problema de "se pierden los datos" solo se
resolvió para lo que vive en la base, no para las imágenes en `uploads/`.
Para eso, más adelante conviene subir las imágenes a un servicio externo
como Cloudinary o un bucket S3, en vez de guardarlas en el disco del server.
Puedo ayudarte con eso cuando quieras.
