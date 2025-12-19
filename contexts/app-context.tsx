import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { initializeServer, registerPushToken } from '@/services/api';

const PLAYER_NAME_KEY = '@bazzani_arcade_player_name';

// Configura come mostrare le notifiche quando l'app è in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface AppContextType {
  playerName: string | null;
  setPlayerName: (name: string) => Promise<void>;
  clearPlayerName: () => Promise<void>;
  serverUrl: string | null;
  isServerReady: boolean;
  isLoading: boolean;
  expoPushToken: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [playerName, setPlayerNameState] = useState<string | null>(null);
  const [serverUrl, setServerUrlState] = useState<string | null>(null);
  const [isServerReady, setIsServerReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Load player name from storage
        const storedName = await AsyncStorage.getItem(PLAYER_NAME_KEY);
        if (storedName) {
          setPlayerNameState(storedName);
        }

        // Initialize server connection
        const url = await initializeServer();
        setServerUrlState(url);
        setIsServerReady(url !== null);

        // Register for push notifications
        const token = await registerForPushNotificationsAsync();
        if (token) {
          setExpoPushToken(token);
          // Invia il token al server
          if (url) {
            await registerPushToken(token);
          }
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    // Cleanup notification listeners
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  // Set player name and persist
  const setPlayerName = async (name: string) => {
    const trimmedName = name.trim().toUpperCase().slice(0, 10);
    if (trimmedName.length > 0) {
      await AsyncStorage.setItem(PLAYER_NAME_KEY, trimmedName);
      setPlayerNameState(trimmedName);
    }
  };

  // Clear player name
  const clearPlayerName = async () => {
    await AsyncStorage.removeItem(PLAYER_NAME_KEY);
    setPlayerNameState(null);
  };

  return (
    <AppContext.Provider
      value={{
        playerName,
        setPlayerName,
        clearPlayerName,
        serverUrl,
        isServerReady,
        isLoading,
        expoPushToken,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Funzione per registrarsi alle push notifications
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

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
