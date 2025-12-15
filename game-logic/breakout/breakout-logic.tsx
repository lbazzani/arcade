import React from 'react';
import { View } from 'react-native';

export const GAME_WIDTH = 10;
export const GAME_HEIGHT = 16;

const PADDLE_WIDTH = 2.5;
const PADDLE_HEIGHT = 0.5;
const BALL_SIZE = 0.5;
const BRICK_COLS = 8;
const BRICK_HEIGHT = 0.5;
const BRICK_GAP = 0.15;
const BRICK_WIDTH = (GAME_WIDTH - BRICK_GAP * (BRICK_COLS + 1)) / BRICK_COLS;

// Velocità palline (aumentate per gameplay più dinamico)
const BALL_SPEED_NORMAL = 0.15;
const BALL_SPEED_FAST = 0.22;
const BALL_SPEED_SLOW = 0.10;

// Tipi di brick speciali (rimosso slow_down e extra_life)
type BrickType = 'normal' | 'speed_up' | 'multi_ball' | 'explosive';

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  points: number;
  hit: boolean;
  type: BrickType;
  row: number; // Per tracciare la riga originale
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number; // Velocità corrente (normale, veloce, lenta)
  id: number;
}

interface GameState {
  paddleX: number;
  targetPaddleX: number;
  balls: Ball[];
  bricks: Brick[];
  score: number;
  lives: number;
  lastUpdate: number;
  gameStarted: boolean;
  ballLaunched: boolean;
  ballIdCounter: number;
  lastRowSpawn: number; // Timestamp ultimo spawn di riga
  rowSpawnInterval: number; // Intervallo spawn righe (ms)
  currentSpeedMode: 'normal' | 'fast';
  speedModeTimer: number; // Quando torna normale
  combo: number; // Combo brick consecutivi
  lastBrickHitTime: number;
}

// Colori per tipo di brick
const BRICK_COLORS: Record<BrickType, string> = {
  normal: '#FF4757',
  speed_up: '#FF6B35',    // Arancione - accelera
  multi_ball: '#9B59B6',  // Viola - multi-ball
  explosive: '#FFD93D',   // Giallo - esplosivo
};

// Punti per tipo
const BRICK_POINTS: Record<BrickType, number> = {
  normal: 10,
  speed_up: 15,
  multi_ball: 20,
  explosive: 15,
};

// Icone/simboli per brick speciali
const BRICK_SYMBOLS: Record<BrickType, string> = {
  normal: '',
  speed_up: '>>',
  multi_ball: '+',
  explosive: '*',
};

