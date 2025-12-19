import React, { useState, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, PanResponder, GestureResponderEvent } from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import { ThemedText } from '@/components/themed-text';
import { GameLayout } from '@/components/game-layout';
import { GameOverScreen } from '@/components/game-over-screen';
import { useGameSounds } from '@/hooks/use-game-sounds';
import { useGameDimensions } from '@/hooks/use-game-dimensions';
import {
  initializeGame,
  GameLoop,
  BOARD_WIDTH,
  BOARD_HEIGHT,
} from '@/game-logic/tetris/tetris-logic';

export default function TetrisScreen() {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, insets } = useGameDimensions();
  const { playFeedback } = useGameSounds();

  // Dimensioni componenti (considerando safe area)
  const HEADER_HEIGHT = 60;
  const SCORE_HEIGHT = 35;

  // Calcola altezza disponibile per il gioco (senza controlli ora)
  const GAME_AREA_HEIGHT = SCREEN_HEIGHT - insets.top - HEADER_HEIGHT - SCORE_HEIGHT - Math.max(insets.bottom, 10);
  const GAME_AREA_WIDTH = SCREEN_WIDTH;

  // Calcola CELL_SIZE per riempire tutta la larghezza
  const CELL_SIZE = Math.min(GAME_AREA_WIDTH / BOARD_WIDTH, GAME_AREA_HEIGHT / BOARD_HEIGHT);

  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [entities, setEntities] = useState(initializeGame(CELL_SIZE));
  const gameEngineRef = useRef<any>(null);

  // Gesture tracking
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const hasMoved = useRef(false);
  const lastMoveX = useRef(0);

  const handleEvent = (event: any) => {
    if (event.type === 'game-over') {
      setGameOver(true);
      playFeedback('gameOver');
    } else if (event.type === 'score-update') {
      setScore(event.score);
    } else if (event.type === 'lines-cleared') {
      playFeedback('explosion');
    } else if (event.type === 'piece-locked') {
      playFeedback('hit');
    } else if (event.type === 'piece-moved') {
      playFeedback('shoot');
    } else if (event.type === 'piece-rotated') {
      playFeedback('shoot');
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

  // Soglie per i gesti
  const SWIPE_THRESHOLD = 30; // pixel minimo per uno swipe
  const TAP_THRESHOLD = 10; // movimento massimo per considerarlo un tap
  const MOVE_CELL_THRESHOLD = CELL_SIZE * 0.8; // pixel per muovere di una cella

  // PanResponder per gestire tutti i tocchi
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        touchStartRef.current = {
          x: evt.nativeEvent.pageX,
          y: evt.nativeEvent.pageY,
          time: Date.now(),
        };
        hasMoved.current = false;
        lastMoveX.current = evt.nativeEvent.pageX;
      },
      onPanResponderMove: (evt) => {
        if (gameOver || isPaused) return;

        const currentX = evt.nativeEvent.pageX;
        const currentY = evt.nativeEvent.pageY;
        const deltaX = currentX - touchStartRef.current.x;
        const deltaY = currentY - touchStartRef.current.y;

        // Movimento orizzontale continuo (sposta pezzo)
        const movesDelta = currentX - lastMoveX.current;
        if (Math.abs(movesDelta) >= MOVE_CELL_THRESHOLD) {
          if (movesDelta > 0) {
            dispatchMove('move-right');
          } else {
            dispatchMove('move-left');
          }
          lastMoveX.current = currentX;
          hasMoved.current = true;
        }

        // Swipe veloce verso il basso = hard drop
        if (deltaY > SWIPE_THRESHOLD * 2 && Math.abs(deltaX) < SWIPE_THRESHOLD) {
          if (!hasMoved.current) {
            handleDrop();
            hasMoved.current = true;
          }
        }
      },
      onPanResponderRelease: (evt) => {
        if (gameOver || isPaused) return;

        const deltaX = evt.nativeEvent.pageX - touchStartRef.current.x;
        const deltaY = evt.nativeEvent.pageY - touchStartRef.current.y;
        const elapsed = Date.now() - touchStartRef.current.time;

        // Tap = ruota (poco movimento e tempo breve)
        if (Math.abs(deltaX) < TAP_THRESHOLD && Math.abs(deltaY) < TAP_THRESHOLD && elapsed < 300) {
          dispatchMove('rotate');
        }
      },
    })
  ).current;

  // Overlay Game Over
  const gameOverOverlay = gameOver ? (
    <GameOverScreen
      game="tetris"
      score={score}
      onPlayAgain={resetGame}
    />
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

  // Hint controlli (mostrato brevemente all'inizio)
  const controlsHint = !gameOver && !isPaused ? (
    <View style={styles.hintContainer}>
      <ThemedText style={styles.hintText}>TAP = Rotate • SWIPE ← → = Move • SWIPE ↓ = Drop</ThemedText>
    </View>
  ) : null;

  return (
    <GameLayout
      title="BAZ BLOCKS"
      accentColor="#4A90E2"
      score={score}
      showScore={true}
      overlay={gameOverOverlay || pauseOverlay}
    >
      <View
        style={[styles.gameContainer, {
          width: BOARD_WIDTH * CELL_SIZE,
          height: BOARD_HEIGHT * CELL_SIZE,
        }]}
        {...panResponder.panHandlers}
      >
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
      {controlsHint}
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.96)',
    zIndex: 1000,
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
  hintContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  hintText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
