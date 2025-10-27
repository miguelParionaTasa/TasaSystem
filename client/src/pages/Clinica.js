import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const Clinica = () => {
  const [filter, setFilter] = useState({ zona: "", ubicacion: "", equipo: "" });
  const [uploading, setUploading] = useState(false);

  const [zonas, setZonas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [clinicas, setClinicas] = useState([]);
  const [modalImagesVisible, setModalImagesVisible] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [modalAddVisible, setModalAddVisible] = useState(false);
  const [newRow, setNewRow] = useState({ nombre: "", valor: "", imagen: null });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editedData, setEditedData] = useState({});
  const token = localStorage.getItem("token");
  const userId = parseInt(localStorage.getItem("userId"));

  // === Cargar clínicas ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}clinicas`);
        const ordenadas = res.data.sort((a, b) => {
          const zonaA = a.equipo?.ubicacion?.zona?.nombreMaximo || "";
          const zonaB = b.equipo?.ubicacion?.zona?.nombreMaximo || "";
          if (zonaA !== zonaB) return zonaA.localeCompare(zonaB);

          const ubicA = a.equipo?.ubicacion?.name || "";
          const ubicB = b.equipo?.ubicacion?.name || "";
          if (ubicA !== ubicB) return ubicA.localeCompare(ubicB);

          const eqA = a.equipo?.name || "";
          const eqB = b.equipo?.name || "";
          if (eqA !== eqB) return eqA.localeCompare(eqB);

          return (a.nombre || "").localeCompare(b.nombre || "");
        });
        setClinicas(ordenadas);
      } catch (err) {
        console.error("Error al cargar clínicas:", err);
      }
    };
    fetchData();
  }, []);

  // === Cargar filtros ===
  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}varios/zonas`)
      .then(res => setZonas(res.data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (!filter.zona) return setUbicaciones([]);
    axios.get(`${process.env.REACT_APP_API_URL}varios/ubicaciones/por-zona?zonaId=${filter.zona}`)
      .then(res => setUbicaciones(res.data))
      .catch(err => console.error(err));
  }, [filter.zona]);

  useEffect(() => {
    if (!filter.ubicacion) return setEquipos([]);
    axios.get(`${process.env.REACT_APP_API_URL}equipos/por-zona/${filter.zona}?ubicacionId=${filter.ubicacion}`)
      .then(res => setEquipos(res.data))
      .catch(err => console.error(err));
  }, [filter.ubicacion, filter.zona]);

  // === Cambiar filtros ===
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prev) => {
      if (name === "zona") return { zona: value, ubicacion: "", equipo: "" };
      if (name === "ubicacion") return { ...prev, ubicacion: value, equipo: "" };
      return { ...prev, [name]: value };
    });
  };

  // === Buscar clínicas ===
  const handleSubmit = async e => {
    e?.preventDefault();
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}clinicas/search`, {
        params: {
          zonaId: filter.zona || undefined,
          ubicacionId: filter.ubicacion || undefined,
          equipoId: filter.equipo || undefined,
        },
      });
      setClinicas(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // === Crear nueva clínica ===
  const handleSaveNew = async () => {
    if (!filter.equipo) return Swal.fire("Error", "Debe seleccionar un equipo", "error");
    if (!newRow.nombre.trim()) return Swal.fire("Error", "Debe ingresar nombre", "error");
    if (!newRow.valor.trim()) return Swal.fire("Error", "Debe ingresar valor", "error");
    if (saving) return;

    setSaving(true);
    const formData = new FormData();
    formData.append("nombre", newRow.nombre.trim());
    formData.append("valor", newRow.valor.trim());
    formData.append("equipoId", filter.equipo);
    formData.append("userId", userId);
    if (newRow.imagen) formData.append("image", newRow.imagen);

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}clinicas`, formData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
      });
      Swal.fire("Éxito", "Dato técnico agregado correctamente", "success");
      setModalAddVisible(false);
      setNewRow({ nombre: "", valor: "", imagen: null });
      handleSubmit();
    } catch (err) {
      console.error("Error al guardar clínica:", err);
      Swal.fire("Error", "No se pudo guardar el dato técnico", "error");
    } finally {
      setSaving(false);
    }
  };

  // === Editar valor (con historial) ===
// === Editar encabezado y descripción (con historial) ===
const handleSaveEdit = async (item) => {
  try {
    const cambios = {};
    if (item.nombre !== editedData.nombre) cambios.nombre = editedData.nombre;
    if (item.valor !== editedData.valor) cambios.valor = editedData.valor;

    if (Object.keys(cambios).length === 0) {
      Swal.fire("Sin cambios", "No se realizaron modificaciones", "info");
      return;
    }

    await axios.put(
      `${process.env.REACT_APP_API_URL}clinicas/${item.id}`,
      { ...cambios, userId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    Swal.fire("Actualizado", "Dato técnico actualizado correctamente", "success");
    setEditingId(null);
    handleSubmit();
  } catch (error) {
    console.error(error);
    Swal.fire("Error", "No se pudo actualizar", "error");
  }
};


  // === Eliminar clínica ===
  const handleDelete = async (item) => {
    if (userId !== item.userId) {
      return Swal.fire("No permitido", `Este dato fue creado por ${item.user?.firstName} ${item.user?.lastName}`, "error");
    }

    const result = await Swal.fire({
      title: "¿Eliminar dato técnico?",
      text: item.nombre,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}clinicas/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Swal.fire("Eliminado", "Dato técnico eliminado correctamente", "success");
      handleSubmit();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo eliminar", "error");
    }
  };

  // === Subir imagen ===
const handleUploadImage = async (item, file) => {
  if (!file) return;

  // ⚠️ Validación de tamaño de archivo (2 MB)
  const maxSizeMB = 2;
  const fileSizeMB = file.size / (1024 * 1024);

  if (fileSizeMB >= maxSizeMB) {
    return Swal.fire(
      "Archivo demasiado grande",
      `El archivo pesa ${fileSizeMB.toFixed(2)} MB. El máximo permitido es 2 MB.`,
      "warning"
    );
  }

  setUploading(true);

  Swal.fire({
    title: "Subiendo imagen...",
    text: "Por favor espera mientras se carga la imagen",
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  const formData = new FormData();
  formData.append("image", file);

  try {
    const res = await axios.post(
      `${process.env.REACT_APP_API_URL}clinicas/${item.id}/upload-image`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    Swal.fire("Actualizado", "Imagen subida correctamente", "success");

    // Actualiza la lista local
    setClinicas((prev) =>
      prev.map((c) =>
        c.id === item.id
          ? { ...c, images: [...(c.images || []), res.data] }
          : c
      )
    );
  } catch (error) {
    console.error(error);
    Swal.fire("Error", "No se pudo subir la imagen", "error");
  } finally {
    setUploading(false);
  }
};



  // === Datos seleccionados ===
  const zonaSel = zonas.find(z => z.id === Number(filter.zona));
  const ubicSel = ubicaciones.find(u => u.id === Number(filter.ubicacion));
  const equipoSel = equipos.find(e => e.id === Number(filter.equipo));

  return (
    <div className="p-4 max-w-screen-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800">Datos Técnicos de Clínica</h1>

      {/* FILTROS */}
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4 bg-gray-50 p-4 rounded-md shadow-md mb-6">
        <div>
          <label className="block font-semibold mb-1">Zona</label>
          <select name="zona" value={filter.zona} onChange={handleFilterChange} className="p-2 border rounded">
            <option value="">Todas</option>
            {zonas.map(z => <option key={z.id} value={z.id}>{z.nombreMaximo}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Ubicación</label>
          <select
            name="ubicacion"
            value={filter.ubicacion}
            onChange={handleFilterChange}
            disabled={!filter.zona}
            className="p-2 border rounded"
          >
            <option value="">Todas</option>
            {ubicaciones.sort((a, b) => a.name.localeCompare(b.name)).map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Equipo</label>
          <select
            name="equipo"
            value={filter.equipo}
            onChange={handleFilterChange}
            disabled={!filter.ubicacion}
            className="p-2 border rounded"
          >
            <option value="">Todos</option>
            {equipos.sort((a, b) => a.name.localeCompare(b.name)).map(eq => (
              <option key={eq.id} value={eq.id}>{eq.name}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Filtrar
        </button>
      </form>

      {/* BOTONES */}
      <div className="flex gap-4 mb-4">
        <button onClick={() => {
          if (!filter.equipo) return Swal.fire("Seleccione equipo", "", "warning");
          setModalAddVisible(true);
        }} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          ➕ Añadir dato técnico
        </button>
        <button onClick={() => setModalImagesVisible(true)} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
          🖼 Ver imágenes
        </button>
      </div>

      {/* MODAL NUEVO DATO */}
      {modalAddVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md p-6 w-full max-w-lg relative shadow-lg">
            <button onClick={() => setModalAddVisible(false)} className="absolute top-2 right-2 text-gray-700">✖</button>
            <h2 className="text-xl font-semibold mb-4 text-center">➕ Añadir dato técnico</h2>

            <p className="text-sm mb-4 text-gray-600">
              <b>Zona:</b> {zonaSel?.nombreMaximo || "N/A"} <br />
              <b>Ubicación:</b> {ubicSel?.name || "N/A"} <br />
              <b>Equipo:</b> {equipoSel?.name || "N/A"}
            </p>

            <div className="flex flex-col gap-3">
              <input type="text" value={newRow.nombre} onChange={e => setNewRow(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre" className="p-2 border rounded" />
              <input type="text" value={newRow.valor} onChange={e => setNewRow(p => ({ ...p, valor: e.target.value }))} placeholder="Valor" className="p-2 border rounded" />
              <input
  type="file"
  accept="image/*"
  onChange={(e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSizeMB = 2;
    const fileSizeMB = file.size / (1024 * 1024);

    if (fileSizeMB >= maxSizeMB) {
      Swal.fire(
        "Archivo demasiado grande",
        `El archivo pesa ${fileSizeMB.toFixed(2)} MB. El máximo permitido es 2 MB.`,
        "warning"
      );
      e.target.value = ""; // limpia el input
      return;
    }

    setNewRow((p) => ({ ...p, imagen: file }));
  }}
  className="p-2 border rounded"
/>
<button onClick={handleSaveNew} disabled={saving} className={`text-white px-4 py-2 rounded ${saving ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"}`}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABLA */}
      {loading ? (
        <p className="text-center mt-4">Cargando...</p>
      ) : (
        <div className="overflow-x-auto mt-4 shadow-md rounded-lg border border-gray-300">
  <table className="min-w-full text-sm text-gray-800 bg-white">
    <thead className="bg-gray-200 text-gray-700 font-semibold">
      <tr>
        <th className="border border-gray-300 px-4 py-2 text-left">Zona</th>
        <th className="border border-gray-300 px-4 py-2 text-left">Ubicación</th>
        <th className="border border-gray-300 px-4 py-2 text-left">Equipo</th>
        <th className="border border-gray-300 px-4 py-2 text-left">Encabezado</th>
        <th className="border border-gray-300 px-4 py-2 text-left">Descripción</th>
        <th className="border border-gray-300 px-4 py-2 text-center">Acciones</th>
      </tr>
    </thead>
    <tbody>
      {clinicas.map((item) => (
       <tr key={item.id} className="hover:bg-gray-50 transition">
  <td className="border border-gray-300 px-3 py-2 align-top">
    {item.equipo?.ubicacion?.zona?.nombreMaximo || "N/A"}
  </td>
  <td className="border border-gray-300 px-3 py-2 align-top">
    {item.equipo?.ubicacion?.name || "N/A"}
  </td>
  <td className="border border-gray-300 px-3 py-2 align-top">
    {item.equipo?.name || "N/A"}
  </td>

  {/* ENCABEZADO */}
  <td className="border border-gray-300 px-3 py-2 align-top font-semibold text-gray-900">
    {editingId === item.id ? (
      <input
        type="text"
        value={editedData.nombre}
        onChange={(e) =>
          setEditedData((prev) => ({ ...prev, nombre: e.target.value }))
        }
        className="p-1 border rounded w-full font-semibold"
      />
    ) : (
      item.nombre
    )}
  </td>

  {/* DESCRIPCIÓN */}
  <td className="border border-gray-300 px-3 py-2 align-top whitespace-pre-wrap break-words max-w-[300px]">
    {editingId === item.id ? (
      <input
        type="text"
        value={editedData.valor}
        onChange={(e) =>
          setEditedData((prev) => ({ ...prev, valor: e.target.value }))
        }
        className="p-1 border rounded w-full"
      />
    ) : (
      item.valor
    )}
  </td>

  {/* ACCIONES */}
  <td className="border border-gray-300 px-3 py-2 align-top text-center">
    {editingId === item.id ? (
      <>
        <button
          onClick={() => handleSaveEdit(item)}
          className="bg-blue-600 text-white px-2 py-1 rounded mr-2 hover:bg-blue-700"
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
            if (userId !== item.userId)
              return Swal.fire(
                "No permitido",
                "Solo el creador puede editar",
                "error"
              );
            setEditingId(item.id);
            setEditedData({ nombre: item.nombre, valor: item.valor });
          }}
          className="text-blue-600 hover:underline mr-2"
        >
          Editar
        </button>
        <button
          onClick={() => handleDelete(item)}
          className="text-red-600 hover:underline mr-2"
        >
          Eliminar
        </button>
        <button
          onClick={() => {
            if (item.images?.[0]?.url) {
              setModalImage(item.images[0].url);
            } else if (userId === item.userId) {
              Swal.fire({
                title: "Subir imagen",
                input: "file",
                inputAttributes: { accept: "image/*" },
                showCancelButton: true,
              }).then((result) => {
                if (result.value) handleUploadImage(item, result.value);
              });
            } else {
              Swal.fire(
                "No permitido",
                "Solo el creador puede subir imagen",
                "error"
              );
            }
          }}
          className={`text-white px-3 py-1 rounded ${
            item.images?.[0]?.url
              ? "bg-purple-600 hover:bg-purple-700"
              : "bg-orange-500 hover:bg-orange-600"
          }`}
        >
          {item.images?.[0]?.url ? "Ver Imagen" : "Subir Imagen"}
        </button>
      </>
    )}
  </td>
</tr>

      ))}
    </tbody>
  </table>
</div>

      )}

      {!loading && clinicas.length === 0 && (
        <p className="text-center mt-4">No se encontraron datos técnicos.</p>
      )}

      {/* MODAL DE IMÁGENES */}
      {modalImagesVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md max-w-6xl w-full p-4 relative">
            <button onClick={() => setModalImagesVisible(false)} className="absolute top-2 right-2 text-gray-700">✖</button>
            <div className="flex gap-4 overflow-x-auto py-2">
              {clinicas
                .filter(c => c.images?.length)
                .map(c => c.images.map(img => (
                  <div key={img.id} className="border rounded-md p-2 w-[200px] flex-shrink-0 flex flex-col items-center">
                    <img src={img.url} alt={c.nombre} className="w-full h-[120px] object-contain mb-2" />
                    <p className="text-xs font-semibold truncate">{c.equipo?.ubicacion?.zona?.nombreMaximo}</p>
                    <p className="text-xs truncate">{c.equipo?.ubicacion?.name}</p>
                    <p className="text-xs truncate">{c.equipo?.name}</p>
                    <p className="text-xs truncate">{c.nombre}</p>
                    <p className="text-xs truncate">{c.valor}</p>
                  </div>
                )))}
              {clinicas.filter(c => c.images?.length).length === 0 && (
                <p className="text-center w-full">No hay imágenes disponibles</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL IMAGEN ÚNICA */}
      {modalImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-md max-w-lg w-full relative">
            <button onClick={() => setModalImage(null)} className="absolute top-2 right-2 text-gray-700">✖</button>
            <img src={modalImage} alt="Atributo" className="mt-6 w-full max-h-[70vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Clinica;
