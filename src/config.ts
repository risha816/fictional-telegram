// ============================================================
// 🎬 CINE VAULT — CHANNEL CONFIG
// শুধু এই ফাইলটা edit করো, বাকি সব automatic!
// ============================================================

const config = {

  // ── চ্যানেল পোর্টাল এর links ──────────────────────────────
  // 👉 t.me/USERNAME — শুধু USERNAME টা বসাও (@ ছাড়া)
  channelPortal: {
    movies:    'Movies_CineVault',       // 🎬 মুভি চ্যানেল
    series:    'Series_CineVault',       // 📺 ওয়েব সিরিজ চ্যানেল
    anime:     'Anime_CineVault',        // 🔥 এনিমি দুনিয়া চ্যানেল
    kdrama:    'KDrama_CineVault',       // 💜 কে-ড্রামা লাভার্স
    hindi:     'YOUR_HINDI_CHANNEL',     // 🔧 তোমার হিন্দি ডাবড চ্যানেল username
    bangla:    'YOUR_BANGLA_CHANNEL',    // 🔧 তোমার বাংলা ডাবড চ্যানেল username
  },

  // ── প্রতিটা Row এর link ────────────────────────────────────
  // 👉 কোন poster click করলে কোন channel এ যাবে সেটা এখানে
  rows: {
    trendingMovies:  'Movies_CineVault',
    hindiMovies:     'YOUR_HINDI_CHANNEL',    // 🔧 তোমার হিন্দি চ্যানেল
    banglaSeries:    'Series_CineVault',
    banglaMovies:    'YOUR_BANGLA_CHANNEL',   // 🔧 তোমার বাংলা মুভি চ্যানেল
    popularTV:       'Series_CineVault',
    anime:           'Anime_CineVault',
    kdrama:          'KDrama_CineVault',
  },

  // ── Hero Banner (উপরের বড় ছবি) ───────────────────────────
  // 👉 "মেইন চ্যানেল" বাটন এ click করলে এই channel এ যাবে
  heroBanner: 'Movies_CineVault',            // 🔧 তোমার মেইন channel username

  // ── Premium Zone Card (Home page এ দেখাবে) ────────────────
  // 👉 এই card টা click করলে exclusive channel এ যাবে
  exclusive: {
    channel:  'YOUR_EXCLUSIVE_CHANNEL',      // 🔧 তোমার Premium/Exclusive channel username
    title:    'প্রিমিয়াম জোন',               // 🔧 card এ যে নাম দেখাবে
    subtitle: 'Top Rated · HD Quality',      // 🔧 নিচে ছোট text (চাইলে বদলাও)
  },

};

export default config;
