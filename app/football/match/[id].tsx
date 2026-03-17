import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Image, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/lib/colors';
import { useTranslation } from '@/lib/i18n';
import { sportsService, Match } from '@/lib/sportsService';
import { useResponsive } from '@/hooks/useResponsive';
import { scale, sFont } from '@/lib/scaling';
import { Focusable } from '@/components/Focusable';

type TabType = 'info' | 'standings' | 'lineups';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { width: SW, height: SH, isPhone, isTV } = useResponsive();
  
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
        <Text style={[styles.errorText, { fontSize: sFont(16) }]}>Match not found or already ended</Text>
        <Focusable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
          <Text style={[styles.backTxt, { fontSize: sFont(16) }]}>Go Back</Text>
        </Focusable>
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

  const isDesktop = !isPhone;
  const PLAYER_H = isPhone ? SW * (9 / 16) : SH * 0.65;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'standings':
        return (
          <View style={styles.tabContent}>
            <View style={styles.placeholderBox}>
              <Ionicons name="stats-chart-outline" size={48} color={Colors.textMuted} />
              <Text style={[styles.placeholderText, { fontSize: sFont(14) }]}>Standings table is being updated...</Text>
            </View>
          </View>
        );
      case 'lineups':
        return (
          <View style={styles.tabContent}>
            <View style={styles.placeholderBox}>
              <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
              <Text style={[styles.placeholderText, { fontSize: sFont(14) }]}>Lineups will be available 60m before kickoff</Text>
            </View>
          </View>
        );
      default:
        return (
          <View style={styles.tabContent}>
            <Text style={[styles.sectionTitle, { fontSize: sFont(18) }]}>Match Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                <View>
                  <Text style={[styles.infoLabel, { fontSize: sFont(11) }]}>Date</Text>
                  <Text style={[styles.infoValue, { fontSize: sFont(14) }]}>{match.startedDate}</Text>
                </View>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Ionicons name="trophy-outline" size={20} color={Colors.primary} />
                <View>
                  <Text style={[styles.infoLabel, { fontSize: sFont(11) }]}>League</Text>
                  <Text style={[styles.infoValue, { fontSize: sFont(14) }]}>{match.league.name}</Text>
                </View>
              </View>
            </View>
          </View>
        );
    }
  };

  const MainDetails = () => (
    <>
      {/* Navigation Toolbar */}
      {!isDesktop && (
        <View style={styles.toolbar}>
          <Focusable style={styles.iconBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </Focusable>
          <Text style={[styles.toolbarTitle, { fontSize: sFont(16) }]} numberOfLines={1}>
            {match.homeTeam.name} vs {match.awayTeam.name}
          </Text>
          <View style={styles.iconBtn} />
        </View>
      )}

      {/* Match Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.headerTeam}>
            <View style={[styles.headerLogoBox, { width: scale(64), height: scale(64) }]}>
              <Image source={{ uri: match.homeTeam.logo }} style={styles.headerLogo} resizeMode="contain" />
            </View>
            <Text style={[styles.headerTeamName, { fontSize: sFont(13) }]}>{match.homeTeam.name}</Text>
          </View>

          <View style={styles.headerScoreBox}>
            <Text style={[styles.headerScore, { fontSize: sFont(36) }]}>{match.score?.home ?? 0} - {match.score?.away ?? 0}</Text>
            <View style={[styles.statusBadge, match.liveStatus && styles.liveBadge]}>
              <Text style={[styles.statusText, match.liveStatus && styles.liveText, { fontSize: sFont(11) }]}>
                {match.liveStatus ? 'LIVE' : match.startedTime}
              </Text>
            </View>
          </View>

          <View style={styles.headerTeam}>
            <View style={[styles.headerLogoBox, { width: scale(64), height: scale(64) }]}>
              <Image source={{ uri: match.awayTeam.logo }} style={styles.headerLogo} resizeMode="contain" />
            </View>
            <Text style={[styles.headerTeamName, { fontSize: sFont(13) }]}>{match.awayTeam.name}</Text>
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
          <Focusable 
            key={tab.id}
            style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab.id as TabType)}
          >
            <Ionicons 
              name={(tab.icon + (activeTab === tab.id ? '' : '-outline')) as any} 
              size={18} 
              color={activeTab === tab.id ? Colors.primary : Colors.textMuted} 
            />
            <Text style={[styles.tabLabel, { fontSize: sFont(12) }, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {activeTab === tab.id && <View style={styles.tabIndicator} />}
          </Focusable>
        ))}
      </View>

      {/* Tab Content */}
      <View style={{ flex: 1 }}>
        {renderTabContent()}
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={isTV ? ['top', 'bottom', 'left', 'right'] : ['bottom']}>
      <View style={styles.responsiveWrapper}>
        {!isDesktop ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={[styles.playerWrap, { height: PLAYER_H }]}>
              {playerLoading && (
                <View style={styles.playerLoader}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                </View>
              )}
              <WebView
                key={`server-${selectedServerIndex}`}
                source={{ uri: streamUrl, headers: webViewHeaders }}
                userAgent={server?.header?.['user-agent']}
                style={[styles.player, playerLoading && { opacity: 0 }]}
                allowsFullscreenVideo
                onLoadEnd={() => setPlayerLoading(false)}
              />
            </View>
            <ServerList match={match} selectedServerIndex={selectedServerIndex} onSelect={handleServerChange} />
            <MainDetails />
          </ScrollView>
        ) : (
          <View style={styles.desktopLayout}>
            <View style={styles.leftCol}>
              <View style={[styles.playerWrap, { height: PLAYER_H, width: '100%', borderRadius: 20, overflow: 'hidden' }]}>
                {playerLoading && (
                  <View style={styles.playerLoader}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                  </View>
                )}
                <WebView
                  key={`server-${selectedServerIndex}`}
                  source={{ uri: streamUrl, headers: webViewHeaders }}
                  style={[styles.player, playerLoading && { opacity: 0 }]}
                  allowsFullscreenVideo
                  onLoadEnd={() => setPlayerLoading(false)}
                />
              </View>
              <ServerList match={match} selectedServerIndex={selectedServerIndex} onSelect={handleServerChange} />
              <Focusable style={[styles.backBtn, { marginTop: 20 }]} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={24} color={Colors.text} />
                <Text style={[styles.backTxt, { fontSize: sFont(16) }]}>Go Back</Text>
              </Focusable>
            </View>
            <View style={styles.rightCol}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <MainDetails />
              </ScrollView>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const ServerList = ({ match, selectedServerIndex, onSelect }: any) => {
  if (!match.servers || match.servers.length <= 1) return null;
  return (
    <View style={styles.serverFloating}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.serverList}>
        {match.servers.map((s: any, idx: number) => (
          <Focusable
            key={idx}
            style={[
              styles.serverBtn,
              selectedServerIndex === idx && styles.serverBtnActive
            ]}
            onPress={() => onSelect(idx)}
          >
            <Ionicons 
              name="tv" 
              size={14} 
              color={selectedServerIndex === idx ? '#000' : Colors.textMuted} 
            />
            <Text style={[
              styles.serverBtnTxt,
              { fontSize: sFont(12) },
              selectedServerIndex === idx && styles.serverBtnTxtActive
            ]}>
              {s.name || `TV ${idx + 1}`}
            </Text>
          </Focusable>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  centered: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  errorText: { color: Colors.textMuted, fontWeight: '600', marginBottom: 20 },
  responsiveWrapper: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: 1400 },
  desktopLayout: { flex: 1, flexDirection: 'row', padding: 20, gap: 20 },
  leftCol:      { flex: 2 },
  rightCol:     { flex: 1.2, backgroundColor: Colors.card, borderRadius: 24, overflow: 'hidden' },

  playerWrap: { backgroundColor: '#000', position: 'relative' },
  player: { flex: 1 },
  playerLoader: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 10, backgroundColor: '#000' },
  
  serverFloating: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  serverList: { paddingHorizontal: 20, gap: 10 },
  serverBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.cardAlt, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  serverBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  serverBtnTxt: { color: Colors.textMuted, fontWeight: '700' },
  serverBtnTxtActive: { color: '#000' },

  scrollContent: { paddingBottom: 40 },
  
  toolbar: { flexDirection: 'row', alignItems: 'center', padding: 15, justifyContent: 'space-between' },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  toolbarTitle: { color: Colors.text, fontWeight: '800', flex: 1, textAlign: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8, borderRadius: 12 },
  backTxt: { color: Colors.text, fontWeight: '600' },

  headerCard: { margin: 20, padding: 24, backgroundColor: Colors.cardAlt, borderRadius: 32, borderWidth: 1, borderColor: Colors.border },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTeam: { flex: 1, alignItems: 'center', gap: 10 },
  headerLogoBox: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 10, alignItems: 'center', justifyContent: 'center' },
  headerLogo: { width: '100%', height: '100%' },
  headerTeamName: { color: Colors.text, fontWeight: '800', textAlign: 'center' },
  headerScoreBox: { alignItems: 'center', gap: 8 },
  headerScore: { color: Colors.primary, fontWeight: '900' },
  statusBadge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { color: Colors.textMuted, fontWeight: '900' },
  liveBadge: { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
  liveText: { color: Colors.error },

  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, gap: 10 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 6, borderRadius: 12 },
  tabBtnActive: {},
  tabLabel: { color: Colors.textMuted, fontWeight: '700' },
  tabLabelActive: { color: Colors.text },
  tabIndicator: { position: 'absolute', bottom: 0, width: 24, height: 4, backgroundColor: Colors.primary, borderRadius: 2 },

  tabContent: { paddingHorizontal: 20 },
  sectionTitle: { color: Colors.text, fontWeight: '800', marginBottom: 15 },
  infoCard: { backgroundColor: Colors.cardAlt, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: Colors.border },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 10 },
  infoDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 35 },
  infoLabel: { color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  infoValue: { color: Colors.text, fontWeight: '700', marginTop: 2 },
  
  placeholderBox: { height: 150, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.cardAlt, borderRadius: 24, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', gap: 15 },
  placeholderText: { color: Colors.textMuted, fontWeight: '500', textAlign: 'center' },
});
