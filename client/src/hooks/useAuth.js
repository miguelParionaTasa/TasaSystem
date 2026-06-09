import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const useAuth = (setAuthenticated) => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem("token");
      const currentPath = window.location.pathname; 

      if (!token) {
        setAuthenticated(false);
        // Evita re-redirecciones infinitas si ya está en login o en la raíz pública
        if (currentPath !== "/" && currentPath !== "/login") {
          navigate("/login", { replace: true });
        }
        return;
      }

      try {
        const decoded = jwtDecode(token);
        const expirationTime = decoded.exp * 1000;

        if (expirationTime < Date.now()) {
          // Limpieza profunda al expirar el token JWT
          setAuthenticated(false);
          localStorage.removeItem("isAdmin");
          localStorage.removeItem("periodoFin");
          localStorage.removeItem("userId");
          localStorage.removeItem("token");
          localStorage.removeItem("userName");

          if (currentPath !== "/" && currentPath !== "/login") {
            navigate("/login", { replace: true });
          }
        } else {
          setAuthenticated(true);
        }
      } catch {
        setAuthenticated(false);
        if (currentPath !== "/" && currentPath !== "/login") {
          navigate("/login", { replace: true });
        }
      }
    };

    // Ejecuta la validación inicial
    checkTokenExpiration();

    // Re-verifica pasivamente cada 30 minutos
    const intervalId = setInterval(checkTokenExpiration, 30 * 60 * 1000);

    return () => clearInterval(intervalId);
    
    // Al dejar solo [setAuthenticated], el efecto corre una sola vez al montar la App
  }, [navigate, setAuthenticated]); 
};

export default useAuth;
