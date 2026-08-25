import React, { useState, useEffect } from "react";
import axios from "../axios";
import Swal from "sweetalert2";

const Predictivo = () => {
  const [filter, setFilter] = useState({ zona: "", ubicacion: "", equipo: "" });
  const [zonas, setZonas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [predictivos, setPredictivos] = useState([]);
  const [loading, setLoading] = useState(false);
const [modalOpen, setModalOpen] = useState(false);
const [modalData, setModalData] = useState(null);
const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editedData, setEditedData] = useState({ comentario: "", otRelacionada: "" });

  const openImageModal = (predictivo) => {
    setModalData(predictivo);
    setModalOpen(true);
  };

  // === Instancia de API; la sesión viaja en cookie HttpOnly ===
  const axiosAuth = axios;

  // === Obtener zonas ===
  useEffect(() => {
    axiosAuth
      .get("varios/zonas")
      .then((res) => setZonas(res.data))
      .catch(() => Swal.fire("Error", "No se pudieron cargar las zonas", "error"));
  }, []);

  // === Obtener ubicaciones por zona ===
  useEffect(() => {
    if (filter.zona) {
      axiosAuth
        .get(`varios/ubicaciones/por-zona?zonaId=${filter.zona}`)
        .then((res) => setUbicaciones(res.data))
        .catch(() => Swal.fire("Error", "No se pudieron cargar las ubicaciones", "error"));
    } else {
      setUbicaciones([]);
      setEquipos([]);
      setFilter((prev) => ({ ...prev, ubicacion: "", equipo: "" }));
    }
  }, [filter.zona]);

  // === Obtener equipos por ubicación ===
  useEffect(() => {
    if (filter.ubicacion) {
      axiosAuth
        .get(`equipos/por-zona/${filter.zona}?ubicacionId=${filter.ubicacion}`)
        .then((res) => setEquipos(res.data))
        .catch(() => Swal.fire("Error", "No se pudieron cargar los equipos", "error"));
    } else {
      setEquipos([]);
      setFilter((prev) => ({ ...prev, equipo: "" }));
    }
  }, [filter.ubicacion, filter.zona]);

  // === Cambiar filtro ===
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  };


  const handleImageUpload = async () => {
  if (!file || !modalData) return;

  const formData = new FormData();
  formData.append("image", file);

  try {
    await axiosAuth.post(`predictivos/${modalData.id}/upload-image`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    Swal.fire("Éxito", "Imagen subida correctamente", "success");
    setModalOpen(false);
    setFile(null);
    handleSubmit(new Event("submit")); // refresca la tabla
  } catch {
    Swal.fire("Error", "No se pudo subir la imagen", "error");
  }
};

  // === Buscar predictivos ===
  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const { data } = await axiosAuth.get("predictivos/search", {
      params: {
        zonaId: filter.zona || undefined,
        ubicacionId: filter.ubicacion || undefined,
        equipoId: filter.equipo || undefined,
      },
    });

    // === Filtrar por técnica en frontend ===
    let filteredData = data || [];
    if (filter.tecnica) {
      filteredData = filteredData.filter(
        (p) => p.tecnica === filter.tecnica
      );
    }

    setPredictivos(filteredData);
  } catch {
    Swal.fire("Error", "No se pudo obtener la información", "error");
  } finally {
    setLoading(false);
  }
};


  // === Guardar edición ===
  const handleSaveEdit = async (predictivo) => {
    const cambios = {};
    if (predictivo.comentario !== editedData.comentario) cambios.comentario = editedData.comentario;
    if (predictivo.otRelacionada !== editedData.otRelacionada) cambios.otRelacionada = editedData.otRelacionada;

    if (Object.keys(cambios).length === 0) {
      Swal.fire("Sin cambios", "No se realizaron cambios", "info");
      setEditingId(null);
      return;
    }

    const cambiosTexto = Object.entries(cambios)
      .map(([k, v]) => `${k}: "${predictivo[k] || "N/A"}" → "${v}"`)
      .join("\n");

    const result = await Swal.fire({
      title: "¿Confirmar cambios?",
      text: `Se aplicarán los siguientes cambios:\n${cambiosTexto}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Guardar",
    });

    if (result.isConfirmed) {
      try {
        await axiosAuth.put(`predictivos/${predictivo.id}`, cambios);
        Swal.fire("Actualizado", "El registro fue actualizado", "success");
        setEditingId(null);
        handleSubmit(new Event("submit"));
      } catch {
        Swal.fire("Error", "No se pudo actualizar el registro", "error");
      }
    }
  };

  // === Eliminar predictivo ===
  const handleDelete = async (predictivo) => {
    const result = await Swal.fire({
      title: "¿Está seguro?",
      text: "Se eliminará este registro permanentemente",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
    });
    if (result.isConfirmed) {
      try {
        await axiosAuth.delete(`predictivos/${predictivo.id}`);
        Swal.fire("Eliminado", "El registro fue eliminado", "success");
        handleSubmit(new Event("submit"));
      } catch {
        Swal.fire("Error", "No se pudo eliminar", "error");
      }
    }
  };

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Consulta Predictivo</h1>

      {/* FORM DE FILTRO */}
      <form
  onSubmit={handleSubmit}
  className="flex items-end gap-4 bg-gray-100 p-4 rounded-md shadow overflow-x-auto"
>
  {/* Zona */}
  <div className="flex flex-col w-40">
    <label className="block font-semibold mb-1">Zona</label>
    <select
      name="zona"
      value={filter.zona}
      onChange={handleFilterChange}
      className="p-2 border rounded-md"
    >
      <option value="">Todas</option>
      {zonas.map((z) => (
        <option key={z.id} value={z.id}>
          {z.nombreMaximo}
        </option>
      ))}
    </select>
  </div>

  {/* Ubicación */}
  <div className="flex flex-col w-40">
    <label className="block font-semibold mb-1">Ubicación</label>
    <select
      name="ubicacion"
      value={filter.ubicacion}
      onChange={handleFilterChange}
      className="p-2 border rounded-md"
      disabled={!filter.zona}
    >
      <option value="">Todas</option>
      {ubicaciones.map((u) => (
        <option key={u.id} value={u.id}>
          {u.name}
        </option>
      ))}
    </select>
  </div>

  {/* Equipo */}
  <div className="flex flex-col w-40">
    <label className="block font-semibold mb-1">Equipo</label>
    <select
      name="equipo"
      value={filter.equipo}
      onChange={handleFilterChange}
      className="p-2 border rounded-md"
      disabled={!filter.ubicacion}
    >
      <option value="">Todos</option>
      {equipos.map((e) => (
        <option key={e.id} value={e.id}>
          {e.name}
        </option>
      ))}
    </select>
  </div>

  {/* Técnica */}
  <div className="flex flex-col w-56">
    <label className="block font-semibold mb-1">Técnica</label>
    <select
      name="tecnica"
      value={filter.tecnica || ""}
      onChange={handleFilterChange}
      className="p-2 border rounded-md"
    >
      <option value="">Sin seleccionar</option>
      <option value="UltraSonido">UltraSonido</option>
      <option value="Analisis de aceite">Analisis de aceite</option>
      <option value="Analisis de vibración">Analisis de vibración</option>
      <option value="Analisis aceite dielectrico">Analisis aceite dielectrico</option>
      <option value="UltraSonido - Trampa de vapor">UltraSonido - Trampa de vapor</option>
      <option value="Inspeccion termográfica">Inspeccion termográfica</option>
    </select>
  </div>

  {/* Botón Filtrar */}
  <div className="flex flex-col justify-end">
    <button
      type="submit"
      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
    >
      Filtrar
    </button>
  </div>
</form>



      {/* TABLA */}
      {loading ? (
        <p className="text-center mt-4">⏳ Cargando...</p>
      ) : predictivos.length > 0 ? (
        <div className="overflow-x-auto">
  <table className="border border-gray-400 text-sm text-center table-fixed w-full">
  <colgroup>
    <col style={{ width: "40px" }} /> {/* N° */}
    <col style={{ width: "100px" }} /> {/* Ubicación */}
    <col style={{ width: "100px" }} /> {/* Equipo */}
    <col style={{ width: "90px" }} /> {/* Fecha */}
    <col style={{ width: "100px" }} /> {/* Técnica */}
    <col style={{ width: "150px" }} /> {/* Recomendación Proveedor */}
    <col style={{ width: "150px" }} /> {/* Recomendación Predictivo */}
    <col style={{ width: "100px" }} /> {/* OT Generada */}
    <col style={{ width: "100px" }} /> {/* Comentario */}
    <col style={{ width: "100px" }} /> {/* OT Relacionada */}
    <col style={{ width: "100px" }} /> {/* Acción */}
  </colgroup>
  <thead>
    <tr className="bg-gray-300">
      {[
        "N°",
        "Ubicación",
        "Equipo",
        "Fecha",
        "Técnica",
        "Recomendación Proveedor",
        "Recomendación Predictivo",
        "OT Generada",
        "Comentario",
        "OT Relacionada",
        "Acción",
      ].map((head) => (
        <th key={head} className="py-2 px-3 border break-words">
          {head}
        </th>
      ))}
    </tr>
  </thead>
 <tbody className="bg-gray-50">
  {predictivos.map((p, idx) => (
    <tr key={p.id} className="border hover:bg-gray-100 h-24">

      <td className="border">{idx + 1}</td>
      <td className="border break-words">{p.ubicacion?.name || "N/A"}</td>
      <td className="border break-words">{p.equipo?.name || "N/A"}</td>
      <td className="border">{p.fecha ? new Date(p.fecha).toLocaleDateString() : "-"}</td>
      <td className="border break-words">{p.tecnica || "-"}</td>
      <td className="border break-words">{p.recomendacionProveedor || "-"}</td>
      <td className="border break-words">{p.recomendacionPredictivo || "-"}</td>
      <td className="border">{p.otGenerado || "-"}</td>

      {/* Comentario editable */}
      <td className="border break-words">
        {editingId === p.id ? (
          <input
            type="text"
            value={editedData.comentario}
            onChange={(e) =>
              setEditedData((prev) => ({ ...prev, comentario: e.target.value }))
            }
            className="p-1 border rounded w-full"
          />
        ) : (
          p.comentario || "-"
        )}
      </td>

      {/* OT Relacionada editable */}
      <td className="border break-words">
        {editingId === p.id ? (
          <input
            type="text"
            value={editedData.otRelacionada}
            onChange={(e) =>
              setEditedData((prev) => ({ ...prev, otRelacionada: e.target.value }))
            }
            className="p-1 border rounded w-full"
          />
        ) : (
          p.otRelacionada || "-"
        )}
      </td>

      {/* Acción */}
      <td className="border h-full flex flex-col justify-center items-center gap-2 py-2">
  {editingId === p.id ? (
    <>
      <button
        onClick={() => handleSaveEdit(p)}
        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm w-full"
      >
        Guardar
      </button>
      <button
        onClick={() => setEditingId(null)}
        className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 text-sm w-full"
      >
        Cancelar
      </button>
    </>
  ) : (
    <>
      <button
        onClick={() => {
          setEditingId(p.id);
          setEditedData({ comentario: p.comentario || "", otRelacionada: p.otRelacionada || "" });
        }}
        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm w-full"
      >
        Editar
      </button>

      <button
  onClick={() => openImageModal(p)}
  className={`px-3 py-1 rounded text-white text-sm w-full ${
    p.images?.[0]?.url ? "bg-purple-600 hover:bg-purple-700" : "bg-orange-500 hover:bg-orange-600"
  }`}
>
  {p.images?.[0]?.url ? "Ver Imagen" : "Subir Imagen"}
</button>
    </>
  )}
</td>

    </tr>
  ))}
</tbody>

</table>
{modalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-md w-96">
      {modalData?.images?.[0]?.url ? (
  <>
    <h2 className="font-bold mb-4">Imagen del predictivo</h2>
    <img src={modalData.images[0].url} alt="Predictivo" className="w-full mb-4" />
  </>
) : (
  <>
    <h2 className="font-bold mb-4">Subir Imagen</h2>
    <input
      type="file"
      accept="image/*"
      onChange={(e) => setFile(e.target.files[0])}
      className="mb-4"
    />
    <button
      onClick={handleImageUpload}
      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
    >
      Subir Imagen
    </button>
  </>
)}

      <button
        onClick={() => {
          setModalOpen(false);
          setFile(null);
        }}
        className="mt-4 bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
      >
        Cerrar
      </button>
    </div>
  </div>
)}

</div>

      ) : (
        !loading && <p className="text-center mt-4">⚠️ No se encontraron registros.</p>
      )}
    </div>
  );
};

export default Predictivo;
