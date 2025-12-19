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
    cheek: '#FFB347',
  },
  pipe: {
    main: '#4CD137',
    dark: '#2F8E1F',
    highlight: '#7BED6E',
    cap: '#44BD32',
    capHighlight: '#7BED6E',
    stripe: 'rgba(255,255,255,0.15)',
  },
  sky: {
    top: '#4FC3F7',
    middle: '#81D4FA',
    bottom: '#B3E5FC',
  },
  ground: {
    grass: '#7CB342',
    grassDark: '#558B2F',
    dirt: '#8D6E63',
    dirtDark: '#6D4C41',
  },
  sun: {
    core: '#FFEB3B',
    glow: 'rgba(255, 235, 59, 0.3)',
  },
  cloud: 'rgba(255, 255, 255, 0.85)',
  cloudShadow: 'rgba(200, 200, 200, 0.3)',
};

// Componente uccellino
const Bird = ({ y, rotation, wingUp, cellSize }: { y: number; rotation: number; wingUp: boolean; cellSize: number }) => {
  const birdWidth = cellSize * BIRD_SIZE * 1.4;
  const birdHeight = cellSize * BIRD_SIZE * 1.1;

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
      {/* Ombra del corpo */}
      <View
        style={{
          position: 'absolute',
          left: 2,
          top: 2,
          width: birdWidth,
          height: birdHeight,
          backgroundColor: 'rgba(0,0,0,0.15)',
          borderRadius: birdHeight / 2,
        }}
      />
      {/* Corpo principale */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: birdWidth,
          height: birdHeight,
          backgroundColor: COLORS.bird.body,
          borderRadius: birdHeight / 2,
          borderWidth: 1,
          borderColor: '#E6B800',
        }}
      />
      {/* Highlight sul corpo */}
      <View
        style={{
          position: 'absolute',
          left: birdWidth * 0.1,
          top: birdHeight * 0.1,
          width: birdWidth * 0.3,
          height: birdHeight * 0.25,
          backgroundColor: 'rgba(255,255,255,0.4)',
          borderRadius: birdHeight * 0.15,
        }}
      />
      {/* Pancia */}
      <View
        style={{
          position: 'absolute',
          left: birdWidth * 0.12,
          top: birdHeight * 0.38,
          width: birdWidth * 0.5,
          height: birdHeight * 0.48,
          backgroundColor: COLORS.bird.belly,
          borderRadius: birdHeight * 0.25,
        }}
      />
      {/* Guancia */}
      <View
        style={{
          position: 'absolute',
          right: birdWidth * 0.22,
          top: birdHeight * 0.5,
          width: birdWidth * 0.18,
          height: birdHeight * 0.15,
          backgroundColor: COLORS.bird.cheek,
          borderRadius: birdHeight * 0.1,
          opacity: 0.7,
        }}
      />
      {/* Ala */}
      <View
        style={{
          position: 'absolute',
          left: birdWidth * 0.18,
          top: wingUp ? birdHeight * 0.12 : birdHeight * 0.42,
          width: birdWidth * 0.42,
          height: birdHeight * 0.38,
          backgroundColor: COLORS.bird.wing,
          borderRadius: birdHeight * 0.18,
          transform: [{ rotate: wingUp ? '-20deg' : '15deg' }],
          borderWidth: 1,
          borderColor: '#CC7700',
        }}
      />
      {/* Dettaglio ala */}
      <View
        style={{
          position: 'absolute',
          left: birdWidth * 0.22,
          top: wingUp ? birdHeight * 0.18 : birdHeight * 0.48,
          width: birdWidth * 0.25,
          height: birdHeight * 0.15,
          backgroundColor: 'rgba(255,255,255,0.3)',
          borderRadius: birdHeight * 0.08,
          transform: [{ rotate: wingUp ? '-20deg' : '15deg' }],
        }}
      />
      {/* Occhio - parte bianca */}
      <View
        style={{
          position: 'absolute',
          right: birdWidth * 0.1,
          top: birdHeight * 0.15,
          width: birdWidth * 0.32,
          height: birdHeight * 0.4,
          backgroundColor: COLORS.bird.eyeWhite,
          borderRadius: birdHeight * 0.2,
          borderWidth: 1,
          borderColor: '#ddd',
        }}
      >
        {/* Pupilla */}
        <View
          style={{
            position: 'absolute',
            right: birdWidth * 0.04,
            top: birdHeight * 0.1,
            width: birdWidth * 0.16,
            height: birdHeight * 0.22,
            backgroundColor: COLORS.bird.eye,
            borderRadius: birdHeight * 0.12,
          }}
        />
        {/* Riflesso occhio */}
        <View
          style={{
            position: 'absolute',
            right: birdWidth * 0.06,
            top: birdHeight * 0.12,
            width: birdWidth * 0.06,
            height: birdHeight * 0.08,
            backgroundColor: '#fff',
            borderRadius: birdHeight * 0.04,
          }}
        />
      </View>
      {/* Becco superiore */}
      <View
        style={{
          position: 'absolute',
          right: -birdWidth * 0.18,
          top: birdHeight * 0.35,
          width: birdWidth * 0.35,
          height: birdHeight * 0.22,
          backgroundColor: COLORS.bird.beak,
          borderTopRightRadius: birdHeight * 0.12,
          borderBottomRightRadius: birdHeight * 0.05,
          borderWidth: 1,
          borderColor: '#CC4400',
        }}
      />
      {/* Becco inferiore */}
      <View
        style={{
          position: 'absolute',
          right: -birdWidth * 0.12,
          top: birdHeight * 0.52,
          width: birdWidth * 0.26,
          height: birdHeight * 0.18,
          backgroundColor: '#FF8C42',
          borderBottomRightRadius: birdHeight * 0.1,
          borderWidth: 1,
          borderColor: '#CC6600',
        }}
      />
    </View>
  );
};

