// ============================================================
// 🎬 CINE VAULT — CHANNEL CONFIG
// শুধু এই ফাইলটা edit করো, বাকি সব automatic!
// ============================================================

const config = {

  // ── চ্যানেল পোর্টাল এর links ──────────────────────────────
  // 👉 t.me/USERNAME — শুধু USERNAME টা বসাও (@ ছাড়া)
  channelPortal: {
    movies:    'Movies_CineVault',         // 🎬 মুভি চ্যানেল
    series:    'Series_CineVault',         // 📺 ওয়েব সিরিজ চ্যানেল
    anime:     'Anime_CineVault',          // 🔥 এনিমি দুনিয়া চ্যানেল
    kdrama:    'KDrama_CineVault',         // 💜 কে-ড্রামা লাভার্স
    hindi:     'YOUR_HINDI_CHANNEL',       // 🔧 তোমার হিন্দি ডাবড চ্যানেল username
    bangla:    'YOUR_BANGLA_CHANNEL',      // 🔧 তোমার বাংলা ডাবড চ্যানেল username
    south:     'YOUR_SOUTH_CHANNEL',       // 🎭 তোমার সাউথ ইন্ডিয়ান চ্যানেল username
    adult:     'YOUR_ADULT_CHANNEL',       // 🔞 তোমার 18+ ওয়েব সিরিজ চ্যানেল username
    natok:     'YOUR_NATOK_CHANNEL',       // 🇧🇩 তোমার বাংলাদেশি নাটক চ্যানেল username
  },

  // ── প্রতিটা Row এর link ────────────────────────────────────
  rows: {
    trendingMovies:  'Movies_CineVault',
    hindiMovies:     'YOUR_HINDI_CHANNEL',
    banglaSeries:    'Series_CineVault',
    banglaMovies:    'YOUR_BANGLA_CHANNEL',
    popularTV:       'Series_CineVault',
    anime:           'Anime_CineVault',
    kdrama:          'KDrama_CineVault',
    southMovies:     'YOUR_SOUTH_CHANNEL',      // 🔧 সাউথ ইন্ডিয়ান রো
    adultSeries:     'YOUR_ADULT_CHANNEL',      // 🔧 18+ রো
    natok:           'YOUR_NATOK_CHANNEL',      // 🔧 বাংলাদেশি নাটক রো
  },

  // ── Hero Banner ────────────────────────────────────────────
  heroBanner: 'Movies_CineVault',

  // ── Premium / Exclusive Zone ───────────────────────────────
  exclusive: {
    channel:  'YOUR_EXCLUSIVE_CHANNEL',
    title:    'প্রিমিয়াম জোন',
    subtitle: 'Top Rated · HD Quality',
  },

  // ── YouTube API (বাংলাদেশি নাটক automatic fetch) ──────────
  // 👇 তোমার YouTube Data API v3 key এখানে বসাও
  youtube: {
    apiKey: 'YOUR_YOUTUBE_API_KEY',

    // YouTube channel ID বের করার নিয়ম:
    // YouTube এ channel এ যাও → About → Share → Copy channel ID
    channels: [
      { id: 'UCqW9PFYjFSQSgySaHrYHrag', name: 'Chorki' },
      { id: 'UCCrCBXVVBCq4noMFlXaqW7A', name: 'Hoichoi' },
      { id: 'UCVp8KEYJKZ2kKqzmtqkHDhQ', name: 'Binge' },
      // আরো channel: { id: 'CHANNEL_ID', name: 'নাম' },
    ],

    maxResultsPerChannel: 6,
  },

};

export default config;
