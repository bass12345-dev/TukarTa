import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Music, Search, Bell } from 'lucide-react-native';
import { useColorScheme } from 'react-native';

export default function TabLayout() {
  const isDark = true; // Forcing dark mode for the fixed dark theme

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#00D4FF',
        tabBarInactiveTintColor: 'rgba(150,175,200,0.35)',
        tabBarStyle: {
          backgroundColor: '#071420',
          borderTopColor: 'rgba(255,255,255,0.1)',
          height: 84,
          paddingTop: 12,
        },
        tabBarLabelStyle: {
          fontFamily: 'DM Sans',
          fontSize: 10,
          fontWeight: '500',
          paddingBottom: 8,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="setlists"
        options={{
          title: 'Setlists',
          tabBarIcon: ({ color }) => <Music size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color }) => <Search size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => <Bell size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
