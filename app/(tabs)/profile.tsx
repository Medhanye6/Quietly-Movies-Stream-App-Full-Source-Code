import React from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  Platform, StatusBar as RNStatusBar, Alert, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/AuthContext";
import { clearHistory } from "@/lib/storage";
import { Colors } from "@/lib/colors";

const PT = Platform.OS === "android" ? RNStatusBar.currentHeight ?? 0 : 0;

function MenuItem({ icon, label, sublabel, onPress, danger }: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  sublabel?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Ionicons name={icon} size={19} color={danger ? Colors.error : Colors.primary} />
      </View>
      <View style={styles.menuText}>
        <Text style={[styles.menuLabel, danger && { color: Colors.error }]}>{label}</Text>
        {sublabel && <Text style={styles.menuSub}>{sublabel}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textDim} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  async function handleLogout() {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: logout },
    ]);
  }

  async function handleClearHistory() {
    Alert.alert("Clear history", "This will delete your entire watch history.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: clearHistory },
    ]);
  }

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: PT }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <Text style={styles.heading}>Profile</Text>
        </View>

        {/* Avatar + name */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>
              {user ? (user.name || user.email)[0].toUpperCase() : "?"}
            </Text>
          </View>
          {user ? (
            <>
              <Text style={styles.displayName}>{user.name || "Anonymous"}</Text>
              <Text style={styles.email}>{user.email}</Text>
              {user.isAdmin && (
                <View style={styles.adminBadge}>
                  <Ionicons name="shield-checkmark" size={12} color={Colors.primary} />
                  <Text style={styles.adminTxt}>Admin</Text>
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={styles.displayName}>Guest</Text>
              <Text style={styles.email}>Not signed in</Text>
            </>
          )}
        </View>

        {/* Auth actions */}
        <View style={styles.section}>
          {!user ? (
            <>
              <MenuItem icon="log-in-outline" label="Log In" sublabel="Sign in to your account" onPress={() => router.push("/auth/login" as any)} />
              <MenuItem icon="person-add-outline" label="Create Account" sublabel="Join KiraStreams" onPress={() => router.push("/auth/signup" as any)} />
            </>
          ) : (
            <MenuItem icon="log-out-outline" label="Log Out" danger onPress={handleLogout} />
          )}
        </View>

        {/* App actions */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DATA</Text>
          <MenuItem
            icon="time-outline"
            label="Clear Watch History"
            sublabel="Remove all watched items"
            onPress={handleClearHistory}
          />
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ABOUT</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.appName}>KiraStreams</Text>
            <Text style={styles.appTagline}>Free Streaming — Movies, TV & Anime</Text>
            <Text style={styles.version}>Version 1.0.0</Text>
            <View style={styles.disclaimer}>
              <Ionicons name="alert-circle-outline" size={13} color={Colors.textDim} />
              <Text style={styles.disclaimerTxt}>
                KiraStreams does not host any files. All content is provided by third-party hosts.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.bg },
  header:       { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 4 },
  heading:      { color: Colors.text, fontSize: 26, fontWeight: "800" },
  profileCard:  { alignItems: "center", paddingVertical: 28, gap: 6 },
  avatar:       { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", marginBottom: 4, shadowColor: Colors.primary, shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } },
  avatarTxt:    { color: "#fff", fontSize: 34, fontWeight: "800" },
  displayName:  { color: Colors.text, fontSize: 20, fontWeight: "700" },
  email:        { color: Colors.textMuted, fontSize: 14 },
  adminBadge:   { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.primary + "22", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.primary + "44" },
  adminTxt:     { color: Colors.primary, fontSize: 12, fontWeight: "700" },
  section:      { marginHorizontal: 16, marginBottom: 16 },
  sectionLabel: { color: Colors.textDim, fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 8, paddingLeft: 4 },
  menuItem:     { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  menuIcon:     { width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.primary + "1A", alignItems: "center", justifyContent: "center" },
  menuIconDanger: { backgroundColor: Colors.error + "1A" },
  menuText:     { flex: 1 },
  menuLabel:    { color: Colors.text, fontSize: 15, fontWeight: "600" },
  menuSub:      { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  aboutCard:    { backgroundColor: Colors.card, borderRadius: 14, padding: 18, borderWidth: 1, borderColor: Colors.border, alignItems: "center", gap: 4 },
  appName:      { color: Colors.primary, fontSize: 20, fontWeight: "800" },
  appTagline:   { color: Colors.textMuted, fontSize: 13 },
  version:      { color: Colors.textDim, fontSize: 12, marginTop: 4 },
  disclaimer:   { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 12, backgroundColor: Colors.cardAlt, borderRadius: 8, padding: 10 },
  disclaimerTxt:{ color: Colors.textDim, fontSize: 11, lineHeight: 16, flex: 1 },
});
