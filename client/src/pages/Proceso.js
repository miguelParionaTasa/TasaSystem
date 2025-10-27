import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const Proceso = () => {
  const [filter, setFilter] = useState({ zona: "", ubicacion: "", equipo: "" });
  const [zonas, setZonas] = useState([]);
  const [modalAddVisible, setModalAddVisible] = useState(false);

  const [ubicaciones, setUbicaciones] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [procesos, setProcesos] = useState([]);
  const [modalImagesVisible, setModalImagesVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalImage, setModalImage] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [newRow, setNewRow] = useState(null);

  const handleOpenAddModal = () => {
  if (!filter.ubicacion) {
    Swal.fire("Seleccione una ubicación en el filtro", "", "warning");
    return;
  }
  setNewRow({ nombre: "", valor: "", imagen: null });
  setModalAddVisible(true);
};

  const token = localStorage.getItem("token");
  const userId = parseInt(localStorage.getItem("userId"));

  // === Cargar procesos ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}procesos`);
        const ordenados = res.data.sort((a, b) => {
          const zonaA = a.equipo?.ubicacion?.zona?.name || "";
          const zonaB = b.equipo?.ubicacion?.zona?.name || "";
          if (zonaA !== zonaB) return zonaA.localeCompare(zonaB);

          const ubicA = a.equipo?.ubicacion?.name || "";
          const ubicB = b.equipo?.ubicacion?.name || "";
          if (ubicA !== ubicB) return ubicA.localeCompare(ubicB);

          const eqA = a.equipo?.name || "";
          const eqB = b.equipo?.name || "";
          if (eqA !== eqB) return eqA.localeCompare(eqB);

          const procA = a.nombre || "";
          const procB = b.nombre || "";
          return procA.localeCompare(procB);
        });

        setProcesos(ordenados);
      } catch (err) {
        console.error("Error al cargar procesos:", err);
      }
    };

    fetchData();
  }, []);

  // === Fetch zonas, ubicaciones y equipos ===
  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}varios/zonas`)
      .then((res) => setZonas(res.data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!filter.zona) return setUbicaciones([]);
    axios
      .get(`${process.env.REACT_APP_API_URL}varios/ubicaciones/por-zona?zonaId=${filter.zona}`)
      .then((res) => setUbicaciones(res.data))
      .catch((err) => console.error(err));
  }, [filter.zona]);

  useEffect(() => {
    if (!filter.ubicacion) return setEquipos([]);
    axios
      .get(`${process.env.REACT_APP_API_URL}equipos/por-zona/${filter.zona}?ubicacionId=${filter.ubicacion}`)
      .then((res) => setEquipos(res.data))
      .catch((err) => console.error(err));
  }, [filter.ubicacion, filter.zona]);

  const handleFilterChange = (e) => {
  const { name, value } = e.target;

  setFilter((prev) => {
    if (name === "zona") {
      // 🔹 Cambia zona → resetea ubicación y equipo
      return { zona: value, ubicacion: "", equipo: "" };
    }
    if (name === "ubicacion") {
      // 🔹 Cambia ubicación → resetea equipo
      return { ...prev, ubicacion: value, equipo: "" };
    }
    return { ...prev, [name]: value };
  });
};


  const handleSubmit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}procesos/search`, {
        params: {
          zonaId: filter.zona || undefined,
          ubicacionId: filter.ubicacion || undefined,
          equipoId: filter.equipo || undefined,
        },
      });
      setProcesos(response.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // === Guardar nueva fila con imagen ===
  const [saving, setSaving] = useState(false);

  const handleSaveNew = async () => {
    if (!filter.equipo) {
      Swal.fire("Error", "No hay equipo seleccionado", "error");
      return;
    }
    if (!newRow?.nombre?.trim()) {
      Swal.fire("Error", "Falta ingresar el nombre del proceso", "error");
      return;
    }
    if (!newRow?.valor?.trim()) {
      Swal.fire("Error", "Falta ingresar el valor del proceso", "error");
      return;
    }

    if (saving) return;
    setSaving(true);

    const formData = new FormData();
    formData.append("nombre", newRow.nombre.trim());
    formData.append("valor", newRow.valor.trim());
    formData.append("equipoId", filter.equipo);
    formData.append("userId", userId);
    if (newRow.imagen) formData.append("image", newRow.imagen);

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}procesos`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      Swal.fire("Añadido", "El proceso fue creado correctamente", "success");
      setNewRow(null);
      handleSubmit(new Event("submit"));
    } catch (error) {
      console.error("Error al crear proceso:", error.response || error);
      Swal.fire("Error", "No se pudo guardar el proceso", "error");
    } finally {
      setSaving(false);
    }
  };

  // === Guardar edición ===
  const handleSaveEdit = async (proc) => {
    try {
      const cambios = {};
      if (proc.nombre !== editedData.nombre) cambios.nombre = editedData.nombre;
      if (proc.valor !== editedData.valor) cambios.valor = editedData.valor;
      cambios.userId = Number(userId);

      await axios.put(`${process.env.REACT_APP_API_URL}procesos/${proc.id}`, cambios, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Swal.fire("Éxito", "Proceso actualizado correctamente", "success");
      setEditingId(null);
      await handleSubmit();
    } catch (error) {
      console.error("Error al actualizar proceso:", error);
      Swal.fire("Error", "No se pudo actualizar el proceso", "error");
    }
  };

  // === Eliminar proceso ===
  const handleDelete = async (proc) => {
    if (userId !== proc.userId) {
      return Swal.fire(
        "No permitido",
        `Este proceso fue creado por ${proc.user.firstName} ${proc.user.lastName} y no puedes eliminarlo`,
        "error"
      );
    }

    const result = await Swal.fire({
      title: "¿Está seguro?",
      text: `Se eliminará el proceso: ${proc.nombre}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
    });
    if (result.isConfirmed) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}procesos/${proc.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire("Eliminado", "El proceso fue eliminado", "success");
        handleSubmit();
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "No se pudo eliminar", "error");
      }
    }
  };

  // === Subir imagen existente ===
  const handleUploadImage = async (proc, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}procesos/${proc.id}/upload-image`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      Swal.fire("Actualizado", "Imagen subida correctamente", "success");

      setProcesos((prev) =>
        prev.map((p) =>
          p.id === proc.id ? { ...p, images: [...(p.images || []), res.data] } : p
        )
      );
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo subir la imagen", "error");
    }
  };

  return (
    <div className="p-4 max-w-screen-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800">Consulta de Procesos</h1>

      {/* Formulario de filtro */}
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4 bg-gray-50 p-4 rounded-md shadow-md mb-6">
        <div>
          <label className="block font-semibold text-gray-700 mb-2">Zona</label>
          <select name="zona" value={filter.zona} onChange={handleFilterChange} className="w-full p-2 border border-gray-300 rounded-md">
            <option value="">Todas las zonas</option>
            {zonas.map(z => <option key={z.id} value={z.id}>{z.nombreMaximo}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-semibold text-gray-700 mb-2">Ubicación</label>
          <select name="ubicacion" value={filter.ubicacion} onChange={handleFilterChange} disabled={!filter.zona} className="w-[320px] p-2 border border-gray-300 rounded-md">
            <option value="">Todas las ubicaciones</option>
            {ubicaciones
    .slice() // hace una copia para no mutar el original
    .sort((a, b) => a.name.localeCompare(b.name)) // ordena A-Z por nombre
    .map(u => (
      <option key={u.id} value={u.id}>
        {u.name}
      </option>
    ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold text-gray-700 mb-2">Equipo</label>
          <select name="equipo" value={filter.equipo} onChange={handleFilterChange} disabled={!filter.ubicacion} className="w-[320px] p-2 border border-gray-300 rounded-md">
            <option value="">Todos los equipos</option>
            {equipos
    .slice() // copia para no alterar el original
    .sort((a, b) => a.name.localeCompare(b.name)) // orden A-Z
    .map(eq => (
      <option key={eq.id} value={eq.id}>
        {eq.name}
      </option>
    ))}
          </select>
        </div>
        <div className="col-span-3 flex justify-end mt-4">
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition">Filtrar</button>
        </div>
      </form>

      {/* Botones de acción */}
      <div className="flex gap-4 mb-4">
       <button
  onClick={handleOpenAddModal}
  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
>
  ➕ Añadir proceso
</button>

        <button
    onClick={() => setModalImagesVisible(true)}
    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
  >
    🖼 Ver imágenes
  </button>
      </div>

      {/* Tabla */}
      {loading ? (
        <p className="text-center mt-4">Cargando...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-400 text-center">
            <thead>
              <tr className="bg-gray-300 border border-gray-400">
                <th className="py-2 px-4 border border-gray-400">Zona</th>
                <th className="py-2 px-4 border border-gray-400">Ubicación</th>
                <th className="py-2 px-4 border border-gray-400">Equipo</th>
                <th className="py-2 px-4 border border-gray-400">proceso</th>
                <th className="py-2 px-4 border border-gray-400">Valor</th>
                <th className="py-2 px-4 border border-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-gray-100">
              
           {modalAddVisible && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
    <div className="bg-white p-6 rounded-2xl w-[440px] shadow-lg relative">

      {/* Botón de cierre */}
      <button
        onClick={() => setModalAddVisible(false)}
        className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-lg font-bold"
      >
        ✖
      </button>

      <h2 className="text-xl font-semibold mb-4 text-center">➕ Añadir Proceso</h2>

      {/* Información de contexto */}
      <div className="bg-gray-100 rounded-lg p-3 mb-4 text-sm">
        <p><strong>Zona:</strong> {zonas.find(z => z.id === parseInt(filter.zona))?.name || "No seleccionada"}</p>
        <p><strong>Ubicación:</strong> {ubicaciones.find(u => u.id === parseInt(filter.ubicacion))?.name || "No seleccionada"}</p>
      </div>

      {/* Campos de entrada */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Nombre del proceso"
          value={newRow?.nombre || ""}
          onChange={(e) => setNewRow({ ...newRow, nombre: e.target.value })}
          className="w-full border p-2 rounded-md"
        />

        <input
          type="text"
          placeholder="Valor del proceso"
          value={newRow?.valor || ""}
          onChange={(e) => setNewRow({ ...newRow, valor: e.target.value })}
          className="w-full border p-2 rounded-md"
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setNewRow({ ...newRow, imagen: e.target.files[0] })}
          className="w-full border p-2 rounded-md"
        />

        {newRow?.imagen && (
          <img
            src={URL.createObjectURL(newRow.imagen)}
            alt="Vista previa"
            className="w-full h-40 object-contain border rounded-md mt-2"
          />
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setModalAddVisible(false)}
          className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 w-1/2 mr-2"
        >
          Cancelar
        </button>

        <button
          onClick={async () => {
            await handleSaveNew();
            setModalAddVisible(false);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-1/2 ml-2"
        >
          Guardar
        </button>
      </div>
    </div>
  </div>
)}

{/* Modal de todas las imágenes */}
{modalImagesVisible && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-md max-w-6xl w-full p-4 overflow-auto relative">
      <button
        className="absolute top-2 right-2 text-gray-700 text-lg font-bold"
        onClick={() => setModalImagesVisible(false)}
      >
        ✖
      </button>

      <div className="flex gap-4 overflow-x-auto py-2">
        {procesos
          .filter(a => a.images?.length)
          .slice() // copia para no mutar el estado
          .sort((a, b) => {
            const zonaA = a.equipo?.ubicacion?.zona?.id || 0;
            const zonaB = b.equipo?.ubicacion?.zona?.id || 0;
            return zonaA - zonaB; // orden ascendente
          })
          .map(atr =>
            atr.images.map(img => (
              <div
                key={img.id}
                className="border rounded-md p-2 w-[200px] flex-shrink-0 flex flex-col items-center"
              >
                <div className="w-full h-[120px] flex items-center justify-center bg-gray-100 rounded mb-2">
                  <img
                    src={img.url}
                    alt={atr.nombre}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <p className="text-xs font-semibold truncate w-full">
                  {atr.equipo?.ubicacion?.zona?.nombreMaximo || "N/A"}
                </p>
                <p className="text-xs truncate w-full">
                  {atr.equipo?.ubicacion?.name || "N/A"}
                </p>
                <p className="text-xs truncate w-full">
                  {atr.equipo?.name || "N/A"}
                </p>
                <p className="text-xs truncate w-full">{atr.nombre}</p>
                <p className="text-xs truncate w-full">{atr.valor}</p>
              </div>
            ))
          )}
        {procesos.filter(a => a.images?.length).length === 0 && (
          <p className="text-center w-full">No hay imágenes disponibles</p>
        )}
      </div>
    </div>
  </div>
)}


{/* Modal de una imagen */}
{modalImage && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-4 rounded-md max-w-lg w-full relative">
      <button
        className="absolute top-2 right-2 text-gray-700 text-lg font-bold"
        onClick={() => setModalImage(null)}
      >
        ✖
      </button>
      <img
        src={modalImage}
        alt="proceso"
        className="mt-6 w-full max-h-[70vh] object-contain"
      />
    </div>
  </div>
)}





              {procesos
              .slice() // para no mutar el estado original
              .sort((a, b) => {
    const zonaA = a.equipo?.ubicacion?.zona?.id || 0;
    const zonaB = b.equipo?.ubicacion?.zona?.id || 0;
    return zonaA - zonaB; // orden ascendente
  })
              .map(atr => (
                <tr key={atr.id} className="border border-gray-400">
                  <td className="border">{atr.equipo?.ubicacion?.zona?.nombreMaximo || "N/A"}</td>
                  <td className="border">{atr.equipo?.ubicacion?.name || "N/A"}</td>
                  <td className="border w-[320px] truncate">{atr.equipo?.name || "N/A"}</td>
                  <td className="border">
                    {editingId === atr.id ? (
                      <input type="text" value={editedData.nombre} onChange={e => setEditedData(prev => ({ ...prev, nombre: e.target.value }))} className="p-1 border rounded" />
                    ) : atr.nombre}
                  </td>
                  <td className="border">
                    {editingId === atr.id ? (
                      <input type="text" value={editedData.valor} onChange={e => setEditedData(prev => ({ ...prev, valor: e.target.value }))} className="p-1 border rounded" />
                    ) : atr.valor}
                  </td>
                  <td className="border">
  <div className="flex gap-2 justify-center">
    {editingId === atr.id ? (
      <>
        <button
          onClick={() => handleSaveEdit(atr)}
          className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
        >
          Guardar
        </button>
        <button
          onClick={() => {
            setEditingId(null);
            setEditedData({});
          }}
          className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
        >
          Cancelar
        </button>
      </>
    ) : (
      <>
        <button
          onClick={() => {
            if (userId !== atr.userId) {
              return Swal.fire(
                "No permitido",
                `Este proceso fue creado por ${atr.user.firstName} ${atr.user.lastName} y no puedes modificarlo`,
                "error"
              );
            }
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

        <button
          onClick={() => {
            // Si hay imagen, cualquier usuario puede verla
            if (atr.images?.[0]?.url) {
              setModalImage(atr.images[0].url);
              return;
            }

            // Si no hay imagen, solo el creador puede subirla
            if (userId !== atr.userId) {
              return Swal.fire(
                "No permitido",
                `Este proceso fue creado por ${atr.user.firstName} ${atr.user.lastName} y no puedes subir imagen`,
                "error"
              );
            }

            Swal.fire({
              title: "Subir imagen",
              input: "file",
              inputAttributes: { accept: "image/*", "aria-label": "Subir imagen" },
              showCancelButton: true,
            }).then((result) => {
              const file = result.value;
              if (file) handleUploadImage(atr, file);
            });
          }}
          className={`text-white px-3 py-1 rounded ${
            atr.images?.[0]?.url
              ? "bg-purple-600 hover:bg-purple-700"
              : "bg-orange-500 hover:bg-orange-600"
          }`}
        >
          {atr.images?.[0]?.url ? "Ver Imagen" : "Subir Imagen"}
        </button>
      </>
    )}
  </div>
</td>

                </tr>
              ))}

            </tbody>
          </table>
        </div>
        
      )}
      {!loading && procesos.length === 0 && <p className="text-center mt-4">No se encontraron procesos.</p>}
    </div>
  

);
  
};

export default Proceso;
