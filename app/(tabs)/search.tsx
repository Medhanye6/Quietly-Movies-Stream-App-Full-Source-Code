import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, TextInput, FlatList,
  TouchableOpacity, Image, ActivityIndicator,
  SafeAreaView, Platform, StatusBar as RNStatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { searchMulti, getImageUrl, TMDBMovie } from "@/lib/tmdb";
import { Colors } from "@/lib/colors";

const PT = Platform.OS === "android" ? RNStatusBar.currentHeight ?? 0 : 0;

function ResultCard({ item, onPress }: { item: TMDBMovie; onPress: () => void }) {
  const [imgErr, setImgErr] = useState(false);
  const type = item.media_type;
  const year = (item.release_date || item.first_air_date || "").slice(0, 4);
  return (
    <TouchableOpacity style={styles.resultRow} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.resultPoster}>
        {!imgErr ? (
          <Image
            source={{ uri: getImageUrl(item.poster_path, "w185") }}
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
            <View style={[styles.typeBadge, type === "movie" ? styles.badgeMovie : styles.badgeTV]}>
              <Text style={styles.typeTxt}>{type === "movie" ? "MOVIE" : "TV"}</Text>
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
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await searchMulti(q);
      setResults(res.filter((r) => (r.media_type === "movie" || r.media_type === "tv") && r.poster_path));
    } catch {
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

  function navigateTo(item: TMDBMovie) {
    const t = item.media_type ?? (item.title && !item.name ? "movie" : "tv");
    router.push(`/watch/${t}/${item.id}` as any);
  }

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: PT }]}>
      <View style={styles.header}>
        <Text style={styles.heading}>Search</Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.input}
          placeholder="Movies, TV shows, anime…"
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
          <Text style={styles.emptyTxt}>No results for "{query}"</Text>
        </View>
      )}

      {!query.trim() && (
        <View style={styles.center}>
          <Ionicons name="telescope-outline" size={56} color={Colors.textDim} />
          <Text style={styles.emptyTxt}>Search for movies & TV shows</Text>
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
  typeTxt:    { color: Colors.accent, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  metaTxt:    { color: Colors.textMuted, fontSize: 12 },
  starRow:    { flexDirection: "row", alignItems: "center", gap: 3 },
  overview:   { color: Colors.textDim, fontSize: 12, marginTop: 5, lineHeight: 17 },
});
