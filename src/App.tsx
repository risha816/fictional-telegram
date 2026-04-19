import React, {
  useState, useEffect, useCallback, useRef, memo, useDeferredValue
} from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Star, ChevronLeft, Search, Film, Library,
  Flame, Heart, Languages, Clapperboard, Crown,
  RefreshCw, Play, CheckCircle
} from 'lucide-react';
import config from './config';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const AUTO_REFRESH_MS = 10 * 60 * 1000;
const TMDB_KEY  = import.meta.env.VITE_TMDB_API_KEY || 'b445400ff2b0b33483ea4974026293e3';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_W185  = 'https://image.tmdb.org/t/p/w185';
const IMG_W342  = 'https://image.tmdb.org/t/p/w342';
const IMG_W500  = 'https://image.tmdb.org/t/p/w500';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface TMDBContent {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  overview: string;
  original_language?: string;
  genre_ids?: number[];
  media_type?: string;
  youtube_thumbnail?: string;  // YouTube নাটকের thumbnail
  youtube_video_id?: string;   // YouTube video ID
}

// ─────────────────────────────────────────────
// Smart Channel Router
// ─────────────────────────────────────────────
const ANIME_GENRES = [16]; // Animation
const resolveChannel = (item: TMDBContent): string => {
  const lang  = item.original_language || '';
  const genres = item.genre_ids || [];
  const isTV  = !!item.first_air_date || item.media_type === 'tv';

  // Anime: Japanese animation
  if (lang === 'ja' && genres.some(g => ANIME_GENRES.includes(g))) return config.channelPortal.anime;
  // Korean → KDrama
  if (lang === 'ko') return config.channelPortal.kdrama;
  // South Indian
  if (['ta','te','ml','kn'].includes(lang)) return config.channelPortal.south;
  // Hindi
  if (lang === 'hi') return config.channelPortal.hindi;
  // Bengali
  if (lang === 'bn') return config.channelPortal.bangla;
  // English/others: movie vs series
  if (isTV) return config.channelPortal.series;
  return config.channelPortal.movies;
};

const resolveChannelLabel = (item: TMDBContent): { name: string; color: string } => {
  const lang  = item.original_language || '';
  const genres = item.genre_ids || [];
  const isTV  = !!item.first_air_date || item.media_type === 'tv';

  if (lang === 'ja' && genres.some(g => ANIME_GENRES.includes(g))) return { name:'এনিমি চ্যানেল', color:'#ef4444' };
  if (lang === 'ko') return { name:'কে-ড্রামা চ্যানেল', color:'#10b981' };
  if (['hi','ta','te','ml','kn'].includes(lang)) return { name:'হিন্দি ডাবড চ্যানেল', color:'#8b5cf6' };
  if (lang === 'bn') return { name:'বাংলা ডাবড চ্যানেল', color:'#0d9488' };
  if (isTV) return { name:'ওয়েব সিরিজ চ্যানেল', color:'#6366f1' };
  return { name:'মুভি চ্যানেল', color:'#0088cc' };
};

// ─────────────────────────────────────────────
// Fallback data
// ─────────────────────────────────────────────
const FALLBACK: TMDBContent[] = [
  {id:1,title:'Trending Media',poster_path:'',backdrop_path:'',vote_average:8.5,overview:'Premium content.',release_date:'2024'},
  {id:2,title:'Epic Saga',     poster_path:'',backdrop_path:'',vote_average:9.0,overview:'Deep experience.',release_date:'2024'},
  {id:3,title:'New Arrival',   poster_path:'',backdrop_path:'',vote_average:7.8,overview:'Latest content.', release_date:'2024'},
  {id:4,title:'Classic Hit',   poster_path:'',backdrop_path:'',vote_average:8.2,overview:'A masterpiece.',  release_date:'2024'},
  {id:5,title:'Top Pick',      poster_path:'',backdrop_path:'',vote_average:9.5,overview:'Curated pick.',   release_date:'2024'},
];

