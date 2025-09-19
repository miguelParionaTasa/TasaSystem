import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const Atributo = () => {
  const [filter, setFilter] = useState({ zona: "", ubicacion: "", equipo: "" });
  const [zonas, setZonas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [atributos, setAtributos] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [newRow, setNewRow] = useState(null);

  const userId = localStorage.getItem("userId");

  // === Obtener zonas ===
  useEffect(() => {
    const fetchZonas = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}varios/zonas`
        );
        setZonas(response.data);
      } catch (error) {
        console.error("Error al obtener zonas:", error);
      }
    };
    fetchZonas();
  }, []);

  // === Obtener ubicaciones por zona ===
  useEffect(() => {
    const fetchUbicaciones = async () => {
      if (filter.zona) {
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}varios/ubicaciones/por-zona?zonaId=${filter.zona}`
          );
          setUbicaciones(response.data);
        } catch (error) {
          console.error("Error al obtener ubicaciones:", error);
        }
      } else {
        setUbicaciones([]);
        setEquipos([]);
        setFilter((prev) => ({ ...prev, ubicacion: "", equipo: "" }));
      }
    };
    fetchUbicaciones();
  }, [filter.zona]);

  // === Obtener equipos por ubicación ===
  useEffect(() => {
    const fetchEquipos = async () => {
      if (filter.ubicacion) {
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}equipos/por-zona/${filter.zona}?ubicacionId=${filter.ubicacion}`
          );
          setEquipos(response.data);
        } catch (error) {
          console.error("Error al obtener equipos:", error);
        }
      } else {
        setEquipos([]);
        setFilter((prev) => ({ ...prev, equipo: "" }));
      }
    };
    fetchEquipos();
  }, [filter.ubicacion, filter.zona]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  };

  // === Obtener atributos filtrados ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}atributos/search`,
        {
          params: {
            zonaId: filter.zona || undefined,
            ubicacionId: filter.ubicacion || undefined,
            equipoId: filter.equipo || undefined,
          },
        }
      );
      setAtributos(response.data || []);
    } catch (error) {
      console.error("Error al obtener atributos:", error);
    } finally {
      setLoading(false);
    }
  };

  // === Eliminar atributo ===
  const handleDelete = async (atr) => {
   const currentUserId = parseInt(localStorage.getItem("userId"));

if (currentUserId !== atr.userId) {
  Swal.fire(
    "No permitido",
    `No puedes eliminar este atributo, lo creó ${atr.user.firstName} ${atr.user.lastName}`,
    "error"
  );
  return; // no sigue con la acción de eliminar
}

    const result = await Swal.fire({
      title: "¿Está seguro?",
      text: `Se eliminará el atributo: ${atr.nombre}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
    });
    if (result.isConfirmed) {
      try {
        await axios.delete(
          `${process.env.REACT_APP_API_URL}atributos/${atr.id}`
        );
        Swal.fire("Eliminado", "El atributo fue eliminado", "success");
        handleSubmit(new Event("submit")); // refrescar
      } catch (error) {
        console.error("Error al eliminar:", error);
      }
    }
  };
const token = localStorage.getItem("token");

  // === Guardar edición ===
 const handleSaveEdit = async (atr) => {
  const token = localStorage.getItem("token"); 
  const currentUserId = parseInt(localStorage.getItem("userId")); // usuario logueado

  if (!token) {
    Swal.fire("Error", "No hay token disponible", "error");
    return;
  }

  // Validar que solo el creador pueda editar
  if (currentUserId !== atr.userId) {
    Swal.fire("No permitido", "No puedes editar un atributo que no creaste", "error");
    return;
  }

  const cambios = {};
  if (atr.nombre !== editedData.nombre) cambios.nombre = editedData.nombre;
  if (atr.valor !== editedData.valor) cambios.valor = editedData.valor;

  if (Object.keys(cambios).length === 0) {
    Swal.fire("Sin cambios", "No se realizaron cambios", "info");
    setEditingId(null);
    return;
  }

  const cambiosTexto = Object.entries(cambios)
    .map(([key, val]) => `${key}: "${atr[key]}" → "${val}"`)
    .join("\n");

  const result = await Swal.fire({
    title: "¿Confirmar cambios?",
    text: `Se realizarán los siguientes cambios:\n${cambiosTexto}`,
    icon: "info",
    showCancelButton: true,
    confirmButtonText: "Guardar",
  });

  if (result.isConfirmed) {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}atributos/${atr.id}`,
        { ...atr, ...cambios },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      Swal.fire("Actualizado", "El atributo fue actualizado", "success");
      setEditingId(null);
      handleSubmit(new Event("submit"));
    } catch (error) {
      console.error("Error al actualizar:", error.response || error);
      Swal.fire("Error", "No se pudo actualizar el atributo", "error");
    }
  }
};



  // === Guardar nueva fila ===
  const handleSaveNew = async () => {
  const errores = [];

  if (!filter.equipo) errores.push("no escogiste un equipo en el filtrado");
  if (!newRow?.nombre) errores.push("no ingresaste el nombre del atributo");
  if (!newRow?.valor) errores.push("no ingresaste el valor del atributo");

  if (errores.length > 0) {
    // Separar con comas y agregar "y" antes del último si hay más de uno
    const mensaje =
      errores.length === 1
        ? errores[0]
        : errores.slice(0, -1).join(", ") + " y " + errores[errores.length - 1];

    Swal.fire("Error", mensaje, "error");
    return;
  }

  try {
    await axios.post(`${process.env.REACT_APP_API_URL}atributos`, {
      ...newRow,
      equipoId: parseInt(filter.equipo),
      userId: parseInt(localStorage.getItem("userId")),
    });
    Swal.fire("Añadido", "El atributo fue creado", "success");
    setNewRow(null);
    handleSubmit(new Event("submit"));
  } catch (error) {
    console.error("Error al crear atributo:", error);
  }
};


  return (
    <div className="p-4 max-w-screen-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800">Consulta de Atributos</h1>

      {/* FORM DE FILTRO */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap items-end gap-4 bg-gray-50 p-4 rounded-md shadow-md mb-6"
      >
        {/* filtros */}
        <div>
          <label className="block font-semibold text-gray-700 mb-2">Zona</label>
          <select
            name="zona"
            value={filter.zona}
            onChange={handleFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Todas las zonas</option>
            {zonas.map((zona) => (
              <option key={zona.id} value={zona.id}>
                {zona.nombreMaximo}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold text-gray-700 mb-2">
            Ubicación
          </label>
          <select
            name="ubicacion"
            value={filter.ubicacion}
            onChange={handleFilterChange}
            className="w-[320px] truncate p-2 border border-gray-300 rounded-md"
            disabled={!filter.zona}
          >
            <option value="">Todas las ubicaciones</option>
            {ubicaciones.map((ubi) => (
              <option key={ubi.id} value={ubi.id}>
                {ubi.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold text-gray-700 mb-2">Equipo</label>
          <select
            name="equipo"
            value={filter.equipo}
            onChange={handleFilterChange}
            className="w-[320px] truncate p-2 border border-gray-300 rounded-md"
            disabled={!filter.ubicacion}
          >
            <option value="">Todos los equipos</option>
            {equipos.map((eq) => (
              <option key={eq.id} value={eq.id} className="truncate">
                {eq.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-3 flex justify-end mt-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Filtrar
          </button>
        </div>
      </form>

      {/* BOTONES */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setNewRow({ nombre: "", valor: "" })}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          ➕ Añadir atributo
        </button>
        <button
          onClick={() =>
            Swal.fire("Abrir imágenes", "Aquí va tu modal de Cloudinary", "info")
          }
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          📷 Ver imágenes
        </button>
      </div>

      {/* TABLA */}
      {loading ? (
        <p className="text-center mt-4">Cargando...</p>
      ) : atributos.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-400 text-center">
            <thead>
              <tr className="bg-gray-300 border border-gray-400">
                <th className="py-2 px-4 border border-gray-400">Zona</th>
                <th className="py-2 px-4 border border-gray-400">Ubicación</th>
                <th className="py-2 px-4 border border-gray-400">Equipo</th>
                <th className="py-2 px-4 border border-gray-400">Atributo</th>
                <th className="py-2 px-4 border border-gray-400">Valor</th>
                <th className="py-2 px-4 border border-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-gray-100">
                {/* FILA PARA NUEVO ATRIBUTO */}
              {newRow && (
                <tr className="bg-yellow-100">
                  <td className="border">-</td>
                  <td className="border">-</td>
                  <td className="border">Equipo seleccionado</td>
                  <td className="border">
                    <input
                      type="text"
                      value={newRow.nombre}
                      onChange={(e) =>
                        setNewRow((prev) => ({ ...prev, nombre: e.target.value }))
                      }
                      className="p-1 border rounded"
                    />
                  </td>
                  <td className="border">
                    <input
                      type="text"
                      value={newRow.valor}
                      onChange={(e) =>
                        setNewRow((prev) => ({ ...prev, valor: e.target.value }))
                      }
                      className="p-1 border rounded"
                    />
                  </td>
                  <td className="border">
                    <button
                      onClick={handleSaveNew}
                      className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                    >
                      Guardar
                    </button>
                  </td>
                </tr>
              )}
              {atributos.map((atr) => (
                <tr key={atr.id} className="border border-gray-400">
                  <td className="border">{atr.equipo?.ubicacion?.zona?.nombreMaximo || "N/A"}</td>
                  <td className="border">{atr.equipo?.ubicacion?.name || "N/A"}</td>
                  <td className="border w-[320px] truncate">{atr.equipo?.name || "N/A"}</td>
                  <td className="border">
                    {editingId === atr.id ? (
                      <input
                        type="text"
                        value={editedData.nombre}
                        onChange={(e) =>
                          setEditedData((prev) => ({ ...prev, nombre: e.target.value }))
                        }
                        className="p-1 border rounded"
                      />
                    ) : (
                      atr.nombre
                    )}
                  </td>
                  <td className="border">
                    {editingId === atr.id ? (
                      <input
                        type="text"
                        value={editedData.valor}
                        onChange={(e) =>
                          setEditedData((prev) => ({ ...prev, valor: e.target.value }))
                        }
                        className="p-1 border rounded"
                      />
                    ) : (
                      atr.valor
                    )}
                  </td>
                  <td className="border">
                    {editingId === atr.id ? (
                      <button
                        onClick={() => handleSaveEdit(atr)}
                        className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                      >
                        Guardar
                      </button>
                    ) : (
                      <div className="flex gap-2 justify-center">
                        <button
  onClick={() => {
    const currentUserId = parseInt(localStorage.getItem("userId")); // usuario logueado
    if (currentUserId !== atr.userId) {
      Swal.fire(
        "No permitido",
        `No puedes editar este atributo, lo creó el usuario: ${atr.user.username}`,
        "error"
      );
      return; // no se abre la edición
    }

    // Si es el creador, permitir edición inline
    setEditingId(atr.id);
    setEditedData({ nombre: atr.nombre, valor: atr.valor });
  }}
  className="text-blue-600 hover:underline"
>
  Editar
</button>

                        <button
                          onClick={() => handleDelete(atr)}
                          className="text-red-600 hover:underline"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              
            </tbody>
          </table>
        </div>
      ) : (
        !loading && <p className="text-center mt-4">No se encontraron atributos.</p>
      )}
    </div>
  );
};

export default Atributo;
