import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const Inventario = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroUbicacion, setFiltroUbicacion] = useState("");
  const [filtroDescripcion, setFiltroDescripcion] = useState("");

  // Usuarios (para salida)
  const [users, setUsers] = useState([]);

  // Modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSalidaModal, setShowSalidaModal] = useState(false);

  // -------- Historial modal --------
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [histItemSelected, setHistItemSelected] = useState(null);

  // Datos para agregar item
  const [newItem, setNewItem] = useState({
    descripcion: "",
    cantidad: 1,
    estado: "",
    ubicacion: "Electricista",
    nivel: "",
    fechaIngreso: "",
  });

  // Datos para salida
  const [salida, setSalida] = useState({
    itemId: "",
    cantidad: 1,
    destino: "",
    fechaSalida: "",
    responsableId: "",
    // filtros internos del modal de salida
    filtroUbicacion: "",
    filtroDescripcion: "",
  });
const [editItem, setEditItem] = useState({
  id: "",
  descripcion: "",
  cantidad: 1,
  estado: "",
  ubicacion: "Electricista",
  nivel: "",
  fechaIngreso: "",
});
const [showEditModal, setShowEditModal] = useState(false);

  // Carga de imagen
  const [file, setFile] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const API_URL = `${process.env.REACT_APP_API_URL}inventario`;
  const USER_URL = `${process.env.REACT_APP_API_URL}user`;

  // Helpers
  const formatDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toISOString().split("T")[0];
    } catch {
      return iso;
    }
  };

  // Cargar inventario
  const fetchInventario = async () => {
    try {
      const response = await axios.get(API_URL);
      setItems(response.data);
    } catch (error) {
      console.error("Error al obtener inventario:", error);
      Swal.fire("Error", "No se pudo cargar el inventario.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Cargar usuarios
  const fetchUsers = async () => {
    try {
      const response = await axios.get(USER_URL);
      setUsers(response.data);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
    }
  };

  useEffect(() => {
    fetchInventario();
    fetchUsers();
  }, []);

  // Ubicaciones únicas
  const ubicaciones = useMemo(() => {
    const setUbis = new Set(items.map((i) => i.ubicacion).filter(Boolean));
    return Array.from(setUbis).sort((a, b) => a.localeCompare(b));
  }, [items]);

  // Filtrado
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchUbicacion =
        !filtroUbicacion || item.ubicacion === filtroUbicacion;
      const matchDescripcion =
        !filtroDescripcion ||
        item.descripcion
          ?.toLowerCase()
          .includes(filtroDescripcion.toLowerCase());
      return matchUbicacion && matchDescripcion;
    });
  }, [items, filtroUbicacion, filtroDescripcion]);

  const clearFilters = () => {
    setFiltroUbicacion("");
    setFiltroDescripcion("");
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
      await axios.put(`${API_URL}/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Swal.fire("¡Éxito!", "La imagen fue subida correctamente.", "success");
      setFile(null);
      setSelectedItem(null);
      fetchInventario();
    } catch (error) {
      console.error("Error al subir imagen:", error);
      Swal.fire("Error", "Hubo un problema al subir la imagen.", "error");
    }
  };

  // ---- AGREGAR ITEM ----
  const handleAddItem = async () => {
    try {
      // Validaciones mínimas
      if (!newItem.descripcion.trim()) {
        Swal.fire("Error", "La descripción es obligatoria.", "error");
        return;
      }
      const cant = parseFloat(newItem.cantidad);
      if (isNaN(cant) || cant <= 0) {
        Swal.fire("Error", "La cantidad debe ser mayor a 0.", "error");
        return;
      }

      const responsableId = localStorage.getItem("userId");
      if (!responsableId) {
        Swal.fire("Error", "No se encontró el usuario logueado.", "error");
        return;
      }

      const payload = {
        ...newItem,
        responsableId: parseInt(responsableId),
        cantidad: parseFloat(newItem.cantidad),
        fechaIngreso: newItem.fechaIngreso || new Date(),
      };

      await axios.post(API_URL, payload);
      Swal.fire("¡Éxito!", "Item agregado correctamente.", "success");
      setShowAddModal(false);
      setNewItem({
        descripcion: "",
        cantidad: 1,
        estado: "",
        ubicacion: "Electricista",
        nivel: "",
        fechaIngreso: "",
      });
      fetchInventario();
    } catch (error) {
      console.error("Error al agregar item:", error);
      Swal.fire("Error", "No se pudo agregar el item.", "error");
    }
  };
  // ---- EDITAR ITEM ----
const openEditModal = (item) => {
  setEditItem({ ...item });
  setShowEditModal(true);
};

const handleEditItem = async () => {
  try {
    const payload = {
      descripcion: editItem.descripcion,
      cantidad: parseFloat(editItem.cantidad),
      estado: editItem.estado,
      ubicacion: editItem.ubicacion,
      nivel: editItem.nivel,
      fechaIngreso: editItem.fechaIngreso,
    };

    await axios.put(`${API_URL}/${editItem.id}`, payload);
    Swal.fire("¡Éxito!", "Item actualizado correctamente.", "success");
    setShowEditModal(false);
    fetchInventario();
  } catch (error) {
    console.error("Error al editar item:", error);
    Swal.fire("Error", "No se pudo editar el item.", "error");
  }
};

  // ---- SALIDA ITEM ----
  const handleSalidaItem = async () => {
    try {
      if (!salida.itemId) {
        Swal.fire("Error", "Seleccione un item válido.", "error");
        return;
      }

      const cant = parseFloat(salida.cantidad);
      if (cant <= 0) {
        Swal.fire("Error", "La cantidad debe ser mayor que 0.", "error");
        return;
      }

      // Convertir responsableId en nombre completo (como string) para tu backend actual
      let responsableStr = "";
      if (salida.responsableId) {
        const u = users.find((u) => u.id === parseInt(salida.responsableId, 10));
        if (u) responsableStr = `${u.firstName} ${u.lastName}`;
      } else {
        const firstName = localStorage.getItem("userName") || "Sin responsable";
        responsableStr = firstName;
      }

      const payload = {
        inventarioId: parseInt(salida.itemId, 10),
        fechaUso: salida.fechaSalida || new Date().toISOString(),
        cantidadUsada: cant,
        descripcionUso: `Salida de ${cant} unidad(es)`,
        destino: salida.destino,
        responsable: responsableStr,
      };

      await axios.post(`${API_URL}/salida`, payload);
      Swal.fire("¡Éxito!", "Salida registrada correctamente.", "success");

      // Resetear estado y recargar inventario
      setShowSalidaModal(false);
      setSalida({
        itemId: "",
        cantidad: 1,
        destino: "",
        fechaSalida: "",
        responsableId: "",
        filtroUbicacion: "",
        filtroDescripcion: "",
      });
      fetchInventario();
    } catch (error) {
      console.error("Error en salida de item:", error);
      Swal.fire(
        "Error",
        error?.response?.data?.message || "No se pudo registrar la salida.",
        "error"
      );
    }
  };

  // ---- HISTORIAL ----
  const openHistorial = async (itemId) => {
    setHistItemSelected(itemId);
    setShowHistorialModal(true);
    setLoadingHistorial(true);
    setHistorial([]);

    try {
      const { data } = await axios.get(`${API_URL}/${itemId}/historial`);
      setHistorial(data);
    } catch (err) {
      console.error("Error al obtener historial:", err);
      Swal.fire("Error", "No se pudo cargar el historial.", "error");
      setShowHistorialModal(false);
    } finally {
      setLoadingHistorial(false);
    }
  };

  if (loading) return <div className="text-center p-6">Cargando inventario...</div>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Inventario
      </h1>

      {/* Botones de acciones */}
      <div className="flex flex-wrap justify-center gap-4 mb-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          Agregar Items
        </button>
        <button
          onClick={() => setShowSalidaModal(true)}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
        >
          Salida de Items
        </button>
      </div>

      {/* Filtros */}
      <section className="bg-white rounded-xl shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filtrar por</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ubicación
            </label>
            <select
              value={filtroUbicacion}
              onChange={(e) => setFiltroUbicacion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              {ubicaciones.map((ubi) => (
                <option key={ubi} value={ubi}>
                  {ubi}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (contiene)
            </label>
            <input
              type="text"
              placeholder="Ej: electroválvula, cable, etc."
              value={filtroDescripcion}
              onChange={(e) => setFiltroDescripcion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {filteredItems.length} resultado(s)
          </span>
          <button
            onClick={clearFilters}
            className="text-sm text-gray-600 underline hover:text-gray-800"
          >
            Limpiar filtros
          </button>
        </div>
      </section>

      {/* Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white shadow rounded-xl p-6 text-center text-gray-500">
          No se encontraron resultados con los filtros aplicados.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 rounded-xl shadow hover:shadow-xl transition-transform transform hover:scale-105"
            >
            <div className="flex justify-between items-center">
  <h2 className="text-lg font-semibold text-gray-700 truncate">
    {item.descripcion}
  </h2>
  <button
    onClick={() => openEditModal(item)}
    className="text-sm text-red-600 hover:text-red-800 font-medium"
  >
    EDITAR
  </button>
</div>

              <p className="text-sm text-gray-500">Cantidad: {item.cantidad}</p>
              <p className="text-sm text-gray-500">
                Ubicación: {item.ubicacion}
              </p>
              <p className="text-sm text-gray-500">Estado: {item.estado}</p>

              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.descripcion}
                  className="w-full h-40 object-contain rounded mt-3 bg-gray-50 border"
                />
              ) : (
                <div className="w-full h-40 bg-gray-200 flex items-center justify-center mt-3 text-gray-500 rounded">
                  Sin imagen
                </div>
              )}

              {/* Acciones por card */}
              <div className="mt-3 flex justify-between items-center">
                {/* Agregar imagen */}
                {selectedItem === item.id ? (
                  <div className="w-full">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFile(e.target.files[0])}
                      className="mb-2 block text-sm text-gray-600"
                    />
                    <button
                      onClick={() => handleImageUpload(item.id)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                    >
                      Subir
                    </button>
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="ml-2 text-sm text-gray-500 hover:underline"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedItem(item.id)}
                    className="text-blue-600 hover:underline"
                  >
                    Agregar imagen
                  </button>
                )}

                {/* Ver historial */}
                <button
                  onClick={() => openHistorial(item.id)}
                  className="text-indigo-600 hover:underline"
                >
                  Ver historial
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL AGREGAR ITEM */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Agregar Item</h2>
            <div className="grid grid-cols-1 gap-3">
              <input
                type="text"
                placeholder="Descripción"
                value={newItem.descripcion}
                onChange={(e) =>
                  setNewItem({ ...newItem, descripcion: e.target.value })
                }
                className="border rounded px-3 py-2"
              />
              <label className="block text-sm font-medium text-gray-700 mb-1">
    Cantidad
  </label>

              <input
                type="number"
                step="0.01"
                placeholder="Cantidad"
                value={newItem.cantidad}
                onChange={(e) =>
                  setNewItem({ ...newItem, cantidad: e.target.value })
                }
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Estado"
                value={newItem.estado}
                onChange={(e) =>
                  setNewItem({ ...newItem, estado: e.target.value })
                }
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Lugar exacto (nivel)"
                value={newItem.nivel}
                onChange={(e) =>
                  setNewItem({ ...newItem, nivel: e.target.value })
                }
                className="border rounded px-3 py-2"
              />
              <select
                value={newItem.ubicacion}
                onChange={(e) =>
                  setNewItem({ ...newItem, ubicacion: e.target.value })
                }
                className="border rounded px-3 py-2"
              >
                <option>Electricista</option>
                <option>Mecánico</option>
                <option>Torno</option>
                <option>Boris</option>
              </select>
              <label className="block text-sm text-gray-600 mt-2">
                Fecha ingreso:
              </label>
              <input
                type="date"
                value={newItem.fechaIngreso}
                onChange={(e) =>
                  setNewItem({ ...newItem, fechaIngreso: e.target.value })
                }
                className="border rounded px-3 py-2"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddItem}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SALIDA ITEM */}
      {showSalidaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-xl">
            <h2 className="text-xl font-bold mb-4">Salida de Item</h2>

            {/* Filtros internos */}
            <section className="bg-gray-50 p-3 rounded-lg mb-4 border">
              <h3 className="text-sm font-medium text-gray-600 mb-2">
                Filtrar items
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <select
                  value={salida.filtroUbicacion || ""}
                  onChange={(e) =>
                    setSalida((prev) => ({
                      ...prev,
                      filtroUbicacion: e.target.value,
                      itemId: "",
                    }))
                  }
                  className="border px-2 py-1 rounded"
                >
                  <option value="">Todas las ubicaciones</option>
                  {ubicaciones.map((ubi) => (
                    <option key={ubi} value={ubi}>
                      {ubi}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Buscar por descripción..."
                  value={salida.filtroDescripcion || ""}
                  onChange={(e) =>
                    setSalida((prev) => ({
                      ...prev,
                      filtroDescripcion: e.target.value,
                      itemId: "",
                    }))
                  }
                  className="border px-2 py-1 rounded"
                />
              </div>
            </section>

            {/* Select de Items Filtrados */}
            <div className="grid grid-cols-1 gap-3">
              <select
                value={salida.itemId}
                onChange={(e) =>
                  setSalida({ ...salida, itemId: e.target.value })
                }
                className="border rounded px-3 py-2"
              >
                <option value="">Seleccione Item</option>
                {items
                  .filter((i) => {
                    const matchUbicacion =
                      !salida.filtroUbicacion ||
                      i.ubicacion === salida.filtroUbicacion;
                    const matchDescripcion =
                      !salida.filtroDescripcion ||
                      i.descripcion
                        .toLowerCase()
                        .includes(salida.filtroDescripcion.toLowerCase());
                    return matchUbicacion && matchDescripcion;
                  })
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.descripcion} (Stock: {item.cantidad})
                    </option>
                  ))}
              </select>
 <label className="block text-sm font-medium text-gray-700 mb-1">
    Cantidad
  </label>
              <input
                type="number"
                step="0.01"
                placeholder="Cantidad a retirar"
                value={salida.cantidad}
                onChange={(e) =>
                  setSalida({ ...salida, cantidad: e.target.value })
                }
                className="border rounded px-3 py-2"
              />

              <input
                type="text"
                placeholder="Destino"
                value={salida.destino}
                onChange={(e) =>
                  setSalida({ ...salida, destino: e.target.value })
                }
                className="border rounded px-3 py-2"
              />

              <label className="block text-sm text-gray-600 mt-2">
                Fecha salida:
              </label>
              <input
                type="date"
                value={salida.fechaSalida}
                onChange={(e) =>
                  setSalida({ ...salida, fechaSalida: e.target.value })
                }
                className="border rounded px-3 py-2"
              />

              <select
                value={salida.responsableId}
                onChange={(e) =>
                  setSalida({ ...salida, responsableId: e.target.value })
                }
                className="border rounded px-3 py-2"
              >
                <option value="">Sin responsable</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowSalidaModal(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalidaItem}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                Registrar salida
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HISTORIAL */}
      {showHistorialModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              Historial de movimientos (Item #{histItemSelected})
            </h2>
            <button
              onClick={() => setShowHistorialModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {loadingHistorial ? (
            <p className="text-center py-4">Cargando historial...</p>
          ) : historial.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              No hay movimientos registrados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-2 py-1">Fecha</th>
                    <th className="border px-2 py-1">Cant.</th>
                    <th className="border px-2 py-1">Destino</th>
                    <th className="border px-2 py-1">Responsable</th>
                    <th className="border px-2 py-1">Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((h) => (
                    <tr key={h.id} className="hover:bg-gray-50">
                      <td className="border px-2 py-1">
                        {formatDate(h.fechaUso)}
                      </td>
                      <td className="border px-2 py-1">{h.cantidadUsada}</td>
                      <td className="border px-2 py-1">{h.destino}</td>
                      <td className="border px-2 py-1">{h.responsable}</td>
                      <td className="border px-2 py-1">{h.descripcionUso}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 text-right">
            <button
              onClick={() => setShowHistorialModal(false)}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Cerrar
            </button>
          </div>
        </div>
        </div>
      )}
      {/* MODAL EDITAR ITEM */}
{showEditModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-full max-w-lg">
      <h2 className="text-xl font-bold mb-4">Editar Item</h2>
      <div className="grid grid-cols-1 gap-3">
        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <input
            type="text"
            placeholder="Descripción"
            value={editItem.descripcion}
            onChange={(e) =>
              setEditItem({ ...editItem, descripcion: e.target.value })
            }
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        {/* Cantidad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cantidad
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="Cantidad"
            value={editItem.cantidad}
            onChange={(e) =>
              setEditItem({ ...editItem, cantidad: e.target.value })
            }
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        {/* Estado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <input
            type="text"
            placeholder="Estado"
            value={editItem.estado}
            onChange={(e) =>
              setEditItem({ ...editItem, estado: e.target.value })
            }
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        {/* Nivel */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lugar exacto (Nivel)
          </label>
          <input
            type="text"
            placeholder="Lugar exacto (nivel)"
            value={editItem.nivel}
            onChange={(e) =>
              setEditItem({ ...editItem, nivel: e.target.value })
            }
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        {/* Ubicación */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ubicación
          </label>
          <select
            value={editItem.ubicacion}
            onChange={(e) =>
              setEditItem({ ...editItem, ubicacion: e.target.value })
            }
            className="border rounded px-3 py-2 w-full"
          >
            <option>Electricista</option>
            <option>Mecánico</option>
            <option>Torno</option>
            <option>Boris</option>
          </select>
        </div>

        {/* Fecha ingreso */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha ingreso
          </label>
          <input
            type="date"
            value={editItem.fechaIngreso?.split("T")[0]}
            onChange={(e) =>
              setEditItem({ ...editItem, fechaIngreso: e.target.value })
            }
            className="border rounded px-3 py-2 w-full"
          />
        </div>
      </div>

      {/* Botones */}
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={() => setShowEditModal(false)}
          className="px-4 py-2 bg-gray-300 rounded"
        >
          Cancelar
        </button>
        <button
          onClick={handleEditItem}
          className="px-4 py-2 bg-yellow-600 text-white rounded"
        >
          Guardar cambios
        </button>
      </div>
    </div>
  </div>
)}


    </div>
  );
};

export default Inventario;
