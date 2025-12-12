import React, { useState, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions, PanResponder } from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import { ThemedText } from '@/components/themed-text';
import { GameLayout } from '@/components/game-layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  initializeGame,
  GameLoop,
  GRID_WIDTH,
  GRID_HEIGHT,
} from '@/game-logic/snake/snake-logic';

export default function SnakeScreen() {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
  const insets = useSafeAreaInsets();

  // Dimensioni componenti - più spazio per il gioco senza D-pad
  const HEADER_HEIGHT = 60;
  const SCORE_HEIGHT = 35;
  const HINT_HEIGHT = 50;

  // Calcola altezza disponibile per il gioco
  const GAME_AREA_HEIGHT = SCREEN_HEIGHT - insets.top - HEADER_HEIGHT - SCORE_HEIGHT - HINT_HEIGHT - Math.max(insets.bottom, 20);
  const GAME_AREA_WIDTH = SCREEN_WIDTH - 32; // padding laterale

  // Calcola CELL_SIZE per riempire l'area disponibile
  const CELL_SIZE = Math.min(GAME_AREA_WIDTH / GRID_WIDTH, GAME_AREA_HEIGHT / GRID_HEIGHT);

  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [entities, setEntities] = useState(initializeGame(CELL_SIZE));
  const gameEngineRef = useRef<any>(null);

  // Riferimenti per lo swipe
  const lastDirectionRef = useRef<string | null>(null);

  const dispatchDirection = (direction: string) => {
    if (gameEngineRef.current && !gameOver) {
      // Evita di inviare la stessa direzione ripetutamente
      if (lastDirectionRef.current === direction) return;
      lastDirectionRef.current = direction;

      if (!gameStarted) {
        setGameStarted(true);
      }
      gameEngineRef.current.dispatch({ type: 'change-direction', direction });
    }
  };

  // PanResponder per gestire swipe su tutta l'area di gioco
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastDirectionRef.current = null;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gameOver) return;

        const { dx, dy } = gestureState;
        const minSwipe = 10; // Soglia minima molto bassa per reattività

        // Determina la direzione predominante
        if (Math.abs(dx) > Math.abs(dy)) {
          // Movimento orizzontale
          if (Math.abs(dx) > minSwipe) {
            dispatchDirection(dx > 0 ? 'RIGHT' : 'LEFT');
          }
        } else {
          // Movimento verticale
          if (Math.abs(dy) > minSwipe) {
            dispatchDirection(dy > 0 ? 'DOWN' : 'UP');
          }
        }
      },
      onPanResponderRelease: () => {
        lastDirectionRef.current = null;
      },
    })
  ).current;

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
    lastDirectionRef.current = null;
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

  // Hint per i controlli (invece dei bottoni)
  const controls = (
    <View style={styles.hintContainer}>
      <ThemedText style={styles.hintText}>
        {gameStarted ? 'SWIPE TO TURN' : 'SWIPE ANYWHERE TO START'}
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
      <View
        style={[styles.gameContainer, {
          width: GRID_WIDTH * CELL_SIZE + 4,
          height: GRID_HEIGHT * CELL_SIZE + 4,
        }]}
        {...panResponder.panHandlers}
      >
        <GameEngine
          key={gameOver ? 'game-over' : 'running'}
          ref={gameEngineRef}
          style={[styles.gameEngine, {
            width: GRID_WIDTH * CELL_SIZE,
            height: GRID_HEIGHT * CELL_SIZE,
          }]}
          systems={[GameLoop]}
          entities={entities}
          running={!gameOver}
          onEvent={handleEvent}
        />
        {!gameStarted && !gameOver && (
          <View style={styles.startOverlay}>
            <ThemedText style={styles.startText}>SWIPE</ThemedText>
            <ThemedText style={styles.startSubtext}>anywhere to start</ThemedText>
          </View>
        )}
      </View>
    </GameLayout>
  );
}

const styles = StyleSheet.create({
  gameContainer: {
    borderWidth: 2,
    borderColor: '#00D4FF',
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  gameEngine: {
    backgroundColor: '#1a1a1a',
  },
  // HINT
  hintContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  hintText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00D4FF',
    letterSpacing: 2,
    opacity: 0.8,
  },
  // START OVERLAY
  startOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  startText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 4,
    textShadowColor: '#00D4FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  startSubtext: {
    fontSize: 16,
    fontWeight: '600',
    color: '#aaa',
    marginTop: 12,
    letterSpacing: 2,
  },
  // GAME OVER OVERLAY
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
    textShadowColor: '#00D4FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    lineHeight: 42,
  },
  overlayScore: {
    fontSize: 48,
    fontWeight: '900',
    color: '#00D4FF',
    textAlign: 'center',
    textShadowColor: '#00D4FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
    lineHeight: 56,
    marginVertical: 12,
  },
  overlayButton: {
    backgroundColor: '#00D4FF',
    paddingHorizontal: 44,
    paddingVertical: 14,
    borderRadius: 28,
    marginTop: 12,
    shadowColor: '#00D4FF',
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
