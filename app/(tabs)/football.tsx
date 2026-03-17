import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  SafeAreaView, Platform, StatusBar as RNStatusBar,
  TouchableOpacity, Image, FlatList, Dimensions, ActivityIndicator, RefreshControl, TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/lib/colors';
import { MatchCard } from '@/components/MatchCard';
import { sportsService, Match } from '@/lib/sportsService';
import { useTranslation } from '@/lib/i18n';

const { width: SW } = Dimensions.get('window');

export default function FootballScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeLeague, setActiveLeague] = useState('All');

  const PRIORITY_LEAGUES = [
    'UEFA Champions League',
    'UEFA Europa League',
    'Premier League',
    'La Liga',
    'Serie A',
    'Bundesliga',
    'Ligue 1'
  ];

  const [searchQuery, setSearchQuery] = useState('');

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

  // Priority Sort: Leagues in PRIORITY_LEAGUES come first
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

  const renderLeagueItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[styles.leagueBtn, activeLeague === item && styles.leagueBtnActive]}
      onPress={() => setActiveLeague(item)}
    >
      <Text style={[styles.leagueBtnTxt, activeLeague === item && styles.leagueBtnTxtActive]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <View style={styles.logoBox}>
            <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.brandName}>Quietly Live</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.headerActionBtn}>
          <Ionicons name="refresh" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search team or league..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && Platform.OS !== 'ios' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.leaguesContainer}>
        <FlatList
          horizontal
          data={leagues}
          renderItem={renderLeagueItem}
          keyExtractor={item => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.leaguesList}
        />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loaderText}>Searching for live streams...</Text>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {liveMatches.length > 0 ? 'Live Now' : 'No Matches Live'}
              </Text>
              {liveMatches.length > 0 ? (
                liveMatches.map(match => (
                  <MatchCard 
                    key={match.id} 
                    match={mapToUICard(match)} 
                    onPress={() => router.push(`/football/match/${match.id}` as any)} 
                  />
                ))
              ) : (
                <View style={styles.emptyCard}>
                  <Ionicons name="football-outline" size={40} color={Colors.textMuted} />
                  <Text style={styles.emptyText}>Check back later for live broadcasts</Text>
                </View>
              )}
            </View>

            {upcomingMatches.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Upcoming Matches</Text>
                {upcomingMatches.map(match => (
                  <MatchCard 
                    key={match.id} 
                    match={mapToUICard(match)} 
                    onPress={() => router.push(`/football/match/${match.id}` as any)} 
                  />
                ))}
              </View>
            )}
          </>
        )}

        <View style={styles.promoCard}>
          <Ionicons name="notifications-outline" size={32} color={Colors.primary} />
          <View style={styles.promoTextContainer}>
            <Text style={styles.promoTitle}>Never miss a goal</Text>
            <Text style={styles.promoDesc}>Enable notifications for your favorite teams and leagues.</Text>
          </View>
          <TouchableOpacity style={styles.promoBtn}>
            <Text style={styles.promoBtnTxt}>Enable</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const PT = Platform.OS === "android" ? RNStatusBar.currentHeight ?? 0 : 0;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingTop: PT,
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
    fontSize: 20,
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
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
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
    fontSize: 14,
    fontWeight: '600',
  },
  leagueBtnTxtActive: {
    color: '#000',
  },
  headerActionBtn: {
    padding: 8,
    backgroundColor: 'rgba(Colors.primary, 0.1)',
    borderRadius: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Account for floating tab bar
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
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
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
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
    fontSize: 16,
    fontWeight: '800',
  },
  promoDesc: {
    color: Colors.textMuted,
    fontSize: 12,
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
    fontSize: 12,
    fontWeight: '800',
  },
});
