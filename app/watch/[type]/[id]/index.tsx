import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  Image, ActivityIndicator, FlatList,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
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
import { useTranslation } from "@/lib/i18n";
import { useResponsive } from "@/hooks/useResponsive";
import { scale, sFont } from "@/lib/scaling";
import { Focusable } from "@/components/Focusable";

type PlayerKey = "kira" | "prime" | "flash" | "swift";

const PLAYERS: { key: PlayerKey; label: string }[] = [
  { key: "kira",  label: "Kira"  },
  { key: "prime", label: "Prime" },
  { key: "flash", label: "Flash" },
  { key: "swift", label: "Swift" },
];

function SmallCard({ item, onPress }: { item: TMDBMovie; onPress: () => void }) {
  return (
    <Focusable style={scStyles.card} onPress={onPress}>
      <Image source={{ uri: getImageUrl(item.poster_path, "w185") }} style={scStyles.img} resizeMode="cover" />
      <Text style={[scStyles.title, { fontSize: sFont(11) }]} numberOfLines={2}>{item.title || item.name}</Text>
    </Focusable>
  );
}

const scStyles = StyleSheet.create({
  card:  { width: scale(100), marginRight: scale(10) },
  img:   { width: scale(100), height: scale(150), borderRadius: 8, backgroundColor: Colors.cardAlt },
  title: { color: Colors.textMuted, marginTop: 5 },
});

