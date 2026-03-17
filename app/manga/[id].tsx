import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Image,
  Dimensions, ActivityIndicator, TouchableOpacity,
  SafeAreaView, Platform, StatusBar as RNStatusBar, Linking
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getMangaDetails, AniListManga } from "@/lib/anilist";
import { searchMangaDex, getMangaChapters, MangaDexChapter } from "@/lib/mangadex";
import { Colors } from "@/lib/colors";
import { addBookmark, removeBookmark, isBookmarked } from "@/lib/storage";
import { useToast } from "@/lib/ToastContext";

const { width: SW } = Dimensions.get("window");

export default function MangaDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [manga, setManga] = useState<AniListManga | null>(null);
  const [chapters, setChapters] = useState<MangaDexChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getMangaDetails(Number(id));
        setManga(data);
        
        setBookmarked(await isBookmarked(String(id), "manga"));
        
        // Search MangaDex and fetch chapters
        setLoadingChapters(true);
        const title = data.title.english || data.title.romaji;
        const mdId = await searchMangaDex(title);
        if (mdId) {
          const chs = await getMangaChapters(mdId);
          setChapters(chs);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        setLoadingChapters(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!manga) {
    return (
      <View style={styles.loader}>
        <Text style={{ color: "#fff" }}>Manga not found</Text>
      </View>
    );
  }

  const cleanDescription = manga.description
    ? manga.description.replace(/<[^>]*>?/gm, "")
    : "No description available.";

  const handleReadChapter = (chapterId: string) => {
    router.push(`/manga/reader/${chapterId}` as any);
  };

  const { showToast } = useToast();

  const toggleBookmark = async () => {
    if (!manga) return;
    if (bookmarked) {
      await removeBookmark(String(id), "manga");
      setBookmarked(false);
      showToast("Removed from your list");
    } else {
      await addBookmark({
        id: String(id),
        type: "manga",
        title: manga.title.romaji || manga.title.english,
        poster_path: manga.coverImage.large,
      });
      setBookmarked(true);
      showToast("Added to your list!");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.responsiveWrapper}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Poster Header */}
          <View style={styles.headerHero}>
          <Image
            source={{ uri: manga.coverImage.extraLarge }}
            style={styles.heroImg}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.6)", "#000"]}
            style={styles.heroOverlay}
          />
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.bookmarkBtn} onPress={toggleBookmark}>
            <Ionicons 
              name={bookmarked ? "bookmark" : "bookmark-outline"} 
              size={24} 
              color={bookmarked ? Colors.primary : "#fff"} 
            />
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.content}>
          <Text style={styles.title}>{manga.title.romaji || manga.title.english}</Text>
          <View style={styles.metaRow}>
            <View style={styles.scoreBadge}>
              <Ionicons name="star" size={12} color={Colors.star} />
              <Text style={styles.scoreTxt}>{manga.averageScore || "N/A"}</Text>
            </View>
            <Text style={styles.metaTxt}>{manga.status} • {manga.chapters || "???"} Chapters</Text>
          </View>

          {/* Genres */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genreList}>
            {manga.genres.map((g) => (
              <View key={g} style={styles.genreBadge}>
                <Text style={styles.genreTxt}>{g}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Description */}
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.description}>{cleanDescription}</Text>

          {/* Chapters Section */}
          <Text style={styles.sectionTitle}>Chapters</Text>
          {loadingChapters ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 10 }} />
          ) : chapters.length > 0 ? (
            <View style={styles.chapterList}>
              {chapters.map((ch) => (
                <TouchableOpacity 
                  key={ch.id} 
                  style={styles.chapterRow}
                  onPress={() => handleReadChapter(ch.id)}
                >
                  <View style={styles.chapterInfo}>
                    <Text style={styles.chapterNum}>Chapter {ch.chapter}</Text>
                    <Text style={styles.chapterTitle} numberOfLines={1}>{ch.title}</Text>
                  </View>
                  <Ionicons name="play-circle-outline" size={24} color={Colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyTxt}>No chapters found in English.</Text>
          )}
        </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#000" },
  loader:       { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  headerHero:   { width: '100%', height: 450, position: "relative" },
  heroImg:      { width: "100%", height: "100%" },
  heroOverlay:  { ...StyleSheet.absoluteFillObject },
  responsiveWrapper: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 1200,
  },
  backBtn:      { position: 'absolute', top: 40, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  bookmarkBtn:  { position: 'absolute', top: 40, right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  content:      { paddingHorizontal: 20, marginTop: -60 },
  title:        { color: "#fff", fontSize: 28, fontWeight: "900", marginBottom: 10 },
  metaRow:      { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  scoreBadge:   { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  scoreTxt:     { color: Colors.star, fontSize: 13, fontWeight: "700" },
  metaTxt:      { color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: "500" },
  genreList:    { gap: 8, marginBottom: 24 },
  genreBadge:   { backgroundColor: Colors.primary + "20", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: Colors.primary + "40" },
  genreTxt:     { color: Colors.primary, fontSize: 12, fontWeight: "600" },
  sectionTitle: { color: "#fff", fontSize: 18, fontWeight: "800", marginBottom: 10 },
  description:  { color: "rgba(255,255,255,0.7)", fontSize: 15, lineHeight: 24, marginBottom: 30 },
  chapterList:  { gap: 10 },
  chapterRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  chapterInfo:  { flex: 1 },
  chapterNum:   { color: Colors.primary, fontSize: 13, fontWeight: '700', marginBottom: 2 },
  chapterTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  emptyTxt:     { color: Colors.textMuted, fontSize: 14, marginTop: 10 },
});
