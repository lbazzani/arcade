import React from 'react';
import { View } from 'react-native';

export const GAME_WIDTH = 12;
export const GAME_HEIGHT = 16;

// Fisica ottimizzata per auto-runner
const GRAVITY = 0.018;
const JUMP_VELOCITY = -0.32;
const MOVE_SPEED = 0.055;
const ENEMY_SPEED = 0.012;

// Parametri piattaforme - calcolati per essere SEMPRE raggiungibili
// Con velocità 0.055 e salto 0.32, in un salto completo:
// - Tempo di volo: circa 35 frames
// - Distanza orizzontale: 0.055 * 35 = ~2 unità
// - Altezza massima: ~2.8 unità
const MAX_PLATFORM_HEIGHT_DIFF = 2.2;  // Massima differenza di altezza
const MIN_HORIZONTAL_GAP = 0.5;        // Gap minimo (quasi attaccate)
const MAX_HORIZONTAL_GAP = 2.0;        // Gap massimo (raggiungibile con salto)

const BAZ_SIZE = 1.0;
const ENEMY_SIZE = 0.8;
const COIN_SIZE = 0.5;
const PLATFORM_HEIGHT = 0.5;

interface Platform {
  x: number;
  y: number;
  width: number;
  id: string;
  type: 'ground' | 'grass' | 'stone' | 'wood';
}

interface Enemy {
  x: number;
  y: number;
  direction: number;
  platformId: string;
  id: string;
  isDead?: boolean;
  deathTimer?: number;
}

interface Coin {
  x: number;
  y: number;
  collected: boolean;
  id: string;
  floatOffset?: number;
}

interface QuestionBlock {
  x: number;
  y: number;
  id: string;
  hit: boolean;
  content: 'coin' | 'powerup';
  bounceTimer?: number;
}

interface Pipe {
  x: number;
  y: number;
  height: number;
  id: string;
}

interface PowerUp {
  x: number;
  y: number;
  type: 'mushroom' | 'star';
  id: string;
  collected: boolean;
  velocityY: number;
  direction: number;
}

interface GameState {
  bazX: number;
  bazY: number;
  bazVelocityY: number;
  isJumping: boolean;
  isOnGround: boolean;
  facingRight: boolean;
  jumpCount: number;  // Track jumps for double jump
  maxJumps: number;   // Allow double jump (default 2)
  isBig: boolean;     // Power-up state
  isInvincible: boolean;
  invincibleTimer: number;
  platforms: Platform[];
  enemies: Enemy[];
  coins: Coin[];
  questionBlocks: QuestionBlock[];
  pipes: Pipe[];
  powerUps: PowerUp[];
  score: number;
  lastUpdate: number;
  platformIdCounter: number;
  enemyIdCounter: number;
  coinIdCounter: number;
  blockIdCounter: number;
  pipeIdCounter: number;
  powerUpIdCounter: number;
  gameStarted: boolean;
  scrollOffset: number;
  distanceTraveled: number;
  graceFrames: number;
  frameCount: number;
}

// Palette colori vivace e moderna
const COLORS = {
  // Baz - Developer runner
  baz: {
    skin: '#FFE0BD',
    skinShadow: '#E8C4A0',
    hair: '#4A3728',
    shirt: '#00BCD4',      // Cyan tech
    shirtDark: '#0097A7',
    shorts: '#37474F',
    shortsDark: '#263238',
    shoes: '#F44336',
    shoesSole: '#FFFFFF',
    shoesHighlight: '#FF5722',
    headband: '#F44336',
    headbandDark: '#D32F2F',
    glasses: '#212121',
    glassesLens: 'rgba(66, 165, 245, 0.5)',
    eye: '#212121',
    eyeWhite: '#FFFFFF',
  },
  // Piattaforme
  platform: {
    grass: '#66BB6A',
    grassDark: '#43A047',
    grassLight: '#81C784',
    dirt: '#8D6E63',
    dirtDark: '#6D4C41',
    stone: '#78909C',
    stoneDark: '#546E7A',
    stoneLight: '#90A4AE',
    wood: '#A1887F',
    woodDark: '#8D6E63',
    woodLight: '#BCAAA4',
  },
  // Bug nemico
  bug: {
    body: '#B71C1C',
    bodyLight: '#E53935',
    shell: '#212121',
    shellLight: '#424242',
    eye: '#FF1744',
    eyeGlow: 'rgba(255, 23, 68, 0.5)',
    legs: '#1A1A1A',
    circuit: '#00E676',
    antenna: '#424242',
  },
  // Monete
  coin: {
    gold: '#FFD54F',
    goldLight: '#FFEB3B',
    goldDark: '#FFC107',
    shine: '#FFFFFF',
  },
  // Ambiente
  sky: {
    top: '#1565C0',
    middle: '#42A5F5',
    bottom: '#90CAF9',
  },
  ground: {
    top: '#66BB6A',
    middle: '#8D6E63',
    bottom: '#6D4C41',
  },
  // Decorazioni
  sun: {
    core: '#FFEB3B',
    glow: 'rgba(255, 235, 59, 0.4)',
    rays: 'rgba(255, 235, 59, 0.2)',
  },
  cloud: '#FFFFFF',
  cloudShadow: 'rgba(0, 0, 0, 0.08)',
  // Sfondo montagne
  mountain: {
    far: '#7986CB',
    mid: '#5C6BC0',
    near: '#3F51B5',
  },
};

