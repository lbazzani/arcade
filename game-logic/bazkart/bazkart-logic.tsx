// Baz Kart - Top-down racing game
// Clean visuals with proper AI behavior

import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import {
  Track,
  DEFAULT_TRACK,
  getCurveAtPosition,
} from './track-data';

// Game constants
const TRACK_WIDTH = 160;
const KART_WIDTH = 32;
const KART_HEIGHT = 48;

// Physics - tuned for competitive racing
const PHYSICS = {
  MAX_SPEED: 3.5,
  ACCELERATION: 0.04,
  STEERING_SPEED: 0.055,
  FRICTION: 0.008,
  OFF_ROAD_FRICTION: 0.06,
  SPIN_DURATION: 1200,
  BOOST_MULTIPLIER: 1.4,
  BOOST_DURATION: 2000,
  AI_MAX_SPEED: 3.6,      // AI can be slightly faster than player
};

// Item types
export type ItemType = 'boost' | 'shell' | 'banana' | 'shield' | 'star';

// Kart interface
interface Kart {
  id: string;
  isPlayer: boolean;
  color: string;
  trackPosition: number;
  roadPosition: number; // -1 to 1
  speed: number;
  item: ItemType | null;
  isSpinning: boolean;
  spinTimer: number;
  boostTimer: number;
  shieldTimer: number;
  invincibleTimer: number;
  lap: number;
  finished: boolean;
  finishTime: number;
  position: number;
  aiTargetRoadPos: number;
  aiSkill: number;
}

// Projectile
interface Projectile {
  id: string;
  trackPosition: number;
  roadPosition: number;
  ownerId: string;
}

// Dropped item
interface DroppedItem {
  id: string;
  trackPosition: number;
  roadPosition: number;
}

// Dynamic item box
interface DynamicItemBox {
  id: string;
  trackPosition: number;
  roadPosition: number;
  collected: boolean;
  respawnTime: number; // When to respawn (0 = available)
}

// Game state
interface BazKartState {
  raceStarted: boolean;
  raceFinished: boolean;
  countdown: number;
  raceTime: number;
  playerKart: Kart;
  aiKarts: Kart[];
  track: Track;
  projectiles: Projectile[];
  droppedItems: DroppedItem[];
  itemBoxes: DynamicItemBox[];
  frameCount: number;
  lastUpdate: number;
  lastBumpTime: number; // Cooldown for bump sound
  steerInput: number;
  useItemInput: boolean;
  gameWidth: number;
  gameHeight: number;
}

// Colors
const ROAD_COLOR = '#404040';
const GRASS_DARK = '#228B22';
const GRASS_LIGHT = '#2E9E2E';
const RUMBLE_RED = '#DD0000';
const RUMBLE_WHITE = '#EEEEEE';

const KART_COLORS = [
  '#FF6B35', // Player - Orange
  '#3498DB', // Blue
  '#E74C3C', // Red
  '#2ECC71', // Green
  '#F1C40F', // Yellow
  '#9B59B6', // Purple
];

// Create kart
const createKart = (
  id: string,
  isPlayer: boolean,
  startPosition: number,
  color: string,
  lanePosition: number,
  aiSkill: number = 0.7
): Kart => ({
  id,
  isPlayer,
  color,
  trackPosition: startPosition,
  roadPosition: lanePosition,
  speed: 0,
  item: null,
  isSpinning: false,
  spinTimer: 0,
  boostTimer: 0,
  shieldTimer: 0,
  invincibleTimer: 0,
  lap: 1,
  finished: false,
  finishTime: 0,
  position: 1,
  aiTargetRoadPos: lanePosition,
  aiSkill,
});