// ─────────────────────────────────────────────
// Channel list (no exclusive — shown separately)
// ─────────────────────────────────────────────
const CHANNEL_CATEGORIES = [
  {id:'movies', name:'মুভি চ্যানেল',         link:config.channelPortal.movies,  badge:'HD · 4K কোয়ালিটি',          grad:'from-[#0F172A] to-[#1E293B]', icon:<Film size={18}/>},
  {id:'series', name:'ওয়েব সিরিজ চ্যানেল',  link:config.channelPortal.series,  badge:'সব সিজন · সব এপিসোড',       grad:'from-[#1E1B4B] to-[#312E81]', icon:<Library size={18}/>},
  {id:'anime',  name:'এনিমি দুনিয়া চ্যানেল',link:config.channelPortal.anime,   badge:'লেটেস্ট আপডেট প্রতিদিন',    grad:'from-[#450A0A] to-[#7F1D1D]', icon:<Flame size={17}/>},
  {id:'kdrama', name:'কে-ড্রামা লাভার্স',    link:config.channelPortal.kdrama,  badge:'হিন্দি ডাব · সাবটাইটেল',   grad:'from-[#064E3B] to-[#065F46]', icon:<Heart size={17}/>},
  {id:'hindi',  name:'হিন্দি ডাবড চ্যানেল', link:config.channelPortal.hindi,   badge:'সব হিন্দি মুভি একসাথে',     grad:'from-[#312E81] to-[#1E1B4B]', icon:<Languages size={17}/>},
  {id:'bangla', name:'বাংলা ডাবড চ্যানেল',  link:config.channelPortal.bangla,  badge:'এক্সক্লুসিভ বাংলা কন্টেন্ট', grad:'from-[#134E4A] to-[#0D9488]', icon:<Clapperboard size={17}/>},
  {id:'south',  name:'সাউথ ইন্ডিয়ান ডাবড', link:config.channelPortal.south,   badge:'তামিল · তেলেগু · হিন্দি ডাব',  grad:'from-[#431407] to-[#9a3412]', icon:<Film size={17}/>},
  {id:'natok',  name:'বাংলাদেশি নাটক',       link:config.channelPortal.natok,   badge:'Chorki · Hoichoi · Bongo',     grad:'from-[#14532d] to-[#166534]', icon:<Clapperboard size={17}/>},
];

// ─────────────────────────────────────────────
// Tiny helpers
// ─────────────────────────────────────────────
const TelegramIcon = memo(({size=16}:{size?:number}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
));

// Lazy image with shimmer — avoids re-render on parent update
const LazyImg = memo(({src,alt,className}:{src:string;alt?:string;className?:string}) => {
  const [loaded,setLoaded] = useState(false);
  const [error, setError]  = useState(false);
  if(!src||error) return <div className="w-full h-full shimmer"/>;
  return (
    <>
      {!loaded && <div className="absolute inset-0 shimmer"/>}
      <img src={src} alt={alt||''} loading="lazy" decoding="async"
        className={`${className} transition-opacity duration-300 ${loaded?'opacity-100':'opacity-0'}`}
        onLoad={()=>setLoaded(true)} onError={()=>setError(true)} referrerPolicy="no-referrer"/>
    </>
  );
});

// ─────────────────────────────────────────────
// PosterCard — memoised, no inline functions
// ─────────────────────────────────────────────
const PosterCard = memo(({movie,onClick,size='row'}:{
  movie:TMDBContent; onClick:(c:TMDBContent)=>void; size?:'row'|'grid';
}) => {
  // YouTube নাটক হলে তার thumbnail, নাহলে TMDB poster
  const imgSrc = movie.youtube_thumbnail
    ? movie.youtube_thumbnail
    : movie.poster_path
      ? `${size==='grid'?IMG_W185:IMG_W342}${movie.poster_path}`
      : '';
  const handleClick = useCallback(()=>onClick(movie),[movie,onClick]);
  return (
    <div onClick={handleClick}
      className={size==='row'
        ?"min-w-[105px] w-[105px] cursor-pointer active:scale-95 transition-transform will-change-transform"
        :"flex flex-col cursor-pointer active:scale-95 transition-transform will-change-transform"}>
      <div className={`relative overflow-hidden bg-[#1A1A20] border border-white/5 ${
        size==='row'?'aspect-[2/3] rounded-2xl mb-2':'aspect-[2/3] rounded-xl mb-1.5'}`}>
        <LazyImg src={imgSrc} alt={movie.title||movie.name} className="w-full h-full object-cover"/>
        {movie.vote_average > 0 && (
          <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-0.5">
            <Star size={8} fill="#FFD700" className="text-[#FFD700]"/>
            <span className="text-[8px] font-black text-white tabular-nums">{movie.vote_average.toFixed(1)}</span>
          </div>
        )}
      </div>
      <p className={`font-bold leading-tight truncate px-0.5 ${
        size==='row'?'text-[10px] text-white/85':'text-[9px] text-white/75 line-clamp-2'}`}>
        {movie.title||movie.name}
      </p>
    </div>
  );
});

// ─────────────────────────────────────────────
// PosterRow
// ─────────────────────────────────────────────
const PosterRow = memo(({title,data,onPosterClick,onViewAll}:{
  title:string; data:TMDBContent[];
  onPosterClick:(c:TMDBContent)=>void; onViewAll:()=>void;
}) => (
  <section className="px-4">
    <div className="flex items-center justify-between mb-2.5 px-0.5">
      <h3 className="font-[Hind+Siliguri] font-black text-[14px] text-white/90">{title}</h3>
      <button onClick={onViewAll}
        className="text-[8px] font-black text-[#4FC3F7] uppercase tracking-widest bg-[#4FC3F7]/10 px-2.5 py-1 rounded-full border border-[#4FC3F7]/20 active:scale-90 transition-transform">
        সব দেখুন
      </button>
    </div>
    <div className="flex overflow-x-auto gap-2.5 no-scrollbar pb-1">
      {data.length > 0
        ? data.slice(0,10).map(m=><PosterCard key={m.id} movie={m} onClick={onPosterClick} size="row"/>)
        : [...Array(5)].map((_,i)=><div key={i} className="min-w-[105px] w-[105px] aspect-[2/3] rounded-2xl shimmer flex-shrink-0"/>)
      }
    </div>
  </section>
));