// Baz - Runner di profilo con animazione corsa
const Baz = ({ x, y, isJumping, cellSize, frameCount, isBig, isInvincible }: {
  x: number;
  y: number;
  isJumping: boolean;
  cellSize: number;
  frameCount: number;
  isBig?: boolean;
  isInvincible?: boolean;
}) => {
  const scale = isBig ? 1.3 : 1;
  const w = cellSize * BAZ_SIZE * 0.7 * scale;
  const h = cellSize * BAZ_SIZE * 1.5 * scale;

  // Animazione corsa - alterna le gambe ogni 6 frames
  const runPhase = Math.floor(frameCount / 6) % 4;
  // 0: gamba destra avanti, 1: posizione neutra, 2: gamba sinistra avanti, 3: posizione neutra

  // Calcola rotazione gambe basata sulla fase
  const getBackLegRotation = () => {
    if (isJumping) return '-25deg';
    switch (runPhase) {
      case 0: return '30deg';    // Gamba posteriore indietro
      case 1: return '10deg';
      case 2: return '-20deg';   // Gamba posteriore avanti
      case 3: return '10deg';
      default: return '10deg';
    }
  };

  const getFrontLegRotation = () => {
    if (isJumping) return '30deg';
    switch (runPhase) {
      case 0: return '-30deg';   // Gamba anteriore avanti
      case 1: return '-10deg';
      case 2: return '25deg';    // Gamba anteriore indietro
      case 3: return '-10deg';
      default: return '-10deg';
    }
  };

  const getBackShoePosition = () => {
    if (isJumping) return { left: w * 0.0, bottom: h * 0.12 };
    switch (runPhase) {
      case 0: return { left: w * -0.1, bottom: h * 0.05 };
      case 1: return { left: w * 0.1, bottom: 0 };
      case 2: return { left: w * 0.3, bottom: 0 };
      case 3: return { left: w * 0.1, bottom: 0 };
      default: return { left: w * 0.1, bottom: 0 };
    }
  };

  const getFrontShoePosition = () => {
    if (isJumping) return { right: w * -0.15, bottom: h * 0.02 };
    switch (runPhase) {
      case 0: return { right: w * -0.2, bottom: 0 };
      case 1: return { right: w * 0.0, bottom: 0 };
      case 2: return { right: w * 0.15, bottom: h * 0.05 };
      case 3: return { right: w * 0.0, bottom: 0 };
      default: return { right: w * 0.0, bottom: 0 };
    }
  };

  // Lampeggio invincibilità
  const blinkOpacity = isInvincible ? (frameCount % 4 < 2 ? 1 : 0.3) : 1;

  return (
    <View style={{
      position: 'absolute',
      left: x * cellSize - w / 2,
      top: y * cellSize - h,
      width: w,
      height: h,
      opacity: blinkOpacity,
    }}>
      {/* Gamba posteriore (più scura, dietro) */}
      <View style={{
        position: 'absolute',
        left: w * 0.2,
        top: h * (isJumping ? 0.58 : 0.60),
        width: w * 0.35,
        height: h * (isJumping ? 0.28 : 0.26),
        backgroundColor: COLORS.baz.shortsDark,
        borderRadius: w * 0.12,
        transform: [{ rotate: getBackLegRotation() }],
      }} />

      {/* Scarpa posteriore */}
      <View style={{
        position: 'absolute',
        left: getBackShoePosition().left,
        bottom: getBackShoePosition().bottom,
        width: w * 0.5,
        height: h * 0.1,
        backgroundColor: '#C62828',
        borderRadius: w * 0.1,
        transform: [{ rotate: isJumping ? '-15deg' : '0deg' }],
      }}>
        <View style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          height: '40%',
          backgroundColor: '#EEE',
          borderBottomLeftRadius: w * 0.1,
          borderBottomRightRadius: w * 0.1,
        }} />
      </View>

      {/* Gamba anteriore */}
      <View style={{
        position: 'absolute',
        left: w * 0.35,
        top: h * (isJumping ? 0.55 : 0.60),
        width: w * 0.35,
        height: h * (isJumping ? 0.22 : 0.26),
        backgroundColor: COLORS.baz.shorts,
        borderRadius: w * 0.12,
        transform: [{ rotate: getFrontLegRotation() }],
      }} />

      {/* Scarpa anteriore */}
      <View style={{
        position: 'absolute',
        right: getFrontShoePosition().right,
        bottom: getFrontShoePosition().bottom,
        width: w * 0.55,
        height: h * 0.11,
        backgroundColor: COLORS.baz.shoes,
        borderRadius: w * 0.1,
        transform: [{ rotate: isJumping ? '10deg' : '0deg' }],
      }}>
        <View style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          height: '40%',
          backgroundColor: COLORS.baz.shoesSole,
          borderBottomLeftRadius: w * 0.1,
          borderBottomRightRadius: w * 0.1,
        }} />
        {/* Dettaglio scarpa */}
        <View style={{
          position: 'absolute',
          right: w * 0.08,
          top: '25%',
          width: w * 0.12,
          height: '35%',
          backgroundColor: COLORS.baz.shoesHighlight,
          borderRadius: w * 0.05,
        }} />
      </View>

      {/* Corpo/Maglietta - di profilo */}
      <View style={{
        position: 'absolute',
        left: w * 0.15,
        top: h * 0.32,
        width: w * 0.7,
        height: h * 0.32,
        backgroundColor: COLORS.baz.shirt,
        borderRadius: w * 0.2,
        borderWidth: 1,
        borderColor: COLORS.baz.shirtDark,
      }}>
        {/* Numero sulla schiena */}
        <View style={{
          position: 'absolute',
          left: '30%', top: '25%',
          width: w * 0.2, height: h * 0.12,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            width: w * 0.04,
            height: h * 0.1,
            backgroundColor: '#FFF',
            borderRadius: 1,
          }} />
        </View>
      </View>

      {/* Braccio posteriore - animato con la corsa */}
      <View style={{
        position: 'absolute',
        left: w * 0.1,
        top: h * 0.38,
        width: w * 0.2,
        height: h * 0.18,
        backgroundColor: COLORS.baz.skinShadow,
        borderRadius: w * 0.1,
        transform: [{ rotate: isJumping ? '45deg' : `${-40 + runPhase * 20}deg` }],
      }} />

      {/* Braccio anteriore - animato con la corsa */}
      <View style={{
        position: 'absolute',
        right: w * 0.05,
        top: h * 0.36,
        width: w * 0.22,
        height: h * 0.18,
        backgroundColor: COLORS.baz.skin,
        borderRadius: w * 0.1,
        transform: [{ rotate: isJumping ? '-45deg' : `${40 - runPhase * 20}deg` }],
      }} />

      {/* Testa di profilo */}
      <View style={{
        position: 'absolute',
        left: w * 0.15,
        top: h * 0.03,
        width: w * 0.75,
        height: h * 0.32,
        backgroundColor: COLORS.baz.skin,
        borderTopLeftRadius: w * 0.35,
        borderTopRightRadius: w * 0.25,
        borderBottomLeftRadius: w * 0.2,
        borderBottomRightRadius: w * 0.35,
      }} />

      {/* Capelli di profilo */}
      <View style={{
        position: 'absolute',
        left: w * 0.1,
        top: h * 0.0,
        width: w * 0.6,
        height: h * 0.14,
        backgroundColor: COLORS.baz.hair,
        borderTopLeftRadius: w * 0.3,
        borderTopRightRadius: w * 0.15,
        borderBottomLeftRadius: w * 0.1,
      }} />

      {/* Ciuffo che sventola - animato */}
      <View style={{
        position: 'absolute',
        left: w * 0.0,
        top: h * 0.02,
        width: w * 0.25,
        height: h * 0.08,
        backgroundColor: COLORS.baz.hair,
        borderRadius: w * 0.1,
        transform: [{ rotate: `${-25 + Math.sin(frameCount * 0.3) * 10}deg` }],
      }} />

      {/* Fascia */}
      <View style={{
        position: 'absolute',
        left: w * 0.08,
        top: h * 0.1,
        width: w * 0.75,
        height: h * 0.045,
        backgroundColor: COLORS.baz.headband,
        borderRadius: w * 0.02,
      }}>
        {/* Fiocco della fascia che sventola - animato */}
        <View style={{
          position: 'absolute',
          left: -w * 0.15,
          top: h * 0.01,
          width: w * 0.2,
          height: h * 0.025,
          backgroundColor: COLORS.baz.headband,
          borderRadius: w * 0.02,
          transform: [{ rotate: `${-15 + Math.sin(frameCount * 0.25) * 8}deg` }],
        }} />
        <View style={{
          position: 'absolute',
          left: -w * 0.12,
          top: h * 0.025,
          width: w * 0.15,
          height: h * 0.02,
          backgroundColor: COLORS.baz.headbandDark,
          borderRadius: w * 0.02,
          transform: [{ rotate: `${-25 + Math.sin(frameCount * 0.2) * 10}deg` }],
        }} />
      </View>

      {/* Orecchio */}
      <View style={{
        position: 'absolute',
        left: w * 0.18,
        top: h * 0.14,
        width: w * 0.12,
        height: h * 0.08,
        backgroundColor: COLORS.baz.skin,
        borderRadius: w * 0.06,
        borderWidth: 1,
        borderColor: COLORS.baz.skinShadow,
      }} />

      {/* Occhio (uno solo, di profilo) */}
      <View style={{
        position: 'absolute',
        right: w * 0.18,
        top: h * 0.14,
        width: w * 0.18,
        height: h * 0.07,
        backgroundColor: COLORS.baz.eyeWhite,
        borderRadius: w * 0.08,
      }}>
        {/* Pupilla */}
        <View style={{
          position: 'absolute',
          right: w * 0.02,
          top: '20%',
          width: '40%',
          height: '60%',
          backgroundColor: COLORS.baz.eye,
          borderRadius: 100,
        }} />
        {/* Riflesso */}
        <View style={{
          position: 'absolute',
          right: w * 0.04,
          top: '25%',
          width: '15%',
          height: '25%',
          backgroundColor: '#FFF',
          borderRadius: 100,
        }} />
      </View>

      {/* Sopracciglio */}
      <View style={{
        position: 'absolute',
        right: w * 0.15,
        top: h * 0.11,
        width: w * 0.2,
        height: h * 0.02,
        backgroundColor: COLORS.baz.hair,
        borderRadius: w * 0.02,
        transform: [{ rotate: '-5deg' }],
      }} />

      {/* Naso di profilo */}
      <View style={{
        position: 'absolute',
        right: w * 0.02,
        top: h * 0.17,
        width: w * 0.12,
        height: h * 0.06,
        backgroundColor: COLORS.baz.skin,
        borderTopRightRadius: w * 0.08,
        borderBottomRightRadius: w * 0.03,
      }} />

      {/* Bocca/Sorriso */}
      <View style={{
        position: 'absolute',
        right: w * 0.12,
        top: h * 0.26,
        width: w * 0.15,
        height: h * 0.025,
        borderBottomWidth: 2,
        borderBottomColor: '#D32F2F',
        borderBottomRightRadius: w * 0.08,
      }} />
    </View>
  );
};