// Kart sprite component
const KartSprite = ({
  kart,
  x,
  y,
  scale,
  frameCount,
}: {
  kart: Kart;
  x: number;
  y: number;
  scale: number;
  frameCount: number;
}) => {
  const width = KART_WIDTH * scale;
  const height = KART_HEIGHT * scale;

  // Spinning animation
  const spinAngle = kart.isSpinning ? (frameCount * 18) % 360 : 0;

  // Star power rainbow
  const starColors = ['#FF0000', '#FF8800', '#FFFF00', '#00FF00', '#0088FF', '#8800FF'];
  const bodyColor = kart.invincibleTimer > 0 ? starColors[frameCount % 6] : kart.color;

  // Flicker when invincible
  const opacity = kart.invincibleTimer > 0 && frameCount % 3 === 0 ? 0.5 : 1;

  // Boost flames
  const showBoost = kart.boostTimer > 0 || kart.invincibleTimer > 0;

  // Shield
  const showShield = kart.shieldTimer > 0;

  return (
    <View
      style={{
        position: 'absolute',
        left: x - width / 2,
        top: y - height / 2,
        width: width,
        height: height,
        opacity,
        transform: [{ rotate: `${spinAngle}deg` }],
      }}
    >
      {/* Shield bubble */}
      {showShield && (
        <View
          style={{
            position: 'absolute',
            left: -width * 0.25,
            top: -height * 0.15,
            width: width * 1.5,
            height: height * 1.3,
            borderRadius: width * 0.75,
            borderWidth: 3,
            borderColor: '#00FFFF',
            backgroundColor: 'rgba(0, 255, 255, 0.2)',
          }}
        />
      )}

      {/* Shadow */}
      <View
        style={{
          position: 'absolute',
          left: 3,
          top: 5,
          width: width - 4,
          height: height - 6,
          backgroundColor: 'rgba(0,0,0,0.3)',
          borderRadius: 6,
        }}
      />

      {/* Kart body */}
      <View
        style={{
          position: 'absolute',
          left: 2,
          top: 4,
          width: width - 4,
          height: height - 8,
          backgroundColor: bodyColor,
          borderRadius: 8,
          borderWidth: 2,
          borderColor: 'rgba(0,0,0,0.4)',
        }}
      />

      {/* Cockpit */}
      <View
        style={{
          position: 'absolute',
          left: width * 0.2,
          top: 6,
          width: width * 0.6,
          height: height * 0.35,
          backgroundColor: '#1a1a1a',
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
        }}
      />

      {/* Front wheels */}
      <View style={{
        position: 'absolute',
        left: 0,
        top: height * 0.15,
        width: width * 0.22,
        height: height * 0.2,
        backgroundColor: '#111',
        borderRadius: 3,
      }} />
      <View style={{
        position: 'absolute',
        right: 0,
        top: height * 0.15,
        width: width * 0.22,
        height: height * 0.2,
        backgroundColor: '#111',
        borderRadius: 3,
      }} />

      {/* Rear wheels */}
      <View style={{
        position: 'absolute',
        left: 0,
        bottom: height * 0.08,
        width: width * 0.22,
        height: height * 0.22,
        backgroundColor: '#111',
        borderRadius: 3,
      }} />
      <View style={{
        position: 'absolute',
        right: 0,
        bottom: height * 0.08,
        width: width * 0.22,
        height: height * 0.22,
        backgroundColor: '#111',
        borderRadius: 3,
      }} />

      {/* Boost flames */}
      {showBoost && (
        <>
          <View style={{
            position: 'absolute',
            left: width * 0.15,
            bottom: -height * 0.2,
            width: width * 0.3,
            height: height * 0.25,
            backgroundColor: frameCount % 2 === 0 ? '#FF4400' : '#FFAA00',
            borderBottomLeftRadius: 10,
            borderBottomRightRadius: 10,
          }} />
          <View style={{
            position: 'absolute',
            right: width * 0.15,
            bottom: -height * 0.2,
            width: width * 0.3,
            height: height * 0.25,
            backgroundColor: frameCount % 2 === 0 ? '#FFAA00' : '#FF4400',
            borderBottomLeftRadius: 10,
            borderBottomRightRadius: 10,
          }} />
        </>
      )}

      {/* Player marker */}
      {kart.isPlayer && (
        <View style={{
          position: 'absolute',
          left: width * 0.15,
          top: -height * 0.35,
          width: width * 0.7,
          height: height * 0.28,
          backgroundColor: '#FFD700',
          borderRadius: 6,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 2,
          borderColor: '#CC9900',
        }}>
          <ThemedText style={{ fontSize: 10, fontWeight: '900', color: '#000' }}>
            YOU
          </ThemedText>
        </View>
      )}
    </View>
  );
};

// Item box - improved visuals with rainbow glow effect
const ItemBoxSprite = ({ x, y, size, frameCount, isCollected }: { x: number; y: number; size: number; frameCount: number; isCollected?: boolean }) => {
  if (isCollected) return null;

  const bounce = Math.sin(frameCount * 0.15) * 4;
  const rotation = frameCount * 2;
  const pulse = 1 + Math.sin(frameCount * 0.2) * 0.1;

  // Rainbow color cycle
  const hue = (frameCount * 3) % 360;
  const glowColor = `hsl(${hue}, 100%, 50%)`;

  return (
    <View style={{
      position: 'absolute',
      left: x - size / 2,
      top: y - size / 2 + bounce,
      width: size,
      height: size,
    }}>
      {/* Outer glow */}
      <View style={{
        position: 'absolute',
        left: -4,
        top: -4,
        width: size + 8,
        height: size + 8,
        backgroundColor: glowColor,
        borderRadius: 12,
        opacity: 0.4,
        transform: [{ scale: pulse }],
      }} />
      {/* Main box */}
      <View style={{
        width: size,
        height: size,
        backgroundColor: '#FFD700',
        borderRadius: 10,
        borderWidth: 3,
        borderColor: '#FFA500',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: glowColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 10,
        transform: [{ rotate: `${rotation}deg` }],
      }}>
        <ThemedText style={{
          fontSize: size * 0.55,
          fontWeight: '900',
          color: '#8B4513',
          textShadowColor: '#FFF',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 3,
        }}>
          ?
        </ThemedText>
      </View>
    </View>
  );
};

