import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import axios from 'axios';
import { FaEdit } from 'react-icons/fa';

const Reportes = () => {
  const [editBuffer, setEditBuffer] = useState({});
  const [componentes, setComponentes] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    zonaId: '',
    ubicacionId: '',
    hayPedidos: '',
  });

  const [zonas, setZonas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [equipos, setEquipos] = useState([]);

  // Cargar OTs
  useEffect(() => {
    const fetchOts = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}ott/ots`);
        if (!response.ok) throw new Error('Error en la respuesta de la red');
        const data = await response.json();
        setComponentes(data);
        setFilteredData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOts();
  }, []);

  // Cargar zonas
  useEffect(() => {
    const fetchZonas = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}varios/zonas`);
        setZonas(response.data);
      } catch (error) {
        setError("Error al cargar las zonas.");
        console.error("Error al cargar zonas:", error);
      }
    };
    fetchZonas();
  }, []);

  // Cargar ubicaciones por zona
  useEffect(() => {
    const fetchUbicacionesPorZona = async () => {
      if (!filters.zonaId) return;
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}varios/ubicaciones/por-zona?zonaId=${filters.zonaId}`
        );
        setUbicaciones(response.data);
      } catch (error) {
        setError("Error al cargar las ubicaciones de esta zona.");
        console.error("Error al cargar ubicaciones:", error);
      }
    };
    fetchUbicacionesPorZona();
  }, [filters.zonaId]);

  // Cargar equipos
  useEffect(() => {
    const fetchEquipos = async () => {
      if (!filters.zonaId) return;
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}equipos/por-zona/${filters.zonaId}`,
          {
            params: { ubicacionId: filters.ubicacionId || undefined },
          }
        );
        setEquipos(response.data);
      } catch (error) {
        setError("Error al cargar los equipos de esta zona.");
        console.error("Error al cargar equipos:", error);
      }
    };
    fetchEquipos();
  }, [filters.zonaId, filters.ubicacionId]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    const { zonaId, ubicacionId, hayPedidos } = filters;
    const filtered = componentes.filter((ot) => {
      const matchZona = zonaId ? ot.zonaId === parseInt(zonaId) : true;
      const matchUbicacion = ubicacionId ? ot.ubicacionId === parseInt(ubicacionId) : true;
      const matchPedidos =
        hayPedidos ? (hayPedidos === 'Si' ? ot.Ots?.length > 0 : ot.Ots?.length === 0) : true;
      return matchZona && matchUbicacion && matchPedidos;
    });
    setFilteredData(filtered);
  };

  const handleInputChange = (id, field, value) => {
    setEditBuffer((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleGuardarTecnicos = async (id) => {
    const otActual = filteredData.find((ot) => ot.id === id);

    const tecnico1 = editBuffer[id]?.tecnico1 ?? otActual.tecnico1 ?? '';
    const tecnico2 = editBuffer[id]?.tecnico2 ?? otActual.tecnico2 ?? '';

    let cambios = [];

if (tecnico1 !== otActual.tecnico1) 
  cambios.push(`Técnico: ${tecnico1}`);

if (tecnico2 !== otActual.tecnico2) 
  cambios.push(`Avance: ${tecnico2}%`);
    if (cambios.length === 0) {
      Swal.fire("Sin cambios", "No se detectaron modificaciones.", "info");
      return;
    }

    // Confirmación SweetAlert
    const confirm = await Swal.fire({
      title: "¿Estás seguro?",
      text: `Vas a modificar: ${cambios.join(" y ")}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, guardar",
      cancelButtonText: "No, cancelar",
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.put(`${process.env.REACT_APP_API_URL}ott/editar-tecnicos/${id}`, {
        tecnico1,
        tecnico2,
      });

      Swal.fire({
        icon: 'success',
        title: 'Guardado',
        text: 'Técnicos actualizados correctamente.',
        timer: 1500,
        showConfirmButton: false,
      });

      setFilteredData((prev) =>
        prev.map((ot) => (ot.id === id ? { ...ot, tecnico1, tecnico2 } : ot))
      );

      setEditBuffer((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    } catch (error) {
      console.error('Error al guardar técnicos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al guardar los técnicos. Inténtalo de nuevo.',
      });
    }
  };

  if (loading) {
    return <div className="p-4 max-w-screen-xl mx-auto text-center text-gray-700">Cargando...</div>;
  }

  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4 max-w-screen-xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 p-2">Filtrar Componentes</h2>

      {/* filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <select
          name="zonaId"
          value={filters.zonaId}
          onChange={handleFilterChange}
          className="border p-2 rounded w-full sm:w-1/4"
        >
          <option value="" disabled>Seleccionar zona</option>
          {zonas.map((zona) => (
            <option key={zona.id} value={zona.id}>{zona.name}</option>
          ))}
        </select>

        <select
          name="ubicacionId"
          value={filters.ubicacionId}
          onChange={handleFilterChange}
          className="border p-2 rounded w-full sm:w-1/4"
          disabled={!filters.zonaId}
        >
          <option value="">Sin seleccionar</option>
          {ubicaciones.map((ubicacion) => (
            <option key={ubicacion.id} value={ubicacion.id}>{ubicacion.name}</option>
          ))}
        </select>

        <select
          name="hayPedidos"
          value={filters.hayPedidos}
          onChange={handleFilterChange}
          className="border p-2 rounded w-full sm:w-1/4"
        >
          <option value="">Todos</option>
          <option value="Si">Si</option>
          <option value="No">No</option>
        </select>

        <button
          onClick={applyFilters}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded w-full sm:w-1/4"
        >
          Filtrar
        </button>
      </div>

      {/* resultados */}
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Resultados</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 text-sm text-center bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-2">N°</th>
              <th className="border px-2 py-2">Descripción</th>
              <th className="border px-2 py-2">Zona</th>
              <th className="border px-2 py-2">N° OT</th>
              <th className="border px-2 py-2">Hay pedidos?</th>
              <th className="border px-2 py-2">Técnico 1</th>
              <th className="border px-2 py-2">Avance %</th>
              <th className="border px-2 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {[...filteredData].sort((a, b) => a.id - b.id).map((ot, index) => (
              <tr key={ot.id} className="hover:bg-gray-50">
                <td className="border px-2 py-1">{index + 1}</td>
                <td className="border px-2 py-1">{ot.name}</td>
                <td className="border px-2 py-1">{ot.Zona?.name || '—'}</td>
                <td className="border px-2 py-1">{ot.OTmaximo}</td>
                <td className="border px-2 py-1">{ot.Ots && ot.Ots.length > 0 ? 'SI' : 'NO'}</td>
                <td className="border px-2 py-1">
                  <input
                    type="text"
                    value={editBuffer[ot.id]?.tecnico1 ?? ot.tecnico1 ?? ''}
                    onChange={(e) => handleInputChange(ot.id, 'tecnico1', e.target.value)}
                    className="w-full border rounded px-2 py-1"
                  />
                </td>
                <td className="border px-2 py-1">
                  <input
                    type="text"
                    value={editBuffer[ot.id]?.tecnico2 ?? ot.tecnico2 ?? ''}
                    onChange={(e) => handleInputChange(ot.id, 'tecnico2', e.target.value)}
                    className="w-full border rounded px-2 py-1"
                  />
                </td>
                <td className="border px-2 py-1">
                  <button
                    onClick={() => handleGuardarTecnicos(ot.id)}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Guardar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reportes;
