const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY ?? "";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export interface TMDBMovie {
  id: number;
  title: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  genre_ids: number[];
  media_type?: "movie" | "tv";
}

export interface TMDBMovieDetail extends TMDBMovie {
  runtime?: number;
  genres: { id: number; name: string }[];
  imdb_id?: string;
  external_ids?: { imdb_id?: string };
  credits?: {
    cast: Array<{ id: number; name: string; character: string; profile_path: string | null }>;
  };
  videos?: { results: Array<{ key: string; site: string; type: string }> };
  number_of_seasons?: number;
  seasons?: Array<{ id: number; season_number: number; episode_count: number; name: string }>;
}

export interface TMDBTVDetail {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  genres: { id: number; name: string }[];
  number_of_seasons: number;
  external_ids?: { imdb_id?: string };
  seasons: Array<{ id: number; season_number: number; episode_count: number; name: string; air_date: string }>;
  credits?: {
    cast: Array<{ id: number; name: string; character: string; profile_path: string | null }>;
  };
}

export interface TMDBSeason {
  episodes: Array<{
    id: number;
    episode_number: number;
    name: string;
    overview: string;
    still_path: string | null;
    air_date: string;
  }>;
}

async function tmdbFetch(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set("api_key", TMDB_API_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`TMDB API error: ${response.statusText}`);
  return response.json();
}

export async function getTrending(mediaType: "movie" | "tv" | "all" = "all", timeWindow: "day" | "week" = "week") {
  const data = await tmdbFetch(`/trending/${mediaType}/${timeWindow}`);
  return data.results as TMDBMovie[];
}

export async function getPopular(mediaType: "movie" | "tv", page = 1) {
  const data = await tmdbFetch(`/${mediaType}/popular`, { page: String(page) });
  return data.results as TMDBMovie[];
}

export async function getAnime(page = 1) {
  const data = await tmdbFetch("/discover/tv", {
    with_genres: "16",
    with_original_language: "ja",
    page: String(page),
    sort_by: "popularity.desc",
  });
  return data.results as TMDBMovie[];
}

export async function getMovieDetails(id: number): Promise<TMDBMovieDetail> {
  return await tmdbFetch(`/movie/${id}`, { append_to_response: "credits,videos,external_ids" });
}

export async function getTVDetails(id: number): Promise<TMDBTVDetail> {
  return await tmdbFetch(`/tv/${id}`, { append_to_response: "credits,external_ids" });
}

export async function getTVSeason(tvId: number, seasonNumber: number): Promise<TMDBSeason> {
  return await tmdbFetch(`/tv/${tvId}/season/${seasonNumber}`);
}

export async function searchMulti(query: string, page = 1) {
  const data = await tmdbFetch("/search/multi", { query, page: String(page) });
  return data.results as TMDBMovie[];
}

export async function getRecommendations(type: "movie" | "tv", id: number): Promise<TMDBMovie[]> {
  const data = await tmdbFetch(`/${type}/${id}/recommendations`);
  return data.results as TMDBMovie[];
}

export function getImageUrl(path: string | null, size: "w185" | "w342" | "w500" | "w780" | "w1280" | "original" = "w500"): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${TMDB_IMAGE_BASE}/${size}${cleanPath}`;
}

export function getEmbedUrl(
  player: "kira" | "prime" | "flash" | "swift",
  type: "movie" | "tv",
  id: number,
  season?: number,
  episode?: number
): string {
  if (type === "movie") {
    if (player === "kira")  return `https://vidrock.net/movie/${id}?autoplay=true&download=true`;
      if (player === "prime") return `https://vidlink.pro/movie/${id}?player=jw`;
      if (player === "flash") return `https://vidsrc.cc/v2/embed/movie/${id}?autoPlay=true`;
      if (player === "swift") return `https://vidsrc.icu/embed/movie/${id}?autoPlay=true`;
    } else {
        if (player === "kira")  return `https://vidrock.net/tv/${id}/${season}/${episode}?autoplay=true&autonext=true&download=true`;
    if (player === "prime") return `https://vidlink.pro/tv/${id}/${season}/${episode}?player=jw&autoplay=true`;
    if (player === "flash") return `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}?autoPlay=true`;
    if (player === "swift") return `https://vidsrc.icu/embed/tv/${id}/${season}/${episode}?autoPlay=true`;
  }
  return "";
}
