import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

export default function BuscadorConsumible({
  initialText = "",
  onSelect,
  excludeIds = [],
  placeholder = "🔍 Buscar consumible...",
}) {
  const [term, setTerm] = useState(initialText);
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => setTerm(initialText), [initialText]);

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

  // Debounce: busca 4 segundos después de dejar de teclear
  useEffect(() => {
    if (!term) return;
    const id = setTimeout(() => search(term), 4000);
    return () => clearTimeout(id);
  }, [term]);

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            search(term); // búsqueda inmediata
          }
        }}
        onFocus={() => term && setOpen(true)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
      />
      {loading && (
        <div className="absolute right-2 top-2 text-xs select-none">...</div>
      )}
      {open && results.length > 0 && (
        <ul className="absolute left-0 right-0 mt-1 max-h-48 overflow-auto bg-white border border-gray-300 rounded-lg z-10 shadow">
          {results.map((item) => (
            <li
              key={item.id}
              onClick={() => {
                onSelect?.(item);
                setTerm(item.name);
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
