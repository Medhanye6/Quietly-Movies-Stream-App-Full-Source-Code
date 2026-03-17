import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Dimensions, SafeAreaView,
  Platform, StatusBar as RNStatusBar
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/lib/colors';
import { useTranslation } from '@/lib/i18n';
import { sportsService, Match } from '@/lib/sportsService';

const { width: SW } = Dimensions.get('window');
const PLAYER_H = SW * (9 / 16);
const PT = Platform.OS === 'android' ? RNStatusBar.currentHeight ?? 0 : 0;

type TabType = 'info' | 'standings' | 'lineups';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [playerLoading, setPlayerLoading] = useState(true);
  const [selectedServerIndex, setSelectedServerIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('info');

  useEffect(() => {
    const fetchMatch = async () => {
      if (typeof id !== 'string') return;
      try {
        const data = await sportsService.getMatchById(id);
        if (data) setMatch(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchMatch();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.safe, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!match) {
    return (
      <View style={[styles.safe, styles.centered]}>
        <Text style={styles.errorText}>Match not found or already ended</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
          <Text style={styles.backTxt}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const server = match.servers?.[selectedServerIndex] || match.servers?.[0];
  const streamUrl = server?.url || 'https://www.youtube.com/embed/dQw4w9WgXcQ';
  
  const webViewHeaders: Record<string, string> = {};
  if (server?.header?.referer) {
    webViewHeaders['Referer'] = server.header.referer;
  }

  const handleServerChange = (index: number) => {
    setSelectedServerIndex(index);
    setPlayerLoading(true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'standings':
        return (
          <View style={styles.tabContent}>
            <View style={styles.placeholderBox}>
              <Ionicons name="stats-chart-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.placeholderText}>Standings table is being updated...</Text>
            </View>
          </View>
        );
      case 'lineups':
        return (
          <View style={styles.tabContent}>
            <View style={styles.placeholderBox}>
              <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.placeholderText}>Lineups will be available 60m before kickoff</Text>
            </View>
          </View>
        );
      default:
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Match Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                <View>
                  <Text style={styles.infoLabel}>Date</Text>
                  <Text style={styles.infoValue}>{match.startedDate}</Text>
                </View>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Ionicons name="trophy-outline" size={20} color={Colors.primary} />
                <View>
                  <Text style={styles.infoLabel}>League</Text>
                  <Text style={styles.infoValue}>{match.league.name}</Text>
                </View>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color={Colors.primary} />
                <View>
                  <Text style={styles.infoLabel}>Venue</Text>
                  <Text style={styles.infoValue}>Stadium information not available</Text>
                </View>
              </View>
            </View>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: PT }]}>
      {/* Player Section */}
      <View style={styles.playerSection}>
        <View style={styles.playerWrap}>
          {playerLoading && (
            <View style={styles.playerLoader}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          )}
          {Platform.OS === 'web' ? (
            <iframe
              key={`server-${selectedServerIndex}`}
              src={streamUrl}
              style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#000' }}
              allowFullScreen
              onLoad={() => setPlayerLoading(false)}
            />
          ) : (
            <WebView
              key={`server-${selectedServerIndex}`}
              source={{ 
                uri: streamUrl,
                headers: webViewHeaders 
              }}
              userAgent={server?.header?.['user-agent']}
              style={[styles.player, playerLoading && { opacity: 0 }]}
              allowsFullscreenVideo
              onLoadEnd={() => setPlayerLoading(false)}
            />
          )}
        </View>

        {/* Server Selection Overlay - Floating or just below */}
        {match.servers && match.servers.length > 1 && (
          <View style={styles.serverFloating}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.serverList}>
              {match.servers.map((s, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.serverBtn,
                    selectedServerIndex === idx && styles.serverBtnActive
                  ]}
                  onPress={() => handleServerChange(idx)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="tv" 
                    size={14} 
                    color={selectedServerIndex === idx ? '#000' : Colors.textMuted} 
                  />
                  <Text style={[
                    styles.serverBtnTxt,
                    selectedServerIndex === idx && styles.serverBtnTxtActive
                  ]}>
                    {s.name || `TV ${idx + 1}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Navigation Toolbar */}
        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.toolbarTitle} numberOfLines={1}>
            {match.homeTeam.name} vs {match.awayTeam.name}
          </Text>
          <View style={styles.iconBtn} />
        </View>

        {/* Match Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.headerTeam}>
              <View style={styles.headerLogoBox}>
                <Image source={{ uri: match.homeTeam.logo }} style={styles.headerLogo} resizeMode="contain" />
              </View>
              <Text style={styles.headerTeamName}>{match.homeTeam.name}</Text>
            </View>

            <View style={styles.headerScoreBox}>
              <Text style={styles.headerScore}>{match.score?.home ?? 0} - {match.score?.away ?? 0}</Text>
              <View style={[styles.statusBadge, match.liveStatus && styles.liveBadge]}>
                <Text style={[styles.statusText, match.liveStatus && styles.liveText]}>
                  {match.liveStatus ? 'LIVE' : match.startedTime}
                </Text>
              </View>
            </View>

            <View style={styles.headerTeam}>
              <View style={styles.headerLogoBox}>
                <Image source={{ uri: match.awayTeam.logo }} style={styles.headerLogo} resizeMode="contain" />
              </View>
              <Text style={styles.headerTeamName}>{match.awayTeam.name}</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {[
            { id: 'info', label: 'Match Info', icon: 'information-circle' },
            { id: 'standings', label: 'Standings', icon: 'list' },
            { id: 'lineups', label: 'Lineups', icon: 'shirt' }
          ].map(tab => (
            <TouchableOpacity 
              key={tab.id}
              style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.id as TabType)}
            >
              <Ionicons 
                name={(tab.icon + (activeTab === tab.id ? '' : '-outline')) as any} 
                size={18} 
                color={activeTab === tab.id ? Colors.primary : Colors.textMuted} 
              />
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {activeTab === tab.id && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {renderTabContent()}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  centered: { alignItems: 'center', justifyContent: 'center' },
  errorText: { color: Colors.textMuted, fontSize: 16, fontWeight: '600', marginBottom: 20 },
  
  // Player
  playerSection: { backgroundColor: '#000' },
  playerWrap: { width: SW, height: PLAYER_H },
  player: { flex: 1 },
  playerLoader: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  
  // Server Selection
  serverFloating: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  serverList: { paddingHorizontal: 20, gap: 10 },
  serverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  serverBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  serverBtnTxt: { color: Colors.textMuted, fontSize: 12, fontWeight: '700' },
  serverBtnTxtActive: { color: '#000' },

  scrollContent: { paddingBottom: 40 },
  
  // Toolbar
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    justifyContent: 'space-between',
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  toolbarTitle: { color: Colors.text, fontSize: 16, fontWeight: '800', flex: 1, textAlign: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 5 },
  backTxt: { color: Colors.text, fontSize: 16, fontWeight: '600' },

  // Header Card
  headerCard: {
    margin: 20,
    padding: 24,
    backgroundColor: Colors.card,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTeam: { flex: 1, alignItems: 'center', gap: 10 },
  headerLogoBox: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: { width: '100%', height: '100%' },
  headerTeamName: { color: Colors.text, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  headerScoreBox: { alignItems: 'center', gap: 8 },
  headerScore: { color: Colors.primary, fontSize: 36, fontWeight: '900' },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { color: Colors.textMuted, fontSize: 11, fontWeight: '900' },
  liveBadge: { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
  liveText: { color: Colors.error },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 15,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabBtnActive: {},
  tabLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '700' },
  tabLabelActive: { color: Colors.text },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 20,
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },

  // Content
  tabContent: { paddingHorizontal: 20 },
  sectionTitle: { color: Colors.text, fontSize: 18, fontWeight: '800', marginBottom: 15 },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 10 },
  infoDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 35 },
  infoLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  infoValue: { color: Colors.text, fontSize: 14, fontWeight: '700', marginTop: 2 },
  
  placeholderBox: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: 24,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 15,
  },
  placeholderText: { color: Colors.textMuted, fontSize: 14, fontWeight: '500', textAlign: 'center' },
});
