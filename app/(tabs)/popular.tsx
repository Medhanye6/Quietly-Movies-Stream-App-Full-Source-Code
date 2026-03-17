import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, Dimensions, ActivityIndicator, SafeAreaView,
  Platform, StatusBar as RNStatusBar
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getPopular, getImageUrl, TMDBMovie } from "@/lib/tmdb";
import { Colors } from "@/lib/colors";
import { useTranslation } from "@/lib/i18n";

const { width: SW } = Dimensions.get("window");
const ITEM_W = (SW - 48) / 2;
const ITEM_H = ITEM_W * 1.5;

export default function PopularScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getPopular("movie");
        setMovies(data.filter(m => m.poster_path));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('popular')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={movies}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => router.push(`/watch/movie/${item.id}` as any)}
          >
            <Image 
              source={{ uri: getImageUrl(item.poster_path, "w342") }} 
              style={styles.image}
              resizeMode="cover"
            />
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color={Colors.star} />
              <Text style={styles.ratingTxt}>{item.vote_average.toFixed(1)} {t('rating')}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const PT = Platform.OS === "android" ? RNStatusBar.currentHeight ?? 0 : 0;

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: "#000", paddingTop: PT },
  loader:   { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  header:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 15 },
  backBtn:  { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  title:    { color: "#fff", fontSize: 18, fontWeight: "800" },
  list:     { paddingHorizontal: 16, paddingBottom: 20 },
  columnWrapper: { justifyContent: "space-between" },
  card:     { width: ITEM_W, height: ITEM_H, borderRadius: 16, overflow: "hidden", marginBottom: 16, backgroundColor: "#111" },
  image:    { width: "100%", height: "100%" },
  ratingBadge: { position: "absolute", top: 10, right: 10, backgroundColor: "rgba(0,0,0,0.6)", flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  ratingTxt: { color: "#fff", fontSize: 11, fontWeight: "700" },
});
