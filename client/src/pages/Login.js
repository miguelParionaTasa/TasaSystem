import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";

const Login = ({ setAuthenticated, setUser }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!username.trim() || !password) return setError("Ingresa usuario y contraseña.");
    setLoading(true);
    try {
      const user = await loginUser(username.trim(), password);
      setUser(user);
      setAuthenticated(true);
      navigate("/movimientos", { replace: true });
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setPassword("");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 py-8 px-4">
      <form onSubmit={handleSubmit} className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg space-y-6">
        <h1 className="text-2xl font-semibold text-center text-gray-700">Iniciar sesión</h1>
        {error && <div role="alert" className="rounded bg-red-50 p-3 text-red-700">{error}</div>}
        <label className="block text-sm font-medium text-gray-700">Usuario
          <input autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-2 w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500" />
        </label>
        <label className="block text-sm font-medium text-gray-700">Contraseña
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500" />
        </label>
        <button type="submit" disabled={loading} className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 disabled:bg-gray-400">
          {loading ? "Iniciando sesión…" : "Iniciar sesión"}
        </button>
      </form>
    </div>
  );
};

export default Login;
