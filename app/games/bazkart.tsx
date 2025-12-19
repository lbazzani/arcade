import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  PanResponder,
} from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import { ThemedText } from '@/components/themed-text';
import { GameLayout } from '@/components/game-layout';
import { GameOverScreen } from '@/components/game-over-screen';
import { useGameSounds } from '@/hooks/use-game-sounds';
import { useGameDimensions } from '@/hooks/use-game-dimensions';
import {
  initializeGame,
  GameLoop,
  calculateScore,
  ItemType,
} from '@/game-logic/bazkart/bazkart-logic';

const ACCENT_COLOR = '#FF6B35';

export default function BazKartScreen() {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, insets } = useGameDimensions();
  const { playFeedback } = useGameSounds();

  const GAME_WIDTH = SCREEN_WIDTH;
  const GAME_HEIGHT = SCREEN_HEIGHT * 0.65;

  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [position, setPosition] = useState(6);
  const [lap, setLap] = useState(1);
  const [raceTime, setRaceTime] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [item, setItem] = useState<ItemType | null>(null);
  const [countdown, setCountdown] = useState(4);
  const [gameKey, setGameKey] = useState(0);
  const [finalPosition, setFinalPosition] = useState(1);
  const [finalTime, setFinalTime] = useState(0);

  const gameEngineRef = useRef<any>(null);
  const steerValueRef = useRef(0);

  const getInitialEntities = useCallback(() => {
    return initializeGame(GAME_WIDTH, GAME_HEIGHT);
  }, [GAME_WIDTH, GAME_HEIGHT]);

  const [entities, setEntities] = useState(getInitialEntities);

  // Track touch start position for relative steering
  const touchStartX = useRef(0);
  const currentSteer = useRef(0);

  // Pan responder for steering - continuous left/right based on touch position
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,

        onPanResponderGrant: (evt) => {
          touchStartX.current = evt.nativeEvent.pageX;

          // Check if tap is in item area (top 100px)
          if (evt.nativeEvent.locationY < 80 && item) {
            if (gameEngineRef.current) {
              gameEngineRef.current.dispatch({ type: 'use-item' });
            }
          }
        },

        onPanResponderMove: (evt) => {
          // Calculate steer based on how far finger moved from start
          const currentX = evt.nativeEvent.pageX;
          const deltaX = currentX - touchStartX.current;

          // Dead zone - ignore small movements (natural finger tremor)
          const DEAD_ZONE = 12;
          let steerValue = 0;

          if (Math.abs(deltaX) > DEAD_ZONE) {
            // Subtract dead zone from movement, then scale to -1 to 1
            const effectiveDelta = deltaX - Math.sign(deltaX) * DEAD_ZONE;
            // 50px effective movement = full steer
            steerValue = Math.max(-1, Math.min(1, effectiveDelta / 50));
          }

          currentSteer.current = steerValue;

          if (gameEngineRef.current) {
            gameEngineRef.current.dispatch({ type: 'steer', value: steerValue });
          }
        },

        onPanResponderRelease: () => {
          currentSteer.current = 0;
          if (gameEngineRef.current) {
            gameEngineRef.current.dispatch({ type: 'steer', value: 0 });
          }
        },
      }),
    [item]
  );

  const handleEvent = (event: any) => {
    switch (event.type) {
      case 'countdown-update':
        setCountdown(event.value);
        break;

      case 'race-start':
        setCountdown(0);
        playFeedback('powerup');
        break;

      case 'position-update':
        setPosition(event.position);
        setLap(Math.min(event.lap, 3));
        setRaceTime(event.time);
        setSpeed(event.speed || 0);
        break;

      case 'item-pickup':
        playFeedback('coin');
        // Update item from game state
        if (entities.game) {
          setItem(entities.game.playerKart?.item || null);
        }
        break;

      case 'item-use':
        playFeedback('shoot');
        setItem(null);
        break;

      case 'player-hit':
        playFeedback('hit');
        break;

      case 'bump':
        playFeedback('stomp'); // Use stomp sound for collision bump
        break;

      case 'player-finished':
        setFinalPosition(event.position);
        break;

      case 'race-over':
        setGameOver(true);
        setFinalPosition(event.position);
        setFinalTime(event.time);
        setScore(calculateScore(event.position, event.time, 3));
        playFeedback(event.position <= 3 ? 'powerup' : 'gameOver');
        break;
    }

    // Sync item state
    if (entities.game?.playerKart) {
      setItem(entities.game.playerKart.item);
    }
  };

  const resetGame = () => {
    setScore(0);
    setGameOver(false);
    setPosition(6);
    setLap(1);
    setRaceTime(0);
    setSpeed(0);
    setItem(null);
    setCountdown(4);
    setGameKey(prev => prev + 1);
    setEntities(getInitialEntities());
  };

  // Format time as MM:SS.mmm
  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const millis = Math.floor((ms % 1000) / 10);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
  };

  // Get position suffix
  const getPositionSuffix = (pos: number): string => {
    if (pos === 1) return 'ST';
    if (pos === 2) return 'ND';
    if (pos === 3) return 'RD';
    return 'TH';
  };

  // Item icon
  const getItemIcon = (itemType: ItemType | null): string => {
    switch (itemType) {
      case 'boost': return '🚀';
      case 'shell': return '🟢';
      case 'banana': return '🍌';
      case 'shield': return '🛡️';
      case 'star': return '⭐';
      default: return '';
    }
  };

  const gameOverOverlay = gameOver ? (
    <GameOverScreen
      game="bazkart"
      score={score}
      isWin={finalPosition <= 3}
      onPlayAgain={resetGame}
    />
  ) : null;

  // Format speed as km/h (scaled for display, rounded to nearest 5 to reduce flickering)
  const rawSpeed = speed * 80;
  const displaySpeed = Math.round(rawSpeed / 5) * 5; // Round to nearest 5 km/h

  // HUD overlay - reorganized layout
  const hudOverlay = (
    <View style={styles.hud} pointerEvents="box-none">
      {/* Top row: Lap, Timer, Item */}
      <View style={styles.topRow}>
        {/* Left: Lap */}
        <View style={styles.lapBox}>
          <ThemedText style={styles.lapLabel}>LAP</ThemedText>
          <ThemedText style={styles.lapText}>{lap}/3</ThemedText>
        </View>

        {/* Center: Timer */}
        <View style={styles.timerBox}>
          <ThemedText style={styles.timerText}>{formatTime(raceTime)}</ThemedText>
        </View>

        {/* Right: Item box */}
        <TouchableOpacity
          style={[styles.itemBox, { borderColor: item ? ACCENT_COLOR : '#555' }]}
          onPress={() => {
            if (item && gameEngineRef.current) {
              gameEngineRef.current.dispatch({ type: 'use-item' });
            }
          }}
          activeOpacity={0.7}
        >
          {item ? (
            <ThemedText style={styles.itemIcon}>{getItemIcon(item)}</ThemedText>
          ) : (
            <ThemedText style={styles.itemEmpty}>?</ThemedText>
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom right: Position and Speed (no box) */}
      <View style={styles.bottomRight}>
        <View style={styles.positionDisplay}>
          <ThemedText style={styles.positionTextLarge}>{position}</ThemedText>
          <ThemedText style={styles.positionSuffix}>{getPositionSuffix(position)}</ThemedText>
        </View>
        <ThemedText style={styles.speedText}>{displaySpeed} km/h</ThemedText>
      </View>
    </View>
  );

  const controls = (
    <View style={styles.controlsContainer}>
      <ThemedText style={styles.controlsText}>
        TOUCH AND DRAG LEFT/RIGHT TO STEER
      </ThemedText>
    </View>
  );

  // Countdown overlay - displayed before race starts
  const countdownOverlay = countdown > 0 && !gameOver ? (
    <View style={styles.countdownOverlay} pointerEvents="none">
      <View style={[styles.countdownBox, { borderColor: countdown <= 1 ? '#00FF00' : '#FFD700' }]}>
        <ThemedText style={[styles.countdownText, { color: countdown <= 1 ? '#00FF00' : '#FFF' }]}>
          {countdown <= 1 ? 'GO!' : Math.ceil(countdown)}
        </ThemedText>
      </View>
    </View>
  ) : null;

  return (
    <GameLayout
      title="BAZ KART"
      accentColor={ACCENT_COLOR}
      score={score}
      showScore={false}
      controls={controls}
      overlay={gameOverOverlay || countdownOverlay}
    >
      <View
        style={[styles.gameContainer, { width: GAME_WIDTH, height: GAME_HEIGHT }]}
        {...panResponder.panHandlers}
      >
        <GameEngine
          key={gameKey}
          ref={gameEngineRef}
          style={[styles.gameEngine, { width: GAME_WIDTH, height: GAME_HEIGHT }]}
          systems={[GameLoop]}
          entities={entities}
          running={!gameOver}
          onEvent={handleEvent}
        />
        {hudOverlay}
      </View>
    </GameLayout>
  );
}

const styles = StyleSheet.create({
  gameContainer: {
    backgroundColor: '#87CEEB',
    overflow: 'hidden',
  },
  gameEngine: {
    backgroundColor: '#87CEEB',
  },
  controlsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  controlsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
    letterSpacing: 1,
    opacity: 0.8,
  },
  hud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bottomRight: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    alignItems: 'flex-end',
  },
  positionDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  positionTextLarge: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFD700',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    includeFontPadding: false,
    lineHeight: 48,
  },
  positionSuffix: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFD700',
    marginLeft: 4,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    includeFontPadding: false,
  },
  speedText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginTop: -4,
  },
  lapBox: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  lapLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#AAA',
    letterSpacing: 1,
  },
  lapText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
  timerBox: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    fontVariant: ['tabular-nums'],
  },
  itemBox: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 10,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemIcon: {
    fontSize: 26,
  },
  itemEmpty: {
    fontSize: 20,
    color: '#555',
    fontWeight: '700',
  },
  customGameOver: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  gameOverTitle: {
    fontSize: 26,
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
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 1000,
  },
  countdownBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 20,
    borderWidth: 4,
    minWidth: 120,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 64,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 70,
    includeFontPadding: false,
  },
});
