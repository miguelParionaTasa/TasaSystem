const bcrypt = require("bcryptjs");
const prisma = require("../controllers/prisma");

const BCRYPT_PATTERN = /^\$2[aby]\$\d{2}\$/;
const apply = process.argv.includes("--apply");

const main = async () => {
  const users = await prisma.user.findMany({ select: { id: true, password: true } });
  const legacy = users.filter((user) => !BCRYPT_PATTERN.test(user.password));
  console.log(`Usuarios revisados: ${users.length}`);
  console.log(`Contraseñas en texto plano detectadas: ${legacy.length}`);
  if (!apply) {
    console.log("Modo verificación: no se realizó ningún cambio. Usa npm run passwords:migrate después del backup.");
    return;
  }
  let migrated = 0;
  for (const user of legacy) {
    const passwordHash = await bcrypt.hash(user.password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: passwordHash, passwordChangedAt: new Date(), tokenVersion: { increment: 1 } },
    });
    migrated += 1;
  }
  console.log(`Contraseñas migradas a bcrypt: ${migrated}`);
  console.log("El script es idempotente: una segunda ejecución no vuelve a hashear contraseñas bcrypt.");
};

main()
  .catch((error) => {
    console.error("Migración de contraseñas fallida:", error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
