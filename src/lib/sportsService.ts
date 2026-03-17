import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FootballTeam {
  id: number | string;
  name: string;
  logo: string;
}

export interface FootballLeague {
  id: number | string;
  name: string;
  logo: string;
}

export interface LiveStreamServer {
  name: string;
  url: string;
  type: 'direct' | 'drm' | 'referer';
  header?: {
    'user-agent'?: string;
    'referer'?: string;
  };
}

export interface Match {
  id: string;
  startedDate: string;
  startedTime: string; // Formatted time
  liveStatus: boolean;
  homeTeam: FootballTeam;
  awayTeam: FootballTeam;
  league: FootballLeague;
  servers: LiveStreamServer[];
  score: {
    home: number;
    away: number;
  };
  timestamp: number;
}

const cache: Record<string, { data: Match[], timestamp: number }> = {};
const CACHE_TTL = 30 * 1000; 
const PERSISTENT_TTL = 2 * 60 * 60 * 1000; 
const ASYNC_STORAGE_KEY = 'QUIETLY_MATCHES_CACHE';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
let lastRequestTime = 0;
const MIN_REQUEST_GAP = 1500; 

async function throttle() {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  if (timeSinceLast < MIN_REQUEST_GAP) {
    await sleep(MIN_REQUEST_GAP - timeSinceLast);
  }
}

export const sportsService = {
  fetchMatches: async (status: 'live' | 'vs' = 'live', forceRefresh: boolean = false): Promise<Match[]> => {
    const now = Date.now();
    const RTDB_URL = process.env.EXPO_PUBLIC_FIREBASE_RTDB_URL;
    
    // 1. Check In-Memory Cache (Short term - avoid redundant calls in same session)
    if (!forceRefresh && cache[status] && (now - cache[status].timestamp < CACHE_TTL)) {
      return cache[status].data;
    }

    // 2. Check Firebase Centralized Cache (Global term - shared across all users)
    if (!forceRefresh && RTDB_URL) {
      console.log(`[SportsService] Checking Firebase for ${status}...`);
      try {
        const response = await fetch(`${RTDB_URL}/matches/${status}.json`);
        if (response.ok) {
          const stored = await response.json();
          if (stored) {
            const age = now - (stored.timestamp || 0);
            if (age < PERSISTENT_TTL) {
              console.log(`[SportsService] Firebase Cache HIT for ${status} (Age: ${Math.round(age/1000/60)}m)`);
              cache[status] = { data: stored.data, timestamp: stored.timestamp };
              await AsyncStorage.setItem(`${ASYNC_STORAGE_KEY}_${status}`, JSON.stringify(stored));
              return stored.data;
            }
            console.log(`[SportsService] Firebase data for ${status} is STALE (${Math.round(age/1000/60)}m old).`);
          } else {
            console.log(`[SportsService] Firebase is EMPTY for ${status}.`);
          }
        } else {
          console.warn(`[SportsService] Firebase Fetch Error: ${response.status}`);
        }
      } catch (e) {
        console.warn('[SportsService] Firebase Sync Error:', e);
      }
    }

    console.log(`[SportsService] Fetching ${status} from RapidAPI (Bridge Fallback)...`);

    // 3. Fallback to Local Storage (If Firebase is unreachable or restricted)
    if (!forceRefresh) {
      try {
        const storedStr = await AsyncStorage.getItem(`${ASYNC_STORAGE_KEY}_${status}`);
        if (storedStr) {
          const stored = JSON.parse(storedStr);
          if (now - stored.timestamp < PERSISTENT_TTL) {
            cache[status] = { data: stored.data, timestamp: stored.timestamp };
            return stored.data;
          }
        }
      } catch (e) {
        console.warn('Local storage fallback error:', e);
      }
    }

    // 4. Finally, fetch from RapidAPI (Only if Firebase is stale or missing)
    const BASE_URL = process.env.EXPO_PUBLIC_SPORTS_BASE_URL;
    const API_KEY = process.env.EXPO_PUBLIC_SPORTS_API_KEY;
    const API_HOST = process.env.EXPO_PUBLIC_RAPID_API_HOST;

    if (!BASE_URL || !API_HOST || !API_KEY) {
      console.warn('Sports API configuration missing');
      return [];
    }

    let allMatches: Match[] = [];
    let page = 1;
    let hasNext = true;

    try {
      while (hasNext && page <= 3) {
        await throttle();

        const response = await fetch(`${BASE_URL}/matches?status=${status}&page=${page}`, {
          headers: {
            'x-rapidapi-key': API_KEY,
            'x-rapidapi-host': API_HOST,
            'Accept': 'application/json',
          },
        });
        
        lastRequestTime = Date.now();

        if (response.status === 429) {
          console.warn(`Rate limit hit on page ${page}, returning partial results.`);
          break;
        }

        if (!response.ok) {
          console.error(`API Error on page ${page}:`, response.status);
          break;
        }

        const data = await response.json();
        const matchesData = data.matches;

        if (Array.isArray(matchesData)) {
          const mapped = matchesData.map((m: any) => {
            const date = new Date(parseInt(m.match_time) * 1000);
            const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            const formattedDate = date.toISOString().split('T')[0];

            return {
              id: m.match_time + m.home_team_name,
              startedDate: formattedDate,
              startedTime: m.match_status === 'live' ? 'LIVE' : formattedTime,
              liveStatus: m.match_status === 'live',
              homeTeam: {
                id: m.home_team_name,
                name: m.home_team_name,
                logo: m.home_team_logo,
              },
              awayTeam: {
                id: m.away_team_name,
                name: m.away_team_name,
                logo: m.away_team_logo,
              },
              league: {
                id: m.league_name,
                name: m.league_name,
                logo: m.league_logo,
              },
              score: {
                home: parseInt(m.homeTeamScore || '0'),
                away: parseInt(m.awayTeamScore || '0'),
              },
              servers: m.servers || [],
              timestamp: parseInt(m.match_time),
            };
          });
          allMatches = [...allMatches, ...mapped];
        }

        hasNext = data.pagination?.hasNext || false;
        page++;
      }

      // 5. Update Firebase AND Local Storage (Broadcasting to all users)
      if (allMatches.length > 0) {
        const payload = { data: allMatches, timestamp: now };
        cache[status] = payload;
        
        // Save to Persistent Local Storage
        await AsyncStorage.setItem(`${ASYNC_STORAGE_KEY}_${status}`, JSON.stringify(payload));
        
        // Save to Firebase (Bridge for all users)
        if (RTDB_URL) {
          try {
            await fetch(`${RTDB_URL}/matches/${status}.json`, {
              method: 'PUT',
              body: JSON.stringify(payload)
            });
            console.log(`Firebase matches/${status} updated for all users.`);
          } catch (e) {
            console.warn('Firebase broadcast error:', e);
          }
        }
      }

      return allMatches;
    } catch (error) {
      console.error('Failed to fetch matches:', error);
      if (cache[status]) return cache[status].data;
      return allMatches;
    }
  },

  getMatchById: async (id: string): Promise<Match | undefined> => {
    const matches = await sportsService.fetchMatches('live');
    let found = matches.find(m => m.id === id);
    if (!found) {
        const upcoming = await sportsService.fetchMatches('vs');
        found = upcoming.find(m => m.id === id);
    }
    return found;
  }
};
