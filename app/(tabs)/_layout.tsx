import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#00D4FF',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopColor: '#222',
          borderTopWidth: 1,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Arcade',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gamecontroller.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="wordplay"
        options={{
          title: 'Wordplay',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="textformat.abc" color={color} />,
        }}
      />
      <Tabs.Screen
        name="numberplay"
        options={{
          title: 'Numberplay',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="number.square.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="trophy.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
