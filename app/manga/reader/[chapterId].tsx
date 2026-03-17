import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, Image,
  ActivityIndicator, Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getChapterImages } from "@/lib/mangadex";
import { Colors } from "@/lib/colors";
import { useResponsive } from "@/hooks/useResponsive";
import { scale, sFont } from "@/lib/scaling";
import { Focusable } from "@/components/Focusable";

function MangaPage({ uri, screenWidth }: { uri: string; screenWidth: number }) {
  const [aspectRatio, setAspectRatio] = useState(0.7); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Image.getSize(uri, (width, height) => {
      setAspectRatio(height / width);
      setLoading(false);
    }, () => setLoading(false));
  }, [uri]);

  return (
    <View style={[styles.pageContainer, { width: screenWidth, height: screenWidth * aspectRatio }]}>
      {loading && (
        <View style={styles.pageLoader}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      )}
      <Image
        source={{ uri }}
        style={styles.pageImg}
        resizeMode="contain"
      />
    </View>
  );
}

export default function MangaReaderScreen() {
  const { chapterId } = useLocalSearchParams();
  const router = useRouter();
  const { isPhone, isTV, width: SW } = useResponsive();
  
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const urls = await getChapterImages(String(chapterId));
        setImages(urls);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [chapterId]);

  const toggleControls = () => setShowControls(!showControls);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.loaderTxt, { fontSize: sFont(14) }]}>Loading pages...</Text>
      </View>
    );
  }

  const isDesktop = !isPhone;
  const readerWidth = isDesktop ? Math.min(SW, 1000) : SW;

  return (
    <View style={styles.container}>
      {/* Top Header - Overlay */}
      {showControls && (
        <SafeAreaView style={styles.headerOverlay} edges={isTV ? ['top', 'left', 'right'] : ['top']}>
          <View style={styles.header}>
            <Focusable style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </Focusable>
            <Text style={[styles.headerTitle, { fontSize: sFont(18) }]} numberOfLines={1}>Reader</Text>
          </View>
        </SafeAreaView>
      )}

      <View style={styles.scrollWrapper}>
        <FlatList
          data={images}
          keyExtractor={(item, index) => `${chapterId}-${index}`}
          renderItem={({ item }) => <MangaPage uri={item} screenWidth={readerWidth} />}
          contentContainerStyle={[styles.content, isDesktop && { alignItems: 'center' }]}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={() => setShowControls(false)}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: '#fff', fontSize: sFont(14) }}>Failed to load pages.</Text>
            </View>
          }
        />
      </View>
      
      {/* Tap Surface to Toggle Controls */}
      {!showControls && (
        <Focusable style={styles.tapSurface} onPress={toggleControls}>
          <View style={{ flex: 1 }} />
        </Focusable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: "#000" },
  loader:         { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center", gap: 12 },
  loaderTxt:      { color: Colors.textMuted },
  headerOverlay:  { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.8)' },
  header:         { flexDirection: 'row', alignItems: 'center', padding: 16 },
  backBtn:        { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  headerTitle:    { color: '#fff', fontWeight: '700', flex: 1, marginLeft: 16 },
  scrollWrapper:  { flex: 1, alignItems: 'center' },
  content:        { paddingBottom: 100 },
  pageContainer:  { backgroundColor: '#000', justifyContent: 'center' },
  pageImg:        { width: '100%', height: '100%' },
  pageLoader:     { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  tapSurface:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 5 },
});