// Componente mattone
const BrickComponent = ({ brick, cellSize }: { brick: Brick; cellSize: number }) => {
  if (brick.hit) return null;

  const brickWidth = brick.width * cellSize;
  const brickHeight = brick.height * cellSize;
  const borderRadius = cellSize * 0.12;

  return (
    <View
      style={{
        position: 'absolute',
        left: brick.x * cellSize,
        top: brick.y * cellSize,
        width: brickWidth,
        height: brickHeight,
        borderRadius: borderRadius,
        overflow: 'hidden',
      }}
    >
      {/* Base color */}
      <View
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: brick.color,
        }}
      />
      {/* Top highlight */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          backgroundColor: 'rgba(255,255,255,0.25)',
          borderTopLeftRadius: borderRadius,
          borderTopRightRadius: borderRadius,
        }}
      />
      {/* Bottom shadow */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '30%',
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderBottomLeftRadius: borderRadius,
          borderBottomRightRadius: borderRadius,
        }}
      />
      {/* Special brick indicator */}
      {brick.type !== 'normal' && (
        <View
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {brick.type === 'multi_ball' && (
            <View style={{ flexDirection: 'row', gap: 2 }}>
              <View style={{
                width: cellSize * 0.12,
                height: cellSize * 0.12,
                backgroundColor: '#fff',
                borderRadius: cellSize * 0.06,
              }} />
              <View style={{
                width: cellSize * 0.12,
                height: cellSize * 0.12,
                backgroundColor: '#fff',
                borderRadius: cellSize * 0.06,
              }} />
            </View>
          )}
          {brick.type === 'explosive' && (
            <View style={{
              width: cellSize * 0.2,
              height: cellSize * 0.2,
              backgroundColor: '#fff',
              borderRadius: cellSize * 0.03,
              transform: [{ rotate: '45deg' }],
            }} />
          )}
          {brick.type === 'speed_up' && (
            <View style={{ flexDirection: 'row', gap: 1 }}>
              <View style={{
                width: 0,
                height: 0,
                borderLeftWidth: cellSize * 0.08,
                borderLeftColor: '#fff',
                borderTopWidth: cellSize * 0.06,
                borderTopColor: 'transparent',
                borderBottomWidth: cellSize * 0.06,
                borderBottomColor: 'transparent',
              }} />
              <View style={{
                width: 0,
                height: 0,
                borderLeftWidth: cellSize * 0.08,
                borderLeftColor: '#fff',
                borderTopWidth: cellSize * 0.06,
                borderTopColor: 'transparent',
                borderBottomWidth: cellSize * 0.06,
                borderBottomColor: 'transparent',
              }} />
            </View>
          )}
        </View>
      )}
    </View>
  );
};

// Componente paddle
const Paddle = ({ x, cellSize, speedMode }: { x: number; cellSize: number; speedMode: string }) => {
  const paddleColor = speedMode === 'fast' ? '#FF6B35' : '#00D4FF';
  const paddleWidth = PADDLE_WIDTH * cellSize;
  const paddleHeight = PADDLE_HEIGHT * cellSize;
  const borderRadius = paddleHeight / 2;

  return (
    <View
      style={{
        position: 'absolute',
        left: x * cellSize,
        bottom: cellSize * 1,
        width: paddleWidth,
        height: paddleHeight,
        borderRadius: borderRadius,
        overflow: 'hidden',
      }}
    >
      {/* Base color */}
      <View
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: paddleColor,
        }}
      />
      {/* Top highlight - glossy effect */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: '5%',
          right: '5%',
          height: '45%',
          backgroundColor: 'rgba(255,255,255,0.4)',
          borderRadius: borderRadius,
        }}
      />
      {/* Center line */}
      <View
        style={{
          position: 'absolute',
          top: '40%',
          left: '45%',
          width: '10%',
          height: '20%',
          backgroundColor: 'rgba(255,255,255,0.6)',
          borderRadius: 2,
        }}
      />
      {/* Bottom shadow */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '30%',
          backgroundColor: 'rgba(0,0,0,0.25)',
          borderBottomLeftRadius: borderRadius,
          borderBottomRightRadius: borderRadius,
        }}
      />
    </View>
  );
};

// Componente pallina
const BallComponent = ({ ball, cellSize, speedMode }: { ball: Ball; cellSize: number; speedMode: string }) => {
  const ballSize = BALL_SIZE * cellSize;
  const ballColor = speedMode === 'fast' ? '#FF6B35' : '#FFF';

  return (
    <View
      style={{
        position: 'absolute',
        left: ball.x * cellSize - ballSize / 2,
        top: ball.y * cellSize - ballSize / 2,
        width: ballSize,
        height: ballSize,
        borderRadius: ballSize / 2,
        overflow: 'hidden',
      }}
    >
      {/* Base */}
      <View
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: ballColor,
          borderRadius: ballSize / 2,
        }}
      />
      {/* Highlight */}
      <View
        style={{
          position: 'absolute',
          top: '15%',
          left: '15%',
          width: '35%',
          height: '35%',
          backgroundColor: 'rgba(255,255,255,0.6)',
          borderRadius: ballSize / 2,
        }}
      />
    </View>
  );
};

