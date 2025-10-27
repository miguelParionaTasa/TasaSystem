import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import MovimientosPage from "./pages/Movimientos";
import Login from "./pages/Login";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Inventario from "./pages/Inventario";
import Lubricante from "./pages/LubricacionesPage";
import Reportes from "./components/Reportes";
import General from "./pages/General";
import Historico from "./pages/Historico";
import Clinica from "./pages/Clinica";
import Materiales from "./pages/Materiales"; // Nueva página
import useAuth from "./hooks/useAuth";
import Atributo from "./pages/Atributo";
import Activo from "./pages/Activo";
import Proceso from "./pages/Proceso";
import Predictivo from "./pages/Predictivo"; // 👈 Import nuevo

// Componente para proteger rutas
const PrivateRoute = ({ element, authenticated }) => {
  return authenticated ? element : <Navigate to="/login" />;
};

const App = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");

  // Manejo de expiración de token
  useAuth(setAuthenticated);

  // Verificar usuario al cargar la app
  useEffect(() => {
    const storedUserName = localStorage.getItem("userName");
    const storedToken = localStorage.getItem("token");
    if (storedUserName && storedToken) {
      setAuthenticated(true);
      setUserName(storedUserName);
    }
  }, []);

  // Rutas protegidas
  const protectedRoutes = [
    { path: "/movimientos", element: <MovimientosPage /> },
    { path: "/reporte", element: <Reportes /> },
    { path: "/general", element: <General /> },
    { path: "/historico", element: <Historico /> },
        { path: "/activo", element: <Activo /> },
                { path: "/clinica", element: <Clinica /> },
    { path: "/inventario", element: <Inventario /> },
    { path: "/lubricante", element: <Lubricante /> },
    { path: "/materiales", element: <Materiales /> },
    { path: "/atributo", element: <Atributo /> },  // Añadida
    { path: "/proceso", element: <Proceso /> },
        { path: "/predictivo", element: <Predictivo /> }, // 👈 Añadida
  ];

  return (
    <div>
      <Header
        setAuthenticated={setAuthenticated}
        setUserName={setUserName}
        userName={userName}
      />
      <Routes>
        {/* Ruta pública */}
        <Route path="/" element={<Home />} />

        {/* Login */}
        <Route
          path="/login"
          element={
            authenticated ? (
              <Navigate to="/movimientos" />
            ) : (
              <Login
                setAuthenticated={setAuthenticated}
                setUserName={setUserName}
              />
            )
          }
        />

        {/* Rutas protegidas */}
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
    </div>
  );
};

export default App;