// Shell sprite
const ShellSprite = ({ x, y, size, frameCount }: { x: number; y: number; size: number; frameCount: number }) => (
  <View style={{
    position: 'absolute',
    left: x - size / 2,
    top: y - size / 2,
    width: size,
    height: size,
    backgroundColor: '#00CC00',
    borderRadius: size / 2,
    borderWidth: 3,
    borderColor: '#008800',
    transform: [{ rotate: `${frameCount * 10}deg` }],
  }} />
);

// Banana sprite
const BananaSprite = ({ x, y, size }: { x: number; y: number; size: number }) => (
  <View style={{
    position: 'absolute',
    left: x - size / 2,
    top: y - size * 0.3,
    width: size,
    height: size * 0.5,
    backgroundColor: '#FFDD00',
    borderRadius: size * 0.25,
    borderWidth: 2,
    borderColor: '#AA8800',
    transform: [{ rotate: '15deg' }],
  }} />
);

// Main game board - SOLID COLORS, NO STRIPES (prevents flickering)
const GameBoard = (props: any) => {
  const state = props as BazKartState;
  const { gameWidth, gameHeight, playerKart, aiKarts, track, frameCount, projectiles, droppedItems, itemBoxes } = state;

  const centerX = gameWidth / 2;
  const playerScreenY = gameHeight * 0.72;

  // Road edges
  const roadLeft = centerX - TRACK_WIDTH / 2;
  const roadRight = centerX + TRACK_WIDTH / 2;

  // Scroll speed for objects
  const scrollSpeed = 4;

  // Convert track position to screen Y
  const getScreenY = (trackPos: number): number => {
    return playerScreenY - (trackPos - playerKart.trackPosition) * scrollSpeed;
  };

  // Convert road position to screen X
  const getScreenX = (roadPos: number): number => {
    return centerX + roadPos * (TRACK_WIDTH / 2 - 20);
  };

  // Start line position
  const lapLength = track.totalLength;
  const currentLapStart = Math.floor(playerKart.trackPosition / lapLength) * lapLength;
  const nextLapStart = currentLapStart + lapLength;

  const startLineY1 = getScreenY(currentLapStart);
  const startLineY2 = getScreenY(nextLapStart);

  return (
    <View style={{
      width: gameWidth,
      height: gameHeight,
      backgroundColor: GRASS_DARK, // Solid grass color
      overflow: 'hidden',
    }}>
      {/* Road surface - solid color */}
      <View style={{
        position: 'absolute',
        left: roadLeft,
        top: 0,
        width: TRACK_WIDTH,
        height: gameHeight,
        backgroundColor: ROAD_COLOR,
      }} />

      {/* Left road edge - solid white line */}
      <View style={{
        position: 'absolute',
        left: roadLeft - 6,
        top: 0,
        width: 6,
        height: gameHeight,
        backgroundColor: '#FFFFFF',
      }} />

      {/* Right road edge - solid white line */}
      <View style={{
        position: 'absolute',
        left: roadRight,
        top: 0,
        width: 6,
        height: gameHeight,
        backgroundColor: '#FFFFFF',
      }} />

      {/* Center line - solid */}
      <View style={{
        position: 'absolute',
        left: centerX - 2,
        top: 0,
        width: 4,
        height: gameHeight,
        backgroundColor: '#FFFF00',
        opacity: 0.6,
      }} />

      {/* Start/finish lines */}
      {startLineY1 > -30 && startLineY1 < gameHeight + 30 && (
        <View style={{
          position: 'absolute',
          left: roadLeft,
          top: startLineY1 - 10,
          width: TRACK_WIDTH,
          height: 20,
          flexDirection: 'row',
        }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={{
              width: TRACK_WIDTH / 8,
              height: 20,
              backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#000000',
            }} />
          ))}
        </View>
      )}
      {startLineY2 > -30 && startLineY2 < gameHeight + 30 && (
        <View style={{
          position: 'absolute',
          left: roadLeft,
          top: startLineY2 - 10,
          width: TRACK_WIDTH,
          height: 20,
          flexDirection: 'row',
        }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={{
              width: TRACK_WIDTH / 8,
              height: 20,
              backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#000000',
            }} />
          ))}
        </View>
      )}

      {/* Dynamic Item boxes */}
      {itemBoxes && itemBoxes.filter(box => !box.collected).map((box) => {
        // Calculate screen position for current lap
        const lapLength = track.totalLength;
        const currentLap = playerKart.lap;

        // Try different lap offsets to find visible position
        const lapOffsets = [-1, 0, 1];
        for (const lapOffset of lapOffsets) {
          const boxAbsPos = box.trackPosition + (currentLap + lapOffset - 1) * lapLength;
          const y = getScreenY(boxAbsPos);

          if (y > -50 && y < gameHeight + 50) {
            return (
              <ItemBoxSprite
                key={`${box.id}-lap${currentLap + lapOffset}`}
                x={getScreenX(box.roadPosition)}
                y={y}
                size={34}
                frameCount={frameCount}
              />
            );
          }
        }
        return null;
      })}

      {/* Bananas */}
      {droppedItems.map((item, i) => {
        const y = getScreenY(item.trackPosition);
        if (y < -30 || y > gameHeight + 30) return null;
        return <BananaSprite key={`banana-${i}`} x={getScreenX(item.roadPosition)} y={y} size={24} />;
      })}

      {/* Shells */}
      {projectiles.map((proj, i) => {
        const y = getScreenY(proj.trackPosition);
        if (y < -30 || y > gameHeight + 30) return null;
        return <ShellSprite key={`shell-${i}`} x={getScreenX(proj.roadPosition)} y={y} size={20} frameCount={frameCount} />;
      })}

      {/* Karts - sorted by track position (further = behind) */}
      {[playerKart, ...aiKarts]
        .filter(k => {
          const y = getScreenY(k.trackPosition);
          return y > -100 && y < gameHeight + 100;
        })
        .sort((a, b) => a.trackPosition - b.trackPosition)
        .map(kart => {
          const y = getScreenY(kart.trackPosition);
          const x = getScreenX(kart.roadPosition);

          // Scale based on distance (further = smaller)
          const dist = kart.trackPosition - playerKart.trackPosition;
          const scale = dist > 0 ? Math.max(0.6, 1 - dist / 250) : Math.min(1.15, 1 - dist / 400);

          return (
            <KartSprite
              key={kart.id}
              kart={kart}
              x={x}
              y={y}
              scale={scale}
              frameCount={frameCount}
            />
          );
        })}

    </View>
  );
};

