import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, SafeAreaView, Platform, StatusBar as RNStatusBar,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getBookmarks, getWatchHistory, removeBookmark, Bookmark, WatchHistoryItem } from "@/lib/storage";
import { getImageUrl } from "@/lib/tmdb";
import { Colors } from "@/lib/colors";

const PT = Platform.OS === "android" ? RNStatusBar.currentHeight ?? 0 : 0;
type Tab = "bookmarks" | "history";

function BookmarkCard({ item, onPress, onRemove }: {
  item: Bookmark; onPress: () => void; onRemove: () => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  const imgUri = getImageUrl(item.poster_path, "w185");
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8}>
      {!imgErr && imgUri ? (
        <Image source={{ uri: imgUri }} style={styles.thumb} resizeMode="cover" onError={() => setImgErr(true)} />
      ) : (
        <View style={[styles.thumb, styles.thumbFallback]}>
          <Ionicons name="film-outline" size={22} color={Colors.textDim} />
        </View>
      )}
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.typePill}>
          <Text style={styles.typeTxt}>{item.type.toUpperCase()}</Text>
        </View>
        <Text style={styles.dateTxt}>{new Date(item.addedAt).toLocaleDateString()}</Text>
      </View>
      <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
        <Ionicons name="trash-outline" size={19} color={Colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function HistoryCard({ item, onPress }: { item: WatchHistoryItem; onPress: () => void }) {
  const [imgErr, setImgErr] = useState(false);
  const imgUri = getImageUrl(item.poster_path, "w185");
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8}>
      {!imgErr && imgUri ? (
        <Image source={{ uri: imgUri }} style={styles.thumb} resizeMode="cover" onError={() => setImgErr(true)} />
      ) : (
        <View style={[styles.thumb, styles.thumbFallback]}>
          <Ionicons name="film-outline" size={22} color={Colors.textDim} />
        </View>
      )}
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.typePill}>
          <Text style={styles.typeTxt}>{item.type.toUpperCase()}</Text>
        </View>
        {item.season && item.episode && (
          <Text style={styles.epTxt}>S{item.season} E{item.episode}</Text>
        )}
        <Text style={styles.dateTxt}>{new Date(item.watchedAt).toLocaleDateString()}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textDim} />
    </TouchableOpacity>
  );
}

export default function ListsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("bookmarks");
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [history,   setHistory]   = useState<WatchHistoryItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      getBookmarks().then(setBookmarks);
      getWatchHistory().then(setHistory);
    }, []),
  );

  async function handleRemoveBookmark(item: Bookmark) {
    await removeBookmark(item.id, item.type);
    setBookmarks((prev) => prev.filter((b) => !(b.id === item.id && b.type === item.type)));
  }

  function navigateTo(id: number, type: string) {
    router.push(`/watch/${type}/${id}` as any);
  }

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: PT }]}>
      <View style={styles.header}>
        <Text style={styles.heading}>My Lists</Text>
      </View>

      {/* Tab toggle */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "bookmarks" && styles.tabBtnActive]}
          onPress={() => setTab("bookmarks")}
        >
          <Ionicons name={tab === "bookmarks" ? "bookmark" : "bookmark-outline"} size={16} color={tab === "bookmarks" ? "#fff" : Colors.textMuted} />
          <Text style={[styles.tabBtnTxt, tab === "bookmarks" && styles.tabBtnTxtActive]}>Bookmarks</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "history" && styles.tabBtnActive]}
          onPress={() => setTab("history")}
        >
          <Ionicons name="time-outline" size={16} color={tab === "history" ? "#fff" : Colors.textMuted} />
          <Text style={[styles.tabBtnTxt, tab === "history" && styles.tabBtnTxtActive]}>History</Text>
        </TouchableOpacity>
      </View>

      {tab === "bookmarks" && (
        bookmarks.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="bookmark-outline" size={54} color={Colors.textDim} />
            <Text style={styles.emptyTxt}>No bookmarks yet</Text>
            <Text style={styles.emptySubTxt}>Bookmark movies & shows to find them here</Text>
          </View>
        ) : (
          <FlatList
            data={bookmarks}
            keyExtractor={(i) => `${i.type}-${i.id}`}
            contentContainerStyle={{ padding: 16, gap: 8 }}
            renderItem={({ item }) => (
              <BookmarkCard
                item={item}
                onPress={() => navigateTo(item.id, item.type)}
                onRemove={() => handleRemoveBookmark(item)}
              />
            )}
          />
        )
      )}

      {tab === "history" && (
        history.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={54} color={Colors.textDim} />
            <Text style={styles.emptyTxt}>No watch history</Text>
            <Text style={styles.emptySubTxt}>Start watching to build your history</Text>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(i, idx) => `${i.type}-${i.id}-${idx}`}
            contentContainerStyle={{ padding: 16, gap: 8 }}
            renderItem={({ item }) => (
              <HistoryCard item={item} onPress={() => navigateTo(item.id, item.type)} />
            )}
          />
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.bg },
  header:       { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 4 },
  heading:      { color: Colors.text, fontSize: 26, fontWeight: "800" },
  tabs:         { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingVertical: 10 },
  tabBtn:       { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  tabBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabBtnTxt:    { color: Colors.textMuted, fontSize: 14, fontWeight: "600" },
  tabBtnTxtActive: { color: "#fff" },
  empty:        { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingBottom: 60 },
  emptyTxt:     { color: Colors.text, fontSize: 16, fontWeight: "700" },
  emptySubTxt:  { color: Colors.textMuted, fontSize: 13, textAlign: "center", paddingHorizontal: 40 },
  row:          { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  thumb:        { width: 54, height: 80, borderRadius: 8, backgroundColor: Colors.cardAlt },
  thumbFallback:{ alignItems: "center", justifyContent: "center" },
  rowInfo:      { flex: 1, gap: 5 },
  rowTitle:     { color: Colors.text, fontSize: 14, fontWeight: "700" },
  typePill:     { backgroundColor: Colors.primary + "28", borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2, alignSelf: "flex-start" },
  typeTxt:      { color: Colors.accent, fontSize: 10, fontWeight: "700" },
  dateTxt:      { color: Colors.textDim, fontSize: 11 },
  epTxt:        { color: Colors.textMuted, fontSize: 12 },
  removeBtn:    { padding: 6 },
});
