import React, { useState, useRef, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions } from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import { ThemedText } from '@/components/themed-text';
import { GameLayout } from '@/components/game-layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  initializeGame,
  GameLoop,
  GAME_WIDTH,
  GAME_HEIGHT,
} from '@/game-logic/flappy/flappy-logic';

export default function FlappyScreen() {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
  const insets = useSafeAreaInsets();

  const HEADER_HEIGHT = 60;
  const SCORE_HEIGHT = 35;
  const HINT_HEIGHT = 50;

  const GAME_AREA_HEIGHT = SCREEN_HEIGHT - insets.top - HEADER_HEIGHT - SCORE_HEIGHT - HINT_HEIGHT - Math.max(insets.bottom, 20);
  const GAME_AREA_WIDTH = SCREEN_WIDTH - 32;

  const CELL_SIZE = Math.min(GAME_AREA_WIDTH / GAME_WIDTH, GAME_AREA_HEIGHT / GAME_HEIGHT);

  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const gameEngineRef = useRef<any>(null);

  const getInitialEntities = useCallback(() => {
    return initializeGame(CELL_SIZE);
  }, [CELL_SIZE]);

  const [entities, setEntities] = useState(getInitialEntities);

  const handleTap = () => {
    if (gameOver) return;

    if (!gameStarted) {
      setGameStarted(true);
    }

    if (gameEngineRef.current) {
      gameEngineRef.current.dispatch({ type: 'jump' });
    }
  };

  const handleEvent = (event: any) => {
    if (event.type === 'game-over') {
      setGameOver(true);
    } else if (event.type === 'score-update') {
      setScore(event.score);
    }
  };

  const resetGame = () => {
    setScore(0);
    setGameOver(false);
    setGameStarted(false);
    setGameKey(prev => prev + 1);
    setEntities(getInitialEntities());
  };

  const gameOverOverlay = gameOver ? (
    <View style={styles.overlay}>
      <View style={styles.overlayContent}>
        <View style={styles.textContainer}>
          <ThemedText style={styles.overlayTitle}>GAME</ThemedText>
          <ThemedText style={styles.overlayTitle}>OVER</ThemedText>
        </View>
        <ThemedText style={styles.overlayScore}>{score}</ThemedText>
        <TouchableOpacity style={styles.overlayButton} onPress={resetGame}>
          <ThemedText style={styles.overlayButtonText}>PLAY AGAIN</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  ) : null;

  const controls = (
    <View style={styles.hintContainer}>
      <ThemedText style={styles.hintText}>
        {gameStarted ? 'TAP TO FLAP' : 'TAP ANYWHERE TO START'}
      </ThemedText>
    </View>
  );

  return (
    <GameLayout
      score={score}
      showScore={true}
      controls={controls}
      overlay={gameOverOverlay}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleTap}
        style={[styles.gameContainer, {
          width: GAME_WIDTH * CELL_SIZE + 4,
          height: GAME_HEIGHT * CELL_SIZE + 4,
        }]}
      >
        <GameEngine
          key={gameKey}
          ref={gameEngineRef}
          style={[styles.gameEngine, {
            width: GAME_WIDTH * CELL_SIZE,
            height: GAME_HEIGHT * CELL_SIZE,
          }]}
          systems={[GameLoop]}
          entities={entities}
          running={!gameOver}
          onEvent={handleEvent}
        />
        {!gameStarted && !gameOver && (
          <View style={styles.startOverlay} pointerEvents="none">
            <ThemedText style={styles.startText}>TAP</ThemedText>
            <ThemedText style={styles.startSubtext}>to fly</ThemedText>
          </View>
        )}
      </TouchableOpacity>
    </GameLayout>
  );
}

const styles = StyleSheet.create({
  gameContainer: {
    borderWidth: 2,
    borderColor: '#FFD93D',
    overflow: 'hidden',
    backgroundColor: '#87CEEB',
  },
  gameEngine: {
    backgroundColor: '#87CEEB',
  },
  hintContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  hintText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD93D',
    letterSpacing: 2,
    opacity: 0.8,
  },
  startOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  startText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 4,
    textShadowColor: '#FFD93D',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  startSubtext: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8,
    letterSpacing: 2,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.96)',
    zIndex: 1000,
  },
  overlayContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 40,
    width: '85%',
    maxWidth: 400,
  },
  textContainer: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  overlayTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 3,
    textAlign: 'center',
    textShadowColor: '#FFD93D',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    lineHeight: 42,
  },
  overlayScore: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFD93D',
    textAlign: 'center',
    textShadowColor: '#FFD93D',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
    lineHeight: 56,
    marginVertical: 12,
  },
  overlayButton: {
    backgroundColor: '#FFD93D',
    paddingHorizontal: 44,
    paddingVertical: 14,
    borderRadius: 28,
    marginTop: 12,
    shadowColor: '#FFD93D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 180,
    alignItems: 'center',
  },
  overlayButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2.5,
    textAlign: 'center',
  },
});
