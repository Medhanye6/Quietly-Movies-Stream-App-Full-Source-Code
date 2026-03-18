import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList,
  Image, Platform, StatusBar as RNStatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getBookmarks, getWatchHistory, removeBookmark, Bookmark, WatchHistoryItem } from "@/lib/storage";
import { getImageUrl } from "@/lib/tmdb";
import { Colors } from "@/lib/colors";
import { useTranslation } from "@/lib/i18n";
import { useResponsive } from "@/hooks/useResponsive";
import { scale, sFont } from "@/lib/scaling";
import { Focusable } from "@/components/Focusable";

function BookmarkCard({ item, onPress, onRemove, style }: {
  item: Bookmark; onPress: () => void; onRemove: () => void; style?: any;
}) {
  const { t } = useTranslation();
  const [imgErr, setImgErr] = useState(false);
  const imgUri = getImageUrl(item.poster_path, "w185");
  return (
    <Focusable style={[styles.row, style]} onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: scale(12) }}>
        {!imgErr && imgUri ? (
          <Image source={{ uri: imgUri }} style={[styles.thumb, { width: scale(54), height: scale(80) }]} resizeMode="cover" onError={() => setImgErr(true)} />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback, { width: scale(54), height: scale(80) }]}>
            <Ionicons name="film-outline" size={22} color={Colors.textDim} />
          </View>
        )}
        <View style={styles.rowInfo}>
          <Text style={[styles.rowTitle, { fontSize: sFont(15) }]} numberOfLines={2}>{item.title}</Text>
          <View style={styles.typePill}>
            <Text style={[styles.typeTxt, { fontSize: sFont(10) }]}>
              {(item.type === "movie" ? t('movies') : item.type === "tv" ? t('tvShows') : (item.type === "anime" ? t('anime') : t('manga'))).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.dateTxt, { fontSize: sFont(12) }]}>{new Date(item.addedAt).toLocaleDateString()}</Text>
        </View>
      </View>
      <Focusable style={[styles.removeBtn, { padding: scale(8) }]} onPress={onRemove}>
        <Ionicons name="trash-outline" size={18} color={Colors.error} />
      </Focusable>
    </Focusable>
  );
}

function HistoryCard({ item, onPress, style }: { item: WatchHistoryItem; onPress: () => void; style?: any; }) {
  const { t } = useTranslation();
  const [imgErr, setImgErr] = useState(false);
  const imgUri = getImageUrl(item.poster_path, "w185");
  return (
    <Focusable style={[styles.row, style]} onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: scale(12) }}>
        {!imgErr && imgUri ? (
          <Image source={{ uri: imgUri }} style={[styles.thumb, { width: scale(54), height: scale(80) }]} resizeMode="cover" onError={() => setImgErr(true)} />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback, { width: scale(54), height: scale(80) }]}>
            <Ionicons name="film-outline" size={22} color={Colors.textDim} />
          </View>
        )}
        <View style={styles.rowInfo}>
          <Text style={[styles.rowTitle, { fontSize: sFont(15) }]} numberOfLines={2}>{item.title}</Text>
          <View style={styles.typePill}>
            <Text style={[styles.typeTxt, { fontSize: sFont(10) }]}>
              {(item.type === "movie" ? t('movies') : item.type === "tv" ? t('tvShows') : (item.type === "anime" ? t('anime') : t('manga'))).toUpperCase()}
            </Text>
          </View>
          {item.season && item.episode && (
            <Text style={[styles.epTxt, { fontSize: sFont(12) }]}>S{item.season} E{item.episode}</Text>
          )}
          <Text style={[styles.dateTxt, { fontSize: sFont(12) }]}>{new Date(item.watchedAt).toLocaleDateString()}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textDim} />
    </Focusable>
  );
}

type Tab = "bookmarks" | "history";

