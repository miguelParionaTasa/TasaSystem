import React from "react";
import { FaGithub } from "react-icons/fa"; // Importar el icono de GitHub

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-4">
      <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row justify-center items-center md:justify-between space-y-2 md:space-y-0">
        {/* Texto de copyright */}
        <span className="text-center md:text-left">
          © Created by Miguel Pariona - 2025
        </span>

        {/* Icono de GitHub */}
        <a
          href="https://github.com/Mikelyto1994"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white hover:text-gray-300 transition-colors duration-200"
        >
          <FaGithub size={24} />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
