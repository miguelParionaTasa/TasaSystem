import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import MovimientosPage from "./pages/Movimientos";
import Login from "./pages/Login";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Inventario from "./pages/Inventario";
import Reportes from "./components/Reportes";
import General from "./pages/General";
import Historico from "./pages/Historico";
import useAuth from "./hooks/useAuth"; // Importa el hook useAuth

// Componente para proteger rutas
const PrivateRoute = ({ element, authenticated }) => {
  return authenticated ? element : <Navigate to="/login" />;
};

const App = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");

  // Usar el hook useAuth para manejar la expiración del token
  useAuth(setAuthenticated);

  // Usar useEffect para verificar si hay un usuario en el localStorage al cargar la app
  useEffect(() => {
    const storedUserName = localStorage.getItem("userName");
    const storedToken = localStorage.getItem("token");

    if (storedUserName && storedToken) {
      setAuthenticated(true);
      setUserName(storedUserName);
    }
  }, []); // Solo se ejecuta una vez al montar el componente

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

        {/* Ruta de login */}
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

        {/* Rutas protegidas con el componente PrivateRoute */}
        <Route
          path="/movimientos"
          element={
            <PrivateRoute
              element={<MovimientosPage />}
              authenticated={authenticated}
            />
          }
        />
        <Route
          path="/reporte"
          element={
            <PrivateRoute
              element={<Reportes />}
              authenticated={authenticated}
            />
          }
        />
        <Route
          path="/general"
          element={
            <PrivateRoute element={<General />} authenticated={authenticated} />
          }
        />
        <Route
  path="/historico"
  element={
    <PrivateRoute
      element={<Historico />}
      authenticated={authenticated}
    />
  }  
/>
<Route
  path="/inventario"
  element={
    <PrivateRoute element={<Inventario />} authenticated={authenticated} />
  }
/>


      </Routes>
      
      <Footer />
    </div>
  );
};

export default App;
