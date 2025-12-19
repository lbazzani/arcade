import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { useApp } from '@/contexts/app-context';
import {
  GameName,
  ScoreEntry,
  TotalScoreEntry,
  getLeaderboard,
  getTotalLeaderboard,
} from '@/services/api';
import { LEADERBOARD_TABS, GAMES, createEmptyScores } from '@/config/games';

type TabType = GameName | 'total';

// Use centralized tabs configuration
const TABS = LEADERBOARD_TABS as { key: TabType; label: string; color: string }[];

const ROW_HEIGHT = 52; // Height of each score row including margin

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { isServerReady, playerName } = useApp();
  const params = useLocalSearchParams<{ game?: string; score?: string; highlight?: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('total');

  // Extra top padding to ensure title is never clipped
  const TOP_SAFE_PADDING = Math.max(insets.top, 44) + 10;
  // Use centralized empty scores - automatically includes all games
  const [gameScores, setGameScores] = useState<Record<string, ScoreEntry[]>>(
    createEmptyScores<ScoreEntry>()
  );
  const [totalScores, setTotalScores] = useState<TotalScoreEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const highlightAnim = useRef(new Animated.Value(0)).current;

  // Handle navigation params
  useEffect(() => {
    if (params.game && params.game !== 'total') {
      setActiveTab(params.game as GameName);
    }
  }, [params.game]);

  const loadData = useCallback(async () => {
    if (!isServerReady) return;

    try {
      // Dynamically load all games from centralized config
      const gamePromises = GAMES.map(game => getLeaderboard(game.id as GameName));
      const results = await Promise.all([...gamePromises, getTotalLeaderboard()]);

      // Build scores object dynamically
      const newScores: Record<string, ScoreEntry[]> = {};
      GAMES.forEach((game, index) => {
        newScores[game.id] = results[index] as ScoreEntry[];
      });

      setGameScores(newScores);
      setTotalScores(results[results.length - 1] as TotalScoreEntry[]);
    } catch (error) {
      console.error('Error loading leaderboards:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [isServerReady]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Scroll to and highlight user's score after loading
  useEffect(() => {
    if (isLoading || !params.highlight || !playerName) return;

    const scores = activeTab === 'total' ? totalScores : gameScores[activeTab as GameName];
    const targetScore = params.score ? parseInt(params.score, 10) : null;

    // Find the user's entry with matching score
    let playerIndex = -1;
    if (activeTab === 'total') {
      playerIndex = (scores as TotalScoreEntry[]).findIndex(
        (entry) => entry.name === playerName.toUpperCase()
      );
    } else {
      playerIndex = (scores as ScoreEntry[]).findIndex(
        (entry) => entry.name === playerName.toUpperCase() &&
        (targetScore === null || entry.score === targetScore)
      );
    }

    if (playerIndex !== -1) {
      setHighlightIndex(playerIndex);

      // Scroll to the position after a short delay
      setTimeout(() => {
        const scrollPosition = Math.max(0, playerIndex * ROW_HEIGHT - 100);
        scrollViewRef.current?.scrollTo({ y: scrollPosition, animated: true });

        // Animate highlight
        Animated.sequence([
          Animated.timing(highlightAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
          Animated.delay(2000),
          Animated.timing(highlightAnim, { toValue: 0, duration: 500, useNativeDriver: false }),
        ]).start(() => {
          setHighlightIndex(null);
        });
      }, 300);
    }
  }, [isLoading, params.highlight, params.score, playerName, activeTab, gameScores, totalScores]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const activeColor = TABS.find((t) => t.key === activeTab)?.color || '#00D4FF';

  const renderTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.tabsContainer}
      contentContainerStyle={styles.tabsContent}
    >
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tab,
            activeTab === tab.key && { borderBottomColor: tab.color, borderBottomWidth: 3 },
          ]}
          onPress={() => setActiveTab(tab.key)}
        >
          <ThemedText
            style={[
              styles.tabText,
              activeTab === tab.key && { color: tab.color, fontWeight: '900' },
            ]}
          >
            {tab.label}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderGameScores = (scores: ScoreEntry[]) => {
    if (scores.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>No scores yet!</ThemedText>
          <ThemedText style={styles.emptySubtext}>Be the first to play!</ThemedText>
        </View>
      );
    }

    return scores.map((entry, index) => {
      const isCurrentPlayer = playerName && entry.name === playerName.toUpperCase();
      const isHighlighted = highlightIndex === index;

      return (
        <Animated.View
          key={`${entry.name}-${entry.score}-${index}`}
          style={[
            styles.scoreRow,
            isCurrentPlayer && { backgroundColor: `${activeColor}22` },
            isHighlighted && {
              backgroundColor: highlightAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [`${activeColor}22`, `${activeColor}66`],
              }),
              borderColor: highlightAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', activeColor],
              }),
              borderWidth: 2,
            },
          ]}
        >
          <ThemedText
            style={[
              styles.position,
              index < 3 && { color: activeColor, fontWeight: '900' },
            ]}
          >
            {index + 1}
          </ThemedText>
          <ThemedText
            style={[styles.name, isCurrentPlayer && { color: activeColor, fontWeight: '900' }]}
          >
            {entry.name}
          </ThemedText>
          <ThemedText
            style={[styles.score, isCurrentPlayer && { color: activeColor }]}
          >
            {entry.score.toLocaleString()}
          </ThemedText>
          {isCurrentPlayer && (
            <View style={[styles.youBadge, { backgroundColor: activeColor }]}>
              <ThemedText style={styles.youText}>YOU</ThemedText>
            </View>
          )}
        </Animated.View>
      );
    });
  };

  const renderTotalScores = () => {
    if (totalScores.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>No scores yet!</ThemedText>
          <ThemedText style={styles.emptySubtext}>Play games to appear here!</ThemedText>
        </View>
      );
    }

    return totalScores.map((entry, index) => {
      const isCurrentPlayer = playerName && entry.name === playerName.toUpperCase();
      const isHighlighted = highlightIndex === index;

      return (
        <Animated.View
          key={`${entry.name}-${entry.totalScore}-${index}`}
          style={[
            styles.totalScoreRow,
            isCurrentPlayer && { backgroundColor: `${activeColor}22` },
            isHighlighted && {
              backgroundColor: highlightAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [`${activeColor}22`, `${activeColor}66`],
              }),
              borderColor: highlightAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', activeColor],
              }),
              borderWidth: 2,
            },
          ]}
        >
          <View style={styles.totalScoreHeader}>
            <ThemedText
              style={[
                styles.position,
                index < 3 && { color: activeColor, fontWeight: '900' },
              ]}
            >
              {index + 1}
            </ThemedText>
            <ThemedText
              style={[styles.name, isCurrentPlayer && { color: activeColor, fontWeight: '900' }]}
            >
              {entry.name}
            </ThemedText>
            <ThemedText
              style={[styles.totalScore, isCurrentPlayer && { color: activeColor }]}
            >
              {entry.totalScore.toLocaleString()}
            </ThemedText>
            {isCurrentPlayer && (
              <View style={[styles.youBadge, { backgroundColor: activeColor }]}>
                <ThemedText style={styles.youText}>YOU</ThemedText>
              </View>
            )}
          </View>
          <View style={styles.gamesBreakdown}>
            {Object.entries(entry.games).map(([game, gameScore]) => {
              const gameTab = TABS.find((t) => t.key === game);
              return (
                <View key={game} style={styles.gameChip}>
                  <ThemedText style={[styles.gameChipText, { color: gameTab?.color }]}>
                    {gameTab?.label}: {gameScore.toLocaleString()}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        </Animated.View>
      );
    });
  };

  if (!isServerReady) {
    return (
      <View style={[styles.container, { paddingTop: TOP_SAFE_PADDING }]}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>LEADERBOARD</ThemedText>
        </View>
        <View style={styles.centerContainer}>
          <ThemedText style={styles.errorText}>Server not available</ThemedText>
          <ThemedText style={styles.errorSubtext}>
            Leaderboards require an internet connection
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: TOP_SAFE_PADDING }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>LEADERBOARD</ThemedText>
      </View>

      {renderTabs()}

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={activeColor} />
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.scoresList}
          contentContainerStyle={styles.scoresContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={activeColor}
            />
          }
        >
          {activeTab === 'total'
            ? renderTotalScores()
            : renderGameScores(gameScores[activeTab as GameName])}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    overflow: 'visible',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 3,
    textAlign: 'center',
    lineHeight: 36,
    includeFontPadding: false,
  },
  tabsContainer: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  tabsContent: {
    paddingHorizontal: 12,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#444',
    marginTop: 8,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF4757',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  scoresList: {
    flex: 1,
  },
  scoresContent: {
    padding: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#111',
    borderRadius: 8,
    marginBottom: 8,
  },
  totalScoreRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#111',
    borderRadius: 8,
    marginBottom: 12,
  },
  totalScoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  position: {
    width: 30,
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  score: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  totalScore: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFD700',
  },
  youBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  youText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
  },
  gamesBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginLeft: 30,
    gap: 8,
  },
  gameChip: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  gameChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
