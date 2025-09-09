import React, { useState, useEffect } from "react";
import axios from "axios";

const Materiales = () => {
  const [filter, setFilter] = useState({
    consumible: "",
    zona: "",
    ubicacion: "",
  });

  const [fechaCorte, setFechaCorte] = useState("FECHA");
  const [editando, setEditando] = useState(false);
  const userId = localStorage.getItem("userId");

  const [zonas, setZonas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [loading, setLoading] = useState(false);

  // === Obtener fechaCorte desde backend ===
  useEffect(() => {
    const fetchFecha = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}configuracion`);
        if (res.data && res.data.fechaCorte) {
          setFechaCorte(res.data.fechaCorte);
        }
      } catch (error) {
        console.error("Error al obtener fechaCorte:", error);
      }
    };
    fetchFecha();
  }, []);

  // === Guardar fechaCorte en backend ===
 const guardarFecha = async () => {
  try {
    const res = await axios.patch(`${process.env.REACT_APP_API_URL}configuracion`, {
      fechaCorte: fechaCorte,
    });
    setFechaCorte(res.data.fechaCorte); // actualiza con lo que responde el backend
    setEditando(false);
  } catch (error) {
    console.error("Error al actualizar fechaCorte:", error);
  }
};


  // === Obtener zonas ===
  useEffect(() => {
    const fetchZonas = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}varios/zonas`);
        setZonas(response.data);
      } catch (error) {
        console.error("Error al obtener zonas:", error);
      }
    };
    fetchZonas();
  }, []);

  // === Obtener ubicaciones por zona ===
  useEffect(() => {
    const fetchUbicaciones = async () => {
      if (filter.zona) {
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}varios/ubicaciones/por-zona?zonaId=${filter.zona}`
          );
          setUbicaciones(response.data);
        } catch (error) {
          console.error("Error al obtener ubicaciones:", error);
        }
      } else {
        setUbicaciones([]);
      }
    };
    fetchUbicaciones();
  }, [filter.zona]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userId = localStorage.getItem("userId");

      const response = await axios.get(`${process.env.REACT_APP_API_URL}ots/search`, {
        params: {
          zona: filter.zona || undefined,
          ubicacion: filter.ubicacion || undefined,
          scope: "miGrupo",
          userId: userId,
        },
      });

      let allConsumibles = [];
      response.data.forEach((ot) => {
        if (ot.otConsumibles) {
          const zonaEncontrada =
            ot.zona?.nombreMaximo ||
            zonas.find((z) => z.id === ot.zonaId || z.id === ot.OTbasico?.zonaId)?.nombreMaximo;

          ot.otConsumibles.forEach((consumible) => {
            allConsumibles.push({
              ...consumible,
              ot: {
                ottId: ot.OTbasico?.OTmaximo || ot.ottId,
                zonaName: zonaEncontrada || "N/A",
                ubicacionName: ot.ubicacion?.name || "N/A",
              },
            });
          });
        }
      });

      if (filter.consumible.trim() !== "") {
        allConsumibles = allConsumibles.filter(
          (c) =>
            c.consumible?.name?.toLowerCase().includes(filter.consumible.toLowerCase()) ||
            c.nombreConsumible?.toLowerCase().includes(filter.consumible.toLowerCase())
        );
      }

      setMateriales(allConsumibles);
    } catch (error) {
      console.error("Error al obtener consumibles:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-screen-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800">
        Consulta de Materiales
      </h1>

      {/* FECHA DE CORTE */}
      <div className="flex items-center gap-2">
        {editando ? (
          <input
            type="text"
            value={fechaCorte}
            onChange={(e) => setFechaCorte(e.target.value)}
            className="border p-1 rounded-md"
          />
        ) : (
          <span className="text-lg text-gray-600">Al corte de: {fechaCorte}</span>
        )}

        {userId === "1" && (
          <button
            onClick={() => {
              if (editando) {
                guardarFecha();
              } else {
                setEditando(true);
              }
            }}
            className="ml-2 bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition"
          >
            {editando ? "Guardar" : "Editar"}
          </button>
        )}
      </div>

      {/* FORM DE FILTRO */}
      <form
        onSubmit={handleSubmit}
        className="grid gap-4 grid-cols-3 bg-gray-50 p-4 rounded-md shadow-md mb-6"
      >
        <div>
          <label className="block font-semibold text-gray-700 mb-2">Consumible</label>
          <input
            type="text"
            name="consumible"
            value={filter.consumible}
            onChange={handleFilterChange}
            placeholder="Nombre del consumible"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-2">Zona</label>
          <select
            name="zona"
            value={filter.zona}
            onChange={handleFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Todas las zonas</option>
            {zonas.map((zona) => (
              <option key={zona.id} value={zona.id}>
                {zona.nombreMaximo}
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
            className="w-full p-2 border border-gray-300 rounded-md"
            disabled={!filter.zona}
          >
            <option value="">Todas las ubicaciones</option>
            {ubicaciones.map((ubi) => (
              <option key={ubi.id} value={ubi.id}>
                {ubi.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-3 flex justify-end mt-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Filtrar
          </button>
        </div>
      </form>

      {/* TABLA DE RESULTADOS */}
      {loading ? (
  <p className="text-center mt-4">Cargando...</p>
) : materiales.length > 0 ? (
  <div className="overflow-x-auto">
    <table className="min-w-full border border-gray-400 text-center">
     <thead>
  <tr className="bg-gray-300 border border-gray-400">
    <th className="py-2 px-4 border border-gray-400">OT</th>
    <th className="py-2 px-4 border border-gray-400">Sap Consum</th>
    <th className="py-2 px-4 border border-gray-400 max-w-[150px]">Nombre Consumible</th>
    <th className="py-2 px-4 border border-gray-400 w-20">Unidad de Medida</th>
    <th className="py-2 px-4 border border-gray-400">Cantidad</th>
    <th className="py-2 px-4 border border-gray-400">Zona</th>
    <th className="py-2 px-4 border border-gray-400 max-w-[150px]">Ubicación Técnica</th>
    <th className="py-2 px-4 border border-gray-400">Reserva SAP</th>
    <th className="py-2 px-4 border border-gray-400">Coment.</th>
  </tr>
</thead>
<tbody className="bg-gray-100">
  {materiales.map((mat) => (
    <tr key={mat.id} className="border border-gray-400">
      <td className="py-2 px-4 border border-gray-400">{mat.ot?.ottId || "N/A"}</td>
      <td className="py-2 px-4 border border-gray-400">
        {mat.consumible?.consumibleSap || mat.consumibleSap}
      </td>
      <td className="py-2 px-4 border border-gray-400 max-w-[150px] whitespace-normal break-words">
        {mat.consumible?.name || mat.nombreConsumible}
      </td>
      <td className="py-2 px-4 border border-gray-400 w-20">
        {mat.consumible?.unidadMedida || mat.unidadMedida}
      </td>
      <td className="py-2 px-4 border border-gray-400">{mat.cantidad || 0}</td>
      <td className="py-2 px-4 border border-gray-400">{mat.ot?.zonaName || "N/A"}</td>
      <td className="py-2 px-4 border border-gray-400 max-w-[150px] whitespace-normal break-words">
        {mat.ot?.ubicacionName || "N/A"}
      </td>
      <td className="py-2 px-4 border border-gray-400">{mat.reservaSap || ""}</td>
      <td className="py-2 px-4 border border-gray-400">{mat.comentarios || ""}</td>
    </tr>
  ))}
</tbody>

    </table>
  </div>
) : (
  !loading && <p className="text-center mt-4">No se encontraron materiales.</p>
)}

    </div>
  );
};

export default Materiales;
