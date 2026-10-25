import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Bottom padding that lets tab screen content scroll clear of the absolute tab bar and the floating AI button. */
export function useTabBarPadding(extra = 36) {
  const insets = useSafeAreaInsets();
  return (Platform.OS === 'web' ? 70 : 66 + insets.bottom) + extra;
}
