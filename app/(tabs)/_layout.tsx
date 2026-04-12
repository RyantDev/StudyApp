import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#7C3AED",
        tabBarInactiveTintColor: Colors[colorScheme ?? "light"].icon,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          borderTopWidth: 0.5,
          borderTopColor: "#E5E7EB",
          height: Platform.OS === "android" ? 72 : 80,
          paddingBottom: Platform.OS === "android" ? 14 : 20,
          paddingTop: 8,
          position: "absolute",
          bottom: Platform.OS === "android" ? 12 : 0,
          left: 12,
          right: 12,
          borderRadius: Platform.OS === "android" ? 20 : 0,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tareas"
        options={{
          title: "Tareas",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="check-box" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendario"
        options={{
          title: "Calendario",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="calendar-today" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="materias"
        options={{
          title: "Materias",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="menu-book" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progreso"
        options={{
          title: "Progreso",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="bar-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