// Componente vite
const Lives = ({ lives, cellSize }: { lives: number; cellSize: number }) => {
  const hearts = [];
  for (let i = 0; i < Math.min(lives, 5); i++) {
    hearts.push(
      <View
        key={`life-${i}`}
        style={{
          width: cellSize * 0.5,
          height: cellSize * 0.5,
          marginRight: cellSize * 0.15,
          backgroundColor: '#FF4757',
          borderRadius: cellSize * 0.25,
        }}
      />
    );
  }

  return (
    <View
      style={{
        position: 'absolute',
        right: cellSize * 0.5,
        bottom: cellSize * 0.3,
        flexDirection: 'row',
      }}
    >
      {hearts}
      {lives > 5 && (
        <View style={{
          width: cellSize * 0.5,
          height: cellSize * 0.5,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            width: cellSize * 0.3,
            height: cellSize * 0.1,
            backgroundColor: '#FF4757',
          }} />
        </View>
      )}
    </View>
  );
};

// Indicatore velocità
const SpeedIndicator = ({ speedMode, cellSize }: { speedMode: string; cellSize: number }) => {
  if (speedMode === 'normal') return null;

  return (
    <View
      style={{
        position: 'absolute',
        left: cellSize * 0.5,
        bottom: cellSize * 0.3,
        paddingHorizontal: cellSize * 0.3,
        paddingVertical: cellSize * 0.1,
        backgroundColor: '#FF6B35',
        borderRadius: cellSize * 0.2,
      }}
    />
  );
};

// Componente principale
const GameBoard = (props: any) => {
  const { paddleX, balls, bricks, lives, cellSize, currentSpeedMode } = props;

  // Safety checks
  const safeBalls = balls || [];
  const safeBricks = bricks || [];
  const safeSpeedMode = currentSpeedMode || 'normal';

  return (
    <View
      style={{
        width: GAME_WIDTH * cellSize,
        height: GAME_HEIGHT * cellSize,
        backgroundColor: '#0a0a1a',
        overflow: 'hidden',
      }}
    >
      {/* Mattoni */}
      {safeBricks.map((brick: Brick, index: number) => (
        <BrickComponent key={`brick-${index}`} brick={brick} cellSize={cellSize} />
      ))}

      {/* Paddle */}
      <Paddle x={paddleX} cellSize={cellSize} speedMode={safeSpeedMode} />

      {/* Palline */}
      {safeBalls.map((ball: Ball) => (
        <BallComponent key={`ball-${ball.id}`} ball={ball} cellSize={cellSize} speedMode={safeSpeedMode} />
      ))}

      {/* Vite */}
      <Lives lives={lives} cellSize={cellSize} />

      {/* Indicatore velocità */}
      <SpeedIndicator speedMode={safeSpeedMode} cellSize={cellSize} />
    </View>
  );
};

// Genera tipo di brick con probabilità
const getRandomBrickType = (row: number): BrickType => {
  const rand = Math.random();

  // Alta probabilità di brick speciali (40% base + 4% per riga)
  const specialChance = 0.40 + (row * 0.04);

  if (rand < specialChance) {
    const specialRand = Math.random();
    if (specialRand < 0.40) return 'speed_up';     // 40% - accelera
    if (specialRand < 0.70) return 'multi_ball';   // 30% - multi-ball
    return 'explosive';                            // 30% - esplosivo
  }

  return 'normal';
};

// Genera una riga di brick
const generateBrickRow = (rowIndex: number, yPosition: number): Brick[] => {
  const bricks: Brick[] = [];

  for (let col = 0; col < BRICK_COLS; col++) {
    const x = BRICK_GAP + col * (BRICK_WIDTH + BRICK_GAP);
    const type = getRandomBrickType(rowIndex);

    bricks.push({
      x,
      y: yPosition,
      width: BRICK_WIDTH,
      height: BRICK_HEIGHT,
      color: BRICK_COLORS[type],
      points: BRICK_POINTS[type],
      hit: false,
      type,
      row: rowIndex,
    });
  }

  return bricks;
};

