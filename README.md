# Quietly Stream Mobile

Quietly Stream is a premium, all-in-one entertainment suite for Android, designed to provide a seamless streaming experience for movies, TV shows, anime, and manga. Optimized for high-speed performance on Ethiopian networks.

![App Preview](https://quietlystream.pro.et/assets/hero-movies.png)

## 🌟 Key Features

### 🎬 Entertainment Hub
- **Smart Hero Slider**: Dynamic, auto-cycling featured content with focal scaling for a premium look.
- **Categorized Browsing**: Easily switch between Trending, Movies, TV Shows, and Anime.
- **Detailed Metadata**: Comprehensive info including ratings, overviews, cast lists, and trailers (TMDB & AniList).
- **Manga Reader**: Integrated high-quality manga explorer and reader (MangaDex).

### ⚽ Live Football Integration
- **Global Coverage**: Real-time access to UCL, Premier League, La Liga, and more.
- **Smart Throttling**: Efficient API handling to respect rate limits while maintaining speed.
- **Priority Sorting**: Major leagues are automatically pinned to the top for quick access.
- **Dynamic Countdowns**: Real-time "Starts in Xh" counters for all upcoming matches.

### 🌐 Centralized Global Cache
- **Firebase Bridge**: Integrated Firebase Realtime Database to sync matches globally.
- **API Optimization**: One user fetches for all users, protecting the 50 req/day limit and saving costs.
- **Offline-First Persistence**: Instant loading from local JSON storage when internet is unavailable.

### 📺 Advanced Player
- **Multiple Servers**: Choose from Kira, Prime, Flash, and Swift servers for the best streaming speed.
- **Resume Playback**: Pick up exactly where you left off.
- **Auto-Play & Auto-Next**: Continuous viewing experience for series and anime.

### 👤 Personalized Experience
- **Secure Authentication**: Encrypted login and account management.
- **Global Watchlists**: Bookmark your favorite content across all categories.
- **Watch History**: Detailed tracking of your viewed movies and series progress.

### 📱 Multi-Device Responsiveness
- **Adaptive Layouts**: Seamlessly switches between Phone (Bottom Tabs), Tablet (Sidebar), and Android TV (Sidebar/Focus-First).
- **Custom Scaling Engine**: Specialized logic to ensure UI elements and fonts scale perfectly across all screen sizes and densities.
- **TV Focus Support**: Fully navigable via D-pad with smooth scaling animations and high-visibility focus states for a premium remote-control experience.

### 🌍 Multi-Language Support
- Full localized interface in **English**, **Spanish**, and **Arabic** (RTL support).

## 🛠️ Tech Stack
- **Framework**: React Native (Expo SDK 52)
- **Navigation**: Expo Router (File-based routing)
- **Responsive System**: Custom `useResponsive` hook with device-type detection
- **Scaling Utilities**: Custom `scaling.ts` for density-independent UI
- **State & Storage**: React Context, AsyncStorage, SecureStore
- **API Integrations**: TMDB (Movies/TV), AniList (Anime/Manga), MangaDex (Manga)
- **FireSync**: Firebase Realtime Database for global match caching
- **Styling**: Vanilla CSS-in-JS with custom design tokens

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or bun
- Expo Go (for development)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Medhanye6/Quietly-Movies-Stream-App-Full-Source-Code.git
   cd Quietly-Movies-Stream-App-Full-Source-Code
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Configure Environment:
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_TMDB_API_KEY=your_tmdb_key_here
   ```

4. Start the development server:
   ```bash
   npx expo start
   ```

## 📱 Download the App
Visit our official website to download the latest APK:
[quietlystream.pro.et](https://quietlystream.pro.et)

## 🤝 Community
Join our [Telegram Community](https://t.me/QuietlyStreams) for updates, requests, and support.

---

*Disclaimer: Quietly Stream does not host any files. All content is provided by non-affiliated third-party streaming sources.*