// ─────────────────────────────────────────────
// ExclusiveZone
// ─────────────────────────────────────────────
const ExclusiveZone = memo(({onPress}:{onPress:()=>void}) => (
  <section className="px-3 mb-4">
    <motion.div whileTap={{scale:0.97}} onClick={onPress}
      className="relative w-full rounded-3xl overflow-hidden cursor-pointer will-change-transform"
      style={{boxShadow:'0 8px 40px rgba(245,158,11,0.15), 0 2px 8px rgba(0,0,0,0.4)'}}>
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0e00] via-[#2d1800] to-[#111008]"/>
      <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl pointer-events-none"/>
      <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-amber-400/70 to-transparent"/>
      <div className="absolute bottom-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-amber-600/30 to-transparent"/>
      <div className="absolute inset-0 rounded-3xl border border-amber-500/20"/>
      <div className="relative z-10 px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative h-13 w-13 flex-shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/25 to-amber-800/20 border border-amber-500/30"/>
            <div className="absolute inset-0 flex items-center justify-center">
              <Crown size={22} className="text-amber-400" fill="rgba(245,158,11,0.3)"/>
            </div>
            <div className="absolute -top-1.5 -right-1.5 bg-amber-500 rounded-full px-1.5 py-0.5">
              <span className="text-[7px] font-black text-black tracking-wider">VIP</span>
            </div>
          </div>
          <div>
            <p className="font-[Hind+Siliguri] font-black text-white text-[17px] leading-tight">
              {config.exclusive.title}
            </p>
            <p className="text-[9px] text-amber-400/50 font-semibold mt-0.5 tracking-wide">
              {config.exclusive.subtitle}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl px-3.5 py-2.5 flex items-center gap-1.5 shadow-lg shadow-amber-900/40">
            <TelegramIcon size={12}/>
            <span className="font-[Hind+Siliguri] font-black text-black text-[11px] leading-none">প্রবেশ করুন</span>
          </div>
        </div>
      </div>
    </motion.div>
  </section>
));

// ─────────────────────────────────────────────
// ChannelsGrid
// ─────────────────────────────────────────────
const ChannelsGrid = memo(({onOpen}:{onOpen:(link:string)=>void}) => (
  <section className="px-3 mb-5">
    <h3 className="font-[Hind+Siliguri] font-black text-[14px] text-white/90 mb-2.5 px-0.5">সব চ্যানেল</h3>
    <div className="grid grid-cols-2 gap-2">
      {CHANNEL_CATEGORIES.map(cat=>(
        <motion.div key={cat.id} whileTap={{scale:0.95}}
          onClick={()=>onOpen(cat.link)}
          className={`relative h-[76px] rounded-2xl bg-gradient-to-br ${cat.grad} px-3 flex items-center gap-2.5 border border-white/8 cursor-pointer overflow-hidden will-change-transform`}>
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/10"/>
          <div className="h-8 w-8 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 flex-shrink-0">
            <div className="text-white">{cat.icon}</div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-[Hind+Siliguri] font-black text-white text-[12px] leading-tight truncate">{cat.name}</p>
            <span className="font-[Hind+Siliguri] text-[9.5px] text-white/55 font-semibold leading-snug line-clamp-2 whitespace-normal">{cat.badge}</span>
          </div>
        </motion.div>
      ))}
    </div>
  </section>
));

// ─────────────────────────────────────────────
// SearchResultCard
// ─────────────────────────────────────────────
const SearchResultCard = memo(({item, onPress}:{item:TMDBContent; onPress:(item:TMDBContent)=>void}) => {
  const label = resolveChannelLabel(item);
  const imgSrc = item.poster_path ? `${IMG_W185}${item.poster_path}` : '';
  const year = (item.release_date||item.first_air_date||'').slice(0,4);
  const handlePress = useCallback(()=>onPress(item),[item,onPress]);

  return (
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:0.18}}
      onClick={handlePress}
      className="flex items-center gap-3 px-4 py-2.5 active:bg-white/5 transition-colors cursor-pointer">
      {/* Poster */}
      <div className="relative h-14 w-10 rounded-lg overflow-hidden bg-[#1A1A20] flex-shrink-0 border border-white/5">
        {imgSrc ? <LazyImg src={imgSrc} className="w-full h-full object-cover"/> : <div className="w-full h-full shimmer"/>}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white text-[12px] leading-snug truncate">
          {item.title||item.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {year && <span className="text-[9px] text-white/35 font-bold">{year}</span>}
          {item.vote_average > 0 && (
            <span className="flex items-center gap-0.5 text-[9px] text-[#FFD700] font-black">
              <Star size={7} fill="currentColor"/> {item.vote_average.toFixed(1)}
            </span>
          )}
        </div>
        {/* Channel badge */}
        <div className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 border"
          style={{borderColor:`${label.color}30`, background:`${label.color}12`}}>
          <TelegramIcon size={8}/>
          <span className="text-[8px] font-black" style={{color:label.color}}>{label.name}</span>
        </div>
      </div>
      {/* Arrow */}
      <div className="h-7 w-7 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/8">
        <Play size={10} fill="white" className="text-white ml-0.5"/>
      </div>
    </motion.div>
  );
});

