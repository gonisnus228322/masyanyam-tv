'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Play, Star, Server, Bookmark, ArrowLeft, Settings, X, CheckCircle2, Zap, RefreshCw, Film 
} from 'lucide-react';

const TMDB_API_KEY = 'ab80ba7ea1625a8c5c64d20c5b33b41f';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w1280'; // Optimized w1280 size for instant TV/laptop decoding

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const mediaId = params.id;

  const [media, setMedia] = useState<any>(null);
  const [mediaDetails, setMediaDetails] = useState<any>(null);
  const [activeServer, setActiveServer] = useState(0);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [episodeCount, setEpisodeCount] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [playerKey, setPlayerKey] = useState(0);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('masyanya_watchlist');
      if (saved) setWatchlist(JSON.parse(saved));
    } catch (e) {
      console.error('Watchlist load error', e);
    }
  }, []);

  useEffect(() => {
    if (!mediaId) return;

    const fetchMediaData = async () => {
      try {
        let res = await fetch(`${TMDB_BASE_URL}/movie/${mediaId}?api_key=${TMDB_API_KEY}&append_to_response=credits`);
        let data = await res.json();
        
        let type = 'movie';
        if (data.success === false) {
          res = await fetch(`${TMDB_BASE_URL}/tv/${mediaId}?api_key=${TMDB_API_KEY}&append_to_response=credits`);
          data = await res.json();
          type = 'tv';
        }

        setMedia({ ...data, media_type: type });
        setMediaDetails({ ...data, media_type: type });
      } catch (err) {
        console.error('Failed to fetch media details:', err);
      }
    };

    fetchMediaData();
  }, [mediaId]);

  useEffect(() => {
    if (mediaDetails && mediaDetails.seasons) {
      const currentSeasonObj = mediaDetails.seasons.find((s: any) => s.season_number === selectedSeason);
      if (currentSeasonObj) {
        setEpisodeCount(currentSeasonObj.episode_count || 20);
      }
    }
  }, [selectedSeason, mediaDetails]);

  const getEmbedSources = (id: number, type: string, season = 1, episode = 1) => [
    { id: 'vidlink', name: 'VidLink Pro', quality: '1080p HD', badge: 'Default HQ', url: type === 'movie' ? `https://vidlink.pro/movie/${id}` : `https://vidlink.pro/tv/${id}/${season}/${episode}` },
    { id: 'embed_su', name: 'Embed.su', quality: '1080p / 4K', badge: 'Ultra Fast', url: type === 'movie' ? `https://embed.su/embed/movie/${id}` : `https://embed.su/embed/tv/${id}/${season}/${episode}` },
    { id: 'autoembed', name: 'AutoEmbed Secure', quality: '1080p HD', badge: 'Stable', url: type === 'movie' ? `https://player.autoembed.cc/embed/movie/${id}` : `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}` },
    { id: 'vidsrc_cc', name: 'VidSrc V2 Prime', quality: '1080p HD', badge: 'Alternative', url: type === 'movie' ? `https://vidsrc.cc/v2/embed/movie/${id}` : `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}` },
    { id: 'multiembed', name: 'SuperEmbed Stream', quality: '1080p / 720p', badge: 'Backup', url: type === 'movie' ? `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1` : `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${season}&e=${episode}` },
    { id: 'moviesapi', name: 'MoviesAPI Mirror', quality: '1080p HD', badge: 'Classic', url: type === 'movie' ? `https://moviesapi.club/movie/${id}` : `https://moviesapi.club/tv/${id}-${season}-${episode}` }
  ];

  const toggleWatchlist = (item: any) => {
    const exists = watchlist.some(w => w.id === item.id);
    let updated;
    if (exists) {
      updated = watchlist.filter(w => w.id !== item.id);
    } else {
      updated = [...watchlist, item];
    }
    setWatchlist(updated);
    localStorage.setItem('masyanya_watchlist', JSON.stringify(updated));
  };

  if (!media) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center gap-3 font-medium text-lg">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        Loading Cinematic Experience...
      </div>
    );
  }

  const sources = getEmbedSources(Number(mediaId), media.media_type, selectedSeason, selectedEpisode);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-red-600 selection:text-white pb-20">
      
      {/* Top Floating Cinema Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-neutral-950 via-neutral-950/80 to-transparent px-6 sm:px-12 py-5 flex items-center justify-between backdrop-blur-md border-b border-white/5">
        <button
          onClick={() => router.back()}
          onPointerDown={(e) => { e.preventDefault(); router.back(); }}
          className="flex items-center gap-2.5 bg-neutral-900/90 hover:bg-neutral-800 text-white px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 cursor-pointer border border-white/10 shadow-lg shadow-black/50 focus:outline-none focus:ring-4 focus:ring-red-500"
        >
          <ArrowLeft className="w-4 h-4 text-red-500" /> Back to Menu
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
          <span className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
            masyanya<span className="text-red-600">.tv</span>
          </span>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 space-y-8">
        
        {/* Cinematic Video Player Frame */}
        <div className="relative w-full aspect-video min-h-[480px] bg-neutral-900 rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] group">
          
          {/* Permanent Active Stream Player */}
          <iframe
            key={`${playerKey}-${activeServer}-${selectedSeason}-${selectedEpisode}`}
            src={sources[activeServer]?.url}
            className="w-full h-full border-0 absolute inset-0 z-10"
            allowFullScreen
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture; accelerometer; gyroscope"
            title="Stream Player"
          />

          {/* Immersive Backdrop Preview & Play Overlay */}
          <div 
            className={`absolute inset-0 z-20 transition-all duration-500 flex items-center justify-center bg-neutral-950/80 backdrop-blur-md ${
              isPlaying ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100 pointer-events-auto scale-100'
            }`}
          >
            {media.backdrop_path && (
              <img
                src={`${IMAGE_BASE_URL}${media.backdrop_path}`}
                alt={media.title || media.name}
                onLoad={() => setImageLoaded(true)}
                className={`absolute inset-0 w-full h-full object-cover filter brightness-[0.35] blur-[1px] transform scale-105 -z-10 transition-opacity duration-700 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent -z-10"></div>

            <div className="flex flex-col items-center justify-center gap-5 text-center px-4 max-w-lg">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                  Ready to Stream
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-lg">
                  {media.title || media.name}
                </h2>
              </div>

              <button
                onClick={() => setIsPlaying(true)}
                onPointerDown={(e) => { e.preventDefault(); setIsPlaying(true); }}
                className="group/btn relative flex items-center gap-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-[0_10px_30px_rgba(220,38,38,0.5)] cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 border border-red-400/30 focus:outline-none focus:ring-4 focus:ring-red-500"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur">
                  <Play className="w-5 h-5 fill-current text-white ml-0.5" />
                </div>
                <span>Start Playback</span>
              </button>

              <span className="text-xs font-medium text-neutral-400 bg-neutral-900/80 px-4 py-2 rounded-xl border border-white/5 backdrop-blur">
                Press <strong className="text-white">OK / Enter</strong> on your remote to launch
              </span>
            </div>
          </div>
        </div>

        {/* Cinematic Controls & Metadata Panel */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          
          {/* Server & Quick Tools Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 bg-neutral-950/80 rounded-2xl border border-white/5 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">Active Stream Provider</span>
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  {sources[activeServer]?.name} 
                  <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">
                    {sources[activeServer]?.quality}
                  </span>
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {isPlaying && (
                <button
                  onClick={() => setPlayerKey(prev => prev + 1)}
                  onPointerDown={(e) => { e.preventDefault(); setPlayerKey(prev => prev + 1); }}
                  className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-4 py-3 rounded-2xl text-xs font-semibold transition-all border border-white/10 cursor-pointer shadow-md"
                  title="Reload Stream Player"
                >
                  <RefreshCw className="w-4 h-4 text-neutral-400" /> Reload Stream
                </button>
              )}
              <button
                onClick={() => setIsSettingsOpen(true)}
                onPointerDown={(e) => { e.preventDefault(); setIsSettingsOpen(true); }}
                className="flex items-center gap-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-5 py-3 rounded-2xl text-xs font-bold shadow-lg shadow-red-600/30 cursor-pointer transition-all border border-red-400/30 flex-1 sm:flex-initial justify-center focus:outline-none focus:ring-4 focus:ring-red-500"
              >
                <Settings className="w-4 h-4 animate-spin-slow" /> Server Settings
              </button>
            </div>
          </div>

          {/* Media Info Section */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{media.title || media.name}</h1>
              <button
                onClick={() => toggleWatchlist(media)}
                onPointerDown={(e) => { e.preventDefault(); toggleWatchlist(media); }}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer shadow-lg ${
                  watchlist.some(w => w.id === media.id)
                    ? 'bg-red-600/20 border-red-500/50 text-red-400 shadow-red-600/10'
                    : 'bg-neutral-800 hover:bg-neutral-700 border-white/10 text-white'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                {watchlist.some(w => w.id === media.id) ? 'Saved in Watchlist' : 'Add to Watchlist'}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-neutral-400">
              <span className="flex items-center gap-1.5 text-amber-400 bg-amber-400/10 px-3 py-1 rounded-xl border border-amber-400/20">
                <Star className="w-4 h-4 fill-current" />
                {media.vote_average?.toFixed(1)} / 10 TMDB Rating
              </span>
              <span className="bg-neutral-800 px-3 py-1 rounded-xl border border-white/5 text-neutral-300">
                {media.release_date || media.first_air_date}
              </span>
              <span className="bg-neutral-800 px-3 py-1 rounded-xl border border-white/5 uppercase text-neutral-300 tracking-wider">
                {media.media_type}
              </span>
            </div>

            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed font-normal pt-2 max-w-4xl">
              {media.overview}
            </p>
          </div>
        </div>
      </main>

      {/* Bulletproof Dead-Center TV Modal Drawer (Absolute Viewport Positioning) */}
      {isSettingsOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 999999, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '92%', maxWidth: '620px', maxHeight: '88vh', overflowY: 'auto', backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '1.5rem', padding: '1.75rem', boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.95)' }}>
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center text-red-500">
                    <Settings className="w-4 h-4" />
                  </div>
                  Playback & Source Settings
                </h2>
                <p className="text-xs text-neutral-400 mt-1">Switch high-speed streaming servers instantly</p>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                onPointerDown={(e) => { e.preventDefault(); setIsSettingsOpen(false); }}
                className="p-2.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white cursor-pointer border border-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Revamped Source Selector Grid */}
            <div className="space-y-3 mb-5">
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest">
                Available Working Sources:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                {sources.map((srv, idx) => (
                  <button
                    key={srv.id}
                    onClick={() => { setActiveServer(idx); setPlayerKey(prev => prev + 1); setIsSettingsOpen(false); setIsPlaying(true); }}
                    onPointerDown={(e) => { e.preventDefault(); setActiveServer(idx); setPlayerKey(prev => prev + 1); setIsSettingsOpen(false); setIsPlaying(true); }}
                    className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer focus:outline-none focus:ring-4 focus:ring-red-500 ${
                      activeServer === idx
                        ? 'bg-red-600/20 border-red-500 text-white shadow-lg shadow-red-600/20'
                        : 'bg-neutral-800/60 hover:bg-neutral-800 border-white/5 text-neutral-300'
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{srv.name}</span>
                        <span className="text-[10px] font-semibold bg-white/10 text-neutral-300 px-2 py-0.5 rounded-md">
                          {srv.badge}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-400 flex items-center gap-1">
                        <Zap size={12} className="text-amber-400 fill-amber-400" /> {srv.quality}
                      </span>
                    </div>
                    {activeServer === idx && <CheckCircle2 size={20} className="text-red-500 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Season and Episode Selectors (For TV Shows) */}
            {mediaDetails && media.media_type === 'tv' && mediaDetails.seasons && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-950/80 p-4 rounded-2xl border border-white/5 mb-5">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">Select Season</label>
                  <select
                    value={selectedSeason}
                    onChange={(e) => { setSelectedSeason(Number(e.target.value)); setSelectedEpisode(1); setPlayerKey(prev => prev + 1); }}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-neutral-200 cursor-pointer focus:outline-none focus:border-red-500"
                  >
                    {mediaDetails.seasons.filter((s: any) => s.season_number > 0).map((s: any) => (
                      <option key={s.id} value={s.season_number}>
                        Season {s.season_number} ({s.episode_count} Eps)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">Select Episode</label>
                  <select
                    value={selectedEpisode}
                    onChange={(e) => { setSelectedEpisode(Number(e.target.value)); setPlayerKey(prev => prev + 1); }}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-neutral-200 cursor-pointer focus:outline-none focus:border-red-500"
                  >
                    {[...Array(episodeCount)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Episode {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-white/10">
              <button
                onClick={() => setIsSettingsOpen(false)}
                onPointerDown={(e) => { e.preventDefault(); setIsSettingsOpen(false); }}
                className="bg-neutral-800 hover:bg-neutral-700 text-white px-7 py-3 rounded-2xl text-sm font-bold cursor-pointer transition-all border border-white/10 shadow-lg"
              >
                Close Settings
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
