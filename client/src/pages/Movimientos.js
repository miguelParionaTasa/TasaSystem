import React, { useState, useEffect, useRef } from "react";
import { createMovement, createOT, createOTConsumible } from "../services/api"; // Asegúrate de tener estas funciones en tu API
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import Swal from "sweetalert2";
import { FaTrash,FaPlus,FaUndo   } from "react-icons/fa";
import BuscadorConsumible from "../components/BuscadorConsumible";

const Movimientos = () => {
  // Estados para las zonas
const [mostrarTabla, setMostrarTabla] = useState(true);

const [consumiblesOT, setConsumiblesOT] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [selectedOt, setSelectedOt] = useState(null);
const [searchResults, setSearchResults] = useState([]);
const [isSearching, setIsSearching] = useState(false);
  const [zonaId, setZonaId] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); // Estado para almacenar el término de búsqueda
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Estado para controlar la visibilidad del desplegable
  const [openDropdownIndex, setOpenDropdownIndex] = useState(null);
const [isOtValid, setIsOtValid] = useState(false);


  // Cargar zonas desde la API
  useEffect(() => {
    const fetchZonas = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}varios/zonas`
        );

        setZonas(response.data); // Guardamos las zonas en el estado
      } catch (error) {
        toast.error("Error al cargar las zonas.");
        console.error("Error al cargar zonas:", error);
      }
    };

    fetchZonas();
  }, []);



  // Filtrar las zonas basadas en el término de búsqueda
  const filteredZonas = zonas.filter((zona) =>
    zona.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [ots, setOts] = useState([]); // Estado para almacenar las OTs
  const [filteredOts, setFilteredOts] = useState([]); // OTs filtradas
  const [searchOt, setSearchOt] = useState(""); // Término de búsqueda para OTs
  const [openOtDropdown, setOpenOtDropdown] = useState(false); // Controlar la visibilidad del desplegable
  const [ubicacionId, setUbicacionId] = useState("");
  const otInputRef = useRef(null);
  // Función para manejar el cambio en el campo de búsqueda de OTs
  const handleOtChange = (e) => {
    setSearchOt(e.target.value);
    setOpenOtDropdown(true); // Abrir el desplegable al escribir
  setIsOtValid(false); // ❌ Aún no ha seleccionado una OT válida
};

  // Filtrar OTs en función del término de búsqueda
  useEffect(() => {
    const filtered = ots.filter((ot) =>
      ot.name.toLowerCase().includes(searchOt.toLowerCase())
    );
    setFilteredOts(filtered);
  }, [searchOt, ots]);

  // Función para seleccionar una OT
  const selectOt = async (ot) => {
  try {
    setOtName(ot.name); // Establecer el nombre de la OT seleccionada
    setSearchOt(ot.name); // Establecer el valor del campo de búsqueda
    setSelectedOt(ot);
    setOpenOtDropdown(false); // Cerrar el desplegable
    setOtId(ot.OTmaximo); // Almacenar el ID de la OT seleccionada
    setIsOtValid(true); 

    console.log("🔍 OT seleccionada:", ot);

    // Consultar los consumibles de la OT seleccionada
    const response = await axios.get(`${process.env.REACT_APP_API_URL}otc/by-otmaximo/${ot.OTmaximo}`);

    
    console.log("📦 Consumibles recibidos para OT", ot.id, ":", response.data);
    
    setConsumiblesOT(response.data);
  } catch (error) {
    console.error("❌ Error al obtener consumibles:", error);
    Swal.fire("Error", "No se pudieron cargar los consumibles", "error");
  }
};

  
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setOpenOtDropdown(false); // Cerrar el desplegable
      setSearchOt(""); // Limpiar el campo de búsqueda
    }
  };
  // Manejar clics fuera del campo de búsqueda
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdown = document.getElementById("otDropdown"); // ID del desplegable
      const input = document.getElementById("otName"); // ID del campo de búsqueda
      if (
        dropdown &&
        !dropdown.contains(event.target) &&
        input &&
        !input.contains(event.target)
      ) {
        setOpenOtDropdown(false); // Cerrar el desplegable
        setSearchOt(""); // Limpiar el campo de búsqueda
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Estados para la OT
  const [otName, setOtName] = useState("");
  const [otValue, setOtValue] = useState("");
  const [equipoId, setEquipoId] = useState("");
  const [descripcionEquipo, setDescripcionEquipo] = useState("");
  const [ubicacionSinId, setUbicacionSinId] = useState("");
  const [ubicaciones, setUbicaciones] = useState([]);

  useEffect(() => {
    const fetchUbicacionesPorZona = async () => {
      if (!zonaId) return; // Si no hay zonaId, no hacer la solicitud

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}varios/ubicaciones/por-zona?zonaId=${zonaId}`
        );
        setUbicaciones(response.data); // Guardamos las ubicaciones en el estado
      } catch (error) {
        toast.error("Error al cargar las ubicaciones de esta zona.");
        console.error("Error al cargar ubicaciones por zona:", error);
      }
    };

    fetchUbicacionesPorZona();
  }, [zonaId]);

  // Estados para los consumibles
  const [consumibles, setConsumibles] = useState([]); // Todos los consumibles disponibles
  const [filteredConsumibles, setFilteredConsumibles] = useState([]); // Consumibles filtrados
  const [searchConsumible, setSearchConsumible] = useState(""); // Término de búsqueda
  const [otId, setOtId] = useState(null);
  const [selectedConsumibles, setSelectedConsumibles] = useState([
    { name: "", unidadMedida: "", cantidad: 1, isEditing: false }, // Inicializa con una fila
  ]);
  const enableEditConsumible = (index) => {
    const newConsumibles = [...selectedConsumibles];
    newConsumibles[index].isEditing = true; // Cambia el estado de la fila a editable
    setSelectedConsumibles(newConsumibles);
  };
  const resetConsumible = (index) => {
    const newConsumibles = [...selectedConsumibles];
    newConsumibles[index].isEditing = false; // Cambia el estado de la fila a no editable
    setSelectedConsumibles(newConsumibles);
  };

