import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUserCircle, FaBars } from "react-icons/fa";

const Header = ({ setAuthenticated, setUserName, userName }) => {
  const [menuOpen, setMenuOpen] = useState(false); // Estado para manejar la visibilidad del menú desplegable
  const navigate = useNavigate(); // useNavigate inicializado aquí

  // useEffect que se ejecuta cuando el componente se monta
  useEffect(() => {
    // Verificar si el userName está en el localStorage
    const storedUserName = localStorage.getItem("userName");
    if (storedUserName) {
      setUserName(storedUserName);
    }
  }, [setUserName]);

  const handleLogout = () => {
    // Eliminar el token y el nombre de usuario del localStorage
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("userId");
    localStorage.removeItem("periodoFin");
    localStorage.removeItem("token");
    localStorage.removeItem("userName");

    // Actualizar el estado de autenticación
    setAuthenticated(false);
    setUserName("");

    // Redirigir al home ("/")
    navigate("/");
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className="bg-white shadow-md text-black p-4">
      <div className="max-w-screen-xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <Link to="/">
            {" "}
            {/* Envuelve la imagen en un Link */}
            <img
              src="/assets/logo.png" // Asegúrate de que el logo esté en esta ruta
              alt="Logo"
              className="w-40 h-20 cursor-pointer"
            />
          </Link>
        </div>

        {/* Enlaces desktop */}
        <div className="hidden md:flex gap-[90px]">
          <Link
            to="/movimientos"
            className="text-lg font-semibold transition-colors duration-300 hover:text-orange-500"
          >
            Pedidos
          </Link>

          <Link
            to="/general"
            className="text-lg font-semibold transition-colors duration-300 hover:text-orange-500"
          >
            Reportes
          </Link>
          
          <Link
            to="/reporte"
            className="text-lg font-semibold transition-colors duration-300 hover:text-orange-500"
          >
            Todas OT
          </Link>
        </div>

        {/* Icono de hamburguesa */}
        <div className="md:hidden flex items-center">
          <button onClick={toggleMenu}>
            <FaBars className="text-3xl text-gray-700 hover:text-orange-500 transition-all duration-300" />
          </button>
        </div>

        {/* Login o Nombre de usuario */}
        <div className="flex items-center space-x-4">
          {userName ? (
            <>
              <span className="text-lg font-medium">{userName}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 px-4 py-2 rounded-md text-white hover:bg-red-700 transition-colors duration-300"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link to="/login">
              <FaUserCircle className="text-3xl text-gray-700 hover:text-orange-500 transition-all duration-300" />
            </Link>
          )}
        </div>
      </div>

      {/* Menú desplegable */}
      {menuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white shadow-lg p-4 flex flex-col items-center md:hidden">
          <Link
            to="/movimientos"
            className="text-lg font-semibold py-2 text-gray-700 hover:text-orange-500"
            onClick={() => setMenuOpen(false)}
          >
            Pedidos
          </Link>
          <Link
            to="/general"
            className="text-lg font-semibold py-2 text-gray-700 hover:text-orange-500"
            onClick={() => setMenuOpen(false)}
          >
            Reportes
          </Link>
          <Link
            to="/reporte"
            className="text-lg font-semibold py-2 text-gray-700 hover:text-orange-500"
            onClick={() => setMenuOpen(false)}
          >
             Todas OT
          </Link>
        </div>
      )}
    </header>
  );
};

export default Header;
