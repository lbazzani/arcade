import React, { ReactNode } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameHeader } from '@/components/game-header';
import { ScoreBar } from '@/components/score-bar';

interface GameLayoutProps {
  children: ReactNode;
  title: string;
  score?: number;
  showScore?: boolean;
  accentColor?: string;
  controls?: ReactNode;
  overlay?: ReactNode;
  scoreItems?: Array<{ label: string; value: string | number; color?: string }>;
}

export function GameLayout({
  children,
  title,
  score = 0,
  showScore = true,
  accentColor = '#4A90E2',
  controls,
  overlay,
  scoreItems,
}: GameLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* HEADER */}
      <GameHeader
        title={title}
        accentColor={accentColor}
      />

      {/* SCORE */}
      {showScore && (
        <ScoreBar
          accentColor={accentColor}
          items={scoreItems || [{ label: 'SCORE', value: score }]}
        />
      )}

      {/* GIOCO: Area centrale */}
      <View style={styles.gameWrapper}>
        {children}
      </View>

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
    backgroundColor: '#0a0a1a',
  },
  gameWrapper: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 12,
  },
  controlsWrapper: {
    width: '100%',
  },
});
