const ANILIST_URL = "https://graphql.anilist.co";

export interface AniListManga {
  id: number;
  title: {
    romaji: string;
    english: string;
    native: string;
  };
  coverImage: {
    large: string;
    extraLarge: string;
  };
  description: string;
  averageScore: number;
  genres: string[];
  status: string;
  chapters?: number;
  siteUrl?: string;
}

async function fetchAniList(query: string, variables: Record<string, any> = {}) {
  const response = await fetch(ANILIST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();
  if (json.errors) {
    throw new Error(json.errors[0].message);
  }
  return json.data;
}

export async function getTrendingManga(page = 1, perPage = 20): Promise<AniListManga[]> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page (page: $page, perPage: $perPage) {
        media (type: MANGA, sort: TRENDING_DESC) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            large
            extraLarge
          }
          description
          averageScore
          genres
          status
        }
      }
    }
  `;
  const data = await fetchAniList(query, { page, perPage });
  return data.Page.media;
}

export async function getMangaDetails(id: number): Promise<AniListManga> {
  const query = `
    query ($id: Int) {
      Media (id: $id, type: MANGA) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          extraLarge
        }
        description
        averageScore
        genres
        status
        chapters
        siteUrl
      }
    }
  `;
  const data = await fetchAniList(query, { id });
  return data.Media;
}

export async function searchManga(search: string, page = 1, perPage = 20): Promise<AniListManga[]> {
  const query = `
    query ($page: Int, $perPage: Int, $search: String) {
      Page (page: $page, perPage: $perPage) {
        media (type: MANGA, search: $search) {
          id
          title {
            romaji
            english
          }
          coverImage {
            large
          }
          status
        }
      }
    }
  `;
  const data = await fetchAniList(query, { page, perPage, search });
  return data.Page.media;
}
