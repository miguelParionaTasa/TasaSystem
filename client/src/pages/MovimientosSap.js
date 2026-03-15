import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const MovimientosSap = () => {

  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [tipoImportacion, setTipoImportacion] = useState("sap");

  const userId = localStorage.getItem("userId");

  // 🔐 Permisos
  const tienePermiso = ["1", "2", "3"].includes(userId);

  const manejarArchivo = (e) => {
    setArchivo(e.target.files[0]);
  };

  const importarExcel = async () => {

    if (!tienePermiso) {
      toast.error("NO PUEDES IMPORTAR");
      return;
    }

    if (!archivo) {
      toast.error("No hay archivo seleccionado");
      return;
    }

    const formData = new FormData();
    formData.append("image", archivo);

    // 🔥 Determinar endpoint
    let endpoint = "";

    if (tipoImportacion === "sap") {
      endpoint = "sap-movimientos/import";
    }

    if (tipoImportacion === "otbot") {
      endpoint = "otbot/import";
    }

    try {

      setCargando(true);

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}${endpoint}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // 🔥 Mensajes distintos según importación
      if (tipoImportacion === "sap") {

        toast.success(
          `Importación SAP exitosa. Registros: ${response.data.registrosInsertados}`
        );

      } else {

        toast.success(
          `OTBot importadas. Nuevas: ${response.data.creadas} | Actualizadas: ${response.data.actualizadas}`
        );

      }

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
        Importador de Excel
      </h2>

      <div className="bg-white shadow-md rounded p-6 max-w-xl">

        {/* 🔥 Selector de tipo */}
        <label className="block mb-2 font-medium">
          Tipo de importación
        </label>

        <select
          value={tipoImportacion}
          onChange={(e) => setTipoImportacion(e.target.value)}
          className="border p-2 rounded w-full mb-4"
        >
          <option value="sap">Movimientos SAP</option>
          <option value="otbot">OT para BOT</option>
        </select>

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