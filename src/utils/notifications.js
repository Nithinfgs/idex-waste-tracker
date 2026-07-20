import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export async function initNativeNotifications() {
  if (!Capacitor.isNativePlatform()) {
    console.log('Notifications: Running on Web platform.');
    return;
  }

  try {
    const localPerm = await LocalNotifications.requestPermissions();
    if (localPerm.display === 'granted') {
      console.log('✅ Android native status bar notification permissions granted');
    }
  } catch (err) {
    console.warn('Native notification permission warning:', err.message);
  }
}

export async function sendNativePushAlert(title, body, id = Math.floor(Math.random() * 100000)) {
  if (!Capacitor.isNativePlatform()) {
    console.log(`[Web Notification] ${title}: ${body}`);
    return;
  }

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title: title || 'Bloom Alert',
          body: body || 'New update in Bloom',
          schedule: { at: new Date(Date.now() + 100) },
          sound: 'default',
          attachments: null,
          actionTypeId: '',
          extra: null
        }
      ]
    });
  } catch (err) {
    console.warn('Failed to schedule native Android notification:', err.message);
  }
}