// Piattaforma con diversi stili
const PlatformBlock = ({ x, y, width, type, cellSize }: { x: number; y: number; width: number; type: string; cellSize: number }) => {
  const pw = width * cellSize;
  const ph = PLATFORM_HEIGHT * cellSize;

  const colors = type === 'stone'
    ? { top: COLORS.platform.stoneLight, main: COLORS.platform.stone, dark: COLORS.platform.stoneDark }
    : type === 'wood'
    ? { top: COLORS.platform.woodLight, main: COLORS.platform.wood, dark: COLORS.platform.woodDark }
    : { top: COLORS.platform.grassLight, main: COLORS.platform.grass, dark: COLORS.platform.grassDark };

  return (
    <View style={{
      position: 'absolute',
      left: x * cellSize,
      top: y * cellSize,
      width: pw,
      height: ph * 2.5,
    }}>
      {/* Ombra */}
      <View style={{
        position: 'absolute',
        left: 3, top: 3,
        width: pw, height: ph * 2,
        backgroundColor: 'rgba(0,0,0,0.15)',
        borderRadius: cellSize * 0.15,
      }} />

      {/* Blocco principale */}
      <View style={{
        position: 'absolute',
        left: 0, top: ph * 0.4,
        width: pw, height: ph * 1.8,
        backgroundColor: COLORS.platform.dirt,
        borderRadius: cellSize * 0.1,
        borderWidth: 2,
        borderColor: COLORS.platform.dirtDark,
        overflow: 'hidden',
      }}>
        {/* Pattern texture */}
        {Array.from({ length: Math.ceil(width) + 1 }).map((_, i) => (
          <View key={i} style={{
            position: 'absolute',
            left: i * cellSize - (i % 2 === 0 ? 0 : cellSize * 0.5),
            top: 0,
            width: 1,
            height: '100%',
            backgroundColor: COLORS.platform.dirtDark,
            opacity: 0.2,
          }} />
        ))}
      </View>

      {/* Superficie superiore (erba/pietra/legno) */}
      <View style={{
        position: 'absolute',
        left: 0, top: 0,
        width: pw, height: ph * 0.8,
        backgroundColor: colors.main,
        borderTopLeftRadius: cellSize * 0.15,
        borderTopRightRadius: cellSize * 0.15,
        borderWidth: 2,
        borderColor: colors.dark,
        overflow: 'hidden',
      }}>
        {/* Highlight */}
        <View style={{
          position: 'absolute',
          left: 0, top: 0,
          width: '100%', height: '40%',
          backgroundColor: colors.top,
          opacity: 0.5,
        }} />
        {/* Dettagli erba */}
        {type !== 'stone' && type !== 'wood' && Array.from({ length: Math.ceil(width * 2) }).map((_, i) => (
          <View key={i} style={{
            position: 'absolute',
            left: (i * cellSize * 0.5) + Math.random() * 4,
            top: -ph * 0.15,
            width: 3,
            height: ph * 0.3,
            backgroundColor: colors.dark,
            borderRadius: 2,
            transform: [{ rotate: `${-15 + Math.random() * 30}deg` }],
          }} />
        ))}
      </View>
    </View>
  );
};

// Bug nemico migliorato
const BugEnemy = ({ x, y, isDead, cellSize }: { x: number; y: number; isDead?: boolean; cellSize: number }) => {
  const w = cellSize * ENEMY_SIZE * 1.2;
  const h = cellSize * ENEMY_SIZE * (isDead ? 0.25 : 0.85);

  if (isDead) {
    return (
      <View style={{
        position: 'absolute',
        left: x * cellSize - w / 2,
        top: y * cellSize - h,
        width: w, height: h,
        backgroundColor: COLORS.bug.shell,
        borderRadius: w * 0.3,
        opacity: 0.5,
      }}>
        <View style={{
          position: 'absolute',
          left: '20%', top: '40%',
          width: '60%', height: 2,
          backgroundColor: COLORS.bug.circuit,
          opacity: 0.6,
        }} />
      </View>
    );
  }

  return (
    <View style={{
      position: 'absolute',
      left: x * cellSize - w / 2,
      top: y * cellSize - h,
      width: w, height: h,
    }}>
      {/* Ombra */}
      <View style={{
        position: 'absolute',
        left: 2, top: 2,
        width: w, height: h * 0.8,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: w * 0.4,
      }} />

      {/* Antenne */}
      <View style={{
        position: 'absolute',
        left: w * 0.25, top: -h * 0.18,
        width: 2, height: h * 0.25,
        backgroundColor: COLORS.bug.antenna,
        transform: [{ rotate: '-20deg' }],
      }} />
      <View style={{
        position: 'absolute',
        right: w * 0.25, top: -h * 0.18,
        width: 2, height: h * 0.25,
        backgroundColor: COLORS.bug.antenna,
        transform: [{ rotate: '20deg' }],
      }} />
      {/* Punte antenne */}
      <View style={{
        position: 'absolute',
        left: w * 0.18, top: -h * 0.25,
        width: 5, height: 5,
        backgroundColor: COLORS.bug.circuit,
        borderRadius: 3,
      }} />
      <View style={{
        position: 'absolute',
        right: w * 0.18, top: -h * 0.25,
        width: 5, height: 5,
        backgroundColor: COLORS.bug.circuit,
        borderRadius: 3,
      }} />

      {/* Corpo/Guscio */}
      <View style={{
        position: 'absolute',
        left: w * 0.05, top: h * 0.15,
        width: w * 0.9, height: h * 0.7,
        backgroundColor: COLORS.bug.shell,
        borderRadius: w * 0.4,
        borderWidth: 1,
        borderColor: '#000',
      }}>
        {/* Highlight */}
        <View style={{
          position: 'absolute',
          left: w * 0.1, top: h * 0.08,
          width: w * 0.25, height: h * 0.15,
          backgroundColor: COLORS.bug.shellLight,
          borderRadius: w * 0.1,
        }} />
        {/* Linea centrale */}
        <View style={{
          position: 'absolute',
          left: '48%', top: '15%',
          width: 2, height: '70%',
          backgroundColor: '#000',
        }} />
        {/* Circuiti */}
        <View style={{
          position: 'absolute',
          left: '15%', top: '55%',
          width: '25%', height: 2,
          backgroundColor: COLORS.bug.circuit,
        }} />
        <View style={{
          position: 'absolute',
          right: '15%', top: '55%',
          width: '25%', height: 2,
          backgroundColor: COLORS.bug.circuit,
        }} />
      </View>

      {/* Testa */}
      <View style={{
        position: 'absolute',
        left: w * 0.2, top: 0,
        width: w * 0.6, height: h * 0.38,
        backgroundColor: COLORS.bug.body,
        borderTopLeftRadius: w * 0.3,
        borderTopRightRadius: w * 0.3,
        borderBottomLeftRadius: w * 0.15,
        borderBottomRightRadius: w * 0.15,
      }}>
        <View style={{
          position: 'absolute',
          left: w * 0.08, top: h * 0.05,
          width: w * 0.15, height: h * 0.1,
          backgroundColor: COLORS.bug.bodyLight,
          borderRadius: w * 0.08,
          opacity: 0.6,
        }} />
      </View>

      {/* Glow occhi */}
      <View style={{
        position: 'absolute',
        left: w * 0.22, top: h * 0.08,
        width: w * 0.18, height: h * 0.18,
        backgroundColor: COLORS.bug.eyeGlow,
        borderRadius: w * 0.1,
      }} />
      <View style={{
        position: 'absolute',
        right: w * 0.22, top: h * 0.08,
        width: w * 0.18, height: h * 0.18,
        backgroundColor: COLORS.bug.eyeGlow,
        borderRadius: w * 0.1,
      }} />

      {/* Occhi */}
      <View style={{
        position: 'absolute',
        left: w * 0.25, top: h * 0.1,
        width: w * 0.14, height: h * 0.14,
        backgroundColor: COLORS.bug.eye,
        borderRadius: w * 0.07,
      }}>
        <View style={{
          position: 'absolute',
          left: '25%', top: '25%',
          width: '50%', height: '50%',
          backgroundColor: '#000',
          borderRadius: 100,
        }} />
        <View style={{
          position: 'absolute',
          left: '55%', top: '20%',
          width: '25%', height: '25%',
          backgroundColor: '#FFF',
          borderRadius: 100,
        }} />
      </View>
      <View style={{
        position: 'absolute',
        right: w * 0.25, top: h * 0.1,
        width: w * 0.14, height: h * 0.14,
        backgroundColor: COLORS.bug.eye,
        borderRadius: w * 0.07,
      }}>
        <View style={{
          position: 'absolute',
          left: '25%', top: '25%',
          width: '50%', height: '50%',
          backgroundColor: '#000',
          borderRadius: 100,
        }} />
        <View style={{
          position: 'absolute',
          left: '55%', top: '20%',
          width: '25%', height: '25%',
          backgroundColor: '#FFF',
          borderRadius: 100,
        }} />
      </View>

      {/* Zampe */}
      {[-1, 1].map(side => (
        <React.Fragment key={side}>
          <View style={{
            position: 'absolute',
            [side === -1 ? 'left' : 'right']: -w * 0.08,
            top: h * 0.35,
            width: w * 0.18, height: 3,
            backgroundColor: COLORS.bug.legs,
            transform: [{ rotate: `${side * 25}deg` }],
          }} />
          <View style={{
            position: 'absolute',
            [side === -1 ? 'left' : 'right']: -w * 0.1,
            top: h * 0.5,
            width: w * 0.2, height: 3,
            backgroundColor: COLORS.bug.legs,
            transform: [{ rotate: `${side * 10}deg` }],
          }} />
          <View style={{
            position: 'absolute',
            [side === -1 ? 'left' : 'right']: -w * 0.08,
            top: h * 0.65,
            width: w * 0.18, height: 3,
            backgroundColor: COLORS.bug.legs,
            transform: [{ rotate: `${side * -10}deg` }],
          }} />
        </React.Fragment>
      ))}
    </View>
  );
};

