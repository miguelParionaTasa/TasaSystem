import React, { useState, useEffect } from "react";
import axios from "axios";

const Materiales = () => {
  const [filter, setFilter] = useState({
    consumible: "",
    zona: "",
    ubicacion: "",
    sap: "",   // ✅ nuevo filtro
  });

  const [fechaCorte, setFechaCorte] = useState("FECHA");
  const [editando, setEditando] = useState(false);
  const userId = localStorage.getItem("userId");
const [allMovimientos, setAllMovimientos] = useState([]);

  const [zonas, setZonas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [loading, setLoading] = useState(false);

  const excludedMaterials = [
        '31013855','31013867','31013865','31013863','31013875','31013874','31013866','31009821','31009837','31009820','31026229','31009836','31009823','31009838','31010184','31010191','31015361','31015363','31015445','31015346','30000506','31015349','31010296','31003986','31015444','31015419','31015427','31015439','31009310','31029768','31029557','31029214','31015365','31009813','31013843','32005548','32001606','31015423','32005531','20000627','31013880','31032187','31032194','31008885','31009898','31015425','32004042','32005402','31015347','31010996',
      ];

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


useEffect(() => {
  const fetchSapData = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}sap-movimientos`
      );

      const data = response.data;

      setAllMovimientos(data); // 🔥 FALTABA ESTO

      const zonasUnicas = [...new Set(data.map((item) => item.zona))];

      zonasUnicas.sort((a, b) => {
        const numA = parseInt(a.split(".")[0]);
        const numB = parseInt(b.split(".")[0]);
        return numA - numB;
      });

      setZonas(zonasUnicas);

    } catch (error) {
      console.error("Error al cargar datos SAP:", error);
    }
  };

  fetchSapData();
}, []);


const ubicacionesFiltradas = React.useMemo(() => {
  if (!filter.zona) return [];

  return [...new Set(
    allMovimientos
      .filter((item) => item.zona === filter.zona)
      .map((item) => item.ubicacion)
  )].sort((a, b) => a.localeCompare(b));
}, [filter.zona, allMovimientos]);


 const handleFilterChange = (e) => {
  const { name, value } = e.target;

  if (name === "zona") {
    setFilter((prev) => ({
      ...prev,
      zona: value,
      ubicacion: "" // 🔥 reset automático
    }));
  } else {
    setFilter((prev) => ({ ...prev, [name]: value }));
  }
};

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const response = await axios.get(
      `${process.env.REACT_APP_API_URL}sap-movimientos`,
      {
        params: {
          zona: filter.zona || undefined,
  ubicacion: filter.ubicacion || undefined,
  ot: filter.ot || undefined,
        },
      }
    );

    let data = response.data;
data = data.filter(
  (item) => !excludedMaterials.includes(item.codigoMaterial?.toString())
);
    // 🔹 Filtro por nombre consumible
    if (filter.consumible.trim() !== "") {
      data = data.filter((item) =>
        item.nombreMaterial
          ?.toLowerCase()
          .includes(filter.consumible.toLowerCase())
      );
    }

    // 🔹 Filtro por código SAP
    if (filter.sap.trim() !== "") {
      data = data.filter((item) =>
        item.codigoMaterial?.toString().includes(filter.sap)
      );
    }

    // 🔹 Adaptamos estructura para que tu tabla no cambie
    const materialesFormateados = data.map((item) => ({
      id: item.id,
      cantidad: item.cantidad,
      reservaSap: item.reservaSAP,
      comentarios: item.comentario,
      unidadMedida: item.unidadMedida,
      nombreConsumible: item.nombreMaterial,
      consumibleSap: item.codigoMaterial,
      ot: {
        ottId: item.otNumero,
        zonaName: item.zona,
        ubicacionName: item.ubicacion,
        otName: item.descripcionOT,
      },
    }));

    setMateriales(materialesFormateados);
  } catch (error) {
    console.error("Error al obtener materiales SAP:", error);
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="p-4 max-w-screen-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800">
        Consulta de Materiales
      </h1>

     

      {/* FORM DE FILTRO */}
     <form
  onSubmit={handleSubmit}
  className="flex flex-wrap items-end gap-4 bg-gray-50 p-4 rounded-md shadow-md mb-6"
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
  <label className="block font-semibold text-gray-700 mb-2">Código SAP</label>
  <input
    type="text"
    name="sap"
    value={filter.sap}
    onChange={handleFilterChange}
    placeholder="Ej. 31015444"
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
    <option key={zona} value={zona}>
      {zona}
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
>
  <option value="">Todas las ubicaciones</option>
  {ubicacionesFiltradas.map((ubi) => (
    <option key={ubi} value={ubi}>
      {ubi}
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
    <th className="py-2 px-4 border border-gray-400 max-w-[200px]">Nombre OT</th> {/* ✅ nueva */}
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
      <td className="py-2 px-4 border border-gray-400 max-w-[200px] whitespace-normal break-words">
  {mat.ot?.otName || "N/A"}
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
