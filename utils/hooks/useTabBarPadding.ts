import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Bottom padding that lets tab screen content scroll clear of the absolute tab bar. */
export function useTabBarPadding(extra = 36) {
  const insets = useSafeAreaInsets();
  return (Platform.OS === 'web' ? 70 : 66 + insets.bottom) + extra;
}

/** Top padding for screen headers so titles clear the status bar / camera cutout (edge-to-edge). */
export function useHeaderTopPadding(extra = 12) {
  const insets = useSafeAreaInsets();
  return insets.top + extra;
}
