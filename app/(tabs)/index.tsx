import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, FlatList, Dimensions, ActivityIndicator,
  SafeAreaView, Platform, StatusBar as RNStatusBar, Alert,
  Modal, Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  getTrending, getPopular, getAnime,
  getImageUrl, TMDBMovie,
} from "@/lib/tmdb";
import { Colors } from "@/lib/colors";
import { useAuth } from "@/lib/AuthContext";
import { addToHistory, addBookmark, removeBookmark, isBookmarked } from "@/lib/storage";
import { useToast } from "@/lib/ToastContext";
import { useTranslation } from "@/lib/i18n";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTrendingManga, AniListManga } from "@/lib/anilist";

import { useResponsive } from "@/hooks/useResponsive";
import { scale, sFont, verticalScale } from "@/lib/scaling";
import { Focusable } from "@/components/Focusable";

function MediaCard({ item, onPress, width, height, autoFocus }: { 
  item: TMDBMovie; 
  onPress: () => void; 
  width: number;
  height: number;
  autoFocus?: boolean;
}) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <Focusable 
      onPress={onPress} 
      style={{ width, height, borderRadius: 24 }}
      autoFocus={autoFocus}
    >
      <View style={styles.cardFrame}>
        {!imgErr ? (
          <Image
            source={{ uri: getImageUrl(item.poster_path, "w780") }}
            style={styles.cardImg}
            resizeMode="cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <View style={[styles.cardImg, styles.cardImgFallback]}>
            <Ionicons name="film-outline" size={48} color={Colors.textDim} />
          </View>
        )}
      </View>
    </Focusable>
  );
}

