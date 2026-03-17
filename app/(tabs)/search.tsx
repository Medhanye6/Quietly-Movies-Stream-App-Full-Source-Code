import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, TextInput, FlatList,
  TouchableOpacity, Image, ActivityIndicator,
  SafeAreaView, Platform, StatusBar as RNStatusBar, Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { searchMulti, getImageUrl, getTrending, TMDBMovie } from "@/lib/tmdb";
import { searchManga } from "@/lib/anilist";
import { Colors } from "@/lib/colors";
import { useTranslation } from "@/lib/i18n";

const PT = Platform.OS === "android" ? RNStatusBar.currentHeight ?? 0 : 0;
const { width: SW } = Dimensions.get("window");

function ResultCard({ item, onPress }: { item: any; onPress: () => void }) {
  const { t } = useTranslation();
  const [imgErr, setImgErr] = useState(false);
  const type = item.media_type;
  const year = type === "manga" ? "Manga" : (item.release_date || item.first_air_date || "").slice(0, 4);
  const posterUri = type === "manga" ? item.poster_path : getImageUrl(item.poster_path, "w185");
  return (
    <TouchableOpacity style={styles.resultRow} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.resultPoster}>
        {!imgErr ? (
          <Image
            source={{ uri: posterUri }}
            style={styles.posterImg}
            resizeMode="cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <View style={[styles.posterImg, styles.posterFallback]}>
            <Ionicons name="film-outline" size={22} color={Colors.textDim} />
          </View>
        )}
      </View>
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={2}>{item.title || item.name}</Text>
        <View style={styles.metaRow}>
          {type && (
            <View style={[
              styles.typeBadge, 
              type === "movie" ? styles.badgeMovie : type === "tv" ? styles.badgeTV : styles.badgeManga
            ]}>
              <Text style={styles.typeTxt}>
                {type === "movie" ? t('movies').toUpperCase() : type === "tv" ? t('tvShows').toUpperCase() : t('manga').toUpperCase()}
              </Text>
            </View>
          )}
          {year ? <Text style={styles.metaTxt}>{year}</Text> : null}
          {item.vote_average > 0 && (
            <View style={styles.starRow}>
              <Ionicons name="star" size={11} color={Colors.star} />
              <Text style={styles.metaTxt}>{item.vote_average.toFixed(1)}</Text>
            </View>
          )}
        </View>
        {item.overview ? (
          <Text style={styles.overview} numberOfLines={2}>{item.overview}</Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textDim} style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<TMDBMovie[]>([]);
  const [recLoading, setRecLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      setRecLoading(true);
      try {
        const res = await getTrending("all", "day");
        setRecommendations(res.filter(r => (r.media_type === "movie" || r.media_type === "tv") && r.poster_path).slice(0, 20));
      } catch (e) {
        console.error("Failed to fetch recommendations:", e);
      } finally {
        setRecLoading(false);
      }
    })();
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const [tmdbRes, mangaRes] = await Promise.all([
        searchMulti(q),
        searchManga(q)
      ]);

      const formattedTmdb = tmdbRes.filter((r) => (r.media_type === "movie" || r.media_type === "tv") && r.poster_path);
      const formattedManga = mangaRes.map(m => ({
        id: m.id,
        title: m.title.romaji || m.title.english,
        poster_path: m.coverImage.large,
        media_type: "manga",
        overview: "",
        vote_average: 0
      }));

      setResults([...formattedTmdb, ...formattedManga]);
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 450);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  function navigateTo(item: any) {
    if (item.media_type === "manga") {
      router.push(`/manga/${item.id}` as any);
    } else {
      const t = item.media_type ?? (item.title && !item.name ? "movie" : "tv");
      router.push(`/watch/${t}/${item.id}` as any);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: PT }]}>
      <View style={styles.header}>
        <Text style={styles.heading}>{t('search')}</Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.input}
          placeholder={t('searchPlaceholder')}
          placeholderTextColor={Colors.textDim}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(""); setResults([]); }}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      )}

      {!loading && query.trim() && results.length === 0 && (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={48} color={Colors.textDim} />
          <Text style={styles.emptyTxt}>{t('noResults')} "{query}"</Text>
        </View>
      )}

      {!loading && !query.trim() && (
        <View style={{ flex: 1 }}>
          <View style={styles.recHeader}>
            <Ionicons name="sparkles" size={16} color={Colors.primary} />
            <Text style={styles.recTitle}>{t('recommended')}</Text>
          </View>
          {recLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={recommendations}
              keyExtractor={(i) => `rec-${i.id}`}
              numColumns={2}
              contentContainerStyle={styles.recGrid}
              columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 16 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.recCard} 
                  onPress={() => navigateTo(item)}
                  activeOpacity={0.8}
                >
                  <Image 
                    source={{ uri: getImageUrl(item.poster_path, "w342") }} 
                    style={styles.recPoster}
                    resizeMode="cover"
                  />
                  <View style={styles.recInfo}>
                    <Text style={styles.recCardTitle} numberOfLines={1}>{item.title || item.name}</Text>
                    <View style={styles.recMeta}>
                      <Text style={styles.recMetaTxt}>
                        {item.media_type === "movie" ? t('movies') : t('tvShows')} • {(item.release_date || item.first_air_date || "").slice(0, 4)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}

      {results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(i) => `${i.media_type}-${i.id}`}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 2 }}
          renderItem={({ item }) => <ResultCard item={item} onPress={() => navigateTo(item)} />}
          keyboardDismissMode="on-drag"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.bg },
  header:     { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 4 },
  heading:    { color: Colors.text, fontSize: 26, fontWeight: "800" },
  searchBar:  { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, borderRadius: 12, marginHorizontal: 16, marginVertical: 10, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: Colors.border },
  input:      { flex: 1, color: Colors.text, fontSize: 15 },
  center:     { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingBottom: 60 },
  emptyTxt:   { color: Colors.textMuted, fontSize: 15, textAlign: "center" },
  // Result row
  resultRow:  { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, borderRadius: 12, padding: 10, marginVertical: 4, borderWidth: 1, borderColor: Colors.border },
  resultPoster:{ marginRight: 12 },
  posterImg:  { width: 52, height: 78, borderRadius: 7, backgroundColor: Colors.cardAlt },
  posterFallback: { alignItems: "center", justifyContent: "center" },
  resultInfo: { flex: 1 },
  resultTitle:{ color: Colors.text, fontSize: 14, fontWeight: "700", marginBottom: 5 },
  metaRow:    { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  typeBadge:  { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  badgeMovie: { backgroundColor: Colors.primary + "33" },
  badgeTV:    { backgroundColor: Colors.success + "22" },
  badgeManga: { backgroundColor: "#FF007F" + "33" }, // Pinkish for manga
  typeTxt:    { color: Colors.accent, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  metaTxt:    { color: Colors.textMuted, fontSize: 12 },
  starRow:    { flexDirection: "row", alignItems: "center", gap: 3 },
  overview:   { color: Colors.textDim, fontSize: 12, marginTop: 5, lineHeight: 17 },
  // Recommendations
  recHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, marginTop: 10, marginBottom: 15 },
  recTitle:   { color: '#fff', fontSize: 18, fontWeight: '800' },
  recGrid:    { paddingHorizontal: 16, paddingBottom: 100 },
  recCard:    { width: (SW - 48) / 2, backgroundColor: Colors.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  recPoster:  { width: '100%', height: 200 },
  recInfo:    { padding: 10 },
  recCardTitle:{ color: '#fff', fontSize: 13, fontWeight: '700' },
  recMeta:    { marginTop: 4 },
  recMetaTxt: { color: Colors.textMuted, fontSize: 11, fontWeight: '500' },
});
