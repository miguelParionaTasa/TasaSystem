import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUserCircle, FaBars } from "react-icons/fa";
import { MdKeyboardArrowDown } from "react-icons/md";

const Header = ({ setAuthenticated, setUserName, userName }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [utilitariosOpen, setUtilitariosOpen] = useState(false);
  const navigate = useNavigate();
  const utilitariosRef = useRef(null);

  const storedUserId = localStorage.getItem("userId");
  const puedeDescargarBD = ["1", "2", "3"].includes(storedUserId);

  useEffect(() => {
    const storedUserName = localStorage.getItem("userName");
    if (storedUserName) setUserName(storedUserName);
  }, [setUserName]);

  // Cierra menú utilitarios si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (utilitariosRef.current && !utilitariosRef.current.contains(e.target)) {
        setUtilitariosOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setAuthenticated(false);
    setUserName("");
    navigate("/");
  };

  const handleDescargarBD = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}export/exportar`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "base_datos.xlsx";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("❌ Error al descargar:", error);
    }
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <header className="bg-white shadow-md text-black p-4 relative z-50">
      <div className="max-w-screen-xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/">
          <img src="/assets/logo.png" alt="Logo" className="w-40 h-20 cursor-pointer" />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex gap-10 items-center">
          <Link to="/movimientos" className="hover:text-orange-500 font-semibold text-lg">
            Pedidos
          </Link>
          <Link to="/general" className="hover:text-orange-500 font-semibold text-lg">
            Reportes
          </Link>

          {/* Utilitarios con submenú */}
          <div className="relative" ref={utilitariosRef}>
            <button
              onClick={() => setUtilitariosOpen(!utilitariosOpen)}
              className="flex items-center gap-1 font-semibold text-lg hover:text-orange-500"
            >
              Utilitarios
              <MdKeyboardArrowDown
                className={`transition-transform ${utilitariosOpen ? "rotate-180" : ""}`}
              />
            </button>

            {utilitariosOpen && (
              <div className="absolute flex flex-col top-full left-0 bg-white border shadow-md mt-1 min-w-[180px] z-50">
                <Link
                  to="/reporte"
                  className="px-4 py-2 hover:bg-gray-100 whitespace-nowrap"
                  onClick={() => setUtilitariosOpen(false)}
                >
                  Todas OT
                </Link>
                <Link
                  to="/historico"
                  className="px-4 py-2 hover:bg-gray-100 whitespace-nowrap"
                  onClick={() => setUtilitariosOpen(false)}
                >
                  Histórico
                </Link>
                {puedeDescargarBD && (
                  <button
                    onClick={() => {
                      handleDescargarBD();
                      setUtilitariosOpen(false);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-black font-semibold hover:bg-blue-700 hover:text-white transition duration-200"
                  >
                    📥 Descargar BD
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* User info */}
        <div className="flex items-center space-x-4">
          {userName ? (
            <>
              <span className="text-lg font-medium">{userName}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 px-4 py-2 rounded-md text-white hover:bg-red-700"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link to="/login">
              <FaUserCircle className="text-3xl text-gray-700 hover:text-orange-500" />
            </Link>
          )}
        </div>

        {/* Hamburger for mobile */}
        <button onClick={toggleMenu} className="md:hidden ml-4">
          <FaBars className="text-3xl text-gray-700 hover:text-orange-500" />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t mt-4 p-4 space-y-3">
          <Link to="/movimientos" className="block text-lg" onClick={toggleMenu}>
            Pedidos
          </Link>
          <Link to="/general" className="block text-lg" onClick={toggleMenu}>
            Reportes
          </Link>

          <div>
            <button
              onClick={() => setUtilitariosOpen(!utilitariosOpen)}
              className="flex items-center gap-1 text-lg"
            >
              Utilitarios{" "}
              <MdKeyboardArrowDown
                className={`transition-transform ${utilitariosOpen ? "rotate-180" : ""}`}
              />
            </button>
            {utilitariosOpen && (
              <div className="ml-4 mt-2 space-y-2">
                <Link to="/reporte" className="block" onClick={toggleMenu}>
                  Todas OT
                </Link>
                <Link to="/historico" className="block" onClick={toggleMenu}>
                  Histórico
                </Link>
                {puedeDescargarBD && (
                  <button
                    onClick={() => {
                      handleDescargarBD();
                      toggleMenu();
                      setUtilitariosOpen(false);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-black font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-200"
                  >
                    📥 Descargar BD
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