// Create item boxes along the track
const createItemBoxes = (track: Track): DynamicItemBox[] => {
  const boxes: DynamicItemBox[] = [];
  const lapLength = track.totalLength;

  // Create item box clusters at regular intervals
  const clusterPositions = [
    lapLength * 0.15,  // Early in lap
    lapLength * 0.35,  // Mid lap
    lapLength * 0.55,  // After halfway
    lapLength * 0.75,  // Late lap
    lapLength * 0.92,  // Near finish
  ];

  clusterPositions.forEach((pos, clusterIdx) => {
    // Each cluster has 3 boxes across the road
    const roadPositions = [-0.5, 0, 0.5];
    roadPositions.forEach((roadPos, boxIdx) => {
      boxes.push({
        id: `box-${clusterIdx}-${boxIdx}`,
        trackPosition: pos,
        roadPosition: roadPos,
        collected: false,
        respawnTime: 0,
      });
    });
  });

  return boxes;
};

// Initialize game
export const initializeGame = (gameWidth: number, gameHeight: number): any => {
  const track = DEFAULT_TRACK;

  // Player starts in middle lane at front
  const playerKart = createKart('player', true, track.startPositions[0], KART_COLORS[0], 0, 1);

  // AI karts start behind in fixed lanes (spread across the road)
  const aiKarts: Kart[] = [];
  const lanes = [-0.5, 0.5, -0.25, 0.25, 0]; // Spread across road width
  const skills = [0.98, 0.95, 0.90, 0.85, 0.80]; // More competitive AI

  for (let i = 1; i < 6; i++) {
    aiKarts.push(
      createKart(`ai-${i}`, false, track.startPositions[i], KART_COLORS[i], lanes[i - 1], skills[i - 1])
    );
  }

  // Create dynamic item boxes
  const itemBoxes = createItemBoxes(track);

  return {
    game: {
      raceStarted: false,
      raceFinished: false,
      countdown: 4,
      raceTime: 0,
      playerKart,
      aiKarts,
      track,
      projectiles: [],
      droppedItems: [],
      itemBoxes,
      frameCount: 0,
      lastUpdate: Date.now(),
      lastBumpTime: 0,
      steerInput: 0,
      useItemInput: false,
      gameWidth,
      gameHeight,
      renderer: GameBoard,
    },
  };
};

