import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../axios";

const IMPORTS = {
  sap: { label: "Reservas y movimientos SAP", endpoint: "/sap-movimientos/import", needsSeason: true },
  otbot: { label: "OT disponibles para Telegram", endpoint: "/otbot/import", needsSeason: true },
  activos: { label: "Activos de planta", endpoint: "/importaciones/activos", needsSeason: false },
};

const MovimientosSap = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("sap");
  const [seasons, setSeasons] = useState([]);
  const [seasonId, setSeasonId] = useState("");
  const [mode, setMode] = useState("MERGE");
  const role = localStorage.getItem("userRole");
  const allowed = ["SUPER_ADMIN", "ADMIN_PLANTA"].includes(role);

  useEffect(() => {
    api.get("/admin/temporadas").then(({ data }) => {
      setSeasons(data);
      setSeasonId(String(data.find((item) => item.activa)?.id || data[0]?.id || ""));
    }).catch(() => setSeasons([]));
  }, []);

  const importFile = async () => {
    if (!allowed) return toast.error("Solo un administrador puede importar.");
    if (!file) return toast.error("Selecciona un archivo XLSX.");
    if (IMPORTS[type].needsSeason && !seasonId) return toast.error("Selecciona una temporada.");
    const body = new FormData();
    body.append("image", file);
    if (seasonId) body.append("temporadaId", seasonId);
    if (type === "sap") body.append("modo", mode);
    try {
      setLoading(true);
      const { data } = await api.post(IMPORTS[type].endpoint, body, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(`Importación ${data.importacionId}: ${data.creados ?? 0} creados, ${data.actualizados ?? 0} actualizados, ${data.errores?.length || 0} observaciones.`);
      setFile(null);
      document.getElementById("input-file").value = "";
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al importar el archivo.");
    } finally { setLoading(false); }
  };

  const downloadTemplate = async () => {
    const { data } = await api.get("/importaciones/activos/plantilla", { responseType: "blob" });
    const url = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Plantilla_Importacion_Activos.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!allowed) return <div className="p-6 text-center text-red-700">Este módulo requiere rol ADMIN_PLANTA o SUPER_ADMIN.</div>;
  return <main className="p-6 max-w-2xl mx-auto">
    <h1 className="text-2xl font-semibold mb-2">Importaciones controladas</h1>
    <p className="text-gray-600 mb-6">Cada carga registra archivo, usuario, planta, totales y errores por fila. La planta se toma de la sesión, nunca del Excel.</p>
    <section className="bg-white shadow rounded p-6 space-y-4">
      <label className="block font-medium">Tipo de importación<select value={type} onChange={(e) => setType(e.target.value)} className="block border p-2 rounded w-full mt-1">{Object.entries(IMPORTS).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select></label>
      {IMPORTS[type].needsSeason && <label className="block font-medium">Temporada<select value={seasonId} onChange={(e) => setSeasonId(e.target.value)} className="block border p-2 rounded w-full mt-1"><option value="">Seleccionar</option>{seasons.map((item) => <option key={item.id} value={item.id}>{item.codigo}{item.activa ? " · activa" : ""}</option>)}</select></label>}
      {type === "sap" && <label className="block font-medium">Modo<select value={mode} onChange={(e) => setMode(e.target.value)} className="block border p-2 rounded w-full mt-1"><option value="MERGE">Combinar: no elimina registros ausentes</option><option value="SNAPSHOT">Instantánea: reemplaza solo las OT del archivo en la temporada</option></select></label>}
      {type === "activos" && <div className="rounded bg-blue-50 p-3"><p className="mb-2">La carga actualiza por <code>codigo_activo</code> y agrega nuevos. Zona, ubicación y equipo pueden quedar vacíos.</p><button type="button" onClick={downloadTemplate} className="text-blue-700 underline">Descargar plantilla de activos</button></div>}
      <label className="block font-medium">Archivo XLSX<input id="input-file" type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files[0] || null)} className="block border p-2 rounded w-full mt-1" /></label>
      <button onClick={importFile} disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded disabled:bg-gray-400">{loading ? "Importando…" : "Importar"}</button>
    </section>
  </main>;
};

export default MovimientosSap;