// Moneta animata
const CoinSprite = ({ x, y, cellSize, frame }: { x: number; y: number; cellSize: number; frame: number }) => {
  const size = cellSize * COIN_SIZE;
  const floatY = Math.sin(frame * 0.15) * 3;

  return (
    <View style={{
      position: 'absolute',
      left: x * cellSize - size / 2,
      top: y * cellSize - size / 2 + floatY,
      width: size, height: size * 1.1,
    }}>
      {/* Ombra */}
      <View style={{
        position: 'absolute',
        left: 1, top: 1,
        width: size, height: size * 1.1,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: size / 2,
      }} />
      {/* Moneta */}
      <View style={{
        position: 'absolute',
        left: 0, top: 0,
        width: size, height: size * 1.1,
        backgroundColor: COLORS.coin.gold,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: COLORS.coin.goldDark,
      }}>
        {/* Cerchio interno */}
        <View style={{
          position: 'absolute',
          left: '15%', top: '12%',
          width: '70%', height: '76%',
          backgroundColor: COLORS.coin.goldLight,
          borderRadius: size * 0.35,
          borderWidth: 1,
          borderColor: COLORS.coin.gold,
        }} />
        {/* Simbolo B */}
        <View style={{
          position: 'absolute',
          left: '38%', top: '28%',
          width: '24%', height: '44%',
          borderLeftWidth: 3,
          borderColor: COLORS.coin.goldDark,
        }} />
        <View style={{
          position: 'absolute',
          left: '38%', top: '28%',
          width: '20%', height: 3,
          backgroundColor: COLORS.coin.goldDark,
        }} />
        <View style={{
          position: 'absolute',
          left: '38%', top: '48%',
          width: '18%', height: 3,
          backgroundColor: COLORS.coin.goldDark,
        }} />
        <View style={{
          position: 'absolute',
          left: '38%', top: '68%',
          width: '20%', height: 3,
          backgroundColor: COLORS.coin.goldDark,
        }} />
        {/* Shine */}
        <View style={{
          position: 'absolute',
          left: '20%', top: '15%',
          width: '25%', height: '18%',
          backgroundColor: COLORS.coin.shine,
          borderRadius: size * 0.1,
          opacity: 0.7,
        }} />
      </View>
    </View>
  );
};