// Update kart physics
const updateKartPhysics = (kart: Kart, track: Track, steerInput: number, deltaTime: number, now: number): Kart => {
  const newKart = { ...kart };

  // Spinning state
  if (newKart.isSpinning) {
    if (now > newKart.spinTimer) {
      newKart.isSpinning = false;
    }
    newKart.speed *= 0.96;
    newKart.trackPosition += newKart.speed * deltaTime * 0.06;
    return newKart;
  }

  // Clear expired timers
  if (newKart.boostTimer > 0 && now > newKart.boostTimer) newKart.boostTimer = 0;
  if (newKart.shieldTimer > 0 && now > newKart.shieldTimer) newKart.shieldTimer = 0;
  if (newKart.invincibleTimer > 0 && now > newKart.invincibleTimer) newKart.invincibleTimer = 0;

  // Calculate max speed
  let maxSpeed = PHYSICS.MAX_SPEED;
  if (newKart.boostTimer > 0 || newKart.invincibleTimer > 0) {
    maxSpeed *= PHYSICS.BOOST_MULTIPLIER;
  }

  // Accelerate
  if (newKart.speed < maxSpeed) {
    newKart.speed += PHYSICS.ACCELERATION;
  }

  // Friction
  newKart.speed -= PHYSICS.FRICTION;

  // Off-road penalty
  if (Math.abs(newKart.roadPosition) > 1) {
    newKart.speed -= PHYSICS.OFF_ROAD_FRICTION;
    newKart.speed = Math.max(PHYSICS.MAX_SPEED * 0.3, newKart.speed);
  }

  // Steering
  newKart.roadPosition += steerInput * PHYSICS.STEERING_SPEED;

  // Curves push kart laterally
  const curve = getCurveAtPosition(track, newKart.trackPosition);
  newKart.roadPosition += curve * newKart.speed * 0.008;

  // Clamp road position
  newKart.roadPosition = Math.max(-1.3, Math.min(1.3, newKart.roadPosition));

  // Clamp speed
  newKart.speed = Math.max(0, Math.min(maxSpeed, newKart.speed));

  // Move forward
  newKart.trackPosition += newKart.speed * deltaTime * 0.06;

  // Lap detection
  if (newKart.trackPosition >= track.totalLength * newKart.lap) {
    newKart.lap++;
    if (newKart.lap > track.laps) {
      newKart.finished = true;
    }
  }

  return newKart;
};

// Update AI - Smooth, realistic racing behavior
const updateAI = (ai: Kart, track: Track, playerKart: Kart, allKarts: Kart[], deltaTime: number, now: number): Kart => {
  if (ai.finished || ai.isSpinning) {
    return updateKartPhysics(ai, track, 0, deltaTime, now);
  }

  const newKart = { ...ai };

  // AI has its own max speed (slightly slower than player)
  let aiMaxSpeed = PHYSICS.AI_MAX_SPEED * ai.aiSkill;

  // Update timers
  if (newKart.boostTimer > 0 && now > newKart.boostTimer) newKart.boostTimer = 0;
  if (newKart.shieldTimer > 0 && now > newKart.shieldTimer) newKart.shieldTimer = 0;
  if (newKart.invincibleTimer > 0 && now > newKart.invincibleTimer) newKart.invincibleTimer = 0;

  // Boost increases max speed
  if (newKart.boostTimer > 0 || newKart.invincibleTimer > 0) {
    aiMaxSpeed *= PHYSICS.BOOST_MULTIPLIER;
  }

  // Gradually accelerate to target speed
  if (newKart.speed < aiMaxSpeed) {
    newKart.speed += PHYSICS.ACCELERATION * 0.8; // Slightly slower acceleration
  } else {
    newKart.speed -= PHYSICS.FRICTION;
  }

  // AI steering: smoothly follow center of road with small variations
  // Each AI has a preferred lane based on their starting position
  const preferredLane = newKart.aiTargetRoadPos;

  // Small random drift to make movement more natural
  const drift = Math.sin(now * 0.001 + parseInt(newKart.id.replace('ai-', '')) * 2) * 0.1;
  const targetPos = preferredLane + drift;

  // Smooth steering towards target
  const posError = targetPos - newKart.roadPosition;
  const steerAmount = posError * 0.03; // Very gentle steering
  newKart.roadPosition += Math.max(-0.02, Math.min(0.02, steerAmount));

  // Keep on road
  newKart.roadPosition = Math.max(-0.85, Math.min(0.85, newKart.roadPosition));

  // Clamp speed
  newKart.speed = Math.max(0, Math.min(aiMaxSpeed, newKart.speed));

  // Move forward
  newKart.trackPosition += newKart.speed * deltaTime * 0.06;

  // Lap detection
  if (newKart.trackPosition >= track.totalLength * newKart.lap) {
    newKart.lap++;
    if (newKart.lap > track.laps) {
      newKart.finished = true;
    }
  }

  // Rubber-banding: AI adjusts speed based on player distance
  const distToPlayer = playerKart.trackPosition - newKart.trackPosition;
  if (distToPlayer > 100) {
    // Far behind - catch up a bit
    newKart.speed *= 1.01;
  } else if (distToPlayer < -100) {
    // Far ahead - slow down a bit
    newKart.speed *= 0.99;
  }

  return newKart;
};

