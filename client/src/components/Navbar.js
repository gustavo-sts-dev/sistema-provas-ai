import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { logout } = useAuth();

  const isActive = (path) => {
    return location.pathname === path ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100';
  };

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-xl md:text-2xl font-bold text-blue-600">
            Sistema de Provas
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-4">
            <Link
              to="/"
              className={`px-4 py-2 rounded-md transition-colors ${isActive('/')}`}
            >
              Início
            </Link>
            <Link
              to="/create-exam"
              className={`px-4 py-2 rounded-md transition-colors ${isActive('/create-exam')}`}
            >
              Criar Prova
            </Link>
            <Link
              to="/correct-exam"
              className={`px-4 py-2 rounded-md transition-colors ${isActive('/correct-exam')}`}
            >
              Corrigir Provas
            </Link>
            <Link
              to="/results"
              className={`px-4 py-2 rounded-md transition-colors ${isActive('/results')}`}
            >
              Resultados
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-md transition-colors text-red-600 hover:bg-red-50"
            >
              Sair
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-2">
              <Link
                to="/"
                className={`px-4 py-2 rounded-md transition-colors ${isActive('/')}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Início
              </Link>
              <Link
                to="/create-exam"
                className={`px-4 py-2 rounded-md transition-colors ${isActive('/create-exam')}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Criar Prova
              </Link>
              <Link
                to="/correct-exam"
                className={`px-4 py-2 rounded-md transition-colors ${isActive('/correct-exam')}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Corrigir Provas
              </Link>
              <Link
                to="/results"
                className={`px-4 py-2 rounded-md transition-colors ${isActive('/results')}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Resultados
              </Link>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleLogout();
                }}
                className="px-4 py-2 rounded-md transition-colors text-red-600 hover:bg-red-50"
              >
                Sair
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