// Blocco ? (Question Block)
const QuestionBlockSprite = ({ x, y, hit, cellSize, frame }: {
  x: number;
  y: number;
  hit: boolean;
  cellSize: number;
  frame: number;
}) => {
  const size = cellSize * 1.0;
  // Bounce animation quando colpito
  const bounceY = hit ? 0 : Math.sin(frame * 0.1) * 2;

  return (
    <View style={{
      position: 'absolute',
      left: x * cellSize - size / 2,
      top: y * cellSize - size + bounceY,
      width: size,
      height: size,
    }}>
      {/* Ombra */}
      <View style={{
        position: 'absolute',
        left: 2, top: 2,
        width: size, height: size,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 4,
      }} />
      {/* Blocco */}
      <View style={{
        width: size,
        height: size,
        backgroundColor: hit ? '#8B4513' : '#FFD700',
        borderRadius: 4,
        borderWidth: 3,
        borderColor: hit ? '#5D3A1A' : '#DAA520',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}>
        {/* Pattern mattoni */}
        {!hit && (
          <>
            <View style={{
              position: 'absolute',
              left: 3, top: 3,
              width: size - 10, height: size - 10,
              backgroundColor: '#FFC107',
              borderRadius: 2,
            }} />
            {/* ? symbol */}
            <View style={{
              width: size * 0.4,
              height: size * 0.5,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <View style={{
                width: size * 0.35,
                height: size * 0.08,
                backgroundColor: '#8B4513',
                borderRadius: 2,
                position: 'absolute',
                top: 0,
              }} />
              <View style={{
                width: size * 0.1,
                height: size * 0.2,
                backgroundColor: '#8B4513',
                position: 'absolute',
                right: size * 0.05,
                top: size * 0.05,
              }} />
              <View style={{
                width: size * 0.12,
                height: size * 0.12,
                backgroundColor: '#8B4513',
                position: 'absolute',
                bottom: 0,
                borderRadius: size * 0.06,
              }} />
            </View>
          </>
        )}
        {/* Shine se non colpito */}
        {!hit && (
          <View style={{
            position: 'absolute',
            left: 4, top: 4,
            width: size * 0.3, height: size * 0.2,
            backgroundColor: 'rgba(255,255,255,0.5)',
            borderRadius: 2,
          }} />
        )}
      </View>
    </View>
  );
};

// Tubo (Pipe)
const PipeSprite = ({ x, y, height, cellSize }: {
  x: number;
  y: number;
  height: number;
  cellSize: number;
}) => {
  const w = cellSize * 1.5;
  const h = height * cellSize;
  const lipHeight = cellSize * 0.4;

  return (
    <View style={{
      position: 'absolute',
      left: x * cellSize - w / 2,
      top: y * cellSize - h,
      width: w,
      height: h,
    }}>
      {/* Corpo tubo */}
      <View style={{
        position: 'absolute',
        left: w * 0.1,
        top: lipHeight,
        width: w * 0.8,
        height: h - lipHeight,
        backgroundColor: '#2E7D32',
        borderWidth: 2,
        borderColor: '#1B5E20',
        borderTopWidth: 0,
      }}>
        {/* Highlight */}
        <View style={{
          position: 'absolute',
          left: 0, top: 0,
          width: '30%', height: '100%',
          backgroundColor: '#4CAF50',
        }} />
        {/* Ombra */}
        <View style={{
          position: 'absolute',
          right: 0, top: 0,
          width: '25%', height: '100%',
          backgroundColor: '#1B5E20',
        }} />
      </View>
      {/* Labbro superiore */}
      <View style={{
        position: 'absolute',
        left: 0, top: 0,
        width: w, height: lipHeight,
        backgroundColor: '#2E7D32',
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#1B5E20',
      }}>
        <View style={{
          position: 'absolute',
          left: 2, top: 2,
          width: w * 0.35, height: lipHeight - 6,
          backgroundColor: '#4CAF50',
          borderRadius: 2,
        }} />
      </View>
    </View>
  );
};

// Power-up (Mushroom/Star)
const PowerUpSprite = ({ x, y, type, cellSize, frame }: {
  x: number;
  y: number;
  type: 'mushroom' | 'star';
  cellSize: number;
  frame: number;
}) => {
  const size = cellSize * 0.8;
  const floatY = Math.sin(frame * 0.15) * 2;

  if (type === 'star') {
    // Stella dorata
    return (
      <View style={{
        position: 'absolute',
        left: x * cellSize - size / 2,
        top: y * cellSize - size + floatY,
        width: size,
        height: size,
      }}>
        {/* Glow */}
        <View style={{
          position: 'absolute',
          left: -size * 0.2, top: -size * 0.2,
          width: size * 1.4, height: size * 1.4,
          backgroundColor: 'rgba(255, 235, 59, 0.4)',
          borderRadius: size * 0.7,
        }} />
        {/* Stella - forma semplificata con box */}
        <View style={{
          width: size, height: size,
          backgroundColor: '#FFEB3B',
          borderRadius: size * 0.15,
          transform: [{ rotate: '45deg' }],
          borderWidth: 2,
          borderColor: '#FFC107',
        }}>
          <View style={{
            position: 'absolute',
            left: '30%', top: '30%',
            width: '15%', height: '15%',
            backgroundColor: '#000',
            borderRadius: 2,
          }} />
          <View style={{
            position: 'absolute',
            right: '30%', top: '30%',
            width: '15%', height: '15%',
            backgroundColor: '#000',
            borderRadius: 2,
          }} />
        </View>
      </View>
    );
  }

  // Fungo
  return (
    <View style={{
      position: 'absolute',
      left: x * cellSize - size / 2,
      top: y * cellSize - size + floatY,
      width: size,
      height: size,
    }}>
      {/* Gambo */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: size * 0.3,
        width: size * 0.4,
        height: size * 0.4,
        backgroundColor: '#FFECB3',
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 4,
        borderWidth: 1,
        borderColor: '#FFE082',
        borderTopWidth: 0,
      }} />
      {/* Cappello */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: size,
        height: size * 0.65,
        backgroundColor: '#E53935',
        borderTopLeftRadius: size * 0.5,
        borderTopRightRadius: size * 0.5,
        borderBottomLeftRadius: size * 0.15,
        borderBottomRightRadius: size * 0.15,
        borderWidth: 2,
        borderColor: '#C62828',
        overflow: 'hidden',
      }}>
        {/* Puntini bianchi */}
        <View style={{
          position: 'absolute',
          left: '15%', top: '20%',
          width: size * 0.25, height: size * 0.25,
          backgroundColor: '#FFF',
          borderRadius: size * 0.125,
        }} />
        <View style={{
          position: 'absolute',
          right: '15%', top: '25%',
          width: size * 0.2, height: size * 0.2,
          backgroundColor: '#FFF',
          borderRadius: size * 0.1,
        }} />
        <View style={{
          position: 'absolute',
          left: '40%', top: '10%',
          width: size * 0.15, height: size * 0.15,
          backgroundColor: '#FFF',
          borderRadius: size * 0.075,
        }} />
      </View>
      {/* Occhi */}
      <View style={{
        position: 'absolute',
        left: size * 0.25,
        top: size * 0.55,
        width: size * 0.12,
        height: size * 0.15,
        backgroundColor: '#000',
        borderRadius: 2,
      }} />
      <View style={{
        position: 'absolute',
        right: size * 0.25,
        top: size * 0.55,
        width: size * 0.12,
        height: size * 0.15,
        backgroundColor: '#000',
        borderRadius: 2,
      }} />
    </View>
  );
};

// Sole decorativo
const Sun = ({ cellSize }: { cellSize: number }) => {
  const size = cellSize * 2.2;
  return (
    <View style={{
      position: 'absolute',
      right: cellSize * 1.2,
      top: cellSize * 0.8,
    }}>
      {/* Raggi */}
      <View style={{
        position: 'absolute',
        left: -size * 0.4, top: -size * 0.4,
        width: size * 1.8, height: size * 1.8,
        backgroundColor: COLORS.sun.rays,
        borderRadius: size * 0.9,
      }} />
      {/* Glow */}
      <View style={{
        position: 'absolute',
        left: -size * 0.2, top: -size * 0.2,
        width: size * 1.4, height: size * 1.4,
        backgroundColor: COLORS.sun.glow,
        borderRadius: size * 0.7,
      }} />
      {/* Core */}
      <View style={{
        width: size, height: size,
        backgroundColor: COLORS.sun.core,
        borderRadius: size / 2,
      }} />
      {/* Highlight */}
      <View style={{
        position: 'absolute',
        left: size * 0.15, top: size * 0.15,
        width: size * 0.35, height: size * 0.28,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: size * 0.15,
      }} />
    </View>
  );
};

// Montagne sullo sfondo
const Mountains = ({ cellSize, offset }: { cellSize: number; offset: number }) => {
  const mountains = [
    { x: 0, h: 4, color: COLORS.mountain.far },
    { x: 4, h: 5, color: COLORS.mountain.mid },
    { x: 8, h: 3.5, color: COLORS.mountain.far },
    { x: 12, h: 4.5, color: COLORS.mountain.mid },
    { x: 16, h: 4, color: COLORS.mountain.far },
  ];

  return (
    <>
      {mountains.map((m, i) => {
        const baseX = ((m.x * cellSize - offset * 0.1) % (GAME_WIDTH * cellSize * 1.5)) - cellSize * 2;
        return (
          <View key={i} style={{
            position: 'absolute',
            left: baseX < -cellSize * 6 ? baseX + GAME_WIDTH * cellSize * 1.5 : baseX,
            bottom: cellSize * 1.5,
            width: 0, height: 0,
            borderLeftWidth: cellSize * 3,
            borderRightWidth: cellSize * 3,
            borderBottomWidth: cellSize * m.h,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: m.color,
            opacity: 0.6,
          }} />
        );
      })}
    </>
  );
};

// Nuvole
const Clouds = ({ cellSize, offset }: { cellSize: number; offset: number }) => {
  const clouds = [
    { x: 1, y: 2, s: 1.1 },
    { x: 6, y: 3, s: 0.8 },
    { x: 11, y: 2.5, s: 1 },
    { x: 4, y: 4.5, s: 0.7 },
    { x: 9, y: 3.5, s: 0.9 },
  ];

  return (
    <>
      {clouds.map((c, i) => {
        const w = cellSize * 2.2 * c.s;
        const h = cellSize * 1 * c.s;
        const cloudX = ((c.x * cellSize - offset * 0.25) % (GAME_WIDTH * cellSize + w * 2)) - w;

        return (
          <View key={i} style={{
            position: 'absolute',
            left: cloudX < -w ? cloudX + GAME_WIDTH * cellSize + w * 2 : cloudX,
            top: c.y * cellSize,
          }}>
            {/* Ombra */}
            <View style={{
              position: 'absolute',
              left: 2, top: 3,
              width: w, height: h * 0.8,
              backgroundColor: COLORS.cloudShadow,
              borderRadius: h * 0.4,
            }} />
            {/* Nuvola base */}
            <View style={{
              width: w, height: h * 0.8,
              backgroundColor: COLORS.cloud,
              borderRadius: h * 0.4,
            }} />
            {/* Bump superiori */}
            <View style={{
              position: 'absolute',
              left: w * 0.15, top: -h * 0.2,
              width: w * 0.35, height: h * 0.5,
              backgroundColor: COLORS.cloud,
              borderRadius: h * 0.25,
            }} />
            <View style={{
              position: 'absolute',
              left: w * 0.45, top: -h * 0.3,
              width: w * 0.4, height: h * 0.55,
              backgroundColor: COLORS.cloud,
              borderRadius: h * 0.28,
            }} />
          </View>
        );
      })}
    </>
  );
};

// Terra/Ground
const Ground = ({ cellSize }: { cellSize: number }) => {
  const h = cellSize * 1.5;

  return (
    <View style={{
      position: 'absolute',
      left: 0, bottom: 0, right: 0,
      height: h,
    }}>
      {/* Terra */}
      <View style={{
        position: 'absolute',
        left: 0, top: h * 0.3, right: 0, bottom: 0,
        backgroundColor: COLORS.ground.middle,
      }}>
        <View style={{
          position: 'absolute',
          left: 0, top: 0, right: 0, height: '30%',
          backgroundColor: COLORS.ground.bottom,
        }} />
      </View>
      {/* Erba */}
      <View style={{
        position: 'absolute',
        left: 0, top: 0, right: 0,
        height: h * 0.35,
        backgroundColor: COLORS.ground.top,
      }} />
    </View>
  );
};

// GameBoard principale
const GameBoard = (props: any) => {
  const {
    bazX, bazY, isJumping, isBig, isInvincible,
    platforms, enemies, coins, questionBlocks, pipes, powerUps,
    scrollOffset, cellSize, frameCount
  } = props;

  return (
    <View style={{
      width: GAME_WIDTH * cellSize,
      height: GAME_HEIGHT * cellSize,
      backgroundColor: COLORS.sky.bottom,
      overflow: 'hidden',
    }}>
      {/* Gradiente cielo */}
      <View style={{
        position: 'absolute',
        left: 0, top: 0, right: 0,
        height: GAME_HEIGHT * cellSize * 0.4,
        backgroundColor: COLORS.sky.top,
      }} />
      <View style={{
        position: 'absolute',
        left: 0, top: GAME_HEIGHT * cellSize * 0.3, right: 0,
        height: GAME_HEIGHT * cellSize * 0.35,
        backgroundColor: COLORS.sky.middle,
        opacity: 0.6,
      }} />

      {/* Sole */}
      <Sun cellSize={cellSize} />

      {/* Montagne */}
      <Mountains cellSize={cellSize} offset={scrollOffset} />

      {/* Nuvole */}
      <Clouds cellSize={cellSize} offset={scrollOffset} />

      {/* Terra */}
      <Ground cellSize={cellSize} />

      {/* Tubi */}
      {pipes && pipes.map((pipe: Pipe) => (
        <PipeSprite
          key={pipe.id}
          x={pipe.x - scrollOffset / cellSize}
          y={pipe.y}
          height={pipe.height}
          cellSize={cellSize}
        />
      ))}

      {/* Piattaforme */}
      {platforms.map((p: Platform) => (
        <PlatformBlock
          key={p.id}
          x={p.x - scrollOffset / cellSize}
          y={p.y}
          width={p.width}
          type={p.type}
          cellSize={cellSize}
        />
      ))}

      {/* Blocchi ? */}
      {questionBlocks && questionBlocks.map((block: QuestionBlock) => (
        <QuestionBlockSprite
          key={block.id}
          x={block.x - scrollOffset / cellSize}
          y={block.y}
          hit={block.hit}
          cellSize={cellSize}
          frame={frameCount}
        />
      ))}

      {/* Power-ups */}
      {powerUps && powerUps.filter((p: PowerUp) => !p.collected).map((powerUp: PowerUp) => (
        <PowerUpSprite
          key={powerUp.id}
          x={powerUp.x - scrollOffset / cellSize}
          y={powerUp.y}
          type={powerUp.type}
          cellSize={cellSize}
          frame={frameCount}
        />
      ))}

      {/* Monete */}
      {coins.filter((c: Coin) => !c.collected).map((coin: Coin) => (
        <CoinSprite
          key={coin.id}
          x={coin.x - scrollOffset / cellSize}
          y={coin.y}
          cellSize={cellSize}
          frame={frameCount}
        />
      ))}

      {/* Nemici */}
      {enemies.map((enemy: Enemy) => (
        <BugEnemy
          key={enemy.id}
          x={enemy.x - scrollOffset / cellSize}
          y={enemy.y}
          isDead={enemy.isDead}
          cellSize={cellSize}
        />
      ))}

      {/* Baz */}
      <Baz
        x={bazX - scrollOffset / cellSize}
        y={bazY}
        isJumping={isJumping}
        cellSize={cellSize}
        frameCount={frameCount}
        isBig={isBig}
        isInvincible={isInvincible}
      />
    </View>
  );
};

// Generazione piattaforme GARANTITE raggiungibili
const generateReachablePlatform = (
  prevX: number,
  prevY: number,
  prevWidth: number,
  platformId: number,
  mustBeReachableFromGround: boolean = false
): Platform => {
  const GROUND_Y = GAME_HEIGHT - 1.5;

  // Se deve essere raggiungibile dal terreno, parti da lì
  const startY = mustBeReachableFromGround ? GROUND_Y : prevY;
  const startX = prevX + prevWidth;

  // Gap orizzontale piccolo per essere sempre raggiungibile
  const horizontalGap = MIN_HORIZONTAL_GAP + Math.random() * (MAX_HORIZONTAL_GAP - MIN_HORIZONTAL_GAP);
  const newX = startX + horizontalGap;

  // Variazione di altezza conservativa
  // Più il gap è grande, meno può salire
  const gapRatio = horizontalGap / MAX_HORIZONTAL_GAP;
  const maxRise = MAX_PLATFORM_HEIGHT_DIFF * (1 - gapRatio * 0.6);

  // Può salire fino a maxRise o scendere fino a 1.5
  let heightChange: number;
  if (mustBeReachableFromGround) {
    // Prima piattaforma: sempre leggermente sopra il terreno
    heightChange = -(1 + Math.random() * 1.5);
  } else {
    // Preferisci rimanere alla stessa altezza o scendere leggermente
    heightChange = -maxRise * 0.5 + Math.random() * (maxRise * 0.5 + 1.5);
  }

  let newY = startY + heightChange;

  // Limiti sicuri
  const minY = 5;  // Non troppo in alto
  const maxY = GAME_HEIGHT - 3;  // Non troppo vicino al terreno
  newY = Math.max(minY, Math.min(maxY, newY));

  // Larghezza piattaforma - più larghe per essere più facili
  const newWidth = 2.5 + Math.random() * 2;

  // Tipo casuale
  const types: Array<'grass' | 'stone' | 'wood'> = ['grass', 'stone', 'wood'];
  const type = types[Math.floor(Math.random() * types.length)];

  return {
    x: newX,
    y: newY,
    width: newWidth,
    id: `platform-${platformId}`,
    type,
  };
};

// Genera configurazione iniziale
const generateInitialPlatforms = (): {
  platforms: Platform[],
  enemies: Enemy[],
  coins: Coin[],
  questionBlocks: QuestionBlock[],
  pipes: Pipe[],
  powerUps: PowerUp[]
} => {
  const platforms: Platform[] = [];
  const enemies: Enemy[] = [];
  const coins: Coin[] = [];
  const questionBlocks: QuestionBlock[] = [];
  const pipes: Pipe[] = [];
  const powerUps: PowerUp[] = [];

  let platformId = 0;
  let enemyId = 0;
  let coinId = 0;
  let blockId = 0;
  let pipeId = 0;

  // Piattaforma terra lunga
  const groundPlatform: Platform = {
    x: -3,
    y: GAME_HEIGHT - 1.5,
    width: 30,
    id: `platform-${platformId++}`,
    type: 'ground',
  };
  platforms.push(groundPlatform);

  // Prima piattaforma aerea - facilmente raggiungibile dalla terra
  let lastX = 10;
  let lastY = GAME_HEIGHT - 3.5;
  let lastWidth = 3.5;

  const firstPlatform: Platform = {
    x: lastX,
    y: lastY,
    width: lastWidth,
    id: `platform-${platformId++}`,
    type: 'grass',
  };
  platforms.push(firstPlatform);

  // Blocco ? sopra la prima piattaforma
  questionBlocks.push({
    x: firstPlatform.x + firstPlatform.width / 2,
    y: firstPlatform.y - 2.5,
    id: `block-${blockId++}`,
    hit: false,
    content: 'coin',
  });

  // Moneta sulla prima piattaforma
  coins.push({
    x: firstPlatform.x + firstPlatform.width / 2,
    y: firstPlatform.y - 1,
    collected: false,
    id: `coin-${coinId++}`,
  });

  // Primo tubo sulla terra
  pipes.push({
    x: 7,
    y: GAME_HEIGHT - 1.5,
    height: 2,
    id: `pipe-${pipeId++}`,
  });

  // Genera altre piattaforme
  for (let i = 0; i < 10; i++) {
    const newPlatform = generateReachablePlatform(lastX, lastY, lastWidth, platformId++);
    platforms.push(newPlatform);

    lastX = newPlatform.x;
    lastY = newPlatform.y;
    lastWidth = newPlatform.width;

    // Blocco ? (30% probabilità)
    if (Math.random() > 0.7) {
      questionBlocks.push({
        x: newPlatform.x + newPlatform.width / 2,
        y: newPlatform.y - 2.5,
        id: `block-${blockId++}`,
        hit: false,
        content: Math.random() > 0.7 ? 'powerup' : 'coin',
      });
    } else if (Math.random() > 0.3) {
      // Moneta (70% probabilità se non c'è blocco)
      coins.push({
        x: newPlatform.x + newPlatform.width / 2,
        y: newPlatform.y - 1,
        collected: false,
        id: `coin-${coinId++}`,
      });
    }

    // Nemico (35% probabilità, solo su piattaforme larghe) - aumentato per difficoltà
    if (Math.random() > 0.65 && newPlatform.width > 2.5) {
      enemies.push({
        x: newPlatform.x + newPlatform.width / 2,
        y: newPlatform.y,
        direction: Math.random() > 0.5 ? 1 : -1,
        platformId: newPlatform.id,
        id: `enemy-${enemyId++}`,
      });
    }
  }

  // Nemici sulla terra - più lontani dall'inizio
  for (let i = 0; i < 2; i++) {
    enemies.push({
      x: 18 + i * 15,  // Primo nemico a x=18 invece di x=6
      y: GAME_HEIGHT - 1.5,
      direction: -1,
      platformId: 'platform-0',
      id: `enemy-${enemyId++}`,
    });
  }

  // Monete sulla terra (arco)
  for (let i = 0; i < 5; i++) {
    const arcHeight = Math.sin((i / 4) * Math.PI) * 1.2;
    coins.push({
      x: 3 + i * 1.1,
      y: GAME_HEIGHT - 2.3 - arcHeight,
      collected: false,
      id: `coin-${coinId++}`,
    });
  }

  // Aggiungi più tubi sulla terra per varietà
  pipes.push({
    x: 22,
    y: GAME_HEIGHT - 1.5,
    height: 2.5,
    id: `pipe-${pipeId++}`,
  });

  return { platforms, enemies, coins, questionBlocks, pipes, powerUps };
};

// Inizializza gioco
export const initializeGame = (cellSize: number) => {
  const { platforms, enemies, coins, questionBlocks, pipes, powerUps } = generateInitialPlatforms();

  return {
    game: {
      bazX: 3,
      bazY: GAME_HEIGHT - 1.5,
      bazVelocityY: 0,
      isJumping: false,
      isOnGround: true,
      facingRight: true,
      jumpCount: 0,       // Per double jump
      maxJumps: 2,        // Permette double jump
      isBig: false,
      isInvincible: false,
      invincibleTimer: 0,
      platforms,
      enemies,
      coins,
      questionBlocks,
      pipes,
      powerUps,
      score: 0,
      lastUpdate: Date.now(),
      platformIdCounter: platforms.length,
      enemyIdCounter: enemies.length,
      coinIdCounter: coins.length,
      blockIdCounter: questionBlocks.length,
      pipeIdCounter: pipes.length,
      powerUpIdCounter: powerUps.length,
      gameStarted: false,
      scrollOffset: 0,
      distanceTraveled: 0,
      graceFrames: 30,
      frameCount: 0,
      cellSize: cellSize,
      renderer: GameBoard,
    },
  };
};

// Collision detection
const checkPlatformCollision = (bazX: number, bazY: number, bazVelocityY: number, platforms: Platform[]): { onGround: boolean; groundY: number } => {
  const bazWidth = BAZ_SIZE * 0.4;

  if (bazVelocityY < 0) {
    return { onGround: false, groundY: bazY };
  }

  for (const platform of platforms) {
    const platformTop = platform.y;
    const platformLeft = platform.x;
    const platformRight = platform.x + platform.width;

    if (bazX + bazWidth / 2 > platformLeft && bazX - bazWidth / 2 < platformRight) {
      if (bazY >= platformTop - 0.15 && bazY <= platformTop + 0.35) {
        return { onGround: true, groundY: platformTop };
      }
    }
  }

  return { onGround: false, groundY: bazY };
};

const checkEnemyCollision = (bazX: number, bazY: number, bazVelocityY: number, enemies: Enemy[]): { hit: boolean; enemyIndex: number; fromAbove: boolean } => {
  const bazWidth = BAZ_SIZE * 0.5;
  const bazFeetY = bazY;  // I piedi di Baz sono a bazY

  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    if (enemy.isDead) continue;

    const enemyWidth = ENEMY_SIZE * 0.6;
    const enemyHeight = ENEMY_SIZE * 0.7;
    const enemyTopY = enemy.y - enemyHeight;  // Top del nemico

    const dx = Math.abs(bazX - enemy.x);

    // Controllo se c'è sovrapposizione orizzontale
    if (dx < (bazWidth + enemyWidth) / 2) {
      // Baz sta cadendo e i suoi piedi sono vicini alla testa del nemico
      // fromAbove = true se Baz sta scendendo E i suoi piedi sono sopra/vicino alla testa del nemico
      const bazAboveEnemy = bazFeetY <= enemy.y && bazFeetY >= enemyTopY - 0.3;

      if (bazVelocityY > 0 && bazAboveEnemy) {
        // Saltato sopra il nemico - il nemico muore!
        return { hit: true, enemyIndex: i, fromAbove: true };
      }

      // Collisione laterale/frontale - game over
      // Baz è allo stesso livello del nemico (non sopra)
      const bazBottomY = bazY;
      const bazTopY = bazY - BAZ_SIZE * 1.4;

      // C'è sovrapposizione verticale?
      if (bazBottomY > enemyTopY + 0.2 && bazTopY < enemy.y) {
        return { hit: true, enemyIndex: i, fromAbove: false };
      }
    }
  }

  return { hit: false, enemyIndex: -1, fromAbove: false };
};

