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

const { width: SW, height: SH } = Dimensions.get("window");
const CARD_W = SW * 0.65; // Smaller size
const CARD_H = CARD_W * 1.5;
const SIDE_SPACING = (SW - CARD_W) / 2;

type TabKey = "all" | "movies" | "tv" | "anime";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "Trending" },
  { key: "movies", label: "Movies" },
  { key: "tv", label: "TV Shows" },
  { key: "anime", label: "Anime" },
];

function MediaCard({ item, onPress, focused }: { item: TMDBMovie; onPress: () => void; focused?: boolean }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <TouchableOpacity 
      style={[styles.card, focused ? styles.cardFocused : styles.cardUnfocused]} 
      onPress={onPress} 
      activeOpacity={0.8}
    >
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
    </TouchableOpacity>
  );
}

function SectionRow({ title, data, onItemPress }: {
  title: string;
  data: TMDBMovie[];
  onItemPress: (item: TMDBMovie) => void;
}) {
  if (!data.length) return null;
  const ITEM_W = SW * 0.32;
  const ITEM_H = ITEM_W * 1.5;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        horizontal
        data={data}
        keyExtractor={(i) => String(i.id)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={{ width: ITEM_W, height: ITEM_H, borderRadius: 10, overflow: 'hidden', backgroundColor: Colors.card }}
            onPress={() => onItemPress(item)}
          >
            <Image 
              source={{ uri: getImageUrl(item.poster_path, "w342") }} 
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

export default function HomeScreen() {
  const router   = useRouter();
  const { user } = useAuth();

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

  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<any>(null);

  const focusedItem = activeTab === "trending" ? trending[heroIdx] : movies[heroIdx];

  useEffect(() => {
    AsyncStorage.getItem('community_popup_shown').then(shown => {
      if (!shown) {
        setTimeout(() => setShowCommunity(true), 3000);
      }
    });
  }, []);

  const handleJoinCommunity = () => {
    Linking.openURL('https://t.me/QuietlyStreams');
    handleCloseCommunity();
  };

  const handleCloseCommunity = () => {
    setShowCommunity(false);
    AsyncStorage.setItem('community_popup_shown', 'true');
  };

  useEffect(() => {
    if (!focusedItem) return;
    const t = focusedItem.media_type ?? (focusedItem.title && !focusedItem.name ? "movie" : "tv");
    isBookmarked(focusedItem.id, t).then(setBookmarked);
  }, [focusedItem, heroIdx, activeTab, trending, movies]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [t, p, tv, a, m] = await Promise.all([
          getTrending("movie", "week"), // Only trending movies
          getPopular("movie"),
          getPopular("tv"),
          getAnime(),
          getTrendingManga(),
        ]);
        setTrending(t.filter((i) => i.backdrop_path && i.poster_path).slice(0, 10));
        setMovies(p.filter((i) => i.poster_path));
        setTVShows(tv.filter((i) => i.poster_path));
        setAnime(a.filter((i) => i.poster_path));
        setManga(m);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (trending.length === 0) return;
    
    function startTimer() {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setHeroIdx((prev) => {
          const data = activeTab === "trending" ? trending : movies;
          const next = (prev + 1) % data.length;
          flatListRef.current?.scrollToOffset({
            offset: next * (CARD_W + 16),
            animated: true,
          });
          return next;
        });
      }, 5000);
    }

    startTimer();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [trending.length, movies.length, activeTab]);

  function navigateTo(item: any) {
    if (item.title && typeof item.title === "string") {
      const rawType = item.media_type ?? (item.title && !item.name ? "movie" : "tv");
      router.push(`/watch/${rawType}/${item.id}` as any);
    } else {
      // Manga navigation
      router.push(`/manga/${item.id}` as any);
    }
  }

  function handleDetail() {
    if (focusedItem) navigateTo(focusedItem);
  }

  const { showToast } = useToast();

  async function handleAddList() {
    if (!focusedItem) return;
    const type = (focusedItem.media_type ?? ((focusedItem.title && !focusedItem.name) ? "movie" : "tv")) as string;
    
    if (bookmarked) {
      await removeBookmark(focusedItem.id, type);
      setBookmarked(false);
      showToast(t('removedFromList'));
    } else {
      await addBookmark({
        id: focusedItem.id,
        type: type as any,
        title: (focusedItem.title || focusedItem.name) as string,
        poster_path: focusedItem.poster_path ?? null,
      });
      setBookmarked(true);
      showToast(t('addedToLibrary'));
    }
  }

  const data = activeTab === "trending" ? trending : movies;

  const onScroll = (event: any) => {
    const slideSize = CARD_W + 16;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    const data = activeTab === "trending" ? trending : movies;
    if (index !== heroIdx && index >= 0 && index < data.length) {
      setHeroIdx(index);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loaderTxt}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.responsiveWrapper}>
        {/* Header */}
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

      {/* Hero Tabs */}
      <View style={styles.navLinks}>
        <TouchableOpacity onPress={() => setActiveTab("trending")}>
          <Text style={[styles.navLink, activeTab === "trending" && styles.navLinkActive]}>{t('trending')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab("popular")}>
          <Text style={[styles.navLink, activeTab === "popular" && styles.navLinkActive]}>{t('popular')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
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
              <MediaCard
                item={item}
                onPress={() => navigateTo(item)}
                focused={index === heroIdx}
              />
            )}
          />
        </View>

        {/* Focused Movie Details */}
        {focusedItem && (
          <View style={styles.detailsContainer}>
            <Text style={styles.heroTitle}>{focusedItem.title || focusedItem.name}</Text>
            <Text style={styles.heroMeta}>
              {focusedItem.media_type === 'tv' ? t('tvShows') : t('movies')} • {focusedItem.vote_average.toFixed(1)} {t('rating')}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleDetail}>
            <View style={styles.actionIconCircle}>
              <Ionicons name="information" size={20} color="#fff" />
            </View>
            <Text style={styles.actionBtnTxt}>{t('details')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryActionBtn} onPress={() => focusedItem && navigateTo(focusedItem)}>
            <Text style={styles.primaryActionBtnTxt}>{t('watchNow')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleAddList}>
            <Ionicons 
              name={bookmarked ? "bookmark" : "bookmark-outline"} 
              size={24} 
              color={bookmarked ? Colors.primary : "#fff"} 
            />
            <Text style={[styles.actionBtnTxt, bookmarked && { color: Colors.primary }]}>
              {bookmarked ? t('inList') : t('addList')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Extra Sections */}
        <SectionRow title={t('movies')} data={movies.slice(0, 10)} onItemPress={navigateTo} />
        <SectionRow title={t('tvShows')} data={tvShows.slice(0, 10)} onItemPress={navigateTo} />
        <SectionRow title={t('anime')} data={anime.slice(0, 10)} onItemPress={navigateTo} />

        {/* Manga Section */}
        {manga.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('manga')}</Text>
            <FlatList
              horizontal
              data={manga}
              keyExtractor={(i) => `manga-${i.id}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
              renderItem={({ item }) => {
                const ITEM_W = SW * 0.32;
                const ITEM_H = ITEM_W * 1.5;
                return (
                  <TouchableOpacity 
                    style={{ width: ITEM_W, height: ITEM_H, borderRadius: 10, overflow: 'hidden', backgroundColor: Colors.card }}
                    onPress={() => navigateTo(item)}
                  >
                    <Image 
                      source={{ uri: item.coverImage.large }} 
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                );
              }}
            />
          </View>
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
  avatar:      { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  avatarTxt:   { color: "#000", fontWeight: "700", fontSize: 14 },
  
  carouselContainer: { marginVertical: 20 },
  card:        { width: CARD_W, height: CARD_H, borderRadius: 20, overflow: "hidden", backgroundColor: Colors.card },
  cardFocused: { transform: [{ scale: 1 }] },
  cardUnfocused: { transform: [{ scale: 0.9 }], opacity: 0.5 },
  cardImg:     { width: "100%", height: "100%" },
  cardImgFallback: { alignItems: "center", justifyContent: "center" },
  
  detailsContainer: { alignItems: "center", paddingHorizontal: 40, marginBottom: 24 },
  heroTitle:   { color: "#fff", fontSize: 24, fontWeight: "800", textAlign: "center", marginBottom: 6 },
  heroMeta:    { color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: "500" },

  actionRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 30, marginBottom: 30 },
  actionBtn:   { alignItems: "center", gap: 4, width: 60 },
  actionIconCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  actionBtnTxt: { color: "#fff", fontSize: 11, fontWeight: "500" },
  primaryActionBtn: { flex: 1, height: 48, backgroundColor: Colors.primary, borderRadius: 24, alignItems: "center", justifyContent: "center", marginHorizontal: 20 },
  primaryActionBtnTxt: { color: "#000", fontSize: 16, fontWeight: "800", letterSpacing: 0.5 },

  section:     { marginVertical: 12 },
  sectionTitle:{ color: "#fff", fontSize: 18, fontWeight: "700", paddingHorizontal: 20, marginBottom: 12 },

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
