import { Movie } from "../types";
import { ChevronLeft, ChevronRight, Play, Plus, ThumbsUp, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { motion } from "motion/react";

interface MovieRowProps {
  key?: string;
  title: string;
  movies: Movie[];
  onMovieClick: (movie: Movie) => void;
  onRemove?: (id: string) => void | Promise<void>;
}

export default function MovieRow({ title, movies, onMovieClick, onRemove }: MovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [isMoved, setIsMoved] = useState(false);

  const handleClick = (direction: "left" | "right") => {
    setIsMoved(true);
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  return (
    <div className="group relative z-10 -mt-2 space-y-2 md:space-y-4 px-4 md:px-12 my-8">
      <h3 className="text-xl font-bold text-white transition-colors duration-200 md:text-2xl tracking-tight">
        {title}
      </h3>
      
      <div className="relative">
        <ChevronLeft
          className={`absolute top-0 bottom-0 left-0 z-40 m-auto h-9 w-9 cursor-pointer opacity-0 transition hover:scale-125 group-hover:opacity-100 ${
            !isMoved && "hidden"
          }`}
          onClick={() => handleClick("left")}
        />

        <div
          ref={rowRef}
          className="flex items-center gap-3 overflow-x-scroll scrollbar-hide px-1 py-4"
        >
          {movies.filter(m => m && m.id).map((movie) => {
            const isWatchlistItem = movie.genres?.includes("Mi Lista");

            return (
              <motion.div
                key={movie.id}
                whileHover={{ scale: 1.05, zIndex: 50 }}
                className="relative min-w-[200px] h-28 cursor-pointer transition-all duration-200 md:min-w-[300px] md:h-44 rounded-md overflow-hidden group/item bg-[#111]"
              >
                <div onClick={() => onMovieClick(movie)} className="absolute inset-0">
                  {movie.backdropPath ? (
                    <img
                      src={movie.backdropPath}
                      className="h-full w-full object-cover transition-opacity group-hover/item:opacity-40"
                      alt={movie.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.style.backgroundColor = '#1a1a1a';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center">
                       <Play className="w-8 h-8 text-white/10" />
                    </div>
                  )}
                </div>
                
                <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 transition-all group-hover/item:opacity-100 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none">
                  <p className="text-sm md:text-base font-black text-white truncate mb-3 tracking-tight">{movie.title}</p>
                  <div className="flex items-center gap-1.5 pointer-events-auto">
                    <button 
                      onClick={() => onMovieClick(movie)}
                      className="flex items-center justify-center p-2 rounded-full bg-white text-black hover:bg-gray-200 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                    
                    {isWatchlistItem && onRemove ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(movie.id);
                        }}
                        className="flex items-center justify-center p-2 rounded-full bg-gray-800/80 border border-white/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-xl"
                        title="Quitar de Mi Lista"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button className="flex items-center justify-center p-2 rounded-full bg-gray-800/80 border border-white/10 text-white hover:bg-white hover:text-black transition-all">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                    
                    <button className="flex items-center justify-center p-2 rounded-full bg-gray-800/80 border border-white/10 text-white hover:border-white transition-all">
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <ChevronRight
          className="absolute top-0 bottom-0 right-0 z-40 m-auto h-9 w-9 cursor-pointer opacity-0 transition hover:scale-125 group-hover:opacity-100"
          onClick={() => handleClick("right")}
        />
      </div>
    </div>
  );
}
