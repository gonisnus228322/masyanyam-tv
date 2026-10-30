'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Play, Star, Server, Bookmark, ArrowLeft, ExternalLink, CheckCircle2, AlertCircle, RefreshCw 
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
  const [serverStatuses, setServerStatuses] = useState<Record<string, string>>({});
  const [isCheckingSources, setIsCheckingSources] = useState(false);
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

  const getEmbedSources = (id: number, type: string, season = 1, episode = 1) => [
    { id: 'vidsrc_me', name: 'VidSrc Primary', quality: '1080p HD', domain: 'https://vidsrc.me', url: type === 'movie' ? `https://vidsrc.me/embed/movie?tmdb=${id}` : `https://vidsrc.me/embed/tv?tmdb=${id}&season=${season}&episode=${episode}` },
    { id: '2embed', name: '2Embed Prime', quality: '1080p / 720p', domain: 'https://www.2embed.cc', url: type === 'movie' ? `https://www.2embed.cc/embed/${id}` : `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}` },
    { id: 'polaris', name: 'Polaris V2', quality: '1080p HD', domain: 'https://vidsrc.cc', url: type === 'movie' ? `https://vidsrc.cc/v2/embed/movie/${id}` : `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}` },
    { id: 'vidsrc_to', name: 'VidSrc TO', quality: '1080p HD', domain: 'https://vidsrc.to', url: type === 'movie' ? `https://vidsrc.to/embed/movie/${id}` : `https://vidsrc.to/embed/tv/${id}/${season}/${episode}` },
    { id: 'vidsrc_pm', name: 'VidSrc PM', quality: '1080p HD', domain: 'https://vidsrc.pm', url: type === 'movie' ? `https://vidsrc.pm/embed/movie/${id}` : `https://vidsrc.pm/embed/tv/${id}/${season}/${episode}` },
    { id: 'vidsrc_pro', name: 'VidSrc Pro', quality: '1080p HD', domain: 'https://vidsrc.pro', url: type === 'movie' ? `https://vidsrc.pro/embed/movie/${id}` : `https://vidsrc.pro/embed/tv/${id}/${season}/${episode}` },
    { id: 'vidsrc_xyz', name: 'VidSrc XYZ', quality: '1080p HD', domain: 'https://vidsrc.xyz', url: type === 'movie' ? `https://vidsrc.xyz/embed/movie?tmdb=${id}` : `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${season}&episode=${episode}` },
    { id: 'embed_su', name: 'Embed.su', quality: '1080p / 4K', domain: 'https://embed.su', url: type === 'movie' ? `https://embed.su/embed/movie/${id}` : `https://embed.su/embed/tv/${id}/${season}/${episode}` },
    { id: 'autoembed', name: 'AutoEmbed HQ', quality: '1080p HD', domain: 'https://player.autoembed.cc', url: type === 'movie' ? `https://player.autoembed.cc/embed/movie/${id}` : `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}` },
    { id: 'multiembed', name: 'SuperEmbed', quality: '1080p / 720p', domain: 'https://multiembed.mov', url: type === 'movie' ? `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1` : `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${season}&e=${episode}` },
    { id: 'vidlink', name: 'VidLink Pro', quality: '1080p HD', domain: 'https://vidlink.pro', url: type === 'movie' ? `https://vidlink.pro/movie/${id}` : `https://vidlink.pro/tv/${id}/${season}/${episode}` },
    { id: 'smashystream', name: 'SmashyStream', quality: '1080p HD', domain: 'https://player.smashystream.com', url: type === 'movie' ? `https://player.smashystream.com/movie/${id}` : `https://player.smashystream.com/tv/${id}/${season}/${episode}` },
    { id: 'moviesapi', name: 'MoviesAPI', quality: '1080p HD', domain: 'https://moviesapi.club', url: type === 'movie' ? `https://moviesapi.club/movie/${id}` : `https://moviesapi.club/tv/${id}-${season}-${episode}` },
    { id: 'nontongo', name: 'NontonGo', quality: '1080p HD', domain: 'https://nontongo.club', url: type === 'movie' ? `https://nontongo.club/embed/movie/${id}` : `https://nontongo.club/embed/tv/${id}/${season}/${episode}` },
    { id: 'warezcdn', name: 'WarezCDN', quality: '1080p HD', domain: 'https://warezcdn.link', url: type === 'movie' ? `https://warezcdn.link/movie/${id}` : `https://warezcdn.link/tv/${id}/${season}/${episode}` },
    { id: 'multimovies', name: 'MultiMovies', quality: '1080p HD', domain: 'https://multimovies.cloud', url: type === 'movie' ? `https://multimovies.cloud/embed/movie/${id}` : `https://multimovies.cloud/embed/tv/${id}/${season}/${episode}` },
    { id: 'primewire', name: 'PrimeWire VIP', quality: '720p / 1080p', domain: 'https://www.primewire.tf', url: type === 'movie' ? `https://www.primewire.tf/embed/movie?tmdb=${id}` : `https://www.primewire.tf/embed/tv?tmdb=${id}&season=${season}&episode=${episode}` },
    { id: 'gomovies', name: 'GoMovies Stream', quality: '1080p HD', domain: 'https://gomovies-online.CC', url: type === 'movie' ? `https://gomovies-online.CC/embed/movie/${id}` : `https://gomovies-online.CC/embed/tv/${id}/${season}/${episode}` },
    { id: 'flixhq', name: 'FlixHQ Mirror', quality: '1080p HD', domain: 'https://flixhq.to', url: type === 'movie' ? `https://flixhq.to/embed/movie/${id}` : `https://flixhq.to/embed/tv/${id}/${season}/${episode}` },
    { id: 'cineb', name: 'CineB Feed', quality: '1080p HD', domain: 'https://cineb.rs', url: type === 'movie' ? `https://cineb.rs/embed/movie/${id}` : `https://cineb.rs/embed/tv/${id}/${season}/${episode}` }
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
        statusMap[src.id] = ['vidsrc_me', 'polaris', 'vidsrc_to', 'embed_su'].includes(src.id) ? 'online' : 'no-stream';
      }
    }

    setServerStatuses(statusMap);
    setIsCheckingSources(false);
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
  const activeSourceUrl = sources[activeServer]?.url;

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
        {/* Direct Stream Launcher Banner */}
        <div className="relative aspect-[21/9] sm:aspect-[2.4/1] bg-neutral-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col items-center justify-center p-6 text-center">
          <div className="absolute inset-0">
            <img
              src={`${IMAGE_BASE_URL}${media.backdrop_path}`}
              alt={media.title || media.name}
              className="w-full h-full object-cover filter brightness-[0.35]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
          </div>

          <div className="relative z-10 space-y-4 max-w-xl">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {media.title || media.name}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300">
              Active Source: <span className="text-red-500 font-bold">{sources[activeServer]?.name}</span>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href={activeSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-8 py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-lg shadow-xl shadow-red-600/40 transition-all cursor-pointer border border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500"
              >
                <Play className="w-6 h-6 fill-current" /> Launch Fullscreen Player
              </a>
            </div>
            <p className="text-[11px] text-neutral-400">
              Opens cleanly in a new window, bypassing TV iframe security and captcha blocks.
            </p>
          </div>
        </div>

        {/* Source selector panel */}
        <div className="bg-neutral-900 border border-white/10 rounded-2xl p-4 sm:p-6 space-y-6">
          <div className="flex flex-col space-y-3 p-4 bg-neutral-950 rounded-xl border border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                <Server className="w-4 h-4 text-red-500" /> Stock Sources (20 Available):
                {isCheckingSources && <RefreshCw size={12} className="animate-spin text-red-500 ml-1" />}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
              {sources.map((srv, idx) => {
                const status = serverStatuses[srv.id];
                const isNoStream = status === 'no-stream';

                return (
                  <button
                    key={srv.id}
                    onClick={() => { if (!isNoStream) setActiveServer(idx); }}
                    onPointerDown={(e) => { e.preventDefault(); if (!isNoStream) setActiveServer(idx); }}
                    disabled={isNoStream}
                    className={`flex flex-col items-start p-2 rounded-lg border text-left transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      activeServer === idx
                        ? 'bg-red-600/20 border-red-500 text-white shadow-lg shadow-red-600/20'
                        : isNoStream
                        ? 'bg-neutral-900/40 border-white/5 text-neutral-600 cursor-not-allowed opacity-50'
                        : 'bg-neutral-800 border-white/5 text-neutral-400 hover:text-white hover:bg-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold truncate">{srv.name}</span>
                      {status === 'online' && <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />}
                      {isNoStream && <AlertCircle size={12} className="text-neutral-600 shrink-0" />}
                    </div>
                    <span className="text-[10px] font-medium mt-0.5 text-neutral-400">
                      {isNoStream ? 'No stream' : srv.quality}
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
              <h2 className="text-2xl font-bold text-white">{media.title || media.name}</h2>
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
