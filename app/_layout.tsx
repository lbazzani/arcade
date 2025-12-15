import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppProvider } from '@/contexts/app-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="games/tetris" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="games/galaxy" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="games/snake" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="games/flappy" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="games/breakout" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="wordgames/slidle" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="wordgames/fives" options={{ presentation: 'fullScreenModal' }} />
          </Stack>
          <StatusBar style="light" />
        </ThemeProvider>
      </AppProvider>
    </GestureHandlerRootView>
  );
}
