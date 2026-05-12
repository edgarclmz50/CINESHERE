import { Search, Bell, User, Menu, X, Settings, LogIn, LogOut } from "lucide-react";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { auth } from "../lib/firebase";
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

interface NavbarProps {
  onSearch: (query: string) => void;
  onOpenSettings: () => void;
  activeSection: 'home' | 'movies' | 'tv' | 'new' | 'watchlist' | 'platforms';
  onSectionChange: (section: 'home' | 'movies' | 'tv' | 'new' | 'watchlist' | 'platforms') => void;
}

export default function Navbar({ onSearch, onOpenSettings, activeSection, onSectionChange }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(auth.currentUser);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      unsub();
    };
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  return (
    <nav
      className={`fixed top-0 z-50 w-full px-4 py-4 transition-colors duration-300 md:px-12 ${
        isScrolled ? "bg-black/90 backdrop-blur-md" : "bg-gradient-to-b from-black/80 to-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-black tracking-tighter text-blue-500 transition-transform hover:scale-105 cursor-pointer">
            CINESPHERE
          </h1>
          
          <div className="hidden items-center gap-6 text-sm font-medium text-gray-400 md:flex">
            <button 
              onClick={() => onSectionChange('home')}
              className={`hover:text-white transition-colors ${activeSection === 'home' ? 'text-white font-bold' : ''}`}
            >
              Inicio
            </button>
            <button 
              onClick={() => onSectionChange('movies')}
              className={`hover:text-white transition-colors ${activeSection === 'movies' ? 'text-white font-bold' : ''}`}
            >
              Películas
            </button>
            <button 
              onClick={() => onSectionChange('tv')}
              className={`hover:text-white transition-colors ${activeSection === 'tv' ? 'text-white font-bold' : ''}`}
            >
              Series
            </button>
            <button 
              onClick={() => onSectionChange('new')}
              className={`hover:text-white transition-colors ${activeSection === 'new' ? 'text-white font-bold' : ''}`}
            >
              Novedades
            </button>
            <button 
              onClick={() => onSectionChange('watchlist')}
              className={`hover:text-white transition-colors ${activeSection === 'watchlist' ? 'text-white font-bold' : ''}`}
            >
              Mi Lista
            </button>
            <button 
              onClick={() => onSectionChange('platforms')}
              className={`hover:text-white transition-colors ${activeSection === 'platforms' ? 'text-white font-bold' : ''}`}
            >
              Plataformas
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div className="relative group">
            <div className="flex items-center bg-[#1a1a1a] border border-[#333] rounded px-3 py-1.5 focus-within:border-blue-500/50 transition-all duration-300 w-10 group-hover:w-48 group-focus-within:w-48 overflow-hidden h-9">
              <Search className="w-4 h-4 text-gray-500 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search movies..."
                className="bg-transparent border-none focus:ring-0 text-sm text-white w-full opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity ml-2 outline-none"
              />
            </div>
          </div>

          <button className="text-gray-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          
          <button 
            onClick={onOpenSettings}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          {user ? (
            <div className="flex items-center gap-4">
              <button 
                onClick={handleLogout}
                className="hidden md:flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-xs font-black uppercase tracking-widest"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
              
              <div className="flex items-center gap-2 cursor-pointer group">
                <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center overflow-hidden border border-white/10 group-hover:border-white/30 transition-colors">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || ""} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
            >
              <LogIn className="w-4 h-4" />
              Ingresar
            </button>
          )}

          <button 
            className="md:hidden text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-full left-0 w-full bg-black/95 backdrop-blur-xl border-t border-white/10 p-4 flex flex-col gap-4 text-gray-300"
          >
            <button 
              onClick={() => { onSectionChange('home'); setIsMobileMenuOpen(false); }} 
              className={`hover:text-white py-2 text-left ${activeSection === 'home' ? 'text-blue-500' : ''}`}
            >
              Inicio
            </button>
            <button 
              onClick={() => { onSectionChange('movies'); setIsMobileMenuOpen(false); }} 
              className={`hover:text-white py-2 text-left ${activeSection === 'movies' ? 'text-blue-500' : ''}`}
            >
              Películas
            </button>
            <button 
              onClick={() => { onSectionChange('tv'); setIsMobileMenuOpen(false); }} 
              className={`hover:text-white py-2 text-left ${activeSection === 'tv' ? 'text-blue-500' : ''}`}
            >
              Series
            </button>
            <button 
              onClick={() => { onSectionChange('new'); setIsMobileMenuOpen(false); }} 
              className={`hover:text-white py-2 text-left ${activeSection === 'new' ? 'text-blue-500' : ''}`}
            >
              Novedades
            </button>
            <button 
              onClick={() => { onSectionChange('watchlist'); setIsMobileMenuOpen(false); }} 
              className={`hover:text-white py-2 text-left ${activeSection === 'watchlist' ? 'text-blue-500' : ''}`}
            >
              Mi Lista
            </button>
            <button 
              onClick={() => { onSectionChange('platforms'); setIsMobileMenuOpen(false); }} 
              className={`hover:text-white py-2 text-left ${activeSection === 'platforms' ? 'text-blue-500' : ''}`}
            >
              Plataformas
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
