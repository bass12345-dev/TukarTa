import { useRouter } from 'expo-router';
import { WifiOff } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useConnectivity } from '../../context/connectivity';

/** Slim strip shown while the device is offline; points to downloaded gigs. */
export const OfflineBanner: React.FC = () => {
  const { isOnline } = useConnectivity();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (isOnline) return null;

  return (
    <View style={[styles.banner, { paddingTop: insets.top + 6 }]}>
      <WifiOff size={14} color="#FEF3C7" />
      <Text style={styles.text} numberOfLines={1}>
        Offline — showing saved data
      </Text>
      <TouchableOpacity onPress={() => router.push('/offline-gigs')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.link}>Offline Gigs</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 6,
    paddingHorizontal: 16,
    backgroundColor: '#B45309',
  },
  text: { color: '#FEF3C7', fontSize: 12, fontWeight: '700', flexShrink: 1 },
  link: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', textDecorationLine: 'underline' },
});
