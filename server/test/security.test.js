const test = require("node:test");
const assert = require("node:assert/strict");
const ExcelJS = require("exceljs");

process.env.DATABASE_URL ||= "postgresql://user:password@localhost:5432/tasasystem";
process.env.JWT_SECRET ||= "0123456789abcdef0123456789abcdef";
process.env.TELEGRAM_DATA_KEY ||= "abcdef0123456789abcdef0123456789";

const { normalizeSeasonCode } = require("../controllers/adminController");
const { hashTelegramId, encryptTelegramId, decryptTelegramId } = require("../security/cryptoTelegram");
const { sanitize } = require("../services/auditService");
const { readFirstSheet } = require("../services/excelImportService");
const { tenantStorage } = require("../security/tenantContext");
const { prismaTenantMiddleware } = require("../security/prismaTenantMiddleware");

test("normaliza temporadas CHIV 1/2 por año", () => {
  assert.deepEqual(normalizeSeasonCode({ numero: 1, anio: 2025 }), { tipo: "CHIV", numero: 1, anio: 2025, codigo: "CHIV1-25" });
  assert.deepEqual(normalizeSeasonCode({ tipo: "chiv", numero: "2", anio: "2026" }), { tipo: "CHIV", numero: 2, anio: 2026, codigo: "CHIV2-26" });
  assert.throws(() => normalizeSeasonCode({ numero: 3, anio: 2025 }));
});

test("protege el ID de Telegram con HMAC y AES-GCM", () => {
  const id = "123456789";
  assert.equal(hashTelegramId(id), hashTelegramId(id));
  assert.notEqual(hashTelegramId(id), id);
  const first = encryptTelegramId(id);
  const second = encryptTelegramId(id);
  assert.notEqual(first, second);
  assert.equal(decryptTelegramId(first), id);
});

test("la auditoría elimina campos sensibles", () => {
  const result = sanitize({ username: "operador", password: "secreto", nested: { token: "jwt" } });
  assert.deepEqual(result, { username: "operador", password: "[PROTEGIDO]", nested: { token: "[PROTEGIDO]" } });
});

test("lector XLSX normaliza encabezados sin convertir identificadores", async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("ACTIVOS");
  sheet.addRow(["Código Activo", "Nombre", "Serie"]);
  sheet.addRow(["000123", "Motor", "SN-01"]);
  const buffer = await workbook.xlsx.writeBuffer();
  const rows = await readFirstSheet(buffer);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].data, { codigo_activo: "000123", nombre: "Motor", serie: "SN-01" });
});

test("el tenant impide cambiar planta mediante mass assignment", async () => {
  const scoped = await tenantStorage.run(
    { plantaId: 7 },
    () => prismaTenantMiddleware(
      { model: "Activo", action: "update", args: { where: { id: 10 }, data: { nombre: "Motor", plantaId: 99 } } },
      async (params) => params
    )
  );
  assert.deepEqual(scoped.args.where, { id: 10, plantaId: 7 });
  assert.equal(scoped.args.data.plantaId, 7);

  const transfer = await tenantStorage.run(
    { plantaId: 7, allowPlantTransfer: true },
    () => prismaTenantMiddleware(
      { model: "Activo", action: "update", args: { where: { id: 10 }, data: { plantaId: 99 } } },
      async (params) => params
    )
  );
  assert.equal(transfer.args.data.plantaId, 99);
});
