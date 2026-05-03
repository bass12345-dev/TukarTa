import { BlurView } from 'expo-blur';
import { Tabs, useRouter } from 'expo-router';
import { Home, Music, Search, User, Users } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const isDark = true; // Forcing dark mode for the fixed dark theme
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#00D4FF',
          tabBarInactiveTintColor: 'rgba(150,175,200,0.35)',
          tabBarStyle: {
            backgroundColor: 'transparent',
            position: 'absolute',
            borderTopWidth: 0,
            elevation: 0,
            height: 64 + insets.bottom,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
            paddingTop: 12,
          },
          tabBarBackground: () => (
            <BlurView
              tint="dark"
              intensity={80}
              style={StyleSheet.absoluteFill}
            />
          ),
          tabBarLabelStyle: {
            fontFamily: 'DM Sans',
            fontSize: 10,
            fontWeight: '500',
            paddingBottom: 4,
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
          name="bands"
          options={{
            title: 'Bands',
            tabBarIcon: ({ color }) => <Users size={22} color={color} />,
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

      {/* Floating AI Robot Mascot */}
      <View style={[styles.floatingContainer, { bottom: 85 + insets.bottom }]}>
        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={() => router.push('/ai-agent')}
          style={styles.floatingButton}
        >
          <View style={styles.robotWrapper}>
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
  },
  floatingContainer: {
    position: 'absolute',
    right: 15,
    zIndex: 999,
  },
  floatingButton: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  robotWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(7, 20, 32, 0.6)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  robotImage: {
    width: 80,
    height: 80,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#00D4FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFF',
    zIndex: 10,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#071420',
    letterSpacing: 0.5,
  }
});
