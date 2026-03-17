import React, { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Image
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/AuthContext";
import { Colors } from "@/lib/colors";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
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

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Close button */}
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.logoWrap}>
            <View style={styles.loginLogoContainer}>
              <Image source={require("../../assets/logo.png")} style={styles.loginLogo} resizeMode="contain" />
            </View>
            <Text style={styles.logoTxt}>Quietly Stream</Text>
          </View>

          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subheading}>Sign in to continue streaming</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
              <Text style={styles.errorTxt}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
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
            <Text style={styles.label}>Password</Text>
            <View style={styles.pwdWrap}>
              <TextInput
                style={[styles.input, { flex: 1, borderWidth: 0, paddingRight: 0 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.textDim}
                secureTextEntry={!showPwd}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPwd((p) => !p)}>
                <Ionicons name={showPwd ? "eye-off-outline" : "eye-outline"} size={19} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitTxt}>Log In</Text>}
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Text style={styles.switchTxt}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.replace("/auth/signup" as any)}>
              <Text style={styles.switchLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.bg },
  scroll:     { flexGrow: 1, padding: 24, paddingTop: 16 },
  closeBtn:   { alignSelf: "flex-end", padding: 6, marginBottom: 8 },
  logoWrap:   { alignItems: "center", marginBottom: 28 },
  loginLogoContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  loginLogo:  { width: 60, height: 60 },
  logoTxt:    { fontSize: 28, fontWeight: "900", color: Colors.primary, letterSpacing: -0.5 },
  heading:    { color: Colors.text, fontSize: 26, fontWeight: "800", marginBottom: 6 },
  subheading: { color: Colors.textMuted, fontSize: 15, marginBottom: 24 },
  errorBox:   { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.error + "18", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.error + "40", marginBottom: 16 },
  errorTxt:   { color: Colors.error, fontSize: 13, flex: 1 },
  field:      { marginBottom: 16 },
  label:      { color: Colors.textMuted, fontSize: 13, fontWeight: "600", marginBottom: 6 },
  input:      { backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, color: Colors.text, fontSize: 15, borderWidth: 1, borderColor: Colors.border },
  pwdWrap:    { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14 },
  eyeBtn:     { padding: 8 },
  submitBtn:  { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 8, shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  submitTxt:  { color: "#fff", fontSize: 16, fontWeight: "700" },
  switchRow:  { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  switchTxt:  { color: Colors.textMuted, fontSize: 14 },
  switchLink: { color: Colors.primary, fontSize: 14, fontWeight: "700" },
});
