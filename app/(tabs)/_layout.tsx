import { Tabs } from 'expo-router';
import { CalendarDays, House, LibraryBig, Search, Users } from 'lucide-react-native';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OfflineBanner } from '../../components/ui/OfflineBanner';
import { useAppTheme } from '../../context/theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <OfflineBanner />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.tabActive,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarStyle: {
            backgroundColor: colors.tabBg,
            position: 'absolute',
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.tabBorder,
            elevation: 0,
            height: Platform.OS === 'web' ? 70 : 62 + insets.bottom,
            paddingBottom: Platform.OS === 'web' ? 12 : Math.max(insets.bottom, 8),
            paddingTop: 8,
            shadowOpacity: isDark ? 0 : 0.05,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowRadius: 8,
          },
          tabBarLabelStyle: {
            fontFamily: 'DM Sans',
            fontSize: 10.5,
            fontWeight: '700',
            letterSpacing: 0.2,
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <House size={22} color={color} strokeWidth={2.3} />,
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Library',
            tabBarIcon: ({ color }) => <LibraryBig size={22} color={color} strokeWidth={2.3} />,
          }}
        />
        <Tabs.Screen
          name="setlists"
          options={{
            title: 'Gigs',
            tabBarIcon: ({ color }) => <CalendarDays size={22} color={color} strokeWidth={2.3} />,
          }}
        />
        <Tabs.Screen
          name="bands"
          options={{
            title: 'Bands',
            tabBarIcon: ({ color }) => <Users size={22} color={color} strokeWidth={2.3} />,
          }}
        />
        <Tabs.Screen
          name="discover"
          options={{
            title: 'Discover',
            tabBarIcon: ({ color }) => <Search size={22} color={color} strokeWidth={2.3} />,
          }}
        />
        {/* Profile stays routable (avatar in the Home header) but no longer takes a tab slot */}
        <Tabs.Screen name="profile" options={{ href: null }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
