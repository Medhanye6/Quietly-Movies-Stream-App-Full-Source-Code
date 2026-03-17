import React, { useState } from "react";
import {
  View, Text, StyleSheet, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/AuthContext";
import { Colors } from "@/lib/colors";
import { useResponsive } from "@/hooks/useResponsive";
import { scale, sFont } from "@/lib/scaling";
import { Focusable } from "@/components/Focusable";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { isPhone, isTV } = useResponsive();
  
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleLogin() {
    if (!email.trim() || !password) { setError("Please fill in all fields."); return; }
    setError(""); setLoading(true);
    try {
      await login(email.trim(), password);
      router.back();
    } catch (e: any) {
      setError(e.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isDesktop = !isPhone;

  return (
    <SafeAreaView style={styles.safe} edges={isTV ? ['top', 'bottom', 'left', 'right'] : ['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.responsiveWrapper, isDesktop && styles.desktopCenter]}>
            <View style={styles.container}>
              {/* Close button */}
              <Focusable style={styles.closeBtn} onPress={() => router.back()}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </Focusable>

              <View style={styles.logoWrap}>
                <View style={[styles.loginLogoContainer, { width: scale(60), height: scale(60) }]}>
                  <Image source={require("../../assets/logo.png")} style={styles.loginLogo} resizeMode="contain" />
                </View>
                <Text style={[styles.logoTxt, { fontSize: sFont(28) }]}>Quietly Stream</Text>
              </View>

              <Text style={[styles.heading, { fontSize: sFont(26) }]}>Welcome back</Text>
              <Text style={[styles.subheading, { fontSize: sFont(15) }]}>Sign in to continue streaming</Text>

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
                  <Text style={[styles.errorTxt, { fontSize: sFont(13) }]}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.field}>
                <Text style={[styles.label, { fontSize: sFont(13) }]}>Email</Text>
                <TextInput
                  style={[styles.input, { fontSize: sFont(15) }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.textDim}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { fontSize: sFont(13) }]}>Password</Text>
                <View style={styles.pwdWrap}>
                  <TextInput
                    style={[styles.input, { flex: 1, borderWidth: 0, paddingRight: 0, fontSize: sFont(15) }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.textDim}
                    secureTextEntry={!showPwd}
                    autoCapitalize="none"
                  />
                  <Focusable style={styles.eyeBtn} onPress={() => setShowPwd((p) => !p)}>
                    <Ionicons name={showPwd ? "eye-off-outline" : "eye-outline"} size={19} color={Colors.textMuted} />
                  </Focusable>
                </View>
              </View>

              <Focusable style={styles.submitBtn} onPress={handleLogin}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.submitTxt, { fontSize: sFont(16) }]}>Log In</Text>}
              </Focusable>

              <View style={styles.switchRow}>
                <Text style={[styles.switchTxt, { fontSize: sFont(14) }]}>Don't have an account? </Text>
                <Focusable onPress={() => router.replace("/auth/signup" as any)}>
                  <Text style={[styles.switchLink, { fontSize: sFont(14) }]}>Sign up</Text>
                </Focusable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.bg },
  scroll:     { flexGrow: 1 },
  responsiveWrapper: { flex: 1, width: '100%', padding: 24 },
  desktopCenter: { alignItems: 'center', justifyContent: 'center' },
  container:  { width: '100%', maxWidth: 450 },
  closeBtn:   { alignSelf: "flex-end", padding: 8, borderRadius: 12, marginBottom: 8 },
  logoWrap:   { alignItems: "center", marginBottom: 28 },
  loginLogoContainer: { borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  loginLogo:  { width: '100%', height: '100%' },
  logoTxt:    { fontWeight: "900", color: Colors.primary, letterSpacing: -0.5 },
  heading:    { color: Colors.text, fontWeight: "800", marginBottom: 6 },
  subheading: { color: Colors.textMuted, marginBottom: 24 },
  errorBox:   { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.error + "18", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.error + "40", marginBottom: 16 },
  errorTxt:   { color: Colors.error, flex: 1 },
  field:      { marginBottom: 16 },
  label:      { color: Colors.textMuted, fontWeight: "600", marginBottom: 6 },
  input:      { backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
  pwdWrap:    { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14 },
  eyeBtn:     { padding: 8, borderRadius: 8 },
  submitBtn:  { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  submitTxt:  { color: "#fff", fontWeight: "700" },
  switchRow:  { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  switchTxt:  { color: Colors.textMuted },
  switchLink: { color: Colors.primary, fontWeight: "700" },
});
