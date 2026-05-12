/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import MovieRow from "./components/MovieRow";
import ServiceRow from "./components/ServiceRow";
import MovieDetails from "./components/MovieDetails";
import VideoPlayer from "./components/VideoPlayer";
import SettingsModal from "./components/SettingsModal";
import Catalog from "./components/Catalog";
import { FEATURED_MOVIES, GENRES, STREAMING_SERVICES } from "./constants";
import { Movie, StreamingService, WatchlistItem } from "./types";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, onSnapshot, setDoc, deleteDoc, query, orderBy, limit, getDocFromServer } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "./lib/firebaseUtils";

export default function App() {
  const [user, setUser] = useState(auth.currentUser);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [playingMovie, setPlayingMovie] = useState<Movie | null>(null);
  const [playingExternalUrl, setPlayingExternalUrl] = useState<string | null>(null);
  const [playingContentType, setPlayingContentType] = useState<'web' | 'video'>('web');
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingHistory, setViewingHistory] = useState<string[]>([]);
  const [services, setServices] = useState<StreamingService[]>(STREAMING_SERVICES);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [navigationSection, setNavigationSection] = useState<'home' | 'movies' | 'tv' | 'new' | 'watchlist' | 'platforms'>('home');
  const [currentView, setCurrentView] = useState<'home' | 'catalog'>('home');

  const mappedWatchlist: Movie[] = watchlist.map(item => ({
    id: item.id || `custom-${item.title}-${Date.now()}`,
    title: item.title || "Sin título",
    overview: item.description || `Contenido guardado de ${item.source || 'fuente externa'}.`,
    posterPath: item.posterUrl || "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&q=80",
    backdropPath: item.posterUrl || "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&q=80",
    releaseDate: item.addedAt?.includes('T') ? item.addedAt.split('T')[0] : (item.addedAt || new Date().toISOString()),
    voteAverage: 10,
    genres: ["Mi Lista", ...(item.genres || [item.contentType === 'video' ? "Vídeo Directo" : "Ciencia Ficción"])], 
    streamingUrl: item.url,
    mediaType: item.mediaType || 'movie'
  }));

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();

    return onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setWatchlist([]);
      setServices(STREAMING_SERVICES);
      setViewingHistory([]);
      return;
    }

    const watchlistPath = `users/${user.uid}/watchlist`;
    const unsubWatchlist = onSnapshot(collection(db, watchlistPath), (snapshot) => {
      const items = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          ...data, 
          id: data.id || doc.id // Asegurar que el ID esté presente
        } as WatchlistItem;
      });
      
      setWatchlist(items.sort((a, b) => {
        const dateA = a.addedAt ? new Date(a.addedAt).getTime() : 0;
        const dateB = b.addedAt ? new Date(b.addedAt).getTime() : 0;
        return dateB - dateA;
      }));
    }, error => handleFirestoreError(error, OperationType.GET, watchlistPath));

    const servicesPath = `users/${user.uid}/services`;
    const unsubServices = onSnapshot(collection(db, servicesPath), (snapshot) => {
      const customServices = snapshot.docs.map(doc => doc.data() as StreamingService);
      setServices([...STREAMING_SERVICES, ...customServices]);
    }, error => handleFirestoreError(error, OperationType.GET, servicesPath));

    const historyPath = `users/${user.uid}/history`;
    const unsubHistory = onSnapshot(query(collection(db, historyPath), orderBy('viewedAt', 'desc'), limit(5)), (snapshot) => {
      const historyTitles = snapshot.docs.map(doc => doc.data().title as string);
      if (historyTitles.length > 0) {
        setViewingHistory(historyTitles);
      }
    }, error => handleFirestoreError(error, OperationType.GET, historyPath));

    return () => {
      unsubWatchlist();
      unsubServices();
      unsubHistory();
    };
  }, [user]);

  const handleAddWatchlist = async (item: WatchlistItem) => {
    if (!user) return;
    const path = `users/${user.uid}/watchlist/${item.id}`;
    try {
      await setDoc(doc(db, path), item);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleQuickAdd = async (movie: Partial<Movie>) => {
    if (!user) return;
    const id = `movie-${Date.now()}`;
    const newItem: WatchlistItem = {
        id,
        title: movie.title || "Nueva Película",
        url: movie.streamingUrl || "",
        source: movie.streamingUrl ? new URL(movie.streamingUrl).hostname : "Desconocido",
        addedAt: new Date().toISOString(),
        posterUrl: movie.posterPath || "",
        contentType: (movie.streamingUrl?.includes('.m3u8') || movie.streamingUrl?.includes('/api/proxy')) ? 'video' : 'web',
        genres: movie.genres,
        mediaType: movie.mediaType
      };
    
    const path = `users/${user.uid}/watchlist/${id}`;
    try {
      await setDoc(doc(db, path), newItem);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleRemoveWatchlist = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/watchlist/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleAddService = async (newService: StreamingService) => {
    if (!user) return;
    const path = `users/${user.uid}/services/${newService.id}`;
    try {
      await setDoc(doc(db, path), newService);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handlePlay = async (movie: Movie) => {
    if (movie.streamingUrl) {
      handlePlayExternal({
        id: movie.id || `play-${Date.now()}`,
        title: movie.title,
        url: movie.streamingUrl,
        source: new URL(movie.streamingUrl).hostname,
        addedAt: new Date().toISOString(),
        posterUrl: movie.posterPath,
        contentType: movie.streamingUrl.includes('.m3u8') ? 'video' : 'web'
      });
      return;
    }
    
    setPlayingMovie(movie);
    if (!viewingHistory.includes(movie.title)) {
      setViewingHistory(prev => [movie.title, ...prev.slice(0, 4)]);
      if (user) {
        const historyId = movie.id || `history-${Date.now()}`;
        const path = `users/${user.uid}/history/${historyId}`;
        try {
          await setDoc(doc(db, path), {
            title: movie.title,
            viewedAt: new Date().toISOString()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, path);
        }
      }
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query.toLowerCase());
  };

  const handleNavigate = (section: 'home' | 'movies' | 'tv' | 'new' | 'watchlist' | 'platforms') => {
    setNavigationSection(section);
    setCurrentView('home'); // Asegurar que volvemos al inicio para ver las filas filtradas
    setSearchQuery(""); 
  };

  const allAvailableContent = (() => {
    const contentMap = new Map<string, Movie>();
    
    // Primero añadimos las destacadas por defecto
    FEATURED_MOVIES.forEach(m => {
      contentMap.set(m.title.toLowerCase().trim(), m);
    });
    
    // Luego sobrescribimos con los elementos de la watchlist del usuario (que tienen metadatos personalizados como el streamingUrl)
    mappedWatchlist.forEach(m => {
      contentMap.set(m.title.toLowerCase().trim(), m);
    });
    
    return Array.from(contentMap.values());
  })();

  const filteredBySection = allAvailableContent.filter(m => {
    if (navigationSection === 'movies') return m.mediaType === 'movie';
    if (navigationSection === 'tv') return m.mediaType === 'tv';
    if (navigationSection === 'watchlist') return watchlist.some(w => w.title.toLowerCase().trim() === m.title.toLowerCase().trim());
    return true; 
  }).sort((a, b) => {
    if (navigationSection === 'new') {
        const valA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
        const valB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
        const dateA = isNaN(valA) ? 0 : valA;
        const dateB = isNaN(valB) ? 0 : valB;
        return dateB - dateA;
    }
    // Si estamos en Home, poner las de la watchlist primero para que no parezca que desaparecen
    const isAInWatchlist = watchlist.some(w => w.title.toLowerCase().trim() === a.title.toLowerCase().trim());
    const isBInWatchlist = watchlist.some(w => w.title.toLowerCase().trim() === b.title.toLowerCase().trim());
    if (isAInWatchlist && !isBInWatchlist) return -1;
    if (!isAInWatchlist && isBInWatchlist) return 1;
    return 0;
  });

  const displayMovies = searchQuery 
    ? allAvailableContent.filter(m => m.title.toLowerCase().includes(searchQuery))
    : filteredBySection;

  const filteredFeatured = displayMovies.filter(m => 
    m.title.toLowerCase().includes(searchQuery) ||
    m.overview.toLowerCase().includes(searchQuery)
  );

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchQuery)
  );

  const handlePlayExternal = (param: WatchlistItem | string) => {
    const isItem = typeof param !== 'string';
    const url = isItem ? (param as WatchlistItem).url : (param as string);
    
    // Simplificado: Abrir siempre en ventana nueva para asegurar reproducción directa desde la fuente
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-600 selection:text-white">
      <Navbar 
        onSearch={handleSearch} 
        onOpenSettings={() => setIsSettingsOpen(true)} 
        activeSection={navigationSection}
        onSectionChange={handleNavigate}
      />

      {/* View Switcher Pill */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center bg-black/40 backdrop-blur-3xl border border-white/10 rounded-full p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <button 
          onClick={() => setCurrentView('home')}
          className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all ${currentView === 'home' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-gray-500 hover:text-white'}`}
        >
          Inicio
        </button>
        <button 
          onClick={() => setCurrentView('catalog')}
          className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all ${currentView === 'catalog' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-gray-500 hover:text-white'}`}
        >
          Explorar
        </button>
      </div>

      {!playingMovie && !playingExternalUrl ? (
        <main className="relative pb-32 transition-all duration-700">
          {currentView === 'home' ? (
            <>
              {searchQuery === "" && (
                <Hero 
                  movie={displayMovies[0]} 
                  onPlay={handlePlay} 
                  onInfo={handleMovieClick}
                />
              )}

              <div className={`${searchQuery === "" ? "-mt-32" : "pt-24"} relative z-10 transition-all duration-500`}>
                {filteredServices.length > 0 && searchQuery !== "" && (
                  <ServiceRow 
                    title="Servicios de Streaming" 
                    services={filteredServices} 
                    onPlayExternal={handlePlayExternal}
                  />
                )}

                {searchQuery === "" && navigationSection === 'platforms' ? (
                  <ServiceRow 
                    title="Catálogo de Plataformas" 
                    services={services} 
                    onPlayExternal={handlePlayExternal}
                  />
                ) : (
                  <>
                    <MovieRow 
                      title={searchQuery ? "Resultados de búsqueda" : (navigationSection === 'watchlist' ? "Mi Lista de Contenidos" : (mappedWatchlist.length > 0 ? "Tus Películas Destacadas" : "Películas Destacadas"))} 
                      movies={displayMovies} 
                      onMovieClick={handleMovieClick}
                      onRemove={handleRemoveWatchlist}
                    />

                    {searchQuery === "" && navigationSection !== 'watchlist' && (
                      <>
                        {GENRES.map(genre => {
                          const genreMovies = displayMovies.filter(m => m.genres.includes(genre));
                          if (genreMovies.length === 0) return null;
                          
                          return (
                            <MovieRow 
                              key={genre}
                              title={genre} 
                              movies={genreMovies} 
                              onMovieClick={handleMovieClick}
                              onRemove={handleRemoveWatchlist}
                            />
                          );
                        })}

                        <ServiceRow 
                          title="Plataformas Disponibles" 
                          services={services} 
                          onPlayExternal={handlePlayExternal}
                        />
                      </>
                    )}
                  </>
                )}
                
                {navigationSection === 'watchlist' && displayMovies.length === 0 && (
                   <div className="py-24 text-center">
                      <p className="text-gray-500 italic mb-4 text-lg">Tu lista está vacía actualmente.</p>
                      <button 
                        onClick={() => setCurrentView('catalog')}
                        className="px-8 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                      >
                        Explorar Catálogo
                      </button>
                   </div>
                )}
              </div>
            </>
          ) : (
            <div className="pt-32 px-4 md:px-12 max-w-7xl mx-auto">
              <Catalog 
                onAddToList={handleQuickAdd} 
                onRemoveFromList={handleRemoveWatchlist}
                onPreview={(m) => setSelectedMovie(m)} 
                watchlist={watchlist}
              />
            </div>
          )}
          
          {searchQuery !== "" && filteredFeatured.length === 0 && (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <p className="text-gray-400 text-lg italic">No se encontraron películas para "{searchQuery}"</p>
              <button 
                onClick={() => setSearchQuery("")}
                className="text-blue-500 font-bold hover:underline"
              >
                Clear search
              </button>
            </div>
          )}
        </main>
      ) : (
        <VideoPlayer 
          movie={playingMovie || undefined} 
          externalUrl={playingExternalUrl || undefined}
          contentType={playingContentType}
          onBack={() => {
            setPlayingMovie(null);
            setPlayingExternalUrl(null);
            setPlayingContentType('web');
          }} 
        />
      )}

      <MovieDetails 
        movie={selectedMovie} 
        onClose={() => setSelectedMovie(null)} 
        onPlay={handlePlay}
      />

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onAddService={handleAddService}
        onAddWatchlist={handleAddWatchlist}
        existingServices={services}
      />

      <footer className="px-4 md:px-20 py-12 border-t border-white/5 bg-black/40 text-gray-500 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-2">
            <h4 className="text-white font-black tracking-widest uppercase text-xs">CineSphere</h4>
            <p>© 2026 CineSphere Platform. All Rights Reserved.</p>
          </div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Politica de Seguridad</a>
            <a href="#" className="hover:text-white transition-colors">Términos de Uso</a>
            <a href="#" className="hover:text-white transition-colors">Ayuda</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

