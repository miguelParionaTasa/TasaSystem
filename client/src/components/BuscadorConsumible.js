import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

export default function BuscadorConsumible({
  initialText = "",
  onSelect,
  excludeIds = [],
  placeholder = "Buscar consumible...",
  ignoreValidation = false, // <- NUEVO: para el icono "+"
}) {
  const [term, setTerm] = useState(initialText);
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(false); // <- NUEVO
  const ref = useRef(null);

  useEffect(() => {
    setTerm(initialText);
    setSelected(!!initialText);
  }, [initialText]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const search = async (q) => {
    const query = q.trim();
    if (!query) {
      setResults([]);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}consumibles/search?q=${encodeURIComponent(query)}&take=200`
      );

      const arr = res?.data?.data ?? [];
      const filtered = excludeIds.length
        ? arr.filter((x) => !excludeIds.includes(x.id))
        : arr;

      setResults(filtered.slice(0, 200));
      setOpen(true);
    } catch (e) {
      console.error("Error buscando consumibles:", e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce
  useEffect(() => {
    if (!term) return;
    const id = setTimeout(() => search(term), 400);
    return () => clearTimeout(id);
  }, [term]);

  // ✅ Determinar color
  const getBorderColor = () => {
    if (ignoreValidation) return "border-gray-300";
    if (!term) return "border-gray-300";
    if (selected) return "border-green-500";
    return "border-red-500";
  };

  const getBgColor = () => {
    if (ignoreValidation) return "";
    if (!term) return "";
    if (selected) return "bg-green-50";
    return "bg-red-50";
  };

  return (
    <div ref={ref} className="relative">

      <div className="relative">
        <input
          type="text"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setSelected(false); // <- si escribe, ya no está seleccionado
          }}
          onFocus={() => term && setOpen(true)}
          placeholder={placeholder}
          className={`w-full pr-10 px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 transition duration-150
            border ${getBorderColor()} ${getBgColor()}`}
        />

        {/* Botón búsqueda */}
        <button
          type="button"
          onClick={() => search(term)}
          className="absolute right-2 top-2 text-gray-600 hover:text-blue-600"
        >
          🔍
        </button>

        {/* Cargando */}
        {loading && (
          <div className="absolute right-10 top-2 text-xs select-none">
            ⏳
          </div>
        )}
      </div>

      {/* Resultados */}
      {open && results.length > 0 && (
        <ul className="absolute left-0 right-0 mt-1 max-h-48 overflow-auto bg-white border border-gray-300 rounded-lg z-10 shadow">
          {results.map((item) => (
            <li
              key={item.id}
              onClick={() => {
                onSelect?.(item);
                setTerm(item.name);
                setSelected(true);   // ✅ seleccionado real
                setOpen(false);
              }}
              className="cursor-pointer hover:bg-gray-100 px-3 py-2 text-sm"
            >
              {item.name}{" "}
              <span className="text-gray-500">({item.unidadMedida})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
