import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../context/auth';
import { registerForPushNotifications, routeForNotificationData } from '../utils/push';

/** Registers this device for push while someone is signed in, and opens the right screen on tap. */
export function PushSetup() {
  const { user } = useAuth();
  const router = useRouter();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    registerForPushNotifications().catch((err) => console.warn('Push registration failed:', err));
  }, [userId]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const path = routeForNotificationData(response.notification.request.content.data);
      if (path) router.push(path as any);
    });
    return () => subscription.remove();
  }, [router]);

  return null;
}
