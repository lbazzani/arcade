import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';

interface GameHeaderProps {
  title: string;
  subtitle?: string;
  accentColor?: string;
  showBack?: boolean;
  rightAction?: {
    label: string;
    onPress: () => void;
  };
  rightElement?: React.ReactNode;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  title,
  subtitle,
  accentColor = '#00D4FF',
  showBack = true,
  rightAction,
  rightElement,
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Ensure minimum top padding for title visibility
  // Su web non serve il safe area padding
  const TOP_SAFE_PADDING = Platform.OS === 'web' ? 12 : Math.max(insets.top, 44) + 10;

  return (
    <View style={[styles.container, { paddingTop: TOP_SAFE_PADDING }]}>
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={styles.backText}>{'<'} BACK</ThemedText>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}

        <View style={styles.titleContainer}>
          <ThemedText
            style={[
              styles.title,
              { textShadowColor: accentColor },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {title}
          </ThemedText>
          {subtitle && (
            <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
          )}
        </View>

        {rightElement ? (
          <View style={styles.rightButton}>{rightElement}</View>
        ) : rightAction ? (
          <TouchableOpacity onPress={rightAction.onPress} style={styles.rightButton}>
            <ThemedText style={[styles.rightButtonText, { color: accentColor }]}>
              {rightAction.label}
            </ThemedText>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    paddingBottom: 12,
    overflow: 'visible',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    minWidth: 70,
  },
  backText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginTop: 2,
  },
  rightButton: {
    padding: 8,
    minWidth: 70,
    alignItems: 'flex-end',
  },
  rightButtonText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  placeholder: {
    minWidth: 70,
  },
});
