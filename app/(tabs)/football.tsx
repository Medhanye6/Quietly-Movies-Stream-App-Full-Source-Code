import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Platform, StatusBar as RNStatusBar,
  Image, FlatList, Dimensions, ActivityIndicator, RefreshControl, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/lib/colors';
import { MatchCard } from '@/components/MatchCard';
import { sportsService, Match } from '@/lib/sportsService';
import { useTranslation } from '@/lib/i18n';
import { useResponsive } from '@/hooks/useResponsive';
import { scale, sFont } from '@/lib/scaling';
import { Focusable } from '@/components/Focusable';

export default function FootballScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isPhone, isTV } = useResponsive();
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeLeague, setActiveLeague] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const PRIORITY_LEAGUES = [
    'UEFA Champions League', 'UEFA Europa League', 'Premier League',
    'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1'
  ];

  const fetchMatches = useCallback(async (force = false) => {
    try {
      const liveData = await sportsService.fetchMatches('live', force);
      const vsData = await sportsService.fetchMatches('vs', force);
      setMatches([...liveData, ...vsData]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMatches(true);
  }, [fetchMatches]);

  const filteredMatches = matches.filter(m => {
    const matchesLeague = activeLeague === 'All' || m.league.name === activeLeague;
    const matchesSearch = searchQuery === '' || 
      m.homeTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.awayTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.league.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesLeague && matchesSearch;
  });

  const sortedMatches = [...filteredMatches].sort((a, b) => {
    const aPriority = PRIORITY_LEAGUES.findIndex(pl => a.league.name.includes(pl));
    const bPriority = PRIORITY_LEAGUES.findIndex(pl => b.league.name.includes(pl));
    if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
    if (aPriority !== -1) return -1;
    if (bPriority !== -1) return 1;
    return 0;
  });

  const liveMatches = sortedMatches.filter(m => m.liveStatus);
  const upcomingMatches = sortedMatches.filter(m => !m.liveStatus);

  const rawLeagues = [...new Set(matches.map(m => m.league.name))];
  const leagues = ['All', ...rawLeagues.sort((a, b) => {
    const aPriority = PRIORITY_LEAGUES.findIndex(pl => a.includes(pl));
    const bPriority = PRIORITY_LEAGUES.findIndex(pl => b.includes(pl));
    if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
    if (aPriority !== -1) return -1;
    if (bPriority !== -1) return 1;
    return a.localeCompare(b);
  })];

  const mapToUICard = (m: Match) => ({
    id: m.id,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    score: m.score,
    status: (m.liveStatus ? 'LIVE' : 'UPCOMING') as 'LIVE' | 'UPCOMING' | 'FINISHED',
    time: m.startedTime,
    league: m.league.name,
    timestamp: m.timestamp
  });

  const isDesktop = !isPhone;

  return (
    <SafeAreaView style={styles.safe} edges={isTV ? ['top', 'bottom', 'left', 'right'] : ['bottom']}>
      {!isDesktop && (
        <View style={styles.header}>
          <View style={styles.brandContainer}>
            <View style={styles.logoBox}>
              <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
            </View>
            <Text style={[styles.brandName, { fontSize: sFont(20) }]}>Quietly Live</Text>
          </View>
          <Focusable onPress={onRefresh} style={styles.headerActionBtn}>
            <Ionicons name="refresh" size={24} color={Colors.primary} />
          </Focusable>
        </View>
      )}

      <View style={styles.responsiveWrapper}>
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { height: scale(50) }]}>
            <Ionicons name="search-outline" size={20} color={Colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { fontSize: sFont(15) }]}
              placeholder="Search team or league..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>
        </View>

        <View style={styles.leaguesContainer}>
          <FlatList
            horizontal
            data={leagues}
            renderItem={({ item, index }) => (
              <Focusable
                style={[styles.leagueBtn, activeLeague === item && styles.leagueBtnActive]}
                onPress={() => setActiveLeague(item)}
                autoFocus={index === 0 && Platform.isTV}
              >
                <Text style={[styles.leagueBtnTxt, activeLeague === item && styles.leagueBtnTxtActive, { fontSize: sFont(14) }]}>
                  {item}
                </Text>
              </Focusable>
            )}
            keyExtractor={item => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.leaguesList}
          />
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: isPhone ? 100 : 40 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
        >
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={[styles.loaderText, { fontSize: sFont(14) }]}>Searching for live streams...</Text>
            </View>
          ) : (
            <>
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { fontSize: sFont(22) }]}>
                  {liveMatches.length > 0 ? 'Live Now' : 'No Matches Live'}
                </Text>
                <View style={isDesktop ? styles.matchGrid : null}>
                  {liveMatches.length > 0 ? (
                    liveMatches.map(match => (
                      <MatchCard 
                        key={match.id} 
                        match={mapToUICard(match)} 
                        onPress={() => router.push(`/football/match/${match.id}` as any)} 
                        style={isDesktop ? styles.gridMatchCard : null}
                      />
                    ))
                  ) : (
                    <View style={styles.emptyCard}>
                      <Ionicons name="football-outline" size={40} color={Colors.textMuted} />
                      <Text style={[styles.emptyText, { fontSize: sFont(14) }]}>Check back later for live broadcasts</Text>
                    </View>
                  )}
                </View>
              </View>

              {upcomingMatches.length > 0 && (
                <View style={[styles.section, { marginTop: scale(30) }]}>
                  <Text style={[styles.sectionTitle, { fontSize: sFont(22) }]}>Upcoming Matches</Text>
                  <View style={isDesktop ? styles.matchGrid : null}>
                    {upcomingMatches.map(match => (
                      <MatchCard 
                        key={match.id} 
                        match={mapToUICard(match)} 
                        onPress={() => router.push(`/football/match/${match.id}` as any)} 
                        style={isDesktop ? styles.gridMatchCard : null}
                      />
                    ))}
                  </View>
                </View>
              )}
            </>
          )}

          <View style={[styles.promoCard, isDesktop && { alignSelf: 'center', width: 600 }]}>
            <Ionicons name="notifications-outline" size={32} color={Colors.primary} />
            <View style={styles.promoTextContainer}>
              <Text style={[styles.promoTitle, { fontSize: sFont(16) }]}>Never miss a goal</Text>
              <Text style={[styles.promoDesc, { fontSize: sFont(12) }]}>Enable notifications for your favorite teams and leagues.</Text>
            </View>
            <Focusable style={styles.promoBtn}>
              <Text style={[styles.promoBtnTxt, { fontSize: sFont(12) }]}>Enable</Text>
            </Focusable>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  brandName: {
    color: Colors.primary,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontWeight: '500',
  },
  leaguesContainer: {
    marginVertical: 10,
  },
  leaguesList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  leagueBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  leagueBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  leagueBtnTxt: {
    color: Colors.textMuted,
    fontWeight: '600',
  },
  leagueBtnTxtActive: {
    color: '#000',
  },
  headerActionBtn: {
    padding: 8,
    backgroundColor: 'rgba(209, 255, 0, 0.1)',
    borderRadius: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    color: Colors.text,
    fontWeight: '800',
    marginBottom: 15,
  },
  matchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  gridMatchCard: {
    width: 300,
    marginBottom: 15,
  },
  loaderContainer: {
    padding: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
  },
  loaderText: {
    color: Colors.textMuted,
    fontWeight: '600',
  },
  emptyText: {
    color: Colors.textMuted,
    textAlign: 'center',
    paddingTop: 10,
  },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardAlt,
    borderRadius: 24,
    padding: 20,
    marginTop: 30,
    gap: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  promoTextContainer: {
    flex: 1,
  },
  promoTitle: {
    color: Colors.text,
    fontWeight: '800',
  },
  promoDesc: {
    color: Colors.textMuted,
    lineHeight: 18,
    marginTop: 2,
  },
  promoBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  promoBtnTxt: {
    color: '#000',
    fontWeight: '800',
  },
  responsiveWrapper: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 1200,
  }
});
