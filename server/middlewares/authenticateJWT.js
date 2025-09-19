const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const authenticateJWT = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) return res.status(401).send("Token requerido");

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).send("Token mal formado");

  try {
    const decoded = jwt.verify(token, JWT_SECRET); // verifica firma y expiración
    req.user = decoded; // Guardar info del usuario en la request
    next();
  } catch (e) {
    console.error("Error de JWT:", e.message);
    return res.status(401).send("Token inválido o expirado");
  }
};

module.exports = authenticateJWT;
