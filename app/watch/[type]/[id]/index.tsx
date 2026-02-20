import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, FlatList, Dimensions,
  SafeAreaView, Platform, StatusBar as RNStatusBar, Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  getMovieDetails, getTVDetails, getTVSeason, getRecommendations,
  getImageUrl, getEmbedUrl,
  TMDBMovieDetail, TMDBTVDetail, TMDBSeason, TMDBMovie,
} from "@/lib/tmdb";
import { Colors } from "@/lib/colors";
import {
  addBookmark, removeBookmark, isBookmarked,
  addToHistory,
} from "@/lib/storage";

const { width: SW } = Dimensions.get("window");
const PLAYER_H = SW * (9 / 16);
const CARD_W   = SW * 0.29;
const CARD_H   = CARD_W * 1.5;
const PT = Platform.OS === "android" ? RNStatusBar.currentHeight ?? 0 : 0;

type PlayerKey = "kira" | "prime" | "flash" | "swift";

const PLAYERS: { key: PlayerKey; label: string }[] = [
  { key: "kira",  label: "Kira"  },
  { key: "prime", label: "Prime" },
  { key: "flash", label: "Flash" },
  { key: "swift", label: "Swift" },
];

function SmallCard({ item, onPress }: { item: TMDBMovie; onPress: () => void }) {
  return (
    <TouchableOpacity style={scStyles.card} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: getImageUrl(item.poster_path, "w185") }} style={scStyles.img} resizeMode="cover" />
      <Text style={scStyles.title} numberOfLines={2}>{item.title || item.name}</Text>
    </TouchableOpacity>
  );
}
const scStyles = StyleSheet.create({
  card:  { width: CARD_W, marginRight: 10 },
  img:   { width: CARD_W, height: CARD_H, borderRadius: 8, backgroundColor: Colors.cardAlt },
  title: { color: Colors.textMuted, fontSize: 11, marginTop: 5 },
});

