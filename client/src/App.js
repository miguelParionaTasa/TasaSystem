import React, { useState, useEffect } from "react";
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
// 🔹 REINTEGRADO: Importación del hook de autenticación corregido
import useAuth from "./hooks/useAuth";

const PrivateRoute = ({ element, authenticated }) => {
  return authenticated ? element : <Navigate to="/login" replace />;
};

const App = () => {
  // Inicialización limpia: Consulta directa al almacenamiento local antes del renderizado
  const [authenticated, setAuthenticated] = useState(() => {
    const storedToken = localStorage.getItem("token");
    const storedUserName = localStorage.getItem("userName");
    return !!(storedToken && storedUserName);
  });

  const [userName, setUserName] = useState(() => {
    return localStorage.getItem("userName") || "";
  });

  // 🔹 REINTEGRADO: Activación segura de useAuth sin generar bucles en WebKit
  useAuth(setAuthenticated);

  useEffect(() => {
    const storedUserName = localStorage.getItem("userName");
    if (storedUserName && storedUserName !== userName) {
      setUserName(storedUserName);
    }
  }, [userName]);

  const protectedRoutes = [
    { path: "/movimientos", element: <MovimientosPage /> },
    { path: "/reporte", element: <Reportes /> },
    { path: "/general", element: <General /> },
    { path: "/historico", element: <Historico /> },
    { path: "/activo", element: <Activo /> },
    { path: "/clinica", element: <Clinica /> },
    { path: "/tarjetaroja", element: <TarjetaRoja /> },
    { path: "/inventario", element: <Inventario /> },
    { path: "/importar", element: <Importar /> },
    { path: "/lubricante", element: <Lubricante /> },
    { path: "/materiales", element: <Materiales /> },
    { path: "/atributo", element: <Atributo /> },
    { path: "/proceso", element: <Proceso /> },
    { path: "/predictivo", element: <Predictivo /> },
  ];

  return (
    <div>
      <Header
        setAuthenticated={setAuthenticated}
        setUserName={setUserName}
        userName={userName}
      />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/login"
          element={
            authenticated ? (
              <Navigate to="/movimientos" replace />
            ) : (
              <Login
                setAuthenticated={setAuthenticated}
                setUserName={setUserName}
              />
            )
          }
        />

        {protectedRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <PrivateRoute
                element={route.element}
                authenticated={authenticated}
              />
            }
          />
        ))}
      </Routes>

      <Footer />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
      />
    </div>
  );
};

export default App;