// Check collisions - aggressive bumping that can push karts off-road!
const checkCollisions = (karts: Kart[], now: number): { karts: Kart[]; playerBumped: boolean } => {
  const result = karts.map(k => ({ ...k }));
  let playerBumped = false;

  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      const a = result[i];
      const b = result[j];

      // Skip if either is spinning
      if (a.isSpinning || b.isSpinning) continue;

      const trackDist = Math.abs(a.trackPosition - b.trackPosition);
      const roadDist = Math.abs(a.roadPosition - b.roadPosition);

      // Collision detection - larger hitbox for more action
      if (trackDist < 25 && roadDist < 0.35) {
        // Track if player is involved
        if (a.id === 'player' || b.id === 'player') {
          playerBumped = true;
        }

        // Calculate push based on relative speeds and positions
        const speedDiff = a.speed - b.speed;
        const pushDir = a.roadPosition > b.roadPosition ? 1 : -1;

        // Base push amount - stronger than before!
        let basePush = 0.15;

        // Speed bonus - faster kart pushes harder
        if (Math.abs(speedDiff) > 0.3) {
          basePush += Math.abs(speedDiff) * 0.1;
        }

        // Side collision - more dramatic push
        if (roadDist < 0.25) {
          basePush *= 1.5;
        }

        // Apply push - can go off-road!
        result[i].roadPosition += pushDir * basePush;
        result[j].roadPosition -= pushDir * basePush;

        // Slight speed reduction on collision
        result[i].speed *= 0.95;
        result[j].speed *= 0.95;

        // Random chance to spin out on hard collision
        if (basePush > 0.2 && Math.random() < 0.15) {
          // The kart pushed further is more likely to spin
          if (Math.abs(result[i].roadPosition) > Math.abs(result[j].roadPosition)) {
            if (!result[i].shieldTimer && !result[i].invincibleTimer) {
              result[i].isSpinning = true;
              result[i].spinTimer = now + PHYSICS.SPIN_DURATION * 0.7;
            }
          } else {
            if (!result[j].shieldTimer && !result[j].invincibleTimer) {
              result[j].isSpinning = true;
              result[j].spinTimer = now + PHYSICS.SPIN_DURATION * 0.7;
            }
          }
        }

        // Star power - always spins opponent
        if (a.invincibleTimer > 0 && !b.shieldTimer && !b.invincibleTimer) {
          result[j].isSpinning = true;
          result[j].spinTimer = now + PHYSICS.SPIN_DURATION;
          result[j].roadPosition -= pushDir * 0.3; // Extra push
        } else if (b.invincibleTimer > 0 && !a.shieldTimer && !a.invincibleTimer) {
          result[i].isSpinning = true;
          result[i].spinTimer = now + PHYSICS.SPIN_DURATION;
          result[i].roadPosition += pushDir * 0.3; // Extra push
        }
      }
    }
  }

  return { karts: result, playerBumped };
};

// Update positions
const updatePositions = (karts: Kart[]): Kart[] => {
  const sorted = [...karts].sort((a, b) => {
    if (a.finished !== b.finished) return a.finished ? -1 : 1;
    if (a.lap !== b.lap) return b.lap - a.lap;
    return b.trackPosition - a.trackPosition;
  });

  return karts.map(kart => ({
    ...kart,
    position: sorted.findIndex(k => k.id === kart.id) + 1,
  }));
};

// Use item
const useItem = (kart: Kart, projectiles: Projectile[], droppedItems: DroppedItem[], now: number): {
  kart: Kart;
  projectiles: Projectile[];
  droppedItems: DroppedItem[];
} => {
  if (!kart.item) return { kart, projectiles, droppedItems };

  const newKart = { ...kart };
  const newProj = [...projectiles];
  const newDropped = [...droppedItems];

  switch (kart.item) {
    case 'boost':
      newKart.boostTimer = now + PHYSICS.BOOST_DURATION;
      break;
    case 'shell':
      newProj.push({
        id: `shell-${now}`,
        trackPosition: kart.trackPosition + 30,
        roadPosition: kart.roadPosition,
        ownerId: kart.id,
      });
      break;
    case 'banana':
      newDropped.push({
        id: `banana-${now}`,
        trackPosition: kart.trackPosition - 20,
        roadPosition: kart.roadPosition,
      });
      break;
    case 'shield':
      newKart.shieldTimer = now + 5000;
      break;
    case 'star':
      newKart.invincibleTimer = now + 8000;
      newKart.boostTimer = now + 8000;
      break;
  }

  newKart.item = null;
  return { kart: newKart, projectiles: newProj, droppedItems: newDropped };
};

