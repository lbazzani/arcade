import React, { useState, useCallback, useEffect } from 'react';
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
import { GameOverScreen } from '@/components/game-over-screen';
import { ScoreBar } from '@/components/score-bar';
import {
  GameState,
  LetterStatus,
  Language,
  initializeGame,
  submitGuess,
  addLetter,
  removeLetter,
  useHint,
  WORD_LENGTH,
  MAX_ATTEMPTS,
  KEYBOARD_ROWS,
  HINT_PENALTY,
  POINTS_CORRECT,
  POINTS_PRESENT,
} from '@/game-logic/fives/fives-logic';

const ACCENT_COLOR = '#E85D75';
const CORRECT_COLOR = '#6AAA64';
const PRESENT_COLOR = '#C9B458';
const ABSENT_COLOR = '#3A3A3C';
const HINT_COLOR = '#9B59B6';
const EMPTY_COLOR = '#1a1a2e';
const BORDER_COLOR = '#3A3A3C';
const BG_DARK = '#0a0a1a';
const GRID_GAP = 6;

function getTileSize(screenWidth: number) {
  return Math.min((screenWidth - 60) / WORD_LENGTH - GRID_GAP, 54);
}

export default function FivesScreen() {
  const { width } = useWindowDimensions();
  const screenWidth = Platform.OS === 'web' && width > 500 ? 390 : width;
  const TILE_SIZE = getTileSize(screenWidth);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [gameState, setGameState] = useState<GameState>(() => initializeGame('en'));
  const [shakeRow, setShakeRow] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(true);
  const [showWordReveal, setShowWordReveal] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [revealedWord, setRevealedWord] = useState('');

  // Show word reveal popup when game ends, then show game over screen
  useEffect(() => {
    if (gameState.gameStatus !== 'playing' && !showWordReveal && !showGameOver) {
      setRevealedWord(gameState.targetWord);
      setShowWordReveal(true);
      // After 2 seconds, hide word reveal and show game over
      setTimeout(() => {
        setShowWordReveal(false);
        setShowGameOver(true);
      }, 2000);
    }
  }, [gameState.gameStatus]);

  const startNewGame = () => {
    setGameState(initializeGame(selectedLanguage));
    setErrorMessage(null);
    setShowGameOver(false);
    setShowWordReveal(false);
  };

  const handleLanguageChange = (lang: Language) => {
    setSelectedLanguage(lang);
    setGameState(initializeGame(lang));
    setErrorMessage(null);
  };

  const handleKeyPress = useCallback((key: string) => {
    if (gameState.gameStatus !== 'playing') return;

    if (key === 'ENTER') {
      const result = submitGuess(gameState, gameState.currentGuess);
      if ('error' in result) {
        setErrorMessage(result.error);
        setShakeRow(gameState.guesses.length);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setTimeout(() => {
          setShakeRow(null);
          setErrorMessage(null);
        }, 600);
      } else {
        setGameState(result);
        if (result.gameStatus === 'won') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (result.gameStatus === 'lost') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      }
    } else if (key === 'DEL') {
      setGameState(removeLetter(gameState));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      setGameState(addLetter(gameState, key));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [gameState]);

  const handleHint = useCallback(() => {
    const result = useHint(gameState);
    if ('error' in result) {
      setErrorMessage(result.error);
      setTimeout(() => setErrorMessage(null), 1500);
    } else {
      // Find which letter was revealed
      const newPosition = result.revealedPositions[result.revealedPositions.length - 1];
      const revealedLetter = result.targetWord[newPosition];
      setGameState(result);
      setErrorMessage(`HINT: Position ${newPosition + 1} is "${revealedLetter}"`);
      setTimeout(() => setErrorMessage(null), 2500);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [gameState]);

  const getStatusColor = (status: LetterStatus): string => {
    switch (status) {
      case 'correct': return CORRECT_COLOR;
      case 'hint': return HINT_COLOR;
      case 'present': return PRESENT_COLOR;
      case 'absent': return ABSENT_COLOR;
      default: return EMPTY_COLOR;
    }
  };

  const getKeyColor = (letter: string): string => {
    const status = gameState.usedLetters.get(letter);
    if (!status) return '#505060';
    if (status === 'correct' || status === 'hint') return CORRECT_COLOR;
    return getStatusColor(status);
  };

  const renderHintBar = () => {
    if (gameState.revealedPositions.length === 0) return null;

    return (
      <View style={styles.hintBar}>
        {Array.from({ length: WORD_LENGTH }).map((_, i) => {
          const isRevealed = gameState.revealedPositions.includes(i);
          return (
            <View
              key={i}
              style={[
                styles.hintTile,
                isRevealed && { backgroundColor: HINT_COLOR },
              ]}
            >
              <ThemedText style={styles.hintTileLetter}>
                {isRevealed ? gameState.targetWord[i] : '?'}
              </ThemedText>
            </View>
          );
        })}
      </View>
    );
  };

  const renderTile = (letter: string, status: LetterStatus, index: number, isCurrentRow: boolean) => {
    const backgroundColor = status === 'empty' ? EMPTY_COLOR : getStatusColor(status);
    const borderColor = status === 'empty'
      ? (letter ? ACCENT_COLOR : BORDER_COLOR)
      : backgroundColor;

    const hasHint = gameState.revealedPositions.includes(index);
    const displayLetter = isCurrentRow && !letter && hasHint
      ? gameState.targetWord[index]
      : letter;
    const isHintPlaceholder = isCurrentRow && !letter && hasHint;

    return (
      <View
        key={index}
        style={[
          styles.tile,
          {
            backgroundColor: isHintPlaceholder ? 'rgba(155, 89, 182, 0.3)' : backgroundColor,
            borderColor: isHintPlaceholder ? HINT_COLOR : borderColor,
            width: TILE_SIZE,
            height: TILE_SIZE,
          },
        ]}
      >
        <ThemedText style={[
          styles.tileLetter,
          isHintPlaceholder && styles.tileLetterHint,
        ]}>
          {displayLetter}
        </ThemedText>
      </View>
    );
  };

  const renderGrid = () => {
    const rows = [];
    const maxRows = MAX_ATTEMPTS;

    for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
      const isCurrentRow = rowIndex === gameState.guesses.length;
      const guess = gameState.guesses[rowIndex];
      const isShaking = shakeRow === rowIndex;
      const isDisabled = rowIndex > gameState.guesses.length;

      const rowTiles = [];

      for (let colIndex = 0; colIndex < WORD_LENGTH; colIndex++) {
        let letter = '';
        let status: LetterStatus = 'empty';

        if (guess) {
          letter = guess.letters[colIndex].letter;
          status = guess.letters[colIndex].status;
        } else if (isCurrentRow) {
          letter = gameState.currentGuess[colIndex] || '';
        }

        rowTiles.push(renderTile(letter, status, colIndex, isCurrentRow));
      }

      rows.push(
        <View
          key={rowIndex}
          style={[
            styles.row,
            isShaking && styles.shakeAnimation,
            isDisabled && styles.disabledRow,
          ]}
        >
          {rowTiles}
        </View>
      );
    }

    return <View style={styles.grid}>{rows}</View>;
  };

  const renderKeyboard = () => {
    return (
      <View style={styles.keyboard}>
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keyboardRow}>
            {row.map((key) => {
              const isSpecial = key === 'ENTER' || key === 'DEL';
              const keyColor = isSpecial ? '#404050' : getKeyColor(key);

              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.key,
                    { backgroundColor: keyColor },
                    isSpecial && styles.specialKey,
                    key === 'ENTER' && styles.enterKey,
                  ]}
                  onPress={() => handleKeyPress(key)}
                  activeOpacity={0.7}
                >
                  <ThemedText style={[
                    styles.keyText,
                    isSpecial && styles.specialKeyText,
                  ]}>
                    {key === 'DEL' ? '⌫' : key === 'ENTER' ? '↵' : key}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  const renderHelp = () => (
    <View style={styles.helpOverlay}>
      <View style={styles.helpModal}>
        <ThemedText style={styles.helpTitle}>FIVES</ThemedText>

        <View style={styles.languageSection}>
          <View style={styles.languageButtons}>
            <TouchableOpacity
              style={[
                styles.languageButton,
                selectedLanguage === 'en' && styles.languageButtonActive,
              ]}
              onPress={() => handleLanguageChange('en')}
            >
              <ThemedText style={[
                styles.languageButtonText,
                selectedLanguage === 'en' && styles.languageButtonTextActive,
              ]}>
                🇬🇧 English
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageButton,
                selectedLanguage === 'it' && styles.languageButtonActive,
              ]}
              onPress={() => handleLanguageChange('it')}
            >
              <ThemedText style={[
                styles.languageButtonText,
                selectedLanguage === 'it' && styles.languageButtonTextActive,
              ]}>
                🇮🇹 Italiano
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.helpSection}>
          <ThemedText style={styles.helpSubtitle}>THE GOAL</ThemedText>
          <ThemedText style={styles.helpGoal}>
            I'm thinking of a secret 5-letter word. Can you guess it?
          </ThemedText>
        </View>

        <View style={styles.helpSection}>
          <ThemedText style={styles.helpSubtitle}>EXAMPLE</ThemedText>
          <ThemedText style={styles.helpSmallText}>If the secret word is APPLE and you guess PEARL:</ThemedText>
          <View style={styles.exampleRow}>
            <View style={[styles.helpTile, { backgroundColor: PRESENT_COLOR }]}>
              <ThemedText style={styles.helpTileLetter}>P</ThemedText>
            </View>
            <View style={[styles.helpTile, { backgroundColor: ABSENT_COLOR }]}>
              <ThemedText style={styles.helpTileLetter}>E</ThemedText>
            </View>
            <View style={[styles.helpTile, { backgroundColor: PRESENT_COLOR }]}>
              <ThemedText style={styles.helpTileLetter}>A</ThemedText>
            </View>
            <View style={[styles.helpTile, { backgroundColor: ABSENT_COLOR }]}>
              <ThemedText style={styles.helpTileLetter}>R</ThemedText>
            </View>
            <View style={[styles.helpTile, { backgroundColor: PRESENT_COLOR }]}>
              <ThemedText style={styles.helpTileLetter}>L</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.helpSmallText}>
            <ThemedText style={{ color: PRESENT_COLOR }}>P, A, L</ThemedText> are in APPLE but wrong position
          </ThemedText>
        </View>

        <View style={styles.helpSection}>
          <ThemedText style={styles.helpSubtitle}>COLORS</ThemedText>
          <View style={styles.helpExample}>
            <View style={[styles.helpTile, { backgroundColor: CORRECT_COLOR }]}>
              <ThemedText style={styles.helpTileLetter}>A</ThemedText>
            </View>
            <ThemedText style={styles.helpExampleText}>
              <ThemedText style={{ color: CORRECT_COLOR, fontWeight: '700' }}>GREEN</ThemedText> = Correct spot!
            </ThemedText>
          </View>
          <View style={styles.helpExample}>
            <View style={[styles.helpTile, { backgroundColor: PRESENT_COLOR }]}>
              <ThemedText style={styles.helpTileLetter}>B</ThemedText>
            </View>
            <ThemedText style={styles.helpExampleText}>
              <ThemedText style={{ color: PRESENT_COLOR, fontWeight: '700' }}>YELLOW</ThemedText> = Wrong spot
            </ThemedText>
          </View>
          <View style={styles.helpExample}>
            <View style={[styles.helpTile, { backgroundColor: ABSENT_COLOR }]}>
              <ThemedText style={styles.helpTileLetter}>C</ThemedText>
            </View>
            <ThemedText style={styles.helpExampleText}>
              <ThemedText style={{ color: '#888', fontWeight: '700' }}>GRAY</ThemedText> = Not in word
            </ThemedText>
          </View>
        </View>

        <View style={styles.helpSection}>
          <ThemedText style={styles.helpSubtitle}>SCORING</ThemedText>
          <ThemedText style={styles.helpRule}>
            🟩 <ThemedText style={styles.helpHighlight}>+{POINTS_CORRECT} pts</ThemedText> per green letter
          </ThemedText>
          <ThemedText style={styles.helpRule}>
            🟨 <ThemedText style={styles.helpHighlight}>+{POINTS_PRESENT} pts</ThemedText> per yellow letter
          </ThemedText>
          <ThemedText style={styles.helpRule}>
            🏆 <ThemedText style={styles.helpHighlight}>+500 bonus</ThemedText> for winning
          </ThemedText>
          <ThemedText style={styles.helpRule}>
            💡 <ThemedText style={styles.helpHighlight}>-{HINT_PENALTY} pts</ThemedText> per hint used
          </ThemedText>
        </View>

        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => setShowHelp(false)}
        >
          <ThemedText style={styles.helpButtonText}>PLAY!</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Word reveal popup
  const wordRevealPopup = showWordReveal ? (
    <View style={styles.wordRevealOverlay}>
      <View style={styles.wordRevealBox}>
        <ThemedText style={styles.wordRevealEmoji}>
          {gameState.gameStatus === 'won' ? '🎉' : '💔'}
        </ThemedText>
        <ThemedText style={styles.wordRevealTitle}>
          {gameState.gameStatus === 'won' ? 'GREAT!' : 'TOO BAD!'}
        </ThemedText>
        <ThemedText style={styles.wordRevealLabel}>The word was:</ThemedText>
        <ThemedText style={styles.wordRevealWord}>{revealedWord}</ThemedText>
      </View>
    </View>
  ) : null;

  // Standard game over screen
  const gameOverScreen = showGameOver ? (
    <GameOverScreen
      game="fives"
      score={gameState.score}
      isWin={gameState.gameStatus === 'won'}
      onPlayAgain={startNewGame}
    />
  ) : null;

  return (
    <View style={styles.container}>
      <GameHeader
        title="FIVES"
        accentColor={ACCENT_COLOR}
        showBack
        rightElement={
          <TouchableOpacity
            style={styles.helpIconButton}
            onPress={() => setShowHelp(true)}
          >
            <ThemedText style={styles.helpIcon}>?</ThemedText>
          </TouchableOpacity>
        }
      />

      <ScoreBar
        accentColor={ACCENT_COLOR}
        items={[
          { label: 'SCORE', value: gameState.score },
          { label: 'ATTEMPTS', value: `${gameState.attemptsLeft}/${MAX_ATTEMPTS}` },
          { label: 'HINTS', value: gameState.hintsUsed },
        ]}
      />

      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.languageIndicator}
          onPress={() => setShowHelp(true)}
        >
          <ThemedText style={styles.languageIndicatorText}>
            {selectedLanguage === 'en' ? '🇬🇧' : '🇮🇹'}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.hintButton,
            gameState.revealedPositions.length >= WORD_LENGTH - 1 && styles.hintButtonDisabled,
          ]}
          onPress={handleHint}
          disabled={gameState.revealedPositions.length >= WORD_LENGTH - 1}
        >
          <ThemedText style={styles.hintButtonText}>💡 HINT</ThemedText>
        </TouchableOpacity>
      </View>

      {renderHintBar()}

      {errorMessage && (
        <View style={styles.toast}>
          <ThemedText style={styles.toastText}>{errorMessage}</ThemedText>
        </View>
      )}

      <View style={styles.gameArea}>
        {renderGrid()}
        {renderKeyboard()}
      </View>

      {showHelp && renderHelp()}
      {wordRevealPopup}
      {gameOverScreen}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_DARK,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(232, 93, 117, 0.1)',
  },
  hintButton: {
    backgroundColor: HINT_COLOR,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  hintButtonDisabled: {
    opacity: 0.4,
  },
  hintButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  hintBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    backgroundColor: 'rgba(155, 89, 182, 0.1)',
  },
  hintTile: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#2a2a3e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintTileLetter: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  gameArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  grid: {
    gap: GRID_GAP,
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
    gap: GRID_GAP,
  },
  disabledRow: {
    opacity: 0.3,
  },
  shakeAnimation: {
    opacity: 0.7,
  },
  tile: {
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  tileLetter: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  tileLetterHint: {
    color: HINT_COLOR,
    opacity: 0.7,
  },
  keyboard: {
    gap: 6,
    paddingHorizontal: 4,
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  key: {
    minWidth: 28,
    height: 48,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  specialKey: {
    minWidth: 42,
    paddingHorizontal: 10,
  },
  enterKey: {
    backgroundColor: ACCENT_COLOR,
  },
  keyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  specialKeyText: {
    fontSize: 16,
  },
  toast: {
    position: 'absolute',
    top: 180,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 100,
  },
  toastText: {
    backgroundColor: '#fff',
    color: '#000',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    fontSize: 14,
    fontWeight: '700',
    overflow: 'hidden',
  },
  helpOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
    padding: 16,
  },
  helpModal: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: ACCENT_COLOR,
  },
  helpTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: ACCENT_COLOR,
    textAlign: 'center',
    letterSpacing: 3,
  },
  helpSubtitleMain: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginBottom: 10,
  },
  helpSection: {
    marginBottom: 8,
  },
  helpRule: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 4,
    lineHeight: 16,
  },
  helpHighlight: {
    color: ACCENT_COLOR,
    fontWeight: '700',
  },
  helpSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 1,
    marginBottom: 6,
  },
  helpExample: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  helpTile: {
    width: 28,
    height: 28,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpTileLetter: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  helpExampleText: {
    flex: 1,
    fontSize: 11,
    color: '#bbb',
  },
  helpButton: {
    backgroundColor: ACCENT_COLOR,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  helpButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
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
  wordRevealOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  wordRevealBox: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: ACCENT_COLOR,
    minWidth: 280,
  },
  wordRevealEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  wordRevealTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 3,
    marginBottom: 20,
  },
  wordRevealLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  wordRevealWord: {
    fontSize: 40,
    fontWeight: '900',
    color: ACCENT_COLOR,
    letterSpacing: 8,
  },
  languageSection: {
    marginBottom: 8,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#2a2a3e',
    borderWidth: 1.5,
    borderColor: '#3a3a4e',
    alignItems: 'center',
  },
  languageButtonActive: {
    backgroundColor: 'rgba(232, 93, 117, 0.2)',
    borderColor: ACCENT_COLOR,
  },
  languageButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },
  languageButtonTextActive: {
    color: ACCENT_COLOR,
    fontWeight: '700',
  },
  languageIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  languageIndicatorText: {
    fontSize: 18,
  },
  helpGoal: {
    fontSize: 13,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 18,
  },
  helpSmallText: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
    marginBottom: 4,
  },
  exampleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginVertical: 6,
  },
});
