import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaBars, FaTimes } from "react-icons/fa";
import { MdKeyboardArrowDown } from "react-icons/md";

const Header = ({ setAuthenticated, setUserName, userName }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [utilitariosOpen, setUtilitariosOpen] = useState(false);
  const utilitariosRef = useRef(null);
  const navigate = useNavigate();

  const storedUserId = localStorage.getItem("userId");
  const puedeDescargarBD = ["1", "2", "3"].includes(storedUserId);
const puedeVerLubricante = storedUserId === "1";

  useEffect(() => {
    const name = localStorage.getItem("userName");
    if (name) setUserName(name);
  }, [setUserName]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (utilitariosRef.current && !utilitariosRef.current.contains(e.target)) {
        setUtilitariosOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeAllMenus = () => {
    setMenuOpen(false);
    setUtilitariosOpen(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    setAuthenticated(false);
    setUserName("");
    navigate("/login");
    closeAllMenus();
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

  const handleNavigate = (path) => {
    setTimeout(() => {
      navigate(path);
    }, 10);
    closeAllMenus();
  };

  return (
    <header className="bg-white shadow-md text-black p-4 relative z-50">
      <div className="max-w-screen-xl mx-auto flex justify-between items-center">
        <img
          src="/assets/logo.png"
          alt="Logo"
          className="w-40 h-20 cursor-pointer"
          onClick={() => handleNavigate("/")}
        />

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-8 items-center text-lg font-semibold">
          <button onClick={() => handleNavigate("/movimientos")} className="hover:text-orange-500">
            Pedidos
          </button>
          <button onClick={() => handleNavigate("/general")} className="hover:text-orange-500">
            Reportes
          </button>

          <div className="relative" ref={utilitariosRef}>
            <button
              onClick={() => setUtilitariosOpen(!utilitariosOpen)}
              className="flex items-center gap-1 hover:text-orange-500"
            >
              Utilitarios
              <MdKeyboardArrowDown className={`transition-transform ${utilitariosOpen ? "rotate-180" : ""}`} />
            </button>

            {utilitariosOpen && (
              <div className="absolute top-full left-0 bg-white shadow-md border mt-1 min-w-[180px] z-50">
                <button
                  onClick={() => handleNavigate("/reporte")}
                  className="block w-full text-left px-4 py-2 hover:bg-blue-300"
                >
                  Todas OT
                </button>
                <button
  onClick={() => handleNavigate("/materiales")}
  className="block w-full text-left px-4 py-2 hover:bg-blue-300"
>
  Materiales
</button>
                <button
                  onClick={() => handleNavigate("/historico")}
                  className="block w-full text-left px-4 py-2 hover:bg-blue-300"
                >
                  Histórico
                </button>
                  <button
                  onClick={() => handleNavigate("/inventario")}
                  className="block w-full text-left px-4 py-2 hover:bg-blue-300"
                >
                  Inventario
                </button>
                {puedeVerLubricante && (
  <button
    onClick={() => handleNavigate("/lubricante")}
    className="block w-full text-left px-4 py-2 hover:bg-blue-300"
  >
    Lubricante
  </button>
)}


                {puedeDescargarBD && (
                  <button
                    onClick={() => {
                      handleDescargarBD();
                      closeAllMenus();
                    }}
                    className="w-full text-left px-4 py-2 bg-blue-100 font-semibold hover:bg-blue-700 hover:text-white transition"
                  >
                    📥 Descargar BD
                  </button>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* User controls (desktop) */}
        <div className="hidden md:flex items-center space-x-4">
          {userName ? (
            <>
              <span className="text-lg">{userName}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <button onClick={() => handleNavigate("/login")}>
              <FaUserCircle className="text-3xl text-gray-700 hover:text-orange-500" />
            </button>
          )}
        </div>

        {/* Hamburger (mobile) */}
        <div className="md:hidden z-50">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <FaTimes className="text-3xl text-gray-700 hover:text-orange-500" />
            ) : (
              <FaBars className="text-3xl text-gray-700 hover:text-orange-500" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black bg-opacity-30" onClick={closeAllMenus} />

          <nav className="absolute top-0 left-0 w-4/5 max-w-xs h-full bg-white shadow-xl p-4 space-y-4">
            <button
              onClick={() => handleNavigate("/movimientos")}
              className="block w-full text-left text-lg hover:bg-blue-300 px-2 py-1 rounded"
            >
              Pedidos
            </button>
            <button
              onClick={() => handleNavigate("/general")}
              className="block w-full text-left text-lg hover:bg-blue-300 px-2 py-1 rounded"
            >
              Reportes
            </button>

            {/* Mostrar directamente las opciones de utilitarios */}
            <button
              onClick={() => handleNavigate("/reporte")}
              className="block w-full text-left text-lg hover:bg-blue-300 px-2 py-1 rounded"
            >
              Todas OT
            </button>
            <button
  onClick={() => handleNavigate("/materiales")}
  className="block w-full text-left text-lg hover:bg-blue-300 px-2 py-1 rounded"
>
  Materiales
</button>

            <button
              onClick={() => handleNavigate("/historico")}
              className="block w-full text-left text-lg hover:bg-blue-300 px-2 py-1 rounded"
            >
              Histórico
            </button>

              <button
              onClick={() => handleNavigate("/inventario")}
              className="block w-full text-left text-lg hover:bg-blue-300 px-2 py-1 rounded"
            >
              Inventario
            </button>
            {puedeVerLubricante && (
  <button
    onClick={() => handleNavigate("/lubricante")}
    className="block w-full text-left text-lg hover:bg-blue-300 px-2 py-1 rounded"
  >
    Lubricante
  </button>
)}
            {puedeDescargarBD && (
              <button
                onClick={() => {
                  handleDescargarBD();
                  closeAllMenus();
                }}
                className="w-full flex items-center gap-2 px-4 py-2 bg-blue-100 text-black font-semibold rounded hover:bg-blue-200 transition"
              >
                📥 Descargar BD
              </button>
            )}

            {/* Cerrar sesión o iniciar sesión */}
            <div className="pt-4 border-t">
              {userName ? (
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded"
                >
                  Cerrar sesión
                </button>
              ) : (
                <button
                  onClick={() => handleNavigate("/login")}
                  className="w-full flex items-center gap-2 text-lg hover:text-orange-500"
                >
                  <FaUserCircle className="text-2xl" /> Iniciar sesión
                </button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