// Componente tubo
const Pipe = ({ x, gapY, cellSize }: { x: number; gapY: number; cellSize: number }) => {
  const pipeWidth = PIPE_WIDTH * cellSize;
  const capWidth = pipeWidth * 1.25;
  const capHeight = cellSize * 0.7;
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
        {/* Ombra tubo */}
        <View
          style={{
            position: 'absolute',
            left: (capWidth - pipeWidth) / 2 + 3,
            top: 0,
            width: pipeWidth,
            height: gapTop - capHeight,
            backgroundColor: 'rgba(0,0,0,0.15)',
            borderRadius: 2,
          }}
        />
        {/* Corpo tubo */}
        <View
          style={{
            position: 'absolute',
            left: (capWidth - pipeWidth) / 2,
            top: 0,
            width: pipeWidth,
            height: gapTop - capHeight,
            backgroundColor: COLORS.pipe.main,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          {/* Highlight sinistro */}
          <View style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: pipeWidth * 0.15,
            height: '100%',
            backgroundColor: COLORS.pipe.highlight,
          }} />
          {/* Ombra destra */}
          <View style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: pipeWidth * 0.2,
            height: '100%',
            backgroundColor: COLORS.pipe.dark,
          }} />
          {/* Stripe decorativo */}
          <View style={{
            position: 'absolute',
            left: pipeWidth * 0.25,
            top: 0,
            width: pipeWidth * 0.08,
            height: '100%',
            backgroundColor: COLORS.pipe.stripe,
          }} />
        </View>
        {/* Cappuccio tubo */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: capWidth,
            height: capHeight,
            backgroundColor: COLORS.pipe.cap,
            borderRadius: cellSize * 0.15,
            borderWidth: 2,
            borderColor: COLORS.pipe.dark,
            overflow: 'hidden',
          }}
        >
          {/* Highlight cappuccio */}
          <View style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: capWidth * 0.15,
            height: '100%',
            backgroundColor: COLORS.pipe.capHighlight,
          }} />
          {/* Ombra cappuccio */}
          <View style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: capWidth * 0.15,
            height: '100%',
            backgroundColor: COLORS.pipe.dark,
          }} />
        </View>
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
            borderRadius: cellSize * 0.15,
            borderWidth: 2,
            borderColor: COLORS.pipe.dark,
            overflow: 'hidden',
          }}
        >
          {/* Highlight cappuccio */}
          <View style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: capWidth * 0.15,
            height: '100%',
            backgroundColor: COLORS.pipe.capHighlight,
          }} />
          {/* Ombra cappuccio */}
          <View style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: capWidth * 0.15,
            height: '100%',
            backgroundColor: COLORS.pipe.dark,
          }} />
        </View>
        {/* Ombra corpo tubo */}
        <View
          style={{
            position: 'absolute',
            left: (capWidth - pipeWidth) / 2 + 3,
            top: capHeight,
            width: pipeWidth,
            height: GAME_HEIGHT * cellSize - gapBottom - capHeight,
            backgroundColor: 'rgba(0,0,0,0.15)',
            borderRadius: 2,
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
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          {/* Highlight sinistro */}
          <View style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: pipeWidth * 0.15,
            height: '100%',
            backgroundColor: COLORS.pipe.highlight,
          }} />
          {/* Ombra destra */}
          <View style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: pipeWidth * 0.2,
            height: '100%',
            backgroundColor: COLORS.pipe.dark,
          }} />
          {/* Stripe decorativo */}
          <View style={{
            position: 'absolute',
            left: pipeWidth * 0.25,
            top: 0,
            width: pipeWidth * 0.08,
            height: '100%',
            backgroundColor: COLORS.pipe.stripe,
          }} />
        </View>
      </View>
    </>
  );
};

