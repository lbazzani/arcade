import React, { useState, useRef, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import { ThemedText } from '@/components/themed-text';
import { GameLayout } from '@/components/game-layout';
import { GameOverScreen } from '@/components/game-over-screen';
import { useGameSounds } from '@/hooks/use-game-sounds';
import { useGameDimensions } from '@/hooks/use-game-dimensions';
import {
  initializeGame,
  GameLoop,
  GAME_WIDTH,
  GAME_HEIGHT,
} from '@/game-logic/superbaz/superbaz-logic';

export default function SuperBazScreen() {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, insets } = useGameDimensions();
  const { playFeedback } = useGameSounds();

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
      playFeedback('jump');
    }
  };

  const handleEvent = (event: any) => {
    if (event.type === 'game-over') {
      setGameOver(true);
      playFeedback('gameOver');
    } else if (event.type === 'score-update') {
      setScore(event.score);
    } else if (event.type === 'coin-collected') {
      playFeedback('coin');
    } else if (event.type === 'enemy-killed') {
      playFeedback('stomp');
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
    <GameOverScreen
      game="superbaz"
      score={score}
      onPlayAgain={resetGame}
    />
  ) : null;

  const controls = (
    <View style={styles.hintContainer}>
      <ThemedText style={styles.hintText}>
        {gameStarted ? 'TAP TO JUMP' : 'TAP ANYWHERE TO START'}
      </ThemedText>
    </View>
  );

  const startOverlay = !gameStarted && !gameOver ? (
    <View style={styles.startOverlay} pointerEvents="none">
      <View style={styles.startTextContainer}>
        <ThemedText style={styles.startText}>TAP</ThemedText>
        <ThemedText style={styles.startSubtext}>to jump</ThemedText>
      </View>
    </View>
  ) : null;

  return (
    <GameLayout
      title="SUPER BAZ"
      accentColor="#E74C3C"
      score={score}
      showScore={true}
      controls={controls}
      overlay={gameOverOverlay || startOverlay}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleTap}
        style={[styles.gameContainer, {
          width: GAME_WIDTH * CELL_SIZE + 6,
          height: GAME_HEIGHT * CELL_SIZE + 6,
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
      </TouchableOpacity>
    </GameLayout>
  );
}

const styles = StyleSheet.create({
  gameContainer: {
    borderWidth: 3,
    borderColor: '#E74C3C',
    borderRadius: 12,
    backgroundColor: '#B3E5FC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gameEngine: {
    backgroundColor: '#B3E5FC',
    borderRadius: 10,
    overflow: 'hidden',
  },
  hintContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  hintText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E74C3C',
    letterSpacing: 2,
    opacity: 0.8,
  },
  startOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 1000,
  },
  startTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#E74C3C',
    overflow: 'visible',
  },
  startText: {
    fontSize: 52,
    fontWeight: '900',
    color: '#E74C3C',
    letterSpacing: 6,
    lineHeight: 60,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  startSubtext: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
    letterSpacing: 3,
  },
});
