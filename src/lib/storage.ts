import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

// ── Bookmarks ──────────────────────────────────────────────────────────────

export interface Bookmark {
  id: number | string;
  type: "movie" | "tv" | "anime" | "manga";
  title: string;
  poster_path: string | null;
  addedAt: number;
}

const BOOKMARKS_KEY = "kira_bookmarks";

export async function getBookmarks(): Promise<Bookmark[]> {
  try {
    const raw = await AsyncStorage.getItem(BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function addBookmark(item: Omit<Bookmark, "addedAt">): Promise<void> {
  const list = await getBookmarks();
  if (list.some((b) => b.id === item.id && b.type === item.type)) return;
  list.unshift({ ...item, addedAt: Date.now() });
  await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list));
}

export async function removeBookmark(id: number | string, type: string): Promise<void> {
  const list = await getBookmarks();
  const filtered = list.filter((b) => !(b.id === id && b.type === type));
  await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(filtered));
}

export async function isBookmarked(id: number | string, type: string): Promise<boolean> {
  const list = await getBookmarks();
  return list.some((b) => b.id === id && b.type === type);
}

// ── Watch History ──────────────────────────────────────────────────────────

export interface WatchHistoryItem {
  id: number | string;
  type: "movie" | "tv" | "anime" | "manga";
  title: string;
  poster_path: string | null;
  season?: number;
  episode?: number;
  watchedAt: number;
}

const HISTORY_KEY = "kira_history";

export async function getWatchHistory(): Promise<WatchHistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function addToHistory(item: Omit<WatchHistoryItem, "watchedAt">): Promise<void> {
  const list = await getWatchHistory();
  const filtered = list.filter((h) => !(h.id === item.id && h.type === item.type));
  filtered.unshift({ ...item, watchedAt: Date.now() });
  const trimmed = filtered.slice(0, 100);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}

// ── Auth ───────────────────────────────────────────────────────────────────

const TOKEN_KEY = "kira_token";
const USER_KEY  = "kira_user";

export interface StoredUser {
  id: string;
  email: string;
  name?: string;
  isAdmin?: boolean;
}

export async function storeAuth(token: string, user: StoredUser) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function getStoredAuth(): Promise<{ token: string; user: StoredUser } | null> {
  try {
    const token   = await SecureStore.getItemAsync(TOKEN_KEY);
    const rawUser = await SecureStore.getItemAsync(USER_KEY);
    if (!token || !rawUser) return null;
    return { token, user: JSON.parse(rawUser) };
  } catch { return null; }
}

export async function clearAuth() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}