export default function ListsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isPhone, isTV } = useResponsive();
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

  function navigateTo(id: number | string, type: string) {
    if (type === "manga") {
      router.push(`/manga/${id}` as any);
    } else {
      router.push(`/watch/${type}/${id}` as any);
    }
  }

  const isDesktop = !isPhone;

  return (
    <SafeAreaView style={styles.safe} edges={isTV ? ['top', 'bottom', 'left', 'right'] : ['bottom']}>
      <View style={[styles.header, { paddingTop: isTV ? 20 : 8 }]}>
        <Text style={[styles.heading, { fontSize: sFont(26) }]}>{t('myList')}</Text>
      </View>

      <View style={styles.tabs}>
        <Focusable
          style={[styles.tabBtn, tab === "bookmarks" && styles.tabBtnActive]}
          onPress={() => setTab("bookmarks")}
        >
          <Ionicons name={tab === "bookmarks" ? "bookmark" : "bookmark-outline"} size={16} color={tab === "bookmarks" ? "#000" : Colors.textMuted} />
          <Text style={[styles.tabBtnTxt, tab === "bookmarks" && styles.tabBtnTxtActive, { fontSize: sFont(14) }]}>{t('bookmarks')}</Text>
        </Focusable>
        <Focusable
          style={[styles.tabBtn, tab === "history" && styles.tabBtnActive]}
          onPress={() => setTab("history")}
        >
          <Ionicons name="time-outline" size={16} color={tab === "history" ? "#000" : Colors.textMuted} />
          <Text style={[styles.tabBtnTxt, tab === "history" && styles.tabBtnTxtActive, { fontSize: sFont(14) }]}>{t('history')}</Text>
        </Focusable>
      </View>

      <View style={styles.responsiveWrapper}>
        {tab === "bookmarks" && (
          bookmarks.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="bookmark-outline" size={54} color={Colors.textDim} />
              <Text style={[styles.emptyTxt, { fontSize: sFont(16) }]}>{t('noBookmarks')}</Text>
              <Text style={[styles.emptySubTxt, { fontSize: sFont(13) }]}>{t('bookmarkSub')}</Text>
            </View>
          ) : (
            <FlatList
              data={bookmarks}
              key={isDesktop ? 'grid' : 'list'}
              numColumns={isDesktop ? 2 : 1}
              keyExtractor={(i) => `${i.type}-${i.id}`}
              contentContainerStyle={{ padding: 16, gap: 12 }}
              renderItem={({ item }) => (
                <BookmarkCard
                  item={item}
                  onPress={() => navigateTo(item.id, item.type)}
                  onRemove={() => handleRemoveBookmark(item)}
                  style={isDesktop ? { width: '48.5%', marginBottom: 0 } : null}
                />
              )}
            />
          )
        )}

        {tab === "history" && (
          history.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="time-outline" size={54} color={Colors.textDim} />
              <Text style={[styles.emptyTxt, { fontSize: sFont(16) }]}>{t('noHistory')}</Text>
              <Text style={[styles.emptySubTxt, { fontSize: sFont(13) }]}>{t('historySub')}</Text>
            </View>
          ) : (
            <FlatList
              data={history}
              key={isDesktop ? 'grid' : 'list'}
              numColumns={isDesktop ? 2 : 1}
              keyExtractor={(i, idx) => `${i.type}-${i.id}-${idx}`}
              contentContainerStyle={{ padding: 16, gap: 12 }}
              renderItem={({ item }) => (
                <HistoryCard 
                  item={item} 
                  onPress={() => navigateTo(item.id, item.type)} 
                  style={isDesktop ? { width: '48.5%', marginBottom: 0 } : null}
                />
              )}
            />
          )
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.bg },
  header:       { paddingHorizontal: 18, paddingBottom: 4 },
  heading:      { color: Colors.text, fontWeight: "800" },
  tabs:         { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingVertical: 10 },
  tabBtn:       { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  tabBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabBtnTxt:    { color: Colors.textMuted, fontWeight: "600" },
  tabBtnTxtActive: { color: "#000" },
  empty:        { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingBottom: 60 },
  emptyTxt:     { color: Colors.text, fontWeight: "700" },
  emptySubTxt:  { color: Colors.textMuted, textAlign: "center", paddingHorizontal: 40 },
  row:          { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: Colors.border },
  thumb:        { borderRadius: 8, backgroundColor: Colors.cardAlt },
  thumbFallback:{ alignItems: "center", justifyContent: "center" },
  rowInfo:      { flex: 1, gap: 5 },
  rowTitle:     { color: Colors.text, fontWeight: "700" },
  typePill:     { backgroundColor: Colors.primary + "28", borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2, alignSelf: "flex-start" },
  typeTxt:      { color: Colors.accent, fontWeight: "700" },
  dateTxt:      { color: Colors.textDim },
  epTxt:        { color: Colors.textMuted },
  removeBtn:    { padding: 6, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 8 },
  responsiveWrapper: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 1200,
  }
});