const checkCoinCollision = (bazX: number, bazY: number, coins: Coin[]): number => {
  const bazWidth = BAZ_SIZE * 0.5;
  const bazHeight = BAZ_SIZE * 1.4;

  for (let i = 0; i < coins.length; i++) {
    const coin = coins[i];
    if (coin.collected) continue;

    const dx = Math.abs(bazX - coin.x);
    const dy = Math.abs(bazY - BAZ_SIZE * 0.7 - coin.y);

    if (dx < bazWidth / 2 + COIN_SIZE / 2 && dy < bazHeight / 2 + COIN_SIZE / 2) {
      return i;
    }
  }

  return -1;
};

// Collisione blocchi ?
const checkQuestionBlockCollision = (bazX: number, bazY: number, bazVelocityY: number, blocks: QuestionBlock[]): number => {
  if (bazVelocityY >= 0) return -1;  // Solo quando sale

  const bazWidth = BAZ_SIZE * 0.4;
  const bazHeight = BAZ_SIZE * 1.4;
  const bazTopY = bazY - bazHeight;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.hit) continue;

    const blockSize = 1.0;
    const dx = Math.abs(bazX - block.x);
    const blockBottom = block.y;

    if (dx < (bazWidth + blockSize) / 2) {
      if (bazTopY <= blockBottom && bazTopY >= blockBottom - 0.4) {
        return i;
      }
    }
  }
  return -1;
};

