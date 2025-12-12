import React from 'react';
import { View } from 'react-native';

export const GAME_WIDTH = 10;
export const GAME_HEIGHT = 16;

// Fisica semplice - valori per frame, non per millisecondo
const GRAVITY = 0.006;        // Gravità per frame (leggera)
const JUMP_VELOCITY = -0.15;  // Velocità salto (tap delicato)
const PIPE_SPEED = 0.035;     // Velocità tubi per frame (lento)
const PIPE_GAP = 6.0;         // Spazio verticale tra i tubi (più largo)
const PIPE_WIDTH = 1.8;
const BIRD_SIZE = 1.2;
const PIPE_SPACING = 7.5;     // Distanza orizzontale tra i tubi

interface Pipe {
  x: number;
  gapY: number; // Centro dello spazio tra i tubi
  passed: boolean;
  id: string;
}

interface GameState {
  birdY: number;
  birdVelocity: number;
  birdRotation: number;
  pipes: Pipe[];
  score: number;
  lastUpdate: number;
  pipeIdCounter: number;
  gameStarted: boolean;
  wingUp: boolean;
  wingTimer: number;
  graceFrames: number; // Frame di grazia all'inizio per evitare morte istantanea
}

// Colori
const COLORS = {
  bird: {
    body: '#FFD93D',
    belly: '#FFF3B0',
    wing: '#FF9500',
    beak: '#FF6B35',
    eye: '#000',
    eyeWhite: '#FFF',
  },
  pipe: {
    main: '#2ECC71',
    dark: '#27AE60',
    highlight: '#58D68D',
    cap: '#27AE60',
    capHighlight: '#2ECC71',
  },
  cloud: 'rgba(255, 255, 255, 0.3)',
};

// Componente uccellino
const Bird = ({ y, rotation, wingUp, cellSize }: { y: number; rotation: number; wingUp: boolean; cellSize: number }) => {
  const birdWidth = cellSize * BIRD_SIZE * 1.3;
  const birdHeight = cellSize * BIRD_SIZE;

  return (
    <View
      style={{
        position: 'absolute',
        left: GAME_WIDTH * cellSize * 0.25 - birdWidth / 2,
        top: y * cellSize - birdHeight / 2,
        width: birdWidth,
        height: birdHeight,
        transform: [{ rotate: `${rotation}deg` }],
      }}
    >
      {/* Corpo */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: birdWidth,
          height: birdHeight,
          backgroundColor: COLORS.bird.body,
          borderRadius: birdHeight / 2,
        }}
      />
      {/* Pancia */}
      <View
        style={{
          position: 'absolute',
          left: birdWidth * 0.15,
          top: birdHeight * 0.35,
          width: birdWidth * 0.5,
          height: birdHeight * 0.5,
          backgroundColor: COLORS.bird.belly,
          borderRadius: birdHeight * 0.25,
        }}
      />
      {/* Ala */}
      <View
        style={{
          position: 'absolute',
          left: birdWidth * 0.2,
          top: wingUp ? birdHeight * 0.15 : birdHeight * 0.4,
          width: birdWidth * 0.4,
          height: birdHeight * 0.35,
          backgroundColor: COLORS.bird.wing,
          borderRadius: birdHeight * 0.15,
          transform: [{ rotate: wingUp ? '-15deg' : '15deg' }],
        }}
      />
      {/* Occhio - parte bianca */}
      <View
        style={{
          position: 'absolute',
          right: birdWidth * 0.12,
          top: birdHeight * 0.18,
          width: birdWidth * 0.28,
          height: birdHeight * 0.35,
          backgroundColor: COLORS.bird.eyeWhite,
          borderRadius: birdHeight * 0.18,
        }}
      >
        {/* Pupilla */}
        <View
          style={{
            position: 'absolute',
            right: birdWidth * 0.04,
            top: birdHeight * 0.08,
            width: birdWidth * 0.14,
            height: birdHeight * 0.18,
            backgroundColor: COLORS.bird.eye,
            borderRadius: birdHeight * 0.1,
          }}
        />
      </View>
      {/* Becco superiore */}
      <View
        style={{
          position: 'absolute',
          right: -birdWidth * 0.15,
          top: birdHeight * 0.35,
          width: birdWidth * 0.3,
          height: birdHeight * 0.2,
          backgroundColor: COLORS.bird.beak,
          borderTopRightRadius: birdHeight * 0.1,
          borderBottomRightRadius: birdHeight * 0.05,
        }}
      />
      {/* Becco inferiore */}
      <View
        style={{
          position: 'absolute',
          right: -birdWidth * 0.1,
          top: birdHeight * 0.5,
          width: birdWidth * 0.22,
          height: birdHeight * 0.15,
          backgroundColor: '#FF8C42',
          borderBottomRightRadius: birdHeight * 0.08,
        }}
      />
    </View>
  );
};

