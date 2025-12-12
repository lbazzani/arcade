import React, { useState, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions } from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import { ThemedText } from '@/components/themed-text';
import { GameLayout } from '@/components/game-layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  initializeGame,
  GameLoop,
  BOARD_WIDTH,
  BOARD_HEIGHT,
} from '@/game-logic/tetris/tetris-logic';

export default function TetrisScreen() {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
  const insets = useSafeAreaInsets();

  // Dimensioni componenti (considerando safe area)
  const HEADER_HEIGHT = 60;
  const SCORE_HEIGHT = 35;
  const CONTROLS_HEIGHT = 70;

  // Calcola altezza disponibile per il gioco
  const GAME_HEIGHT = SCREEN_HEIGHT - insets.top - HEADER_HEIGHT - SCORE_HEIGHT - CONTROLS_HEIGHT - Math.max(insets.bottom, 10);
  const GAME_WIDTH = SCREEN_WIDTH;

  // Calcola CELL_SIZE per riempire tutta la larghezza
  const CELL_SIZE = Math.min(GAME_WIDTH / BOARD_WIDTH, GAME_HEIGHT / BOARD_HEIGHT);

  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [entities, setEntities] = useState(initializeGame(CELL_SIZE));
  const gameEngineRef = useRef<any>(null);

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
    setIsPaused(false);
    const newEntities = initializeGame(CELL_SIZE);
    setEntities(newEntities);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const dispatchMove = (action: string) => {
    if (gameEngineRef.current && !gameOver && !isPaused) {
      gameEngineRef.current.dispatch({ type: action });
    }
  };

  const handleDrop = () => {
    for (let i = 0; i < 20; i++) {
      dispatchMove('move-down');
    }
  };

  // Overlay Game Over
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

  // Overlay Pausa
  const pauseOverlay = isPaused && !gameOver ? (
    <View style={styles.overlay}>
      <ThemedText style={styles.overlayTitle}>PAUSED</ThemedText>
      <TouchableOpacity style={styles.overlayButton} onPress={togglePause}>
        <ThemedText style={styles.overlayButtonText}>CONTINUE</ThemedText>
      </TouchableOpacity>
    </View>
  ) : null;

  // Controlli
  const controls = (
    <View style={styles.controlsContainer}>
      <TouchableOpacity
        style={[styles.controlButton, styles.sideButton]}
        onPress={() => dispatchMove('move-left')}
        disabled={gameOver || isPaused}
      >
        <ThemedText style={styles.controlButtonText}>←</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.controlButton, styles.centerButton]}
        onPress={() => dispatchMove('rotate')}
        disabled={gameOver || isPaused}
      >
        <ThemedText style={styles.controlButtonText}>↻</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.controlButton, styles.centerButton]}
        onPress={handleDrop}
        disabled={gameOver || isPaused}
      >
        <ThemedText style={styles.controlButtonText}>↓</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.controlButton, styles.sideButton]}
        onPress={() => dispatchMove('move-right')}
        disabled={gameOver || isPaused}
      >
        <ThemedText style={styles.controlButtonText}>→</ThemedText>
      </TouchableOpacity>
    </View>
  );

  return (
    <GameLayout
      score={score}
      showScore={true}
      controls={controls}
      overlay={gameOverOverlay || pauseOverlay}
    >
      <View style={[styles.gameContainer, {
        width: BOARD_WIDTH * CELL_SIZE,
        height: BOARD_HEIGHT * CELL_SIZE,
      }]}>
        <GameEngine
          key={gameOver ? 'game-over' : 'running'}
          ref={gameEngineRef}
          style={[styles.gameEngine, {
            width: BOARD_WIDTH * CELL_SIZE,
            height: BOARD_HEIGHT * CELL_SIZE
          }]}
          systems={[GameLoop]}
          entities={entities}
          running={!gameOver && !isPaused}
          onEvent={handleEvent}
        />
      </View>
    </GameLayout>
  );
}

const styles = StyleSheet.create({
  gameContainer: {
    borderWidth: 2,
    borderColor: '#4A90E2',
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  gameEngine: {
    backgroundColor: '#000',
  },
  // OVERLAY: copre tutto lo schermo (viene posizionato in GameLayout)
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
    textShadowColor: '#4A90E2',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    lineHeight: 42,
  },
  overlayScore: {
    fontSize: 48,
    fontWeight: '900',
    color: '#4A90E2',
    textAlign: 'center',
    textShadowColor: '#4A90E2',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
    lineHeight: 56,
    marginVertical: 12,
  },
  overlayButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 44,
    paddingVertical: 14,
    borderRadius: 28,
    marginTop: 12,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 180,
    alignItems: 'center',
  },
  overlayButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2.5,
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 70,
  },
  controlButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#4A90E2',
    borderRadius: 28,
    height: 56,
  },
  sideButton: {
    flex: 1,
    maxWidth: 100,
  },
  centerButton: {
    flex: 1,
    maxWidth: 90,
  },
  controlButtonText: {
    fontSize: 24,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
});