// Genera i mattoni iniziali
const generateBricks = (): Brick[] => {
  const bricks: Brick[] = [];
  const initialRows = 5;

  for (let row = 0; row < initialRows; row++) {
    const y = BRICK_GAP + row * (BRICK_HEIGHT + BRICK_GAP);
    const rowBricks = generateBrickRow(row, y);
    bricks.push(...rowBricks);
  }

  return bricks;
};

// Inizializza il gioco
export const initializeGame = (cellSize: number) => {
  const startPaddleX = (GAME_WIDTH - PADDLE_WIDTH) / 2;

  return {
    game: {
      paddleX: startPaddleX,
      targetPaddleX: startPaddleX,
      balls: [{
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT - 2,
        vx: 0,
        vy: 0,
        speed: BALL_SPEED_NORMAL,
        id: 0,
      }],
      bricks: generateBricks(),
      score: 0,
      lives: 3,
      lastUpdate: Date.now(),
      gameStarted: false,
      ballLaunched: false,
      ballIdCounter: 1,
      lastRowSpawn: Date.now(),
      rowSpawnInterval: 8000, // Nuova riga ogni 8 secondi
      currentSpeedMode: 'normal' as const,
      speedModeTimer: 0,
      combo: 0,
      lastBrickHitTime: 0,
      cellSize: cellSize,
      renderer: GameBoard,
    },
  };
};

// Applica effetto del brick
const applyBrickEffect = (
  state: GameState & { cellSize: number },
  brick: Brick,
  ballIndex: number,
  dispatch: any
) => {
  switch (brick.type) {
    case 'speed_up':
      state.currentSpeedMode = 'fast';
      state.speedModeTimer = Date.now() + 6000; // 6 secondi
      // Aumenta velocità di tutte le palline
      state.balls.forEach(ball => {
        const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        if (currentSpeed > 0) {
          const ratio = BALL_SPEED_FAST / currentSpeed;
          ball.vx *= ratio;
          ball.vy *= ratio;
        }
        ball.speed = BALL_SPEED_FAST;
      });
      break;


    case 'multi_ball':
      // Aggiungi 1 nuova pallina dalla posizione della palla che ha colpito
      const sourceBall = state.balls[ballIndex];
      if (sourceBall && state.balls.length < 5) { // Max 5 palline
        for (let i = 0; i < 1; i++) {
          const angle = (Math.random() - 0.5) * Math.PI * 0.5; // Angolo casuale
          const speed = sourceBall.speed;
          state.balls.push({
            x: sourceBall.x,
            y: sourceBall.y,
            vx: Math.sin(angle) * speed,
            vy: -Math.abs(Math.cos(angle) * speed),
            speed: speed,
            id: state.ballIdCounter++,
          });
        }
      }
      break;

    case 'explosive':
      // Distruggi brick vicini (raggio contenuto)
      const explosionRadius = BRICK_WIDTH * 1.2;
      state.bricks.forEach((b, idx) => {
        if (b.hit) return;
        const dx = Math.abs(b.x + b.width / 2 - (brick.x + brick.width / 2));
        const dy = Math.abs(b.y + b.height / 2 - (brick.y + brick.height / 2));
        if (dx < explosionRadius && dy < explosionRadius && b !== brick) {
          state.bricks[idx] = { ...b, hit: true };
          state.score = (state.score || 0) + (b.points || 10);
        }
      });
      break;
  }
};

