import { useEffect, useRef } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform, View, StyleSheet, useWindowDimensions } from 'react-native';
import * as Notifications from 'expo-notifications';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppProvider } from '@/contexts/app-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

function NotificationHandler() {
  const router = useRouter();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Gestisce il tap sulla notifica
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;

      // Se la notifica contiene un game, naviga alla leaderboard di quel gioco
      if (data?.game) {
        router.push(`/(tabs)/leaderboard?game=${data.game}`);
      }
    });

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [router]);

  return null;
}

// Wrapper per simulare layout mobile su web (solo su desktop, non su telefoni)
function WebMobileWrapper({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  // Se lo schermo è già stretto (telefono), non usare il frame
  const isMobileWidth = width <= 500;

  if (isMobileWidth) {
    return <View style={{ flex: 1, backgroundColor: '#000' }}>{children}</View>;
  }

  // Su desktop, mostra il frame del telefono
  const frameWidth = 390;
  const frameHeight = Math.min(844, height - 40);

  return (
    <View style={webStyles.container}>
      <View style={[webStyles.phoneFrame, { width: frameWidth, height: frameHeight }]}>
        {children}
      </View>
    </View>
  );
}

const webStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneFrame: {
    backgroundColor: '#000',
    overflow: 'hidden',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <WebMobileWrapper>
        <AppProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <NotificationHandler />
            <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="games/tetris" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="games/galaxy" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="games/snake" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="games/flappy" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="games/breakout" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="games/superbaz" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="games/bazkart" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="wordgames/slidle" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="wordgames/fives" options={{ presentation: 'fullScreenModal' }} />
            </Stack>
            <StatusBar style="light" />
          </ThemeProvider>
        </AppProvider>
      </WebMobileWrapper>
    </GestureHandlerRootView>
  );
}
