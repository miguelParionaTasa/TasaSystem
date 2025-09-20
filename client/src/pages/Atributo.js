import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const Atributo = () => {
  const [filter, setFilter] = useState({ zona: "", ubicacion: "", equipo: "" });
  const [zonas, setZonas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [atributos, setAtributos] = useState([]);
  const [modalImagesVisible, setModalImagesVisible] = useState(false);
  const [loading, setLoading] = useState(false);
const [modalImage, setModalImage] = useState(null); // null o URL de la imagen a mostrar

  const [editingId, setEditingId] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [newRow, setNewRow] = useState(null);

  const token = localStorage.getItem("token");
  const userId = parseInt(localStorage.getItem("userId"));

  // === Fetch zonas, ubicaciones y equipos ===
  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}varios/zonas`)
      .then(res => setZonas(res.data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (!filter.zona) return setUbicaciones([]);
    axios.get(`${process.env.REACT_APP_API_URL}varios/ubicaciones/por-zona?zonaId=${filter.zona}`)
      .then(res => setUbicaciones(res.data))
      .catch(err => console.error(err));
  }, [filter.zona]);

  useEffect(() => {
    if (!filter.ubicacion) return setEquipos([]);
    axios.get(`${process.env.REACT_APP_API_URL}equipos/por-zona/${filter.zona}?ubicacionId=${filter.ubicacion}`)
      .then(res => setEquipos(res.data))
      .catch(err => console.error(err));
  }, [filter.ubicacion, filter.zona]);

  const handleFilterChange = e => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e?.preventDefault();
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}atributos/search`, {
        params: {
          zonaId: filter.zona || undefined,
          ubicacionId: filter.ubicacion || undefined,
          equipoId: filter.equipo || undefined,
        },
      });
      setAtributos(response.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // === Guardar nueva fila con imagen ===
  const handleSaveNew = async () => {
  if (!filter.equipo || !newRow?.nombre || !newRow?.valor) {
    Swal.fire("Error", "Completa todos los campos", "error");
    return;
  }

const formData = new FormData();
formData.append("nombre", newRow.nombre);
formData.append("valor", newRow.valor);
formData.append("equipoId", filter.equipo);
formData.append("userId", userId);
if (newRow.imagen) formData.append("image", newRow.imagen); 


  try {
    await axios.post(`${process.env.REACT_APP_API_URL}atributos`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    Swal.fire("Añadido", "El atributo fue creado", "success");
    setNewRow(null);
    handleSubmit(new Event("submit"));
  } catch (error) {
    console.error("Error al crear atributo:", error.response || error);
  }
};



  // === Guardar edición ===
  const handleSaveEdit = async atr => {
    const cambios = {};
    if (atr.nombre !== editedData.nombre) cambios.nombre = editedData.nombre;
    if (atr.valor !== editedData.valor) cambios.valor = editedData.valor;

    if (Object.keys(cambios).length === 0) {
      Swal.fire("Sin cambios", "No se realizaron cambios", "info");
      setEditingId(null);
      return;
    }

    const result = await Swal.fire({
      title: "¿Confirmar cambios?",
      text: `Se realizarán cambios en el atributo`,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Guardar",
    });

    if (result.isConfirmed) {
      try {
        await axios.put(`${process.env.REACT_APP_API_URL}atributos/${atr.id}`, cambios, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire("Actualizado", "El atributo fue actualizado", "success");
        setEditingId(null);
        handleSubmit();
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "No se pudo actualizar el atributo", "error");
      }
    }
  };

  // === Eliminar atributo ===
  const handleDelete = async atr => {
    if (userId !== atr.userId) {
  return Swal.fire(
    "No permitido",
    `Este atributo fue creado por ${atr.user.firstName} ${atr.user.lastName} y no puedes eliminarlo`,
    "error"
  );
}

    const result = await Swal.fire({
      title: "¿Está seguro?",
      text: `Se eliminará el atributo: ${atr.nombre}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
    });
    if (result.isConfirmed) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}atributos/${atr.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire("Eliminado", "El atributo fue eliminado", "success");
        handleSubmit();
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "No se pudo eliminar", "error");
      }
    }
  };

  // === Subir imagen existente ===
  const handleUploadImage = async (atr, file) => {
  if (!file) return;

  const formData = new FormData();
  formData.append("image", file);

  try {
    await axios.post(`${process.env.REACT_APP_API_URL}atributos/${atr.id}/upload-image`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data"
      }
    });

    Swal.fire("Actualizado", "Imagen subida correctamente", "success");

    // ⚡ Actualizar solo ese atributo en el estado
    setAtributos(prev =>
      prev.map(a =>
        a.id === atr.id
          ? { ...a, images: [{ url: URL.createObjectURL(file) }] } // temporalmente mostrar la imagen subida
          : a
      )
    );

    // opcional: refrescar desde backend si quieres la URL real
    // const res = await axios.get(`${process.env.REACT_APP_API_URL}atributos/${atr.id}`);
    // setAtributos(prev => prev.map(a => a.id === atr.id ? res.data : a));
  } catch (error) {
    console.error(error);
    Swal.fire("Error", "No se pudo subir la imagen", "error");
  }
};



  return (
    <div className="p-4 max-w-screen-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800">Consulta de Atributos</h1>

      {/* Formulario de filtro */}
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4 bg-gray-50 p-4 rounded-md shadow-md mb-6">
        <div>
          <label className="block font-semibold text-gray-700 mb-2">Zona</label>
          <select name="zona" value={filter.zona} onChange={handleFilterChange} className="w-full p-2 border border-gray-300 rounded-md">
            <option value="">Todas las zonas</option>
            {zonas.map(z => <option key={z.id} value={z.id}>{z.nombreMaximo}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-semibold text-gray-700 mb-2">Ubicación</label>
          <select name="ubicacion" value={filter.ubicacion} onChange={handleFilterChange} disabled={!filter.zona} className="w-[320px] p-2 border border-gray-300 rounded-md">
            <option value="">Todas las ubicaciones</option>
            {ubicaciones.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-semibold text-gray-700 mb-2">Equipo</label>
          <select name="equipo" value={filter.equipo} onChange={handleFilterChange} disabled={!filter.ubicacion} className="w-[320px] p-2 border border-gray-300 rounded-md">
            <option value="">Todos los equipos</option>
            {equipos.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
          </select>
        </div>
        <div className="col-span-3 flex justify-end mt-4">
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition">Filtrar</button>
        </div>
      </form>

      {/* Botones de acción */}
      <div className="flex gap-4 mb-4">
        <button onClick={() => setNewRow({ nombre: "", valor: "", imagen: null })} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          ➕ Añadir atributo
        </button>
        <button
    onClick={() => setModalImagesVisible(true)}
    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
  >
    🖼 Ver imágenes
  </button>
      </div>

      {/* Tabla */}
      {loading ? (
        <p className="text-center mt-4">Cargando...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-400 text-center">
            <thead>
              <tr className="bg-gray-300 border border-gray-400">
                <th className="py-2 px-4 border border-gray-400">Zona</th>
                <th className="py-2 px-4 border border-gray-400">Ubicación</th>
                <th className="py-2 px-4 border border-gray-400">Equipo</th>
                <th className="py-2 px-4 border border-gray-400">Atributo</th>
                <th className="py-2 px-4 border border-gray-400">Valor</th>
                <th className="py-2 px-4 border border-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-gray-100">
              {/* Fila nueva */}
              {newRow && (
  <>
    {/* Fila de nombre y valor */}
    <tr className="bg-yellow-100">
      <td className="border">-</td>
      <td className="border">-</td>
      <td className="border">Equipo seleccionado</td>
      <td className="border">
        <input
          type="text"
          value={newRow.nombre}
          onChange={e => setNewRow(prev => ({ ...prev, nombre: e.target.value }))}
          className="p-1 border rounded w-full"
          placeholder="Nombre del atributo"
        />
      </td>
      <td className="border">
        <input
          type="text"
          value={newRow.valor}
          onChange={e => setNewRow(prev => ({ ...prev, valor: e.target.value }))}
          className="p-1 border rounded w-full"
          placeholder="Valor del atributo"
        />
      </td>
      <td className="border" colSpan={2}></td>
    </tr>

    {/* Fila de imagen y botón */}
    <tr className="bg-yellow-50">
      <td className="border" colSpan={3}></td>
      <td className="border" colSpan={2}>
        <input
          type="file"
          accept="image/*"
          onChange={e => setNewRow(prev => ({ ...prev, imagen: e.target.files[0] }))}
          className="p-1 border rounded w-full"
        />
      </td>
      <td className="border">
        <button
          onClick={handleSaveNew}
          className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 w-full"
        >
          Guardar
        </button>
      </td>
    </tr>
  </>
)}

{/* Modal de imágenes */}
{modalImagesVisible && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-md max-w-6xl w-full p-4 overflow-auto relative">
      <button
        className="absolute top-2 right-2 text-gray-700 text-lg font-bold"
        onClick={() => setModalImagesVisible(false)}
      >
        ✖
      </button>

      {/* Contenedor horizontal con scroll */}
      <div className="flex gap-4 overflow-x-auto py-2">
        {atributos.filter(a => a.images?.length).map(atr =>
          atr.images.map(img => (
           <div className="flex gap-4 overflow-x-auto py-2">
  {atributos.filter(a => a.images?.length).map(atr =>
    atr.images.map(img => (
      <div key={img.id} className="border rounded-md p-2 w-[200px] h-[200px] flex-shrink-0 flex flex-col items-center">
        {/* Contenedor para centrar la imagen */}
        <div className="w-full h-[120px] flex items-center justify-center bg-gray-100 rounded mb-2">
          <img 
            src={img.url} 
            alt={atr.nombre} 
            className="max-w-full max-h-full object-contain"
          />
        </div>
        <p className="text-xs font-semibold truncate w-full">{atr.equipo?.ubicacion?.zona?.nombreMaximo || "N/A"}</p>
        <p className="text-xs truncate w-full">{atr.equipo?.ubicacion?.name || "N/A"}</p>
        <p className="text-xs truncate w-full">{atr.equipo?.name || "N/A"}</p>
        <p className="text-xs truncate w-full">{atr.nombre}</p>
        <p className="text-xs truncate w-full">{atr.valor}</p>
      </div>
    ))
  )}
  {atributos.filter(a => a.images?.length).length === 0 && <p className="text-center w-full">No hay imágenes disponibles</p>}
</div>

          ))
        )}
        {atributos.filter(a => a.images?.length).length === 0 && <p className="text-center w-full">No hay imágenes disponibles</p>}
      </div>
    </div>
  </div>
)}

{/* Modal de una imagen */}
{modalImage && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-4 rounded-md max-w-lg w-full relative">
      <button
        className="absolute top-2 right-2 text-gray-700 text-lg font-bold"
        onClick={() => setModalImage(null)}
      >
        ✖
      </button>
      <img
        src={modalImage}
        alt="Atributo"
        className="mt-6 w-full max-h-[70vh] object-contain"
      />
    </div>
  </div>
)}

{/* Modal de todas las imágenes */}
{modalImagesVisible && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-md max-w-6xl w-full p-4 overflow-auto relative">
      <button
        className="absolute top-2 right-2 text-gray-700 text-lg font-bold"
        onClick={() => setModalImagesVisible(false)}
      >
        ✖
      </button>

      <div className="flex gap-4 overflow-x-auto py-2">
        {atributos.filter(a => a.images?.length).map(atr =>
          atr.images.map(img => (
            <div key={img.id} className="border rounded-md p-2 w-[200px] flex-shrink-0 flex flex-col items-center">
              <div className="w-full h-[120px] flex items-center justify-center bg-gray-100 rounded mb-2">
                <img src={img.url} alt={atr.nombre} className="max-w-full max-h-full object-contain" />
              </div>
              <p className="text-xs font-semibold truncate w-full">{atr.equipo?.ubicacion?.zona?.nombreMaximo || "N/A"}</p>
              <p className="text-xs truncate w-full">{atr.equipo?.ubicacion?.name || "N/A"}</p>
              <p className="text-xs truncate w-full">{atr.equipo?.name || "N/A"}</p>
              <p className="text-xs truncate w-full">{atr.nombre}</p>
              <p className="text-xs truncate w-full">{atr.valor}</p>
            </div>
          ))
        )}
        {atributos.filter(a => a.images?.length).length === 0 && <p className="text-center w-full">No hay imágenes disponibles</p>}
      </div>
    </div>
  </div>
)}



              {atributos
              .slice() // para no mutar el estado original
              .sort((a, b) => {
    const zonaA = a.equipo?.ubicacion?.zona?.id || 0;
    const zonaB = b.equipo?.ubicacion?.zona?.id || 0;
    return zonaA - zonaB; // orden ascendente
  })
              .map(atr => (
                <tr key={atr.id} className="border border-gray-400">
                  <td className="border">{atr.equipo?.ubicacion?.zona?.nombreMaximo || "N/A"}</td>
                  <td className="border">{atr.equipo?.ubicacion?.name || "N/A"}</td>
                  <td className="border w-[320px] truncate">{atr.equipo?.name || "N/A"}</td>
                  <td className="border">
                    {editingId === atr.id ? (
                      <input type="text" value={editedData.nombre} onChange={e => setEditedData(prev => ({ ...prev, nombre: e.target.value }))} className="p-1 border rounded" />
                    ) : atr.nombre}
                  </td>
                  <td className="border">
                    {editingId === atr.id ? (
                      <input type="text" value={editedData.valor} onChange={e => setEditedData(prev => ({ ...prev, valor: e.target.value }))} className="p-1 border rounded" />
                    ) : atr.valor}
                  </td>
                  <td className="border">
                    <div className="flex gap-2 justify-center">
                      {editingId === atr.id ? (
                        <button onClick={() => handleSaveEdit(atr)} className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">Guardar</button>
                      ) : (
                        <>
                          <button onClick={() => {
                            if (userId !== atr.userId) {
  return Swal.fire(
    "No permitido",
    `Este atributo fue creado por ${atr.user.firstName} ${atr.user.lastName} y no puedes modificarlo`,
    "error"
  );
}
 setEditingId(atr.id);
                            setEditedData({ nombre: atr.nombre, valor: atr.valor });
                          }} className="text-blue-600 hover:underline">Editar</button>

                          <button onClick={() => handleDelete(atr)} className="text-red-600 hover:underline">Eliminar</button>

                         <button
  onClick={() => {
    // Si hay imagen, cualquier usuario puede verla
    if (atr.images?.[0]?.url) {
      setModalImage(atr.images[0].url);
      return;
    }

    // Si no hay imagen, solo el creador puede subirla
    if (userId !== atr.userId) {
      return Swal.fire(
        "No permitido",
        `Este atributo fue creado por ${atr.user.firstName} ${atr.user.lastName} y no puedes subir imagen`,
        "error"
      );
    }

    // Abrir selector de archivo
    Swal.fire({
      title: 'Subir imagen',
      input: 'file',
      inputAttributes: { accept: 'image/*', 'aria-label': 'Subir imagen' },
      showCancelButton: true
    }).then(result => {
      const file = result?.value?.[0];
      if (file) handleUploadImage(atr, file);
    });
  }}
  className={`text-white px-3 py-1 rounded ${
    atr.images?.[0]?.url ? "bg-purple-600 hover:bg-purple-700" : "bg-orange-500 hover:bg-orange-600"
  }`}
>
  {atr.images?.[0]?.url ? "Ver Imagen" : "Subir Imagen"}
</button>




  </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

            </tbody>
          </table>
        </div>
        
      )}
      {!loading && atributos.length === 0 && <p className="text-center mt-4">No se encontraron atributos.</p>}
    </div>
  

);
  
};

export default Atributo;
