const express = require("express");
const prisma = require("./controllers/prisma"); // Importa la instancia centralizada de Prisma
const authController = require("./controllers/authController");
const upload = require("./config/multer"); // Importa el middleware multer configurado
const cors = require("cors");
const cloudinary = require("./config/cloudinary"); // Importa Cloudinary configurado
const { prismaMiddleware } = require("./middlewares/prismaMiddleware"); // Importa el middleware
const userRoutes = require("./routes/routes");
const variosRoutes = require("./routes/variosroutes");
const consumibleRoutes = require("./routes/consumibleRoutes");
const exportRoutes = require('./routes/export');
const equipoRoutes = require("./routes/equipoRoutes");
const componenteRoutes = require("./routes/componenteRoutes");
const atributoRoutes = require("./routes/atributoRoutes");
const otsRoutes = require("./routes/otsRoutes");
const lubricacionRoutes = require("./routes/lubricacionRoutes");
const ottRoutes = require("./routes/OTTRoute");
const historicoRoutes = require('./routes/historicoRoutes');
const otConsumibleRoutes = require("./routes/otConsumibleRoutes");
const inventarioRoutes = require("./routes/inventarioRoutes");
const debugRoutes = require('./routes/debugRoutes');
// Configuración de la aplicación
const app = express();
require('dotenv').config();
// Configura CORS
const corsOptions = {
  origin: "*", // Permite solicitudes desde cualquier origen mientras pruebas
  methods: "GET,POST,PUT,PATCH,DELETE", // Métodos HTTP permitidos
  allowedHeaders: "Content-Type,Authorization", // Encabezados permitidos
};
// Middleware para parsear JSON en las solicitudes
app.use(express.json());
// Usa el middleware cors en todas las rutas
app.use(cors(corsOptions));
app.use('/debug', debugRoutes);
app.use("/useres", userRoutes); // Rutas de usuario
app.use("/consumibles", consumibleRoutes);
app.use("/varios", variosRoutes);
app.use("/equipos", equipoRoutes);
app.use("/componentes", componenteRoutes);
app.use("/atributos", atributoRoutes);
app.use("/ots", otsRoutes);
app.use("/ott", ottRoutes);
app.use("/inventario", inventarioRoutes);
app.use("/otc", otConsumibleRoutes);
app.use("/lubricacion", lubricacionRoutes);
app.use("/historico", historicoRoutes);
app.use('/export', exportRoutes);

// Aplicar el middleware de Prisma
prisma.$use(prismaMiddleware); // Aplica el middleware aquí

// Rutas de autenticación (registro y login)
app.post("/register", authController.register);
app.post("/login", authController.login);

// Ruta GET /user para obtener los usuarios, incluyendo la contraseña (para pruebas)
app.get("/user", async (req, res) => {
  try {
    // Obtener todos los usuarios de la base de datos
    const users = await prisma.user.findMany({
      include: {
        area: true, // Incluir la información relacionada con 'area'
      },
    });

    if (!users || users.length === 0) {
      return res
        .status(404)
        .json({ message: "No hay usuarios en la base de datos" });
    }

    // Devolver los usuarios (incluyendo la contraseña para pruebas)
    res.status(200).json(users);
  } catch (error) {
    console.error("Error al obtener los usuarios:", error);
    res.status(500).json({ message: "Error al obtener los usuarios" });
  }
});

// Obtener la configuración (solo habrá un registro con id=1)
app.get("/configuracion", async (req, res) => {
  try {
    const config = await prisma.configuracion.findUnique({
      where: { id: 1 },
    });

    if (!config) {
      return res.status(404).json({ message: "Configuración no encontrada" });
    }

    res.json(config);
  } catch (error) {
    console.error("Error al obtener configuración:", error);
    res.status(500).json({ message: "Error al obtener configuración" });
  }
});

// Actualizar la fechaCorte
app.patch("/configuracion", async (req, res) => {
  try {
    const { fechaCorte } = req.body;

    const config = await prisma.configuracion.upsert({
      where: { id: 1 },
      update: { fechaCorte },
      create: { id: 1, fechaCorte },
    });

    res.json(config);
  } catch (error) {
    console.error("Error al actualizar configuración:", error);
    res.status(500).json({ message: "Error al actualizar configuración" });
  }
});

app.get('/ping', (req, res) => {
  res.send('OK');
});

// Cierre de conexiones al detener el servidor
process.on('SIGINT', async () => {
  console.log("Cerrando conexiones a la base de datos...");
  await prisma.$disconnect(); // Cierra las conexiones de Prisma
  process.exit(0); // Finaliza el proceso
});

process.on('SIGTERM', async () => {
  console.log("Cerrando conexiones a la base de datos...");
  await prisma.$disconnect(); // Cierra las conexiones de Prisma
  process.exit(0); // Finaliza el proceso
});


// Iniciar servidor
app.listen(3001, () => {
  console.log("Servidor corriendo en el puerto 3001");
});
