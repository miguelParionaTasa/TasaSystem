const crypto = require("node:crypto");
const ExcelJS = require("exceljs");

const normalizeHeader = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

const cellValue = (cell) => {
  const value = cell.value;
  if (value && typeof value === "object") {
    if (value.result !== undefined) return value.result;
    if (value.text !== undefined) return value.text;
    if (value.richText) return value.richText.map((part) => part.text).join("");
  }
  return value;
};

const readFirstSheet = async (buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const headers = [];
  worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, column) => {
    headers[column] = normalizeHeader(cellValue(cell));
  });

  const rows = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const item = {};
    let hasValue = false;
    headers.forEach((header, column) => {
      if (!header) return;
      const value = cellValue(row.getCell(column));
      const normalized = typeof value === "string" ? value.trim() : value;
      if (normalized !== null && normalized !== undefined && normalized !== "") hasValue = true;
      item[header] = normalized === "" ? null : normalized;
    });
    if (hasValue) rows.push({ rowNumber, data: item });
  });
  return rows;
};

const checksum = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");

module.exports = { readFirstSheet, checksum, normalizeHeader };
