import { BlurView } from 'expo-blur';
import { Tabs, useRouter } from 'expo-router';
import { LayoutDashboard, ListMusic, Users, Search, User } from 'lucide-react-native';
import React from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/theme';
import { OfflineBanner } from '../../components/ui/OfflineBanner';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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
            borderTopWidth: 1,
            borderTopColor: colors.tabBorder,
            elevation: 10,
            height: Platform.OS === 'web' ? 70 : 66 + insets.bottom,
            paddingBottom: Platform.OS === 'web' ? 12 : Math.max(insets.bottom, 10),
            paddingTop: 8,
            shadowColor: '#10B981',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: isDark ? 0.25 : 0.06,
            shadowRadius: 12,
          },
          tabBarLabelStyle: {
            fontFamily: 'DM Sans',
            fontSize: 10,
            fontWeight: '700',
            letterSpacing: 0.4,
            paddingBottom: 2,
          },
          headerShown: false,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => <LayoutDashboard size={21} color={color} strokeWidth={2.4} />,
          }}
        />
        <Tabs.Screen
          name="setlists"
          options={{
            title: 'Setlists',
            tabBarIcon: ({ color }) => <ListMusic size={21} color={color} strokeWidth={2.4} />,
          }}
        />
        <Tabs.Screen
          name="bands"
          options={{
            title: 'Bands',
            tabBarIcon: ({ color }) => <Users size={21} color={color} strokeWidth={2.4} />,
          }}
        />
        <Tabs.Screen
          name="discover"
          options={{
            title: 'Discover',
            tabBarIcon: ({ color }) => <Search size={21} color={color} strokeWidth={2.4} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <User size={21} color={color} strokeWidth={2.4} />,
          }}
        />
      </Tabs>

      {/* Floating AI Robot Mascot */}
      <View style={[styles.floatingContainer, { bottom: (Platform.OS === 'web' ? 78 : 74) + insets.bottom }]}>
        <TouchableOpacity 
          activeOpacity={0.85} 
          onPress={() => router.push('/ai-agent')}
          style={styles.floatingButton}
        >
          <View style={[styles.robotWrapper, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
             <Image 
               source={require('../../assets/images/ai-robot-removebg-preview.png')} 
               style={styles.robotImage}
               resizeMode="contain"
             />
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ASK AI</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  floatingContainer: {
    position: 'absolute',
    right: 16,
    zIndex: 999,
  },
  floatingButton: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  robotWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D1FAE5',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  robotImage: {
    width: 50,
    height: 50,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#10B981',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#FFF',
    zIndex: 10,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  }
});
