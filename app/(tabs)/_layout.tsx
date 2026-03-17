import { View, Platform, StyleSheet } from "react-native";
import { Tabs, Slot } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/lib/colors";
import { useResponsive } from "@/hooks/useResponsive";
import { Sidebar } from "@/components/Sidebar";
import { SafeAreaView } from "react-native-safe-area-context";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <Ionicons
      name={name}
      size={24}
      color={focused ? Colors.primary : Colors.textMuted}
    />
  );
}

export default function TabLayout() {
  const { isPhone, isTV, isTablet } = useResponsive();

  // For TV and Tablet, we use a Sidebar + Slot approach
  if (!isPhone) {
    return (
      <SafeAreaView style={styles.container} edges={isTV ? ['top', 'bottom', 'left', 'right'] : ['left', 'right']}>
        <View style={styles.desktopLayout}>
          <Sidebar />
          <View style={styles.content}>
            <Slot />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // For Phone, we use the standard Bottom Tabs
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: 'rgba(23, 23, 31, 0.8)',
            borderTopWidth: 0,
            height: 64,
            paddingBottom: Platform.OS === "ios" ? 20 : 12,
            paddingTop: 8,
            position: "absolute",
            bottom: 20,
            left: 20,
            right: 20,
            borderRadius: 32,
            shadowColor: "#000",
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 5,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)",
          },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginBottom: Platform.OS === "ios" ? -5 : 0 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ focused }) => <TabIcon name={focused ? "home" : "home-outline"} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="football"
          options={{
            title: "Live",
            tabBarIcon: ({ focused }) => <TabIcon name={focused ? "football" : "football-outline"} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarIcon: ({ focused }) => <TabIcon name={focused ? "search" : "search-outline"} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="lists"
          options={{
            title: "My Lists",
            tabBarIcon: ({ focused }) => <TabIcon name={focused ? "bookmark" : "bookmark-outline"} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ focused }) => <TabIcon name={focused ? "person-circle" : "person-circle-outline"} focused={focused} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  }
});
