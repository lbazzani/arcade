import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/themed-text';
import { GameHeader } from '@/components/game-header';
import { ScoreBar } from '@/components/score-bar';
import { GameOverScreen } from '@/components/game-over-screen';
import {
  GameState,
  Position,
  generatePuzzle,
  moveTile,
  isAdjacent,
  GRID_SIZE,
  EMPTY_TILE,
  getTimeForRound,
} from '@/game-logic/slidle/slidle-logic';

const TILE_GAP = 6;

function getTileSize(screenWidth: number) {
  const availableWidth = Math.min(screenWidth - 40, 340);
  return Math.floor((availableWidth - TILE_GAP * (GRID_SIZE - 1)) / GRID_SIZE);
}

const ACCENT_COLOR = '#FF6B9D'; // Pink/magenta for word games
const SUCCESS_COLOR = '#2ED573';
const BG_DARK = '#0a0a1a';
const BONUS_POINTS = 10; // Bonus for completing 4 rows before timer ends

export default function SlidleScreen() {
  const { width } = useWindowDimensions();
  const screenWidth = Platform.OS === 'web' && width > 500 ? 390 : width;
  const TILE_SIZE = getTileSize(screenWidth);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  const [showBonus, setShowBonus] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load game on mount (but don't start until help is dismissed)
  useEffect(() => {
    if (!showHelp && !gameState) {
      startNewGame();
    }
  }, [showHelp]);

  // Timer effect
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning && gameState) {
      handleRoundEnd();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeLeft, isTimerRunning, gameState]);

  const startNewGame = () => {
    const newState = generatePuzzle();
    setGameState(newState);
    setTimeLeft(getTimeForRound(1));
    setIsTimerRunning(true);
    setIsGameOver(false);
  };

  const handleRoundEnd = () => {
    if (!gameState) return;

    // Check if at least one word was found this round
    const wordsFound = gameState.rowResults.filter(r => r.isValid).length;

    if (wordsFound > 0) {
      // Continue to next round
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      advanceToNextRound(gameState, 0); // No bonus when timer runs out
    } else {
      // Game over
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setIsTimerRunning(false);
      setIsGameOver(true);
    }
  };

  // Advance to next round with optional bonus
  const advanceToNextRound = useCallback((currentState: GameState, bonus: number) => {
    const newRound = currentState.round + 1;
    const newState = generatePuzzle();
    newState.round = newRound;
    newState.totalGameScore = currentState.totalGameScore + currentState.totalScore + bonus;

    setGameState(newState);
    setTimeLeft(getTimeForRound(newRound));
    setIsTimerRunning(true);
  }, []);

  // Check if 4 rows are completed and trigger bonus
  const checkFourRowsBonus = useCallback((state: GameState) => {
    if (state.lockedRows.length === 4 && timeLeft > 0) {
      // 4 rows completed before timer ends - give bonus!
      setShowBonus(true);
      setIsTimerRunning(false);

      // Show bonus animation then advance
      setTimeout(() => {
        setShowBonus(false);
        advanceToNextRound(state, BONUS_POINTS);
      }, 1500);
    }
  }, [timeLeft, advanceToNextRound]);


  // Handle tile tap
  const handleTileTap = useCallback((pos: Position) => {
    if (!gameState || isGameOver || showBonus) return;

    if (!isAdjacent(pos, gameState.emptyPos)) {
      // Shake feedback for invalid move
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    // Valid move - haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newState = moveTile(gameState, pos);
    if (newState) {
      setGameState(newState);

      // Check for word completion
      const oldLockedCount = gameState.lockedRows.length;
      const newLockedCount = newState.lockedRows.length;

      if (newLockedCount > oldLockedCount) {
        // New word locked!
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Check for 4-row bonus
        checkFourRowsBonus(newState);
      }
    }
  }, [gameState, isGameOver, showBonus, checkFourRowsBonus]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render a single tile
  const renderTile = (letter: string, row: number, col: number) => {
    const pos: Position = { row, col };
    const isEmpty = letter === EMPTY_TILE;
    const isLocked = gameState?.lockedRows.includes(row);
    const isMovable = gameState && !isLocked && isAdjacent(pos, gameState.emptyPos);
    const rowResult = gameState?.rowResults.find(r => r.row === row);
    const isInValidWord = rowResult?.isValid || isLocked;

    if (isEmpty) {
      return (
        <View
          key={`${row}-${col}`}
          style={[
            styles.tile,
            styles.emptyTile,
            { width: TILE_SIZE, height: TILE_SIZE },
          ]}
        />
      );
    }

    return (
      <TouchableOpacity
        key={`${row}-${col}`}
        style={[
          styles.tile,
          { width: TILE_SIZE, height: TILE_SIZE },
          isMovable && styles.movableTile,
          isInValidWord && styles.validWordTile,
          isLocked && styles.lockedTile,
        ]}
        onPress={() => handleTileTap(pos)}
        activeOpacity={isMovable ? 0.7 : 1}
        disabled={isLocked}
      >
        <View style={styles.letterContainer}>
          <ThemedText
            style={[
              styles.tileLetter,
              isInValidWord && styles.validWordLetter,
              isLocked && styles.lockedLetter,
            ]}
          >
            {letter}
          </ThemedText>
        </View>
      </TouchableOpacity>
    );
  };

  // Render the grid
  const renderGrid = () => {
    if (!gameState) return null;

    return (
      <>
        {gameState.grid.map((row, rowIndex) => {
          const rowResult = gameState.rowResults.find(r => r.row === rowIndex);
          return (
            <View key={rowIndex} style={[styles.row, rowIndex === GRID_SIZE - 1 && styles.lastRow]}>
              {row.map((letter, colIndex) => renderTile(letter, rowIndex, colIndex))}
              {rowResult?.isValid && (
                <View style={styles.rowIndicator}>
                  <ThemedText style={styles.rowIndicatorText}>
                    +{rowResult.points}
                  </ThemedText>
                </View>
              )}
            </View>
          );
        })}
      </>
    );
  };

  // Render found words
  const renderFoundWords = () => {
    if (!gameState) return null;

    const lockedCount = gameState.lockedRows.length;
    const validWords = gameState.rowResults.filter(r => r.isValid);

    if (lockedCount === 0 && validWords.length === 0) {
      return (
        <View style={styles.wordsContainer}>
          <ThemedText style={styles.noWordsText}>
            Slide tiles to form words on each row
          </ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.wordsContainer}>
        <ThemedText style={styles.wordsTitle}>
          WORDS LOCKED: {lockedCount}/5
        </ThemedText>
        <View style={styles.wordsList}>
          {validWords.map((result, index) => {
            const isLocked = gameState.lockedRows.includes(result.row);
            return (
              <View key={index} style={[styles.wordChip, isLocked && styles.lockedWordChip]}>
                <ThemedText style={styles.wordText}>{result.word}</ThemedText>
                <ThemedText style={styles.wordPoints}>+{result.points}</ThemedText>
                {isLocked && <ThemedText style={styles.lockIcon}>🔒</ThemedText>}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const isTimeLow = timeLeft <= 10;

  // Render help screen
  const renderHelp = () => (
    <View style={styles.helpOverlay}>
      <View style={styles.helpContent}>
          <ThemedText style={styles.helpTitle}>SLIDLE</ThemedText>
          <ThemedText style={styles.helpSubtitle}>Slide Puzzle Word Game</ThemedText>

          <View style={styles.helpSection}>
            <ThemedText style={styles.helpSectionTitle}>HOW TO PLAY</ThemedText>
            <ThemedText style={styles.helpText}>
              Slide tiles to form valid words on each row.
            </ThemedText>
            <ThemedText style={styles.helpText}>
              Tap any tile next to the empty space to slide it.
            </ThemedText>
          </View>

          <View style={styles.helpSection}>
            <ThemedText style={styles.helpSectionTitle}>EXAMPLE</ThemedText>
            <View style={styles.exampleGrid}>
              <View style={styles.exampleRow}>
                <View style={[styles.exampleTile, styles.validTile]}>
                  <ThemedText style={styles.exampleLetter}>W</ThemedText>
                </View>
                <View style={[styles.exampleTile, styles.validTile]}>
                  <ThemedText style={styles.exampleLetter}>A</ThemedText>
                </View>
                <View style={[styles.exampleTile, styles.validTile]}>
                  <ThemedText style={styles.exampleLetter}>T</ThemedText>
                </View>
                <View style={[styles.exampleTile, styles.validTile]}>
                  <ThemedText style={styles.exampleLetter}>E</ThemedText>
                </View>
                <View style={[styles.exampleTile, styles.validTile]}>
                  <ThemedText style={styles.exampleLetter}>R</ThemedText>
                </View>
              </View>
              <ThemedText style={styles.exampleCaption}>
                "WATER" found! +3 points
              </ThemedText>
            </View>
          </View>

          <View style={styles.helpSection}>
            <ThemedText style={styles.helpSectionTitle}>SCORING</ThemedText>
            <View style={styles.scoringRow}>
              <ThemedText style={styles.scoringLabel}>5-letter word</ThemedText>
              <ThemedText style={styles.scoringValue}>+3 pts</ThemedText>
            </View>
            <View style={styles.scoringRow}>
              <ThemedText style={styles.scoringLabel}>4-letter word</ThemedText>
              <ThemedText style={styles.scoringValue}>+2 pts</ThemedText>
            </View>
          </View>

          <View style={styles.helpSection}>
            <ThemedText style={styles.helpSectionTitle}>RULES</ThemedText>
            <ThemedText style={styles.helpText}>
              • Find at least 1 word per round to advance
            </ThemedText>
            <ThemedText style={styles.helpText}>
              • Words lock in place when found
            </ThemedText>
            <ThemedText style={styles.helpText}>
              • Time decreases each round
            </ThemedText>
          </View>

          <TouchableOpacity
            style={styles.playButton}
            onPress={() => setShowHelp(false)}
          >
            <ThemedText style={styles.playButtonText}>PLAY</ThemedText>
          </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <GameHeader
        title="SLIDLE"
        subtitle={`ROUND ${gameState?.round || 1}`}
        accentColor={ACCENT_COLOR}
      />

      {/* Timer and Score */}
      <ScoreBar
        accentColor={ACCENT_COLOR}
        items={[
          { label: 'TIME', value: formatTime(timeLeft), color: isTimeLow ? '#FF4757' : ACCENT_COLOR },
          { label: 'ROUND', value: gameState?.totalScore || 0 },
          { label: 'TOTAL', value: gameState?.totalGameScore || 0 },
        ]}
      />

      {/* Grid */}
      <View style={styles.gridContainer}>
        {renderGrid()}
      </View>

      {/* Found Words or Instructions */}
      {renderFoundWords()}

      {/* Instructions or Skip Button */}
      <View style={styles.instructionsContainer}>
        {(() => {
          // Show skip button if at least 1 word found but less than 4 locked
          const validWordsCount = gameState?.rowResults.filter(r => r.isValid).length || 0;
          const canSkip = gameState && validWordsCount > 0 && gameState.lockedRows.length < 4 && !showBonus;

          if (canSkip) {
            return (
              <TouchableOpacity
                style={styles.skipButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  advanceToNextRound(gameState, 0);
                }}
              >
                <ThemedText style={styles.skipButtonText}>
                  Stuck? Skip to next puzzle →
                </ThemedText>
              </TouchableOpacity>
            );
          }

          return (
            <>
              <ThemedText style={styles.instructionsText}>
                Tap tiles next to the empty space to slide them.
              </ThemedText>
              <ThemedText style={styles.instructionsText}>
                Form valid words on each row (can have extra letters).
              </ThemedText>
              <ThemedText style={styles.instructionsText}>
                5-letter word = 3 pts | 4-letter word = 2 pts
              </ThemedText>
            </>
          );
        })()}
      </View>

      {/* Bonus Overlay */}
      {showBonus && (
        <View style={styles.bonusOverlay}>
          <View style={styles.bonusContent}>
            <ThemedText style={styles.bonusEmoji}>🎉</ThemedText>
            <ThemedText style={styles.bonusTitle}>BONUS!</ThemedText>
            <ThemedText style={styles.bonusText}>+{BONUS_POINTS} POINTS</ThemedText>
            <ThemedText style={styles.bonusSubtext}>4 rows completed!</ThemedText>
          </View>
        </View>
      )}

      {/* Game Over Screen */}
      {isGameOver && (
        <GameOverScreen
          game="slidle"
          score={(gameState?.totalGameScore || 0) + (gameState?.totalScore || 0)}
          onPlayAgain={startNewGame}
        />
      )}

      {/* Help Screen */}
      {showHelp && renderHelp()}

      {/* Help Button */}
      {!showHelp && !isGameOver && (
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => setShowHelp(true)}
        >
          <ThemedText style={styles.helpButtonText}>?</ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_DARK,
  },
  gridContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    gap: TILE_GAP,
    marginBottom: TILE_GAP,
    position: 'relative',
  },
  lastRow: {
    marginBottom: 0,
  },
  tile: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#333',
    overflow: 'hidden',
  },
  letterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTile: {
    backgroundColor: '#0a0a15',
    borderColor: '#1a1a2e',
  },
  movableTile: {
    borderColor: ACCENT_COLOR + '88',
    backgroundColor: '#1a1a3e',
  },
  validWordTile: {
    backgroundColor: SUCCESS_COLOR + '33',
    borderColor: SUCCESS_COLOR,
  },
  lockedTile: {
    backgroundColor: SUCCESS_COLOR + '44',
    borderColor: SUCCESS_COLOR,
    opacity: 0.9,
  },
  tileLetter: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    includeFontPadding: false,
    lineHeight: 30,
  },
  validWordLetter: {
    color: SUCCESS_COLOR,
  },
  lockedLetter: {
    color: '#fff',
  },
  rowIndicator: {
    position: 'absolute',
    right: -35,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  rowIndicatorText: {
    color: SUCCESS_COLOR,
    fontSize: 14,
    fontWeight: '800',
  },
  wordsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 80,
  },
  noWordsText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  wordsTitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
    textAlign: 'center',
  },
  wordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  wordChip: {
    flexDirection: 'row',
    backgroundColor: SUCCESS_COLOR + '22',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: SUCCESS_COLOR + '44',
    gap: 6,
    alignItems: 'center',
  },
  lockedWordChip: {
    backgroundColor: SUCCESS_COLOR + '44',
    borderColor: SUCCESS_COLOR,
  },
  wordText: {
    color: SUCCESS_COLOR,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  wordPoints: {
    color: SUCCESS_COLOR,
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
  },
  lockIcon: {
    fontSize: 10,
  },
  instructionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  instructionsText: {
    color: '#555',
    fontSize: 12,
    textAlign: 'center',
  },
  skipButton: {
    backgroundColor: ACCENT_COLOR + '22',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: ACCENT_COLOR + '44',
  },
  skipButtonText: {
    color: ACCENT_COLOR,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Help screen styles
  helpOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 16,
  },
  helpContent: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 14,
    maxWidth: 320,
    width: '100%',
    borderWidth: 2,
    borderColor: ACCENT_COLOR + '44',
  },
  helpTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: ACCENT_COLOR,
    textAlign: 'center',
    letterSpacing: 3,
  },
  helpSubtitle: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    marginBottom: 8,
  },
  helpSection: {
    marginBottom: 6,
  },
  helpSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: ACCENT_COLOR,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  helpText: {
    fontSize: 12,
    color: '#ccc',
    lineHeight: 16,
    marginBottom: 1,
  },
  exampleGrid: {
    alignItems: 'center',
    marginTop: 2,
  },
  exampleRow: {
    flexDirection: 'row',
    gap: 2,
  },
  exampleTile: {
    width: 28,
    height: 28,
    backgroundColor: '#1a1a2e',
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  validTile: {
    backgroundColor: SUCCESS_COLOR + '33',
    borderColor: SUCCESS_COLOR,
  },
  exampleLetter: {
    fontSize: 14,
    fontWeight: '900',
    color: SUCCESS_COLOR,
  },
  exampleCaption: {
    fontSize: 10,
    color: SUCCESS_COLOR,
    marginTop: 2,
    fontWeight: '600',
  },
  scoringRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 1,
  },
  scoringLabel: {
    fontSize: 12,
    color: '#aaa',
  },
  scoringValue: {
    fontSize: 12,
    fontWeight: '700',
    color: SUCCESS_COLOR,
  },
  playButton: {
    backgroundColor: ACCENT_COLOR,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 4,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 2,
  },
  helpButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ACCENT_COLOR + '33',
    borderWidth: 2,
    borderColor: ACCENT_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpButtonText: {
    color: ACCENT_COLOR,
    fontSize: 18,
    fontWeight: '900',
  },
  // Bonus overlay styles
  bonusOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  bonusContent: {
    alignItems: 'center',
    padding: 30,
  },
  bonusEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  bonusTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: SUCCESS_COLOR,
    letterSpacing: 4,
  },
  bonusText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFD700',
    marginTop: 10,
  },
  bonusSubtext: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
  },
});
