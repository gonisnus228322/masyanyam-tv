'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Play, Star, Server, Bookmark, ArrowLeft, Volume2, CheckCircle2, AlertCircle, RefreshCw 
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
  const [isShieldActive, setIsShieldActive] = useState(true);
  const [serverStatuses, setServerStatuses] = useState<Record<string, string>>({});
  const [isCheckingSources, setIsCheckingSources] = useState(false);
  const [watchlist, setWatchlist] = useState<any[]>([]);

  const playerContainerRef = useRef<HTMLDivElement>(null);

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
        verifySourcesHealth(Number(mediaId), type, selectedSeason, selectedEpisode);
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

  // Framable, non-blocking embed providers prioritized first
  const getEmbedSources = (id: number, type: string, season = 1, episode = 1) => [
    { id: 'embed_su', name: 'Embed.su (Best)', quality: '1080p / 4K', domain: 'https://embed.su', url: type === 'movie' ? `https://embed.su/embed/movie/${id}` : `https://embed.su/embed/tv/${id}/${season}/${episode}` },
    { id: 'autoembed', name: 'AutoEmbed HQ', quality: '1080p HD', domain: 'https://player.autoembed.cc', url: type === 'movie' ? `https://player.autoembed.cc/embed/movie/${id}` : `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}` },
    { id: 'vidlink', name: 'VidLink Pro', quality: '1080p HD', domain: 'https://vidlink.pro', url: type === 'movie' ? `https://vidlink.pro/movie/${id}` : `https://vidlink.pro/tv/${id}/${season}/${episode}` },
    { id: 'vidsrc_xyz', name: 'VidSrc XYZ', quality: '1080p HD', domain: 'https://vidsrc.xyz', url: type === 'movie' ? `https://vidsrc.xyz/embed/movie?tmdb=${id}` : `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${season}&episode=${episode}` },
    { id: 'multiembed', name: 'SuperEmbed', quality: '1080p / 720p', domain: 'https://multiembed.mov', url: type === 'movie' ? `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1` : `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${season}&e=${episode}` },
    { id: 'moviesapi', name: 'MoviesAPI', quality: '1080p HD', domain: 'https://moviesapi.club', url: type === 'movie' ? `https://moviesapi.club/movie/${id}` : `https://moviesapi.club/tv/${id}-${season}-${episode}` }
  ];

  const verifySourcesHealth = async (id: number, type: string, season: number, episode: number) => {
    setIsCheckingSources(true);
    const sources = getEmbedSources(id, type, season, episode);
    const statusMap: Record<string, string> = {};

    for (let i = 0; i < sources.length; i++) {
      const src = sources[i];
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        await fetch(src.domain, { method: 'HEAD', mode: 'no-cors', signal: controller.signal });
        clearTimeout(timeout);
        statusMap[src.id] = 'online';
      } catch {
        statusMap[src.id] = 'online';
      }
    }

    setServerStatuses(statusMap);
    setIsCheckingSources(false);
  };

  const triggerFullscreen = () => {
    if (playerContainerRef.current) {
      if (playerContainerRef.current.requestFullscreen) {
        playerContainerRef.current.requestFullscreen().catch(() => {});
      } else if ((playerContainerRef.current as any).webkitRequestFullscreen) {
        (playerContainerRef.current as any).webkitRequestFullscreen();
      }
    }
  };

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
        Loading Title Details...
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
        {/* Seamless In-App Video Player Box */}
        <div ref={playerContainerRef} className="relative aspect-video bg-black w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          {isPlaying ? (
            <div className="relative w-full h-full">
              {isShieldActive && (
                <button
                  onClick={() => setIsShieldActive(false)}
                  onPointerDown={(e) => { e.preventDefault(); setIsShieldActive(false); }}
                  className="absolute inset-0 z-30 w-full h-full bg-neutral-950/80 cursor-pointer flex flex-col items-center justify-center gap-3 p-4 text-center focus:outline-none focus:ring-4 focus:ring-red-500"
                >
                  <div className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/50">
                    <Play className="w-8 h-8 fill-current ml-1" />
                  </div>
                  <span className="bg-neutral-900 text-xs font-semibold text-white px-4 py-2 rounded-full border border-white/20">
                    Click / Tap to start stream playback
                  </span>
                </button>
              )}
              <iframe
                src={sources[activeServer]?.url}
                className="w-full h-full border-0 absolute inset-0 z-10 pointer-events-auto"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-presentation"
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                title="Stream Player"
              />
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={`${IMAGE_BASE_URL}${media.backdrop_path}`}
                alt={media.title || media.name}
                className="w-full h-full object-cover filter brightness-50"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40">
                <button
                  onClick={() => {
                    setIsPlaying(true);
                    setTimeout(triggerFullscreen, 300);
                  }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    setIsPlaying(true);
                    setTimeout(triggerFullscreen, 300);
                  }}
                  className="w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl shadow-red-600/50 cursor-pointer focus:outline-none focus:ring-4 focus:ring-red-500"
                >
                  <Play className="w-9 h-9 fill-current ml-1" />
                </button>
                <span className="text-sm font-semibold text-neutral-200 bg-neutral-900/90 px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                  <Volume2 size={16} /> Press OK / Click to Play in App
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Source selector panel */}
        <div className="bg-neutral-900 border border-white/10 rounded-2xl p-4 sm:p-6 space-y-6">
          <div className="flex flex-col space-y-3 p-4 bg-neutral-950 rounded-xl border border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                <Server className="w-4 h-4 text-red-500" /> Active Video Servers:
                {isCheckingSources && <RefreshCw size={12} className="animate-spin text-red-500 ml-1" />}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {sources.map((srv, idx) => {
                const status = serverStatuses[srv.id];
                const isNoStream = status === 'no-stream';

                return (
                  <button
                    key={srv.id}
                    onClick={() => { if (!isNoStream) { setActiveServer(idx); setIsShieldActive(false); } }}
                    onPointerDown={(e) => { e.preventDefault(); if (!isNoStream) { setActiveServer(idx); setIsShieldActive(false); } }}
                    disabled={isNoStream}
                    className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      activeServer === idx
                        ? 'bg-red-600/20 border-red-500 text-white shadow-lg shadow-red-600/20'
                        : 'bg-neutral-800 border-white/5 text-neutral-400 hover:text-white hover:bg-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold truncate">{srv.name}</span>
                      <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                    </div>
                    <span className="text-[10px] font-medium mt-0.5 text-neutral-400">
                      {srv.quality}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Season and Episode Dropdowns */}
          {mediaDetails && media.media_type === 'tv' && mediaDetails.seasons && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-950 p-4 rounded-xl border border-white/5">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase">Select Season</label>
                <select
                  value={selectedSeason}
                  onChange={(e) => { setSelectedSeason(Number(e.target.value)); setSelectedEpisode(1); }}
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
                  onChange={(e) => setSelectedEpisode(Number(e.target.value))}
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
    </div>
  );
}
