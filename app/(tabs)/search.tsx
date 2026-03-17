import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, TextInput, FlatList,
  Image, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { searchMulti, getImageUrl, getTrending, TMDBMovie } from "@/lib/tmdb";
import { searchManga } from "@/lib/anilist";
import { Colors } from "@/lib/colors";
import { useTranslation } from "@/lib/i18n";
import { useResponsive } from "@/hooks/useResponsive";
import { scale, sFont } from "@/lib/scaling";
import { Focusable } from "@/components/Focusable";

function ResultCard({ item, onPress, style }: { item: any; onPress: () => void; style?: any }) {
  const { t } = useTranslation();
  const [imgErr, setImgErr] = useState(false);
  const type = item.media_type;
  const year = type === "manga" ? "Manga" : (item.release_date || item.first_air_date || "").slice(0, 4);
  const posterUri = type === "manga" ? item.poster_path : getImageUrl(item.poster_path, "w185");
  return (
    <Focusable style={[styles.resultRow, style]} onPress={onPress}>
      <View style={[styles.resultPoster, { marginRight: scale(12) }]}>
        {!imgErr ? (
          <Image
            source={{ uri: posterUri }}
            style={[styles.posterImg, { width: scale(52), height: scale(78) }]}
            resizeMode="cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <View style={[styles.posterImg, styles.posterFallback, { width: scale(52), height: scale(78) }]}>
            <Ionicons name="film-outline" size={22} color={Colors.textDim} />
          </View>
        )}
      </View>
      <View style={styles.resultInfo}>
        <Text style={[styles.resultTitle, { fontSize: sFont(14) }]} numberOfLines={2}>{item.title || item.name}</Text>
        <View style={styles.metaRow}>
          {type && (
            <View style={[
              styles.typeBadge, 
              type === "movie" ? styles.badgeMovie : type === "tv" ? styles.badgeTV : styles.badgeManga,
              { paddingHorizontal: scale(6), paddingVertical: scale(2) }
            ]}>
              <Text style={[styles.typeTxt, { fontSize: sFont(10) }]}>
                {type === "movie" ? t('movies').toUpperCase() : type === "tv" ? t('tvShows').toUpperCase() : t('manga').toUpperCase()}
              </Text>
            </View>
          )}
          {year ? <Text style={[styles.metaTxt, { fontSize: sFont(12) }]}>{year}</Text> : null}
          {item.vote_average > 0 && (
            <View style={styles.starRow}>
              <Ionicons name="star" size={11} color={Colors.star} />
              <Text style={[styles.metaTxt, { fontSize: sFont(12) }]}>{item.vote_average.toFixed(1)}</Text>
            </View>
          )}
        </View>
        {item.overview ? (
          <Text style={[styles.overview, { fontSize: sFont(12) }]} numberOfLines={2}>{item.overview}</Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textDim} style={{ marginLeft: 4 }} />
    </Focusable>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isPhone, isTV } = useResponsive();
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

  const isDesktop = !isPhone;

  return (
    <SafeAreaView style={styles.safe} edges={isTV ? ['top', 'bottom', 'left', 'right'] : ['bottom']}>
      <View style={styles.responsiveWrapper}>
        <View style={[styles.header, { paddingTop: isTV ? 20 : 8 }]}>
           <Text style={[styles.heading, { fontSize: sFont(26) }]}>{t('search')}</Text>
        </View>

        <View style={[styles.searchBar, { height: scale(50) }]}>
          <Ionicons name="search" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.input, { fontSize: sFont(15) }]}
            placeholder={t('searchPlaceholder')}
            placeholderTextColor={Colors.textDim}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Focusable onPress={() => { setQuery(""); setResults([]); }}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </Focusable>
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
            <Text style={[styles.emptyTxt, { fontSize: sFont(15) }]}>{t('noResults')} "{query}"</Text>
          </View>
        )}

        {!loading && !query.trim() && (
          <View style={{ flex: 1 }}>
            <View style={styles.recHeader}>
              <Ionicons name="sparkles" size={16} color={Colors.primary} />
              <Text style={[styles.recTitle, { fontSize: sFont(18) }]}>{t('recommended')}</Text>
            </View>
            {recLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={recommendations}
                key={isDesktop ? 'rec-grid' : 'rec-list'}
                keyExtractor={(i) => `rec-${i.id}`}
                numColumns={isDesktop ? 3 : 2}
                contentContainerStyle={styles.recGrid}
                columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 16 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <Focusable 
                    style={[styles.recCard, { width: isDesktop ? '31%' : '48.5%' }]} 
                    onPress={() => navigateTo(item)}
                  >
                    <Image 
                      source={{ uri: getImageUrl(item.poster_path, "w342") }} 
                      style={[styles.recPoster, { height: scale(200) }]}
                      resizeMode="cover"
                    />
                    <View style={styles.recInfo}>
                      <Text style={[styles.recCardTitle, { fontSize: sFont(13) }]} numberOfLines={1}>{item.title || item.name}</Text>
                      <View style={styles.recMeta}>
                        <Text style={[styles.recMetaTxt, { fontSize: sFont(11) }]}>
                          {item.media_type === "movie" ? t('movies') : t('tvShows')} • {(item.release_date || item.first_air_date || "").slice(0, 4)}
                        </Text>
                      </View>
                    </View>
                  </Focusable>
                )}
              />
            )}
          </View>
        )}

        {results.length > 0 && (
          <FlatList
            data={results}
            key={isDesktop ? 'res-grid' : 'res-list'}
            numColumns={isDesktop ? 2 : 1}
            keyExtractor={(i) => `${i.media_type}-${i.id}`}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 12 }}
            renderItem={({ item }) => (
              <ResultCard 
                item={item} 
                onPress={() => navigateTo(item)} 
                style={isDesktop ? { width: '48.5%', marginBottom: 0 } : { marginVertical: 4 }}
              />
            )}
            keyboardDismissMode="on-drag"
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.bg },
  header:     { paddingHorizontal: 18, paddingBottom: 4 },
  heading:    { color: Colors.text, fontWeight: "800" },
  searchBar:  { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, borderRadius: 12, marginHorizontal: 16, marginVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.border },
  input:      { flex: 1, color: Colors.text },
  center:     { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingBottom: 60 },
  emptyTxt:   { color: Colors.textMuted, textAlign: "center" },
  resultRow:  { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: Colors.border },
  resultPoster:{ },
  posterImg:  { borderRadius: 7, backgroundColor: Colors.cardAlt },
  posterFallback: { alignItems: "center", justifyContent: "center" },
  resultInfo: { flex: 1 },
  resultTitle:{ color: Colors.text, fontWeight: "700", marginBottom: 5 },
  metaRow:    { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  typeBadge:  { borderRadius: 4 },
  badgeMovie: { backgroundColor: Colors.primary + "33" },
  badgeTV:    { backgroundColor: Colors.success + "22" },
  badgeManga: { backgroundColor: "#FF007F" + "33" }, 
  typeTxt:    { color: Colors.accent, fontWeight: "700", letterSpacing: 0.5 },
  metaTxt:    { color: Colors.textMuted },
  starRow:    { flexDirection: "row", alignItems: "center", gap: 3 },
  overview:   { color: Colors.textDim, marginTop: 5, lineHeight: 17 },
  recHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, marginTop: 10, marginBottom: 15 },
  recTitle:   { color: '#fff', fontWeight: '800' },
  recGrid:    { paddingHorizontal: 16, paddingBottom: 100 },
  recCard:    { backgroundColor: Colors.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  recPoster:  { width: '100%' },
  recInfo:    { padding: 10 },
  recCardTitle:{ color: '#fff', fontWeight: '700' },
  recMeta:    { marginTop: 4 },
  recMetaTxt: { color: Colors.textMuted, fontWeight: '500' },
  responsiveWrapper: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 1200,
  }
});
