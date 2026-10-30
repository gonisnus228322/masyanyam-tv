'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Play, Star, Server, Bookmark, ArrowLeft, Settings, X, CheckCircle2, Zap, RefreshCw 
} from 'lucide-react';

const TMDB_API_KEY = 'ab80ba7ea1625a8c5c64d20c5b33b41f';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';

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
    { id: 'vidlink', name: 'VidLink Pro (Default HQ)', quality: '1080p HD', url: type === 'movie' ? `https://vidlink.pro/movie/${id}` : `https://vidlink.pro/tv/${id}/${season}/${episode}` },
    { id: 'embed_su', name: 'Embed.su (Fast)', quality: '1080p / 4K', url: type === 'movie' ? `https://embed.su/embed/movie/${id}` : `https://embed.su/embed/tv/${id}/${season}/${episode}` },
    { id: 'autoembed', name: 'AutoEmbed Secure', quality: '1080p HD', url: type === 'movie' ? `https://player.autoembed.cc/embed/movie/${id}` : `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}` },
    { id: 'vidsrc_cc', name: 'VidSrc V2 Prime', quality: '1080p HD', url: type === 'movie' ? `https://vidsrc.cc/v2/embed/movie/${id}` : `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}` },
    { id: 'multiembed', name: 'SuperEmbed Stream', quality: '1080p / 720p', url: type === 'movie' ? `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1` : `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${season}&e=${episode}` },
    { id: 'moviesapi', name: 'MoviesAPI Mirror', quality: '1080p HD', url: type === 'movie' ? `https://moviesapi.club/movie/${id}` : `https://moviesapi.club/tv/${id}-${season}-${episode}` }
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
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center font-bold text-xl">
        Loading Details...
      </div>
    );
  }

  const sources = getEmbedSources(Number(mediaId), media.media_type, selectedSeason, selectedEpisode);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans pb-16">
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-neutral-950/90 backdrop-blur border-b border-white/10 px-4 sm:px-8 py-3 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          onPointerDown={(e) => { e.preventDefault(); router.back(); }}
          className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer border border-white/10 focus:outline-none focus:ring-4 focus:ring-red-500"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Menu
        </button>
        <span className="text-xl font-black bg-gradient-to-r from-red-500 to-rose-600 bg-clip-text text-transparent">
          masyanya
        </span>
      </div>

      <main className="max-w-5xl mx-auto px-4 pt-24 space-y-6">
        {/* Permanent Video Player Box (Never Unmounts) */}
        <div className="relative aspect-video bg-black w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          {/* Underlying Stream Player Frame */}
          <iframe
            key={`${playerKey}-${activeServer}-${selectedSeason}-${selectedEpisode}`}
            src={sources[activeServer]?.url}
            className="w-full h-full border-0 absolute inset-0 z-10"
            allowFullScreen
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture; accelerometer; gyroscope"
            title="Stream Player"
          />

          {/* Interactive Preview Overlay (Fades out smoothly on play) */}
          <div 
            className={`absolute inset-0 z-20 transition-opacity duration-300 flex items-center justify-center bg-black/50 backdrop-blur-sm ${
              isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
            }`}
          >
            <img
              src={`${IMAGE_BASE_URL}${media.backdrop_path}`}
              alt={media.title || media.name}
              className="absolute inset-0 w-full h-full object-cover filter brightness-50 -z-10"
            />
            <div className="flex flex-col items-center justify-center gap-4">
              <button
                onClick={() => setIsPlaying(true)}
                onPointerDown={(e) => { e.preventDefault(); setIsPlaying(true); }}
                className="w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl shadow-red-600/50 cursor-pointer focus:outline-none focus:ring-4 focus:ring-red-500 hover:scale-105 transition-transform"
              >
                <Play className="w-9 h-9 fill-current ml-1" />
              </button>
              <span className="text-xs font-semibold text-neutral-200 bg-neutral-900/90 px-4 py-1.5 rounded-full border border-white/10">
                Click OK to Play Stream
              </span>
            </div>
          </div>
        </div>

        {/* Controls & Details Panel */}
        <div className="bg-neutral-900 border border-white/10 rounded-2xl p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-neutral-950 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400">
              <Server className="w-4 h-4 text-red-500" /> Active Server: <span className="text-white font-bold">{sources[activeServer]?.name}</span>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {isPlaying && (
                <button
                  onClick={() => setPlayerKey(prev => prev + 1)}
                  onPointerDown={(e) => { e.preventDefault(); setPlayerKey(prev => prev + 1); }}
                  className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-2 rounded-xl text-xs font-semibold border border-white/10 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Reload Stream
                </button>
              )}
              <button
                onClick={() => setIsSettingsOpen(true)}
                onPointerDown={(e) => { e.preventDefault(); setIsSettingsOpen(true); }}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer border border-red-500"
              >
                <Settings className="w-4 h-4" /> Server Settings
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{media.title || media.name}</h1>
              <button
                onClick={() => toggleWatchlist(media)}
                onPointerDown={(e) => { e.preventDefault(); toggleWatchlist(media); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                  watchlist.some(w => w.id === media.id)
                    ? 'bg-red-600/20 border-red-500 text-red-500'
                    : 'bg-neutral-800 hover:bg-neutral-700 border-white/10 text-white'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                {watchlist.some(w => w.id === media.id) ? 'Saved in Watchlist' : 'Add to Watchlist'}
              </button>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-neutral-400">
              <span className="flex items-center gap-1 text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded border border-amber-400/30">
                <Star className="w-3.5 h-3.5 fill-current" />
                {media.vote_average?.toFixed(1)} / 10
              </span>
              <span>{media.release_date || media.first_air_date}</span>
            </div>
            <p className="text-sm text-neutral-300 leading-relaxed">{media.overview}</p>
          </div>
        </div>
      </main>

      {/* Settings Modal Drawer */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-red-500" /> Playback & Source Settings
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">Switch servers if a stream doesn't load</p>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                onPointerDown={(e) => { e.preventDefault(); setIsSettingsOpen(false); }}
                className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white cursor-pointer border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Source Grid */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Available Working Sources:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                {sources.map((srv, idx) => (
                  <button
                    key={srv.id}
                    onClick={() => { setActiveServer(idx); setPlayerKey(prev => prev + 1); setIsSettingsOpen(false); setIsPlaying(true); }}
                    onPointerDown={(e) => { e.preventDefault(); setActiveServer(idx); setPlayerKey(prev => prev + 1); setIsSettingsOpen(false); setIsPlaying(true); }}
                    className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      activeServer === idx
                        ? 'bg-red-600/20 border-red-500 text-white shadow-lg shadow-red-600/20'
                        : 'bg-neutral-800/80 border-white/5 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{srv.name}</span>
                      <span className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                        <Zap size={12} className="text-amber-400" /> {srv.quality}
                      </span>
                    </div>
                    {activeServer === idx && <CheckCircle2 size={18} className="text-red-500 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Season and Episode Selectors (For TV Shows) */}
            {mediaDetails && media.media_type === 'tv' && mediaDetails.seasons && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-950 p-4 rounded-xl border border-white/5">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase">Select Season</label>
                  <select
                    value={selectedSeason}
                    onChange={(e) => { setSelectedSeason(Number(e.target.value)); setSelectedEpisode(1); setPlayerKey(prev => prev + 1); }}
                    className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-200 cursor-pointer focus:outline-none focus:border-red-500"
                  >
                    {mediaDetails.seasons.filter((s: any) => s.season_number > 0).map((s: any) => (
                      <option key={s.id} value={s.season_number}>
                        Season {s.season_number} ({s.episode_count} Episodes)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase">Select Episode</label>
                  <select
                    value={selectedEpisode}
                    onChange={(e) => { setSelectedEpisode(Number(e.target.value)); setPlayerKey(prev => prev + 1); }}
                    className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-200 cursor-pointer focus:outline-none focus:border-red-500"
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

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsSettingsOpen(false)}
                onPointerDown={(e) => { e.preventDefault(); setIsSettingsOpen(false); }}
                className="bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all border border-white/10"
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
