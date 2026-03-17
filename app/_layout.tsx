import { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, StyleSheet, Image } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { ToastProvider } from "@/lib/ToastContext";
import { I18nProvider } from "@/lib/i18n";
import { Colors } from "@/lib/colors";
import { Ionicons } from "@expo/vector-icons";

SplashScreen.preventAutoHideAsync();

function SplashLoader() {
  return (
    <View style={styles.splash}>
      <View style={styles.logoContainer}>
        <View style={styles.splashLogoContainer}>
          <Image source={require("../assets/logo.png")} style={styles.splashLogo} resizeMode="contain" />
        </View>
        <Text style={styles.splashBrand}>Quietly Stream</Text>
      </View>
      <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      <Text style={styles.loadingTxt}>Loading your library...</Text>
    </View>
  );
}

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Simulate a short delay or wait for auth/resources
        await new Promise(resolve => setTimeout(resolve, 2000));
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn(e);
      } finally {
        setAppReady(true);
      }
    })();
  }, []);

  if (!appReady) {
    return <SplashLoader />;
  }

  return (
    <AuthProvider>
      <I18nProvider>
        <ToastProvider>
          <StatusBar style="light" backgroundColor="#0f0f13" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#0f0f13" },
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="watch/[type]/[id]/index" options={{ headerShown: false, animation: "slide_from_bottom" }} />
            <Stack.Screen name="manga/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
            <Stack.Screen name="manga/reader/[chapterId]" options={{ headerShown: false, animation: "slide_from_right" }} />
            <Stack.Screen name="info/about" options={{ headerShown: false, presentation: "modal" }} />
            <Stack.Screen name="info/contact" options={{ headerShown: false, presentation: "modal" }} />
            <Stack.Screen name="auth/login" options={{ headerShown: false, presentation: "modal" }} />
            <Stack.Screen name="auth/signup" options={{ headerShown: false, presentation: "modal" }} />
          </Stack>
        </ToastProvider>
      </I18nProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
  },
  splashLogoContainer: {
    width: 100,
    height: 100,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 10,
  },
  splashLogo: {
    width: 100,
    height: 100,
  },
  splashBrand: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 10,
    letterSpacing: -1,
  },
  loadingTxt: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
    marginTop: 12,
    fontWeight: "500",
  }
});
