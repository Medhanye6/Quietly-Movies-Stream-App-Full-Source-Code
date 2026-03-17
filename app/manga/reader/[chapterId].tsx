import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, Image,
  Dimensions, ActivityIndicator, TouchableOpacity,
  SafeAreaView, Platform
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getChapterImages } from "@/lib/mangadex";
import { Colors } from "@/lib/colors";

const { width: SW } = Dimensions.get("window");

function MangaPage({ uri }: { uri: string }) {
  const [aspectRatio, setAspectRatio] = useState(0.7); // Default
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Image.getSize(uri, (width, height) => {
      setAspectRatio(height / width);
      setLoading(false);
    }, () => setLoading(false));
  }, [uri]);

  return (
    <View style={[styles.pageContainer, { height: SW * aspectRatio }]}>
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
        <Text style={styles.loaderTxt}>Loading pages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header - Overlay */}
      {showControls && (
        <SafeAreaView style={styles.headerOverlay}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>Reader</Text>
          </View>
        </SafeAreaView>
      )}

      <FlatList
        data={images}
        keyExtractor={(item, index) => `${chapterId}-${index}`}
        renderItem={({ item }) => <MangaPage uri={item} />}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => setShowControls(false)}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={{ color: '#fff' }}>Failed to load pages.</Text>
          </View>
        }
      />
      
      {/* Bottom Hint */}
      {!showControls && (
        <TouchableOpacity style={styles.tapSurface} onPress={toggleControls} activeOpacity={1} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: "#000" },
  loader:         { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center", gap: 12 },
  loaderTxt:      { color: Colors.textMuted, fontSize: 14 },
  headerOverlay:  { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.7)' },
  header:         { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: Platform.OS === 'android' ? 40 : 16 },
  backBtn:        { marginRight: 16 },
  headerTitle:    { color: '#fff', fontSize: 18, fontWeight: '700', flex: 1 },
  content:        { paddingBottom: 100 },
  pageContainer:  { width: SW, backgroundColor: '#000', justifyContent: 'center' },
  pageImg:        { width: '100%', height: '100%' },
  pageLoader:     { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  tapSurface:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 5 },
});
