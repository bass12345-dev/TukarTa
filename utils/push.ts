import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';

// Show alerts while the app is open too.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let currentToken: string | null = null;

/** Ask for permission, get this device's Expo push token and save it for the signed-in user. */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push needs a real device and a native build (not web, not Expo Go).
  if (Platform.OS === 'web' || !Device.isDevice) return null;

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) throw new Error('Missing EAS projectId for push notifications');

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  const { error } = await supabase.rpc('register_push_token', { p_token: token, p_platform: Platform.OS });
  if (error) throw error;

  currentToken = token;
  return token;
}

/** Forget this device for the current account. Call before signing out. */
export async function unregisterPushToken(): Promise<void> {
  if (!currentToken) return;
  const token = currentToken;
  currentToken = null;
  const { error } = await supabase.rpc('remove_push_token', { p_token: token });
  if (error) throw error;
}

/** Where a tapped notification should take the user. */
export function routeForNotificationData(data: Record<string, any> | undefined): string | null {
  if (!data) return null;
  if (data.kind === 'message' && data.conversation_id) return `/chat/${data.conversation_id}`;
  if (data.kind === 'invite') return '/messages';
  return null;
}