// Collisione tubi (ostacoli)
const checkPipeCollision = (bazX: number, bazY: number, pipes: Pipe[]): { hit: boolean; pipeTop: number } => {
  const bazWidth = BAZ_SIZE * 0.4;
  const bazHeight = BAZ_SIZE * 1.4;

  for (const pipe of pipes) {
    const pipeWidth = 1.5;
    const pipeTop = pipe.y - pipe.height;

    const dx = Math.abs(bazX - pipe.x);
    if (dx < (bazWidth + pipeWidth) / 2) {
      // Baz è sopra il tubo?
      if (bazY >= pipeTop - 0.1 && bazY <= pipeTop + 0.3) {
        return { hit: true, pipeTop };
      }
      // Collisione laterale?
      if (bazY > pipeTop + 0.3 && bazY - bazHeight < pipe.y) {
        return { hit: true, pipeTop: -1 };  // -1 indica collisione laterale
      }
    }
  }
  return { hit: false, pipeTop: 0 };
};

// Collisione power-ups
const checkPowerUpCollision = (bazX: number, bazY: number, powerUps: PowerUp[]): number => {
  const bazWidth = BAZ_SIZE * 0.5;
  const bazHeight = BAZ_SIZE * 1.4;

  for (let i = 0; i < powerUps.length; i++) {
    const powerUp = powerUps[i];
    if (powerUp.collected) continue;

    const size = 0.8;
    const dx = Math.abs(bazX - powerUp.x);
    const dy = Math.abs(bazY - BAZ_SIZE * 0.7 - powerUp.y);

    if (dx < bazWidth / 2 + size / 2 && dy < bazHeight / 2 + size / 2) {
      return i;
    }
  }
  return -1;
};

