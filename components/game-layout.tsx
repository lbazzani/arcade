import React, { ReactNode } from 'react';
import { StyleSheet, View, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface GameLayoutProps {
  children: ReactNode;
  score?: number;
  showScore?: boolean;
  controls?: ReactNode;
  overlay?: ReactNode;
}

export function GameLayout({ children, score = 0, showScore = true, controls, overlay }: GameLayoutProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* HEADER: Back button con safe area */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={styles.backButtonText}>✕</ThemedText>
        </TouchableOpacity>
      </View>

      {/* GIOCO: Area centrale */}
      <View style={styles.gameWrapper}>
        {children}
      </View>

      {/* SCORE */}
      {showScore && (
        <View style={styles.scoreContainer}>
          <ThemedText style={styles.scoreText}>SCORE: {score}</ThemedText>
        </View>
      )}

      {/* CONTROLLI */}
      {controls && (
        <View style={[styles.controlsWrapper, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          {controls}
        </View>
      )}

      {/* OVERLAY: Copre tutto lo schermo */}
      {overlay}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    height: 60,
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#000',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  backButtonText: {
    fontSize: 20,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  gameWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  scoreContainer: {
    height: 35,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
    letterSpacing: 2,
  },
  controlsWrapper: {
    width: '100%',
    backgroundColor: '#000',
  },
});
