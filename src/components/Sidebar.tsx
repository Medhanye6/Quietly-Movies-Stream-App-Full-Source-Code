import React from 'react';
import { View, StyleSheet, Text, Pressable, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../lib/colors';
import { sFont, scale } from '../lib/scaling';
import { Focusable } from './Focusable';

const NAV_ITEMS = [
  { name: 'Home', icon: 'home', route: '/' },
  { name: 'Live', icon: 'football', route: '/football' },
  { name: 'Search', icon: 'search', route: '/search' },
  { name: 'My Lists', icon: 'bookmark', route: '/lists' },
  { name: 'Profile', icon: 'person-circle', route: '/profile' },
];

export const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={[styles.sidebar, { width: scale(240) }]}>
      <View style={styles.logoContainer}>
        <Ionicons name="play-circle" size={40} color={Colors.primary} />
        <Text style={[styles.logoText, { fontSize: sFont(24) }]}>Quietly</Text>
      </View>

      <View style={styles.navContainer}>
        {NAV_ITEMS.map((item, index) => {
          const isActive = pathname === item.route || (item.route !== '/' && pathname.startsWith(item.route));
          
          return (
            <Focusable
              key={item.route}
              onPress={() => router.push(item.route as any)}
              style={styles.navItemFocusable}
              autoFocus={index === 0 && Platform.isTV}
            >
              <View style={[styles.navItem, isActive && styles.navItemActive]}>
                <Ionicons 
                  name={isActive ? (item.icon as any) : (item.icon + '-outline' as any)} 
                  size={28} 
                  color={isActive ? Colors.primary : Colors.textMuted} 
                />
                <Text style={[styles.navText, isActive && styles.navTextActive, { fontSize: sFont(18) }]}>
                  {item.name}
                </Text>
              </View>
            </Focusable>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={styles.versionText}>v1.0.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: scale(240),
    height: '100%',
    backgroundColor: Colors.card,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 60,
    paddingLeft: 10,
  },
  logoText: {
    color: '#fff',
    fontSize: sFont(24),
    fontWeight: '900',
    letterSpacing: -1,
  },
  navContainer: {
    flex: 1,
    gap: 15,
  },
  navItemFocusable: {
    borderRadius: 12,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    gap: 15,
    backgroundColor: 'transparent',
  },
  navItemActive: {
    backgroundColor: 'rgba(209, 255, 0, 0.1)',
  },
  navText: {
    color: Colors.textMuted,
    fontSize: sFont(18),
    fontWeight: '600',
  },
  navTextActive: {
    color: Colors.primary,
  },
  footer: {
    marginTop: 'auto',
    paddingLeft: 10,
  },
  versionText: {
    color: Colors.textDim,
    fontSize: 12,
  }
});
