const MANGADEX_API_URL = "https://api.mangadex.org";

export interface MangaDexManga {
  id: string;
  title: string;
}

export interface MangaDexChapter {
  id: string;
  chapter: string;
  title: string;
  pages: number;
}

async function fetchMangaDex(endpoint: string, params: Record<string, any> = {}) {
  const url = new URL(`${MANGADEX_API_URL}${endpoint}`);
  
  const buildParams = (obj: any, prefix = "") => {
    Object.entries(obj).forEach(([k, v]) => {
      const key = prefix ? `${prefix}[${k}]` : k;
      if (v !== null && typeof v === "object" && !Array.isArray(v)) {
        buildParams(v, key);
      } else if (Array.isArray(v)) {
        v.forEach(val => url.searchParams.append(`${key}[]`, val));
      } else {
        url.searchParams.append(key, String(v));
      }
    });
  };

  buildParams(params);
  
  const response = await fetch(url.toString());
  if (!response.ok) {
    const errText = await response.text();
    console.error(`MangaDex API Error Body: ${errText}`);
    throw new Error(`MangaDex API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function searchMangaDex(title: string): Promise<string | null> {
  try {
    const data = await fetchMangaDex("/manga", { title, limit: 1 });
    if (data.data && data.data.length > 0) {
      return data.data[0].id;
    }
    return null;
  } catch (e) {
    console.error("MangaDex search error:", e);
    return null;
  }
}

export async function getMangaChapters(mangaId: string, limit = 100): Promise<MangaDexChapter[]> {
  try {
    const data = await fetchMangaDex(`/manga/${mangaId}/feed`, {
      translatedLanguage: ["en"],
      order: { chapter: "desc" },
      limit: String(limit),
    });
    return data.data.map((c: any) => ({
      id: c.id,
      chapter: c.attributes.chapter,
      title: c.attributes.title || `Chapter ${c.attributes.chapter}`,
      pages: c.attributes.pages,
    }));
  } catch (e) {
    console.error("MangaDex chapters error:", e);
    return [];
  }
}

export async function getChapterImages(chapterId: string): Promise<string[]> {
  try {
    const data = await fetchMangaDex(`/at-home/server/${chapterId}`);
    const host = data.baseUrl;
    const hash = data.chapter.hash;
    const files = data.chapter.data; // High quality files
    return files.map((f: string) => `${host}/data/${hash}/${f}`);
  } catch (e) {
    console.error("MangaDex images error:", e);
    return [];
  }
}