// Check item pickup from dynamic boxes
const checkItemPickupDynamic = (
  kart: Kart,
  itemBoxes: DynamicItemBox[],
  track: Track,
  now: number
): { item: ItemType | null; boxId: string | null } => {
  if (kart.item) return { item: null, boxId: null };

  const lapLength = track.totalLength;
  const currentLap = kart.lap;
  const kartAbsPos = kart.trackPosition;

  for (const box of itemBoxes) {
    if (box.collected) continue;

    // Calculate box position accounting for laps
    const boxAbsPos = box.trackPosition + (currentLap - 1) * lapLength;
    const prevLapBoxPos = box.trackPosition + (currentLap - 2) * lapLength;

    // Check current lap and previous lap positions
    const distCurrent = Math.abs(kartAbsPos - boxAbsPos);
    const distPrev = currentLap > 1 ? Math.abs(kartAbsPos - prevLapBoxPos) : Infinity;
    const dist = Math.min(distCurrent, distPrev);

    if (dist < 25 && Math.abs(kart.roadPosition - box.roadPosition) < 0.4) {
      // Generate random item based on position (worse position = better items)
      const r = Math.random();
      const bonus = (kart.position - 1) / 5; // 0 for 1st, 1 for 6th
      let item: ItemType;

      if (r < 0.25 + bonus * 0.15) item = 'boost';
      else if (r < 0.45 + bonus * 0.1) item = 'shell';
      else if (r < 0.65) item = 'banana';
      else if (r < 0.85 - bonus * 0.1) item = 'shield';
      else item = 'star'; // Rare, more likely for last places

      return { item, boxId: box.id };
    }
  }
  return { item: null, boxId: null };
};

// Update item boxes (respawn collected ones)
const updateItemBoxes = (boxes: DynamicItemBox[], now: number): DynamicItemBox[] => {
  const RESPAWN_DELAY = 5000; // 5 seconds to respawn

  return boxes.map(box => {
    if (box.collected && box.respawnTime > 0 && now >= box.respawnTime) {
      return { ...box, collected: false, respawnTime: 0 };
    }
    return box;
  });
};

// Mark box as collected
const collectBox = (boxes: DynamicItemBox[], boxId: string, now: number): DynamicItemBox[] => {
  const RESPAWN_DELAY = 5000;

  return boxes.map(box => {
    if (box.id === boxId) {
      return { ...box, collected: true, respawnTime: now + RESPAWN_DELAY };
    }
    return box;
  });
};

// Update projectiles
const updateProjectiles = (projectiles: Projectile[], karts: Kart[], track: Track, deltaTime: number): {
  projectiles: Projectile[];
  hitKartIds: string[];
} => {
  const hits: string[] = [];
  const remaining: Projectile[] = [];

  for (const proj of projectiles) {
    const newPos = proj.trackPosition + 8 * deltaTime * 0.06;
    let hit = false;

    for (const kart of karts) {
      if (kart.id === proj.ownerId || kart.shieldTimer > 0 || kart.invincibleTimer > 0) continue;
      if (Math.abs(kart.trackPosition - newPos) < 25 && Math.abs(kart.roadPosition - proj.roadPosition) < 0.35) {
        hits.push(kart.id);
        hit = true;
        break;
      }
    }

    if (!hit && newPos < track.totalLength * 4) {
      remaining.push({ ...proj, trackPosition: newPos });
    }
  }

  return { projectiles: remaining, hitKartIds: hits };
};

// Check banana hits
const checkBananaHits = (items: DroppedItem[], karts: Kart[]): {
  items: DroppedItem[];
  hitKartIds: string[];
} => {
  const hits: string[] = [];
  const remaining: DroppedItem[] = [];

  for (const item of items) {
    let hit = false;
    for (const kart of karts) {
      if (kart.shieldTimer > 0 || kart.invincibleTimer > 0) continue;
      if (Math.abs(kart.trackPosition - item.trackPosition) < 25 && Math.abs(kart.roadPosition - item.roadPosition) < 0.3) {
        hits.push(kart.id);
        hit = true;
        break;
      }
    }
    if (!hit) remaining.push(item);
  }

  return { items: remaining, hitKartIds: hits };
};

