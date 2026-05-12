import { X, Play, Plus, ThumbsUp, Volume2 } from "lucide-react";
import { Movie } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";

interface MovieDetailsProps {
  movie: Movie | null;
  onClose: () => void;
  onPlay: (movie: Movie) => void;
}

export default function MovieDetails({ movie, onClose, onPlay }: MovieDetailsProps) {
  if (!movie) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 py-8 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl overflow-hidden rounded-xl bg-[#181818] shadow-2xl"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="relative aspect-video w-full overflow-hidden">
            <img
              src={movie.backdropPath}
              className="h-full w-full object-cover"
              alt={movie.title}
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent" />
            
            <div className="absolute bottom-10 left-10 space-y-6">
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter md:text-5xl">
                {movie.title}
              </h2>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => onPlay(movie)}
                  className="flex items-center gap-2 rounded bg-white px-8 py-3 text-lg font-bold text-black transition hover:bg-white/90"
                >
                  <Play className="fill-black" />
                  Reproducir
                </button>
                <div className="flex items-center gap-2">
                  <button className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/40 text-white hover:border-white transition-colors">
                    <Plus />
                  </button>
                  <button className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/40 text-white hover:border-white transition-colors">
                    <ThumbsUp />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="absolute bottom-10 right-10">
               <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white">
                 <Volume2 className="h-5 w-5" />
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-10">
            <div className="md:col-span-2 space-y-6">
              <div className="flex items-center gap-3 text-sm font-semibold">
                <span className="text-blue-500">{Math.round(movie.voteAverage * 10)}% Match</span>
                <span className="text-gray-400">{movie.releaseDate.split("-")[0]}</span>
                <span className="border border-gray-400 px-1 text-[10px] text-gray-400 rounded-sm">4K HDR</span>
              </div>

              <p className="text-lg leading-relaxed text-gray-300">
                {movie.overview}
              </p>
            </div>

            <div className="space-y-6 text-sm">
              <div>
                <span className="text-gray-500">Géneros:</span>{" "}
                <span className="text-gray-200">{movie.genres.join(", ")}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