// Sole
const Sun = ({ cellSize }: { cellSize: number }) => {
  const sunSize = cellSize * 2;
  return (
    <View
      style={{
        position: 'absolute',
        right: cellSize * 1.5,
        top: cellSize * 1,
      }}
    >
      {/* Alone esterno */}
      <View
        style={{
          position: 'absolute',
          left: -sunSize * 0.3,
          top: -sunSize * 0.3,
          width: sunSize * 1.6,
          height: sunSize * 1.6,
          backgroundColor: COLORS.sun.glow,
          borderRadius: sunSize * 0.8,
        }}
      />
      {/* Alone medio */}
      <View
        style={{
          position: 'absolute',
          left: -sunSize * 0.15,
          top: -sunSize * 0.15,
          width: sunSize * 1.3,
          height: sunSize * 1.3,
          backgroundColor: 'rgba(255, 235, 59, 0.4)',
          borderRadius: sunSize * 0.65,
        }}
      />
      {/* Sole principale */}
      <View
        style={{
          width: sunSize,
          height: sunSize,
          backgroundColor: COLORS.sun.core,
          borderRadius: sunSize / 2,
        }}
      />
      {/* Highlight */}
      <View
        style={{
          position: 'absolute',
          left: sunSize * 0.15,
          top: sunSize * 0.15,
          width: sunSize * 0.3,
          height: sunSize * 0.25,
          backgroundColor: 'rgba(255,255,255,0.6)',
          borderRadius: sunSize * 0.15,
        }}
      />
    </View>
  );
};

// Nuvole di sfondo
const Clouds = ({ cellSize }: { cellSize: number }) => {
  const clouds = [
    { x: 0.5, y: 2, scale: 1.2 },
    { x: 5.5, y: 3.5, scale: 0.8 },
    { x: 2.5, y: 6, scale: 1 },
    { x: 7, y: 8, scale: 0.7 },
    { x: 1, y: 10, scale: 0.9 },
  ];

  return (
    <>
      {clouds.map((cloud, i) => {
        const cloudWidth = cellSize * 2.5 * cloud.scale;
        const cloudHeight = cellSize * 1.2 * cloud.scale;
        return (
          <View
            key={`cloud-${i}`}
            style={{
              position: 'absolute',
              left: cloud.x * cellSize,
              top: cloud.y * cellSize,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            {/* Ombra nuvola */}
            <View
              style={{
                position: 'absolute',
                left: 2,
                top: 3,
                width: cloudWidth,
                height: cloudHeight * 0.8,
                backgroundColor: COLORS.cloudShadow,
                borderRadius: cloudHeight * 0.4,
              }}
            />
            {/* Nuvola principale */}
            <View
              style={{
                width: cloudWidth,
                height: cloudHeight * 0.8,
                backgroundColor: COLORS.cloud,
                borderRadius: cloudHeight * 0.4,
              }}
            />
            {/* Bubble sinistra */}
            <View
              style={{
                position: 'absolute',
                left: cloudWidth * 0.1,
                top: -cloudHeight * 0.25,
                width: cloudWidth * 0.4,
                height: cloudHeight * 0.6,
                backgroundColor: COLORS.cloud,
                borderRadius: cloudHeight * 0.3,
              }}
            />
            {/* Bubble destra */}
            <View
              style={{
                position: 'absolute',
                left: cloudWidth * 0.45,
                top: -cloudHeight * 0.35,
                width: cloudWidth * 0.5,
                height: cloudHeight * 0.7,
                backgroundColor: COLORS.cloud,
                borderRadius: cloudHeight * 0.35,
              }}
            />
          </View>
        );
      })}
    </>
  );
};

// Terra/Prato
const Ground = ({ cellSize }: { cellSize: number }) => {
  const groundHeight = cellSize * 1.5;
  const grassHeight = cellSize * 0.4;

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        bottom: 0,
        right: 0,
        height: groundHeight,
      }}
    >
      {/* Terra */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: grassHeight,
          right: 0,
          bottom: 0,
          backgroundColor: COLORS.ground.dirt,
        }}
      >
        {/* Strato scuro */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            right: 0,
            height: '30%',
            backgroundColor: COLORS.ground.dirtDark,
          }}
        />
      </View>
      {/* Erba */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          right: 0,
          height: grassHeight,
          backgroundColor: COLORS.ground.grass,
          borderTopWidth: 2,
          borderTopColor: COLORS.ground.grassDark,
        }}
      />
    </View>
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
        backgroundColor: COLORS.sky.bottom,
        overflow: 'hidden',
      }}
    >
      {/* Gradiente cielo - strato superiore */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          right: 0,
          height: GAME_HEIGHT * cellSize * 0.35,
          backgroundColor: COLORS.sky.top,
        }}
      />
      {/* Gradiente cielo - strato medio */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: GAME_HEIGHT * cellSize * 0.25,
          right: 0,
          height: GAME_HEIGHT * cellSize * 0.35,
          backgroundColor: COLORS.sky.middle,
          opacity: 0.7,
        }}
      />

      {/* Sole */}
      <Sun cellSize={cellSize} />

      {/* Nuvole */}
      <Clouds cellSize={cellSize} />

      {/* Terra/Prato */}
      <Ground cellSize={cellSize} />

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
