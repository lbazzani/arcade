import React, { useState, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions, PanResponder } from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import { ThemedText } from '@/components/themed-text';
import { GameLayout } from '@/components/game-layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  initializeGame,
  GameLoop,
  GAME_WIDTH,
  GAME_HEIGHT,
} from '@/game-logic/galaxy/galaxy-logic';

export default function GalaxyScreen() {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  // Touch controls optimized for fluid movement

  // Dimensioni componenti (considerando safe area)
  const HEADER_HEIGHT = 60;
  const SCORE_HEIGHT = 35;
  const CONTROLS_HEIGHT = 70;

  // Calcola altezza disponibile per il gioco
  const GAME_AREA_HEIGHT = SCREEN_HEIGHT - insets.top - HEADER_HEIGHT - SCORE_HEIGHT - CONTROLS_HEIGHT - Math.max(insets.bottom, 10);
  const GAME_AREA_WIDTH = SCREEN_WIDTH;

  // Calcola CELL_SIZE per riempire tutta la larghezza
  const CELL_SIZE = Math.min(GAME_AREA_WIDTH / GAME_WIDTH, GAME_AREA_HEIGHT / GAME_HEIGHT);

  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [entities, setEntities] = useState(initializeGame(CELL_SIZE));
  const gameEngineRef = useRef<any>(null);
  const shootIntervalRef = useRef<any>(null);
  const moveIntervalRef = useRef<any>(null);
  const initialTouchX = useRef(0);
  const currentDirection = useRef<'left' | 'right' | null>(null);

  const dispatchAction = (action: string) => {
    if (gameEngineRef.current && !gameOver) {
      gameEngineRef.current.dispatch({ type: action });
    }
  };

  const startShooting = () => {
    if (!gameOver && !shootIntervalRef.current) {
      // Primo colpo immediato
      dispatchAction('shoot');
      // Poi spara ogni 200ms
      shootIntervalRef.current = setInterval(() => {
        dispatchAction('shoot');
      }, 200);
    }
  };

  const stopShooting = () => {
    if (shootIntervalRef.current) {
      clearInterval(shootIntervalRef.current);
      shootIntervalRef.current = null;
    }
  };

  const stopMoving = () => {
    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current);
      moveIntervalRef.current = null;
    }
    currentDirection.current = null;
  };

  // PanResponder per gestire movimento + sparo
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !gameOver,
    onMoveShouldSetPanResponder: () => !gameOver,
    onPanResponderGrant: (evt) => {
      initialTouchX.current = evt.nativeEvent.pageX;
      startShooting();
    },
    onPanResponderMove: (evt, gestureState) => {
      // Calcola direzione basata sul movimento totale
      const dx = evt.nativeEvent.pageX - initialTouchX.current;

      if (Math.abs(dx) > 5) { // Soglia minima per attivare movimento
        const newDirection = dx < 0 ? 'left' : 'right';

        // Se la direzione è cambiata, ferma il vecchio intervallo
        if (newDirection !== currentDirection.current) {
          if (moveIntervalRef.current) {
            clearInterval(moveIntervalRef.current);
            moveIntervalRef.current = null;
          }

          currentDirection.current = newDirection;

          // Avvia movimento continuo nella nuova direzione
          const moveAction = newDirection === 'left' ? 'move-left' : 'move-right';
          dispatchAction(moveAction); // Primo movimento immediato

          moveIntervalRef.current = setInterval(() => {
            dispatchAction(moveAction);
          }, 50); // Movimento ogni 50ms per fluidità
        }
      } else {
        // Se siamo vicini al punto iniziale, ferma il movimento
        if (moveIntervalRef.current) {
          clearInterval(moveIntervalRef.current);
          moveIntervalRef.current = null;
          currentDirection.current = null;
        }
      }
    },
    onPanResponderRelease: () => {
      stopShooting();
      stopMoving();
    },
    onPanResponderTerminate: () => {
      stopShooting();
      stopMoving();
    },
  });

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
    const newEntities = initializeGame(CELL_SIZE);
    setEntities(newEntities);
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

  // Controlli
  const controls = (
    <View style={styles.controlsContainer}>
      <TouchableOpacity
        style={[styles.controlButton, styles.sideButton]}
        onPress={() => dispatchAction('move-left')}
        disabled={gameOver}
      >
        <ThemedText style={styles.controlButtonText}>←</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.controlButton, styles.centerButton]}
        onPressIn={startShooting}
        onPressOut={stopShooting}
        disabled={gameOver}
      >
        <ThemedText style={styles.controlButtonText}>🔥</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.controlButton, styles.sideButton]}
        onPress={() => dispatchAction('move-right')}
        disabled={gameOver}
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
      overlay={gameOverOverlay}
    >
      <View style={[styles.gameContainer, {
        width: GAME_WIDTH * CELL_SIZE,
        height: GAME_HEIGHT * CELL_SIZE,
      }]}>
        <GameEngine
          key={gameOver ? 'game-over' : 'running'}
          ref={gameEngineRef}
          style={[styles.gameEngine, {
            width: GAME_WIDTH * CELL_SIZE,
            height: GAME_HEIGHT * CELL_SIZE
          }]}
          systems={[GameLoop]}
          entities={entities}
          running={!gameOver}
          onEvent={handleEvent}
        />

        {/* Area touch sull'astronave per sparare e muoversi */}
        <View
          {...panResponder.panHandlers}
          style={[styles.shipTouchArea, {
            width: GAME_WIDTH * CELL_SIZE,
            height: CELL_SIZE * 3,
            bottom: 0,
          }]}
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
    position: 'relative',
  },
  gameEngine: {
    backgroundColor: '#000',
  },
  shipTouchArea: {
    position: 'absolute',
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  // OVERLAY
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
    maxWidth: 120,
  },
  centerButton: {
    flex: 1,
    maxWidth: 100,
  },
  controlButtonText: {
    fontSize: 24,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
});