// Componente tubo
const Pipe = ({ x, gapY, cellSize }: { x: number; gapY: number; cellSize: number }) => {
  const pipeWidth = PIPE_WIDTH * cellSize;
  const capWidth = pipeWidth * 1.2;
  const capHeight = cellSize * 0.6;
  const gapTop = (gapY - PIPE_GAP / 2) * cellSize;
  const gapBottom = (gapY + PIPE_GAP / 2) * cellSize;

  return (
    <>
      {/* Tubo superiore */}
      <View
        style={{
          position: 'absolute',
          left: x * cellSize - (capWidth - pipeWidth) / 2,
          top: 0,
          width: capWidth,
          height: gapTop,
        }}
      >
        {/* Corpo tubo */}
        <View
          style={{
            position: 'absolute',
            left: (capWidth - pipeWidth) / 2,
            top: 0,
            width: pipeWidth,
            height: gapTop - capHeight,
            backgroundColor: COLORS.pipe.main,
            borderLeftWidth: pipeWidth * 0.08,
            borderLeftColor: COLORS.pipe.highlight,
            borderRightWidth: pipeWidth * 0.12,
            borderRightColor: COLORS.pipe.dark,
          }}
        />
        {/* Cappuccio tubo */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: capWidth,
            height: capHeight,
            backgroundColor: COLORS.pipe.cap,
            borderRadius: cellSize * 0.1,
            borderLeftWidth: capWidth * 0.06,
            borderLeftColor: COLORS.pipe.capHighlight,
            borderRightWidth: capWidth * 0.08,
            borderRightColor: COLORS.pipe.dark,
            borderBottomWidth: capHeight * 0.15,
            borderBottomColor: COLORS.pipe.dark,
          }}
        />
      </View>

      {/* Tubo inferiore */}
      <View
        style={{
          position: 'absolute',
          left: x * cellSize - (capWidth - pipeWidth) / 2,
          top: gapBottom,
          width: capWidth,
          height: GAME_HEIGHT * cellSize - gapBottom,
        }}
      >
        {/* Cappuccio tubo */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: capWidth,
            height: capHeight,
            backgroundColor: COLORS.pipe.cap,
            borderRadius: cellSize * 0.1,
            borderLeftWidth: capWidth * 0.06,
            borderLeftColor: COLORS.pipe.capHighlight,
            borderRightWidth: capWidth * 0.08,
            borderRightColor: COLORS.pipe.dark,
            borderTopWidth: capHeight * 0.15,
            borderTopColor: COLORS.pipe.capHighlight,
          }}
        />
        {/* Corpo tubo */}
        <View
          style={{
            position: 'absolute',
            left: (capWidth - pipeWidth) / 2,
            top: capHeight,
            width: pipeWidth,
            height: GAME_HEIGHT * cellSize - gapBottom - capHeight,
            backgroundColor: COLORS.pipe.main,
            borderLeftWidth: pipeWidth * 0.08,
            borderLeftColor: COLORS.pipe.highlight,
            borderRightWidth: pipeWidth * 0.12,
            borderRightColor: COLORS.pipe.dark,
          }}
        />
      </View>
    </>
  );
};

// Nuvole di sfondo
const Clouds = ({ cellSize }: { cellSize: number }) => {
  const clouds = [
    { x: 1, y: 2, scale: 1 },
    { x: 6, y: 4, scale: 0.7 },
    { x: 3, y: 8, scale: 0.9 },
    { x: 8, y: 1, scale: 0.6 },
    { x: 2, y: 12, scale: 0.8 },
  ];

  return (
    <>
      {clouds.map((cloud, i) => (
        <View
          key={`cloud-${i}`}
          style={{
            position: 'absolute',
            left: cloud.x * cellSize,
            top: cloud.y * cellSize,
            width: cellSize * 2.5 * cloud.scale,
            height: cellSize * 1 * cloud.scale,
            backgroundColor: COLORS.cloud,
            borderRadius: cellSize * 0.5,
          }}
        />
      ))}
    </>
  );
};

// Componente principale del gioco
const GameBoard = (props: any) => {
  const { birdY, birdRotation, pipes, wingUp, cellSize } = props;

  return (
    <View
      style={{
        width: GAME_WIDTH * cellSize,
        height: GAME_HEIGHT * cellSize,
        backgroundColor: '#87CEEB', // Cielo azzurro
        overflow: 'hidden',
      }}
    >
      {/* Gradiente cielo (simulato) */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          right: 0,
          height: GAME_HEIGHT * cellSize * 0.6,
          backgroundColor: '#5BC0EB',
          opacity: 0.5,
        }}
      />

      {/* Nuvole */}
      <Clouds cellSize={cellSize} />

      {/* Tubi */}
      {pipes.map((pipe: Pipe) => (
        <Pipe key={pipe.id} x={pipe.x} gapY={pipe.gapY} cellSize={cellSize} />
      ))}

      {/* Uccellino */}
      <Bird y={birdY} rotation={birdRotation} wingUp={wingUp} cellSize={cellSize} />
    </View>
  );
};

