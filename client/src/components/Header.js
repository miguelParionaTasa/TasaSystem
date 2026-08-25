import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaBars, FaTimes, FaUserCircle } from "react-icons/fa";
import api from "../axios";
import { logoutUser } from "../services/api";

const LINKS = [
  ["Pedidos", "/movimientos"], ["Reportes", "/general"], ["Todas OT", "/reporte"],
  ["Materiales", "/materiales"], ["Datos técnicos", "/atributo"], ["Procesos", "/proceso"],
  ["Predictivo", "/predictivo"], ["Histórico", "/historico"], ["Activos", "/activo"],
  ["Clínica", "/clinica"], ["Tarjeta roja", "/tarjetaroja"], ["Inventario", "/inventario"],
];
const ELEVATED = ["SUPER_ADMIN", "ADMIN_PLANTA", "SUPERVISOR"];
const ADMINS = ["SUPER_ADMIN", "ADMIN_PLANTA"];

const Header = ({ user, setUser, setAuthenticated }) => {
  const [open, setOpen] = useState(false);
  const [utilitiesOpen, setUtilitiesOpen] = useState(false);
  const [plants, setPlants] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const role = user?.rol;
  const selectedPlantId = localStorage.getItem("selectedPlantId") || String(user?.plantaId || "");

  useEffect(() => {
    if (!user || !ELEVATED.includes(role)) return;
    api.get("/plantas").then(({ data }) => setPlants(data)).catch(() => setPlants([]));
  }, [role, user]);

  const go = (path) => {
    setOpen(false);
    setUtilitiesOpen(false);
    navigate(path);
  };
  const logout = async () => {
    await logoutUser();
    setAuthenticated(false);
    setUser(null);
    go("/login");
  };
  const selectPlant = (event) => {
    const id = event.target.value;
    localStorage.setItem("selectedPlantId", id);
    window.location.reload();
  };
  const download = async () => {
    const response = await api.get("/export/exportar", { responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = `TasaSystem_planta_${selectedPlantId}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (location.pathname === "/login" && !user) return null;
  return (
    <header className="bg-white shadow-md p-3 relative z-50">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4">
        <img src="/assets/logo.png" alt="TASA System" className="w-32 h-16 object-contain cursor-pointer" onClick={() => go("/")} />
        {user && (
          <nav className="hidden lg:flex items-center gap-5 font-semibold">
            <button onClick={() => go("/movimientos")} className="hover:text-orange-500">Pedidos</button>
            <button onClick={() => go("/general")} className="hover:text-orange-500">Reportes</button>
            <div className="relative">
              <button onClick={() => setUtilitiesOpen((value) => !value)} className="hover:text-orange-500">Utilitarios ▾</button>
              {utilitiesOpen && <div className="absolute top-8 left-0 bg-white border shadow-lg min-w-52 max-h-[70vh] overflow-y-auto py-2">
                {LINKS.slice(2).map(([label, path]) => <button key={path} onClick={() => go(path)} className="block w-full text-left px-4 py-2 hover:bg-blue-50">{label}</button>)}
                {ADMINS.includes(role) && <button onClick={() => go("/importar")} className="block w-full text-left px-4 py-2 hover:bg-blue-50">Importaciones</button>}
                {ADMINS.includes(role) && <button onClick={() => go("/administracion")} className="block w-full text-left px-4 py-2 hover:bg-blue-50">Administración</button>}
                {ADMINS.includes(role) && <button onClick={download} className="block w-full text-left px-4 py-2 bg-blue-50 hover:bg-blue-100">Descargar datos de planta</button>}
              </div>}
            </div>
          </nav>
        )}
        <div className="hidden md:flex items-center gap-3">
          {user && ELEVATED.includes(role) && plants.length > 0 && (
            <select aria-label="Planta seleccionada" value={selectedPlantId} onChange={selectPlant} className="border rounded px-2 py-2 text-sm">
              {plants.map((plant) => <option key={plant.id} value={plant.id}>{plant.nombre}</option>)}
            </select>
          )}
          {user ? <>
            <div className="text-sm text-right"><div className="font-semibold">{user.firstName} {user.lastName}</div><div className="text-gray-500">{role?.replaceAll("_", " ")}</div></div>
            <button onClick={logout} className="bg-red-600 text-white px-3 py-2 rounded">Salir</button>
          </> : <button onClick={() => go("/login")}><FaUserCircle className="text-3xl" /></button>}
        </div>
        {user && <button onClick={() => setOpen((value) => !value)} className="lg:hidden" aria-label="Abrir menú">{open ? <FaTimes className="text-2xl" /> : <FaBars className="text-2xl" />}</button>}
      </div>
      {open && user && <nav className="lg:hidden border-t mt-3 pt-3 max-h-[75vh] overflow-y-auto">
        {ELEVATED.includes(role) && plants.length > 0 && <select value={selectedPlantId} onChange={selectPlant} className="w-full border rounded p-2 mb-2">{plants.map((plant) => <option key={plant.id} value={plant.id}>{plant.nombre}</option>)}</select>}
        {[...LINKS, ...(ADMINS.includes(role) ? [["Importaciones", "/importar"], ["Administración", "/administracion"]] : [])].map(([label, path]) => <button key={path} onClick={() => go(path)} className="block w-full text-left p-2 hover:bg-blue-50">{label}</button>)}
        {ADMINS.includes(role) && <button onClick={download} className="block w-full text-left p-2 bg-blue-50">Descargar datos de planta</button>}
        <button onClick={logout} className="block w-full text-left p-2 text-red-700">Cerrar sesión</button>
      </nav>}
    </header>
  );
};

export default Header;
