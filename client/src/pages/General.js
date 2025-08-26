import React, { useState, useEffect } from "react";
import axios from "axios";

const General = () => {
  const [filter, setFilter] = useState({
    startDate: "",
    endDate: "",
    scope: "misMovimientos",
    zona: "",
    ubicacion: "",
    ottId: "", 
  });

  const [zonas, setZonas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [ots, setOts] = useState([]); // Estado para almacenar las órdenes de trabajo
  const [loading, setLoading] = useState(false); // Estado para manejar la carga
  const [selectedOtId, setSelectedOtId] = useState(null);
  const [consumibles, setConsumibles] = useState([]);
const [otsDisponibles, setOtsDisponibles] = useState([]);

useEffect(() => {
  const fetchOts = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}ots`);

      // Filtrar OTs con OTbasico y OTmaximo definido
      const rawOts = response.data
        .filter((ot) => ot.OTbasico && ot.OTbasico.OTmaximo)
        .map((ot) => ({
          id: ot.id,
          ottId: ot.OTbasico.OTmaximo,
          descripcion: ot.OTbasico.name,
        }));

      // Eliminar duplicados por ottId usando Map
      const uniqueOtsMap = new Map();
      rawOts.forEach((ot) => {
        if (!uniqueOtsMap.has(ot.ottId)) {
          uniqueOtsMap.set(ot.ottId, ot);
        }
      });

      const uniqueOts = Array.from(uniqueOtsMap.values());
      setOtsDisponibles(uniqueOts);
    } catch (error) {
      console.error("Error al obtener las OTs disponibles:", error);
    }
  };

  fetchOts();
}, []);


  // Obtener las zonas
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

  // Obtener las ubicaciones basadas en la zona seleccionada
  useEffect(() => {
    const fetchUbicaciones = async () => {
      const { zona } = filter;

      if (zona) {
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}varios/ubicaciones/por-zona?zonaId=${zona}`
          );
          setUbicaciones(response.data);
        } catch (error) {
          console.error("Error al obtener ubicaciones de la zona:", error);
        }
      } else {
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}varios/ubicaciones`
          );
          setUbicaciones(response.data);
        } catch (error) {
          console.error("Error al obtener todas las ubicaciones:", error);
        }
      }
    };

    fetchUbicaciones();
  }, [filter.zona]);

  // Obtener los equipos basados en la zona y/o ubicación seleccionada
  useEffect(() => {
    const fetchEquipos = async () => {
      const { zona, ubicacion } = filter;

      if (zona) {
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}equipos/por-zona/${zona}`,
            {
              params: {
                ubicacionId: ubicacion || undefined,
              },
            }
          );
          setEquipos(response.data);
        } catch (error) {
          console.error("Error al obtener equipos de la zona:", error);
        }
      } else {
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}equipos`
          );
          setEquipos(response.data);
        } catch (error) {
          console.error("Error al obtener todos los equipos:", error);
        }
      }
    };

    fetchEquipos();
  }, [filter.zona, filter.ubicacion]);

  // Manejar los cambios en los filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prevFilter) => ({
      ...prevFilter,
      [name]: value,
    }));
  };

  // Enviar el formulario (Buscar)
  const handleViewDetails = (otId) => {
    if (selectedOtId === otId) {
      // Si ya está seleccionado, colapsar
      setSelectedOtId(null);
      setConsumibles([]);
    } else {
      // Si no está seleccionado, obtener los consumibles de la OT seleccionada
      const selectedOT = ots.find(ot => ot.id === otId); // Encuentra la OT seleccionada
      if (selectedOT) {
        setSelectedOtId(otId);
        setConsumibles(selectedOT.otConsumibles); // Establece los consumibles directamente desde la OT
      }
    }
  };
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true); // Iniciar carga

  // Obtener el userId del localStorage
  const userId = localStorage.getItem("userId"); // Asegúrate de que el userId esté almacenado como string

  // Construir la URL de la solicitud
  const url = `${process.env.REACT_APP_API_URL}ots/search`;

  // Mostrar el request body y la URL en la consola
  console.log("Request Body:", {
    startDate: filter.startDate,
    endDate: filter.endDate,
    zona: filter.zona,
    ubicacion: filter.ubicacion,
    equipo: filter.equipo,
    scope: filter.scope,
    userId: userId, // Agregar el userId aquí
  });

  console.log("URL de la solicitud:", url); // Mostrar la URL de la solicitud

  try {
    const response = await axios.get(url, {
      params: {
        startDate: filter.startDate,
        endDate: filter.endDate,
        zona: filter.zona,
        ubicacion: filter.ubicacion,
        ottId: filter.ottId, 
        scope: filter.scope,
        userId: userId, // Incluir el userId en los parámetros
      },
    });
    setOts(response.data); // Almacenar las órdenes de trabajo encontradas
  } catch (error) {
    console.error("Error al buscar órdenes de trabajo:", error);
  } finally {
    setLoading(false); // Finalizar carga
  }
};
const DetallesConsumibles = ({ consumibles, userId }) => {
  const [editingConsumible, setEditingConsumible] = useState(null);
  const [updatedData, setUpdatedData] = useState({});

  const handleEditClick = (consumible) => {
    setEditingConsumible(consumible);
    setUpdatedData({
      reservaSap: consumible.reservaSap || '',
      comentarios: consumible.comentarios || '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      const url = `${process.env.REACT_APP_API_URL}otc/${editingConsumible.id}`;
      const body = {
        reservaSap: updatedData.reservaSap,
        comentarios: updatedData.comentarios,
      };

      console.log("URL de la solicitud PUT:", url);
      console.log("Cuerpo de la solicitud:", body);

      await axios.put(url, body);
      setEditingConsumible(null);
      await handleSubmit();
    } catch (error) {
      console.error("Error al actualizar el consumible:", error);
      const simulatedEvent = { preventDefault: () => {} };
      await handleSubmit(simulatedEvent);
    }
  };

  return (
    <table className="min-w-full bg-green border border-gray-300">
      <thead>
        <tr className="bg-green-300">
          <th className="py-2 px-4 border-b">Código</th>
          <th className="py-2 px-4 border-b">Nombre Consumible</th>
          <th className="py-2 px-4 border-b">Unidad de Medida</th>
          <th className="py-2 px-4 border-b">Cantidad</th>
          <th className="py-2 px-4 border-b">Reserva SAP</th>
          <th className="py-2 px-4 border-b">Coment.</th>
          <th className="py-2 px-4 border-b">FechaPedido</th> {/* NUEVO */}
          <th className="py-2 px-4 border-b">Acción</th>
        </tr>
      </thead>
      <tbody className="bg-green-100">
        {consumibles.map((consumible) => (
          <tr key={consumible.id}>
            <td>{consumible.consumible?.codMaximo || 'N/A'}</td>
            <td>{consumible.consumible?.name || consumible.nombreConsumible}</td>
            <td>{consumible.consumible?.unidadMedida || consumible.unidadMedida}</td>
            <td>{consumible.cantidad || 0}</td>
            <td>
              {editingConsumible?.id === consumible.id && ["1", "2", "3"].includes(userId) ? (
                <input
                  type="text"
                  name="reservaSap"
                  value={updatedData.reservaSap}
                  onChange={handleInputChange}
                  className="border border-gray-300 p-1"
                />
              ) : (
                consumible.reservaSap || ''
              )}
            </td>
            <td>
              {editingConsumible?.id === consumible.id ? (
                <input
                  type="text"
                  name="comentarios"
                  value={updatedData.comentarios || ''}
                  onChange={handleInputChange}
                  className="border border-gray-300 p-1"
                />
              ) : (
                consumible.comentarios || 'N/A'
              )}
            </td>
            <td>
              {consumible.fechaCreacion
                ?new Date(consumible.fechaCreacion).toLocaleDateString("es-PE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})

                : 'N/A'}
            </td>
            <td>
              {editingConsumible?.id === consumible.id ? (
                <button onClick={handleSave} className="text-green-600 hover:underline">
                  Guardar
                </button>
              ) : (
                <button onClick={() => handleEditClick(consumible)} className="text-blue-600 hover:underline">
                  Editar
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

  return (
    <div className="p-4 max-w-screen-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Filtrar Reportes
      </h1>

      {/* Formulario de filtrado */}
      <form
        onSubmit={handleSubmit}
        className="grid gap-4 grid-cols-3 bg-gray-50 p-4 rounded-md shadow-md"
      >
        {/* Filtro desde */}
        <div>
          <label className="block font-semibold text-gray-700 mb-2">Desde</label>
          <input
            type="date"
            name="startDate"
            value={filter.startDate}
            onChange={handleFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Filtro hasta */}
        <div>
          <label className="block font-semibold text-gray-700 mb-2">Hasta</label>
          <input
            type="date"
            name="endDate"
            value={filter.endDate}
            onChange={handleFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Filtro Por */}
        <div>
          <label className="block font-semibold text-gray-700 mb-2">Por:</label>
          <select
            name="scope"
            value={filter.scope}
            onChange={handleFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="misMovimientos">Mis movimientos</option>
            <option value="miGrupo">Mi grupo</option>
          </select>
        </div>

        {/* Filtro Zona */}
        <div>
          <label className="block font-semibold text-gray-700 mb-2">Zona</label>
          <select
            name="zona"
            value={filter.zona}
            onChange={handleFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Selecciona una zona</option>
            {zonas.map((zona) => (
              <option key={zona.id} value={zona.id}>
                {zona.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro Ubicación */}
        <div>
          <label className="block font-semibold text-gray-700 mb-2">Ubicación</label>
          <select
            name="ubicacion"
            value={filter.ubicacion}
            onChange={handleFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            disabled={!filter.zona}
          >
            <option value="">Selecciona una ubicación</option>
            {ubicaciones
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((ubicacion) => (
                <option key={ubicacion.id} value={ubicacion.id}>
                  {ubicacion.name}
                </option>
              ))}
          </select>
        </div>

<div>
  <label className="block font-semibold text-gray-700 mb-2">N° OT</label>
  <select
    name="ottId"
    value={filter.ottId}
    onChange={handleFilterChange}
    className="w-full p-2 border border-gray-300 rounded-md"
  >
    <option value="">Selecciona una OT</option>
    {otsDisponibles
.sort((a, b) => Number(a.ottId) - Number(b.ottId))
  .map((ot) => (
    <option key={ot.id} value={ot.ottId}>
      {ot.ottId} - {ot.descripcion}
    </option>
  ))}
  </select>
</div>


        {/* Botón de Buscar */}
        <div className="col-span-3 flex justify-end items-center mt-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Buscar
          </button>
        </div>
      </form>

      {/* Mostrar resultados */}
      {loading && <p className="text-center mt-4">Cargando...</p>}
      {!loading && ots.length > 0 && (
        <div className ="mt-6 overflow-x-auto">
          <h2 className="text-xl font-bold mb-4">Órdenes de Trabajo Encontradas</h2>
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-300">
                <th className="py-2 px-4 border-b">OT</th>
                <th className="py-2 px-4 border-b">Descripción</th>
                <th className="py-2 px-4 border-b">Zona</th>
                <th className="py-2 px-4 border-b">Ubicación</th>
                <th className="py-2 px-4 border-b">Comentarios OT</th>
                 <th className="py-2 px-4 border-b">Acción</th> {/* NUEVA COLUMNA */}
              </tr>
            </thead>
            <tbody className="bg-gray-100">
            {ots
  .slice()
  .sort((a, b) => b.id - a.id) // Orden de mayor a menor ID (más reciente primero)
  .map((ot) => (
  <React.Fragment key={ot.id}>
    <tr className="mb-10"> {/* Agregar margen inferior a la fila */}
      <td className="py-2 px-4 border-b text-center">{ot.ottId || 'N/A'}</td>
      <td className="py-2 px-4 border-b text-center">{ot.OTbasico?.name || ot.OT}</td>
      <td className="py-2 px-4 border-b text-center">{ot.zona.name}</td>
      <td className="py-2 px-4 border-b text-center">{ot.ubicacion ? ot.ubicacion.name : 'N/A'}</td>
      <td className="py-2 px-4 border-b text-center">{ot.descripcionEquipo || 'Sin comentarios'}</td> {/* NUEVA CELDA */}
      
      <td className="py-2 px-4 border-b text-center">
        <button onClick={() => handleViewDetails(ot.id)} className="text-blue-600 hover:underline">Ver detalles</button>
      </td>
    </tr>
    {selectedOtId === ot.id && (
      <tr>
        <td colSpan="6" className="text-center">
        <DetallesConsumibles 
  consumibles={ots.find(ot => ot.id === selectedOtId)?.otConsumibles} 
  userId={localStorage.getItem("userId")} 
  handleSubmit={handleSubmit} // Asegúrate de pasar handleSubmit
/>
        </td>
      </tr>
    )}
  </React.Fragment>
))}</tbody>
          </table>
        </div>
      )}
      {!loading && ots.length === 0 && <p className="text-center mt-4">No se encontraron órdenes de trabajo.</p>}
    </div>
  );
};
// Función para manejar la visualización de detalles

export default General;