import React from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  Platform, StatusBar as RNStatusBar, Alert, ScrollView,
  Dimensions
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/lib/AuthContext";
import { clearHistory, getBookmarks } from "@/lib/storage";
import { Colors } from "@/lib/colors";

const { width: SW } = Dimensions.get("window");
const PT = Platform.OS === "android" ? RNStatusBar.currentHeight ?? 0 : 0;

function MenuItem({ icon, label, sublabel, onPress, danger }: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  sublabel?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Ionicons name={icon} size={20} color={danger ? Colors.error : Colors.primary} />
      </View>
      <View style={styles.menuText}>
        <Text style={[styles.menuLabel, danger && { color: Colors.error }]}>{label}</Text>
        {sublabel && <Text style={styles.menuSub}>{sublabel}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
    </TouchableOpacity>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

import { useTranslation, LanguageCode } from "@/lib/i18n";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const [bookmarks, setBookmarks] = React.useState<any[]>([]);

  React.useEffect(() => {
    getBookmarks().then(setBookmarks);
  }, []);

  async function toggleLanguage() {
    const langs: LanguageCode[] = ['en', 'es', 'ar'];
    const nextIdx = (langs.indexOf(language) + 1) % langs.length;
    setLanguage(langs[nextIdx]);
  }

  async function handleLogout() {
    Alert.alert(t('logout'), "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: t('logout'), style: "destructive", onPress: logout },
    ]);
  }

  async function handleClearHistory() {
    Alert.alert("Clear history", "This will delete your entire watch history.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: clearHistory },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.responsiveWrapper}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
          {/* Header Section */}
          <View style={styles.headerHero}>
            <LinearGradient
              colors={[Colors.primary + "44", "transparent"]}
              style={styles.headerGradient}
            />
            <View style={[styles.headerTop, { paddingTop: PT + 10 }]}>
              <Text style={styles.headerTitle}>{t('profile')}</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push("/search")}>
                  <Ionicons name="search-outline" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={[Colors.primary, Colors.accent]}
                  style={styles.avatarBorder}
                >
                  <View style={styles.avatarMain}>
                    <Text style={styles.avatarTxt}>
                      {user ? (user.name || user.email)[0].toUpperCase() : "?"}
                    </Text>
                  </View>
                </LinearGradient>
                <View style={styles.onlineBadge} />
              </View>

              <Text style={styles.userName}>{user ? (user.name || "User") : "Guest User"}</Text>
              <Text style={styles.userEmail}>{user ? user.email : "Sign in to sync your library"}</Text>
              
              {user?.isAdmin && (
                <View style={styles.adminBadge}>
                  <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
                  <Text style={styles.adminTxt}>Premium Member</Text>
                </View>
              )}
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <StatItem label="Watched" value="124" />
              <View style={styles.statDivider} />
              <StatItem label="Following" value={String(bookmarks.length)} />
              <View style={styles.statDivider} />
              <StatItem label="Time (h)" value="562" />
            </View>
          </View>

          {/* Content Sections */}
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>{t('accountSettings')}</Text>
            <View style={styles.group}>
              {!user ? (
                <>
                  <MenuItem icon="log-in-outline" label={t('signInHeader')} sublabel={t('signInDesc')} onPress={() => router.push("/auth/login" as any)} />
                  <MenuItem icon="person-add-outline" label={t('createAccount')} sublabel={t('signUpDesc')} onPress={() => router.push("/auth/signup" as any)} />
                </>
              ) : (
                <MenuItem icon="person-outline" label={t('editProfile')} onPress={() => {}} />
              )}
              <MenuItem icon="notifications-outline" label={t('notifications')} onPress={() => {}} />
            </View>

            <Text style={styles.sectionTitle}>{t('preferences')}</Text>
            <View style={styles.group}>
              <MenuItem icon="language-outline" label={t('language')} sublabel={language.toUpperCase()} onPress={toggleLanguage} />
              <MenuItem icon="color-palette-outline" label={t('appearance')} sublabel={t('darkMode')} onPress={() => {}} />
              <MenuItem icon="trash-outline" label={t('clearHistory')} onPress={handleClearHistory} danger />
            </View>

            <Text style={styles.sectionTitle}>{t('supportInfo')}</Text>
            <View style={styles.group}>
              <MenuItem icon="information-circle-outline" label={t('about')} onPress={() => router.push("/info/about" as any)} />
              <MenuItem icon="chatbubble-ellipses-outline" label={t('contact')} onPress={() => router.push("/info/contact" as any)} />
              <MenuItem icon="help-circle-outline" label={t('help')} onPress={() => {}} />
              <MenuItem icon="document-text-outline" label={t('privacy')} onPress={() => {}} />
              {user && (
                <MenuItem icon="log-out-outline" label={t('logout')} onPress={handleLogout} danger />
              )}
            </View>

            {/* App Info */}
            <View style={styles.footer}>
              <Text style={styles.appName}>Quietly Stream</Text>
              <Text style={styles.appVersion}>Version 2.1.0 • Built with Love</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#000" },
  responsiveWrapper: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 1200,
  },
  headerHero:   { paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, backgroundColor: "#0a0a0a", overflow: "hidden" },
  headerGradient: { ...StyleSheet.absoluteFillObject },
  headerTop:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24 },
  headerTitle:  { color: "#fff", fontSize: 18, fontWeight: "800" },
  settingsBtn:  { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" },
  
  profileInfo:  { alignItems: "center", marginTop: 20 },
  avatarContainer: { position: "relative", marginBottom: 16 },
  avatarBorder: { width: 100, height: 100, borderRadius: 50, padding: 3, alignItems: "center", justifyContent: "center" },
  avatarMain:   { width: "100%", height: "100%", borderRadius: 50, backgroundColor: "#000", alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: "#0a0a0a" },
  avatarTxt:    { color: "#fff", fontSize: 42, fontWeight: "900" },
  onlineBadge:  { position: "absolute", bottom: 5, right: 5, width: 20, height: 20, borderRadius: 10, backgroundColor: "#4ade80", borderWidth: 4, borderColor: "#0a0a0a" },
  
  userName:     { color: "#fff", fontSize: 24, fontWeight: "900", marginBottom: 4 },
  userEmail:    { color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: "500" },
  
  adminBadge:   { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.primary + "15", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 12, borderWidth: 1, borderColor: Colors.primary + "30" },
  adminTxt:     { color: Colors.primary, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  
  statsRow:     { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 30, paddingHorizontal: 24 },
  statBox:      { alignItems: "center", flex: 1 },
  statValue:    { color: "#fff", fontSize: 20, fontWeight: "800" },
  statLabel:    { color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "600", textTransform: "uppercase", marginTop: 2 },
  statDivider:  { width: 1, height: 24, backgroundColor: "rgba(255,255,255,0.1)" },
  
  content:      { paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle: { color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12, marginLeft: 8 },
  group:        { backgroundColor: "#0d0d0d", borderRadius: 24, padding: 8, marginBottom: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  
  menuItem:     { flexDirection: "row", alignItems: "center", padding: 12, gap: 15 },
  menuIcon:     { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.03)", alignItems: "center", justifyContent: "center" },
  menuIconDanger: { backgroundColor: Colors.error + "10" },
  menuText:     { flex: 1 },
  menuLabel:    { color: "#fff", fontSize: 15, fontWeight: "600" },
  menuSub:      { color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 },
  
  footer:       { alignItems: "center", marginTop: 20, opacity: 0.3 },
  appName:      { color: "#fff", fontSize: 14, fontWeight: "900" },
  appVersion:   { color: "rgba(255,255,255,0.8)", fontSize: 10, marginTop: 2 },
});
