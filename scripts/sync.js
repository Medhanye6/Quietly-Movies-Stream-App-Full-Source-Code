const fs = require('fs');
const path = require('path');

/**
 * STANDALONE SYNC SCRIPT
 * Run this to manually push RapidAPI data to your Firebase Global Cache.
 * Usage: node scripts/sync.js
 */

// 1. Simple .env parser to avoid extra dependencies
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    console.error('.env file not found!');
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) {
      env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
  return env;
}

const env = loadEnv();
const API_KEY = env.EXPO_PUBLIC_SPORTS_API_KEY;
const API_HOST = env.EXPO_PUBLIC_RAPID_API_HOST;
const BASE_URL = env.EXPO_PUBLIC_SPORTS_BASE_URL;
const RTDB_URL = env.EXPO_PUBLIC_FIREBASE_RTDB_URL;

console.log('--- Configuration ---');
console.log(`Key: ${API_KEY ? API_KEY.substring(0, 5) + '...' + API_KEY.substring(API_KEY.length - 5) : 'MISSING'}`);
console.log(`Host: ${API_HOST || 'MISSING'}`);
console.log(`Firebase: ${RTDB_URL || 'MISSING'}`);
console.log('---------------------\n');

if (!API_KEY || !RTDB_URL) {
  console.error('Missing required keys in .env (API_KEY or FIREBASE_RTDB_URL)');
  process.exit(1);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function syncStatus(status) {
  console.log(`\n🚀 Starting sync for: ${status.toUpperCase()}...`);
  
  let allMatches = [];
  let page = 1;
  let hasNext = true;

  try {
    while (hasNext && page <= 3) {
      console.log(`   Fetching ${status} page ${page}...`);
      
      const response = await fetch(`${BASE_URL}/matches?status=${status}&page=${page}`, {
        headers: {
          'x-rapidapi-key': API_KEY,
          'x-rapidapi-host': API_HOST,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const body = await response.text();
        console.error(`   ❌ API Error ${response.status}: ${body.substring(0, 100)}`);
        if (response.status === 429) {
            console.warn('   ⚠️ Rate limit hit! Stopping pagination...');
            break;
        }
        break;
      }

      const data = await response.json();
      const matchesData = data.matches;

      if (Array.isArray(matchesData)) {
        const mapped = matchesData.map(m => {
          const date = new Date(parseInt(m.match_time) * 1000);
          const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
          const formattedDate = date.toISOString().split('T')[0];

          return {
            id: m.match_time + m.home_team_name,
            startedDate: formattedDate,
            startedTime: m.match_status === 'live' ? 'LIVE' : formattedTime,
            liveStatus: m.match_status === 'live',
            homeTeam: { id: m.home_team_name, name: m.home_team_name, logo: m.home_team_logo },
            awayTeam: { id: m.away_team_name, name: m.away_team_name, logo: m.away_team_logo },
            league: { id: m.league_name, name: m.league_name, logo: m.league_logo },
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
      if (hasNext) await sleep(1500); // Respect throttle
    }

    if (allMatches.length > 0) {
      const payload = { data: allMatches, timestamp: Date.now() };
      console.log(`   ✅ Fetched ${allMatches.length} matches. Saving to Firebase...`);
      
      const fbResponse = await fetch(`${RTDB_URL}/matches/${status}.json`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (fbResponse.ok) {
        console.log(`   ✨ Firebase updated successfully for ${status}!`);
      } else {
        console.error(`   ❌ Firebase update failed: ${fbResponse.status}`);
      }
    } else {
      console.log(`   ℹ️ No matches found for ${status}.`);
    }

  } catch (error) {
    console.error(`   💥 Sync failed for ${status}:`, error.message);
  }
}

async function run() {
  console.log('--- Quietly Stream Football Sync Utility ---');
  await syncStatus('live');
  console.log('\n--- Waiting 2 seconds between types ---');
  await sleep(2000);
  await syncStatus('vs');
  console.log('\n🎉 Global Cache Sync Complete!');
}

run();