const handleSearch = async () => {
  if (!searchTerm.trim()) {
    toast.info("Escribe algo para buscar.");
    return;
  }

  try {
    setIsSearching(true);
    const response = await axios.get(
      `${process.env.REACT_APP_API_URL}consumibles/search?q=${encodeURIComponent(searchTerm)}`
    );
    setSearchResults(response.data.data); // Recuerda que tu endpoint devuelve { data, total, ... }
  } catch (error) {
    toast.error("Error al buscar consumibles.");
    console.error("Error en búsqueda:", error);
  } finally {
    setIsSearching(false);
  }
};


  // Cargar OTs desde la API
  useEffect(() => {
    const fetchOTs = async () => {
      console.log("Fetching OTs...");

      // Imprimir los valores de zonaId y ubicacionId
      console.log("zonaId:", zonaId);
      console.log("ubicacionId:", ubicacionId);

      // Construir los parámetros de consulta
      const params = new URLSearchParams({ temp: "CHIV2-25" }); // Siempre incluir temp

      // Agregar zonaId si está definido
      if (zonaId) {
        params.append("zonaId", zonaId);
      }

      // Agregar ubicacionId si está definido
      if (ubicacionId) {
        params.append("ubicacionId", ubicacionId);
      }

      const url = `${
        process.env.REACT_APP_API_URL
      }ott/ots?${params.toString()}`;

      // Imprimir la URL completa que se está construyendo
      console.log("Request URL:", url); // Esto debería mostrar la URL construida

      try {
        const response = await axios.get(url); // Realizar la solicitud GET

        // Imprimir la respuesta del backend
        console.log("Response data:", response.data);

        setOts(response.data); // Guardamos las OTs en el estado
        setFilteredOts(response.data); // Inicialmente, mostramos todas las OTs
      } catch (error) {
        toast.error("Error al cargar las OTs.");
        console.error("Error al cargar OTs:", error);
      }
    };

    fetchOTs();
  }, [zonaId, ubicacionId]); // Dependencias del useEffect
  // Filtrar consumibles en función del término de búsqueda
  // Filtrar consumibles en función del término de búsqueda
useEffect(() => {
  const filtered = consumibles.filter((consumible) =>
    consumible.name.toLowerCase().includes(searchConsumible.toLowerCase())
  );
  setFilteredConsumibles(filtered);
}, [searchConsumible, consumibles]);

