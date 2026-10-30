'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Play, Film, Tv, Star, 
  Sparkles, Heart, Bookmark 
} from 'lucide-react';

const TMDB_API_KEY = 'ab80ba7ea1625a8c5c64d20c5b33b41f';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';
const POSTER_MENU_URL = 'https://image.tmdb.org/t/p/w780'; // Optimized 780p for fast home menu loading

export default function App() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState('all');
  const [heroMedia, setHeroMedia] = useState<any>(null);
  const [trending, setTrending] = useState<any[]>([]);
  const [popularMovies, setPopularMovies] = useState<any[]>([]);
  const [popularTV, setPopularTV] = useState<any[]>([]);
  const [topRated, setTopRated] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
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
    const fetchContent = async () => {
      try {
        const [trendingRes, moviesRes, tvRes, topRes] = await Promise.all([
          fetch(`${TMDB_BASE_URL}/trending/all/week?api_key=${TMDB_API_KEY}`),
          fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}`),
          fetch(`${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}`),
          fetch(`${TMDB_BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}`)
        ]);

        const trendingData = await trendingRes.json();
        const moviesData = await moviesRes.json();
        const tvData = await tvRes.json();
        const topData = await topRes.json();

        const filteredTrending = (trendingData.results || []).filter((item: any) => item.backdrop_path);
        setTrending(filteredTrending);
        setPopularMovies(moviesData.results || []);
        setPopularTV(tvData.results || []);
        setTopRated(topData.results || []);

        if (filteredTrending.length > 0) {
          setHeroMedia(filteredTrending[0]);
        }
      } catch (error) {
        console.error('Error fetching TMDB data:', error);
      }
    };

    fetchContent();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults((data.results || []).filter((item: any) => item.poster_path || item.backdrop_path));
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleWatchlist = (media: any) => {
    const exists = watchlist.some(item => item.id === media.id);
    let updated;
    if (exists) {
      updated = watchlist.filter(item => item.id !== media.id);
    } else {
      updated = [...watchlist, media];
    }
    setWatchlist(updated);
    localStorage.setItem('masyanya_watchlist', JSON.stringify(updated));
  };

  const isSaved = (mediaId: number) => watchlist.some(item => item.id === mediaId);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans pb-16">
      <header className="fixed top-0 left-0 right-0 z-40 bg-neutral-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-auto py-3 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <button 
              onClick={() => { setSearchQuery(''); setCurrentTab('all'); }} 
              onPointerDown={(e) => { e.preventDefault(); setSearchQuery(''); setCurrentTab('all'); }}
              className="text-2xl sm:text-3xl font-black tracking-tight focus:outline-none cursor-pointer"
            >
              <span className="bg-gradient-to-r from-red-500 via-rose-500 to-red-600 bg-clip-text text-transparent">
                masyanya
              </span>
            </button>

            <nav className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10 overflow-x-auto max-w-full">
              {[
                { id: 'all', label: 'Home', icon: Sparkles },
                { id: 'movie', label: 'Movies', icon: Film },
                { id: 'tv', label: 'TV Shows', icon: Tv },
                { id: 'watchlist', label: `List (${watchlist.length})`, icon: Bookmark }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setCurrentTab(tab.id); setSearchQuery(''); }}
                    onPointerDown={(e) => { e.preventDefault(); setCurrentTab(tab.id); setSearchQuery(''); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                      currentTab === tab.id 
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/20' 
                        : 'text-neutral-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="relative w-full md:max-w-xs">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search movies, TV shows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-900 border border-white/10 rounded-full pl-10 pr-10 py-1.5 text-xs sm:text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="pt-32 sm:pt-28 pb-12">
        {searchQuery ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Search className="w-5 h-5 text-red-500" /> Search Results for <span className="text-red-500">&quot;{searchQuery}&quot;</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {searchResults.map(item => (
                <MediaCard key={item.id} media={item} onClick={() => router.push(`/watch/${item.id}`)} />
              ))}
            </div>
          </div>
        ) : currentTab === 'watchlist' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Bookmark className="w-6 h-6 text-red-500" /> My Saved Watchlist
            </h2>
            {watchlist.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {watchlist.map(item => (
                  <MediaCard key={item.id} media={item} onClick={() => router.push(`/watch/${item.id}`)} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-neutral-500 border border-dashed border-white/10 rounded-2xl">
                Your watchlist is currently empty.
              </div>
            )}
          </div>
        ) : (
          <>
            {heroMedia && (
              <div className="relative w-full h-[65vh] sm:h-[70vh] min-h-[420px] max-h-[750px] mb-8 overflow-hidden bg-neutral-950">
                <div className="absolute inset-0">
                  <img
                    src={`${IMAGE_BASE_URL}${heroMedia.backdrop_path}`}
                    alt={heroMedia.title || heroMedia.name}
                    className="w-full h-full object-cover filter brightness-90"
                  />
                  {/* Heavy vertical and horizontal fade masks blending smoothly into pure black */}
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/50 to-transparent w-full sm:w-2/3" />
                  <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/80 via-transparent to-neutral-950" />
                </div>

                <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12">
                  <div className="max-w-2xl space-y-4">
                    <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">{heroMedia.title || heroMedia.name}</h1>
                    <p className="text-sm sm:text-base text-neutral-300 line-clamp-3">{heroMedia.overview}</p>
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={() => router.push(`/watch/${heroMedia.id}`)}
                        onPointerDown={(e) => { e.preventDefault(); router.push(`/watch/${heroMedia.id}`); }}
                        className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold cursor-pointer shadow-lg shadow-red-600/30"
                      >
                        <Play className="w-5 h-5 fill-current" /> Watch Now
                      </button>
                      <button
                        onClick={() => toggleWatchlist(heroMedia)}
                        onPointerDown={(e) => { e.preventDefault(); toggleWatchlist(heroMedia); }}
                        className={`p-3 rounded-xl border cursor-pointer ${isSaved(heroMedia.id) ? 'bg-red-600/20 border-red-500 text-red-500' : 'bg-neutral-800 text-white'}`}
                      >
                        <Heart className={`w-5 h-5 ${isSaved(heroMedia.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
              {currentTab === 'all' && (
                <>
                  <MediaSection title="Weekly Trending" items={trending} onSelect={(item) => router.push(`/watch/${item.id}`)} />
                  <MediaSection title="Popular Movies" items={popularMovies} onSelect={(item) => router.push(`/watch/${item.id}`)} />
                  <MediaSection title="Popular TV Series" items={popularTV} onSelect={(item) => router.push(`/watch/${item.id}`)} />
                  <MediaSection title="Top Rated Classics" items={topRated} onSelect={(item) => router.push(`/watch/${item.id}`)} />
                </>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function MediaSection({ title, items, onSelect }: { title: string; items: any[]; onSelect: (media: any) => void }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="space-y-4">
      <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-600" /> {title}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.slice(0, 12).map((item) => (
          <MediaCard key={item.id} media={item} onClick={() => onSelect(item)} />
        ))}
      </div>
    </section>
  );
}

function MediaCard({ media, onClick }: { media: any; onClick: () => void }) {
  // Uses w780 profile for lightweight menu performance and quick thumbnail rendering
  const posterUrl = media.poster_path ? `${POSTER_MENU_URL}${media.poster_path}` : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80';
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={(e) => { e.preventDefault(); onClick(); }}
      className="group relative flex flex-col cursor-pointer bg-neutral-900 rounded-xl overflow-hidden border border-white/5 text-left w-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-red-500 focus:scale-105"
    >
      <div className="relative aspect-[2/3] w-full bg-neutral-950 overflow-hidden">
        <img src={posterUrl} alt={media.title || media.name} className="w-full h-full object-cover group-hover:scale-110 pointer-events-none" loading="lazy" />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/50">
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </div>
        </div>
      </div>
      <div className="p-3 bg-neutral-900 w-full pointer-events-none">
        <h3 className="text-xs font-bold text-neutral-200 line-clamp-1 group-hover:text-red-500">{media.title || media.name}</h3>
        <p className="text-[10px] text-neutral-500 mt-1 font-medium">{(media.release_date || media.first_air_date || '').substring(0, 4) || 'N/A'}</p>
      </div>
    </button>
  );
}