// ─────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────
const CineVault = () => {
  // ── state ──
  const [isRefreshing,    setIsRefreshing]    = useState(false);
  const [lastUpdated,     setLastUpdated]     = useState<Date|null>(null);
  const [heroContent,     setHeroContent]     = useState<TMDBContent|null>(null);
  const [trending,        setTrending]        = useState<TMDBContent[]>([]);
  const [popularTV,       setPopularTV]       = useState<TMDBContent[]>([]);
  const [anime,           setAnime]           = useState<TMDBContent[]>([]);
  const [kdrama,          setKdrama]          = useState<TMDBContent[]>([]);
  const [banglaMovies,    setBanglaMovies]    = useState<TMDBContent[]>([]);
  const [banglaSeries,    setBanglaSeries]    = useState<TMDBContent[]>([]);
  const [hindiMovies,     setHindiMovies]     = useState<TMDBContent[]>([]);
  const [southMovies,     setSouthMovies]     = useState<TMDBContent[]>([]);
  const [adultSeries,     setAdultSeries]     = useState<TMDBContent[]>([]);
  const [natoklist,       setNatoklist]       = useState<TMDBContent[]>([]);
  const [selectedContent, setSelectedContent] = useState<TMDBContent|null>(null);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [isModalOpen,     setIsModalOpen]     = useState(false);
  const [viewAllCategory, setViewAllCategory] = useState<{title:string;data:TMDBContent[];link:string}|null>(null);
  const [trailerKey,      setTrailerKey]      = useState<string|null>(null);
  const [showVideo,       setShowVideo]       = useState(false);

  // ── search state ──
  const [searchQuery,     setSearchQuery]     = useState('');
  const [searchResults,   setSearchResults]   = useState<TMDBContent[]>([]);
  const [searchLoading,   setSearchLoading]   = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const deferredQuery = useDeferredValue(searchQuery);
  const searchRef     = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>|null>(null);

  // ── TMDB load ──
  const loadTMDB = useCallback(async()=>{
    setIsRefreshing(true);
    if(!TMDB_KEY){
      [setTrending,setPopularTV,setAnime,setKdrama,setBanglaMovies,setBanglaSeries,setHindiMovies]
        .forEach(fn=>fn(FALLBACK));
      setHeroContent(FALLBACK[0]); setLastUpdated(new Date()); setIsRefreshing(false);
      return;
    }
    try {
      const r1 = await fetch(`${TMDB_BASE}/trending/movie/week?api_key=${TMDB_KEY}`).then(r=>r.json());
      const res1 = r1.results || FALLBACK;
      setTrending(res1);
      setHeroContent(res1[Math.floor(Math.random()*Math.min(5,res1.length))]);
      const [r2,r3,r4,r5,r6,r7,r8,r9] = await Promise.all([
        fetch(`${TMDB_BASE}/tv/popular?api_key=${TMDB_KEY}`).then(r=>r.json()),
        fetch(`${TMDB_BASE}/discover/tv?api_key=${TMDB_KEY}&with_genres=16&with_origin_country=JP&sort_by=popularity.desc`).then(r=>r.json()),
        fetch(`${TMDB_BASE}/discover/tv?api_key=${TMDB_KEY}&with_origin_country=KR&sort_by=popularity.desc`).then(r=>r.json()),
        fetch(`${TMDB_BASE}/discover/movie?api_key=${TMDB_KEY}&with_original_language=bn&sort_by=popularity.desc`).then(r=>r.json()),
        fetch(`${TMDB_BASE}/discover/tv?api_key=${TMDB_KEY}&with_original_language=bn&sort_by=popularity.desc`).then(r=>r.json()),
        fetch(`${TMDB_BASE}/discover/movie?api_key=${TMDB_KEY}&with_original_language=hi&sort_by=popularity.desc&primary_release_year=2024`).then(r=>r.json()),
        // 🎭 South Indian — Telugu + Tamil একসাথে
        fetch(`${TMDB_BASE}/discover/movie?api_key=${TMDB_KEY}&with_original_language=te%7Cta%7Cml&sort_by=popularity.desc`).then(r=>r.json()),
        // 🔞 Bold/Thriller web series — Crime Drama genre, popular, with posters
        fetch(`${TMDB_BASE}/discover/tv?api_key=${TMDB_KEY}&with_genres=80&sort_by=popularity.desc&vote_average.gte=7&vote_count.gte=500`).then(r=>r.json()),
      ]);
      setPopularTV(r2.results||FALLBACK);   setAnime(r3.results||FALLBACK);
      setKdrama(r4.results||FALLBACK);      setBanglaMovies(r5.results||FALLBACK);
      setBanglaSeries(r6.results||FALLBACK); setHindiMovies(r7.results||FALLBACK);
      setSouthMovies(r8.results||FALLBACK);  setAdultSeries(r9.results||FALLBACK);

      // 🇧🇩 YouTube থেকে বাংলাদেশি নাটক fetch
      const ytKey = config.youtube?.apiKey;
      if (ytKey && ytKey !== 'YOUR_YOUTUBE_API_KEY') {
        try {
          const ytResults: TMDBContent[] = [];
          for (const ch of config.youtube.channels) {
            const ytRes = await fetch(
              `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${ch.id}&maxResults=${config.youtube.maxResultsPerChannel}&order=date&type=video&key=${ytKey}`
            ).then(r => r.json());
            if (ytRes.items) {
              ytRes.items.forEach((item: any, idx: number) => {
                ytResults.push({
                  id: idx + Math.random() * 10000,
                  title: item.snippet.title,
                  name: item.snippet.title,
                  poster_path: '', // YouTube thumbnail আলাদাভাবে handle হবে
                  backdrop_path: item.snippet.thumbnails?.high?.url || '',
                  vote_average: 8.0,
                  overview: item.snippet.description,
                  release_date: item.snippet.publishedAt,
                  original_language: 'bn',
                  genre_ids: [],
                  youtube_thumbnail: item.snippet.thumbnails?.medium?.url || '',
                  youtube_video_id: item.id?.videoId || '',
                });
              });
            }
          }
          setNatoklist(ytResults);
        } catch(ytErr) { console.error('YouTube fetch error:', ytErr); }
      }

      setLastUpdated(new Date());
    } catch(e){ console.error(e); }
    finally { setIsRefreshing(false); }
  },[]);

  useEffect(()=>{
    const tg = (window as any).Telegram?.WebApp;
    if(tg){ tg.ready(); tg.expand(); }
    loadTMDB();
  },[loadTMDB]);

  useEffect(()=>{
    const id = setInterval(loadTMDB, AUTO_REFRESH_MS);
    return ()=>clearInterval(id);
  },[loadTMDB]);

  // ── Search with debounce ──
  useEffect(()=>{
    if(searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if(!deferredQuery.trim()){ setSearchResults([]); setSearchLoading(false); return; }
    setSearchLoading(true);
    searchTimerRef.current = setTimeout(async()=>{
      if(!TMDB_KEY){ setSearchLoading(false); return; }
      try {
        const data = await fetch(
          `${TMDB_BASE}/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(deferredQuery)}&page=1`
        ).then(r=>r.json());
        const filtered = (data.results||[]).filter(
          (i:TMDBContent)=>i.poster_path && (i.title||i.name) && i.vote_average > 0
        ).slice(0,20);
        setSearchResults(filtered);
      } catch(e){ setSearchResults([]); }
      finally { setSearchLoading(false); }
    }, 420);
    return ()=>{ if(searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  },[deferredQuery]);

  // ── Telegram open ──
  const openChannel = useCallback((username:string)=>{
    if(!username) return;
    const tg = (window as any).Telegram?.WebApp;
    if(tg) tg.openTelegramLink(`https://t.me/${username}`);
    else window.open(`https://t.me/${username}`,'_blank');
  },[]);

  // ── Poster click ──
  const handlePosterClick = useCallback(async(content:TMDBContent, channelLink:string)=>{
    setSelectedContent(content);
    setSelectedChannel(channelLink);
    setIsModalOpen(true);
    setTrailerKey(null); setShowVideo(false);
    if(!TMDB_KEY) return;
    try {
      const type = content.release_date ? 'movie' : 'tv';
      const data = await fetch(`${TMDB_BASE}/${type}/${content.id}/videos?api_key=${TMDB_KEY}`).then(r=>r.json());
      const tr = data.results?.find((v:any)=>v.type==='Trailer'&&v.site==='YouTube');
      if(tr) setTrailerKey(tr.key);
    } catch(e){}
  },[]);

  // ── Search result click → smart channel ──
  const handleSearchClick = useCallback((item:TMDBContent)=>{
    const ch = resolveChannel(item);
    handlePosterClick(item, ch);
    setIsSearchFocused(false);
    setSearchQuery('');
    searchRef.current?.blur();
  },[handlePosterClick]);

  const closeSearch = useCallback(()=>{
    setIsSearchFocused(false);
    setSearchQuery('');
    searchRef.current?.blur();
  },[]);

  const getTypeLabel = (c:TMDBContent) => c.release_date ? 'মুভি' : 'সিরিজ';
  const getYear = (c:TMDBContent) => {
    const d = c.release_date||c.first_air_date||'';
    return d ? new Date(d).getFullYear() : '';
  };

  const isSearchActive = isSearchFocused || searchQuery.length > 0;
  const isSubPage = !!viewAllCategory;

  return (
    <div className="flex flex-col h-screen bg-[#0E0E12] text-white overflow-hidden">

      {/* ── Header ── */}
      <header className="flex items-center gap-2.5 px-3.5 z-[110] bg-[#0E0E12]/90 backdrop-blur-md fixed top-0 w-full h-14 border-b border-white/5">
        {isSubPage ? (
          <button className="h-9 w-9 bg-white/8 rounded-full flex items-center justify-center text-[#4FC3F7] active:scale-90 transition-transform border border-white/10 flex-shrink-0"
            onClick={()=>setViewAllCategory(null)}>
            <ChevronLeft size={20}/>
          </button>
        ) : isSearchActive ? (
          <button className="h-9 w-9 bg-white/8 rounded-full flex items-center justify-center text-white/60 active:scale-90 transition-transform border border-white/10 flex-shrink-0"
            onClick={closeSearch}>
            <ChevronLeft size={20}/>
          </button>
        ) : (
          /* Brand */
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="flex items-baseline">
              <span className="syne font-black text-white text-[1.1rem] leading-none tracking-[-0.02em]">CINE</span>
              <span className="syne font-black text-[#4FC3F7] text-[1.1rem] leading-none" style={{textShadow:'0 0 12px rgba(79,195,247,0.8)'}}>.</span>
              <span className="syne font-black text-white/75 text-[1.1rem] leading-none tracking-[-0.02em]">VAULT</span>
            </div>
          </div>
        )}

        {/* Search bar */}
        {!isSubPage && (
          <div className="flex-1 relative">
            <div className={`flex items-center gap-2 h-9 rounded-full border px-3 transition-all duration-200 ${
              isSearchActive ? 'bg-white/8 border-[#4FC3F7]/40' : 'bg-white/5 border-white/8'}`}>
              <Search size={13} className={`flex-shrink-0 transition-colors ${isSearchActive?'text-[#4FC3F7]':'text-white/30'}`}/>
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={e=>setSearchQuery(e.target.value)}
                onFocus={()=>setIsSearchFocused(true)}
                placeholder="মুভি, সিরিজ, এনিমি খুঁজুন..."
                className="bg-transparent text-white text-[12px] font-medium placeholder-white/25 outline-none w-full"
              />
              {searchQuery.length > 0 && (
                <button onClick={()=>setSearchQuery('')} className="flex-shrink-0">
                  <X size={12} className="text-white/40"/>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Refresh / time */}
        {!isSubPage && !isSearchActive && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {lastUpdated && (
              <span className="text-[8px] text-white/25 font-bold hidden sm:block">
                {lastUpdated.toLocaleTimeString('bn-BD',{hour:'2-digit',minute:'2-digit'})}
              </span>
            )}
            <button onClick={loadTMDB} disabled={isRefreshing}
              className="h-8 w-8 bg-white/5 rounded-full flex items-center justify-center border border-white/8 active:scale-90 transition-transform disabled:opacity-30">
              <RefreshCw size={12} className={`text-[#4FC3F7] ${isRefreshing?'animate-spin':''}`}/>
            </button>
          </div>
        )}
      </header>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col pt-14 relative overflow-hidden">
        <AnimatePresence mode="wait">

          {/* ── Search Results ── */}
          {isSearchActive && (
            <motion.div key="search" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              transition={{duration:0.15}}
              className="flex-1 overflow-y-auto no-scrollbar">

              {searchLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="h-7 w-7 border-2 border-white/10 border-t-[#4FC3F7] rounded-full animate-spin"/>
                </div>
              )}

              {!searchLoading && searchQuery.length > 0 && searchResults.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                  <Search size={32} className="text-white/10 mb-3"/>
                  <p className="text-white/30 text-sm font-bold">কিছু পাওয়া যায়নি</p>
                  <p className="text-white/15 text-[11px] mt-1">অন্য নামে খুঁজে দেখুন</p>
                </div>
              )}

              {!searchLoading && searchQuery.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                  <Search size={28} className="text-[#4FC3F7]/20 mb-3"/>
                  <p className="text-white/25 text-sm font-bold">মুভি বা সিরিজের নাম লিখুন</p>
                </div>
              )}

              {!searchLoading && searchResults.length > 0 && (
                <div className="py-2 pb-20">
                  <p className="px-4 pb-2 text-[9px] text-white/25 font-black uppercase tracking-widest">
                    {searchResults.length}টি ফলাফল
                  </p>
                  {searchResults.map(item=>(
                    <SearchResultCard key={`${item.id}-${item.media_type}`} item={item} onPress={handleSearchClick}/>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Home ── */}
          {!isSearchActive && !viewAllCategory && (
            <motion.div key="hub" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              transition={{duration:0.2}}
              className="flex-1 overflow-y-auto no-scrollbar pb-20">

              {/* Hero */}
              <section className="px-3 mb-4 mt-2">
                <div onClick={()=>heroContent&&handlePosterClick(heroContent,config.heroBanner)}
                  className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-[#1A1A20] shadow-xl cursor-pointer active:scale-[0.985] transition-transform will-change-transform">
                  {heroContent&&(heroContent.backdrop_path||heroContent.poster_path) ? (
                    <>
                      <LazyImg src={`${IMG_W500}${heroContent.backdrop_path||heroContent.poster_path}`}
                        className="w-full h-full object-cover opacity-70"/>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"/>
                      <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                        <div>
                          <div className="h-[3px] w-5 bg-[#A855F7] rounded-full mb-1"/>
                          <span className="text-[7px] font-black text-white/40 uppercase tracking-[0.3em]">Trending Now</span>
                        </div>
                        <button onClick={e=>{e.stopPropagation();openChannel(config.heroBanner);}}
                          className="bg-gradient-to-r from-[#A855F7] to-[#7C3AED] text-white h-7 px-3 rounded-lg font-black text-[9px] uppercase tracking-wider active:scale-90 transition-transform flex items-center gap-1.5">
                          <TelegramIcon size={10}/> মেইন চ্যানেল
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full shimmer"/>
                  )}
                </div>
              </section>

              {/* Exclusive */}
              <ExclusiveZone onPress={()=>openChannel(config.exclusive.channel)}/>

              {/* Channels */}
              <ChannelsGrid onOpen={openChannel}/>

              {/* Notice */}
              <section className="px-5">
                <p className="font-[Hind+Siliguri] text-[12px] text-white/45 leading-relaxed text-center">
                  📢 আপনার পছন্দের চ্যানেলগুলো জয়েন করুন — প্রতিটি চ্যানেলে প্রতিদিন নতুন ভিডিও আপলোড হয়। মিস করবেন না! 🎬
                </p>
              </section>

              {/* Poster rows */}
              <div className="space-y-7 pb-8">
                <PosterRow title="ট্রেন্ডিং মুভি"    data={trending}
                  onPosterClick={m=>handlePosterClick(m,config.rows.trendingMovies)}
                  onViewAll={()=>setViewAllCategory({title:'ট্রেন্ডিং মুভি',    data:trending,     link:config.rows.trendingMovies})}/>
                <PosterRow title="হিন্দি মুভি"        data={hindiMovies}
                  onPosterClick={m=>handlePosterClick(m,config.rows.hindiMovies)}
                  onViewAll={()=>setViewAllCategory({title:'হিন্দি মুভি',       data:hindiMovies,  link:config.rows.hindiMovies})}/>
                <PosterRow title="বাংলা ওয়েব সিরিজ" data={banglaSeries}
                  onPosterClick={m=>handlePosterClick(m,config.rows.banglaSeries)}
                  onViewAll={()=>setViewAllCategory({title:'বাংলা ওয়েব সিরিজ',data:banglaSeries, link:config.rows.banglaSeries})}/>
                <PosterRow title="সেরা বাংলা মুভি"   data={banglaMovies}
                  onPosterClick={m=>handlePosterClick(m,config.rows.banglaMovies)}
                  onViewAll={()=>setViewAllCategory({title:'সেরা বাংলা মুভি',  data:banglaMovies, link:config.rows.banglaMovies})}/>
                <PosterRow title="জনপ্রিয় টিভি শো"  data={popularTV}
                  onPosterClick={m=>handlePosterClick(m,config.rows.popularTV)}
                  onViewAll={()=>setViewAllCategory({title:'জনপ্রিয় টিভি শো', data:popularTV,    link:config.rows.popularTV})}/>
                <PosterRow title="এনিমি দুনিয়া"      data={anime}
                  onPosterClick={m=>handlePosterClick(m,config.rows.anime)}
                  onViewAll={()=>setViewAllCategory({title:'এনিমি দুনিয়া',     data:anime,        link:config.rows.anime})}/>
                <PosterRow title="সেরা কে-ড্রামা"    data={kdrama}
                  onPosterClick={m=>handlePosterClick(m,config.rows.kdrama)}
                  onViewAll={()=>setViewAllCategory({title:'সেরা কে-ড্রামা',   data:kdrama,        link:config.rows.kdrama})}/>
                <PosterRow title="সাউথ ইন্ডিয়ান মুভি" data={southMovies}
                  onPosterClick={m=>handlePosterClick(m,config.rows.southMovies)}
                  onViewAll={()=>setViewAllCategory({title:'সাউথ ইন্ডিয়ান মুভি', data:southMovies, link:config.rows.southMovies})}/>
                {natoklist.length > 0 && (
                  <PosterRow title="🇧🇩 বাংলাদেশি নাটক" data={natoklist}
                    onPosterClick={m=>handlePosterClick(m,config.rows.natok)}
                    onViewAll={()=>setViewAllCategory({title:'বাংলাদেশি নাটক', data:natoklist,    link:config.rows.natok})}/>
                )}
              </div>
            </motion.div>
          )}

          {/* ── View All Grid ── */}
          {!isSearchActive && viewAllCategory && (
            <motion.div key="grid" initial={{opacity:0,x:24}} animate={{opacity:1,x:0}} exit={{opacity:0}}
              transition={{duration:0.2}}
              className="flex-1 overflow-y-auto px-3 py-5 no-scrollbar">
              <div className="mb-5">
                <h2 className="font-[Hind+Siliguri] font-black text-xl text-white">{viewAllCategory.title}</h2>
                <div className="h-[3px] w-10 bg-[#4FC3F7] mt-1 rounded-full"/>
              </div>
              <div className="grid grid-cols-3 gap-2.5 pb-20">
                {viewAllCategory.data.slice(0,30).map(movie=>(
                  <PosterCard key={movie.id} movie={movie} size="grid"
                    onClick={m=>handlePosterClick(m,viewAllCategory.link)}/>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ── Modal ── */}
      <AnimatePresence>
        {isModalOpen && selectedContent && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            transition={{duration:0.15}}
            className="fixed inset-0 z-[200] bg-black/75 flex items-end justify-center backdrop-blur-sm"
            onClick={()=>setIsModalOpen(false)}>
            <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}}
              transition={{type:'spring',damping:32,stiffness:340}}
              className="bg-[#111116] w-full max-w-lg rounded-t-[28px] overflow-hidden border-t border-white/5 will-change-transform"
              onClick={e=>e.stopPropagation()}>

              {/* Handle */}
              <div className="flex justify-center pt-2.5 pb-1">
                <div className="h-[3px] w-9 bg-white/12 rounded-full"/>
              </div>

              {/* Backdrop / trailer */}
              <div className="relative aspect-video bg-[#0a0a0f]">
                {showVideo && trailerKey ? (
                  <iframe src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
                    className="w-full h-full border-none" allow="autoplay; encrypted-media" allowFullScreen/>
                ) : (
                  <>
                    {selectedContent.backdrop_path||selectedContent.poster_path ? (
                      <LazyImg src={`${IMG_W500}${selectedContent.backdrop_path||selectedContent.poster_path}`}
                        className="w-full h-full object-cover opacity-80"/>
                    ) : <div className="w-full h-full bg-[#1A1A20]"/>}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111116] via-black/10 to-transparent"/>
                    {trailerKey && (
                      <button onClick={()=>setShowVideo(true)}
                        className="absolute inset-0 m-auto h-14 w-14 bg-white/90 rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-2xl will-change-transform">
                        <Play size={18} fill="#111116" className="text-[#111116] ml-1"/>
                      </button>
                    )}
                  </>
                )}
                <button onClick={()=>setIsModalOpen(false)}
                  className="absolute top-2.5 right-2.5 h-8 w-8 bg-black/50 rounded-full flex items-center justify-center border border-white/10">
                  <X size={14}/>
                </button>
              </div>

              {/* Info */}
              <div className="px-5 pt-4 pb-2">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h2 className="syne font-black text-[18px] leading-tight uppercase tracking-tight flex-1">
                    {selectedContent.title||selectedContent.name}
                  </h2>
                  <span className="bg-[#4FC3F7]/10 text-[#4FC3F7] text-[8px] font-black px-2 py-1 rounded-full border border-[#4FC3F7]/20 uppercase tracking-widest whitespace-nowrap mt-1">
                    {getTypeLabel(selectedContent)}
                  </span>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex items-center gap-1 text-[#FFD700] text-[11px] font-black">
                    <Star size={10} fill="currentColor"/> {selectedContent.vote_average.toFixed(1)}
                  </span>
                  {getYear(selectedContent) && <span className="text-[10px] text-white/35 font-bold">{getYear(selectedContent)}</span>}
                  <span className="flex items-center gap-1 text-[10px] text-green-400 font-bold">
                    <CheckCircle size={9}/> Free
                  </span>
                </div>
                <p className="text-[11px] text-white/45 leading-relaxed line-clamp-2 mb-1">
                  {selectedContent.overview||'No description available.'}
                </p>
              </div>

              {/* CTA */}
              <div className="px-5 pb-8 pt-1">
                <button onClick={()=>openChannel(selectedChannel)}
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#0088cc] to-[#00aaff] flex items-center justify-center gap-2.5 active:opacity-80 transition-opacity shadow-lg shadow-blue-900/25 will-change-transform">
                  <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Play size={13} fill="white" className="text-white ml-0.5"/>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-[Hind+Siliguri] font-black text-white text-[14px] leading-tight">এখনই দেখুন — ফ্রি!</span>
                    <span className="text-white/55 text-[8px] font-bold uppercase tracking-wider">Telegram Channel এ যোগ দিন</span>
                  </div>
                  <TelegramIcon size={17}/>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CineVault;