// Función para agregar un consumible seleccionado
const addConsumible = (consumible) => {
  setSelectedConsumibles([
    ...selectedConsumibles,
    { ...consumible, cantidad: 1 },
  ]); // Agregar el consumible seleccionado con cantidad inicial de 1
  setSearchConsumible(""); // Limpiar el campo de búsqueda
};

// Filtrar consumibles disponibles para el desplegable
const availableConsumibles = filteredConsumibles.filter(
  (c) => !selectedConsumibles.some((selected) => selected.id === c.id)
);

  // Función para manejar el cambio en la cantidad de un consumible
  const handleConsumibleChange = (index, value) => {
    const newConsumibles = [...selectedConsumibles];
    newConsumibles[index].cantidad = value; // Actualizar la cantidad
    setSelectedConsumibles(newConsumibles);
  };

  // Función para eliminar un consumible
  const removeConsumible = (index) => {
    const newConsumibles = selectedConsumibles.filter((_, i) => i !== index);
    setSelectedConsumibles(newConsumibles);
  };
  const [equipos, setEquipos] = useState([]);
  const [searchTermEquipo, setSearchTermEquipo] = useState("");
  const [isDropdownOpenEquipo, setIsDropdownOpenEquipo] = useState(false);
  useEffect(() => {
    const fetchEquipos = async () => {
      if (!zonaId) return; // Si no hay zonaId, no hacer la solicitud

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}equipos/por-zona/${zonaId}`, // Nueva ruta para obtener equipos por zona
          {
            params: {
              ubicacionId: ubicacionId || undefined, // Pasar ubicacionId como parámetro de consulta
            },
          }
        );
        setEquipos(response.data); // Guardamos los equipos en el estado
      } catch (error) {
        toast.error("Error al cargar los equipos de esta zona.");
        console.error("Error al cargar equipos:", error);
      }
    };

    fetchEquipos();
  }, [zonaId, ubicacionId]); // Dependencias actualizadas
  const filteredEquipos = equipos.filter((equipo) =>
    equipo.name.toLowerCase().includes(searchTermEquipo.toLowerCase())
  );

  const [isSubmittingOT, setIsSubmittingOT] = useState(false);
  const [isSubmittingConsumible, setIsSubmittingConsumible] = useState(false);
useEffect(() => {
  if (otName.trim() !== "") {
    setMostrarTabla(true);
  }
}, [otName]);
  // Función para manejar el envío de la OT
const handleSubmitOT = async (e) => {
  e.preventDefault();
  if (isSubmittingOT) return;
  setIsSubmittingOT(true);

  // Validación: solo una opción entre OT seleccionada y OT manual
  if (!isOtValid && !(otName.trim() === "" && otValue.trim() !== "")) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Debes seleccionar una OT válida de la lista o ingresar un valor manual en el campo 'Valor OT'.",
    });
    setIsSubmittingOT(false);
    return;
  }

  if (isOtValid && otValue.trim() !== "") {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Por favor, usa solo una opción: selecciona una OT de la lista o ingresa un valor manual, no ambos.",
    });
    setIsSubmittingOT(false);
    return;
  }

  // Validación de consumibles
  const consumiblesValidos = selectedConsumibles.filter((c, index) => {
  if (c.isEditing) {
    // Validación de campos manuales
    if (!c.name || !c.unidadMedida) {
      Swal.fire({
        icon: "error",
        title: `Fila ${index + 1} incompleta`,
        text: "Debes escribir un nombre y una unidad de medida para el consumible.",
      });
      return false;
    }
    return true;
  } else {
    // Validación para selección desde la base de datos
    
  if (!c.id) {
  Swal.fire({
    icon: "error",
    title: `Consumible no seleccionado correctamente en fila ${index + 1}`,
    text: `Debes seleccionar un consumible válido desde la lista desplegable.`,
  });
  return false;
}

    if (!c.cantidad || c.cantidad <= 0) {
      Swal.fire({
        icon: "error",
        title: `Cantidad inválida en fila ${index + 1}`,
        text: "Debes ingresar una cantidad mayor a 0.",
      });
      return false;
    }
    return true;
  }
});

if (consumiblesValidos.length !== selectedConsumibles.length) {
  setIsSubmittingOT(false);
  return;
}


  // Validaciones adicionales
  const errorMessages = [];
  if (!zonaId) errorMessages.push("Zona");
  if (!otValue && !otId) errorMessages.push("Nombre de OT o ID de OT");

  if (errorMessages.length > 0) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: `Por favor, complete el campo: ${errorMessages.join(", ")}.`,
    });
    setIsSubmittingOT(false);
    return;
  }

 try {
  // 👇 Detecta ubicación desde la OT si no se eligió manualmente
let finalUbicacionId = ubicacionId
  ? ubicacionId
  : selectedOt?.ubicacionId;

if (!finalUbicacionId && otId) {
  const otSeleccionada = ots.find((ot) => ot.id === parseInt(otId, 10));
  console.log("OT seleccionada:", otSeleccionada);
  console.log("otId recibido en handleSubmit:", otId);
console.log("ots disponibles:", ots);

console.log("DEBUG OT seleccionada:", JSON.stringify(otSeleccionada, null, 2));

  if (otSeleccionada?.OTbasico?.ubicacionId) {
    finalUbicacionId = otSeleccionada.OTbasico.ubicacionId;
    console.log("Usando ubicacionId desde OTbasico:", finalUbicacionId);
  } else {
    console.warn("⚠️ No se encontró ubicacionId en OTbasico");
  }
}

const ubicacionIdNumerica = finalUbicacionId ? parseInt(finalUbicacionId, 10) : null;

// ✅ Usa el valor corregido en otData
const otData = {
  ottId: otId,
  OT: String(otValue),
  equipoId: equipoId ? parseInt(equipoId, 10) : null,
  descripcionEquipo,
  zonaId: parseInt(zonaId, 10),
  ubicacionId: ubicacionIdNumerica,
  ubicacionSinId,
  userId: localStorage.getItem("userId"),
};
console.log("Cuerpo de la solicitud de OT:", otData);

    const token = localStorage.getItem("token");
    const createdOT = await createOT(otData, token);
    console.log("OT creada:", createdOT);

    for (const consumible of consumiblesValidos) {
      const otConsumibleData = {
        consumibleId: consumible.id,
        nombreConsumible: consumible.name,
        unidadMedida: consumible.unidadMedida,
        cantidad: consumible.cantidad,
        otId: createdOT.id,
        userId: localStorage.getItem("userId"),
      };

      await createOTConsumible(otConsumibleData, token);
    }

    Swal.fire({
      icon: "success",
      title: "Éxito",
      html: `OT y consumibles registrados correctamente.`  });

    // Limpiar campos
    setOtName("");
    setOtValue("");
    setEquipoId("");
    setDescripcionEquipo("");
    setZonaId("");
    setUbicacionId("");
    setUbicacionSinId("");
    setSelectedConsumibles([]);
    setSearchOt("");
    setIsOtValid(false);
    // Mostrar tabla de consumibles
setMostrarTabla(false);

  } catch (err) {
    console.error("Error al registrar OT o consumibles:", err);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Error al registrar la OT o los consumibles.",
    });
  } finally {
    setIsSubmittingOT(false);
  }
};




  const [newConsumible, setNewConsumible] = useState({
    name: "",
    unidadMedida: "",
    cantidad: 1,
  });
  const [isAddingNewConsumible, setIsAddingNewConsumible] = useState(false); // Estado para controlar la visibilidad del formulario de nuevo consumible

  // Función para manejar el cambio en el nuevo consumible
  const handleNewConsumibleChange = (e) => {
    const { name, value } = e.target;
    setNewConsumible((prev) => ({ ...prev, [name]: value }));
  };

  // Función para agregar el nuevo consumible a la lista
  const addNewConsumible = () => {
    if (!newConsumible.name || !newConsumible.unidadMedida || newConsumible.cantidad <= 0) {
      toast.error("Por favor, complete todos los campos del nuevo consumible.");
      return;
    }

    setSelectedConsumibles((prev) => [
      ...prev,
      { ...newConsumible, id: Date.now() }, // Usar un ID único temporal
    ]);
    setNewConsumible({ name: "", unidadMedida: "", cantidad: 1 }); // Reiniciar el formulario
    setIsAddingNewConsumible(false); // Cerrar el formulario
  };
  const handleNameChange = (index, value) => {
    const newConsumibles = [...selectedConsumibles];
    newConsumibles[index].name = value; // Actualiza el nombre del consumible
    setSelectedConsumibles(newConsumibles);
    setOpenDropdownIndex(index); // Abre el desplegable para este consumible
  };
  const [isReset, setIsReset] = useState(false);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg mt-10 mb-10">
      <h2 className="text-2xl font-semibold text-center text-gray-700 mb-8">
        Registrar nuevo pedido
      </h2>
      <form onSubmit={handleSubmitOT} className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="zonaId"
              className="block text-md font-medium text-gray-700"
            >
              Zona
            </label>
            <select
              id="zonaId"
              value={zonaId}
              onChange={(e) => setZonaId(e.target.value)} // Actualiza el estado con el ID de la zona seleccionada
              className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="" disabled>
                Seleccionar zona
              </option>
              {zonas.map((zona) => (
                <option key={zona.id} value={zona.id}>
                  {zona.name} {/* Muestra el nombre de la zona */}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="ubicacionId"
              className="block text-md font-medium text-gray-700"
            >
              Ubicación
            </label>
            <select
              id="ubicacionId"
              value={ubicacionId}
              onChange={(e) => setUbicacionId(e.target.value)}
              className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              style={{
                maxHeight: "300px",
                overflowY: "auto",
              }} // Controla la altura máxima del desplegable
            >
              <option value="" disabled>
                Seleccionar ubicación
              </option>
              <option value="">Sin ubicación</option>
              {ubicaciones
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((ubicacion) => (
                  <option key={ubicacion.id} value={ubicacion.id}>
                    {ubicacion.name} - {ubicacion.zona.name}{" "}
                    {/* Muestra el nombre de la ubicación y la zona */}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="ubicacionSinId"
              className="block text-md font-medium text-gray-700"
            >
              Sin Ubicación
            </label>
            <input
              id="ubicacionSinId"
              type="text"
              value={ubicacionSinId}
              onChange={(e) => setUbicacionSinId(e.target.value)}
              className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-6 gap-4">
          <div className="col-span-2">
            <label
              htmlFor="otName"
              className="block text-md font-medium text-gray-700"
            >
              Nombre OT
            </label>
            <input
              id="otName"
              type="text"
              value={searchOt} // Usar el término de búsqueda
              onChange={handleOtChange} // Manejar el cambio en el campo de búsqueda
              className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              onFocus={() => setOpenOtDropdown(true)} // Abrir el desplegable al enfocar
            />
            {openOtDropdown && filteredOts.length > 0 && (
              <ul
                id="otDropdown" // ID del desplegable
                className="absolute left-0 w-full bg-white border border-gray-300 rounded-lg z-10"
              >
                {filteredOts.map((ot) => (
                  <li
                    key={ot.OTmaximo}
                    onClick={() => selectOt(ot)} // Seleccionar la OT al hacer clic
                    className="cursor-pointer hover:bg-gray-100 p-2"
                  >
                    {ot.name} {/* Mostrar el nombre de la OT */}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="col-span-2">
            <label
              htmlFor="otValue"
              className="block text-md font-medium text-gray-700"
            >
              OT no designada
            </label>
            <input
              id="otValue"
              type="text"
              value={otValue}
              onChange={(e) => setOtValue(e.target.value)}
              className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="col-span-2">
            <label
              htmlFor="equipoId"
              className="block text-md font-medium text-gray-700"
            >
              Equipo
            </label>
            <select
              id="equipoId"
              value={equipoId}
              onChange={(e) => setEquipoId(e.target.value)} // Actualiza el estado con el ID del equipo seleccionado
              className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Sin seleccionar</option>{" "}
              {/* Opción "Sin seleccionar" con valor "NA" */}
              {equipos
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((equipo) => (
                  <option key={equipo.id} value={equipo.id}>
                    {equipo.name} {/* Muestra el nombre del equipo */}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="descripcionEquipo"
            className="block text-lg font-medium text-gray-700"
          >
            Comentarios adicionales
          </label>
          <textarea
            id="descripcionEquipo"
            value={descripcionEquipo}
            onChange={(e) => setDescripcionEquipo(e.target.value)}
            className="h-10 w-full mt-2 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            rows="2"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-200"
          disabled={isSubmittingOT}
        >
          Añadir OT
        </button>
      </form>
{mostrarTabla && consumiblesOT.length > 0 && (
  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
    <div style={{
      border: '1px solid #ccc',
      padding: '20px',
      borderRadius: '10px',
      width: '90%',
      maxWidth: '800px',
      backgroundColor: '#f9f9f9',
      overflowX: 'auto'
    }}>
      <h4 style={{ textAlign: 'center', marginBottom: '20px' }}>
        Consumibles solicitados para esta OT
      </h4>

      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'center',
          minWidth: '600px' // aumentamos mínimo por la nueva columna
        }}>
          <thead>
            <tr style={{ backgroundColor: '#e0e0e0' }}>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Item</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Nombre</th>
              
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Status</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>U.M</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Cantidad</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>ReservaSap</th>
              
            </tr>
          </thead>
          <tbody>
            {consumiblesOT.map((item, index) => (
              <tr key={item.id}>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{index + 1}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.consumible?.name || item.nombreConsumible}</td>
                
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.comentarios || "—"}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.consumible?.unidadMedida || item.unidadMedida}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.cantidad}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.reservaSap || "—"}</td>
                
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}



      <h2 className="text-3xl font-semibold text-center text-gray-700 mb-8 mt-10">
        Adicionar Consumibles
      </h2>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
  <table className="min-w-full border-collapse border border-gray-300">
    <thead>
      <tr>
        <th className="border border-gray-300 p-2">#</th>
        <th className="border border-gray-300 p-2">Nombre del Consumible</th>
        <th className="border border-gray-300 p-2">UM</th>
        <th className="border border-gray-300 p-2">Cant.</th>
        <th className="border border-gray-300 p-2">Acciones</th>
      </tr>
    </thead>
    <tbody>
      {selectedConsumibles.map((consumible, index) => (
        <tr key={index}>
          <td className="border border-gray-300 p-2">{index + 1}</td>
          <td className="border border-gray-300 p-2">
  {consumible.isEditing ? (
    // Modo manual: dejas tu input manual como ya lo tenías
    <input
      type="text"
      placeholder="Coloca tu consumible"
      value={consumible.name}
      onChange={(e) => {
        const newConsumibles = [...selectedConsumibles];
        newConsumibles[index].name = e.target.value;
        setSelectedConsumibles(newConsumibles);
      }}
      className="w-full p-2 border border-gray-300 rounded"
    />
  ) : (
    // Modo buscador: instancia independiente por fila
    <BuscadorConsumible
      initialText={consumible.name || ""}
      excludeIds={selectedConsumibles
        .filter((_, i) => i !== index)
        .map((c) => c.id)
        .filter(Boolean)}
      onSelect={(item) => {
        const newConsumibles = [...selectedConsumibles];
        newConsumibles[index] = {
          ...newConsumibles[index],
          id: item.id,
          name: item.name,
          unidadMedida: item.unidadMedida,
          // mantiene cantidad y flags
        };
        setSelectedConsumibles(newConsumibles);
      }}
    />
  )}
</td>

          <td className="border border-gray-300 p-2">
            {consumible.isEditing ? (
              <input
                type="text"
                value={consumible.unidadMedida}
                onChange={(e) => {
                  const newConsumibles = [...selectedConsumibles];
                  newConsumibles[index].unidadMedida = e.target.value;
                  setSelectedConsumibles(newConsumibles);
                }}
                className="w-full p-2 border border-gray-300 rounded"
              />
            ) : (
              <span>{consumible.unidadMedida}</span>
            )}
          </td>
          <td className="border border-gray-300 p-2">
            <input
              type="number"
              min="1"
              value={consumible.cantidad}
              onChange={(e) => handleConsumibleChange(index, e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </td>
          <td className="border border-gray-300 p-2 flex space-x-2">
            <button type="button" onClick={() => removeConsumible(index)}>
              <FaTrash className="text-red-500 hover:text-red-700" />
            </button>
            <button
              type="button"
              onClick={() => {
                consumible.isEditing = true;
                setSelectedConsumibles([...selectedConsumibles]);
              }}
            >
              <FaPlus className="text-green-500 hover:text-green-700" />
            </button>
            <button
              type="button"
              onClick={() => {
                consumible.isEditing = false;
                setSelectedConsumibles([...selectedConsumibles]);
              }}
            >
              <FaUndo className="text-blue-500 hover:text-blue-700" />
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
  <button
    type="button"
    onClick={addConsumible}
    className="w-full py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
  >
    Añadir Consumible
  </button>
</form>
      <ToastContainer />
    </div>
  );
};

export default Movimientos;