function SectionRow({ title, data, onItemPress, isGrid = false }: {
  title: string;
  data: TMDBMovie[];
  onItemPress: (item: TMDBMovie) => void;
  isGrid?: boolean;
}) {
  const { width: SW, isPhone, isTablet, isTV } = useResponsive();
  if (!data.length) return null;

  const numColumns = isPhone ? 3 : isTablet ? 4 : 6;
  const ITEM_W = (SW - (isPhone ? 48 : 100)) / numColumns;
  const ITEM_H = ITEM_W * 1.5;

  if (isGrid) {
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: sFont(22) }]}>{title}</Text>
        <View style={styles.gridContainer}>
          {data.map((item) => (
            <View key={item.id} style={{ width: ITEM_W, marginBottom: 20 }}>
              <Focusable onPress={() => onItemPress(item)}>
                <View style={{ width: ITEM_W, height: ITEM_H, backgroundColor: Colors.card }}>
                  <Image 
                    source={{ uri: getImageUrl(item.poster_path, "w342") }} 
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                </View>
              </Focusable>
              <Text style={[styles.itemTitle, { fontSize: sFont(14) }]} numberOfLines={2}>
                {item.title || item.name}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { fontSize: sFont(22) }]}>{title}</Text>
      <FlatList
        horizontal
        data={data}
        keyExtractor={(i) => String(i.id)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        renderItem={({ item }) => (
          <View style={{ width: ITEM_W, gap: 8 }}>
            <Focusable onPress={() => onItemPress(item)}>
              <View style={{ width: ITEM_W, height: ITEM_H, backgroundColor: Colors.card }}>
                <Image 
                  source={{ uri: getImageUrl(item.poster_path, "w342") }} 
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </View>
            </Focusable>
            <Text style={[styles.itemTitle, { fontSize: sFont(14) }]} numberOfLines={2}>
              {item.title || item.name}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

export default function HomeScreen() {
  const router   = useRouter();
  const { user } = useAuth();
  const { width: SW, height: SH, isPhone, isTablet, isTV } = useResponsive();

  const [trending, setTrending] = useState<TMDBMovie[]>([]);
  const [movies,   setMovies]   = useState<TMDBMovie[]>([]);
  const [tvShows,  setTVShows]  = useState<TMDBMovie[]>([]);
  const [anime,    setAnime]    = useState<TMDBMovie[]>([]);
  const [manga,    setManga]    = useState<AniListManga[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [heroIdx,  setHeroIdx]  = useState(0);
  const [activeTab, setActiveTab] = useState<"trending" | "popular">("trending");
  const [bookmarked, setBookmarked] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);

  const { t } = useTranslation();

  const flatListRef = useRef<FlatList<TMDBMovie>>(null);
  const timerRef = useRef<any>(null);

  const focusedItem = activeTab === "trending" ? trending[heroIdx] : movies[heroIdx];

  const CARD_W = isPhone ? SW * 0.65 : SW * 0.45; 
  const CARD_H = CARD_W * 1.5;
  const SIDE_SPACING = (SW - CARD_W) / 2;

  useEffect(() => {
    (async () => {
      try {
        const [tr, mv, tv, an, mg] = await Promise.all([
          getTrending("all", "day"),
          getPopular("movie"),
          getPopular("tv"),
          getAnime(),
          getTrendingManga()
        ]);
        setTrending(tr.slice(0, 10));
        setMovies(mv.slice(0, 20));
        setTVShows(tv.slice(0, 20));
        setAnime(an.slice(0, 20));
        setManga(mg.slice(0, 10));

        // Check first item bookmark status
        const first = tr[0];
        if (first) {
          const status = await isBookmarked(String(first.id), first.media_type || 'movie');
          setBookmarked(status);
        }

        // Community Modal Logic (Show once a day or something)
        const lastShow = await AsyncStorage.getItem('community_modal_last');
        const now = Date.now();
        if (!lastShow || now - Number(lastShow) > 24 * 60 * 60 * 1000) {
          setShowCommunity(true);
        }
      } catch (err) {
        console.error("Home load error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (focusedItem) {
      isBookmarked(String(focusedItem.id), focusedItem.media_type || (activeTab === 'popular' ? 'movie' : 'movie'))
        .then(setBookmarked);
    }
  }, [focusedItem, activeTab, heroIdx]);

  const onScroll = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / (CARD_W + 16));
    if (idx !== heroIdx) setHeroIdx(idx);
  };

  const navigateTo = async (item: any) => {
    if (item.media_type === "manga" || (item.title && !item.release_date && !item.first_air_date)) {
      router.push(`/manga/${item.id}` as any);
    } else {
      const type = item.media_type || (activeTab === "popular" ? "movie" : "movie");
      router.push(`/watch/${type}/${item.id}` as any);
      await addToHistory({
        id: String(item.id),
        type: type as any,
        title: item.title || item.name,
        poster_path: item.poster_path
      });
    }
  };

  const handleDetail = () => {
    if (focusedItem) navigateTo(focusedItem);
  };

  const handleAddList = async () => {
    if (!focusedItem) return;
    const type = focusedItem.media_type || (activeTab === "popular" ? "movie" : "movie");
    if (bookmarked) {
      await removeBookmark(String(focusedItem.id), type);
      setBookmarked(false);
      showToast(t('removedFromList'));
    } else {
      await addBookmark({
        id: String(focusedItem.id),
        type: type as any,
        title: focusedItem.title || focusedItem.name,
        poster_path: focusedItem.poster_path
      });
      setBookmarked(true);
      showToast(t('addedToList'));
    }
  };

  const handleJoinCommunity = () => {
    Linking.openURL("https://t.me/quietly_stream");
    handleCloseCommunity();
  };

  const handleCloseCommunity = async () => {
    setShowCommunity(false);
    await AsyncStorage.setItem('community_modal_last', String(Date.now()));
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loaderTxt}>{t('loading')}</Text>
      </View>
    );
  }

  const isDesktop = !isPhone;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.responsiveWrapper}>
        {/* Header */}
        {!isDesktop && (
          <View style={styles.header}>
            <View style={styles.brandContainer}>
              <View style={styles.headerLogoContainer}>
                <Image source={require("../../assets/logo.png")} style={styles.headerLogo} resizeMode="contain" />
              </View>
              <Text style={styles.logo}>Quietly Stream</Text>
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => router.push("/search")}>
                <Ionicons name="search-outline" size={24} color={Colors.text} style={{ marginRight: 15 }} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/auth/login" as any)}>
                {user ? (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarTxt}>{(user.name || user.email)[0].toUpperCase()}</Text>
                  </View>
                ) : (
                  <Ionicons name="person-circle-outline" size={28} color={Colors.text} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Hero Tabs */}
        <View style={[styles.navLinks, isDesktop && { marginTop: 40 }]}>
          <TouchableOpacity onPress={() => setActiveTab("trending")}>
            <Text style={[styles.navLink, activeTab === "trending" && styles.navLinkActive, { fontSize: sFont(22) }]}>{t('trending')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab("popular")}>
            <Text style={[styles.navLink, activeTab === "popular" && styles.navLinkActive, { fontSize: sFont(22) }]}>{t('popular')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: isPhone ? 100 : 40 }}>
          {/* Hero Carousel */}
          <View style={styles.carouselContainer}>
            <FlatList
              ref={flatListRef}
              horizontal
              data={activeTab === "trending" ? trending : movies}
              keyExtractor={(i) => String(i.id)}
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_W + 16}
              snapToAlignment="start"
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: SIDE_SPACING, gap: 16 }}
              onScroll={onScroll}
              scrollEventThrottle={16}
              renderItem={({ item, index }) => (
                <View style={[index !== heroIdx && { transform: [{ scale: 0.85 }], opacity: 0.5 }]}>
                  <MediaCard
                    item={item}
                    onPress={() => navigateTo(item)}
                    width={CARD_W}
                    height={CARD_H}
                    autoFocus={index === 0 && Platform.isTV}
                  />
                </View>
              )}
            />
          </View>

          {/* Focused Movie Details */}
          {focusedItem && (
            <View style={styles.detailsContainer}>
              <Text style={[styles.heroTitle, { fontSize: sFont(32) }]}>{focusedItem.title || focusedItem.name}</Text>
              <Text style={[styles.heroMeta, { fontSize: sFont(16) }]}>
                {focusedItem.media_type === 'tv' ? t('tvShows') : t('movies')} • {focusedItem.vote_average.toFixed(1)} {t('rating')}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={[styles.actionRow, isDesktop && { alignSelf: 'center', width: 600 }]}>
            <Focusable onPress={handleDetail} style={styles.actionBtn}>
              <View style={styles.actionIconCircle}>
                <Ionicons name="information" size={20} color="#fff" />
              </View>
              <Text style={styles.actionBtnTxt}>{t('details')}</Text>
            </Focusable>

            <Focusable onPress={() => focusedItem && navigateTo(focusedItem)} style={styles.primaryActionBtn}>
              <Text style={styles.primaryActionBtnTxt}>{t('watchNow')}</Text>
            </Focusable>

            <Focusable onPress={handleAddList} style={styles.actionBtn}>
              <Ionicons 
                name={bookmarked ? "bookmark" : "bookmark-outline"} 
                size={24} 
                color={bookmarked ? Colors.primary : "#fff"} 
              />
              <Text style={[styles.actionBtnTxt, bookmarked && { color: Colors.primary }]}>
                {bookmarked ? t('inList') : t('addList')}
              </Text>
            </Focusable>
          </View>

          {/* Extra Sections */}
          <SectionRow title={t('tvShows')} data={tvShows.slice(0, 10)} onItemPress={navigateTo} isGrid={!isPhone} />
          <SectionRow title={t('movies')} data={movies.slice(0, 10)} onItemPress={navigateTo} isGrid={!isPhone} />
          <SectionRow title={t('anime')} data={anime.slice(0, 10)} onItemPress={navigateTo} isGrid={!isPhone} />

          {manga.length > 0 && (
            <SectionRow title={t('manga')} data={manga.map(m => ({ ...m, title: m.title.english || m.title.romaji, poster_path: m.coverImage.large })) as any} onItemPress={navigateTo} isGrid={!isPhone} />
          )}
        </ScrollView>
      </View>

      <Modal transparent visible={showCommunity} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <Image source={require("../../assets/logo.png")} style={styles.modalLogo} resizeMode="contain" />
            </View>
            <Text style={styles.modalTitle}>{t('joinCommunity')}</Text>
            <Text style={styles.modalDesc}>{t('joinTelegram')}</Text>
            
            <TouchableOpacity style={styles.modalJoinBtn} onPress={handleJoinCommunity}>
              <Text style={styles.modalJoinBtnTxt}>{t('join')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalLaterBtn} onPress={handleCloseCommunity}>
              <Text style={styles.modalLaterBtnTxt}>{t('later')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const PT = Platform.OS === "android" ? RNStatusBar.currentHeight ?? 0 : 0;

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: "#000", paddingTop: PT },
  loader:      { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center", gap: 12 },
  loaderTxt:   { color: Colors.textMuted, fontSize: 14 },
  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  brandContainer: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerLogoContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  headerLogo: {
    width: 32,
    height: 32,
  },
  modalLogo: {
    width: 50,
    height: 50,
  },
  logo:        { fontSize: 20, fontWeight: "900", color: Colors.primary, letterSpacing: -0.5 },
  headerActions: { flexDirection: "row", alignItems: "center" },
  navLinks:    { flexDirection: "row", gap: 20, paddingHorizontal: 20, marginVertical: 8 },
  navLink:     { fontSize: 18, color: "rgba(255,255,255,0.6)", fontWeight: "500" },
  navLinkActive:{ color: "#fff", fontWeight: "800" },
  avatarTxt:   { color: "#000", fontWeight: "700", fontSize: 14 },
  
  carouselContainer: {
    height: scale(420),
    marginVertical: 10,
  },

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 15,
  },
  card:        { borderRadius: 24, overflow: "visible", backgroundColor: "transparent" },
  cardFrame:   { width: '100%', height: '100%', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: Colors.card, elevation: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  cardImg:     { width: "100%", height: "100%" },
  cardImgFallback: { alignItems: "center", justifyContent: "center" },
  
  detailsContainer: { alignItems: "center", paddingHorizontal: 40, marginBottom: 24 },
  heroTitle:   { color: "#fff", fontWeight: "800", textAlign: "center", marginBottom: 6 },
  heroMeta:    { color: "rgba(255,255,255,0.6)", fontWeight: "500" },

  actionRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 30, marginBottom: 30 },
  actionBtn:   { alignItems: "center", gap: 4, width: 80, paddingVertical: 10 },
  actionIconCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  actionBtnTxt: { color: "#fff", fontSize: 11, fontWeight: "500" },
  primaryActionBtn: { flex: 1, height: 48, backgroundColor: Colors.primary, borderRadius: 24, alignItems: "center", justifyContent: "center", marginHorizontal: 20 },
  primaryActionBtnTxt: { color: "#000", fontSize: 16, fontWeight: "800", letterSpacing: 0.5 },

  section:     { marginVertical: 12 },
  sectionTitle:{ color: "#fff", fontWeight: "700", paddingHorizontal: 20, marginBottom: 12 },

  responsiveWrapper: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 1200,
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  modalContent: { backgroundColor: '#1a1a1a', borderRadius: 32, padding: 30, width: '100%', maxWidth: 350, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 12, textAlign: 'center' },
  modalDesc: { color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 25 },
  modalJoinBtn: { backgroundColor: Colors.primary, height: 50, borderRadius: 25, width: '100%', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  modalJoinBtnTxt: { color: '#000', fontSize: 16, fontWeight: '800' },
  modalLaterBtn: { height: 40, width: '100%', alignItems: 'center', justifyContent: 'center' },
  modalLaterBtnTxt: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },
});
