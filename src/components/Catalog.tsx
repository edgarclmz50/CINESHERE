import { Search, Plus, Play, Info, TrendingUp, Film, Loader2, X, Trash2, Check } from "lucide-react";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Movie, WatchlistItem } from "../types";
import axios from "axios";

interface CatalogProps {
  onAddToList: (movie: Partial<Movie>) => void;
  onRemoveFromList: (id: string) => void;
  onPreview: (movie: Movie) => void;
  watchlist: WatchlistItem[];
}

interface MovieCardProps {
  movie: Movie;
  idx: number;
  isAdded: boolean;
  onPreview: (m: Movie) => void;
  onAddToList: (m: Partial<Movie>) => void;
  onRemoveFromList: () => void;
  key?: React.Key;
}

function MovieCard({ movie, idx, isAdded, onPreview, onAddToList, onRemoveFromList }: MovieCardProps) {
  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAdded) {
      onRemoveFromList(); 
      return;
    }
    onAddToList(movie);
  };

  return (
    <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ delay: idx * 0.05 }}
        className="group/card relative bg-white/5 border border-white/5 rounded-xl overflow-hidden hover:border-blue-500/30 transition-all"
    >
        <div className="aspect-[2/3] relative">
            <img 
                src={movie.posterPath} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110" 
                alt={movie.title} 
                referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
            
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-black text-blue-400 border border-white/10">
                {movie.voteAverage.toFixed(1)} TMDB
            </div>

            {isAdded && (
              <div className="absolute top-3 left-3 bg-green-500 text-white p-1 rounded-full shadow-lg">
                <Check className="w-3 h-3" />
              </div>
            )}
        </div>

        <div className="p-4 space-y-4">
            <div className="space-y-1">
                <h3 className="text-sm font-black uppercase truncate text-white">{movie.title}</h3>
                <div className="flex gap-2">
                    {movie.genres.slice(0, 2).map(g => (
                        <span key={g} className="text-[8px] text-gray-500 font-bold uppercase">{g}</span>
                    ))}
                </div>
            </div>

            <div className="flex gap-2">
                <button 
                    onClick={() => onPreview(movie)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase py-2 rounded transition-colors flex items-center justify-center gap-2"
                >
                    <Info className="w-3 h-3" />
                    Info
                </button>
                <button 
                    onClick={handleAction}
                    className={`flex-1 text-[10px] font-black uppercase py-2 rounded transition-all flex items-center justify-center gap-2 ${
                      isAdded 
                        ? 'bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20' 
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                    }`}
                >
                    {isAdded ? (
                      <Trash2 className="w-3 h-3" />
                    ) : (
                      <Plus className="w-3 h-3" />
                    )}
                    {isAdded ? 'Quitar' : 'Añadir'}
                </button>
            </div>
        </div>
    </motion.div>
  );
}