// Inizializza il gioco
export const initializeGame = (cellSize: number) => {
  return {
    game: {
      birdY: GAME_HEIGHT / 2,
      birdVelocity: 0,
      birdRotation: 0,
      pipes: [],
      score: 0,
      lastUpdate: Date.now(),
      pipeIdCounter: 0,
      gameStarted: false,
      wingUp: false,
      wingTimer: 0,
      graceFrames: 30, // 30 frame di grazia all'inizio (circa mezzo secondo)
      cellSize: cellSize,
      renderer: GameBoard,
    },
  };
};

// Controlla collisione
const checkCollision = (birdY: number, pipes: Pipe[]): boolean => {
  const birdX = GAME_WIDTH * 0.25;
  const birdRadius = BIRD_SIZE * 0.3; // Hitbox piccola per essere forgiving

  // Collisione con pavimento (morte solo se cade sotto)
  if (birdY + birdRadius > GAME_HEIGHT) {
    return true;
  }

  // Collisione con tubi
  for (const pipe of pipes) {
    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + PIPE_WIDTH;

    if (birdX + birdRadius > pipeLeft && birdX - birdRadius < pipeRight) {
      const gapTop = pipe.gapY - PIPE_GAP / 2;
      const gapBottom = pipe.gapY + PIPE_GAP / 2;

      if (birdY - birdRadius < gapTop || birdY + birdRadius > gapBottom) {
        return true;
      }
    }
  }

  return false;
};

// Game loop principale
export const GameLoop = (entities: any, { events, dispatch, time }: any) => {
  const state = entities.game as GameState & { cellSize: number };
  const now = Date.now();
  const deltaTime = now - state.lastUpdate;

  // Gestione tap per saltare
  if (events && events.length) {
    events.forEach((event: any) => {
      if (event.type === 'jump') {
        if (!state.gameStarted) {
          state.gameStarted = true;
          state.lastUpdate = now;
          state.graceFrames = 30;
        }
        // Applica il salto (resetta la velocità a un valore fisso)
        state.birdVelocity = JUMP_VELOCITY;
        state.wingUp = true;
        state.wingTimer = now;
      }
    });
  }

  // Animazione ali
  if (state.wingUp && now - state.wingTimer > 100) {
    state.wingUp = false;
  }

  if (!state.gameStarted) {
    // Prima di iniziare, l'uccellino fluttua
    state.birdY = GAME_HEIGHT / 2 + Math.sin(now / 300) * 0.5;
    state.birdVelocity = 0;
    state.lastUpdate = now;
    return entities;
  }

  // Aggiorna fisica a frame rate fisso (~60fps)
  if (deltaTime >= 16) {
    // Applica gravità (valore fisso per frame)
    state.birdVelocity += GRAVITY;

    // Limita velocità (più lenta)
    if (state.birdVelocity > 0.3) state.birdVelocity = 0.3;
    if (state.birdVelocity < -0.35) state.birdVelocity = -0.35;

    // Muovi uccello
    state.birdY += state.birdVelocity;

    // Impedisci all'uccello di andare sopra lo schermo
    if (state.birdY < 1) {
      state.birdY = 1;
      state.birdVelocity = 0;
    }

    // Calcola rotazione basata sulla velocità
    state.birdRotation = Math.min(70, Math.max(-25, state.birdVelocity * 150));

    // Muovi tubi (valore fisso per frame)
    state.pipes = state.pipes.map(pipe => ({
      ...pipe,
      x: pipe.x - PIPE_SPEED,
    }));

    // Rimuovi tubi fuori schermo
    state.pipes = state.pipes.filter(pipe => pipe.x > -PIPE_WIDTH * 2);

    // Controlla punteggio
    state.pipes.forEach(pipe => {
      if (!pipe.passed && pipe.x + PIPE_WIDTH < GAME_WIDTH * 0.25) {
        pipe.passed = true;
        state.score += 10;
        dispatch({ type: 'score-update', score: state.score });
      }
    });

    // Genera nuovi tubi
    const lastPipe = state.pipes[state.pipes.length - 1];
    // Primo tubo appare FUORI dallo schermo, poi ogni PIPE_SPACING unità
    const shouldSpawn = !lastPipe || lastPipe.x < GAME_WIDTH - PIPE_SPACING;

    if (shouldSpawn) {
      // Gap Y casuale ma entro limiti ragionevoli
      const minGapY = PIPE_GAP / 2 + 1.5;
      const maxGapY = GAME_HEIGHT - PIPE_GAP / 2 - 1.5;
      const gapY = minGapY + Math.random() * (maxGapY - minGapY);

      state.pipes.push({
        x: GAME_WIDTH + 2, // Sempre fuori dallo schermo
        gapY,
        passed: false,
        id: `pipe-${state.pipeIdCounter++}`,
      });
    }

    // Controlla collisioni (solo dopo i frame di grazia)
    if (state.graceFrames > 0) {
      state.graceFrames--;
    } else if (checkCollision(state.birdY, state.pipes)) {
      dispatch({ type: 'game-over' });
    }

    state.lastUpdate = now;
  }

  return entities;
};
