import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Linking } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/lib/colors";
import { useTranslation } from "@/lib/i18n";

export default function ContactScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const handleTelegram = () => {
    Linking.openURL('https://t.me/QuietlyStreams');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('contact')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="chatbubbles-outline" size={80} color={Colors.primary} />
        </View>
        
        <Text style={styles.title}>Let's Talk!</Text>
        <Text style={styles.description}>
          Have questions, suggestions, or just want to report a bug? 
          Our Telegram community and DM are always open.
        </Text>

        <TouchableOpacity 
          style={styles.contactCard}
          onPress={handleTelegram}
        >
          <View style={styles.tgIcon}>
            <Ionicons name="paper-plane" size={24} color="#fff" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardLabel}>Telegram Username</Text>
            <Text style={styles.cardValue}>@QuietlyStreams</Text>
          </View>
          <Ionicons name="open-outline" size={20} color="rgba(255,255,255,0.3)" />
        </TouchableOpacity>

        <View style={styles.infoNote}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.textMuted} />
          <Text style={styles.noteTxt}>Response time is usually within 24 hours.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  content: { flex: 1, padding: 30, alignItems: "center", justifyContent: "center" },
  iconContainer: { marginBottom: 30 },
  title: { color: "#fff", fontSize: 32, fontWeight: "900", marginBottom: 15 },
  description: { color: "rgba(255,255,255,0.6)", fontSize: 16, textAlign: "center", lineHeight: 24, marginBottom: 40 },
  contactCard: { width: '100%', flexDirection: "row", alignItems: "center", backgroundColor: "#0d0d0d", padding: 20, borderRadius: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", gap: 15 },
  tgIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#0088cc", alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1 },
  cardLabel: { color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: "600", marginBottom: 2 },
  cardValue: { color: "#fff", fontSize: 18, fontWeight: "800" },
  infoNote: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 40, opacity: 0.6 },
  noteTxt: { color: Colors.textMuted, fontSize: 13, fontWeight: "500" },
});
