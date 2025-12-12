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
} from '@/game-logic/breakout/breakout-logic';

export default function BreakoutScreen() {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
  const insets = useSafeAreaInsets();

  const HEADER_HEIGHT = 60;
  const SCORE_HEIGHT = 35;
  const BOTTOM_PADDING = 30;

  const GAME_AREA_HEIGHT = SCREEN_HEIGHT - insets.top - HEADER_HEIGHT - SCORE_HEIGHT - BOTTOM_PADDING - Math.max(insets.bottom, 10);
  const GAME_AREA_WIDTH = SCREEN_WIDTH;

  const CELL_SIZE = Math.min(GAME_AREA_WIDTH / GAME_WIDTH, GAME_AREA_HEIGHT / GAME_HEIGHT);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [entities, setEntities] = useState(() => initializeGame(CELL_SIZE));
  const [gameKey, setGameKey] = useState(0);
  const gameEngineRef = useRef<any>(null);

  // Refs per valori accessibili nel PanResponder
  const gameViewX = useRef(0);
  const entitiesRef = useRef(entities);
  const cellSizeRef = useRef(CELL_SIZE);

  // Aggiorna refs quando cambiano i valori
  entitiesRef.current = entities;
  cellSizeRef.current = CELL_SIZE;

  // Funzione per aggiornare la posizione del paddle
  const updatePaddlePosition = (pageX: number) => {
    const touchX = pageX - gameViewX.current;
    const gameX = touchX / cellSizeRef.current;
    const paddleX = gameX - 1.25; // Centro del paddle (larghezza 2.5)

    if (entitiesRef.current?.game) {
      entitiesRef.current.game.targetPaddleX = Math.max(0, Math.min(GAME_WIDTH - 2.5, paddleX));
    }
  };

  // PanResponder per l'area touch del paddle
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        // Lancia la palla al primo tocco
        if (gameEngineRef.current) {
          gameEngineRef.current.dispatch({ type: 'launch' });
        }
        updatePaddlePosition(evt.nativeEvent.pageX);
      },
      onPanResponderMove: (evt) => {
        updatePaddlePosition(evt.nativeEvent.pageX);
      },
    })
  ).current;

  const handleEvent = (event: any) => {
    if (event.type === 'game-over') {
      setGameOver(true);
    } else if (event.type === 'win') {
      setWon(true);
    } else if (event.type === 'score-update') {
      setScore(event.score);
    } else if (event.type === 'lives-update') {
      setLives(event.lives);
    }
  };

  const resetGame = () => {
    setScore(0);
    setLives(3);
    setGameOver(false);
    setWon(false);
    setGameKey(prev => prev + 1);
    setEntities(initializeGame(CELL_SIZE));
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

  const winOverlay = won ? (
    <View style={styles.overlay}>
      <View style={styles.overlayContent}>
        <View style={styles.textContainer}>
          <ThemedText style={[styles.overlayTitle, styles.winTitle]}>YOU</ThemedText>
          <ThemedText style={[styles.overlayTitle, styles.winTitle]}>WIN!</ThemedText>
        </View>
        <ThemedText style={[styles.overlayScore, styles.winScore]}>{score}</ThemedText>
        <TouchableOpacity style={[styles.overlayButton, styles.winButton]} onPress={resetGame}>
          <ThemedText style={styles.overlayButtonText}>PLAY AGAIN</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  ) : null;

  const startOverlay = !gameOver && !won && lives === 3 && score === 0 ? (
    <View style={styles.startOverlay} pointerEvents="none">
      <ThemedText style={styles.startText}>TAP TO LAUNCH</ThemedText>
      <ThemedText style={styles.startSubtext}>Drag to move paddle</ThemedText>
    </View>
  ) : null;

  return (
    <GameLayout
      score={score}
      showScore={true}
      overlay={gameOverOverlay || winOverlay}
    >
      <View
        style={[styles.gameContainer, {
          width: GAME_WIDTH * CELL_SIZE,
          height: GAME_HEIGHT * CELL_SIZE,
        }]}
        onLayout={(evt) => {
          // Salva la posizione X della view di gioco
          gameViewX.current = evt.nativeEvent.layout.x + (SCREEN_WIDTH - GAME_WIDTH * CELL_SIZE) / 2;
        }}
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
          running={!gameOver && !won}
          onEvent={handleEvent}
        />
        {startOverlay}

        {/* Area touch trasparente sopra il GameEngine */}
        <View
          {...panResponder.panHandlers}
          style={[styles.touchArea, {
            width: GAME_WIDTH * CELL_SIZE,
            height: GAME_HEIGHT * CELL_SIZE,
          }]}
        />
      </View>
    </GameLayout>
  );
}

const styles = StyleSheet.create({
  gameContainer: {
    borderWidth: 2,
    borderColor: '#00D4FF',
    overflow: 'hidden',
    backgroundColor: '#0a0a1a',
    position: 'relative',
  },
  gameEngine: {
    backgroundColor: '#0a0a1a',
  },
  touchArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  startOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 5,
  },
  startText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 3,
    textShadowColor: '#00D4FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  startSubtext: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginTop: 10,
    letterSpacing: 1,
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
    textShadowColor: '#FF4757',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    lineHeight: 42,
  },
  winTitle: {
    textShadowColor: '#2ED573',
  },
  overlayScore: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FF4757',
    textAlign: 'center',
    textShadowColor: '#FF4757',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
    lineHeight: 56,
    marginVertical: 12,
  },
  winScore: {
    color: '#2ED573',
    textShadowColor: '#2ED573',
  },
  overlayButton: {
    backgroundColor: '#FF4757',
    paddingHorizontal: 44,
    paddingVertical: 14,
    borderRadius: 28,
    marginTop: 12,
    shadowColor: '#FF4757',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 180,
    alignItems: 'center',
  },
  winButton: {
    backgroundColor: '#2ED573',
    shadowColor: '#2ED573',
  },
  overlayButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2.5,
    textAlign: 'center',
  },
});
