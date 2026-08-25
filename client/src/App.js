import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Home from "./pages/Home";
import MovimientosPage from "./pages/Movimientos";
import Login from "./pages/Login";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Inventario from "./pages/Inventario";
import Importar from "./pages/MovimientosSap";
import Lubricante from "./pages/LubricacionesPage";
import Reportes from "./components/Reportes";
import General from "./pages/General";
import Historico from "./pages/Historico";
import Clinica from "./pages/Clinica";
import TarjetaRoja from "./pages/TarjetaRoja";
import Materiales from "./pages/Materiales";
import Atributo from "./pages/Atributo";
import Activo from "./pages/Activo";
import Proceso from "./pages/Proceso";
import Predictivo from "./pages/Predictivo";
import Administracion from "./pages/Administracion";
import useAuth from "./hooks/useAuth";

const PrivateRoute = ({ authenticated, loading, children, roles, user }) => {
  if (loading) return <div className="min-h-[50vh] flex items-center justify-center">Verificando sesión…</div>;
  if (!authenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.rol)) return <Navigate to="/movimientos" replace />;
  return children;
};

const App = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  useAuth(setAuthenticated, setUser, setLoading);

  const routes = [
    ["/movimientos", <MovimientosPage />], ["/reporte", <Reportes />], ["/general", <General />],
    ["/historico", <Historico />], ["/activo", <Activo />], ["/clinica", <Clinica />],
    ["/tarjetaroja", <TarjetaRoja />], ["/inventario", <Inventario />], ["/importar", <Importar />],
    ["/lubricante", <Lubricante />], ["/materiales", <Materiales />], ["/atributo", <Atributo />],
    ["/proceso", <Proceso />], ["/predictivo", <Predictivo />],
  ];

  return (
    <div>
      <Header user={user} setUser={setUser} setAuthenticated={setAuthenticated} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={authenticated ? <Navigate to="/movimientos" replace /> : <Login setUser={setUser} setAuthenticated={setAuthenticated} />} />
        {routes.map(([path, element]) => (
          <Route key={path} path={path} element={<PrivateRoute authenticated={authenticated} loading={loading} user={user}>{element}</PrivateRoute>} />
        ))}
        <Route path="/administracion" element={
          <PrivateRoute authenticated={authenticated} loading={loading} user={user} roles={["SUPER_ADMIN", "ADMIN_PLANTA"]}>
            <Administracion />
          </PrivateRoute>
        } />
      </Routes>
      <Footer />
      <ToastContainer position="top-right" autoClose={3000} newestOnTop closeOnClick pauseOnHover draggable />
    </div>
  );
};

export default App;
