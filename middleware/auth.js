const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  // Preferimos fallar rápido en vez de correr con una clave insegura por defecto.
  throw new Error('Falta la variable de entorno JWT_SECRET. Defínela en tu .env');
}

function verificarToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token requerido' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  }
}

// Middleware adicional: exige uno de los roles indicados.
function requiereRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ success: false, message: 'Sin permiso' });
    }
    next();
  };
}

module.exports = { verificarToken, requiereRol, JWT_SECRET };
