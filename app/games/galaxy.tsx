import React, { useState, useRef } from 'react';
import { StyleSheet, View, PanResponder } from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import { GameLayout } from '@/components/game-layout';
import { GameOverScreen } from '@/components/game-over-screen';
import { useGameSounds } from '@/hooks/use-game-sounds';
import { useGameDimensions } from '@/hooks/use-game-dimensions';
import {
  initializeGame,
  GameLoop,
  GAME_WIDTH,
  GAME_HEIGHT,
} from '@/game-logic/galaxy/galaxy-logic';

export default function GalaxyScreen() {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, insets } = useGameDimensions();
  const { playFeedback } = useGameSounds();

  // Dimensioni componenti (considerando safe area)
  const HEADER_HEIGHT = 60;
  const SCORE_HEIGHT = 35;

  // Calcola altezza disponibile per il gioco
  const GAME_AREA_HEIGHT = SCREEN_HEIGHT - insets.top - HEADER_HEIGHT - SCORE_HEIGHT - Math.max(insets.bottom, 10);

  // Calcola CELL_SIZE per riempire tutta la larghezza dello schermo
  const CELL_SIZE = SCREEN_WIDTH / GAME_WIDTH;

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [entities, setEntities] = useState(initializeGame(CELL_SIZE, GAME_AREA_HEIGHT));
  const gameEngineRef = useRef<any>(null);
  const shootIntervalRef = useRef<any>(null);
  const gameViewX = useRef(0);
  const entitiesRef = useRef(entities);
  const cellSizeRef = useRef(CELL_SIZE);

  // Aggiorna refs
  entitiesRef.current = entities;
  cellSizeRef.current = CELL_SIZE;

  const dispatchAction = (action: string) => {
    if (gameEngineRef.current && !gameOver) {
      gameEngineRef.current.dispatch({ type: action });
    }
  };

  const startShooting = () => {
    if (!gameOver && !shootIntervalRef.current) {
      dispatchAction('shoot');
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

  // Aggiorna posizione nave in base al tocco
  const updateShipPosition = (pageX: number) => {
    const touchX = pageX - gameViewX.current;
    const gameX = touchX / cellSizeRef.current;
    // Centro la nave sul dito (larghezza nave = 1.8)
    const shipX = gameX - 0.9;

    if (entitiesRef.current?.game) {
      entitiesRef.current.game.targetShipX = Math.max(0, Math.min(GAME_WIDTH - 1.8, shipX));
    }
  };

  // PanResponder per movimento fluido + sparo
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        startShooting();
        updateShipPosition(evt.nativeEvent.pageX);
      },
      onPanResponderMove: (evt) => {
        updateShipPosition(evt.nativeEvent.pageX);
      },
      onPanResponderRelease: () => {
        stopShooting();
      },
      onPanResponderTerminate: () => {
        stopShooting();
      },
    })
  ).current;

  const handleEvent = (event: any) => {
    if (event.type === 'game-over') {
      setGameOver(true);
      playFeedback('gameOver');
    } else if (event.type === 'score-update') {
      setScore(event.score);
    } else if (event.type === 'lives-update') {
      setLives(event.lives);
    } else if (event.type === 'player-hit') {
      playFeedback('hit');
    } else if (event.type === 'enemy-destroyed') {
      playFeedback('enemyDestroyed');
    }
  };

  const resetGame = () => {
    setScore(0);
    setLives(3);
    setGameOver(false);
    const newEntities = initializeGame(CELL_SIZE, GAME_AREA_HEIGHT);
    setEntities(newEntities);
  };

  // Overlay Game Over
  const gameOverOverlay = gameOver ? (
    <GameOverScreen
      game="galaxy"
      score={score}
      onPlayAgain={resetGame}
    />
  ) : null;

  // Genera stringa vite con cuori
  const livesDisplay = '❤️'.repeat(lives) + '🖤'.repeat(Math.max(0, 3 - lives));

  return (
    <GameLayout
      title="GALAXY SHOOTER"
      accentColor="#00D4FF"
      showScore={true}
      scoreItems={[
        { label: 'SCORE', value: score },
        { label: 'LIVES', value: livesDisplay },
      ]}
      overlay={gameOverOverlay}
    >
      <View
        style={[styles.gameContainer, {
          width: SCREEN_WIDTH,
          height: GAME_AREA_HEIGHT,
        }]}
        onLayout={(evt) => {
          gameViewX.current = 0;
        }}
      >
        <GameEngine
          key={gameOver ? 'game-over' : 'running'}
          ref={gameEngineRef}
          style={[styles.gameEngine, {
            width: SCREEN_WIDTH,
            height: GAME_AREA_HEIGHT
          }]}
          systems={[GameLoop]}
          entities={entities}
          running={!gameOver}
          onEvent={handleEvent}
        />

        {/* Area touch su tutto lo schermo di gioco */}
        <View
          {...panResponder.panHandlers}
          style={[styles.touchArea, {
            width: SCREEN_WIDTH,
            height: GAME_AREA_HEIGHT,
          }]}
        />
      </View>
    </GameLayout>
  );
}

const styles = StyleSheet.create({
  gameContainer: {
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  gameEngine: {
    backgroundColor: '#000',
  },
  touchArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
});
