import { X, Plus, Globe, Link, Image as ImageIcon, Play } from "lucide-react";
import { StreamingService, WatchlistItem } from "../types";
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import axios from "axios";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddService: (service: StreamingService) => void;
  onAddWatchlist: (item: WatchlistItem) => void;
  existingServices: StreamingService[];
}

export default function SettingsModal({ isOpen, onClose, onAddService, onAddWatchlist, existingServices }: SettingsModalProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [logo, setLogo] = useState("");

  const [movieTitle, setMovieTitle] = useState("");
  const [movieUrl, setMovieUrl] = useState("");
  const [moviePoster, setMoviePoster] = useState("");
  const [movieGenre, setMovieGenre] = useState("Acción");
  const [movieType, setMovieType] = useState<'web' | 'video'>('web');
  const [movieMediaType, setMovieMediaType] = useState<'movie' | 'tv'>('movie');
  const [activeTab, setActiveTab] = useState<"services" | "watchlist">("services");

  const AVAILABLE_GENRES = [
    "Acción", "Aventura", "Animación", "Comedia", "Crimen", 
    "Documental", "Drama", "Familia", "Fantasía", "Historia", 
    "Terror", "Música", "Misterio", "Romance", "Ciencia Ficción", 
    "Superhéroes", "Suspenso", "Bélica", "Western"
  ];

  const handlePasteImage = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              setMoviePoster(event.target.result as string);
            }
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  const handleSubmitService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;

    const newService: StreamingService = {
      id: `custom-${Date.now()}`,
      name,
      url: url.startsWith("http") ? url : `https://${url}`,
      logo: logo || "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=100&q=80",
      category: "Personal",
      allowIframe: true
    };

    onAddService(newService);
    setName("");
    setUrl("");
    setLogo("");
  };

  const handleSubmitMovie = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movieTitle || !movieUrl) return;

    const newItem: WatchlistItem = {
      id: `movie-${Date.now()}`,
      title: movieTitle,
      url: movieUrl.startsWith("http") ? movieUrl : `https://${movieUrl}`,
      source: new URL(movieUrl.startsWith("http") ? movieUrl : `https://${movieUrl}`).hostname,
      addedAt: new Date().toISOString(),
      posterUrl: moviePoster || (movieType === 'video' ? "https://images.unsplash.com/photo-1542204113-e93847e2124b?w=800&q=80" : "https://images.unsplash.com/photo-1485081666276-03999829d3c0?w=800&q=80"),
      contentType: movieType,
      genres: [movieGenre],
      mediaType: movieMediaType
    };

    onAddWatchlist(newItem);
    setMovieTitle("");
    setMovieUrl("");
    setMoviePoster("");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-[#111] border border-white/5 rounded-xl shadow-2xl p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-white uppercase tracking-tighter">Configuración</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex gap-4 border-b border-white/5 mb-8">
            <button 
              onClick={() => setActiveTab("services")}
              className={`pb-4 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === "services" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-500 hover:text-white"}`}
            >
              Plataformas
            </button>
            <button 
              onClick={() => setActiveTab("watchlist")}
              className={`pb-4 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === "watchlist" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-500 hover:text-white"}`}
            >
              Mi Lista
            </button>
          </div>

          <div className="space-y-8">
            {activeTab === "services" ? (
              <>
                <section>
                  <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-4">Añadir Nueva Plataforma</h3>
                  <form onSubmit={handleSubmitService} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase font-bold px-1">Nombre del Servicio</label>
                      <div className="flex items-center bg-black border border-white/10 rounded px-3 py-2.5 focus-within:border-blue-500/50 transition-colors">
                        <Globe className="w-4 h-4 text-gray-600 mr-2" />
                        <input 
                          type="text" 
                          value={name} 
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ej: HBO Max" 
                          className="bg-transparent border-none focus:ring-0 text-sm text-white w-full outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase font-bold px-1">Enlace Directo (URL)</label>
                      <div className="flex items-center bg-black border border-white/10 rounded px-3 py-2.5 focus-within:border-blue-500/50 transition-colors">
                        <Link className="w-4 h-4 text-gray-600 mr-2" />
                        <input 
                          type="text" 
                          value={url} 
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="www.hbo.com" 
                          className="bg-transparent border-none focus:ring-0 text-sm text-white w-full outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase font-bold px-1">URL del Logo (Opcional)</label>
                      <div className="flex items-center bg-black border border-white/10 rounded px-3 py-2.5 focus-within:border-blue-500/50 transition-colors">
                        <ImageIcon className="w-4 h-4 text-gray-600 mr-2" />
                        <input 
                          type="text" 
                          value={logo} 
                          onChange={(e) => setLogo(e.target.value)}
                          placeholder="https://..." 
                          className="bg-transparent border-none focus:ring-0 text-sm text-white w-full outline-none"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded transition-colors text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Guardar Plataforma
                    </button>
                  </form>
                </section>

                <section>
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Plataformas Actuales</h3>
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                    {existingServices.map(s => (
                      <div key={s.id} className="flex items-center justify-between bg-white/5 p-2 rounded border border-white/5">
                        <div className="flex items-center gap-3">
                          <img src={s.logo} className="w-6 h-6 rounded object-cover" alt="" />
                          <span className="text-sm font-medium text-gray-300">{s.name}</span>
                        </div>
                        <span className="text-[10px] text-gray-600">{s.category}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            ) : (
              <section>
                <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-4">Añadir a mi Lista</h3>
                
                <form onSubmit={handleSubmitMovie} className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                       <label className="text-[10px] text-gray-500 uppercase font-bold px-1">Categoría</label>
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => setMovieMediaType('movie')}
                          className={`flex-1 py-1.5 text-[10px] font-bold rounded border transition-all ${movieMediaType === 'movie' ? 'bg-white text-black border-white' : 'border-white/10 text-gray-500 hover:border-white/20'}`}
                        >
                          PELÍCULA
                        </button>
                        <button 
                          type="button"
                          onClick={() => setMovieMediaType('tv')}
                          className={`flex-1 py-1.5 text-[10px] font-bold rounded border transition-all ${movieMediaType === 'tv' ? 'bg-white text-black border-white' : 'border-white/10 text-gray-500 hover:border-white/20'}`}
                        >
                          SERIE
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase font-bold px-1">Tipo de Contenido</label>
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => setMovieType('web')}
                          className={`flex-1 py-2 text-[10px] font-bold rounded border transition-all ${movieType === 'web' ? 'bg-blue-600 border-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.3)]' : 'border-white/10 text-gray-500 hover:border-white/20'}`}
                        >
                          WEB
                        </button>
                        <button 
                          type="button"
                          onClick={() => setMovieType('video')}
                          className={`flex-1 py-2 text-[10px] font-bold rounded border transition-all ${movieType === 'video' ? 'bg-blue-600 border-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.3)]' : 'border-white/10 text-gray-500 hover:border-white/20'}`}
                        >
                          VÍDEO
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase font-bold px-1">Género Principal</label>
                      <select 
                        value={movieGenre}
                        onChange={(e) => setMovieGenre(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded px-3 py-2 text-xs text-white appearance-none focus:border-blue-500/50 outline-none transition-colors"
                      >
                        {AVAILABLE_GENRES.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-bold px-1">Título de la Película</label>
                    <div className="flex items-center bg-black border border-white/10 rounded px-3 py-2.5 focus-within:border-blue-500/50 transition-colors">
                      <input 
                        type="text" 
                        value={movieTitle} 
                        onChange={(e) => setMovieTitle(e.target.value)}
                        placeholder="Ej: Joker 2" 
                        className="bg-transparent border-none focus:ring-0 text-sm text-white w-full outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-bold px-1">Enlace (URL)</label>
                    <div className="flex items-center bg-black border border-white/10 rounded px-3 py-2.5 focus-within:border-blue-500/50 transition-colors">
                      <Link className="w-4 h-4 text-gray-600 mr-2" />
                      <input 
                        type="text" 
                        value={movieUrl} 
                        onChange={(e) => setMovieUrl(e.target.value)}
                        placeholder={movieType === 'video' ? "https://servidor.com/pelicula.m3u8" : "https://blogdepelis.net/..."}
                        className="bg-transparent border-none focus:ring-0 text-sm text-white w-full outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-bold px-1">Poster URL (o Pega una Imagen)</label>
                    <div className="flex items-center bg-black border border-white/10 rounded px-3 py-2.5 focus-within:border-blue-500/50 transition-colors relative">
                      <ImageIcon className="w-4 h-4 text-gray-600 mr-2" />
                      <input 
                        type="text" 
                        value={moviePoster} 
                        onChange={(e) => setMoviePoster(e.target.value)}
                        onPaste={handlePasteImage}
                        placeholder="Pega URL o imagen aquí" 
                        className="bg-transparent border-none focus:ring-0 text-sm text-white w-full outline-none"
                      />
                      {moviePoster.startsWith('data:image') && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-8 rounded overflow-hidden border border-white/20">
                          <img src={moviePoster} className="w-full h-full object-cover" alt="" />
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded transition-colors text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Añadir a Mi Lista
                  </button>
                </form>
              </section>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
