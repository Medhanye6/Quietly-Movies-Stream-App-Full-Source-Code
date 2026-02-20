import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, FlatList, Dimensions, ActivityIndicator,
  SafeAreaView, Platform, StatusBar as RNStatusBar,
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

const { width: SW, height: SH } = Dimensions.get("window");
const CARD_W = SW * 0.32;
const CARD_H = CARD_W * 1.5;
const HERO_H = SH * 0.52;

type TabKey = "all" | "movies" | "tv" | "anime";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "Trending" },
  { key: "movies", label: "Movies" },
  { key: "tv", label: "TV Shows" },
  { key: "anime", label: "Anime" },
];

function MediaCard({ item, onPress }: { item: TMDBMovie; onPress: () => void }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {!imgErr ? (
        <Image
          source={{ uri: getImageUrl(item.poster_path, "w342") }}
          style={styles.cardImg}
          resizeMode="cover"
          onError={() => setImgErr(true)}
        />
      ) : (
        <View style={[styles.cardImg, styles.cardImgFallback]}>
          <Ionicons name="film-outline" size={32} color={Colors.textDim} />
        </View>
      )}
      <LinearGradient
        colors={["transparent", "rgba(15,15,19,0.95)"]}
        style={styles.cardGrad}
      />
      <View style={styles.cardMeta}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title || item.name}
        </Text>
        {item.vote_average > 0 && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={10} color={Colors.star} />
            <Text style={styles.ratingText}>{item.vote_average.toFixed(1)}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function HeroBanner({ item, onPress }: { item: TMDBMovie; onPress: () => void }) {
  const [imgErr, setImgErr] = useState(false);
  const type = item.media_type ?? (item.title && !item.name ? "movie" : "tv");
  return (
    <TouchableOpacity style={styles.hero} onPress={onPress} activeOpacity={0.9}>
      {!imgErr ? (
        <Image
          source={{ uri: getImageUrl(item.backdrop_path, "w1280") }}
          style={styles.heroImg}
          resizeMode="cover"
          onError={() => setImgErr(true)}
        />
      ) : (
        <View style={[styles.heroImg, { backgroundColor: Colors.cardAlt }]} />
      )}
      <LinearGradient
        colors={["transparent", "rgba(15,15,19,0.6)", Colors.bg]}
        locations={[0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.heroContent}>
        <View style={styles.heroTypeBadge}>
          <Text style={styles.heroTypeTxt}>{type === "movie" ? "MOVIE" : "TV SERIES"}</Text>
        </View>
        <Text style={styles.heroTitle} numberOfLines={2}>{item.title || item.name}</Text>
        {item.vote_average > 0 && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color={Colors.star} />
            <Text style={styles.heroRating}>{item.vote_average.toFixed(1)}</Text>
          </View>
        )}
        <Text style={styles.heroOverview} numberOfLines={3}>{item.overview}</Text>
        <TouchableOpacity style={styles.watchBtn} onPress={onPress}>
          <Ionicons name="play" size={16} color="#fff" />
          <Text style={styles.watchBtnTxt}>Watch Now</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function SectionRow({ title, data, onItemPress }: {
  title: string;
  data: TMDBMovie[];
  onItemPress: (item: TMDBMovie) => void;
}) {
  if (!data.length) return null;
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
          <MediaCard
            item={item}
            onPress={() => onItemPress(item)}
          />
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
  const [loading,  setLoading]  = useState(true);
  const [heroIdx,  setHeroIdx]  = useState(0);
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  const heroTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [t, m, tv, a] = await Promise.all([
          getTrending("all", "week"),
          getPopular("movie"),
          getPopular("tv"),
          getAnime(),
        ]);
        setTrending(t.filter((i) => i.backdrop_path && i.poster_path).slice(0, 8));
        setMovies(m.filter((i) => i.poster_path));
        setTVShows(tv.filter((i) => i.poster_path));
        setAnime(a.filter((i) => i.poster_path));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Auto-cycle hero banner
  useEffect(() => {
    if (!trending.length) return;
    heroTimer.current = setInterval(() => {
      setHeroIdx((p) => (p + 1) % trending.length);
    }, 5000);
    return () => { if (heroTimer.current) clearInterval(heroTimer.current); };
  }, [trending.length]);

  const tabContent: Record<TabKey, TMDBMovie[]> = useMemo(
    () => ({ all: trending, movies, tv: tvShows, anime }),
    [trending, movies, tvShows, anime],
  );

  function navigateTo(item: TMDBMovie) {
    const rawType = item.media_type ?? (item.title && !item.name ? "movie" : "tv");
    router.push(`/watch/${rawType}/${item.id}` as any);
  }

  const heroItem = trending.length > 0 ? trending[heroIdx % trending.length] : undefined;

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loaderTxt}>Loading content…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>KiraStreams</Text>
        <TouchableOpacity onPress={() => router.push("/auth/login" as any)}>
          {user ? (
            <View style={styles.avatar}>
              <Text style={styles.avatarTxt}>{(user.name || user.email)[0].toUpperCase()}</Text>
            </View>
          ) : (
            <Ionicons name="person-circle-outline" size={30} color={Colors.textMuted} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Hero Banner */}
        {heroItem && (
          <HeroBanner item={heroItem} onPress={() => navigateTo(heroItem)} />
        )}

        {/* Hero dots */}
        {trending.length > 1 && (
          <View style={styles.dots}>
            {trending.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setHeroIdx(i)}>
                <View style={[styles.dot, i === heroIdx && styles.dotActive]} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Category Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, activeTab === t.key && styles.tabActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Text style={[styles.tabTxt, activeTab === t.key && styles.tabTxtActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Content grid for active tab */}
        <View style={styles.section}>
          <FlatList
            horizontal
            data={tabContent[activeTab]}
            keyExtractor={(i) => String(i.id)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
            renderItem={({ item }) => (
              <MediaCard item={item} onPress={() => navigateTo(item)} />
            )}
          />
        </View>

        {/* Persistent extra sections */}
        <SectionRow title="Popular Movies" data={movies.slice(0, 10)} onItemPress={navigateTo} />
        <SectionRow title="Popular TV Shows" data={tvShows.slice(0, 10)} onItemPress={navigateTo} />
        <SectionRow title="Anime" data={anime.slice(0, 10)} onItemPress={navigateTo} />
      </ScrollView>
    </SafeAreaView>
  );
}

const PT = Platform.OS === "android" ? RNStatusBar.currentHeight ?? 0 : 0;

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg, paddingTop: PT },
  loader:      { flex: 1, backgroundColor: Colors.bg, justifyContent: "center", alignItems: "center", gap: 12 },
  loaderTxt:   { color: Colors.textMuted, fontSize: 14 },
  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 12 },
  logo:        { fontSize: 24, fontWeight: "800", color: Colors.primary, letterSpacing: -0.5 },
  avatar:      { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  avatarTxt:   { color: "#fff", fontWeight: "700", fontSize: 14 },
  // Hero
  hero:        { width: SW, height: HERO_H, overflow: "hidden" },
  heroImg:     { ...StyleSheet.absoluteFillObject, width: SW, height: HERO_H },
  heroContent: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 20 },
  heroTypeBadge: { backgroundColor: Colors.primary, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start", marginBottom: 8 },
  heroTypeTxt: { color: "#fff", fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  heroTitle:   { color: Colors.text, fontSize: 26, fontWeight: "800", lineHeight: 32, marginBottom: 6 },
  heroRating:  { color: Colors.text, fontSize: 13, fontWeight: "600", marginLeft: 4 },
  heroOverview:{ color: Colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 14 },
  watchBtn:    { flexDirection: "row", alignItems: "center", backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 11, alignSelf: "flex-start", gap: 6 },
  watchBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },
  // Dots
  dots:        { flexDirection: "row", justifyContent: "center", gap: 6, paddingVertical: 10 },
  dot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  dotActive:   { backgroundColor: Colors.primary, width: 18 },
  // Tabs
  tabsRow:     { marginVertical: 6 },
  tab:         { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  tabActive:   { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabTxt:      { color: Colors.textMuted, fontSize: 13, fontWeight: "600" },
  tabTxtActive:{ color: "#fff" },
  // Section
  section:     { marginVertical: 10 },
  sectionTitle:{ color: Colors.text, fontSize: 17, fontWeight: "700", paddingHorizontal: 18, marginBottom: 10 },
  // Card
  card:        { width: CARD_W, height: CARD_H, borderRadius: 10, overflow: "hidden", backgroundColor: Colors.card },
  cardImg:     { width: CARD_W, height: CARD_H },
  cardImgFallback: { alignItems: "center", justifyContent: "center" },
  cardGrad:    { position: "absolute", bottom: 0, left: 0, right: 0, height: CARD_H * 0.55 },
  cardMeta:    { position: "absolute", bottom: 0, left: 0, right: 0, padding: 8 },
  cardTitle:   { color: Colors.text, fontSize: 11, fontWeight: "700", lineHeight: 15 },
  ratingRow:   { flexDirection: "row", alignItems: "center", marginTop: 3, gap: 3 },
  ratingText:  { color: Colors.textMuted, fontSize: 10 },
});
