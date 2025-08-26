import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const API_URL = `${process.env.REACT_APP_API_URL}lubricacion`;

export default function LubricacionesPage() {
  const [zona, setZona] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [lubricante, setLubricante] = useState("");
  const [ubicacionesDisponibles, setUbicacionesDisponibles] = useState([]);
  const [lubricantesDisponibles, setLubricantesDisponibles] = useState([]);
  const [data, setData] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [file, setFile] = useState(null);

  // Opciones de zonas mapeadas
  const zonasMap = [
    { value: "2", label: "RECEPCION MP" },
    { value: "3.1", label: "PAMA 1 y 3" },
    { value: "3.2", label: "PAMA 2" },
    { value: "4", label: "COCINA-PRENSA" },
    { value: "5.1", label: "SECADO RTD" },
    { value: "5.2", label: "SECADO RTB" },
    { value: "5.3", label: "SECADO HLT" },
    { value: "6", label: "ENFRIADO" },
    { value: "7", label: "MOLIENDA" },
    { value: "8", label: "SECADO" },
    { value: "9.1", label: "SEPARADORAS" },
    { value: "9.2", label: "CENTRIFUGAS Y PULIDORA" },
    { value: "10", label: "PLANTA EVAPORADOR" },
  ];

  // Cargar opciones dinámicas según zona
  useEffect(() => {
    if (zona) {
      axios.get(`${API_URL}/ubicaciones?zona=${zona}`).then((res) => {
        setUbicacionesDisponibles(res.data);
      });
      axios.get(`${API_URL}/lubricantes?zona=${zona}`).then((res) => {
        setLubricantesDisponibles(res.data);
      });
    }
  }, [zona]);

  const handleFiltrar = async () => {
    try {
      const { data } = await axios.get(API_URL, {
        params: { zona, ubicacion, lubricante },
      });
      setData(data);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudieron obtener los datos", "error");
    }
  };

  const handleEdit = (item) => {
    Swal.fire("Editar", `Aquí abrirías un modal para editar el item ${item.id}`, "info");
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, borrar",
      cancelButtonText: "Cancelar",
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        Swal.fire("Eliminado", "El registro fue borrado correctamente", "success");
        handleFiltrar();
      } catch (error) {
        Swal.fire("Error", "No se pudo borrar el registro", "error");
      }
    }
  };

  // Subir imagen
  const handleImageUpload = async (id) => {
    if (!file) {
      Swal.fire("Atención", "Selecciona una imagen primero.", "warning");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      await axios.put(`${API_URL}/${id}/imagen`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Swal.fire("¡Éxito!", "La imagen fue subida correctamente.", "success");
      setFile(null);
      setSelectedItem(null);
      handleFiltrar();
    } catch (error) {
      console.error("Error al subir imagen:", error);
      Swal.fire("Error", "Hubo un problema al subir la imagen.", "error");
    }
  };

  return (
    <div className="p-6">
      {/* Filtros */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-lg font-bold mb-4">Filtrar Lubricaciones</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={zona}
            onChange={(e) => setZona(e.target.value)}
            className="border rounded p-2"
          >
            <option value="">Seleccione Zona</option>
            {zonasMap.map((z) => (
              <option key={z.value} value={z.value}>
                {z.value} - {z.label}
              </option>
            ))}
          </select>

          <select
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            className="border rounded p-2"
            disabled={!zona}
          >
            <option value="">Seleccione Ubicación</option>
            {ubicacionesDisponibles.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          <select
            value={lubricante}
            onChange={(e) => setLubricante(e.target.value)}
            className="border rounded p-2"
            disabled={!zona}
          >
            <option value="">Seleccione Lubricante</option>
           {lubricantesDisponibles.map((l, idx) => (
  <option key={idx} value={l.lubricante}>
    {l.lubricante}
  </option>
))}
          </select>

          <button
            onClick={handleFiltrar}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Filtrar
          </button>
        </div>
      </div>
{/* Tabla simplificada */}
<div className="bg-white p-4 rounded shadow overflow-x-auto">
  <table className="min-w-full border border-black">
    <thead className="bg-gray-100 border-b border-black">
      <tr>
        <th className="p-2 border border-black">Zona</th>
        <th className="p-2 border border-black">Equipo</th>
        <th className="p-2 border border-black">Ubicación</th>
        <th className="p-2 border border-black">No ubicado</th>
        <th className="p-2 border border-black">Acción</th>
      </tr>
    </thead>
    <tbody>
  {Array.from(
    data.reduce((map, item) => {
      if (!map.has(item.equipo)) {
        map.set(item.equipo, item); // solo guarda el primer registro de cada equipo
      }
      return map;
    }, new Map()).values()
  ).map((item, index) => (
        <tr key={item.id} className={`border border-black ${index % 2 === 0 ? "bg-gray-50" : "bg-gray-100"}`}>
          <td className="p-2 border border-black">{item.zona}</td>
          <td className="p-2 border border-black">{item.equipo}</td>
          <td className="p-2 border border-black">{item.ubicacionId}</td>
          <td className="p-2 border border-black">{item.ubicacionTexto}</td>
          <td className="p-2 border border-black space-y-2">
            <button
              onClick={() => handleEdit(item)}
              className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 w-full"
            >
              Editar
            </button>
            <button
              onClick={() => handleDelete(item.id)}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 w-full"
            >
              Borrar
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>


    </div>
  );
}
