const ExcelJS = require("exceljs");
const prisma = require("./prisma");

/**
 * Evita problemas al exportar valores especiales a Excel.
 * También protege frente a fórmulas inyectadas en cadenas.
 */
const safeCell = (value) => {
  if (value === null || value === undefined) return "";

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return "(Fecha inválida)";
    }

    const pad = (n) => String(n).padStart(2, "0");

    return `${pad(value.getDate())}/${pad(
      value.getMonth() + 1
    )}/${value.getFullYear()} ${pad(value.getHours())}:${pad(
      value.getMinutes()
    )}:${pad(value.getSeconds())}`;
  }

  if (typeof value === "object") {
    return JSON.stringify(
      value,
      (_, item) => (typeof item === "bigint" ? item.toString() : item)
    );
  }

  /**
   * Evita que Excel interprete texto proveniente de BD
   * como fórmula.
   */
  if (
    typeof value === "string" &&
    /^[=+\-@]/.test(value)
  ) {
    return `'${value}`;
  }

  return value;
};

async function exportDatabase(req, res) {
  try {
    const plantaId = req.plantaId || null;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    const nombreArchivo = plantaId
      ? `TasaSystem_planta_${plantaId}.xlsx`
      : "TasaSystem_base_datos.xlsx";

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${nombreArchivo}"`
    );

    res.setHeader("Cache-Control", "no-store");

    /**
     * STREAMING:
     * El Excel se escribe directamente en la respuesta HTTP.
     * Así evitamos generar todo el archivo primero en memoria RAM.
     */
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      stream: res,
      useStyles: true,
      useSharedStrings: true,
    });

    workbook.creator = "TASA System";
    workbook.created = new Date();

    /**
     * Unión de los modelos que existían en MAIN
     * + modelos incorporados con temporadas/multiplanta.
     */
    const modelKeys = [
      {
        name: "Users",
        delegate: prisma.user,
      },
      {
        name: "Areas",
        delegate: prisma.area,
      },
      {
        name: "Ots",
        delegate: prisma.ots,
      },
      {
        name: "OTConsumibles",
        delegate: prisma.oTConsumible,
        includeImages: true,
      },
      {
        name: "OTMovimientosSAP",
        delegate: prisma.oTMovimientoSAP,
      },
      {
        name: "Consumibles",
        delegate: prisma.consumible,
      },
      {
        name: "Zonas",
        delegate: prisma.zona,
      },
      {
        name: "Ubicaciones",
        delegate: prisma.ubicacion,
      },
      {
        name: "Lubricaciones",
        delegate: prisma.lubricacion,
        includeImages: true,
      },
      {
        name: "Componentes",
        delegate: prisma.componente,
        includeImages: true,
      },
      {
        name: "Atributos",
        delegate: prisma.atributo,
        includeImages: true,
      },
      {
        name: "Clinicas",
        delegate: prisma.clinica,
        includeImages: true,
      },
      {
        name: "ClinicaHistoriales",
        delegate: prisma.clinicaHistorial,
      },
      {
        name: "Activos",
        delegate: prisma.activo,
        includeImages: true,
      },
      {
        name: "ActivoHistoriales",
        delegate: prisma.activoHistorial,
      },
      {
        name: "AtributoHistoriales",
        delegate: prisma.atributoHistorial,
      },
      {
        name: "Repuestos",
        delegate: prisma.repuesto,
        includeImages: true,
      },
      {
        name: "Equipos",
        delegate: prisma.equipo,
        includeImages: true,
      },
      {
        name: "Images",
        delegate: prisma.image,
      },
      {
        name: "OTbasicos",
        delegate: prisma.oTbasico,
      },
      {
        name: "Historicos",
        delegate: prisma.historico,
      },
      {
        name: "InventarioItems",
        delegate: prisma.inventarioItem,
      },
      {
        name: "HistorialItems",
        delegate: prisma.historialItem,
      },
      {
        name: "Configuraciones",
        delegate: prisma.configuracion,
      },
      {
        name: "Predictivos",
        delegate: prisma.predictivo,
        includeImages: true,
      },
      {
        name: "Procesos",
        delegate: prisma.procesos,
        includeImages: true,
      },
      {
        name: "ProcesosHistoriales",
        delegate: prisma.procesosHistorial,
      },
      {
        name: "TarjetasRojas",
        delegate: prisma.tarjetaRoja,
        includeImages: true,
      },
      {
        name: "TarjetaRojaHistoriales",
        delegate: prisma.tarjetaRojaHistorial,
      },
      {
        name: "TelegramUsers",
        delegate: prisma.telegramUser,
      },
      {
        name: "OTBots",
        delegate: prisma.oTBot,
      },
      {
        name: "OTConsumibleBots",
        delegate: prisma.oTConsumibleBot,
      },

      /**
       * NUEVOS MODELOS
       * incorporados en seguridad / multiplanta / temporadas.
       */
      {
        name: "SolicitudesUnificadas",
        delegate: prisma.solicitudMaterial,
      },
      {
        name: "SolicitudDetalles",
        delegate: prisma.solicitudMaterialDetalle,

        /**
         * Esta consulta ya venía filtrada por planta
         * en tu versión multiplanta.
         */
        buildWhere: () => {
          if (!plantaId) {
            return undefined;
          }

          return {
            solicitud: {
              plantaId: plantaId,
            },
          };
        },
      },
      {
        name: "Temporadas",
        delegate: prisma.temporada,
      },
    ];

    /**
     * Procesamos 5,000 registros por bloque.
     * Reduce significativamente el consumo de memoria.
     */
    const CHUNK_SIZE = 5000;

    for (const model of modelKeys) {
      /**
       * Excel permite máximo 31 caracteres por nombre de hoja.
       */
      const worksheet = workbook.addWorksheet(
        model.name.slice(0, 31),
        {
          views: [
            {
              state: "frozen",
              ySplit: 1,
            },
          ],
        }
      );

      let skip = 0;
      let hasMore = true;
      let columnsSet = false;

      while (hasMore) {
        const queryOptions = {
          skip,
          take: CHUNK_SIZE,
          orderBy: {
            id: "asc",
          },
        };

        /**
         * Algunos modelos tienen imágenes relacionadas.
         */
        if (model.includeImages) {
          queryOptions.include = {
            images: true,
          };
        }

        /**
         * Permite consultas especiales,
         * por ejemplo SolicitudDetalles por planta.
         */
        if (typeof model.buildWhere === "function") {
          const where = model.buildWhere();

          if (where) {
            queryOptions.where = where;
          }
        }

        const rows = await model.delegate.findMany(queryOptions);

        if (rows.length === 0) {
          if (skip === 0) {
            worksheet
              .addRow([
                plantaId
                  ? "Sin datos para la planta seleccionada"
                  : "Sin datos registrados en esta tabla",
              ])
              .commit();
          }

          hasMore = false;
          break;
        }

        /**
         * Creamos las columnas a partir del primer registro.
         */
        if (!columnsSet) {
          const keys = Object.keys(rows[0]);

          worksheet.columns = keys.map((key) => ({
            header: key,
            key,
            width: Math.min(
              Math.max(key.length + 4, 14),
              42
            ),
          }));

          worksheet.autoFilter = {
            from: {
              row: 1,
              column: 1,
            },
            to: {
              row: 1,
              column: keys.length,
            },
          };

          columnsSet = true;
        }

        for (const row of rows) {
          const newRow = {};

          for (const [key, originalValue] of Object.entries(row)) {
            let value = originalValue;

            /**
             * Las imágenes relacionadas se convierten
             * en una lista de URLs.
             */
            if (
              key === "images" &&
              Array.isArray(value)
            ) {
              value =
                value.length > 0
                  ? value
                      .map((img) => {
                        if (img && img.url) {
                          return img.url;
                        }

                        return safeCell(img);
                      })
                      .join(", ")
                  : "(Sin imagen)";
            }

            newRow[key] = safeCell(value);
          }

          worksheet.addRow(newRow).commit();
        }

        if (rows.length < CHUNK_SIZE) {
          hasMore = false;
        } else {
          skip += CHUNK_SIZE;
        }
      }

      worksheet.commit();
    }

    await workbook.commit();
  } catch (error) {
    console.error(
      "❌ Error crítico en el streaming del exportador:",
      error
    );

    if (!res.headersSent) {
      return res.status(500).json({
        message:
          "Error interno al procesar la exportación de datos",
      });
    }

    if (!res.writableEnded) {
      res.end();
    }
  }
}

module.exports = {
  exportDatabase,
};