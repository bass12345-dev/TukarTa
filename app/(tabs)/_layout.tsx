import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Search, Star, User } from 'lucide-react-native';
import { useColorScheme } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#00D4FF',
        tabBarInactiveTintColor: isDark ? 'rgba(150,175,200,0.35)' : 'rgba(7,20,32,0.35)',
        tabBarStyle: {
          backgroundColor: isDark ? 'rgba(7,20,32,0.95)' : 'rgba(248,250,252,0.95)',
          borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
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
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
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
        name="favorites"
        options={{
          title: 'Rating',
          tabBarIcon: ({ color }) => <Star size={22} color={color} />,
        }}
        listeners={{
          tabPress: (e) => {
            // Placeholder for now
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