// Game loop
export const GameLoop = (entities: any, { events, dispatch }: any) => {
  const state = entities.game as GameState & { cellSize: number };
  const now = Date.now();
  const deltaTime = now - state.lastUpdate;

  // Gestione eventi
  if (events && events.length) {
    events.forEach((event: any) => {
      if (event.type === 'launch') {
        if (!state.ballLaunched && state.balls.length > 0) {
          state.ballLaunched = true;
          state.gameStarted = true;
          state.lastUpdate = now;
          state.lastRowSpawn = now;
          const direction = Math.random() > 0.5 ? 1 : -1;
          state.balls[0].vx = BALL_SPEED_NORMAL * 0.6 * direction;
          state.balls[0].vy = -BALL_SPEED_NORMAL;
          state.balls[0].speed = BALL_SPEED_NORMAL;
        }
      }
    });
  }

  // Aggiorna fisica (~60fps)
  if (deltaTime >= 16) {
    state.paddleX = state.targetPaddleX;

    // Se la palla non è lanciata, segue il paddle
    if (!state.ballLaunched) {
      if (state.balls.length > 0) {
        state.balls[0].x = state.paddleX + PADDLE_WIDTH / 2;
      }
      state.lastUpdate = now;
      return entities;
    }

    // Controlla timer velocità
    if (state.speedModeTimer > 0 && now > state.speedModeTimer) {
      state.currentSpeedMode = 'normal';
      state.speedModeTimer = 0;
      state.balls.forEach(ball => {
        const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        if (currentSpeed > 0) {
          const ratio = BALL_SPEED_NORMAL / currentSpeed;
          ball.vx *= ratio;
          ball.vy *= ratio;
        }
        ball.speed = BALL_SPEED_NORMAL;
      });
    }

    // Reset combo se passato troppo tempo
    if (now - state.lastBrickHitTime > 2000) {
      state.combo = 0;
    }

    // Spawn nuova riga di brick
    if (state.gameStarted && now - state.lastRowSpawn > state.rowSpawnInterval) {
      state.lastRowSpawn = now;

      // Sposta tutti i brick in basso
      const shiftAmount = BRICK_HEIGHT + BRICK_GAP;
      state.bricks.forEach(brick => {
        brick.y += shiftAmount;
      });

      // Aggiungi nuova riga in alto
      const newRow = generateBrickRow(0, BRICK_GAP);
      state.bricks = [...newRow, ...state.bricks];

      // Controlla se i brick hanno raggiunto il paddle (game over)
      const activeBricks = state.bricks.filter(b => !b.hit);
      if (activeBricks.length > 0) {
        const lowestBrick = Math.max(...activeBricks.map(b => b.y + b.height));
        if (lowestBrick > GAME_HEIGHT - 2) {
          dispatch({ type: 'game-over' });
          return entities;
        }
      }

      // Riduci intervallo spawn (più difficile col tempo, min 3 secondi)
      state.rowSpawnInterval = Math.max(3000, state.rowSpawnInterval - 500);
    }

    // Aggiorna ogni pallina
    const ballsToRemove: number[] = [];
    let brickHit = false;

    for (let ballIdx = 0; ballIdx < state.balls.length; ballIdx++) {
      const ball = state.balls[ballIdx];

      // Muovi pallina
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Collisione muri laterali
      if (ball.x - BALL_SIZE / 2 < 0) {
        ball.x = BALL_SIZE / 2;
        ball.vx = Math.abs(ball.vx);
        dispatch({ type: 'wall-hit' });
      } else if (ball.x + BALL_SIZE / 2 > GAME_WIDTH) {
        ball.x = GAME_WIDTH - BALL_SIZE / 2;
        ball.vx = -Math.abs(ball.vx);
        dispatch({ type: 'wall-hit' });
      }

      // Collisione soffitto
      if (ball.y - BALL_SIZE / 2 < 0) {
        ball.y = BALL_SIZE / 2;
        ball.vy = Math.abs(ball.vy);
        dispatch({ type: 'wall-hit' });
      }

      // Collisione paddle
      const paddleTop = GAME_HEIGHT - 1 - PADDLE_HEIGHT;
      const ballRadius = BALL_SIZE / 2;

      if (
        ball.y + ballRadius > paddleTop &&
        ball.y + ballRadius < paddleTop + PADDLE_HEIGHT + 0.5 &&
        ball.x > state.paddleX - 0.1 &&
        ball.x < state.paddleX + PADDLE_WIDTH + 0.1 &&
        ball.vy > 0
      ) {
        ball.vy = -Math.abs(ball.vy);
        ball.y = paddleTop - ballRadius;
        const hitPos = (ball.x - state.paddleX) / PADDLE_WIDTH;
        ball.vx = (hitPos - 0.5) * ball.speed * 2;
        dispatch({ type: 'paddle-hit' });
      }

      // Collisione mattoni
      for (let i = 0; i < state.bricks.length; i++) {
        const brick = state.bricks[i];
        if (brick.hit) continue;

        const brickLeft = brick.x;
        const brickRight = brick.x + brick.width;
        const brickTop = brick.y;
        const brickBottom = brick.y + brick.height;

        if (
          ball.x + ballRadius > brickLeft &&
          ball.x - ballRadius < brickRight &&
          ball.y + ballRadius > brickTop &&
          ball.y - ballRadius < brickBottom
        ) {
          state.bricks[i] = { ...brick, hit: true };
          brickHit = true;

          // Calcola rimbalzo
          const overlapLeft = (ball.x + ballRadius) - brickLeft;
          const overlapRight = brickRight - (ball.x - ballRadius);
          const overlapTop = (ball.y + ballRadius) - brickTop;
          const overlapBottom = brickBottom - (ball.y - ballRadius);

          const minOverlapX = Math.min(overlapLeft, overlapRight);
          const minOverlapY = Math.min(overlapTop, overlapBottom);

          if (minOverlapX < minOverlapY) {
            ball.vx = -ball.vx;
          } else {
            ball.vy = -ball.vy;
          }

          // Combo bonus
          state.combo++;
          state.lastBrickHitTime = now;
          const comboMultiplier = Math.min(state.combo, 10);
          const points = (brick.points || 10) * comboMultiplier;

          state.score = (state.score || 0) + points;
          dispatch({ type: 'score-update', score: state.score });
          dispatch({ type: 'brick-hit' });

          // Applica effetto speciale
          if (brick.type !== 'normal') {
            dispatch({ type: 'powerup-collected' });
          }
          applyBrickEffect(state, brick, ballIdx, dispatch);

          // Controlla vittoria
          const allHit = state.bricks.every(b => b.hit);
          if (allHit) {
            dispatch({ type: 'win' });
          }
          break;
        }
      }

      // Pallina cade
      if (ball.y > GAME_HEIGHT + 1) {
        ballsToRemove.push(ballIdx);
      }
    }

    // Rimuovi palline cadute
    if (ballsToRemove.length > 0) {
      state.balls = state.balls.filter((_, idx) => !ballsToRemove.includes(idx));

      // Se non ci sono più palline
      if (state.balls.length === 0) {
        state.lives -= 1;
        dispatch({ type: 'lives-update', lives: state.lives });

        if (state.lives <= 0) {
          dispatch({ type: 'game-over' });
        } else {
          // Reset con nuova pallina
          state.ballLaunched = false;
          state.currentSpeedMode = 'normal';
          state.speedModeTimer = 0;
          state.combo = 0;
          state.balls = [{
            x: state.paddleX + PADDLE_WIDTH / 2,
            y: GAME_HEIGHT - 2,
            vx: 0,
            vy: 0,
            speed: BALL_SPEED_NORMAL,
            id: state.ballIdCounter++,
          }];
        }
      }
    }

    if (brickHit) {
      state.bricks = [...state.bricks];
    }

    // Forza re-render delle palline creando un nuovo array
    state.balls = state.balls.map(b => ({ ...b }));

    state.lastUpdate = now;
  }

  return entities;
};
