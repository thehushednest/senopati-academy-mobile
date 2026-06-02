import { Tabs } from "expo-router";
import type { ColorValue } from "react-native";
import { Text } from "react-native";
import { colors, weight } from "@/lib/theme";

const tabIcon = (label: string) =>
  ({ color, focused }: { color: ColorValue; focused: boolean }) => (
    <Text style={{ fontSize: 11, color: color as string, fontWeight: focused ? weight.bold : weight.medium }}>
      {label}
    </Text>
  );

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.panel,
          borderTopColor: colors.line,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        headerStyle: { backgroundColor: colors.panel },
        headerTitleStyle: { fontWeight: weight.bold, color: colors.ink },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Beranda",
          tabBarLabel: "Beranda",
          tabBarIcon: tabIcon("🏠"),
        }}
      />
      <Tabs.Screen
        name="modul"
        options={{
          title: "Modul",
          tabBarLabel: "Modul",
          tabBarIcon: tabIcon("📚"),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          tabBarLabel: "Profil",
          tabBarIcon: tabIcon("👤"),
        }}
      />
    </Tabs>
  );
}
