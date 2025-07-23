import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const Historico = () => {
  const [zonas, setZonas] = useState([]);
  const [zonaId, setZonaId] = useState("");
  const [ubicaciones, setUbicaciones] = useState([]);
  const [ubicacionId, setUbicacionId] = useState("");
  const [datosFiltrados, setDatosFiltrados] = useState([]);

  useEffect(() => {
    const obtenerZonas = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}varios/zonas`);
        setZonas(response.data);
      } catch (error) {
        toast.error("Error al cargar las zonas.");
        console.error("Error al obtener zonas:", error);
      }
    };
    obtenerZonas();
  }, []);

  useEffect(() => {
    const fetchUbicacionesPorZona = async () => {
      if (!zonaId) {
        setUbicaciones([]);
        return;
      }

      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}varios/ubicaciones/por-zona?zonaId=${zonaId}`);
        setUbicaciones(response.data);
      } catch (error) {
        toast.error("Error al cargar las ubicaciones.");
        console.error("Error al obtener ubicaciones por zona:", error);
      }
    };

    fetchUbicacionesPorZona();
  }, [zonaId]);

  const manejarFiltro = async () => {
    if (!zonaId) {
      toast.warning("Debes seleccionar una zona.");
      return;
    }

    try {
      const query = new URLSearchParams();
      query.append("zonaId", zonaId);
      if (ubicacionId) query.append("ubicacionId", ubicacionId);

      const response = await axios.get(`${process.env.REACT_APP_API_URL}historico/filtrar?${query.toString()}`);
      setDatosFiltrados(response.data);
    } catch (error) {
      toast.error("Error al filtrar históricos.");
      console.error("Error al filtrar:", error);
    }
  };

  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toISOString().split("T")[0]; // yyyy-mm-dd
  };

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-800">Histórico por Zona</h2>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <select
          value={zonaId}
          onChange={(e) => {
            setZonaId(e.target.value);
            setUbicacionId("");
            setDatosFiltrados([]);
          }}
          className="border p-2 rounded w-full sm:w-1/4"
        >
          <option value="">Seleccionar zona</option>
          {zonas.map((zona) => (
            <option key={zona.id} value={zona.id}>
              {zona.nombreMaximo}
            </option>
          ))}
        </select>

        <select
          value={ubicacionId}
          onChange={(e) => setUbicacionId(e.target.value)}
          className="border p-2 rounded w-full sm:w-1/4"
          disabled={!zonaId}
        >
          <option value="">Todas las ubicaciones</option>
          {ubicaciones.map((ubi) => (
            <option key={ubi.id} value={ubi.id}>
              {ubi.name}
            </option>
          ))}
        </select>

        <button
          onClick={manejarFiltro}
          className="bg-blue-100 text-black px-4 py-2 rounded hover:bg-blue-700 hover:text-white w-full sm:w-auto"
        >
          FILTRAR
        </button>
      </div>

      {/* Tabla responsive */}
      <div className="overflow-x-auto">
        {datosFiltrados.length > 0 ? (
          <table className="min-w-[900px] w-full border text-sm text-left">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-2 py-1">Zona</th>
                <th className="border px-2 py-1">Ubicación</th>
                <th className="border px-2 py-1">Fecha</th>
                <th className="border px-2 py-1">Trabajo</th>
                <th className="border px-2 py-1">OT</th>
                <th className="border px-2 py-1">Consumible</th>
                <th className="border px-2 py-1">UM</th>
                <th className="border px-2 py-1">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {datosFiltrados.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="border px-2 py-1">{h.zona}</td>
                  <td className="border px-2 py-1">{h.ubicacion?.slice(0, 35)}</td>
                  <td className="border px-2 py-1">{formatearFecha(h.fecha)}</td>
                  <td className="border px-2 py-1">{h.trabajo}</td>
                  <td className="border px-2 py-1">{h.ot}</td>
                  <td className="border px-2 py-1">
                    {(h.consumible?.length > 34 ? h.consumible.slice(0, 34) + "…" : h.consumible)}
                  </td>
                  <td className="border px-2 py-1">{h.unidadMedida}</td>
                  <td className="border px-2 py-1">{h.cantidad}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          zonaId && <p className="text-gray-600">No hay datos para mostrar.</p>
        )}
      </div>
    </div>
  );
};

export default Historico;
