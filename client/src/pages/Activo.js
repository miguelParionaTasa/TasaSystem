import React, { useState, useEffect,useRef } from "react";
import axios from "../axios";
import Swal from "sweetalert2";

const Activo = () => {
  // 🔹 Integrar showOperadorCreations en el objeto filter
  const [filter, setFilter] = useState({ zona: "", ubicacion: "", equipo: "", nombre: "", valor: "", showOperadorCreations: false });
  const [zonas, setZonas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [activos, setActivos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false); // Usado para el filtro principal
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
  // 🔹 NUEVOS ESTADOS para controlar la duplicidad
  const [isSavingNewActivo, setIsSavingNewActivo] = useState(false); 
  const [isEditingActivo, setIsEditingActivo] = useState(false); 
  const [isDeletingActivo, setIsDeletingActivo] = useState(false); 


  const userId = parseInt(localStorage.getItem("userId"));
  const canAdmin = ["SUPER_ADMIN", "ADMIN_PLANTA"].includes(localStorage.getItem("userRole"));

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
    const match = zonaText.match(/^\d+/);
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
    const { name, value, type, checked } = e.target;
    setFilter((prev) => {
      if (name === "zona") return { zona: value, ubicacion: "", equipo: "", nombre: "", valor: "", showOperadorCreations: false };
      if (name === "ubicacion") return { ...prev, ubicacion: value, equipo: "", nombre: "", valor: "" };
      if (name === "showOperadorCreations") return { ...prev, [name]: checked };
      return { ...prev, [name]: value };
    });
  };

  // === Buscar Activos ===
  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (loading) return; // 🔹 Evitar doble clic si ya está cargando
    setLoading(true); // 🔹 Activar estado de carga
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
      
      const datosConBandera = (response.data || []).map(activo => ({
        ...activo,
        debeResaltarse: activo.debeResaltarse !== undefined 
          ? activo.debeResaltarse 
          : false
      }));

      setActivos(datosConBandera);
    } catch (error) {
      console.error(error);
      setActivos([]);
    } finally {
      setLoading(false); // 🔹 Desactivar estado de carga
    }
  };

  // === Guardar nuevo activo ===
  const handleSaveNew = async () => {
    if (!newActivo.nombre?.trim()) {
      Swal.fire("Error", "Falta ingresar el nombre del activo", "error");
      return;
    }
    if (isSavingNewActivo) return; // 🔹 Evitar doble clic si ya está guardando

    setIsSavingNewActivo(true); // 🔹 Activar estado de guardado
    const formData = new FormData();

    Object.entries(newActivo).forEach(([k, v]) => {
      if (!v) return;
      if (k === "image") return;
      if (k === "preview") return;
      formData.append(k, v);
    });

    if (newActivo.image) {
      formData.append("image", newActivo.image);
    }

    formData.append("userId", userId);
    if (filter.equipo) formData.append("equipoId", filter.equipo);

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}activos`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      Swal.fire("Éxito", "Activo registrado correctamente", "success");
      setModalAddVisible(false);
      handleSubmit();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudo registrar el activo", "error");
    } finally {
      setIsSavingNewActivo(false); // 🔹 Desactivar estado de guardado
    }
  };

  const zonaId = getZonaIdFromText(filter.zona);
  // === Subir imagen ===
  const handleUploadImage = async (activo, file) => {
    if (!file) return;
    if (isUploading) return; // 🔹 Evitar doble clic si ya está subiendo

    setIsUploading(true); // 🔹 Activar estado de subida
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}activos/${activo.id}/upload-image`,
        formData,
        {
          headers: {
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
    } finally {
      setIsUploading(false); // 🔹 Desactivar estado de subida
    }
  };

  const handleEditActivo = async (activo) => {
    if (isEditingActivo || isUploading || isDeletingActivo || loading) return; // 🔹 Evitar doble clic si otra acción crítica está activa
    setIsEditingActivo(true); // 🔹 Activar estado de edición aquí

    const zonasOptions = zonas
      .map(
        (z) =>
          `<option value="${z}" ${activo.zona === z ? "selected" : ""}>${z}</option>`
      )
      .join("");

    const { value: formValues } = await Swal.fire({
      title: `Editar activo ${activo.nombre}`,
      html: `
        <div class="flex flex-col gap-4 text-left px-2" style="max-height: 60vh; overflow-y:auto;">
          
          <div class="flex flex-col gap-1">
            <label for="nombre" class="text-xs font-semibold text-gray-600">N° Activo</label>
            <input id="nombre" class="w-full border rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Nombre" value="${activo.nombre || ""}">
          </div>

          <div class="flex flex-col gap-1">
            <label for="valor" class="text-xs font-semibold text-gray-600">Placa</label>
            <input id="valor" class="w-full border rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Placa" value="${activo.valor || ""}">
          </div>

          <div class="flex flex-col gap-1">
            <label for="valor2" class="text-xs font-semibold text-gray-600">Descripción</label>
            <input id="valor2" class="w-full border rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Descripción" value="${activo.valor2 || ""}">
          </div>

          <div class="flex flex-col gap-1">
            <label for="marca" class="text-xs font-semibold text-gray-600">Marca</label>
            <input id="marca" class="w-full border rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Marca" value="${activo.marca || ""}">
          </div>

          <div class="flex flex-col gap-1">
            <label for="modelo" class="text-xs font-semibold text-gray-600">Modelo</label>
            <input id="modelo" class="w-full border rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Modelo" value="${activo.modelo || ""}">
          </div>

          <div class="flex flex-col gap-1">
            <label for="serie" class="text-xs font-semibold text-gray-600">Número de Serie</label>
            <input id="serie" class="w-full border rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Serie" value="${activo.serie || ""}">
          </div>

          <div class="flex flex-col gap-1">
            <label for="zona" class="text-xs font-semibold text-gray-600">Zona Requerida</label>
            <select id="zona" class="w-full border rounded p-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="">Seleccionar zona</option>
              ${zonasOptions}
            </select>
          </div>

          <div class="flex flex-col gap-1">
            <label for="ubicacion" class="text-xs font-semibold text-gray-600">Ubicación Específica</label>
            <input id="ubicacion" class="w-full border rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Ubicación" value="${activo.ubicacion || ""}">
          </div>

        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      showCloseButton: true,
      closeButtonHtml: "✕",
      allowEscapeKey: true,
      confirmButtonText: isEditingActivo ? "Guardando..." : "Guardar cambios", // 🔹 Texto dinámico
      preConfirm: () => {
        const zona = document.getElementById("zona").value;
        if (!zona) {
          Swal.showValidationMessage("Debe seleccionar una zona");
          return false;
        }

        // 🛡️ BLOQUEO DE DOBLE CLIC DENTRO DEL SWAL PARA CONFIRMACIÓN
        Swal.showLoading(); // Muestra el spinner de carga en el botón de confirmación

        return {
          nombre: document.getElementById("nombre").value,
          valor: document.getElementById("valor").value,
          valor2: document.getElementById("valor2").value,
          marca: document.getElementById("marca").value,
          modelo: document.getElementById("modelo").value,
          serie: document.getElementById("serie").value,
          zona,
          ubicacion: document.getElementById("ubicacion").value,
        };
      },
      didOpen: () => {
        // Deshabilitar el botón de confirmación si isEditingActivo ya es true
        const confirmButton = Swal.getConfirmButton();
        if (confirmButton && isEditingActivo) { // Solo si ya está activo (ej. si se abrió y se volvió a intentar)
          confirmButton.disabled = true;
        }
      },
      didClose: () => {
        // Asegúrate de desactivar el estado de edición si el Swal se cierra (cancelar, escape, etc.)
        setIsEditingActivo(false);
        Swal.hideLoading(); // Oculta cualquier spinner que se haya mostrado
      }
    });

    if (!formValues) {
      // Si el usuario cancela o cierra el Swal, formValues será null/undefined.
      // El didClose ya maneja setIsEditingActivo(false)
      return;
    }
    
    // Si formValues existe, procede con la edición. El estado isEditingActivo ya está activo.
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}activos/${activo.id}`,
        { ...formValues, userId }
      );

      Swal.fire("Actualizado", "Activo modificado correctamente", "success");
      handleSubmit();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudo actualizar el activo", "error");
    } finally {
      // El didClose del Swal ya manejará setIsEditingActivo(false) y Swal.hideLoading()
      // No es necesario duplicar aquí, pero lo dejo por si el flujo cambia o no siempre pasa por didClose
      setIsEditingActivo(false); 
      Swal.hideLoading();
    }
  };

  const handleDeleteActivo = async (activoId, activoNombre) => {
    if (!canAdmin) {
      Swal.fire({
        icon: "error",
        title: "Permiso denegado",
        text: "Solo un administrador de planta puede eliminar activos.",
      });
      return;
    }
    if (isDeletingActivo || isUploading || isEditingActivo || loading) return; // 🔹 Evitar doble clic si otra acción crítica está activa

    setIsDeletingActivo(true); // 🔹 Activar estado de eliminación
    const result = await Swal.fire({
      title: `¿Estás seguro de eliminar el activo "${activoNombre}"?`,
      text: "¡Esta acción no se puede revertir!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: isDeletingActivo ? "Eliminando..." : "Sí, eliminar", // 🔹 Texto dinámico
      cancelButtonText: "Cancelar",
      didOpen: () => {
        const confirmButton = Swal.getConfirmButton();
        if (confirmButton && isDeletingActivo) {
          confirmButton.disabled = true;
        }
      },
      didClose: () => {
        // Asegúrate de desactivar el estado si el Swal se cierra sin confirmar
        setIsDeletingActivo(false);
        Swal.hideLoading(); // Oculta cualquier spinner que se haya mostrado
      }
    });

    if (result.isConfirmed) {
      Swal.showLoading(); // Muestra el spinner de carga en el botón de confirmación
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}activos/${activoId}`);
        Swal.fire("Eliminado", "El activo ha sido eliminado correctamente.", "success");
        handleSubmit();
      } catch (err) {
        console.error("Error al eliminar el activo:", err);
        Swal.fire("Error", "No se pudo eliminar el activo.", "error");
      } finally {
        // El didClose del Swal ya manejará setIsDeletingActivo(false) y Swal.hideLoading()
      }
    } else {
      // Si no se confirma, didClose ya desactivó el estado y ocultó el spinner.
    }
  };

  
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setModalAddVisible(false);
      }
    };

    if (modalAddVisible) {
      window.addEventListener("keydown", handleEsc);
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [modalAddVisible]);

  const galleryInputRef = useRef();
  const cameraInputRef = useRef();
  const galleryInputNewRef = useRef();
  const cameraInputNewRef = useRef();
  const handleSelectNewImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setNewActivo((prev) => ({
        ...prev,
        image: file,
        preview: event.target.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  // Lógica para filtrar activos mostrados en la tabla
  const displayedActivos = filter.showOperadorCreations
    ? activos.filter(a => a.debeResaltarse)
    : activos;

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
            disabled={loading} // 🔹 Deshabilitar mientras se filtra
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
            disabled={!filter.zona || loading} // 🔹 Deshabilitar mientras se filtra
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
            disabled={!filter.ubicacion || loading} // 🔹 Deshabilitar mientras se filtra
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
            disabled={loading} // 🔹 Deshabilitar mientras se filtra
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
            disabled={loading} // 🔹 Deshabilitar mientras se filtra
          />
        </div>

        <div className="flex items-center mt-2 sm:mt-0">
          <input
            type="checkbox"
            id="showOperadorCreations"
            name="showOperadorCreations"
            checked={filter.showOperadorCreations}
            onChange={handleFilterChange}
            className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            disabled={loading} // 🔹 Deshabilitar mientras se filtra
          />
          <label htmlFor="showOperadorCreations" className="ml-2 block text-sm font-semibold text-gray-700">
            Operador
          </label>
        </div>

        <button type="submit" disabled={loading} // 🔹 Deshabilitar botón Filtrar
          className={`bg-blue-600 text-white px-6 py-2 rounded-md transition ${
            loading ? "bg-blue-400 cursor-not-allowed" : "hover:bg-blue-700"
          }`}
        >
          {loading ? "Filtrando..." : "Filtrar"} {/* 🔹 Texto dinámico */}
        </button>
      </form>

      {/* === BOTÓN NUEVO === */}
      <div className="flex mb-4">
        <button
          onClick={() => setModalAddVisible(true)}
          className={`bg-green-600 text-white px-4 py-2 rounded ${
            loading || isUploading || isEditingActivo || isDeletingActivo ? "bg-green-400 cursor-not-allowed" : "hover:bg-green-700"
          }`}
          disabled={loading || isUploading || isEditingActivo || isDeletingActivo} // 🔹 Deshabilitar si otra acción crítica está activa
        >
          ➕ Nuevo Activo
        </button>
      </div>

           {/* === TABLA === */}
      {loading ? (
        <p className="text-center">Cargando...</p>
      ) : (
        <div className="overflow-x-auto"> {/* Este es el contenedor principal de desplazamiento */}
          {displayedActivos.length > 0 ? (
            // ✅ CORRECCIÓN: Asegúrate de que el div contenedor esté presente para la tabla
            // y que sea el único elemento retornado por esta rama del ternario.
            // No había un problema en la estructura del ternario, sino en las clases
            // y el doble anidamiento de overflow-x-auto que eliminamos antes.
            // Esta estructura ya es correcta, el error venía de la combinación de min-w/max-w previos
            // que ahora están mejor definidos con table-fixed.
            <table className="w-full border text-sm text-left table-fixed"> {/* 🔹 table-fixed y w-full */}
              <thead>
                <tr className="bg-gray-300 border border-gray-400">
                  {/* 🔹 Anchos fijos para cada columna */}
                  <th className="px-2 py-1 w-[100px]">N° Activo</th>
                  <th className="px-2 py-1 w-[80px]">Placa</th>
                  <th className="px-2 py-1 w-[200px]">Descripción</th>
                  <th className="px-2 py-1 w-[100px]">Marca</th>
                  <th className="px-2 py-1 w-[100px]">Modelo</th>
                  <th className="px-2 py-1 w-[100px]">Serie</th>
                  <th className="px-2 py-1 w-[120px]">Zona</th>
                  <th className="px-2 py-1 w-[150px]">Ubicación</th>
                  <th className="px-2 py-1 w-[200px]">Acción</th> {/* Suficientemente ancho para los botones */}
                </tr>
              </thead>

                <tbody>
                  {displayedActivos.map((a) => (
                    <tr 
                      key={a.id} 
                      className="border border-gray-400 transition hover:bg-gray-100"
                      style={a.debeResaltarse ? { backgroundColor: "#d1fae5" } : {}}
                    >
                      <td className="px-2 break-words whitespace-normal font-medium">{a.nombre}</td>
                      <td className="px-2 break-words whitespace-normal">{a.valor || "-"}</td>
                      <td className="px-2 break-words whitespace-normal">{a.valor2 || "-"}</td>
                      <td className="px-2 break-words whitespace-normal">{a.marca || "-"}</td>
                      <td className="px-2 break-words whitespace-normal">{a.modelo || "-"}</td>
                      <td className="px-2 break-words whitespace-normal">{a.serie || "-"}</td>
                      <td className="px-2 break-words whitespace-normal">
                        {a.zona || a.equipo?.ubicacion?.zona?.nombreMaximo || "-"}
                      </td>
                      <td className="px-2 break-words whitespace-normal">
                        {a.ubicacion || a.equipo?.ubicacion?.name || "-"}
                      </td>
                      {/* 🔹 Usar whitespace-nowrap para que los botones no se rompan */}
                      <td className="px-2 flex justify-center gap-2 py-1 whitespace-nowrap">
                        {a.images?.[0]?.url ? (
                          <button
                            className={`bg-blue-600 text-white px-3 py-1 rounded ${
                              isUploading || isEditingActivo || isDeletingActivo || loading ? "bg-blue-400 cursor-not-allowed" : "hover:bg-blue-700"
                            }`}
                            onClick={() => setModalImage(a.images[0].url)}
                            disabled={isUploading || isEditingActivo || isDeletingActivo || loading}
                          >
                            Ver
                          </button>
                        ) : (
                          <>
                            <button
                              disabled={isUploading || isEditingActivo || isDeletingActivo || loading}
                              className={`px-3 py-1 rounded text-white ${
                                isUploading || isEditingActivo || isDeletingActivo || loading ? "bg-gray-400 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700"
                              }`}
                              onClick={() => {
                                if (isUploading || isEditingActivo || isDeletingActivo || loading) return;

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
                              }}
                            >
                              {isUploading ? "Subiendo..." : "Subir"}
                            </button>

                            {/* INPUT GALERÍA OCULTO */}
                            <input
                              type="file"
                              accept="image/*"
                              ref={galleryInputRef}
                              style={{ display: "none" }}
                              onChange={(e) => {
                                if (!e.target.files.length) return;
                                setIsUploading(true);
                                handleUploadImage(a, e.target.files[0]).finally(() =>
                                  setIsUploading(false)
                                );
                              }}
                              disabled={isUploading || isEditingActivo || isDeletingActivo || loading}
                            />

                            {/* INPUT CÁMARA OCULTO */}
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              ref={cameraInputRef}
                              style={{ display: "none" }}
                              onChange={(e) => {
                                if (!e.target.files.length) return;
                                setIsUploading(true);
                                handleUploadImage(a, e.target.files[0]).finally(() =>
                                  setIsUploading(false)
                                );
                              }}
                              disabled={isUploading || isEditingActivo || isDeletingActivo || loading}
                            />
                          </>
                        )}

                        <button
                          className={`bg-green-600 text-white px-3 py-1 rounded ${
                            isEditingActivo || isUploading || isDeletingActivo || loading ? "bg-green-400 cursor-not-allowed" : "hover:bg-green-700"
                          }`}
                          onClick={() => handleEditActivo(a)}
                          disabled={isEditingActivo || isUploading || isDeletingActivo || loading}
                        >
                          Editar
                        </button>

                        {/* Botón de Eliminar */}
                        <button
                          className={`bg-red-600 text-white px-3 py-1 rounded ${
                            isDeletingActivo || isUploading || isEditingActivo || loading ? "bg-red-400 cursor-not-allowed" : "hover:bg-red-700"
                          }`}
                          onClick={() => handleDeleteActivo(a.id, a.nombre)}
                          disabled={isDeletingActivo || isUploading || isEditingActivo || loading}
                        >
                          {isDeletingActivo ? "Eliminando..." : "🗑️"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            // ❌ El div con w-full overflow-x-auto md:overflow-visible que rodeaba la tabla ha sido eliminado,
            // ya que el contenedor principal `div.overflow-x-auto` es suficiente
            // y el `table-fixed` maneja el ancho de la tabla correctamente.
          ) : (
            <p className="text-gray-600 text-center py-4">No hay valores a mostrar.</p>
          )}
        </div>
      )}

      {/* === MODAL NUEVO === */}
      {modalAddVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative 
            max-h-[90vh] overflow-y-auto">

            <button
              className="
                absolute top-3 right-3 
                text-gray-700 
                hover:text-red-600 
                bg-white 
                rounded-full 
                shadow 
                w-8 h-8 
                flex items-center justify-center 
                text-xl 
                sm:text-lg
                z-50
              "
              onClick={() => setModalAddVisible(false)}
              disabled={isSavingNewActivo}
            >
              ✕
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
                  disabled={isSavingNewActivo}
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
                disabled={isSavingNewActivo}
              >
                <option value="">Seleccionar zona</option>
                {zonas.map((z, i) => (
                  <option key={i} value={z}>
                    {z} {/* Zona es texto libre */}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Ubicación"
                value={newActivo.ubicacion || ""}
                onChange={(e) =>
                  setNewActivo({ ...newActivo, ubicacion: e.target.value })
                }
                className="p-2 border rounded focus:ring focus:ring-green-200"
                disabled={isSavingNewActivo}
              />

              {/* Botón Subir Imagen */}
              <button
                type="button"
                className={`bg-orange-600 text-white py-2 rounded ${
                  isSavingNewActivo ? "bg-orange-400 cursor-not-allowed" : "hover:bg-orange-700"
                }`}
                onClick={() => {
                  if (isSavingNewActivo) return;
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
                      cameraInputNewRef.current.click();
                    } else if (result.isDenied) {
                      galleryInputNewRef.current.click();
                    }
                  });
                }}
                disabled={isSavingNewActivo}
              >
                Subir Imagen
              </button>

              {/* INPUT GALERÍA OCULTO */}
              <input
                type="file"
                accept="image/*"
                ref={galleryInputNewRef}
                style={{ display: "none" }}
                onChange={handleSelectNewImage}
                disabled={isSavingNewActivo}
              />

              {/* INPUT CÁMARA OCULTO */}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={cameraInputNewRef}
                style={{ display: "none" }}
                onChange={handleSelectNewImage}
                disabled={isSavingNewActivo}
              />

              {/* VISTA PREVIA */}
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
                className={`bg-green-600 text-white py-2 rounded ${
                  isSavingNewActivo ? "bg-green-400 cursor-not-allowed" : "hover:bg-green-700"
                }`}
                disabled={isSavingNewActivo}
              >
                {isSavingNewActivo ? "Guardando..." : "Guardar"}
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
