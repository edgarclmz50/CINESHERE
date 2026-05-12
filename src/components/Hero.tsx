import { Play, Info, Plus } from "lucide-react";
import { Movie } from "../types";
import { motion } from "motion/react";

interface HeroProps {
  movie: Movie;
  onPlay: (movie: Movie) => void;
  onInfo: (movie: Movie) => void;
}

export default function Hero({ movie, onPlay, onInfo }: HeroProps) {
  if (!movie) return null;

  return (
    <div className="relative h-[80vh] w-full overflow-hidden">
      {/* Background with gradient overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000"
        style={{ backgroundImage: `url(${movie.backdropPath})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative flex h-full flex-col justify-center px-4 md:px-20 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-2xl"
        >
          <div className="flex items-center gap-2 mb-4">
             <span className="text-[11px] font-bold text-blue-500 tracking-[0.2em] uppercase">TU CINE PERSONAL</span>
          </div>
          
          <h2 className="mb-4 text-5xl font-bold text-white md:text-7xl leading-[1.1] tracking-tight">
            {movie.title}
          </h2>
          
          <p className="mb-8 text-base text-gray-300 line-clamp-3 md:text-lg max-w-xl font-normal leading-relaxed">
            {movie.overview}
          </p>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => onPlay(movie)}
              className="flex items-center gap-2 rounded-sm bg-white px-8 py-3 text-sm font-bold text-black transition-all hover:bg-gray-200 active:scale-95"
            >
              <Play className="w-4 h-4 fill-black" />
              WATCH NOW
            </button>
            <button
              onClick={() => onInfo(movie)}
              className="flex items-center gap-2 rounded-sm bg-white/10 backdrop-blur-md px-8 py-3 text-sm font-bold text-white transition-all hover:bg-white/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              WATCHLIST
            </button>
          </div>
        </motion.div>
      </div>
      
      {/* Visual Accents */}
      <div className="absolute bottom-10 right-20 hidden md:block">
        <div className="text-white/40 font-mono text-sm tracking-widest uppercase flex items-center gap-4">
          <span className="w-12 h-[1px] bg-white/20"></span>
          Ultima Incorporación
        </div>
      </div>
    </div>
  );
}
