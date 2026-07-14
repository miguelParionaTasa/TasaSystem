import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const Clinica = () => {
  const [filter, setFilter] = useState({
    zona: "",
    ubicacion: "",
  });

  const [uploading, setUploading] = useState(false);

  const [zonas, setZonas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [clinicas, setClinicas] = useState([]); // Inicialmente vacío
  const [hasSearched, setHasSearched] = useState(false); // 🔹 NUEVO ESTADO: rastrea si ya se ha hecho una búsqueda

  const [modalImagesVisible, setModalImagesVisible] = useState(false);
  const [modalImage, setModalImage] = useState(null);

  const [modalAddVisible, setModalAddVisible] = useState(false);

  const [newRow, setNewRow] = useState({
    nombre: "",
    valor: "",
    ot: "",
    fecha: "",
    imagen: null,
  });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false); // Usado para el botón Filtrar

  const [editingId, setEditingId] = useState(null);

  const [editedData, setEditedData] = useState({
    nombre: "",
    valor: "",
    ot: "",
    fecha: "",
  });

  const token = localStorage.getItem("token");
  const userId = parseInt(localStorage.getItem("userId"));

  // Define el ID del usuario "administrador" o el que NO quieres resaltar (Miguel Pariona)
  const ADMIN_USER_ID = 1;

  // =========================
  // ORDENAR
  // =========================
  const ordenarClinicas = (data) => {
    return [...data].sort((a, b) => {
      // 1️⃣ ORDENAR POR FECHA (Más reciente primero: b - a)
      const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0;
      const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0;

      if (fechaB !== fechaA) {
        return fechaB - fechaA;
      }

      // 2️⃣ ORDENAR POR ZONA (Secundario)
      const zonaA = a.ubicacion?.zona?.nombreMaximo || "";
      const zonaB = b.ubicacion?.zona?.nombreMaximo || "";

      if (zonaA !== zonaB) {
        return zonaA.localeCompare(zonaB);
      }

      // 3️⃣ ORDENAR POR UBICACIÓN (Terciario)
      const ubicA = a.ubicacion?.name || "";
      const ubicB = b.ubicacion?.name || "";

      if (ubicA !== ubicB) {
        return ubicA.localeCompare(ubicB);
      }

      // 4️⃣ ORDENAR POR NOMBRE (Cuaternario)
      const nombreA = a.nombre || "";
      const nombreB = b.nombre || "";

      return nombreA.localeCompare(nombreB);
    });
  };

  // =========================
  // CARGAR ZONAS
  // =========================
  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}varios/zonas`)
      .then((res) => setZonas(res.data))
      .catch((err) => console.error(err));
  }, []);

  // =========================
  // CARGAR UBICACIONES
  // =========================
  useEffect(() => {
    if (!filter.zona) {
      setUbicaciones([]);
      return;
    }

    axios
      .get(
        `${process.env.REACT_APP_API_URL}varios/ubicaciones/por-zona?zonaId=${filter.zona}`
      )
      .then((res) => {
        // Ordenar las ubicaciones por el nombre (propiedad 'name') con localeCompare para español
        if (Array.isArray(res.data)) {
          const ubicacionesOrdenadas = [...res.data].sort((a, b) =>
            a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
          );
          setUbicaciones(ubicacionesOrdenadas);
        } else {
          console.warn("La respuesta de la API para ubicaciones no es un array:", res.data);
          setUbicaciones([]);
        }
      })
      .catch((err) => console.error(err));
  }, [filter.zona]);

  // =========================
  // FILTROS
  // =========================
  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilter((prev) => {
      if (name === "zona") {
        return {
          zona: value,
          ubicacion: "",
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });
  };

  // =========================
  // FILTRAR (y ahora única fuente de datos)
  // =========================
  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (loading) return; // Evitar doble clic

    setLoading(true);
    setHasSearched(true); // 🔹 Marcar que ya se realizó una búsqueda
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}clinicas/search`,
        {
          params: {
            zonaId: filter.zona || undefined,
            ubicacionId: filter.ubicacion || undefined,
          },
        }
      );

      setClinicas(ordenarClinicas(res.data || []));
    } catch (error) {
      console.error(error);
      setClinicas([]); // 🔹 Vaciar si hay error
      Swal.fire(
        "Error",
        "No se pudieron filtrar los datos",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // CREAR
  // =========================
  const handleSaveNew = async () => {
    if (!filter.ubicacion) {
      return Swal.fire(
        "Error",
        "Debe seleccionar una ubicación",
        "error"
      );
    }

    if (!newRow.nombre.trim()) {
      return Swal.fire(
        "Error",
        "Debe ingresar el nombre del activo", // Mensaje más descriptivo
        "error"
      );
    }

    if (!newRow.valor.trim()) {
      return Swal.fire(
        "Error",
        "Debe ingresar el título del trabajo", // Mensaje más descriptivo
        "error"
      );
    }

    // NUEVA VALIDACIÓN: La fecha es obligatoria
    if (!newRow.fecha) {
      return Swal.fire(
        "Error",
        "Debe ingresar una fecha",
        "error"
      );
    }

    if (saving) return;

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("nombre", newRow.nombre.trim());
      formData.append("valor", newRow.valor.trim());

      formData.append("ot", newRow.ot || "");
      // Envía la fecha directamente en formato YYYY-MM-DD para compatibilidad con backend/Prisma
      formData.append("fecha", newRow.fecha);

      formData.append("ubicacionId", filter.ubicacion);

      formData.append("userId", userId);

      if (newRow.imagen) {
        formData.append("image", newRow.imagen);
      }

      await axios.post(
        `${process.env.REACT_APP_API_URL}clinicas`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      Swal.fire(
        "Éxito",
        "Dato técnico agregado correctamente",
        "success"
      );

      setModalAddVisible(false);

      setNewRow({
        nombre: "",
        valor: "",
        ot: "",
        fecha: "",
        imagen: null,
      });

      if (hasSearched) { // 🔹 Refrescar solo si ya se había buscado
        handleSubmit();
      }
    } catch (error) {
      console.error(error);

      Swal.fire(
        "Error",
        "No se pudo guardar el dato técnico",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // EDITAR
  // =========================
  const handleSaveEdit = async (item) => {
    if (saving) return; // Evitar doble clic si está guardando (el mismo estado 'saving' para editar)
    setSaving(true); // Activar estado de guardado/edición

    try {
      const cambios = {};

      if (item.nombre !== editedData.nombre) {
        cambios.nombre = editedData.nombre;
      }

      if (item.valor !== editedData.valor) {
        cambios.valor = editedData.valor;
      }

      if (item.ot !== editedData.ot) {
        cambios.ot = editedData.ot;
      }

      // Validación y conversión de fecha al editar (formato YYYY-MM-DD)
      const newEditedDateString = editedData.fecha ? editedData.fecha : ""; // YYYY-MM-DD o cadena vacía
      const originalDateString = item.fecha ? item.fecha.slice(0, 10) : ""; // Asegura formato YYYY-MM-DD

      if (newEditedDateString !== originalDateString) {
        cambios.fecha = newEditedDateString; // Envía directamente la cadena YYYY-MM-DD
      }

      if (Object.keys(cambios).length === 0) {
        setSaving(false); // Desactivar si no hay cambios
        return Swal.fire(
          "Sin cambios",
          "No se realizaron modificaciones",
          "info"
        );
      }

      await axios.put(
        `${process.env.REACT_APP_API_URL}clinicas/${item.id}`,
        {
          ...cambios,
          userId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Swal.fire(
        "Actualizado",
        "Dato técnico actualizado correctamente",
        "success"
      );

      setEditingId(null);
      if (hasSearched) { // 🔹 Refrescar solo si ya se había buscado
        handleSubmit();
      }
    } catch (error) {
      console.error(error);

      Swal.fire(
        "Error",
        "No se pudo actualizar",
        "error"
      );
    } finally {
      setSaving(false); // Desactivar estado de guardado/edición
    }
  };

  // =========================
  // ELIMINAR
  // =========================
  const handleDelete = async (item) => {
    if (uploading || saving || loading) return; // 🔹 Evitar si otra operación está activa

    if (userId !== item.userId) {
      return Swal.fire(
        "No permitido",
        `Este dato fue creado por ${
          item.user?.firstName || ""
        } ${item.user?.lastName || ""}`,
        "error"
      );
    }

    const result = await Swal.fire({
      title: "¿Eliminar dato técnico?",
      text: item.nombre,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar", // 🔹 Añadido el texto al botón Cancelar
      didOpen: () => {
        // Deshabilitar botones si ya estamos en otra operación (subiendo, guardando, cargando)
        const confirmButton = Swal.getConfirmButton();
        const cancelButton = Swal.getCancelButton();
        if ((uploading || saving || loading) && confirmButton) {
          confirmButton.disabled = true;
          if (cancelButton) cancelButton.disabled = true;
        }
      }
    });

    if (!result.isConfirmed) return;

    Swal.fire({ // 🔹 Mostrar spinner mientras se elimina
      title: "Eliminando...",
      text: "Por favor espera...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}clinicas/${item.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Swal.fire(
        "Eliminado",
        "Dato técnico eliminado correctamente",
        "success"
      );

      if (hasSearched) { // 🔹 Refrescar solo si ya se había buscado
        handleSubmit();
      } else {
        // Si no había búsqueda activa, simplemente removemos el item de la lista local
        setClinicas(prev => prev.filter(c => c.id !== item.id));
      }
    } catch (error) {
      console.error(error);

      Swal.fire(
        "Error",
        "No se pudo eliminar",
        "error"
      );
    }
  };

  // =========================
  // SUBIR IMAGEN
  // =========================
  const handleUploadImage = async (item, file) => {
    if (!file) return;
    if (uploading || saving || loading) return; // 🔹 Evitar si otra operación está activa

    const maxSizeMB = 2;
    const fileSizeMB = file.size / (1024 * 1024);

    if (fileSizeMB > maxSizeMB) {
      return Swal.fire(
        "Archivo demasiado grande",
        `El archivo pesa ${fileSizeMB.toFixed(
          2
        )} MB. El máximo permitido es 2 MB.`,
        "warning"
      );
    }

    setUploading(true); // 🔹 Activar estado de subida

    Swal.fire({
      title: "Subiendo imagen...",
      text: "Por favor espera mientras se carga la imagen",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const formData = new FormData();

      formData.append("image", file);

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

      Swal.fire(
        "Actualizado",
        "Imagen subida correctamente",
        "success"
      );

      setClinicas((prev) =>
        prev.map((c) =>
          c.id === item.id
            ? {
                ...c,
                images: [...(c.images || []), res.data],
              }
            : c
        )
      );
    } catch (error) {
      console.error(error);

      Swal.fire(
        "Error",
        "No se pudo subir la imagen",
        "error"
      );
    } finally {
      setUploading(false); // 🔹 Desactivar estado de subida
    }
  };

  // =========================
  // DATA SELECCIONADA
  // =========================
  const zonaSel = zonas.find(
    (z) => z.id === Number(filter.zona)
  );

  const ubicSel = ubicaciones.find(
    (u) => u.id === Number(filter.ubicacion)
  );


  return (
    <div className="p-4 max-w-screen-2xl mx-auto">

      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        Datos Técnicos Clínica
      </h1>

      {/* FILTROS */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap gap-4 items-end bg-gray-50 p-4 rounded-md shadow-md mb-6"
      >

        {/* ZONA */}
        <div>
          <label className="block font-semibold mb-1">
            Zona
          </label>

          <select
            name="zona"
            value={filter.zona}
            onChange={handleFilterChange}
            className="p-2 border rounded"
            disabled={loading} // 🔹 Deshabilitar mientras carga
          >
            <option value="">Todas</option>

            {[...zonas]
              .sort((a, b) =>
                a.nombreMaximo.localeCompare(b.nombreMaximo)
              )
              .map((z) => (
                <option key={z.id} value={z.id}>
                  {z.nombreMaximo}
                </option>
              ))}
          </select>
        </div>

        {/* UBICACION */}
        <div>
          <label className="block font-semibold mb-1">
            Ubicación
          </label>

          <select
            name="ubicacion"
            value={filter.ubicacion}
            onChange={handleFilterChange}
            disabled={!filter.zona || loading} // 🔹 Deshabilitar mientras carga
            className="p-2 border rounded"
          >
            <option value="">Todas</option>

            {[...ubicaciones]
              .sort((a, b) =>
                a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }) // Orden alfabético para ubicaciones
              )
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading} // 🔹 Deshabilitar mientras carga
          className={`px-4 py-2 rounded ${
            loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {loading ? "Filtrando..." : "Filtrar"} {/* 🔹 Texto dinámico */}
        </button>

      </form>

      {/* BOTONES */}
      <div className="flex gap-4 mb-4">

        <button
          onClick={() => {
            if (!filter.ubicacion) {
              return Swal.fire(
                "Seleccione ubicación",
                "Debe seleccionar una ubicación para añadir un dato técnico.",
                "warning"
              );
            }
            setModalAddVisible(true);
          }}
          disabled={loading || saving || uploading || editingId !== null} // 🔹 Deshabilitar si hay otra operación activa
          className={`px-4 py-2 rounded ${
            (loading || saving || uploading || editingId !== null) ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          ➕ Añadir dato técnico
        </button>

        <button
          onClick={() => setModalImagesVisible(true)}
          disabled={loading || saving || uploading || editingId !== null} // 🔹 Deshabilitar si hay otra operación activa
          className={`px-4 py-2 rounded ${
            (loading || saving || uploading || editingId !== null) ? "bg-purple-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700 text-white"
          }`}
        >
          🖼 Ver imágenes
        </button>

      </div>

      {/* MODAL NUEVO */}
      {modalAddVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-md p-6 w-full max-w-lg relative shadow-lg">

            <button
              onClick={() => setModalAddVisible(false)}
              disabled={saving} // 🔹 Deshabilitar cerrar si está guardando
              className="absolute top-2 right-2 text-gray-700"
            >
              ✖
            </button>

            <h2 className="text-xl font-semibold mb-4 text-center">
              ➕ Añadir dato técnico
            </h2>

            <p className="text-sm mb-4 text-gray-600">
              <b>Zona:</b>{" "}
              {zonaSel?.nombreMaximo || "N/A"}
              <br />

              <b>Ubicación:</b>{" "}
              {ubicSel?.name || "N/A"}
            </p>

            <div className="flex flex-col gap-3">

              <input
                type="text"
                placeholder="Nombre del Activo" // Etiqueta más descriptiva
                value={newRow.nombre}
                onChange={(e) =>
                  setNewRow((prev) => ({
                    ...prev,
                    nombre: e.target.value,
                  }))
                }
                className="p-2 border rounded"
                disabled={saving} // 🔹 Deshabilitar inputs mientras guarda
              />

              <input
                type="text"
                placeholder="Título del trabajo" // Etiqueta más descriptiva
                value={newRow.valor}
                onChange={(e) =>
                  setNewRow((prev) => ({
                    ...prev,
                    valor: e.target.value,
                  }))
                }
                className="p-2 border rounded"
                disabled={saving} // 🔹 Deshabilitar inputs mientras guarda
              />

              <input
                type="text"
                placeholder="Descripción del trabajo (Opcional)" // Ahora OT es opcional
                value={newRow.ot}
                onChange={(e) =>
                  setNewRow((prev) => ({
                    ...prev,
                    ot: e.target.value,
                  }))
                }
                className="p-2 border rounded"
                disabled={saving} // 🔹 Deshabilitar inputs mientras guarda
              />

              <input
                type="date"
                value={newRow.fecha}
                onChange={(e) =>
                  setNewRow((prev) => ({
                    ...prev,
                    fecha: e.target.value,
                  }))
                }
                className="p-2 border rounded"
                disabled={saving} // 🔹 Deshabilitar inputs mientras guarda
              />

              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];

                  if (!file) return;

                  const maxSizeMB = 2;

                  const fileSizeMB =
                    file.size / (1024 * 1024);

                  if (fileSizeMB > maxSizeMB) {
                    Swal.fire(
                      "Archivo demasiado grande",
                      `El archivo pesa ${fileSizeMB.toFixed(
                        2
                      )} MB. El máximo permitido es 2 MB.`,
                      "warning"
                    );

                    e.target.value = "";

                    return;
                  }

                  setNewRow((prev) => ({
                    ...prev,
                    imagen: file,
                  }));
                }}
                className="p-2 border rounded"
                disabled={saving} // 🔹 Deshabilitar inputs mientras guarda
              />

              <button
                onClick={handleSaveNew}
                disabled={saving}
                className={`text-white px-4 py-2 rounded ${
                  saving
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* TABLA O MENSAJES */}
      {loading ? (
        <p className="text-center mt-6">
          Cargando datos...
        </p>
      ) : (
        <div className="overflow-x-auto shadow-md rounded-lg border border-gray-300">
          {hasSearched && clinicas.length === 0 ? ( // 🔹 Mensaje para cuando no hay resultados después de una búsqueda
            <p className="text-center mt-6 py-4">No se encontraron datos técnicos con los filtros aplicados.</p>
          ) : !hasSearched && clinicas.length === 0 ? ( // 🔹 Mensaje para cuando no se ha buscado aún
            <p className="text-center mt-6 py-4">Use los filtros para buscar datos técnicos.</p>
          ) : (
            // 🔹 Renderiza la tabla solo si hay datos y se ha buscado
            <table className="min-w-full text-sm bg-white">

              <thead className="bg-gray-200 text-gray-700">

                <tr>
                  <th className="border px-3 py-2 text-left">
                    Zona
                  </th>

                  <th className="border px-3 py-2 text-left">
                    Ubicación
                  </th>

                  <th className="border px-3 py-2 text-left">
                    Activo
                  </th>

                  <th className="border px-3 py-2 text-left">
                    Trabajo
                  </th>

                  <th className="border px-3 py-2 text-left">
                    OT
                  </th> {/* Nueva columna para OT */}

                  <th className="border px-3 py-2 text-left">
                    Fecha
                  </th>

                  <th className="border px-3 py-2 text-center">
                    Imágenes
                  </th>

                  <th className="border px-3 py-2 text-center">
                    Acciones
                  </th>
                </tr>

              </thead>

              <tbody>

                {clinicas.map((item) => (

                  <tr
                    key={item.id}
                    // Añadimos una clase condicional: si el userId del item no es el ADMIN_USER_ID (Miguel), lo resalta en verde
                    className={`hover:bg-gray-50 ${item.userId !== ADMIN_USER_ID ? 'bg-green-100' : ''}`}
                  >

                    {/* ZONA */}
                    <td className="border px-3 py-2">
                      {item.ubicacion?.zona?.nombreMaximo ||
                        "N/A"}
                    </td>

                    {/* UBICACION */}
                    <td className="border px-3 py-2">
                      {item.ubicacion?.name || "N/A"}
                    </td>

                    {/* NOMBRE (Activo) */}
                    <td className="border px-3 py-2 font-semibold">

                      {editingId === item.id ? (
                        <input
                          type="text"
                          value={editedData.nombre || ""}
                          onChange={(e) =>
                            setEditedData((prev) => ({
                              ...prev,
                              nombre: e.target.value,
                            }))
                          }
                          className="border p-1 rounded w-full"
                          disabled={saving} // 🔹 Deshabilitar mientras guarda/edita
                        />
                      ) : (
                        item.nombre
                      )}

                    </td>

                    {/* VALOR (Título del trabajo) */}
                    <td className="border px-3 py-2">

                      {editingId === item.id ? (
                        <textarea
                          value={editedData.valor || ""}
                          onChange={(e) =>
                            setEditedData((prev) => ({
                              ...prev,
                              valor: e.target.value,
                            }))
                          }
                          className="border p-1 rounded w-full"
                          disabled={saving} // 🔹 Deshabilitar mientras guarda/edita
                        />
                      ) : (
                        item.valor
                      )}

                    </td>

                    {/* OT */}
                    <td className="border px-3 py-2">

                      {editingId === item.id ? (
                        <input
                          type="text"
                          value={editedData.ot || ""}
                          onChange={(e) =>
                            setEditedData((prev) => ({
                              ...prev,
                              ot: e.target.value,
                            }))
                          }
                          className="border p-1 rounded w-full"
                          disabled={saving} // 🔹 Deshabilitar mientras guarda/edita
                        />
                      ) : (
                        item.ot || "-" // Muestra "-" si no hay OT
                      )}

                    </td>


                    {/* FECHA */}
                    <td className="border px-3 py-2">

                      {editingId === item.id ? (
                        <input
                          type="date"
                          value={
                            editedData.fecha
                              ? editedData.fecha.slice(0, 10)
                              : ""
                          }
                          onChange={(e) =>
                            setEditedData((prev) => ({
                              ...prev,
                              fecha: e.target.value,
                            }))
                          }
                          className="border p-1 rounded w-full"
                          disabled={saving} // 🔹 Deshabilitar mientras guarda/edita
                        />
                      ) : item.fecha ? (
                        new Date(item.fecha)
                          .toLocaleDateString("es-PE")
                      ) : (
                        "-"
                      )}

                    </td>

                    {/* IMAGENES */}
                    <td className="border px-3 py-2 text-center">

                      {Array.isArray(item.images) &&
                      item.images.length > 0 ? (
                        <button
                          onClick={() =>
                            setModalImage(
                              item.images[0]?.url
                            )
                          }
                          disabled={loading || saving || uploading || editingId !== null} // 🔹 Deshabilitar si hay otra operación activa
                          className={`bg-purple-600 text-white px-3 py-1 rounded ${
                            (loading || saving || uploading || editingId !== null) ? "bg-purple-400 cursor-not-allowed" : "hover:bg-purple-700"
                          }`}
                        >
                          Ver
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (
                              userId !== item.userId
                            ) {
                              return Swal.fire(
                                "No permitido",
                                "Solo el creador puede subir imagen",
                                "error"
                              );
                            }
                            if (uploading || saving || loading || editingId !== null) return; // 🔹 Evitar si otra operación activa

                            Swal.fire({
                              title: "Subir imagen",
                              input: "file",
                              inputAttributes: {
                                accept: "image/*",
                              },
                              showCancelButton: true,
                            }).then((result) => {
                              if (result.value) {
                                handleUploadImage(
                                  item,
                                  result.value
                                );
                              }
                            });
                          }}
                          disabled={uploading || saving || loading || editingId !== null} // 🔹 Deshabilitar si hay otra operación activa
                          className={`bg-orange-500 text-white px-3 py-1 rounded ${
                            (uploading || saving || loading || editingId !== null) ? "bg-orange-300 cursor-not-allowed" : "hover:bg-orange-600"
                          }`}
                        >
                          {uploading ? "Subiendo..." : "Subir"} {/* 🔹 Texto dinámico */}
                        </button>
                      )}

                    </td>

                    {/* ACCIONES */}
                    <td className="border px-3 py-2 text-center whitespace-nowrap"> {/* 🔹 whitespace-nowrap para botones */}

                      {editingId === item.id ? (
                        <div className="flex gap-2 justify-center">

                          <button
                            onClick={() =>
                              handleSaveEdit(item)
                            }
                            disabled={saving} // 🔹 Deshabilitar mientras guarda
                            className={`bg-blue-600 text-white px-3 py-1 rounded ${
                              saving ? "bg-blue-400 cursor-not-allowed" : "hover:bg-blue-700"
                            }`}
                          >
                            {saving ? "Guardando..." : "Guardar"} {/* 🔹 Texto dinámico */}
                          </button>

                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditedData({});
                              setSaving(false); // 🔹 Asegurar que 'saving' se desactive al cancelar
                            }}
                            disabled={saving} // 🔹 Deshabilitar mientras guarda
                            className={`bg-gray-500 text-white px-3 py-1 rounded ${
                              saving ? "bg-gray-400 cursor-not-allowed" : "hover:bg-gray-600"
                            }`}
                          >
                            Cancelar
                          </button>

                        </div>
                      ) : (
                        <div className="flex gap-2 justify-center">

                          <button
                            onClick={() => {
                              if (
                                userId !== item.userId
                              ) {
                                return Swal.fire(
                                  "No permitido",
                                  "Solo el creador puede editar",
                                  "error"
                                );
                              }
                              if (loading || saving || uploading || editingId !== null) return; // 🔹 Evitar si otra operación está activa

                              setEditingId(item.id);

                              setEditedData({
                                nombre: item.nombre || "",
                                valor: item.valor || "",
                                ot: item.ot || "",
                                // Formatea la fecha para el input type="date"
                                fecha: item.fecha ? item.fecha.slice(0, 10) : "",
                              });
                            }}
                            disabled={loading || saving || uploading || editingId !== null} // 🔹 Deshabilitar si otra operación está activa
                            className={`text-blue-600 hover:underline ${
                              (loading || saving || uploading || editingId !== null) ? "text-blue-300 cursor-not-allowed" : ""
                            }`}
                          >
                            Editar
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(item)
                            }
                            disabled={loading || saving || uploading || editingId !== null} // 🔹 Deshabilitar si otra operación está activa
                            className={`text-red-600 hover:underline ${
                              (loading || saving || uploading || editingId !== null) ? "text-red-300 cursor-not-allowed" : ""
                            }`}
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
          )}
        </div>
      )}

      {/* MODAL TODAS LAS IMAGENES */}
      {modalImagesVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-md max-w-7xl w-full p-4 relative">

            <button
              onClick={() =>
                setModalImagesVisible(false)
              }
              className="absolute top-2 right-2"
            >
              ✖
            </button>

            <div className="flex gap-4 overflow-x-auto py-4">

              {clinicas
                .filter(
                  (c) =>
                    Array.isArray(c.images) &&
                    c.images.length > 0
                )
                .map((c) =>
                  c.images.map((img) => (
                    <div
                      key={img.id}
                      className="border rounded-md p-2 w-[220px] flex-shrink-0"
                    >

                      <img
                        src={img.url}
                        alt={c.nombre}
                        className="w-full h-[150px] object-contain mb-2"
                      />

                      <p className="text-xs font-bold">
                        {
                          c.ubicacion?.zona
                            ?.nombreMaximo
                        }
                      </p>

                      <p className="text-xs">
                        {c.ubicacion?.name}
                      </p>

                      <p className="text-xs">
                        {c.nombre}
                      </p>

                      <p className="text-xs">
                        {c.valor}
                      </p>

                      <p className="text-xs">
                        OT: {c.ot || "-"}
                      </p>

                    </div>
                  ))
                )}
              {/* 🔹 Mensaje si no hay imágenes en el modal de todas las imágenes */}
              {clinicas.filter(c => Array.isArray(c.images) && c.images.length > 0).length === 0 && (
                <p className="text-center w-full">No hay imágenes disponibles para mostrar.</p>
              )}
            </div>

          </div>

        </div>
      )}

      {/* MODAL IMAGEN */}
      {modalImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">

          <div className="bg-white p-4 rounded-md max-w-4xl w-full relative">

            <button
              onClick={() => setModalImage(null)}
              className="absolute top-2 right-2"
            >
              ✖
            </button>

            <img
              src={modalImage}
              alt="Imagen clínica"
              className="w-full max-h-[80vh] object-contain mt-6"
            />

          </div>

        </div>
      )}

    </div>
  );
};

export default Clinica;