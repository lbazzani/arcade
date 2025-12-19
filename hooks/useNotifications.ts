import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';

// Configura come mostrare le notifiche quando l'app è in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function useNotifications() {
  const router = useRouter();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Registra per le push notifications
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
      }
    });

    // Quando arriva una notifica (app in foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notifica ricevuta:', notification);
    });

    // Quando l'utente tocca la notifica
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;

      // Se la notifica contiene un game, naviga alla leaderboard di quel gioco
      if (data?.game) {
        router.push(`/(tabs)/leaderboard?game=${data.game}`);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [router]);

  return { expoPushToken };
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Le push notifications funzionano solo su dispositivi fisici
  if (!Device.isDevice) {
    console.log('Le push notifications funzionano solo su dispositivi fisici');
    return null;
  }

  // Controlla/richiedi permessi
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permesso per le notifiche non concesso');
    return null;
  }

  // Ottieni il push token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.log('Project ID non trovato');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    // Configura canale per Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return tokenData.data;
  } catch (error) {
    console.error('Errore nel recupero del push token:', error);
    return null;
  }
}