// Game loop
export const GameLoop = (entities: any, { events, dispatch }: any) => {
  const state = entities.game as BazKartState;
  const now = Date.now();
  const deltaTime = Math.min(50, now - state.lastUpdate);

  // Handle events
  if (events?.length) {
    for (const e of events) {
      if (e.type === 'steer') state.steerInput = e.value;
      else if (e.type === 'use-item') state.useItemInput = true;
    }
  }

  // Countdown
  if (state.countdown > 0) {
    const prevCountdown = Math.ceil(state.countdown);
    state.countdown -= deltaTime / 1000;
    const newCountdown = Math.ceil(state.countdown);

    // Emit countdown update when number changes
    if (newCountdown !== prevCountdown || state.countdown <= 0) {
      dispatch({ type: 'countdown-update', value: Math.max(0, state.countdown) });
    }

    if (state.countdown <= 0) {
      state.raceStarted = true;
      state.countdown = 0;
      dispatch({ type: 'race-start' });
    }
    state.lastUpdate = now;
    state.frameCount++;
    return entities;
  }

  // Race finished
  if (state.raceFinished) {
    state.lastUpdate = now;
    state.frameCount++;
    return entities;
  }

  state.raceTime += deltaTime;

  // Update item boxes (respawn collected ones)
  state.itemBoxes = updateItemBoxes(state.itemBoxes, now);

  // Update player
  state.playerKart = updateKartPhysics(state.playerKart, state.track, state.steerInput, deltaTime, now);

  // Item pickup from dynamic boxes
  const pickupResult = checkItemPickupDynamic(state.playerKart, state.itemBoxes, state.track, now);
  if (pickupResult.item && pickupResult.boxId) {
    state.playerKart.item = pickupResult.item;
    state.itemBoxes = collectBox(state.itemBoxes, pickupResult.boxId, now);
    dispatch({ type: 'item-pickup' });
  }

  // Use item
  if (state.useItemInput && state.playerKart.item) {
    const result = useItem(state.playerKart, state.projectiles, state.droppedItems, now);
    state.playerKart = result.kart;
    state.projectiles = result.projectiles;
    state.droppedItems = result.droppedItems;
    dispatch({ type: 'item-use' });
  }
  state.useItemInput = false;

  // Update AI - pass all karts for avoidance
  const allKarts = [state.playerKart, ...state.aiKarts];
  state.aiKarts = state.aiKarts.map(ai => updateAI(ai, state.track, state.playerKart, allKarts, deltaTime, now));

  // AI item usage with dynamic boxes
  state.aiKarts = state.aiKarts.map(ai => {
    if (!ai.item) {
      const aiPickup = checkItemPickupDynamic(ai, state.itemBoxes, state.track, now);
      if (aiPickup.item && aiPickup.boxId) {
        state.itemBoxes = collectBox(state.itemBoxes, aiPickup.boxId, now);
        return { ...ai, item: aiPickup.item };
      }
    } else if (Math.random() < 0.003) {
      const result = useItem(ai, state.projectiles, state.droppedItems, now);
      state.projectiles = result.projectiles;
      state.droppedItems = result.droppedItems;
      return result.kart;
    }
    return ai;
  });

  // Projectiles
  const projRes = updateProjectiles(state.projectiles, [state.playerKart, ...state.aiKarts], state.track, deltaTime);
  state.projectiles = projRes.projectiles;

  for (const id of projRes.hitKartIds) {
    if (id === 'player') {
      state.playerKart.isSpinning = true;
      state.playerKart.spinTimer = now + PHYSICS.SPIN_DURATION;
      dispatch({ type: 'player-hit' });
    } else {
      const idx = state.aiKarts.findIndex(k => k.id === id);
      if (idx >= 0) {
        state.aiKarts[idx].isSpinning = true;
        state.aiKarts[idx].spinTimer = now + PHYSICS.SPIN_DURATION;
      }
    }
  }

  // Bananas
  const bananaRes = checkBananaHits(state.droppedItems, [state.playerKart, ...state.aiKarts]);
  state.droppedItems = bananaRes.items;

  for (const id of bananaRes.hitKartIds) {
    if (id === 'player') {
      state.playerKart.isSpinning = true;
      state.playerKart.spinTimer = now + PHYSICS.SPIN_DURATION;
      dispatch({ type: 'player-hit' });
    } else {
      const idx = state.aiKarts.findIndex(k => k.id === id);
      if (idx >= 0) {
        state.aiKarts[idx].isSpinning = true;
        state.aiKarts[idx].spinTimer = now + PHYSICS.SPIN_DURATION;
      }
    }
  }

  // Kart collisions
  const collisionResult = checkCollisions([state.playerKart, ...state.aiKarts], now);
  state.playerKart = collisionResult.karts[0];
  state.aiKarts = collisionResult.karts.slice(1);

  // Dispatch bump event for haptic feedback (with cooldown to prevent spam)
  if (collisionResult.playerBumped && now - state.lastBumpTime > 300) {
    state.lastBumpTime = now;
    dispatch({ type: 'bump' });
  }

  // Positions
  const positioned = updatePositions([state.playerKart, ...state.aiKarts]);
  state.playerKart = positioned.find(k => k.id === 'player')!;
  state.aiKarts = positioned.filter(k => k.id !== 'player');

  // Check finish
  if (state.playerKart.finished && !state.raceFinished) {
    state.raceFinished = true;
    state.playerKart.finishTime = state.raceTime;
    dispatch({ type: 'race-over', position: state.playerKart.position, time: state.raceTime });
  }

  // Position update
  dispatch({
    type: 'position-update',
    position: state.playerKart.position,
    lap: Math.min(state.playerKart.lap, 3),
    time: state.raceTime,
    speed: state.playerKart.speed,
  });

  state.lastUpdate = now;
  state.frameCount++;

  return entities;
};

// Score calculation - balanced with other games (10-based scoring)
export const calculateScore = (position: number, raceTime: number, _laps: number): number => {
  // Position points: 1st=100, 2nd=70, 3rd=50, 4th=35, 5th=20, 6th=10
  const posPoints = [100, 70, 50, 35, 20, 10];
  const score = posPoints[position - 1] || 0;
  // Time bonus: up to 50 points for fast times (under 90 seconds)
  const timeBonus = Math.max(0, Math.floor((90000 - raceTime) / 2000));
  return Math.floor(score + timeBonus);
};
