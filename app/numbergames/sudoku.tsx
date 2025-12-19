import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { GameHeader } from '@/components/game-header';
import { ScoreBar } from '@/components/score-bar';
import { GameOverScreen } from '@/components/game-over-screen';
import {
  GameState,
  GRID_SIZE,
  BOX_SIZE,
  MISTAKE_PENALTY,
  HINT_PENALTY,
  initializeGame,
  startNextRound,
  selectCell,
  placeNumber,
  clearCell,
  useHint,
  toggleNotesMode,
  tickTimer,
  getFinalScore,
  formatTime,
  getNumberCount,
} from '@/game-logic/sudoku/sudoku-logic';

const ACCENT_COLOR = '#9B59B6';
const BG_DARK = '#0a0a1a';
const GRID_PADDING = 16;

function getCellSize(screenWidth: number) {
  const gridWidth = Math.min(screenWidth - GRID_PADDING * 2, 360);
  return Math.floor(gridWidth / GRID_SIZE);
}

export default function SudokuScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const screenWidth = Platform.OS === 'web' && width > 500 ? 390 : width;
  const CELL_SIZE = getCellSize(screenWidth);
  const GRID_WIDTH = CELL_SIZE * GRID_SIZE;
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showHelp, setShowHelp] = useState(true);
  const [showRoundComplete, setShowRoundComplete] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start countdown timer
  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setGameState(prev => {
        if (!prev || prev.gameStatus !== 'playing') return prev;
        return tickTimer(prev);
      });
    }, 1000);
  }, []);

  // Stop timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  // Handle game status changes
  useEffect(() => {
    if (gameState) {
      if (gameState.gameStatus === 'won') {
        stopTimer();
        setShowRoundComplete(true);
      } else if (gameState.gameStatus === 'lost') {
        stopTimer();
      }
    }
  }, [gameState?.gameStatus, stopTimer]);

  // Start new game
  const handleNewGame = useCallback(() => {
    stopTimer();
    setGameState(initializeGame());
    setShowHelp(false);
    setShowRoundComplete(false);
    startTimer();
  }, [startTimer, stopTimer]);

  // Continue to next round
  const handleNextRound = useCallback(() => {
    if (!gameState) return;
    setGameState(startNextRound(gameState));
    setShowRoundComplete(false);
    startTimer();
  }, [gameState, startTimer]);

  // Handle cell press
  const handleCellPress = useCallback((row: number, col: number) => {
    if (!gameState) return;
    setGameState(selectCell(gameState, row, col));
  }, [gameState]);

  // Handle number press
  const handleNumberPress = useCallback((num: number) => {
    if (!gameState) return;
    setGameState(placeNumber(gameState, num));
  }, [gameState]);

  // Handle clear
  const handleClear = useCallback(() => {
    if (!gameState) return;
    setGameState(clearCell(gameState));
  }, [gameState]);

  // Handle hint
  const handleHint = useCallback(() => {
    if (!gameState) return;
    setGameState(useHint(gameState));
  }, [gameState]);

  // Handle notes toggle
  const handleNotesToggle = useCallback(() => {
    if (!gameState) return;
    setGameState(toggleNotesMode(gameState));
  }, [gameState]);

  // Check if time is low (less than 30 seconds)
  const isTimeLow = gameState && gameState.timeLeft <= 30;

  // Render help screen
  const renderHelp = () => (
    <View style={styles.helpOverlay}>
      <View style={styles.helpContent}>
        <ThemedText style={styles.helpTitle}>SUDOKU</ThemedText>
        <ThemedText style={styles.helpSubtitle}>Fill the grid before time runs out</ThemedText>

        <View style={styles.helpSection}>
          <ThemedText style={styles.helpSectionTitle}>HOW TO PLAY</ThemedText>
          <ThemedText style={styles.helpText}>
            Fill each row, column, and 3x3 box with numbers 1-9.
          </ThemedText>
          <ThemedText style={styles.helpText}>
            Each number can only appear once in each row, column, and box.
          </ThemedText>
        </View>

        <View style={styles.helpSection}>
          <ThemedText style={styles.helpSectionTitle}>TIME SYSTEM</ThemedText>
          <ThemedText style={styles.helpText}>Round 1: 10 minutes</ThemedText>
          <ThemedText style={styles.helpText}>Each round: -1 minute (min 2 min)</ThemedText>
          <ThemedText style={styles.helpText}>Score = remaining seconds</ThemedText>
        </View>

        <View style={styles.helpSection}>
          <ThemedText style={styles.helpSectionTitle}>PENALTIES</ThemedText>
          <ThemedText style={styles.helpText}>Mistake: -{MISTAKE_PENALTY} seconds</ThemedText>
          <ThemedText style={styles.helpText}>Hint: -{HINT_PENALTY} seconds</ThemedText>
        </View>

        <TouchableOpacity style={styles.playButton} onPress={handleNewGame}>
          <ThemedText style={styles.playButtonText}>START GAME</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render round complete overlay
  const renderRoundComplete = () => {
    if (!gameState) return null;

    return (
      <View style={styles.roundCompleteOverlay}>
        <View style={styles.roundCompleteBox}>
          <ThemedText style={styles.roundCompleteEmoji}>🎉</ThemedText>
          <ThemedText style={styles.roundCompleteTitle}>ROUND {gameState.round} COMPLETE!</ThemedText>
          <ThemedText style={styles.roundCompleteScore}>+{gameState.timeLeft} points</ThemedText>
          <ThemedText style={styles.roundCompleteTotal}>
            Total: {getFinalScore(gameState)}
          </ThemedText>
          <TouchableOpacity style={styles.nextRoundButton} onPress={handleNextRound}>
            <ThemedText style={styles.nextRoundButtonText}>NEXT ROUND</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render a cell
  const renderCell = (row: number, col: number) => {
    if (!gameState) return null;

    const cell = gameState.grid[row][col];
    const isSelected = gameState.selectedCell?.row === row && gameState.selectedCell?.col === col;
    const isHighlighted = cell.isHighlighted;
    const isBoxBorderRight = col % BOX_SIZE === BOX_SIZE - 1 && col !== GRID_SIZE - 1;
    const isBoxBorderBottom = row % BOX_SIZE === BOX_SIZE - 1 && row !== GRID_SIZE - 1;

    // Highlight same number
    const selectedValue = gameState.selectedCell
      ? gameState.grid[gameState.selectedCell.row][gameState.selectedCell.col].value
      : null;
    const isSameNumber = cell.value !== null && cell.value === selectedValue;

    return (
      <TouchableOpacity
        key={`${row}-${col}`}
        style={[
          styles.cell,
          isHighlighted && styles.cellHighlighted,
          isSelected && styles.cellSelected,
          isSameNumber && !isSelected && styles.cellSameNumber,
          cell.isError && styles.cellError,
          isBoxBorderRight && styles.cellBoxBorderRight,
          isBoxBorderBottom && styles.cellBoxBorderBottom,
        ]}
        onPress={() => handleCellPress(row, col)}
        activeOpacity={0.7}
      >
        {cell.value !== null ? (
          <ThemedText
            style={[
              styles.cellValue,
              cell.isOriginal && styles.cellValueOriginal,
              cell.isError && styles.cellValueError,
            ]}
          >
            {cell.value}
          </ThemedText>
        ) : cell.notes.size > 0 ? (
          <View style={styles.notesContainer}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <ThemedText
                key={n}
                style={[styles.noteText, !cell.notes.has(n) && styles.noteTextHidden]}
              >
                {cell.notes.has(n) ? n : ' '}
              </ThemedText>
            ))}
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  // Render number pad
  const renderNumberPad = () => {
    if (!gameState) return null;

    return (
      <View style={styles.numberPad}>
        <View style={styles.numberRow}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
            const count = getNumberCount(gameState, num);
            const isComplete = count >= 9;

            return (
              <TouchableOpacity
                key={num}
                style={[
                  styles.numberButton,
                  isComplete && styles.numberButtonComplete,
                ]}
                onPress={() => handleNumberPress(num)}
                disabled={isComplete}
              >
                <ThemedText
                  style={[
                    styles.numberButtonText,
                    isComplete && styles.numberButtonTextComplete,
                  ]}
                >
                  {num}
                </ThemedText>
                <ThemedText style={styles.numberCount}>{9 - count}</ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // Render action buttons
  const renderActions = () => {
    if (!gameState) return null;

    return (
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleClear}>
          <ThemedText style={styles.actionIcon}>✕</ThemedText>
          <ThemedText style={styles.actionText}>Clear</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, gameState.isNotesMode && styles.actionButtonActive]}
          onPress={handleNotesToggle}
        >
          <ThemedText style={styles.actionIcon}>✎</ThemedText>
          <ThemedText style={styles.actionText}>Notes</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleHint}>
          <ThemedText style={styles.actionIcon}>💡</ThemedText>
          <ThemedText style={styles.actionText}>Hint</ThemedText>
        </TouchableOpacity>
      </View>
    );
  };

  // Render game content
  const renderGame = () => {
    if (!gameState) return null;

    return (
      <>
        <ScoreBar
          items={[
            { label: 'ROUND', value: gameState.round },
            {
              label: 'TIME',
              value: formatTime(gameState.timeLeft),
              color: isTimeLow ? '#FF4757' : undefined,
            },
            { label: 'SCORE', value: gameState.totalScore },
          ]}
          accentColor={ACCENT_COLOR}
        />

        <View style={styles.gameArea}>
          {/* Grid */}
          <View style={styles.grid}>
            {Array(GRID_SIZE).fill(null).map((_, row) => (
              <View key={row} style={styles.row}>
                {Array(GRID_SIZE).fill(null).map((_, col) => renderCell(row, col))}
              </View>
            ))}
          </View>

          {/* Bottom controls */}
          <View style={styles.controlsContainer}>
            {/* Number pad */}
            {renderNumberPad()}

            {/* Actions */}
            {renderActions()}
          </View>
        </View>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <GameHeader
        title="SUDOKU"
        subtitle={gameState ? `ROUND ${gameState.round}` : undefined}
        accentColor={ACCENT_COLOR}
        showBack
        rightElement={
          <TouchableOpacity
            style={styles.helpIconButton}
            onPress={() => {
              stopTimer();
              setShowHelp(true);
            }}
          >
            <ThemedText style={styles.helpIcon}>?</ThemedText>
          </TouchableOpacity>
        }
      />

      {showHelp ? renderHelp() : renderGame()}

      {showRoundComplete && renderRoundComplete()}

      {gameState && gameState.gameStatus === 'lost' && (
        <GameOverScreen
          game="sudoku"
          score={getFinalScore(gameState)}
          isWin={false}
          onPlayAgain={() => {
            setShowHelp(true);
          }}
          customContent={
            <View style={styles.customGameOver}>
              <ThemedText style={[styles.gameOverTitle, { color: '#FF4757' }]}>
                TIME'S UP!
              </ThemedText>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statValue}>{gameState.round}</ThemedText>
                  <ThemedText style={styles.statLabel}>ROUND</ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statValue, { color: ACCENT_COLOR }]}>
                    {getFinalScore(gameState)}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>SCORE</ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statValue}>{gameState.mistakes}</ThemedText>
                  <ThemedText style={styles.statLabel}>ERRORS</ThemedText>
                </View>
              </View>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_DARK,
  },
  gameArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: GRID_PADDING,
  },
  controlsContainer: {
    alignItems: 'center',
    gap: 16,
  },
  // Grid
  grid: {
    borderWidth: 2,
    borderColor: ACCENT_COLOR,
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 0.5,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  cellHighlighted: {
    backgroundColor: '#1a1a2e',
  },
  cellSelected: {
    backgroundColor: ACCENT_COLOR + '44',
  },
  cellSameNumber: {
    backgroundColor: ACCENT_COLOR + '22',
  },
  cellError: {
    backgroundColor: '#FF475722',
  },
  cellBoxBorderRight: {
    borderRightWidth: 2,
    borderRightColor: ACCENT_COLOR,
  },
  cellBoxBorderBottom: {
    borderBottomWidth: 2,
    borderBottomColor: ACCENT_COLOR,
  },
  cellValue: {
    fontSize: CELL_SIZE * 0.5,
    fontWeight: '700',
    color: ACCENT_COLOR,
  },
  cellValueOriginal: {
    color: '#fff',
    fontWeight: '800',
  },
  cellValueError: {
    color: '#FF4757',
  },
  // Notes
  notesContainer: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 1,
  },
  noteText: {
    width: '33.33%',
    height: '33.33%',
    fontSize: CELL_SIZE * 0.2,
    color: '#666',
    textAlign: 'center',
    lineHeight: CELL_SIZE * 0.33,
  },
  noteTextHidden: {
    opacity: 0,
  },
  // Number pad
  numberPad: {},
  numberRow: {
    flexDirection: 'row',
    gap: 6,
  },
  numberButton: {
    width: 34,
    height: 48,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ACCENT_COLOR + '44',
  },
  numberButtonComplete: {
    opacity: 0.3,
    backgroundColor: '#111',
  },
  numberButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  numberButtonTextComplete: {
    color: '#444',
  },
  numberCount: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
  },
  // Actions
  actions: {
    flexDirection: 'row',
    gap: 24,
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#1a1a2e',
    minWidth: 64,
  },
  actionButtonActive: {
    backgroundColor: ACCENT_COLOR + '44',
    borderWidth: 1,
    borderColor: ACCENT_COLOR,
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
  },
  // Help screen
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
    marginBottom: 12,
  },
  helpSection: {
    marginBottom: 10,
  },
  helpSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: ACCENT_COLOR,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  helpText: {
    fontSize: 12,
    color: '#ccc',
    lineHeight: 16,
    marginBottom: 2,
  },
  playButton: {
    backgroundColor: ACCENT_COLOR,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 2,
  },
  helpIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#888',
  },
  // Round complete overlay
  roundCompleteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  roundCompleteBox: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: ACCENT_COLOR,
    minWidth: 280,
  },
  roundCompleteEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  roundCompleteTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
    marginBottom: 16,
  },
  roundCompleteScore: {
    fontSize: 32,
    fontWeight: '900',
    color: ACCENT_COLOR,
    marginBottom: 8,
  },
  roundCompleteTotal: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  nextRoundButton: {
    backgroundColor: ACCENT_COLOR,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  nextRoundButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  // Game over custom content
  customGameOver: {
    alignItems: 'center',
    marginBottom: 12,
  },
  gameOverTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 1,
    marginTop: 4,
  },
});
