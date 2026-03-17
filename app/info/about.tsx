import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image, Linking } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/lib/colors";
import { useTranslation } from "@/lib/i18n";

export default function AboutScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('about')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarTxt}>Q</Text>
          </View>
          <Text style={styles.name}>Medhanye Mesfn</Text>
          <Text style={styles.nickname}>"Quietly"</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.sectionTitle}>The Vision</Text>
          <Text style={styles.description}>
            Quietly Stream was created to provide a seamless, premium streaming experience for everyone.
            Medhanye (Quietly) built this app with the goal of combining speed, aesthetics, and a massive
            library of movies, series, and manga into one beautiful package.
          </Text>
          <Text style={styles.description}>
            Thank you for being part of our community and helping us grow!
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.visitBtn}
          onPress={() => Linking.openURL('https://quietlystream.pro.et')}
        >
          <Ionicons name="globe-outline" size={20} color="#000" />
          <Text style={styles.visitBtnTxt}>Visit Website</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.version}>Quietly Stream v2.1.0</Text>
          <Text style={styles.copyright}>© 2026 Quietly Digital</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  content: { padding: 25 },
  profileSection: { alignItems: "center", marginBottom: 40 },
  avatarLarge: { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", marginBottom: 15, shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15 },
  avatarTxt: { fontSize: 60, fontWeight: "900", color: "#000" },
  name: { color: "#fff", fontSize: 24, fontWeight: "900" },
  nickname: { color: Colors.primary, fontSize: 16, fontWeight: "700", marginTop: 4 },
  infoBox: { backgroundColor: "#0d0d0d", borderRadius: 24, padding: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", marginBottom: 30 },
  sectionTitle: { color: Colors.primary, fontSize: 18, fontWeight: "800", marginBottom: 15 },
  description: { color: "rgba(255,255,255,0.6)", fontSize: 15, lineHeight: 24, marginBottom: 15 },
  visitBtn: { backgroundColor: Colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", height: 56, borderRadius: 28, gap: 10 },
  visitBtnTxt: { color: "#000", fontSize: 16, fontWeight: "800" },
  footer: { alignItems: "center", marginTop: 40, opacity: 0.4 },
  version: { color: "#fff", fontSize: 13, fontWeight: "600" },
  copyright: { color: "#fff", fontSize: 11, marginTop: 4 },
});