export default function WatchScreen() {
  const router = useRouter();
  const { type: rawType, id } = useLocalSearchParams<{ type: string; id: string }>();
  const { width: SW, height: SH, isPhone, isTV } = useResponsive();

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
  const { t } = useTranslation();

  const title = movieDetail?.title || tvDetail?.name || t('loading');

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
          const td = await getTVDetails(mediaId);
          const r = await getRecommendations("tv", mediaId);
          setTVDetail(td);
          setRecs(r.filter((x) => x.poster_path).slice(0, 12));
          const historyType = (rawType === "anime" ? "anime" : "tv") as "tv" | "anime";
          await addToHistory({ id: mediaId, type: historyType, title: td.name, poster_path: td.poster_path, season: 1, episode: 1 });
        }
        setBookmarked(await isBookmarked(mediaId, rawType ?? "movie"));
      } finally {
        setLoading(false);
      }
    })();
  }, [mediaId, mediaType, rawType]);

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
        <Text style={{ color: Colors.textMuted, marginTop: 10 }}>{t('loading')}</Text>
      </View>
    );
  }

  const detail = movieDetail || tvDetail;
  const seasons = tvDetail?.seasons?.filter((s) => s.season_number > 0) ?? [];
  const episodes = seasonData?.episodes ?? [];
  const genres = movieDetail?.genres || tvDetail?.genres || [];
  const cast = (movieDetail?.credits?.cast || tvDetail?.credits?.cast || []).slice(0, 12);
  const posterUrl = getImageUrl(detail?.poster_path ?? null, "w342");

  const isDesktop = !isPhone;
  const PLAYER_H = isPhone ? SW * (9 / 16) : SH * 0.7;

  const MainContent = () => (
    <>
      {/* ── Action Row ───────────────────────────────── */}
      <View style={styles.actionRow}>
        <Focusable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={Colors.text} />
          <Text style={[styles.backTxt, { fontSize: sFont(15) }]}>{t('back')}</Text>
        </Focusable>
        <Focusable style={styles.bookmarkBtn} onPress={toggleBookmark}>
          <Ionicons
            name={bookmarked ? "bookmark" : "bookmark-outline"}
            size={22}
            color={bookmarked ? Colors.primary : Colors.textMuted}
          />
        </Focusable>
      </View>

      {/* ── Player switcher ───────────────────────────────── */}
      <View style={{ height: scale(45), marginBottom: 10 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {PLAYERS.map((p) => (
            <Focusable
              key={p.key}
              style={[styles.playerTab, player === p.key && styles.playerTabActive]}
              onPress={() => { setPlayer(p.key); setPlayerLoading(true); }}
            >
              <Text style={[styles.playerTabTxt, { fontSize: sFont(13) }, player === p.key && styles.playerTabTxtActive]}>{p.label}</Text>
            </Focusable>
          ))}
        </ScrollView>
      </View>

      {/* ── Title + Meta ──────────────────────────────────── */}
      <View style={styles.metaSection}>
        <View style={styles.metaTop}>
          <Image source={{ uri: posterUrl }} style={[styles.poster, { width: scale(90), height: scale(134) }]} resizeMode="cover" />
          <View style={styles.metaInfo}>
            <Text style={[styles.titleTxt, { fontSize: sFont(20) }]} numberOfLines={3}>{title}</Text>
            {detail?.vote_average && detail.vote_average > 0 ? (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color={Colors.star} />
                <Text style={[styles.ratingTxt, { fontSize: sFont(14) }]}>{detail.vote_average.toFixed(1)} {t('rating')}</Text>
              </View>
            ) : null}
            {genres.length > 0 && (
              <View style={styles.genreRow}>
                {genres.slice(0, 3).map((g) => (
                  <View key={g.id} style={styles.genreBadge}>
                    <Text style={[styles.genreTxt, { fontSize: sFont(11) }]}>{g.name}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
        {detail?.overview ? (
          <Text style={[styles.overview, { fontSize: sFont(13) }]}>{detail.overview}</Text>
        ) : null}
      </View>

      {/* ── Season/Episode (TV only) ─────────────── */}
      {mediaType === "tv" && seasons.length > 0 && (
        <View style={styles.episodeSection}>
          <Text style={[styles.sectionTitle, { fontSize: sFont(17) }]}>{t('episodes')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }} style={{ marginBottom: 12 }}>
            {seasons.map((s) => (
              <Focusable
                key={s.id}
                style={[styles.seasonBtn, season === s.season_number && styles.seasonBtnActive]}
                onPress={() => { setSeason(s.season_number); setEpisode(1); setPlayerLoading(true); }}
              >
                <Text style={[styles.seasonBtnTxt, { fontSize: sFont(13) }, season === s.season_number && styles.seasonBtnTxtActive]}>
                  S{s.season_number}
                </Text>
              </Focusable>
            ))}
          </ScrollView>
          <FlatList
            horizontal
            data={episodes}
            keyExtractor={(e) => String(e.id)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            renderItem={({ item: ep }) => (
              <Focusable
                style={[styles.epCard, episode === ep.episode_number && styles.epCardActive, { width: scale(140) }]}
                onPress={() => { setEpisode(ep.episode_number); setPlayerLoading(true); }}
              >
                <View style={{ width: scale(140), height: scale(80) }}>
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
                </View>
                <View style={styles.epMeta}>
                  <Text style={[styles.epNum, { fontSize: sFont(11) }]}>E{ep.episode_number}</Text>
                  <Text style={[styles.epName, { fontSize: sFont(11) }]} numberOfLines={2}>{ep.name}</Text>
                </View>
              </Focusable>
            )}
          />
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={isTV ? ['top', 'bottom', 'left', 'right'] : ['bottom']}>
      <View style={styles.responsiveWrapper}>
        {!isDesktop ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Player */}
            <View style={[styles.playerWrap, { height: PLAYER_H }]}>
              {playerLoading && (
                <View style={styles.playerLoader}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.playerLoadTxt}>{t('loadingPlayer')}</Text>
                </View>
              )}
              <WebView
                key={embedUrl}
                source={{ uri: embedUrl }}
                style={[styles.player, { height: PLAYER_H }, playerLoading && { opacity: 0 }]}
                allowsFullscreenVideo
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                domStorageEnabled
                userAgent="Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
                onLoadStart={() => setPlayerLoading(true)}
                onLoadEnd={()  => setPlayerLoading(false)}
              />
            </View>
            <MainContent />
            {/* Cast & Similar */}
            <CastSection cast={cast} t={t} />
            <RecsSection recs={recs} t={t} navigateToRec={navigateToRec} />
          </ScrollView>
        ) : (
          <View style={styles.desktopLayout}>
            <View style={styles.leftCol}>
               <View style={[styles.playerWrap, { height: PLAYER_H, width: '100%', borderRadius: 20, overflow: 'hidden' }]}>
                {playerLoading && (
                  <View style={styles.playerLoader}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                  </View>
                )}
                <WebView
                  key={embedUrl}
                  source={{ uri: embedUrl }}
                  style={[styles.player, { height: PLAYER_H }, playerLoading && { opacity: 0 }]}
                  allowsFullscreenVideo
                  mediaPlaybackRequiresUserAction={false}
                  onLoadEnd={()  => setPlayerLoading(false)}
                />
              </View>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 20 }}>
                <CastSection cast={cast} t={t} />
                <RecsSection recs={recs} t={t} navigateToRec={navigateToRec} />
              </ScrollView>
            </View>
            <View style={styles.rightCol}>
               <ScrollView showsVerticalScrollIndicator={false}>
                 <MainContent />
               </ScrollView>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const CastSection = ({ cast, t }: any) => (
  <View style={styles.castSection}>
    <Text style={[styles.sectionTitle, { fontSize: sFont(17) }]}>{t('cast')}</Text>
    <FlatList
      horizontal
      data={cast}
      keyExtractor={(c) => String(c.id)}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      renderItem={({ item: actor }) => (
        <View style={styles.castCard}>
          {actor.profile_path ? (
            <Image source={{ uri: getImageUrl(actor.profile_path, "w185") }} style={[styles.castImg, { width: scale(60), height: scale(60) }]} resizeMode="cover" />
          ) : (
            <View style={[styles.castImg, styles.castImgFallback, { width: scale(60), height: scale(60) }]}>
              <Ionicons name="person" size={22} color={Colors.textDim} />
            </View>
          )}
          <Text style={[styles.castName, { fontSize: sFont(10) }]} numberOfLines={2}>{actor.name}</Text>
          <Text style={[styles.castChar, { fontSize: sFont(9) }]} numberOfLines={1}>{actor.character}</Text>
        </View>
      )}
    />
  </View>
);

const RecsSection = ({ recs, t, navigateToRec }: any) => (
  <View style={styles.recsSection}>
    <Text style={[styles.sectionTitle, { fontSize: sFont(17) }]}>{t('similar')}</Text>
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
);

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.bg },
  loader:       { flex: 1, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center" },
  responsiveWrapper: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: 1400 },
  desktopLayout: { flex: 1, flexDirection: 'row', padding: 20, gap: 20 },
  leftCol:      { flex: 2 },
  rightCol:     { flex: 1, backgroundColor: Colors.card, borderRadius: 20, overflow: 'hidden' },
  
  playerWrap:   { backgroundColor: "#000", position: "relative" },
  player:       { width: '100%' },
  playerLoader: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "#000", gap: 10, zIndex: 10 },
  playerLoadTxt:{ color: Colors.textMuted },
  
  actionRow:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
  backBtn:      { flexDirection: "row", alignItems: "center", gap: 4, padding: 8 },
  backTxt:      { color: Colors.text, fontWeight: "600" },
  bookmarkBtn:  { padding: 10, borderRadius: 12 },
  
  playerTab:    { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, backgroundColor: Colors.cardAlt, borderWidth: 1, borderColor: Colors.border },
  playerTabActive:    { backgroundColor: Colors.primary, borderColor: Colors.primary },
  playerTabTxt: { color: Colors.textMuted, fontWeight: "600" },
  playerTabTxtActive: { color: "#000" },
  
  metaSection:  { paddingHorizontal: 16, paddingVertical: 12 },
  metaTop:      { flexDirection: "row", gap: 14 },
  poster:       { borderRadius: 10, backgroundColor: Colors.cardAlt },
  metaInfo:     { flex: 1, gap: 6 },
  titleTxt:     { color: Colors.text, fontWeight: "800", lineHeight: 26 },
  ratingRow:    { flexDirection: "row", alignItems: "center", gap: 5 },
  ratingTxt:    { color: Colors.text, fontWeight: "600" },
  genreRow:     { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  genreBadge:   { backgroundColor: Colors.cardAlt, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Colors.border },
  genreTxt:     { color: Colors.textMuted },
  overview:     { color: Colors.textMuted, lineHeight: 20, marginTop: 12 },
  sectionTitle: { color: Colors.text, fontWeight: "700", paddingHorizontal: 16, marginBottom: 10 },
  
  episodeSection:{ marginTop: 8 },
  seasonBtn:    { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, backgroundColor: Colors.cardAlt, borderWidth: 1, borderColor: Colors.border },
  seasonBtnActive:    { backgroundColor: Colors.primary, borderColor: Colors.primary },
  seasonBtnTxt: { color: Colors.textMuted, fontWeight: "700" },
  seasonBtnTxtActive: { color: "#000" },
  epCard:       { borderRadius: 10, overflow: "hidden", backgroundColor: Colors.cardAlt, borderWidth: 1, borderColor: Colors.border },
  epCardActive: { borderColor: Colors.primary },
  epThumb:      { width: '100%', height: '100%', backgroundColor: Colors.cardAlt },
  epThumbFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  epActiveOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(209, 255, 0, 0.3)" },
  epMeta:       { padding: 8 },
  epNum:        { color: Colors.primary, fontWeight: "700" },
  epName:       { color: Colors.text, marginTop: 2, lineHeight: 15 },
  
  castSection:  { marginTop: 16 },
  castCard:     { width: scale(72), alignItems: "center" },
  castImg:      { borderRadius: 30, backgroundColor: Colors.cardAlt },
  castImgFallback: { alignItems: "center", justifyContent: "center" },
  castName:     { color: Colors.text, fontWeight: "700", textAlign: "center", marginTop: 5 },
  castChar:     { color: Colors.textDim, textAlign: "center" },
  recsSection:  { marginTop: 16, paddingBottom: 20 },
});