export default function Catalog({ onAddToList, onRemoveFromList, onPreview, watchlist }: CatalogProps) {
  const [search, setSearch] = useState("");
  const [activeGenre, setActiveGenre] = useState("Todos");
  const [activeType, setActiveType] = useState<"all" | "movie" | "tv">("all");
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  const genres = [
    "Todos", 
    "Acción", 
    "Aventura", 
    "Animación", 
    "Comedia", 
    "Crimen", 
    "Documental", 
    "Drama", 
    "Familia", 
    "Fantasía", 
    "Historia", 
    "Terror", 
    "Música", 
    "Misterio", 
    "Romance", 
    "Ciencia Ficción", 
    "Superhéroes",
    "Suspenso", 
    "Bélica", 
    "Western"
  ];

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await axios.get("/api/catalog/latest");
        setTrendingMovies(response.data);
      } catch (err) {
        console.error("Catalog error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  const filteredMovies = trendingMovies.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase());
    const matchesGenre = activeGenre === "Todos" || m.genres.some(g => g.toLowerCase() === activeGenre.toLowerCase());
    const matchesType = activeType === "all" || m.mediaType === activeType;
    return matchesSearch && matchesGenre && matchesType;
  });

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
            <h2 className="text-3xl font-black uppercase tracking-tighter italic flex items-center gap-3">
                <Film className="w-8 h-8 text-blue-500" />
                Explorar Catálogo
            </h2>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Estrenos Mundiales gestionados por CineSphere</p>
        </div>

        <div className="relative group/search max-w-md w-full">
            <div className="absolute inset-0 bg-blue-500/5 blur-xl group-focus-within/search:bg-blue-500/20 transition-all rounded-full" />
            <div className="relative flex items-center bg-white/5 border border-white/10 rounded-full px-5 py-3 focus-within:border-blue-500/50 transition-all shadow-2xl">
                <Search className="w-5 h-5 text-gray-500 mr-3 shrink-0" />
                <input 
                   id="catalog-search-input"
                   type="text" 
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                   placeholder="Buscar en el catálogo global..." 
                   className="bg-transparent border-none focus:outline-none text-sm text-white w-full font-medium placeholder:text-gray-600"
                />
                <AnimatePresence>
                  {search && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => setSearch("")}
                      className="p-1 hover:bg-white/10 rounded-full transition-colors ml-2"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </motion.button>
                  )}
                </AnimatePresence>
            </div>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
            <button
                onClick={() => setActiveType("all")}
                className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeType === "all" ? "bg-white text-black shadow-xl" : "bg-white/5 text-gray-500 hover:text-white"}`}
            >
                Todo
            </button>
            <button
                onClick={() => setActiveType("movie")}
                className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeType === "movie" ? "bg-white text-black shadow-xl" : "bg-white/5 text-gray-500 hover:text-white"}`}
            >
                Películas
            </button>
            <button
                onClick={() => setActiveType("tv")}
                className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeType === "tv" ? "bg-white text-black shadow-xl" : "bg-white/5 text-gray-500 hover:text-white"}`}
            >
                Series
            </button>
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-4">
            {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setActiveGenre(genre)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                activeGenre === genre
                  ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                  : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:text-white"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
        <div className="absolute right-0 top-0 bottom-4 w-20 bg-gradient-to-l from-[#050505] to-transparent pointer-events-none" />
      </div>
     </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
            {filteredMovies.map((movie, idx) => {
                const watchlistEntry = watchlist.find(w => w.title.toLowerCase() === movie.title.toLowerCase());
                
                return (
                  <MovieCard 
                    key={movie.id}
                    movie={movie}
                    idx={idx}
                    isAdded={!!watchlistEntry}
                    onPreview={onPreview}
                    onAddToList={onAddToList}
                    onRemoveFromList={() => {
                        if (watchlistEntry) onRemoveFromList(watchlistEntry.id);
                    }}
                  />
                );
            })}
        </AnimatePresence>

        {filteredMovies.length === 0 && !loading && (
            <div className="col-span-full py-20 flex flex-col items-center gap-4 text-center">
                <Film className="w-16 h-16 text-gray-800" />
                <div className="space-y-1">
                    <h4 className="text-xl font-bold text-gray-500">No se encontraron resultados</h4>
                    <p className="text-sm text-gray-700">Prueba con términos más generales o explora las tendencias.</p>
                </div>
            </div>
        )}

        {loading && (
          <div className="col-span-full py-20 flex flex-col items-center gap-4">
             <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
             <p className="text-[10px] font-black uppercase text-gray-500 tracking-[0.3em]">Conectando con el catálogo global...</p>
          </div>
        )}
      </div>

      <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-8 flex flex-col md:flex-row items-center gap-8">
         <div className="w-16 h-14 bg-blue-500 rounded-lg flex items-center justify-center">
            <Plus className="w-8 h-8 text-white" />
         </div>
         <div className="flex-1 text-center md:text-left space-y-1">
            <h4 className="text-lg font-black uppercase italic text-blue-500">¿Tienes otros enlaces?</h4>
            <p className="text-xs text-gray-400 font-medium">Puedes añadir cualquier película o serie manualmente a tu lista personal desde el menú de Configuración.</p>
         </div>
         <button 
            className="px-8 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-blue-500 transition-all shadow-xl"
         >
            Añadir Contenido
         </button>
      </div>
    </div>
  );
}
