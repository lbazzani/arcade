import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';

interface ScoreItem {
  label: string;
  value: string | number;
  color?: string;
}

interface ScoreBarProps {
  items: ScoreItem[];
  accentColor?: string;
}

export const ScoreBar: React.FC<ScoreBarProps> = ({
  items,
  accentColor = '#00D4FF',
}) => {
  return (
    <View style={styles.container}>
      {items.map((item, index) => (
        <View key={index} style={styles.scoreItem}>
          <ThemedText style={styles.scoreLabel}>{item.label}:</ThemedText>
          <ThemedText
            style={[
              styles.scoreValue,
              { color: item.color || accentColor },
            ]}
          >
            {item.value}
          </ThemedText>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 8,
    backgroundColor: '#0a0a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '900',
    includeFontPadding: false,
  },
});
