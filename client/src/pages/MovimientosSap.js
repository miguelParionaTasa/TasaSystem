import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const MovimientosSap = () => {
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(false);

  const userId = localStorage.getItem("userId");

  // 🔐 Permisos: solo 1, 2 o 3 pueden importar
  const tienePermiso = ["1", "2", "3"].includes(userId);

  const manejarArchivo = (e) => {
    setArchivo(e.target.files[0]);
  };

  const importarExcel = async () => {
    // ❌ Sin permiso
    if (!tienePermiso) {
      toast.error("NO PUEDES IMPORTAR");
      return;
    }

    // ❌ No hay archivo
    if (!archivo) {
      toast.error("No hay archivo seleccionado");
      return;
    }

    const formData = new FormData();
    formData.append("image", archivo);

    try {
      setCargando(true);

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}sap-movimientos/import`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success(
        `Importación exitosa. Registros: ${response.data.registrosInsertados}`
      );

      // 🔄 Reset
      setArchivo(null);
      document.getElementById("input-file").value = "";

    } catch (error) {
      toast.error(
        error?.response?.data?.error || "Error al importar archivo"
      );
      console.error("Error importando:", error);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">
        Movimientos SAP
      </h2>

      <div className="bg-white shadow-md rounded p-6 max-w-xl">
        <label className="block mb-2 font-medium">
          Seleccionar archivo Excel
        </label>

        <input
          id="input-file"
          type="file"
          accept=".xlsx, .xls"
          onChange={manejarArchivo}
          className="border p-2 rounded w-full mb-4"
        />

        <button
          onClick={importarExcel}
          disabled={cargando}
          className={`px-4 py-2 rounded w-full transition
            ${
              cargando
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-100 text-black hover:bg-blue-700 hover:text-white"
            }`}
        >
          {cargando ? "Importando..." : "Importar Excel"}
        </button>
      </div>
    </div>
  );
};

export default MovimientosSap;
