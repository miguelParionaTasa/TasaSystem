import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const Activo = () => {
  const [filter, setFilter] = useState({ zona: "", ubicacion: "", equipo: "", nombre: "", valor: "" });
  const [zonas, setZonas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [activos, setActivos] = useState([]);
  const [loading, setLoading] = useState(false);
const [ubicacionesModal, setUbicacionesModal] = useState([]);

  const [modalAddVisible, setModalAddVisible] = useState(false);
  const [newActivo, setNewActivo] = useState({
    nombre: "",
    valor: "",
    valor2: "",
    marca: "",
    modelo: "",
    serie: "",
    zona: "",
    ubicacion: "",
    imagen: null,
  });

  const [modalImage, setModalImage] = useState(null);


  const token = localStorage.getItem("token");
  const userId = parseInt(localStorage.getItem("userId"));

  // === Cargar Zonas ===
  useEffect(() => {
  const fetchZonas = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}activos`);
      const zonasUnicas = Array.from(
        new Set(res.data.map((a) => a.zona).filter(Boolean))
      );
      setZonas(zonasUnicas.sort());
    } catch (err) {
      console.error("Error al cargar zonas desde activos:", err);
    }
  };
  fetchZonas();
}, []);



// Función utilitaria
const getZonaIdFromText = (zonaText) => {
  if (!zonaText) return null;
  const match = zonaText.match(/^\d+/); // toma todos los dígitos al inicio
  return match ? Number(match[0]) : null;
};

const newActivoZonaId = getZonaIdFromText(newActivo.zona);
  // === Cargar Ubicaciones según zona seleccionada ===
useEffect(() => {
  if (!filter.zona) return setUbicaciones([]);

  const zonaIdNumerica = getZonaIdFromText(filter.zona);
  if (!zonaIdNumerica) return setUbicaciones([]);

  axios
    .get(`${process.env.REACT_APP_API_URL}varios/ubicaciones/por-zona?zonaId=${zonaIdNumerica}`)
    .then((res) =>
      setUbicaciones(res.data.sort((a, b) => a.name.localeCompare(b.name)))
    )
    .catch((err) => console.error("Error cargando ubicaciones filtro:", err));
}, [filter.zona]);



  // === Cargar Equipos ===
  useEffect(() => {
    if (!filter.ubicacion) return setEquipos([]);
    axios
      .get(`${process.env.REACT_APP_API_URL}equipos/por-zona/${filter.zona}?ubicacionId=${filter.ubicacion}`)
      .then((res) =>
        setEquipos(res.data.sort((a, b) => a.name.localeCompare(b.name)))
      )
      .catch((err) => console.error(err));
  }, [filter.ubicacion, filter.zona]);

  // === Cambiar Filtro ===
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prev) => {
      if (name === "zona") return { zona: value, ubicacion: "", equipo: "", nombre: "", valor: "" };
      if (name === "ubicacion") return { ...prev, ubicacion: value, equipo: "", nombre: "", valor: "" };
      return { ...prev, [name]: value };
    });
  };

  // === Buscar Activos ===
  const handleSubmit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}activos/search`, {
        params: {
          zonaId: filter.zona || undefined,
          ubicacionId: filter.ubicacion || undefined,
          equipoId: filter.equipo || undefined,
          nombre: filter.nombre || undefined,
          valor: filter.valor || undefined,
        },
      });
      setActivos(response.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // === Guardar nuevo activo ===
  const handleSaveNew = async () => {
    if (!newActivo.nombre?.trim()) {
      Swal.fire("Error", "Falta ingresar el nombre del activo", "error");
      return;
    }

    const formData = new FormData();

    // Se guarda el nombre de la zona y la ubicación, no su ID
    Object.entries(newActivo).forEach(([k, v]) => {
      if (v && k !== "imagen") formData.append(k, v);
    });

    if (newActivo.imagen) {
      formData.append("file", newActivo.imagen);
    }

    formData.append("userId", userId);
    if (filter.equipo) formData.append("equipoId", filter.equipo);

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}activos`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      Swal.fire("Éxito", "Activo registrado correctamente", "success");
      setModalAddVisible(false);
      handleSubmit();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudo registrar el activo", "error");
    }
  };
const zonaId = getZonaIdFromText(filter.zona);
  // === Subir imagen ===
 const handleUploadImage = async (activo, file) => {
  if (!file) return;

  const maxSizeMB = 2;
  const fileSizeMB = file.size / (1024 * 1024);

  if (fileSizeMB >= maxSizeMB) {
    Swal.fire(
      "Archivo demasiado grande",
      `El archivo pesa ${fileSizeMB.toFixed(2)} MB. El máximo permitido es 2 MB.`,
      "warning"
    );
    return;
  }

  const formData = new FormData();
  formData.append("image", file);

  try {
    const res = await axios.post(
      `${process.env.REACT_APP_API_URL}activos/${activo.id}/upload-image`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    Swal.fire("Actualizado", "Imagen subida correctamente", "success");
    setActivos((prev) =>
      prev.map((a) =>
        a.id === activo.id
          ? { ...a, images: [...(a.images || []), res.data] }
          : a
      )
    );
  } catch (error) {
    console.error(error);
    Swal.fire("Error", "No se pudo subir la imagen", "error");
  }
};

  // === Editar activo ===
  const handleEditActivo = async (activo) => {
    const { value: formValues } = await Swal.fire({
      title: `Editar activo ${activo.nombre}`,
      html: `
        <input id="nombre" class="swal2-input" placeholder="Nombre" value="${activo.nombre || ""}">
        <input id="valor" class="swal2-input" placeholder="Placa" value="${activo.valor || ""}">
        <input id="valor2" class="swal2-input" placeholder="Descripción" value="${activo.valor2 || ""}">
        <input id="marca" class="swal2-input" placeholder="Marca" value="${activo.marca || ""}">
        <input id="modelo" class="swal2-input" placeholder="Modelo" value="${activo.modelo || ""}">
        <input id="serie" class="swal2-input" placeholder="Serie" value="${activo.serie || ""}">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Guardar cambios",
      preConfirm: () => ({
        nombre: document.getElementById("nombre").value,
        valor: document.getElementById("valor").value,
        valor2: document.getElementById("valor2").value,
        marca: document.getElementById("marca").value,
        modelo: document.getElementById("modelo").value,
        serie: document.getElementById("serie").value,
      }),
    });

    if (!formValues) return;

    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}activos/${activo.id}`,
        { ...formValues, userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire("Actualizado", "Activo modificado correctamente", "success");
      handleSubmit();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudo actualizar el activo", "error");
    }
  };

  return (
    <div className="p-4 max-w-screen-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Activos</h1>

      {/* === FILTROS === */}
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4 bg-gray-50 p-4 rounded-md shadow-md mb-6">
        <div>
  <label className="block font-semibold text-gray-700 mb-2">Zona</label>
  <select
    name="zona"
    value={filter.zona}
    onChange={handleFilterChange}
    className="p-2 border rounded"
  >
    <option value="">Todas</option>
    {zonas.map((z, i) => (
      <option key={i} value={z}>
        {z}
      </option>
    ))}
  </select>
</div>


        <div>
          <label className="block font-semibold text-gray-700 mb-2">Ubicación</label>
          <select
  name="ubicacion"
  value={filter.ubicacion}
  onChange={handleFilterChange}
  disabled={!filter.zona}
  className="p-2 border rounded"
>
  <option value="">Todas</option>
  {ubicaciones.map((u) => (
    <option key={u.id} value={u.id}>
      {u.name}
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
            disabled={!filter.ubicacion}
            className="p-2 border rounded"
          >
            <option value="">Todos</option>
            {equipos.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-2">Placa</label>
          <input
            type="text"
            name="valor"
            value={filter.valor}
            onChange={handleFilterChange}
            placeholder="Buscar por placa"
            className="w-[180px] p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-2">N° Activo</label>
          <input
            type="text"
            name="nombre"
            value={filter.nombre}
            onChange={handleFilterChange}
            placeholder="Buscar por nombre"
            className="w-[180px] p-2 border border-gray-300 rounded-md"
          />
        </div>

        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition">
          Filtrar
        </button>
      </form>

      {/* === BOTÓN NUEVO === */}
      <div className="flex mb-4">
        <button
          onClick={() => setModalAddVisible(true)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          ➕ Nuevo Activo
        </button>
      </div>

      {/* === TABLA === */}
      {loading ? (
        <p className="text-center">Cargando...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-400 text-sm text-center">
            <thead>
              <tr className="bg-gray-300 border border-gray-400">
                <th>N° Activo</th>
                <th>Placa</th>
                <th>Descripción</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Serie</th>
                <th>Zona</th>
                <th>Ubicación</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {activos.map((a) => (
                <tr key={a.id} className="border border-gray-400 hover:bg-gray-100 transition">
                  <td>{a.nombre}</td>
                  <td>{a.valor || "-"}</td>
                  <td>{a.valor2 || "-"}</td>
                  <td>{a.marca || "-"}</td>
                  <td>{a.modelo || "-"}</td>
                  <td>{a.serie || "-"}</td>
                  <td>{a.zona || a.equipo?.ubicacion?.zona?.nombreMaximo || "-"}</td>
                  <td>{a.ubicacion || a.equipo?.ubicacion?.name || "-"}</td>
                  <td className="flex justify-center gap-2">
                    {a.images?.[0]?.url ? (
                      <button
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                        onClick={() => setModalImage(a.images[0].url)}
                      >
                        Ver
                      </button>
                    ) : (
                      <button
                        className="bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700"
                        onClick={() => {
                          Swal.fire({
                            title: "Subir imagen",
                            input: "file",
                            inputAttributes: { accept: "image/*" },
                            showCancelButton: true,
                          }).then((res) => {
                            if (res.value) handleUploadImage(a, res.value);
                          });
                        }}
                      >
                        Subir
                      </button>
                    )}
                    <button
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      onClick={() => handleEditActivo(a)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* === MODAL NUEVO === */}
     {modalAddVisible && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative">
      <button
        className="absolute top-2 right-2 text-gray-600 hover:text-red-600"
        onClick={() => setModalAddVisible(false)}
      >
        ✖
      </button>

      <h2 className="text-lg font-semibold mb-4 text-center">➕ Nuevo Activo</h2>

      <div className="flex flex-col gap-3">
        {/* Campos básicos */}
        {[
          { name: "nombre", placeholder: "N° Activo" },
          { name: "valor", placeholder: "Placa" },
          { name: "valor2", placeholder: "Descripción" },
          { name: "marca", placeholder: "Marca" },
          { name: "modelo", placeholder: "Modelo" },
          { name: "serie", placeholder: "Serie" },
        ].map((field) => (
          <input
            key={field.name}
            type="text"
            placeholder={field.placeholder}
            value={newActivo[field.name] || ""}
            onChange={(e) =>
              setNewActivo({ ...newActivo, [field.name]: e.target.value })
            }
            className="p-2 border rounded focus:ring focus:ring-green-200"
          />
        ))}

        {/* === SELECT ZONA === */}
        <select
          value={newActivo.zona || ""}
          onChange={(e) => {
            const selectedZona = e.target.value;
            setNewActivo({
              ...newActivo,
              zona: selectedZona,
              ubicacion: "", // Limpiar ubicación al cambiar zona
            });
          }}
          className="p-2 border rounded focus:ring focus:ring-green-200"
        >
          <option value="">Seleccionar zona</option>
          {zonas.map((z, i) => (
            <option key={i} value={z}>
              {z} {/* Zona es texto libre */}
            </option>
          ))}
        </select>

       <select
  value={newActivo.ubicacion || ""}
  onChange={(e) => {
    const selectedUbic = ubicacionesModal.find(
      (u) => u.id === Number(e.target.value)
    );
    setNewActivo({
      ...newActivo,
      ubicacion: selectedUbic ? selectedUbic.name : "",
    });
  }}
  disabled={!newActivo.zona}
  className={`p-2 border rounded ${
    !newActivo.zona ? "bg-gray-100 cursor-not-allowed" : ""
  } focus:ring focus:ring-green-200`}
>
  <option value="">Seleccionar ubicación</option>
  {ubicacionesModal.map((u) => (
    <option key={u.id} value={u.id}>
      {u.name}
    </option>
  ))}
</select>


        {/* Subir imagen */}
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
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setNewActivo((prev) => ({
        ...prev,
        imagen: file,
        preview: event.target.result,
      }));
    };
    reader.readAsDataURL(file);
  }}
  className="p-2 border rounded w-full"
/>

{newActivo.preview && (
  <div className="mt-2 flex justify-center">
    <img
      src={newActivo.preview}
      alt="Vista previa"
      className="w-32 h-32 object-cover border rounded-md"
    />
  </div>
)}


        {/* Botón Guardar */}
        <button
          onClick={handleSaveNew}
          className="bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Guardar
        </button>
      </div>
    </div>
  </div>
)}


      {/* === MODAL IMAGEN === */}
      {modalImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-md max-w-2xl relative">
            <button
              onClick={() => setModalImage(null)}
              className="absolute top-2 right-2 text-gray-600 text-lg font-bold"
            >
              ✖
            </button>
            <img src={modalImage} alt="Activo" className="max-h-[80vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Activo;
