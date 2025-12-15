// src/pages/TarjetaRoja.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const TarjetaRoja = () => {
  const API = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem("token");
  const userId = parseInt(localStorage.getItem("userId"));

  const [tarjetas, setTarjetas] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // filtros
  const [filter, setFilter] = useState({
  pet: "",
  zona: "",
  tipoDeteccion: "",
  season: "",
  status: "", // 👈 NUEVO
  searchText: "",
});


  // opciones dinámicas
  const [petsOptions, setPetsOptions] = useState([]);
  const [zonasOptions, setZonasOptions] = useState([]);
  const [tipoOptions, setTipoOptions] = useState([]);

  // imagen modal
  const [modalImage, setModalImage] = useState(null);

  // refs para inputs (por fila usamos refs clonables)
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const currentRowRef = useRef(null); // almacena la tarjeta actual para subir

  // --- Cargar todas las tarjetas (cliente-side filtering) ---
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}tarjeta-roja`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
       const data = res.data || [];

const ordenado = data.sort(
  (a, b) => new Date(b.fecha) - new Date(a.fecha)
);

setTarjetas(ordenado);
setFiltered(ordenado);


        // generar opciones dinámicas según data
        const pets = Array.from(new Set(data.map((t) => t.pet).filter(Boolean))).sort();
        const zonas = Array.from(new Set(data.map((t) => t.zona).filter(Boolean))).sort();
        const tipos = Array.from(new Set(data.map((t) => t.tipoDeteccion).filter(Boolean))).sort();

        setPetsOptions(pets);
        setZonasOptions(zonas);
        setTipoOptions(tipos);
      } catch (err) {
        console.error("Error cargando tarjetas rojas:", err);
        Swal.fire("Error", "No se pudo cargar tarjetas rojas", "error");
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  // --- // Solo actualizar tarjetas cuando llegan nuevas desde la API, sin filtrar
useEffect(() => {
  setFiltered(tarjetas);
}, [tarjetas]);

  // --- Handlers de filtro ---
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((p) => ({ ...p, [name]: value }));
  };

const handleClearFilters = () => {
  setFilter({
    pet: "",
    zona: "",
    tipoDeteccion: "",
    season: "",
    status: "", // 👈
    searchText: "",
  });
  setFiltered(tarjetas);
};


  // --- Subir imagen (igual al de Activos) ---
  const handleUploadImage = async (tarjeta, file) => {
    if (!file) return;

    const maxSizeMB = 6;
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB >= maxSizeMB) {
      Swal.fire("Archivo demasiado grande", `El archivo pesa ${fileSizeMB.toFixed(2)} MB. Máx 6 MB.`, "warning");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      setIsUploading(true);
      const res = await axios.post(`${API}tarjeta-roja/${tarjeta.id}/upload-image`, formData, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Content-Type": "multipart/form-data",
        },
      });

      Swal.fire("Actualizado", "Imagen subida correctamente", "success");

      // actualizar localmente: añadir imagen al objeto correspondiente
      setTarjetas((prev) => prev.map((t) => (t.id === tarjeta.id ? { ...t, images: [...(t.images || []), res.data] } : t)));
      setFiltered((prev) => prev.map((t) => (t.id === tarjeta.id ? { ...t, images: [...(t.images || []), res.data] } : t)));
    } catch (err) {
      console.error("Error subiendo imagen:", err);
      Swal.fire("Error", "No se pudo subir la imagen", "error");
    } finally {
      setIsUploading(false);
    }
  };

  // --- Abrir SweetAlert para elegir cámara/galería (por fila) ---
  const promptUploadForRow = (tarjeta) => {
    currentRowRef.current = tarjeta;
    Swal.fire({
      title: "Seleccionar opción",
      text: "¿Cómo deseas subir la imagen?",
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: "Tomar foto",
      denyButtonText: "Desde galería",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        cameraInputRef.current.click();
      } else if (result.isDenied) {
        galleryInputRef.current.click();
      }
    });
  };
const applyFilters = () => {
  let data = [...tarjetas];

  // pet
  if (filter.pet) data = data.filter((d) => (d.pet || "").toLowerCase() === filter.pet.toLowerCase());

  // zona
  if (filter.zona) data = data.filter((d) => (d.zona || "").toLowerCase() === filter.zona.toLowerCase());

  // tipo detección
  if (filter.tipoDeteccion)
    data = data.filter((d) => (d.tipoDeteccion || "").toLowerCase() === filter.tipoDeteccion.toLowerCase());

  

  // 🔥 NUEVO — selector de temporada / todos
  if (filter.season === "temporada") {
    const year = new Date().getFullYear();
    const start = new Date(`${year}-11-07`);
    data = data.filter((d) => new Date(d.fecha) >= start);
  } else {
    const start = new Date("2010-01-01");
    data = data.filter((d) => new Date(d.fecha) >= start);
  }

  // búsqueda general
  if (filter.searchText) {
    const text = filter.searchText.toLowerCase();
    data = data.filter(
      (d) =>
        d.reporta?.toLowerCase().includes(text) ||
        d.equipo?.toLowerCase().includes(text) ||
        d.descripcion?.toLowerCase().includes(text)
    );
  }
// 🔥 FILTRO STATUS (CORRECTO)
if (filter.status === "Abierto") {
  data = data.filter(
    (d) =>
      !d.comentario1 ||
      d.comentario1.trim().toLowerCase() !== "cerrado"
  );
}

if (filter.status === "Cerrado") {
  data = data.filter(
    (d) =>
      d.comentario1 &&
      d.comentario1.trim().toLowerCase() === "cerrado"
  );
}


  setFiltered(data);
};



  // manejadores de inputs ocultos
  const onGalleryChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const tarjeta = currentRowRef.current;
    setIsUploading(true);
    handleUploadImage(tarjeta, file).finally(() => {
      setIsUploading(false);
      e.target.value = "";
    });
  };
  const onCameraChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const tarjeta = currentRowRef.current;
    setIsUploading(true);
    handleUploadImage(tarjeta, file).finally(() => {
      setIsUploading(false);
      e.target.value = "";
    });
  };

  // --- Editar comentario2 (solo campo editable) ---
  const handleEditTarjeta = async (tarjeta) => {
    const zonasOptionsHtml = zonasOptions.map((z) => `<option value="${z}" ${tarjeta.zona === z ? "selected" : ""}>${z}</option>`).join("");
    const tipoOptionsHtml = tipoOptions.map((t) => `<option value="${t}" ${tarjeta.tipoDeteccion === t ? "selected" : ""}>${t}</option>`).join("");
    const petsOptionsHtml = petsOptions.map((p) => `<option value="${p}" ${tarjeta.pet === p ? "selected" : ""}>${p}</option>`).join("");

    const { value: formValues } = await Swal.fire({
      title: `Editar Tarjeta #${tarjeta.id}`,
      html: `
        <div class="text-left space-y-2" style="max-height:60vh; overflow:auto;">
          <label class="swal2-label">Reporta</label>
          <input id="reporta" class="swal2-input" readonly value="${(tarjeta.reporta || "").replaceAll('"','&quot;')}">

          <label class="swal2-label">DNI</label>
          <input id="dni" class="swal2-input" readonly value="${tarjeta.dniReporta || ""}">

          <label class="swal2-label">Fecha</label>
          <input id="fecha" class="swal2-input" readonly value="${new Date(tarjeta.fecha).toLocaleString()}">

          <label class="swal2-label">PET</label>
          <select id="pet" class="swal2-input" disabled>
            <option value="">-</option>
            ${petsOptionsHtml}
          </select>

          <label class="swal2-label">Zona</label>
          <select id="zona" class="swal2-input" disabled>
            <option value="">-</option>
            ${zonasOptionsHtml}
          </select>

          <label class="swal2-label">Equipo</label>
          <input id="equipo" class="swal2-input" readonly value="${tarjeta.equipo || ""}">

          <label class="swal2-label">Componente</label>
          <input id="componente" class="swal2-input" readonly value="${tarjeta.componente || ""}">

          <label class="swal2-label">Descripción</label>
          <textarea id="descripcion" class="swal2-textarea" readonly>${tarjeta.descripcion || ""}</textarea>

          <label class="swal2-label">Tipo Detección</label>
          <select id="tipoDet" class="swal2-input" disabled>
            <option value="">-</option>
            ${tipoOptionsHtml}
          </select>

          <label class="swal2-label">Status</label>
          <textarea id="comentario1" class="swal2-textarea" readonly>${tarjeta.comentario1 || ""}</textarea>

          <label class="swal2-label">Comentario (editable)</label>
          <textarea id="comentario2" class="swal2-textarea" placeholder="Ingrese estado o cierre...">${tarjeta.comentario2 || ""}</textarea>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Guardar",
      preConfirm: () => {
        return { comentario2: document.getElementById("comentario2").value };
      },
      didOpen: () => {
        // adaptar estilos mínimos si quieres
      },
    });

    if (!formValues) return;

    // Guardar solo comentario2 y userId
    try {
      const payload = { comentario2: formValues.comentario2, userId };
      await axios.put(`${API}tarjeta-roja/${tarjeta.id}`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      Swal.fire("Guardado", "Comentario actualizado", "success");

      // actualizar localmente
      setTarjetas((prev) => prev.map((t) => (t.id === tarjeta.id ? { ...t, comentario2: formValues.comentario2 } : t)));
      setFiltered((prev) => prev.map((t) => (t.id === tarjeta.id ? { ...t, comentario2: formValues.comentario2 } : t)));
    } catch (err) {
      console.error("Error actualizando tarjeta:", err);
      Swal.fire("Error", "No se pudo guardar el comentario", "error");
    }
  };

  return (
    <div className="p-4 max-w-screen-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Tarjetas Rojas</h1>

      {/* filtros */}
      <form className="flex flex-wrap gap-4 bg-gray-50 p-4 rounded-md shadow-md mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">PET</label>
          <select name="pet" value={filter.pet} onChange={handleFilterChange} className="p-2 border rounded">
            <option value="">Todos</option>
            {petsOptions.map((p, i) => (
              <option key={i} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Zona</label>
          <select name="zona" value={filter.zona} onChange={handleFilterChange} className="p-2 border rounded">
            <option value="">Todas</option>
            {zonasOptions.map((z, i) => (
              <option key={i} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tipo detección</label>
          <select name="tipoDeteccion" value={filter.tipoDeteccion} onChange={handleFilterChange} className="p-2 border rounded">
            <option value="">Todos</option>
            {tipoOptions.map((t, i) => (
              <option key={i} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
<div>
  <label className="block text-sm font-medium mb-1">Status</label>
  <select
    name="status"
    value={filter.status}
    onChange={handleFilterChange}
    className="p-2 border rounded"
  >
    <option value="">Todos</option>
    <option value="Abierto">Abierto</option>
    <option value="Cerrado">Cerrado</option>
  </select>
</div>
        <div>
  <label className="block text-sm font-medium mb-1">Rango de fecha</label>
  <select
    name="season"
    value={filter.season}
    onChange={handleFilterChange}
    className="p-2 border rounded"
  >
    <option value="">Todos</option>
    <option value="temporada">Temporada</option>
  </select>
</div>


        <div>
          <label className="block text-sm font-medium mb-1">Buscar</label>
          <input type="text" name="searchText" value={filter.searchText} onChange={handleFilterChange} placeholder="Reporta, equipo, descripción..." className="p-2 border rounded w-64" />
        </div>

        <div className="flex items-end gap-2">
          <div className="flex items-end gap-3">
  <button 
    type="button" 
    onClick={applyFilters} 
    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
  >
    Aplicar
  </button>

  <button 
    type="button" 
    onClick={handleClearFilters} 
    className="bg-gray-300 px-3 py-2 rounded"
  >
    Limpiar
  </button>

  {/* ✅ Contador de filas */}
  <div className="px-3 py-2 bg-gray-100 border rounded text-sm font-medium text-gray-700">
    Tarjetas: <span className="font-bold">{filtered.length}</span>
  </div>
</div>

        </div>
      </form>

      {/* tabla */}
     {loading ? (
  <p className="text-center">Cargando...</p>
) : (
  <div className="overflow-x-auto">
    <table className="min-w-[950px] w-full border text-sm text-left">
      <thead className="bg-gray-200">
        <tr>
          <th className="px-2">Reporta</th>
          <th className="px-2">Fecha</th>
          <th className="px-2">PET</th>
          <th className="px-2">Zona</th>
          <th className="px-2">Equipo</th>
          <th className="px-2">Componente</th>
          <th className="px-2">Descripción</th>
          <th className="px-2">Tipo detección</th>
          <th className="px-2">Status</th>
          <th className="px-2">Comentario</th>
          <th className="px-2">Acciones</th>
        </tr>
      </thead>

      <tbody>
        {filtered.map((t) => (
          <tr key={t.id} className="border-t hover:bg-gray-50">
            <td className="px-2 py-2 break-words">{t.reporta}</td>
            <td className="px-2 py-2 break-words">
              {(() => {
  const d = new Date(t.fecha);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
})()}

            </td>
            <td className="px-2 py-2 break-words">{t.pet || "-"}</td>
            <td className="px-2 py-2 break-words">{t.zona || "-"}</td>
            <td className="px-2 py-2 break-words">{t.equipo || "-"}</td>
            <td className="px-2 py-2 break-words">{t.componente || "-"}</td>
            <td className="px-2 py-2 break-words">{t.descripcion || "-"}</td>
            <td className="px-2 py-2 break-words">{t.tipoDeteccion || "-"}</td>
            <td className="px-2 py-2 break-words">{t.comentario1 || "-"}</td>
            <td className="px-2 py-2 break-words">{t.comentario2 || "-"}</td>

            {/* ✅ Columna unificada de acciones */}
            <td className="px-2 py-2 flex flex-col gap-2 items-center justify-center">
              {/* Editar */}
              <button
                className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                onClick={() => handleEditTarjeta(t)}
              >
                Editar
              </button>

              {/* Imagen */}
              {t.images?.[0]?.url ? (
                <button
                  className="bg-blue-600 text-white px-2 py-1 rounded"
                  onClick={() => setModalImage(t.images[0].url)}
                >
                  Ver imagen
                </button>
              ) : (
                <>
                  <button
                    disabled={isUploading}
                    className={`px-2 py-1 rounded text-white ${
                      isUploading
                        ? "bg-gray-400"
                        : "bg-orange-600 hover:bg-orange-700"
                    }`}
                    onClick={() => promptUploadForRow(t)}
                  >
                    {isUploading ? "Subiendo..." : "Subir imagen"}
                  </button>

                  {/* inputs ocultos compartidos */}
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={onGalleryChange}
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: "none" }}
                    onChange={onCameraChange}
                  />
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

      {/* modal imagen */}
      {modalImage && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded max-w-3xl w-full relative">
            <button className="absolute top-2 right-2 text-gray-600" onClick={() => setModalImage(null)}>
              ✖
            </button>
            <img src={modalImage} alt="Preview" className="max-h-[80vh] w-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};

export default TarjetaRoja;
