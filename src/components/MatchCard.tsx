import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/lib/colors';
import { scale, sFont } from '@/lib/scaling';
import { Focusable } from './Focusable';

export interface Match {
  id: string;
  homeTeam: {
    name: string;
    logo: string;
  };
  awayTeam: {
    name: string;
    logo: string;
  };
  score?: {
    home: number;
    away: number;
  };
  status: 'LIVE' | 'UPCOMING' | 'FINISHED';
  time: string;
  league: string;
  timestamp: number;
}

interface MatchCardProps {
  match: Match;
  onPress: (match: Match) => void;
  style?: any;
}

const getCountdownText = (timestamp: number) => {
  const now = Math.floor(Date.now() / 1000);
  const diff = timestamp - now;

  if (diff <= 0) return 'Starting soon';
  
  const mins = Math.floor(diff / 60);
  const hrs = Math.floor(mins / 60);

  if (mins < 60) return `Starts in ${mins}m`;
  if (hrs < 24) return `Starts in ${hrs}h`;
  
  return new Date(timestamp * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const MatchCard: React.FC<MatchCardProps> = ({ match, onPress, style }) => {
  const isLive = match.status === 'LIVE';

  return (
    <Focusable
      onPress={() => onPress(match)}
      style={[styles.card, style]}
    >
      <View style={{ padding: scale(16) }}>
        <View style={styles.header}>
          <Text style={[styles.league, { fontSize: sFont(12) }]}>{match.league}</Text>
          {isLive && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={[styles.liveText, { fontSize: sFont(10) }]}>LIVE</Text>
            </View>
          )}
        </View>

        <View style={styles.teamsContainer}>
          <View style={styles.team}>
            <Image source={{ uri: match.homeTeam.logo }} style={styles.logo} resizeMode="contain" />
            <Text style={[styles.teamName, { fontSize: sFont(14) }]} numberOfLines={1}>{match.homeTeam.name}</Text>
          </View>

          <View style={styles.scoreContainer}>
            {isLive || match.status === 'FINISHED' ? (
              <Text style={[styles.score, { fontSize: sFont(24) }]}>
                {match.score?.home} - {match.score?.away}
              </Text>
            ) : (
              <View style={styles.timeContainer}>
                <Text style={[styles.timeLabel, { fontSize: sFont(10) }]}>{getCountdownText(match.timestamp)}</Text>
                <Text style={[styles.timeValue, { fontSize: sFont(16) }]}>{match.time}</Text>
              </View>
            )}
          </View>

          <View style={styles.team}>
            <Image source={{ uri: match.awayTeam.logo }} style={styles.logo} resizeMode="contain" />
            <Text style={[styles.teamName, { fontSize: sFont(14) }]} numberOfLines={1}>{match.awayTeam.name}</Text>
          </View>
        </View>
      </View>
    </Focusable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  league: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.error,
  },
  liveText: {
    color: Colors.error,
    fontSize: 10,
    fontWeight: '900',
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  team: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
  },
  teamName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  scoreContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  score: {
    color: Colors.primary,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
  },
  time: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  timeContainer: {
    alignItems: 'center',
  },
  timeLabel: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  timeValue: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
});
