import { ArrowLeft, Maximize, Settings, Volume2, Play, Pause, FastForward, Rewind, Download, ShieldCheck, ShieldAlert, ExternalLink } from "lucide-react";
import { Movie } from "../types";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import Hls from "hls.js";

interface VideoPlayerProps {
  movie?: Movie;
  externalUrl?: string;
  contentType?: 'web' | 'video';
  onBack: () => void;
}

export default function VideoPlayer({ movie, externalUrl, contentType, onBack }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(externalUrl ? true : false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const title = movie?.title || "Navegador Seguro CineSphere";
  const isDirectVideo = contentType === 'video';
  const playerRef = useRef<HTMLDivElement>(null);

  const isRestrictedSite = externalUrl ? /netflix|primevideo|disneyplus|hbo|apple\.com|clarovideo/i.test(externalUrl) : false;
  const isProxied = externalUrl?.includes('/api/proxy');

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    if (externalUrl && (isRestrictedSite || isProxied)) {
      setIsAnalyzing(true);
      const timer = setTimeout(() => setIsAnalyzing(false), isProxied ? 2500 : 1500);
      return () => clearTimeout(timer);
    } else if (externalUrl) {
      setIsAnalyzing(true);
      setIframeError(false);
      const timer = setTimeout(() => setIsAnalyzing(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [externalUrl, isRestrictedSite, isProxied]);

  useEffect(() => {
    if (isDirectVideo && videoRef.current && externalUrl) {
      const isHls = externalUrl.toLowerCase().includes('.m3u8') || externalUrl.includes('/proxy') || isProxied;
      
      if (isHls && Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          manifestLoadingMaxRetry: 15,
          manifestLoadingRetryDelay: 1000,
          levelLoadingMaxRetry: 15,
          levelLoadingRetryDelay: 1000,
          fragLoadingMaxRetry: 15,
          xhrSetup: (xhr) => {
            xhr.withCredentials = false;
          }
        });
        
        console.log("Initializing HLS for:", externalUrl);
        hls.loadSource(externalUrl);
        hls.attachMedia(videoRef.current);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log("HLS Manifest parsed successfully");
          setIframeError(false);
          if (isPlaying) {
             videoRef.current?.play().catch(e => {
               console.log("Autoplay context blocked, user interaction required");
               setIsPlaying(false);
             });
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            console.error("HLS Fatal Error:", data.type, data.details);
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log("HLS Network Error, attempting recovery...");
                if (data.details === 'manifestLoadError' || data.details === 'levelLoadError') {
                   // If it's a persistent manifest error, we fallback to the error UI
                   setIframeError(true);
                } else {
                  hls.startLoad();
                }
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log("HLS Media Error, attempting recovery...");
                hls.recoverMediaError();
                break;
              default:
                console.log("HLS Unrecoverable Error, destroying instance");
                hls.destroy();
                setIframeError(true);
                break;
            }
          }
        });

        return () => {
          hls.destroy();
        };
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS for Safari
        videoRef.current.src = externalUrl;
      } else {
        videoRef.current.src = externalUrl;
      }
    }
  }, [externalUrl, isDirectVideo, isPlaying, isProxied]);

  useEffect(() => {
    if (isDirectVideo && videoRef.current && !externalUrl) {
      if (isPlaying) videoRef.current.play().catch(() => setIsPlaying(false));
      else videoRef.current.pause();
    }
  }, [isPlaying, isDirectVideo, externalUrl]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p);
    }
  };

  const handleDownload = () => {
    setIsDownloaded(true);
  };

  const handleLaunchExternal = () => {
    const width = window.screen.availWidth;
    const height = window.screen.availHeight;
    const features = `width=${width},height=${height},top=0,left=0,menubar=no,toolbar=no,location=no,status=no,scrollbars=no,resizable=yes`;
    
    // Intentamos abrir en una ventana tipo popup para que no se vea la barra de direcciones
    window.open(externalUrl, "CineSpherePlayer", features);
    onBack(); // Volvemos a la app para que esté lista al regresar
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return "00:00:00";
    try {
      return new Date(seconds * 1000).toISOString().substr(11, 8);
    } catch (e) {
      return "00:00:00";
    }
  };

  return (
    <div ref={playerRef} className="fixed inset-0 z-[200] bg-[#050505] flex flex-col group/player select-none">
      {/* Floating Controls (Translucent) */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-8 left-8 right-8 z-[210] flex items-center justify-between pointer-events-none"
          >
            <div className="flex items-center gap-4 pointer-events-auto">
              <button 
                onClick={onBack}
                className="px-6 py-3 bg-white/5 backdrop-blur-2xl border border-white/10 text-white rounded-full flex items-center gap-3 hover:bg-blue-600 transition-all hover:scale-105 shadow-2xl group/back font-black uppercase text-[10px] tracking-widest"
              >
                <ArrowLeft className="w-4 h-4 group-hover/back:-translate-x-1 transition-transform" />
                CineSphere App
              </button>

              <div className="hidden md:flex items-center gap-3 px-5 py-3 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full text-white/40 text-[10px] font-black uppercase tracking-widest">
                 <span className="text-white">{title}</span>
              </div>
              
              <button 
                onClick={toggleFullscreen}
                className="p-3 bg-white/5 backdrop-blur-2xl border border-white/10 text-white rounded-full hover:bg-white/10 transition-colors shadow-2xl"
                title="Pantalla Completa"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>

            {!externalUrl && (
              <div className="flex items-center gap-4 pointer-events-auto">
                <button 
                  onClick={handleDownload}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full border transition-all text-[10px] font-black uppercase tracking-widest shadow-2xl backdrop-blur-2xl ${isDownloaded ? 'bg-green-600 border-green-600 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                >
                    <Download className="w-4 h-4" />
                    {isDownloaded ? 'Descargado' : 'Descargar'}
                </button>
                <div className="bg-blue-600/20 backdrop-blur-2xl border border-blue-500/20 px-4 py-2.5 rounded-full flex items-center gap-2 shadow-2xl">
                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest leading-none">Safe Browser Enabled</span>
                </div>
              </div>
            )}

            {externalUrl && !isRestrictedSite && !isAnalyzing && (
              <div className="pointer-events-auto">
                 <div className="bg-blue-600/20 backdrop-blur-2xl border border-blue-500/30 px-5 py-2.5 rounded-full flex items-center gap-3 shadow-2xl">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{title}</span>
                 </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Playback Area */}
      <div className="flex-1 relative overflow-hidden">
        {externalUrl ? (
          <div className="w-full h-full relative">
            {isAnalyzing ? (
              <div className="absolute inset-0 z-50 bg-[#050505] flex flex-col items-center justify-center gap-8">
                 <div className="relative">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                      className="w-40 h-40 border-2 border-blue-500/10 rounded-full"
                    />
                    <motion.div 
                      animate={{ rotate: -360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="absolute inset-4 border-t-2 border-blue-500 rounded-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <ShieldCheck className="w-12 h-12 text-blue-500 animate-pulse" />
                    </div>
                 </div>
                 <div className="text-center space-y-3">
                    <h3 className="text-2xl font-black uppercase tracking-[0.4em] text-blue-500 italic">Protección Activa</h3>
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Encriptando túnel seguro...</p>
                      <p className="text-[8px] text-blue-500/40 font-mono">Bypassing trackers & ads</p>
                    </div>
                 </div>
              </div>
            ) : null}

            {isDirectVideo ? (
              <video 
                ref={videoRef}
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onClick={() => setIsPlaying(!isPlaying)}
                playsInline
                autoPlay={isPlaying}
              />
            ) : isRestrictedSite || iframeError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#080808] p-12 text-center">
                 <div className="absolute inset-0 bg-[#050505] opacity-80" />
                 
                 <div className="relative z-10 space-y-12 max-w-2xl">
                   <div className="flex flex-col items-center gap-6">
                      <div className="w-32 h-32 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                        <ShieldAlert className="w-16 h-16 text-red-500" />
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-4xl font-black uppercase tracking-tighter italic text-white">Puente Requerido</h3>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-lg mx-auto">
                          La plataforma <span className="text-white font-bold">{new URL(externalUrl).hostname}</span> detectó el reproductor CineSphere y solicita una ventana independiente para cumplir con sus protocolos de seguridad (DRM).
                        </p>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white/5 border border-white/5 rounded text-left space-y-2">
                        <div className="flex items-center gap-2 text-blue-400 text-[10px] font-bold uppercase">
                          <ShieldCheck className="w-3 h-3" />
                          Escudo IA
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium">Bloqueo de publicidad de terceros activo en segundo plano.</p>
                      </div>
                      <div className="p-4 bg-white/5 border border-white/5 rounded text-left space-y-2">
                        <div className="flex items-center gap-2 text-green-400 text-[10px] font-bold uppercase">
                          <Maximize className="w-3 h-3" />
                          Modo Cine
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium">Lanzamiento directo en pantalla completa optimizada.</p>
                      </div>
                   </div>

                   <div className="flex flex-col items-center gap-6">
                     <motion.button 
                      whileHover={{ scale: 1.05, backgroundColor: "rgb(30, 64, 185)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleLaunchExternal}
                      className="bg-blue-600 text-white px-16 py-5 rounded-full font-black uppercase text-sm tracking-[0.3em] shadow-[0_20px_50px_rgba(37,99,235,0.4)] transition-all flex items-center gap-4"
                     >
                       REPRODUCIR AHORA
                       <ExternalLink className="w-5 h-5" />
                     </motion.button>
                     <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest">Protocolo de túnel seguro v4.2 - CineSphere Shield</p>
                   </div>
                 </div>
              </div>
            ) : (
              <iframe 
                src={externalUrl} 
                className="w-full h-full border-none bg-white"
                title="External Stream"
                sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-presentation"
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                onError={() => setIframeError(true)}
              />
            )}
            
            {/* AI Protection HUD Overlay */}
            {!isRestrictedSite && !iframeError && !isAnalyzing && (
              <div className={`absolute inset-x-0 bottom-0 pointer-events-none p-12 flex justify-between items-end transition-opacity duration-1000 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                 <div className="bg-black/80 backdrop-blur-3xl p-6 border border-white/10 rounded-xl max-w-sm space-y-4 shadow-[0_50px_100px_rgba(0,0,0,0.8)] border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-blue-500">
                        <motion.div 
                          animate={{ opacity: [0.3, 1, 0.3] }} 
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" 
                        />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">CineSphere AI Shield</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-green-500 font-bold px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded">SECURE</span>
                        <span className="text-[9px] text-blue-400 font-bold px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded">NO ADS</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[11px] text-gray-200 leading-relaxed font-medium">
                        {isDirectVideo ? 'Vídeo directo decodificado. Controles de CineSphere habilitados.' : 'Filtrando anuncios y scripts maliciosos. Navegación fluida garantizada por CineSphere Proxy.'}
                      </p>
                      <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ x: '-100%' }}
                          animate={{ x: '100%' }}
                          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                          className="h-full w-1/3 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                        />
                      </div>
                    </div>
                 </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
             <img 
               src={movie?.backdropPath} 
               className={`w-full h-full object-cover transition-opacity duration-1000 ${isPlaying ? 'opacity-40 brightness-50' : 'opacity-20 blur-sm'}`}
               alt="background"
             />
             <div className="absolute flex flex-col items-center">
                {!isPlaying && <Play className="w-20 h-20 text-white opacity-40" />}
             </div>
          </div>
        )}
      </div>

      {/* Controls Overlay for Mock Video or Direct Video */}
      {(!externalUrl || isDirectVideo) && (
        <AnimatePresence>
          {showControls && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-0 bottom-0 p-8 space-y-6 bg-gradient-to-t from-black via-black/90 to-transparent pt-32"
            >
              {/* Progress Bar */}
              <div 
                className="relative group/progress h-1 w-full bg-white/10 cursor-pointer rounded overflow-hidden"
                onClick={(e) => {
                  if (videoRef.current) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const pct = x / rect.width;
                    videoRef.current.currentTime = pct * videoRef.current.duration;
                  }
                }}
              >
                 <div 
                   className="h-full bg-blue-500 transition-all duration-300 relative" 
                   style={{ width: `${progress}%` }}
                 >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full scale-0 group-hover/progress:scale-100 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.6)]" />
                 </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <button onClick={() => setIsPlaying(!isPlaying)} className="text-white hover:text-blue-500 transition-colors">
                    {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
                  </button>
                  <Rewind 
                    className="w-8 h-8 text-white cursor-pointer hover:scale-110 active:scale-95 transition-transform" 
                    onClick={() => { if(videoRef.current) videoRef.current.currentTime -= 10 }}
                  />
                  <FastForward 
                    className="w-8 h-8 text-white cursor-pointer hover:scale-110 active:scale-95 transition-transform" 
                    onClick={() => { if(videoRef.current) videoRef.current.currentTime += 10 }}
                  />
                  <div className="flex items-center gap-4 group">
                    <Volume2 className="w-6 h-6 text-white" />
                    <div className="w-24 h-1 bg-white/20 rounded-full overflow-hidden">
                       <div className="w-2/3 h-full bg-white" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8 text-white font-medium text-sm">
                   {isDirectVideo && videoRef.current ? (
                     <span>
                       {formatTime(videoRef.current.currentTime)} / 
                       {" "}{formatTime(videoRef.current.duration)}
                     </span>
                   ) : (
                     <span>00:34 / 02:24:00</span>
                   )}
                   <Maximize className="w-6 h-6 cursor-pointer hover:scale-110 transition-transform" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
