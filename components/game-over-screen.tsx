import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { useApp } from '@/contexts/app-context';
import { GameName, ScoreEntry, submitScore, getLeaderboard } from '@/services/api';

// Game colors for theming
const GAME_COLORS: Record<GameName, string> = {
  tetris: '#4A90E2',
  snake: '#4CAF50',
  flappy: '#FFD93D',
  galaxy: '#00D4FF',
  breakout: '#FF4757',
  slidle: '#FF6B9D',
  fives: '#E85D75',
  sudoku: '#9B59B6',
};

const GAME_NAMES: Record<GameName, string> = {
  tetris: 'TETRIS',
  snake: 'SNAKE',
  flappy: 'FLAPPY BIRD',
  galaxy: 'GALAXY SHOOTER',
  breakout: 'BREAKOUT',
  slidle: 'SLIDLE',
  fives: 'FIVES',
  sudoku: 'SUDOKU',
};

interface GameOverScreenProps {
  game: GameName;
  score: number;
  isWin?: boolean;
  onPlayAgain: () => void;
  customContent?: React.ReactNode;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  game,
  score,
  isWin = false,
  onPlayAgain,
  customContent,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { playerName, setPlayerName, isServerReady } = useApp();
  const [inputName, setInputName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [playerPosition, setPlayerPosition] = useState<number | null>(null);

  const color = GAME_COLORS[game];
  const needsName = !playerName && !hasSubmitted;

  // Load leaderboard and submit score
  useEffect(() => {
    const loadAndSubmit = async () => {
      setIsLoading(true);

      // If we have a name, submit the score first
      if (playerName && !hasSubmitted && isServerReady) {
        const result = await submitScore(game, playerName, score);
        if (result) {
          setPlayerPosition(result.position);
        }
        setHasSubmitted(true);
      }

      // Load leaderboard
      if (isServerReady) {
        const scores = await getLeaderboard(game);
        setLeaderboard(scores);

        // Find player position if not already set
        if (playerName && !playerPosition) {
          const pos = scores.findIndex(
            (s) => s.name === playerName.toUpperCase() && s.score === score
          );
          if (pos !== -1) {
            setPlayerPosition(pos + 1);
          }
        }
      }

      setIsLoading(false);
    };

    loadAndSubmit();
  }, [playerName, hasSubmitted, isServerReady]);

  // Handle name submission
  const handleSaveName = async () => {
    if (inputName.trim().length > 0) {
      await setPlayerName(inputName.trim());
      setIsEditing(false);
      // Navigate to leaderboard with game and score params
      router.push(`/(tabs)/leaderboard?game=${game}&score=${score}&highlight=true`);
    }
  };

  // Handle change name
  const handleChangeName = () => {
    setInputName(playerName || '');
    setIsEditing(true);
    setHasSubmitted(false);
    setPlayerPosition(null);
  };

  // Handle go home
  const handleGoHome = () => {
    router.back();
  };

  // Render name input
  const renderNameInput = () => (
    <View style={styles.nameInputContainer}>
      <View style={[styles.nameInputBox, { borderColor: color }]}>
        <ThemedText style={styles.nameInputLabel}>ENTER YOUR NAME</ThemedText>
        <TextInput
          style={[styles.nameInput, { borderColor: color }]}
          value={inputName}
          onChangeText={(text) => setInputName(text.slice(0, 10).toUpperCase())}
          placeholder="YOUR NAME"
          placeholderTextColor="#444"
          maxLength={10}
          autoCapitalize="characters"
          autoCorrect={false}
          autoFocus
        />
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: color },
            inputName.trim().length === 0 && styles.saveButtonDisabled,
          ]}
          onPress={handleSaveName}
          disabled={inputName.trim().length === 0}
        >
          <ThemedText style={styles.saveButtonText}>SAVE & SUBMIT</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render leaderboard
  const renderLeaderboard = () => (
    <View style={[styles.leaderboardContainer, { borderColor: `${color}44` }]}>
      <View style={[styles.leaderboardHeader, { backgroundColor: `${color}22` }]}>
        <ThemedText style={[styles.leaderboardTitle, { color }]}>
          TOP 20 - {GAME_NAMES[game]}
        </ThemedText>
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color={color} size="small" />
          <ThemedText style={styles.loadingText}>Loading...</ThemedText>
        </View>
      ) : leaderboard.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.noScores}>No scores yet!</ThemedText>
          <ThemedText style={styles.noScoresSubtext}>Be the first!</ThemedText>
        </View>
      ) : (
        <ScrollView
          style={styles.scoresList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scoresListContent}
        >
          {leaderboard.slice(0, 10).map((entry, index) => {
            const isCurrentPlayer =
              playerName &&
              entry.name === playerName.toUpperCase() &&
              entry.score === score;

            return (
              <View
                key={`${entry.name}-${entry.score}-${index}`}
                style={[
                  styles.scoreRow,
                  isCurrentPlayer && { backgroundColor: `${color}33`, borderColor: color },
                ]}
              >
                <View style={[
                  styles.positionBadge,
                  index === 0 && styles.goldBadge,
                  index === 1 && styles.silverBadge,
                  index === 2 && styles.bronzeBadge,
                ]}>
                  <ThemedText style={[
                    styles.scorePosition,
                    index < 3 && styles.topPosition,
                  ]}>
                    {index + 1}
                  </ThemedText>
                </View>
                <ThemedText
                  style={[styles.scoreName, isCurrentPlayer && { color }]}
                  numberOfLines={1}
                >
                  {entry.name}
                </ThemedText>
                <ThemedText
                  style={[styles.scoreValue, isCurrentPlayer && { color }]}
                >
                  {entry.score.toLocaleString()}
                </ThemedText>
                {isCurrentPlayer && (
                  <View style={[styles.youBadge, { backgroundColor: color }]}>
                    <ThemedText style={styles.youText}>YOU</ThemedText>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={[styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Custom content (for word games with special stats) */}
          {customContent}

          {/* Title with glow effect */}
          {!customContent && (
            <ThemedText style={[
              styles.title,
              { textShadowColor: isWin ? '#2ED573' : '#FF4757' }
            ]}>
              {isWin ? 'YOU WIN!' : 'GAME OVER'}
            </ThemedText>
          )}

          {/* Score */}
          {!customContent && (
            <View style={[styles.scoreCard, { borderColor: color }]}>
              <ThemedText style={styles.scoreLabel}>YOUR SCORE</ThemedText>
              <ThemedText style={[styles.scoreNumber, { color }]}>
                {score.toLocaleString()}
              </ThemedText>
              {playerPosition && playerPosition <= 20 && (
                <ThemedText style={[styles.positionText, { color }]}>
                  #{playerPosition} IN LEADERBOARD
                </ThemedText>
              )}
              {playerName && !isEditing && (
                <ThemedText style={styles.playerInfo}>
                  Playing as: <ThemedText style={{ color }}>{playerName}</ThemedText>
                </ThemedText>
              )}
            </View>
          )}

          {/* Name input or leaderboard */}
          {needsName || isEditing ? renderNameInput() : renderLeaderboard()}

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: color }]}
              onPress={onPlayAgain}
              activeOpacity={0.8}
            >
              <ThemedText style={styles.primaryButtonText}>PLAY AGAIN</ThemedText>
            </TouchableOpacity>

            <View style={styles.secondaryButtonsRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: '#666' }]}
                onPress={handleGoHome}
                activeOpacity={0.8}
              >
                <ThemedText style={styles.secondaryButtonText}>HOME</ThemedText>
              </TouchableOpacity>

              {playerName && !isEditing && (
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: color }]}
                  onPress={handleChangeName}
                  activeOpacity={0.8}
                >
                  <ThemedText style={[styles.secondaryButtonText, { color }]}>
                    CHANGE NAME
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.97)',
    zIndex: 1000,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  // Title
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 3,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  // Score Card
  scoreCard: {
    width: '100%',
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 2,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 2,
    marginBottom: 4,
  },
  scoreNumber: {
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: 2,
    lineHeight: 60,
  },
  positionText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 6,
  },
  playerInfo: {
    marginTop: 8,
    fontSize: 11,
    color: '#666',
  },
  // Name Input
  nameInputContainer: {
    width: '100%',
    marginBottom: 12,
  },
  nameInputBox: {
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    alignItems: 'center',
  },
  nameInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    marginBottom: 10,
    letterSpacing: 1,
  },
  nameInput: {
    width: '100%',
    height: 48,
    backgroundColor: '#000',
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 3,
  },
  saveButton: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  // Leaderboard
  leaderboardContainer: {
    width: '100%',
    maxHeight: 180,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  leaderboardHeader: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  leaderboardTitle: {
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
  },
  loaderContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 6,
    fontSize: 11,
    color: '#666',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noScores: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  noScoresSubtext: {
    fontSize: 11,
    color: '#444',
    marginTop: 4,
  },
  scoresList: {
    flex: 1,
  },
  scoresListContent: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginVertical: 1,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  positionBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  goldBadge: {
    backgroundColor: '#FFD700',
  },
  silverBadge: {
    backgroundColor: '#C0C0C0',
  },
  bronzeBadge: {
    backgroundColor: '#CD7F32',
  },
  scorePosition: {
    fontSize: 10,
    fontWeight: '800',
    color: '#888',
  },
  topPosition: {
    color: '#000',
  },
  scoreName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  scoreValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
    marginRight: 6,
  },
  youBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  youText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
  },
  // Buttons
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 25,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  secondaryButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 1,
  },
});