export default function WatchScreen() {
  const router = useRouter();
  const { type: rawType, id } = useLocalSearchParams<{ type: string; id: string }>();

  const mediaType = rawType === "anime" ? "tv" : (rawType as "movie" | "tv");
  const mediaId   = Number(id);

  const [movieDetail, setMovieDetail] = useState<TMDBMovieDetail | null>(null);
  const [tvDetail,    setTVDetail]    = useState<TMDBTVDetail | null>(null);
  const [seasonData,  setSeasonData]  = useState<TMDBSeason | null>(null);
  const [recs,        setRecs]        = useState<TMDBMovie[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [playerLoading, setPlayerLoading] = useState(true);

  const [season,  setSeason]  = useState(1);
  const [episode, setEpisode] = useState(1);
  const [player,  setPlayer]  = useState<PlayerKey>("kira");
  const [bookmarked, setBookmarked] = useState(false);

  const title = movieDetail?.title || tvDetail?.name || "Loading…";

  // Load details
  useEffect(() => {
    (async () => {
      setLoading(true);
      setPlayerLoading(true);
      try {
        if (mediaType === "movie") {
          const [md, r] = await Promise.all([
            getMovieDetails(mediaId),
            getRecommendations("movie", mediaId),
          ]);
          setMovieDetail(md);
          setRecs(r.filter((x) => x.poster_path).slice(0, 12));
          await addToHistory({ id: mediaId, type: "movie", title: md.title, poster_path: md.poster_path });
        } else {
          const [td, r] = await Promise.all([
            getTVDetails(mediaId),
            getRecommendations("tv", mediaId),
          ]);
          setTVDetail(td);
          setRecs(r.filter((x) => x.poster_path).slice(0, 12));
          // rawType can be "tv" or "anime" — both are valid storage types
          const historyType = (rawType === "anime" ? "anime" : "tv") as "tv" | "anime";
          await addToHistory({ id: mediaId, type: historyType, title: td.name, poster_path: td.poster_path, season: 1, episode: 1 });
        }
        setBookmarked(await isBookmarked(mediaId, rawType ?? "movie"));
      } finally {
        setLoading(false);
      }
    })();
  }, [mediaId, mediaType, rawType]);

  // Load season episodes
  useEffect(() => {
    if (mediaType !== "tv") return;
    getTVSeason(mediaId, season).then(setSeasonData).catch(() => {});
  }, [mediaId, season, mediaType]);

  const embedUrl = getEmbedUrl(player, mediaType, mediaId, season, episode);

  const toggleBookmark = useCallback(async () => {
    const detail = movieDetail || tvDetail;
    if (!detail) return;
    if (bookmarked) {
      await removeBookmark(mediaId, rawType ?? "movie");
      setBookmarked(false);
    } else {
      await addBookmark({
        id: mediaId,
        type: rawType as "movie" | "tv" | "anime",
        title,
        poster_path: detail.poster_path,
      });
      setBookmarked(true);
    }
  }, [bookmarked, mediaId, rawType, title, movieDetail, tvDetail]);

  const navigateToRec = useCallback((item: TMDBMovie) => {
    const t = item.media_type ?? (item.title && !item.name ? "movie" : "tv");
    router.push(`/watch/${t}/${item.id}` as any);
  }, [router]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const detail = movieDetail || tvDetail;
  const seasons = tvDetail?.seasons?.filter((s) => s.season_number > 0) ?? [];
  const episodes = seasonData?.episodes ?? [];
  const genres = movieDetail?.genres || tvDetail?.genres || [];
  const cast = (movieDetail?.credits?.cast || tvDetail?.credits?.cast || []).slice(0, 12);
  const posterUrl = getImageUrl(detail?.poster_path ?? null, "w342");
  const backdropUrl = getImageUrl(detail?.backdrop_path ?? null, "w780");

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: PT }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Video Player ─────────────────────────────────── */}
        <View style={styles.playerWrap}>
          {playerLoading && (
            <View style={styles.playerLoader}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.playerLoadTxt}>Loading player…</Text>
            </View>
          )}
          <WebView
            key={embedUrl}
            source={{ uri: embedUrl }}
            style={[styles.player, playerLoading && { opacity: 0 }]}
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={[
              "https://www.2embed.cc",
              "https://vidlink.pro",
              "https://vidsrc.cc",
              "https://vidsrc.icu",
            ]}
            onShouldStartLoadWithRequest={(request) => {
              const allowed = [
                "2embed.cc",
                "vidlink.pro",
                "vidsrc.cc",
                "vidsrc.icu",
              ];
              try {
                const host = new URL(request.url).hostname;
                return allowed.some((h) => host === h || host.endsWith(`.${h}`));
              } catch {
                return false;
              }
            }}
            onLoadStart={() => setPlayerLoading(true)}
            onLoadEnd={()  => setPlayerLoading(false)}
            userAgent="Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
          />
        </View>

        {/* ── Back + Bookmark ───────────────────────────────── */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={Colors.text} />
            <Text style={styles.backTxt}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bookmarkBtn} onPress={toggleBookmark}>
            <Ionicons
              name={bookmarked ? "bookmark" : "bookmark-outline"}
              size={22}
              color={bookmarked ? Colors.primary : Colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* ── Player switcher ───────────────────────────────── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playerTabsRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {PLAYERS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.playerTab, player === p.key && styles.playerTabActive]}
              onPress={() => { setPlayer(p.key); setPlayerLoading(true); }}
            >
              <Text style={[styles.playerTabTxt, player === p.key && styles.playerTabTxtActive]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Title + Meta ──────────────────────────────────── */}
        <View style={styles.metaSection}>
          <View style={styles.metaTop}>
            <Image source={{ uri: posterUrl }} style={styles.poster} resizeMode="cover" />
            <View style={styles.metaInfo}>
              <Text style={styles.titleTxt} numberOfLines={3}>{title}</Text>
              {detail?.vote_average && detail.vote_average > 0 ? (
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color={Colors.star} />
                  <Text style={styles.ratingTxt}>{detail.vote_average.toFixed(1)}</Text>
                </View>
              ) : null}
              {movieDetail?.runtime ? (
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
                  <Text style={styles.infoTxt}>{movieDetail.runtime} min</Text>
                </View>
              ) : null}
              {tvDetail?.number_of_seasons ? (
                <View style={styles.infoRow}>
                  <Ionicons name="tv-outline" size={13} color={Colors.textMuted} />
                  <Text style={styles.infoTxt}>{tvDetail.number_of_seasons} season{tvDetail.number_of_seasons > 1 ? "s" : ""}</Text>
                </View>
              ) : null}
              {genres.length > 0 && (
                <View style={styles.genreRow}>
                  {genres.slice(0, 3).map((g) => (
                    <View key={g.id} style={styles.genreBadge}>
                      <Text style={styles.genreTxt}>{g.name}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
          {detail?.overview ? (
            <Text style={styles.overview}>{detail.overview}</Text>
          ) : null}
        </View>

        {/* ── Season/Episode Selector (TV only) ─────────────── */}
        {mediaType === "tv" && seasons.length > 0 && (
          <View style={styles.episodeSection}>
            <Text style={styles.sectionTitle}>Episodes</Text>

            {/* Season picker */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }} style={{ marginBottom: 12 }}>
              {seasons.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.seasonBtn, season === s.season_number && styles.seasonBtnActive]}
                  onPress={() => { setSeason(s.season_number); setEpisode(1); setPlayerLoading(true); }}
                >
                  <Text style={[styles.seasonBtnTxt, season === s.season_number && styles.seasonBtnTxtActive]}>
                    S{s.season_number}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Episode list */}
            {episodes.length > 0 ? (
              <FlatList
                horizontal
                data={episodes}
                keyExtractor={(e) => String(e.id)}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                renderItem={({ item: ep }) => (
                  <TouchableOpacity
                    style={[styles.epCard, episode === ep.episode_number && styles.epCardActive]}
                    onPress={() => { setEpisode(ep.episode_number); setPlayerLoading(true); }}
                  >
                    {ep.still_path ? (
                      <Image source={{ uri: getImageUrl(ep.still_path, "w185") }} style={styles.epThumb} resizeMode="cover" />
                    ) : (
                      <View style={[styles.epThumb, styles.epThumbFallback]}>
                        <Ionicons name="play-circle-outline" size={28} color={Colors.textDim} />
                      </View>
                    )}
                    {episode === ep.episode_number && (
                      <View style={styles.epActiveOverlay}>
                        <Ionicons name="play" size={20} color="#fff" />
                      </View>
                    )}
                    <View style={styles.epMeta}>
                      <Text style={styles.epNum}>E{ep.episode_number}</Text>
                      <Text style={styles.epName} numberOfLines={2}>{ep.name}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <ActivityIndicator color={Colors.primary} style={{ marginLeft: 16 }} />
            )}
          </View>
        )}

        {/* ── Cast ─────────────────────────────────────────── */}
        {cast.length > 0 && (
          <View style={styles.castSection}>
            <Text style={styles.sectionTitle}>Cast</Text>
            <FlatList
              horizontal
              data={cast}
              keyExtractor={(c) => String(c.id)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              renderItem={({ item: actor }) => (
                <View style={styles.castCard}>
                  {actor.profile_path ? (
                    <Image source={{ uri: getImageUrl(actor.profile_path, "w185") }} style={styles.castImg} resizeMode="cover" />
                  ) : (
                    <View style={[styles.castImg, styles.castImgFallback]}>
                      <Ionicons name="person" size={22} color={Colors.textDim} />
                    </View>
                  )}
                  <Text style={styles.castName} numberOfLines={2}>{actor.name}</Text>
                  <Text style={styles.castChar} numberOfLines={1}>{actor.character}</Text>
                </View>
              )}
            />
          </View>
        )}

        {/* ── Recommendations ───────────────────────────────── */}
        {recs.length > 0 && (
          <View style={styles.recsSection}>
            <Text style={styles.sectionTitle}>You May Also Like</Text>
            <FlatList
              horizontal
              data={recs}
              keyExtractor={(r) => String(r.id)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
              renderItem={({ item }) => (
                <SmallCard item={item} onPress={() => navigateToRec(item)} />
              )}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.bg },
  loader:       { flex: 1, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center" },
  // Player
  playerWrap:   { width: SW, height: PLAYER_H, backgroundColor: "#000", position: "relative" },
  player:       { width: SW, height: PLAYER_H },
  playerLoader: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "#000", gap: 10, zIndex: 10 },
  playerLoadTxt:{ color: Colors.textMuted, fontSize: 13 },
  // Action row
  actionRow:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
  backBtn:      { flexDirection: "row", alignItems: "center", gap: 4 },
  backTxt:      { color: Colors.text, fontSize: 15, fontWeight: "600" },
  bookmarkBtn:  { padding: 6 },
  // Player switcher
  playerTabsRow:{ marginBottom: 8 },
  playerTab:    { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  playerTabActive:    { backgroundColor: Colors.primary, borderColor: Colors.primary },
  playerTabTxt: { color: Colors.textMuted, fontSize: 13, fontWeight: "600" },
  playerTabTxtActive: { color: "#fff" },
  // Meta
  metaSection:  { paddingHorizontal: 16, paddingVertical: 12 },
  metaTop:      { flexDirection: "row", gap: 14 },
  poster:       { width: 90, height: 134, borderRadius: 10, backgroundColor: Colors.cardAlt },
  metaInfo:     { flex: 1, gap: 6 },
  titleTxt:     { color: Colors.text, fontSize: 20, fontWeight: "800", lineHeight: 26 },
  ratingRow:    { flexDirection: "row", alignItems: "center", gap: 5 },
  ratingTxt:    { color: Colors.text, fontSize: 14, fontWeight: "600" },
  infoRow:      { flexDirection: "row", alignItems: "center", gap: 5 },
  infoTxt:      { color: Colors.textMuted, fontSize: 13 },
  genreRow:     { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  genreBadge:   { backgroundColor: Colors.cardAlt, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Colors.border },
  genreTxt:     { color: Colors.textMuted, fontSize: 11 },
  overview:     { color: Colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 12 },
  sectionTitle: { color: Colors.text, fontSize: 17, fontWeight: "700", paddingHorizontal: 16, marginBottom: 10 },
  // Episodes
  episodeSection:{ marginTop: 8 },
  seasonBtn:    { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  seasonBtnActive:    { backgroundColor: Colors.primary, borderColor: Colors.primary },
  seasonBtnTxt: { color: Colors.textMuted, fontSize: 13, fontWeight: "700" },
  seasonBtnTxtActive: { color: "#fff" },
  epCard:       { width: 140, borderRadius: 10, overflow: "hidden", backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  epCardActive: { borderColor: Colors.primary },
  epThumb:      { width: 140, height: 80, backgroundColor: Colors.cardAlt },
  epThumbFallback: { alignItems: "center", justifyContent: "center" },
  epActiveOverlay: { ...StyleSheet.absoluteFillObject, top: 0, left: 0, right: 0, height: 80, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(139,92,246,0.45)" },
  epMeta:       { padding: 8 },
  epNum:        { color: Colors.primary, fontSize: 11, fontWeight: "700" },
  epName:       { color: Colors.text, fontSize: 11, marginTop: 2, lineHeight: 15 },
  // Cast
  castSection:  { marginTop: 16 },
  castCard:     { width: 72, alignItems: "center" },
  castImg:      { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.cardAlt },
  castImgFallback: { alignItems: "center", justifyContent: "center" },
  castName:     { color: Colors.text, fontSize: 10, fontWeight: "700", textAlign: "center", marginTop: 5 },
  castChar:     { color: Colors.textDim, fontSize: 9, textAlign: "center" },
  // Recs
  recsSection:  { marginTop: 16 },
});