// Game Loop
export const GameLoop = (entities: any, { events, dispatch }: any) => {
  const state = entities.game as GameState & { cellSize: number };
  const now = Date.now();
  const deltaTime = now - state.lastUpdate;

  // Eventi - DOUBLE JUMP!
  if (events && events.length) {
    events.forEach((event: any) => {
      if (event.type === 'jump') {
        if (!state.gameStarted) {
          state.gameStarted = true;
          state.lastUpdate = now;
          state.graceFrames = 30;
        }
        // Double jump: può saltare se a terra O se ha ancora salti disponibili
        if (state.jumpCount < state.maxJumps) {
          // Secondo salto leggermente più debole
          const jumpPower = state.jumpCount === 0 ? JUMP_VELOCITY : JUMP_VELOCITY * 0.85;
          state.bazVelocityY = jumpPower;
          state.isJumping = true;
          state.isOnGround = false;
          state.jumpCount++;
        }
      }
    });
  }

  if (!state.gameStarted) {
    state.lastUpdate = now;
    return entities;
  }

  if (deltaTime >= 16) {
    state.frameCount++;

    // Auto-movimento
    state.bazX += MOVE_SPEED;
    state.scrollOffset = (state.bazX - 3) * state.cellSize;
    if (state.scrollOffset < 0) state.scrollOffset = 0;

    // Timer invincibilità
    if (state.isInvincible && now > state.invincibleTimer) {
      state.isInvincible = false;
    }

    // Gravità
    state.bazVelocityY += GRAVITY;
    if (state.bazVelocityY > 0.5) state.bazVelocityY = 0.5;
    state.bazY += state.bazVelocityY;

    // Collisione piattaforme
    const platformCheck = checkPlatformCollision(state.bazX, state.bazY, state.bazVelocityY, state.platforms);
    if (platformCheck.onGround) {
      state.bazY = platformCheck.groundY;
      state.bazVelocityY = 0;
      state.isOnGround = true;
      state.isJumping = false;
      state.jumpCount = 0;  // Reset double jump quando tocca terra
    } else {
      state.isOnGround = false;
    }

    // Collisione tubi
    const pipeCheck = checkPipeCollision(state.bazX, state.bazY, state.pipes);
    if (pipeCheck.hit) {
      if (pipeCheck.pipeTop > 0) {
        // Atterra sul tubo
        state.bazY = pipeCheck.pipeTop;
        state.bazVelocityY = 0;
        state.isOnGround = true;
        state.isJumping = false;
        state.jumpCount = 0;
      }
      // Collisione laterale viene ignorata (Baz può passare sopra)
    }

    // Collisione blocchi ?
    if (state.questionBlocks) {
      const blockIndex = checkQuestionBlockCollision(state.bazX, state.bazY, state.bazVelocityY, state.questionBlocks);
      if (blockIndex >= 0) {
        const block = state.questionBlocks[blockIndex];
        block.hit = true;
        block.bounceTimer = now;
        state.bazVelocityY = 0.05;  // Rimbalza leggermente

        if (block.content === 'coin') {
          state.score += 10;
          dispatch({ type: 'score-update', score: state.score });
          dispatch({ type: 'coin-collected' });
        } else if (block.content === 'powerup') {
          // Spawna power-up
          state.powerUps.push({
            x: block.x,
            y: block.y - 1.5,
            type: Math.random() > 0.5 ? 'mushroom' : 'star',
            id: `powerup-${state.powerUpIdCounter++}`,
            collected: false,
            velocityY: -0.1,
            direction: 1,
          });
          dispatch({ type: 'powerup' });
        }
      }
    }

    // Muovi e raccogli power-ups
    if (state.powerUps) {
      state.powerUps.forEach(powerUp => {
        if (powerUp.collected) return;

        // Movimento power-up
        powerUp.velocityY += GRAVITY * 0.5;
        powerUp.y += powerUp.velocityY;
        powerUp.x += 0.02 * powerUp.direction;

        // Collisione con terra
        if (powerUp.y >= GAME_HEIGHT - 1.5) {
          powerUp.y = GAME_HEIGHT - 1.5;
          powerUp.velocityY = 0;
        }
      });

      // Collisione power-up
      const powerUpIndex = checkPowerUpCollision(state.bazX, state.bazY, state.powerUps);
      if (powerUpIndex >= 0) {
        const powerUp = state.powerUps[powerUpIndex];
        powerUp.collected = true;

        if (powerUp.type === 'mushroom') {
          state.isBig = true;
          state.score += 50;
        } else if (powerUp.type === 'star') {
          state.isInvincible = true;
          state.invincibleTimer = now + 8000;  // 8 secondi di invincibilità
          state.score += 100;
        }
        dispatch({ type: 'score-update', score: state.score });
        dispatch({ type: 'powerup' });
      }
    }

    // Collisione monete
    const coinIndex = checkCoinCollision(state.bazX, state.bazY, state.coins);
    if (coinIndex >= 0) {
      state.coins[coinIndex].collected = true;
      state.score += 10;
      dispatch({ type: 'score-update', score: state.score });
      dispatch({ type: 'coin-collected' });
    }

    // Muovi nemici
    state.enemies.forEach(enemy => {
      if (enemy.isDead) {
        if (enemy.deathTimer && now - enemy.deathTimer > 500) {
          enemy.y = 100;
        }
        return;
      }

      const platform = state.platforms.find(p => p.id === enemy.platformId);
      if (platform) {
        enemy.x += ENEMY_SPEED * enemy.direction;
        if (enemy.x <= platform.x + 0.5) {
          enemy.direction = 1;
        } else if (enemy.x >= platform.x + platform.width - 0.5) {
          enemy.direction = -1;
        }
      }
    });

    // Collisione nemici
    if (state.graceFrames > 0) {
      state.graceFrames--;
    } else {
      const enemyCheck = checkEnemyCollision(state.bazX, state.bazY, state.bazVelocityY, state.enemies);
      if (enemyCheck.hit) {
        if (enemyCheck.fromAbove || state.isInvincible) {
          // Uccidi nemico se saltato sopra O se invincibile
          state.enemies[enemyCheck.enemyIndex].isDead = true;
          state.enemies[enemyCheck.enemyIndex].deathTimer = now;
          if (!state.isInvincible) {
            state.bazVelocityY = JUMP_VELOCITY * 0.5;
          }
          state.score += 20;
          dispatch({ type: 'score-update', score: state.score });
          dispatch({ type: 'enemy-killed' });
        } else if (state.isBig) {
          // Se grande, diventa piccolo invece di morire
          state.isBig = false;
          state.graceFrames = 60;  // Invulnerabilità temporanea
        } else {
          dispatch({ type: 'game-over' });
        }
      }
    }

    // Caduto nel vuoto
    if (state.bazY > GAME_HEIGHT + 2) {
      dispatch({ type: 'game-over' });
    }

    // Genera nuove piattaforme
    const aerialPlatforms = state.platforms.filter(p => p.type !== 'ground');
    const lastPlatform = aerialPlatforms[aerialPlatforms.length - 1];
    const viewRight = state.bazX + GAME_WIDTH;

    if (lastPlatform && lastPlatform.x + lastPlatform.width < viewRight + 10) {
      const newPlatform = generateReachablePlatform(
        lastPlatform.x,
        lastPlatform.y,
        lastPlatform.width,
        state.platformIdCounter++
      );
      state.platforms.push(newPlatform);

      // Blocco ? (35% probabilità)
      if (Math.random() > 0.65) {
        state.questionBlocks.push({
          x: newPlatform.x + newPlatform.width / 2,
          y: newPlatform.y - 2.5,
          id: `block-${state.blockIdCounter++}`,
          hit: false,
          content: Math.random() > 0.75 ? 'powerup' : 'coin',
        });
      } else if (Math.random() > 0.3) {
        // Moneta
        state.coins.push({
          x: newPlatform.x + newPlatform.width / 2,
          y: newPlatform.y - 1,
          collected: false,
          id: `coin-${state.coinIdCounter++}`,
        });
      }

      // Nemico (più frequente per difficoltà)
      if (Math.random() > 0.6 && newPlatform.width > 2.5) {
        state.enemies.push({
          x: newPlatform.x + newPlatform.width / 2,
          y: newPlatform.y,
          direction: Math.random() > 0.5 ? 1 : -1,
          platformId: newPlatform.id,
          id: `enemy-${state.enemyIdCounter++}`,
        });
      }
    }

    // Estendi terra
    const groundPlatform = state.platforms.find(p => p.type === 'ground');
    if (groundPlatform && groundPlatform.x + groundPlatform.width < viewRight + 5) {
      groundPlatform.width += 10;

      // Aggiungi tubo periodicamente
      if (Math.random() > 0.7) {
        state.pipes.push({
          x: groundPlatform.x + groundPlatform.width - 5,
          y: GAME_HEIGHT - 1.5,
          height: 1.5 + Math.random() * 1.5,
          id: `pipe-${state.pipeIdCounter++}`,
        });
      }

      if (Math.random() > 0.5) {
        state.coins.push({
          x: groundPlatform.x + groundPlatform.width - 5,
          y: GAME_HEIGHT - 2.5,
          collected: false,
          id: `coin-${state.coinIdCounter++}`,
        });
      }

      if (Math.random() > 0.6) {
        state.enemies.push({
          x: groundPlatform.x + groundPlatform.width - 8,
          y: GAME_HEIGHT - 1.5,
          direction: -1,
          platformId: 'platform-0',
          id: `enemy-${state.enemyIdCounter++}`,
        });
      }
    }

    // Cleanup
    const viewLeft = state.bazX - 5;
    state.platforms = state.platforms.filter(p => p.x + p.width > viewLeft || p.type === 'ground');
    state.enemies = state.enemies.filter(e => e.x > viewLeft - 2);
    state.coins = state.coins.filter(c => c.x > viewLeft - 2);
    state.questionBlocks = state.questionBlocks.filter(b => b.x > viewLeft - 2);
    state.pipes = state.pipes.filter(p => p.x > viewLeft - 2);
    state.powerUps = state.powerUps.filter(p => p.x > viewLeft - 2);

    // Punteggio distanza
    state.distanceTraveled += MOVE_SPEED;
    if (Math.floor(state.distanceTraveled) > Math.floor(state.distanceTraveled - MOVE_SPEED)) {
      if (Math.floor(state.distanceTraveled) % 5 === 0) {
        state.score += 1;
        dispatch({ type: 'score-update', score: state.score });
      }
    }

    state.lastUpdate = now;
  }

  return entities;
};
