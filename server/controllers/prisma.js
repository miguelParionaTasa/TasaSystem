// controllers/prisma.js
const { PrismaClient } = require("@prisma/client");
const { prismaTenantMiddleware } = require("../security/prismaTenantMiddleware");
const prisma = new PrismaClient();

prisma.$use(prismaTenantMiddleware);

module.exports = prisma;
