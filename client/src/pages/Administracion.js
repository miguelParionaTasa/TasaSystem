import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../axios";

const ROLES = ["ADMIN_PLANTA", "SUPERVISOR", "TECNICO_OPERADOR", "ALMACEN", "CONSULTA", "AUDITOR"];

const Administracion = () => {
  const [users, setUsers] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [telegram, setTelegram] = useState([]);
  const [areas, setAreas] = useState([]);
  const [season, setSeason] = useState({ numero: 1, anio: new Date().getFullYear(), activa: true });
  const [newUser, setNewUser] = useState({ firstName: "", lastName: "", username: "", password: "", areaId: "", rol: "TECNICO_OPERADOR" });
  const [approvals, setApprovals] = useState({});
  const roleOptions = localStorage.getItem("userRole") === "SUPER_ADMIN" ? ["SUPER_ADMIN", ...ROLES] : ROLES;

  const load = useCallback(async () => {
    try {
      const [usersRes, seasonsRes, telegramRes, areasRes] = await Promise.all([
        api.get("/admin/usuarios"), api.get("/admin/temporadas"), api.get("/admin/telegram"), api.get("/varios/areas"),
      ]);
      setUsers(usersRes.data);
      setSeasons(seasonsRes.data);
      setTelegram(telegramRes.data);
      setAreas(areasRes.data);
    } catch (error) {
      toast.error(error.response?.data?.error || "No se pudo cargar la administración.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const createSeason = async (event) => {
    event.preventDefault();
    try {
      await api.post("/admin/temporadas", { tipo: "CHIV", numero: Number(season.numero), anio: Number(season.anio), activa: season.activa });
      toast.success("Temporada creada.");
      await load();
    } catch (error) { toast.error(error.response?.data?.error || "No se pudo crear la temporada."); }
  };
  const createUser = async (event) => {
    event.preventDefault();
    try {
      await api.post("/admin/usuarios", { ...newUser, areaId: Number(newUser.areaId) });
      setNewUser({ firstName: "", lastName: "", username: "", password: "", areaId: "", rol: "TECNICO_OPERADOR" });
      toast.success("Usuario creado.");
      await load();
    } catch (error) { toast.error(error.response?.data?.error || "No se pudo crear el usuario."); }
  };
  const activate = async (id) => { await api.post(`/admin/temporadas/${id}/activar`); toast.success("Temporada activa actualizada."); await load(); };
  const approve = async (id) => {
    const userId = Number(approvals[id]);
    if (!userId) return toast.warning("Selecciona un usuario web.");
    await api.post(`/admin/telegram/${id}/aprobar`, { userId });
    toast.success("Acceso de Telegram aprobado.");
    await load();
  };
  const revoke = async (id) => { await api.post(`/admin/telegram/${id}/revocar`); toast.success("Acceso revocado."); await load(); };
  const resetPassword = async (id) => {
    const password = window.prompt("Nueva contraseña temporal (mínimo 10 caracteres):");
    if (!password) return;
    await api.post(`/admin/usuarios/${id}/reset-password`, { password });
    toast.success("Contraseña cambiada y sesiones anteriores revocadas.");
  };

  return <main className="max-w-6xl mx-auto p-4 space-y-8">
    <div><h1 className="text-2xl font-bold">Administración de planta</h1><p className="text-gray-600">Usuarios, temporadas CHIV y accesos autorizados de Telegram para la planta seleccionada.</p></div>

    <section className="bg-white rounded shadow p-4"><h2 className="text-xl font-semibold mb-3">Temporadas</h2>
      <form onSubmit={createSeason} className="flex flex-wrap gap-3 items-end mb-4">
        <label>CHIV <select value={season.numero} onChange={(e) => setSeason({ ...season, numero: e.target.value })} className="border p-2 rounded"><option value="1">1</option><option value="2">2</option></select></label>
        <label>Año <input type="number" min="2000" max="2100" value={season.anio} onChange={(e) => setSeason({ ...season, anio: e.target.value })} className="border p-2 rounded w-28" /></label>
        <label className="flex gap-2 p-2"><input type="checkbox" checked={season.activa} onChange={(e) => setSeason({ ...season, activa: e.target.checked })} /> Activar</label>
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Crear temporada</button>
      </form>
      <div className="flex flex-wrap gap-2">{seasons.map((item) => <button key={item.id} onClick={() => !item.activa && activate(item.id)} className={`border rounded px-3 py-2 ${item.activa ? "bg-green-100 border-green-500" : "hover:bg-gray-50"}`}>{item.codigo}{item.activa ? " · activa" : ""}</button>)}</div>
    </section>

    <section className="bg-white rounded shadow p-4"><h2 className="text-xl font-semibold mb-3">Crear usuario</h2>
      <form onSubmit={createUser} className="grid md:grid-cols-3 gap-3">
        {[['firstName','Nombres'],['lastName','Apellidos'],['username','Usuario']].map(([key,label]) => <label key={key}>{label}<input required value={newUser[key]} onChange={(e) => setNewUser({ ...newUser, [key]: e.target.value })} className="block w-full border p-2 rounded" /></label>)}
        <label>Contraseña temporal<input required minLength="10" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="block w-full border p-2 rounded" /></label>
        <label>Área<select required value={newUser.areaId} onChange={(e) => setNewUser({ ...newUser, areaId: e.target.value })} className="block w-full border p-2 rounded"><option value="">Seleccionar</option>{areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select></label>
        <label>Rol<select value={newUser.rol} onChange={(e) => setNewUser({ ...newUser, rol: e.target.value })} className="block w-full border p-2 rounded">{roleOptions.map((role) => <option key={role}>{role}</option>)}</select></label>
        <button className="md:col-span-3 bg-blue-600 text-white px-4 py-2 rounded">Crear usuario</button>
      </form>
      <div className="overflow-x-auto mt-5"><table className="min-w-full text-sm"><thead><tr className="bg-gray-100"><th className="p-2 text-left">Usuario</th><th>Área</th><th>Rol</th><th>Estado</th><th></th></tr></thead><tbody>{users.map((item) => <tr key={item.id} className="border-b"><td className="p-2">{item.firstName} {item.lastName}<div className="text-gray-500">{item.username}</div></td><td className="text-center">{item.area?.name}</td><td className="text-center">{item.rol}</td><td className="text-center">{item.isDeleted ? "Inactivo" : "Activo"}</td><td className="text-right"><button onClick={() => resetPassword(item.id)} className="text-blue-700 p-2">Restablecer clave</button></td></tr>)}</tbody></table></div>
    </section>

    <section className="bg-white rounded shadow p-4"><h2 className="text-xl font-semibold mb-1">Acceso a Telegram</h2><p className="text-gray-600 mb-4">El usuario obtiene su ID con <code>/miid</code>. Aquí solo se muestran los últimos cuatro dígitos.</p>
      <div className="space-y-3">{telegram.length === 0 && <p>No hay solicitudes.</p>}{telegram.map((item) => <div key={item.id} className="border rounded p-3 flex flex-wrap items-center gap-3"><div className="grow"><b>{item.nombreTelegram || "Cuenta Telegram"}</b> · @{item.usernameTelegram || "sin_usuario"} · ID …{item.telegramIdUltimos4}<div className="text-sm text-gray-500">{item.activo ? `Autorizado: ${item.user?.username}` : "Pendiente"}</div></div>{item.activo ? <button onClick={() => revoke(item.id)} className="border border-red-600 text-red-700 px-3 py-2 rounded">Revocar</button> : <><select value={approvals[item.id] || ""} onChange={(e) => setApprovals({ ...approvals, [item.id]: e.target.value })} className="border p-2 rounded"><option value="">Vincular usuario</option>{users.filter((user) => !user.isDeleted).map((user) => <option key={user.id} value={user.id}>{user.firstName} {user.lastName} ({user.username})</option>)}</select><button onClick={() => approve(item.id)} className="bg-green-600 text-white px-3 py-2 rounded">Aprobar</button></>}</div>)}</div>
    </section>
  </main>;
};

export default Administracion;
