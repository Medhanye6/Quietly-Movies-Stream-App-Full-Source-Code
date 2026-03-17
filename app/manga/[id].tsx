import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Image,
  ActivityIndicator, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getMangaDetails, AniListManga } from "@/lib/anilist";
import { searchMangaDex, getMangaChapters, MangaDexChapter } from "@/lib/mangadex";
import { Colors } from "@/lib/colors";
import { addBookmark, removeBookmark, isBookmarked } from "@/lib/storage";
import { useToast } from "@/lib/ToastContext";
import { useResponsive } from "@/hooks/useResponsive";
import { scale, sFont } from "@/lib/scaling";
import { Focusable } from "@/components/Focusable";

export default function MangaDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isPhone, isTV, width: SW, height: SH } = useResponsive();
  const { showToast } = useToast();

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

  const isDesktop = !isPhone;

  const MainInfo = () => (
    <View style={styles.content}>
      <Text style={[styles.title, { fontSize: sFont(28) }]}>{manga.title.romaji || manga.title.english}</Text>
      <View style={styles.metaRow}>
        <View style={styles.scoreBadge}>
          <Ionicons name="star" size={12} color={Colors.star} />
          <Text style={[styles.scoreTxt, { fontSize: sFont(13) }]}>{manga.averageScore || "N/A"}</Text>
        </View>
        <Text style={[styles.metaTxt, { fontSize: sFont(13) }]}>{manga.status} • {manga.chapters || "???"} Chapters</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genreList}>
        {manga.genres.map((g) => (
          <View key={g} style={styles.genreBadge}>
            <Text style={[styles.genreTxt, { fontSize: sFont(12) }]}>{g}</Text>
          </View>
        ))}
      </ScrollView>

      <Text style={[styles.sectionTitle, { fontSize: sFont(18) }]}>Overview</Text>
      <Text style={[styles.description, { fontSize: sFont(15) }]}>{cleanDescription}</Text>

      <Text style={[styles.sectionTitle, { fontSize: sFont(18) }]}>Chapters</Text>
      {loadingChapters ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 10 }} />
      ) : chapters.length > 0 ? (
        <View style={styles.chapterList}>
          {chapters.map((ch) => (
            <Focusable 
              key={ch.id} 
              style={styles.chapterRow}
              onPress={() => handleReadChapter(ch.id)}
            >
              <View style={styles.chapterInfo}>
                <Text style={[styles.chapterNum, { fontSize: sFont(13) }]}>Chapter {ch.chapter}</Text>
                <Text style={[styles.chapterTitle, { fontSize: sFont(15) }]} numberOfLines={1}>{ch.title}</Text>
              </View>
              <Ionicons name="play-circle-outline" size={24} color={Colors.primary} />
            </Focusable>
          ))}
        </View>
      ) : (
        <Text style={[styles.emptyTxt, { fontSize: sFont(14) }]}>No chapters found in English.</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={isTV ? ['top', 'bottom', 'left', 'right'] : ['bottom']}>
      <View style={styles.responsiveWrapper}>
        {!isDesktop ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.headerHero}>
              <Image source={{ uri: manga.coverImage.extraLarge }} style={styles.heroImg} resizeMode="cover" />
              <LinearGradient colors={["transparent", "rgba(0,0,0,0.6)", "#000"]} style={styles.heroOverlay} />
              <Focusable style={styles.backBtn} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </Focusable>
              <Focusable style={styles.bookmarkBtn} onPress={toggleBookmark}>
                <Ionicons name={bookmarked ? "bookmark" : "bookmark-outline"} size={24} color={bookmarked ? Colors.primary : "#fff"} />
              </Focusable>
            </View>
            <MainInfo />
          </ScrollView>
        ) : (
          <View style={styles.desktopLayout}>
            <View style={styles.leftCol}>
              <View style={[styles.heroCard, { height: SH * 0.7 }]}>
                <Image source={{ uri: manga.coverImage.extraLarge }} style={styles.heroImg} resizeMode="cover" />
                <LinearGradient colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.8)"]} style={styles.heroOverlay} />
                <View style={styles.heroActionOverlay}>
                   <Focusable style={styles.heroActionBtn} onPress={() => router.back()}>
                     <Ionicons name="chevron-back" size={24} color="#fff" />
                   </Focusable>
                   <Focusable style={styles.heroActionBtn} onPress={toggleBookmark}>
                     <Ionicons name={bookmarked ? "bookmark" : "bookmark-outline"} size={24} color={bookmarked ? Colors.primary : "#fff"} />
                   </Focusable>
                </View>
              </View>
            </View>
            <View style={styles.rightCol}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <MainInfo />
              </ScrollView>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#000" },
  loader:       { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  responsiveWrapper: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: 1400 },
  desktopLayout: { flex: 1, flexDirection: 'row', padding: 20, gap: 20 },
  leftCol:      { flex: 1 },
  rightCol:     { flex: 1.5, backgroundColor: Colors.card, borderRadius: 24, overflow: 'hidden' },

  headerHero:   { width: '100%', height: 450, position: "relative" },
  heroCard:     { width: '100%', borderRadius: 24, overflow: 'hidden', position: 'relative' },
  heroImg:      { width: "100%", height: "100%" },
  heroOverlay:  { ...StyleSheet.absoluteFillObject },
  heroActionOverlay: { position: 'absolute', top: 20, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' },
  heroActionBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },

  backBtn:      { position: 'absolute', top: 40, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  bookmarkBtn:  { position: 'absolute', top: 40, right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  
  content:      { padding: 20 },
  title:        { color: "#fff", fontWeight: "900", marginBottom: 10 },
  metaRow:      { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  scoreBadge:   { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  scoreTxt:     { color: Colors.star, fontWeight: "700" },
  metaTxt:      { color: "rgba(255,255,255,0.5)", fontWeight: "500" },
  genreList:    { gap: 8, marginBottom: 24, height: scale(40) },
  genreBadge:   { backgroundColor: Colors.primary + "20", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: Colors.primary + "40" },
  genreTxt:     { color: Colors.primary, fontWeight: "600" },
  sectionTitle: { color: "#fff", fontWeight: "800", marginBottom: 12, marginTop: 10 },
  description:  { color: "rgba(255,255,255,0.7)", lineHeight: 24, marginBottom: 30 },
  chapterList:  { gap: 10 },
  chapterRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.cardAlt, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  chapterInfo:  { flex: 1 },
  chapterNum:   { color: Colors.primary, fontWeight: '700', marginBottom: 2 },
  chapterTitle: { color: '#fff', fontWeight: '600' },
  emptyTxt:     { color: Colors.textMuted, marginTop: 10 },
});
