import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider } from "@/lib/AuthContext";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="light" backgroundColor="#0f0f13" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0f0f13" },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="watch/[type]/[id]" options={{ headerShown: false, animation: "slide_from_bottom" }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false, presentation: "modal" }} />
        <Stack.Screen name="auth/signup" options={{ headerShown: false, presentation: "modal" }} />
      </Stack>
    </AuthProvider>
  );
}
