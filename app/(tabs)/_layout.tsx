import { View, Platform } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/lib/colors";

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
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(23, 23, 31, 0.5)',
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
  );
}
