# KiraStreams Mobile

A free streaming app for movies, TV shows, and anime — built with React Native (Expo).

---

## Features

### Browsing
- **Hero Banner** — auto-cycling featured content with backdrop images, ratings, and a Watch Now button
- **Category Tabs** — filter between Trending, Movies, TV Shows, and Anime on the home screen
- **Content Sections** — horizontal scrollable rows for Popular Movies, Popular TV Shows, and Anime
- **TMDB Integration** — all metadata (titles, posters, ratings, overviews) powered by The Movie Database API

### Search
- **Multi-search** — search movies and TV shows simultaneously with debounced live results
- **Rich result cards** — shows poster, title, year, media type badge, rating, and overview

- **TV Episode Browser** — season selector and horizontal episode list with thumbnails
- **Auto-play & Auto-next** — enabled by default on supported servers
- **Cast list** — actor profile photos, names, and character names
- **Recommendations** — "You May Also Like" section below each title

### My Lists
- **Bookmarks** — save movies and shows to watch later, with one-tap removal
- **Watch History** — automatically tracks everything you watch including season/episode for TV

### Profile & Auth
- **Account creation & login** — backed by kirastreamsv2.vercel.app (shared with the web app)
- **Secure session storage** — JWT token stored in device SecureStore (encrypted)
- **Admin badge** — displayed for admin accounts
- **Clear watch history** — wipe all history with one tap
- **Guest mode** — browse and watch without an account

### Design
- Dark theme throughout
- Purple/blue gradient accent color scheme
- Smooth loading states and fallback placeholders for missing images

---

## Tech Stack

- **React Native** (Expo SDK 52)
- **Expo Router** — file-based navigation
- **expo-secure-store** — encrypted token storage
- **react-native-webview** — embedded video players
- **TMDB API** — content metadata
- 
---



---

> KiraStreams does not host any files. All content is provided by third-party streaming sources.
