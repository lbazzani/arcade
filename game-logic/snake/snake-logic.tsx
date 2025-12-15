import React from 'react';
import { View } from 'react-native';

export const GRID_WIDTH = 15;
export const GRID_HEIGHT = 25;

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface Position {
  x: number;
  y: number;
}

interface GameState {
  snake: Position[];
  food: Position;
  direction: Direction;
  nextDirection: Direction;
  score: number;
  lastUpdate: number;
  speed: number;
  growing: boolean;
  gameStarted: boolean;
}

// Colori del serpente (gradiente dalla testa alla coda)
const SNAKE_COLORS = {
  head: '#00D4FF',
  body: ['#00C4EE', '#00B4DD', '#00A4CC', '#0094BB', '#0084AA'],
  eye: '#000',
  tongue: '#FF4444',
};

const FOOD_COLORS = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#FF8C42', '#A8E6CF'];

// Genera posizione casuale per il cibo
const getRandomFoodPosition = (snake: Position[]): Position => {
  let position: Position;
  do {
    position = {
      x: Math.floor(Math.random() * GRID_WIDTH),
      y: Math.floor(Math.random() * GRID_HEIGHT),
    };
  } while (snake.some(segment => segment.x === position.x && segment.y === position.y));
  return position;
};

// Componente testa del serpente
const SnakeHead = ({ x, y, direction, cellSize }: { x: number; y: number; direction: Direction; cellSize: number }) => {
  const rotation = {
    UP: '0deg',
    DOWN: '180deg',
    LEFT: '-90deg',
    RIGHT: '90deg',
  }[direction];

  return (
    <View
      style={{
        position: 'absolute',
        left: x * cellSize,
        top: y * cellSize,
        width: cellSize,
        height: cellSize,
        transform: [{ rotate: rotation }],
      }}
    >
      {/* Testa principale */}
      <View
        style={{
          position: 'absolute',
          left: cellSize * 0.08,
          top: cellSize * 0.08,
          width: cellSize * 0.84,
          height: cellSize * 0.92,
          backgroundColor: SNAKE_COLORS.head,
          borderTopLeftRadius: cellSize * 0.4,
          borderTopRightRadius: cellSize * 0.4,
          borderBottomLeftRadius: cellSize * 0.2,
          borderBottomRightRadius: cellSize * 0.2,
        }}
      />
      {/* Occhio sinistro */}
      <View
        style={{
          position: 'absolute',
          left: cellSize * 0.18,
          top: cellSize * 0.25,
          width: cellSize * 0.22,
          height: cellSize * 0.26,
          backgroundColor: '#FFF',
          borderRadius: cellSize * 0.13,
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: cellSize * 0.06,
            top: cellSize * 0.04,
            width: cellSize * 0.12,
            height: cellSize * 0.14,
            backgroundColor: SNAKE_COLORS.eye,
            borderRadius: cellSize * 0.07,
          }}
        />
      </View>
      {/* Occhio destro */}
      <View
        style={{
          position: 'absolute',
          right: cellSize * 0.18,
          top: cellSize * 0.25,
          width: cellSize * 0.22,
          height: cellSize * 0.26,
          backgroundColor: '#FFF',
          borderRadius: cellSize * 0.13,
        }}
      >
        <View
          style={{
            position: 'absolute',
            right: cellSize * 0.06,
            top: cellSize * 0.04,
            width: cellSize * 0.12,
            height: cellSize * 0.14,
            backgroundColor: SNAKE_COLORS.eye,
            borderRadius: cellSize * 0.07,
          }}
        />
      </View>
      {/* Lingua */}
      <View
        style={{
          position: 'absolute',
          left: cellSize * 0.42,
          top: -cellSize * 0.15,
          width: cellSize * 0.08,
          height: cellSize * 0.2,
          backgroundColor: SNAKE_COLORS.tongue,
          borderRadius: cellSize * 0.04,
        }}
      />
      {/* Lingua biforcuta sinistra */}
      <View
        style={{
          position: 'absolute',
          left: cellSize * 0.35,
          top: -cellSize * 0.22,
          width: cellSize * 0.08,
          height: cellSize * 0.12,
          backgroundColor: SNAKE_COLORS.tongue,
          borderRadius: cellSize * 0.04,
          transform: [{ rotate: '-30deg' }],
        }}
      />
      {/* Lingua biforcuta destra */}
      <View
        style={{
          position: 'absolute',
          left: cellSize * 0.49,
          top: -cellSize * 0.22,
          width: cellSize * 0.08,
          height: cellSize * 0.12,
          backgroundColor: SNAKE_COLORS.tongue,
          borderRadius: cellSize * 0.04,
          transform: [{ rotate: '30deg' }],
        }}
      />
    </View>
  );
};

// Componente segmento del corpo
const SnakeBodySegment = ({ x, y, index, total, cellSize }: { x: number; y: number; index: number; total: number; cellSize: number }) => {
  const colorIndex = Math.min(index, SNAKE_COLORS.body.length - 1);
  const color = SNAKE_COLORS.body[colorIndex];
  const scale = 1 - (index / (total + 5)) * 0.3; // Si assottiglia verso la coda

  return (
    <View
      style={{
        position: 'absolute',
        left: x * cellSize + (cellSize * (1 - scale)) / 2,
        top: y * cellSize + (cellSize * (1 - scale)) / 2,
        width: cellSize * scale,
        height: cellSize * scale,
        backgroundColor: color,
        borderRadius: cellSize * 0.25 * scale,
      }}
    />
  );
};

// Componente coda
const SnakeTail = ({ x, y, prevX, prevY, cellSize }: { x: number; y: number; prevX: number; prevY: number; cellSize: number }) => {
  // Calcola la direzione della coda
  const dx = prevX - x;
  const dy = prevY - y;
  let rotation = '0deg';
  if (dx === 1) rotation = '90deg';
  else if (dx === -1) rotation = '-90deg';
  else if (dy === 1) rotation = '180deg';

  return (
    <View
      style={{
        position: 'absolute',
        left: x * cellSize + cellSize * 0.2,
        top: y * cellSize + cellSize * 0.2,
        width: cellSize * 0.6,
        height: cellSize * 0.6,
        transform: [{ rotate: rotation }],
      }}
    >
      <View
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: SNAKE_COLORS.body[SNAKE_COLORS.body.length - 1],
          borderTopLeftRadius: cellSize * 0.15,
          borderTopRightRadius: cellSize * 0.15,
          borderBottomLeftRadius: cellSize * 0.3,
          borderBottomRightRadius: cellSize * 0.3,
        }}
      />
    </View>
  );
};

// Componente cibo (mela)
const Food = ({ x, y, cellSize, score }: { x: number; y: number; cellSize: number; score: number }) => {
  const colorIndex = Math.floor(score / 5) % FOOD_COLORS.length;
  const color = FOOD_COLORS[colorIndex];

  return (
    <View
      style={{
        position: 'absolute',
        left: x * cellSize + cellSize * 0.1,
        top: y * cellSize + cellSize * 0.1,
        width: cellSize * 0.8,
        height: cellSize * 0.8,
      }}
    >
      {/* Corpo della mela */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: cellSize * 0.15,
          width: cellSize * 0.8,
          height: cellSize * 0.65,
          backgroundColor: color,
          borderRadius: cellSize * 0.35,
        }}
      />
      {/* Gambo */}
      <View
        style={{
          position: 'absolute',
          left: cellSize * 0.35,
          top: 0,
          width: cellSize * 0.1,
          height: cellSize * 0.2,
          backgroundColor: '#8B4513',
          borderRadius: cellSize * 0.05,
        }}
      />
      {/* Foglia */}
      <View
        style={{
          position: 'absolute',
          left: cellSize * 0.42,
          top: cellSize * 0.02,
          width: cellSize * 0.25,
          height: cellSize * 0.15,
          backgroundColor: '#4CAF50',
          borderRadius: cellSize * 0.1,
          transform: [{ rotate: '30deg' }],
        }}
      />
      {/* Riflesso */}
      <View
        style={{
          position: 'absolute',
          left: cellSize * 0.12,
          top: cellSize * 0.25,
          width: cellSize * 0.15,
          height: cellSize * 0.15,
          backgroundColor: 'rgba(255, 255, 255, 0.4)',
          borderRadius: cellSize * 0.1,
        }}
      />
    </View>
  );
};

// Componente griglia di sfondo
const BackgroundGrid = ({ cellSize }: { cellSize: number }) => {
  const cells = [];
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      const isEven = (x + y) % 2 === 0;
      cells.push(
        <View
          key={`cell-${x}-${y}`}
          style={{
            position: 'absolute',
            left: x * cellSize,
            top: y * cellSize,
            width: cellSize,
            height: cellSize,
            backgroundColor: isEven ? '#1a1a1a' : '#151515',
          }}
        />
      );
    }
  }
  return <>{cells}</>;
};

// Componente principale del gioco
const GameBoard = (props: any) => {
  const { snake, food, direction, score, cellSize } = props;
  const elements = [];

  // Griglia di sfondo
  elements.push(<BackgroundGrid key="grid" cellSize={cellSize} />);

  // Cibo
  elements.push(<Food key="food" x={food.x} y={food.y} cellSize={cellSize} score={score} />);

  // Serpente (dal fondo alla testa per lo z-index corretto)
  for (let i = snake.length - 1; i >= 0; i--) {
    const segment = snake[i];
    if (i === 0) {
      // Testa
      elements.push(
        <SnakeHead
          key={`snake-head`}
          x={segment.x}
          y={segment.y}
          direction={direction}
          cellSize={cellSize}
        />
      );
    } else if (i === snake.length - 1 && snake.length > 2) {
      // Coda
      const prev = snake[i - 1];
      elements.push(
        <SnakeTail
          key={`snake-tail`}
          x={segment.x}
          y={segment.y}
          prevX={prev.x}
          prevY={prev.y}
          cellSize={cellSize}
        />
      );
    } else {
      // Corpo
      elements.push(
        <SnakeBodySegment
          key={`snake-${i}`}
          x={segment.x}
          y={segment.y}
          index={i}
          total={snake.length}
          cellSize={cellSize}
        />
      );
    }
  }

  return (
    <View
      style={{
        width: GRID_WIDTH * cellSize,
        height: GRID_HEIGHT * cellSize,
        backgroundColor: '#1a1a1a',
        overflow: 'hidden',
      }}
    >
      {elements}
    </View>
  );
};

// Inizializza il gioco
export const initializeGame = (cellSize: number) => {
  const startX = Math.floor(GRID_WIDTH / 2);
  const startY = Math.floor(GRID_HEIGHT / 2);

  // Serpente orizzontale, testa a destra, direzione RIGHT
  // In questo modo il primo movimento non collide mai con se stesso
  const initialSnake = [
    { x: startX, y: startY },         // Testa
    { x: startX - 1, y: startY },     // Corpo
    { x: startX - 2, y: startY },     // Coda
  ];

  return {
    game: {
      snake: initialSnake,
      food: getRandomFoodPosition(initialSnake),
      direction: 'RIGHT' as Direction,
      nextDirection: 'RIGHT' as Direction,
      score: 0,
      lastUpdate: Date.now(),
      speed: 250, // ms tra ogni movimento (più lento all'inizio)
      growing: false,
      gameStarted: false,
      cellSize: cellSize,
      renderer: GameBoard,
    },
  };
};

// Game loop principale
export const GameLoop = (entities: any, { events, dispatch }: any) => {
  const game = entities.game as GameState & { cellSize: number; renderer: any };
  const now = Date.now();

  // Gestione input direzione
  if (events && events.length) {
    events.forEach((event: any) => {
      if (event.type === 'change-direction') {
        const newDir = event.direction as Direction;
        const current = game.direction;

        // Previeni inversione di direzione
        const opposite: Record<Direction, Direction> = {
          UP: 'DOWN',
          DOWN: 'UP',
          LEFT: 'RIGHT',
          RIGHT: 'LEFT',
        };

        if (newDir !== opposite[current] && newDir !== current) {
          game.nextDirection = newDir;
          dispatch({ type: 'direction-changed' });

          // Il primo input avvia il gioco
          if (!game.gameStarted) {
            game.gameStarted = true;
            game.lastUpdate = now;
          }
        }
      }
    });
  }

  // Non muovere finché il gioco non è iniziato
  if (!game.gameStarted) {
    return entities;
  }

  // Aggiorna il gioco in base alla velocità
  if (now - game.lastUpdate >= game.speed) {
    game.direction = game.nextDirection;

    // Calcola nuova posizione della testa
    const head = game.snake[0];
    const moves: Record<Direction, Position> = {
      UP: { x: head.x, y: head.y - 1 },
      DOWN: { x: head.x, y: head.y + 1 },
      LEFT: { x: head.x - 1, y: head.y },
      RIGHT: { x: head.x + 1, y: head.y },
    };
    const newHead = moves[game.direction];

    // Controlla collisione con i muri
    if (newHead.x < 0 || newHead.x >= GRID_WIDTH || newHead.y < 0 || newHead.y >= GRID_HEIGHT) {
      dispatch({ type: 'game-over' });
      return entities;
    }

    // Costruisci il nuovo serpente
    const newSnake = [newHead, ...game.snake];

    // Controlla se ha mangiato il cibo
    const ateFood = newHead.x === game.food.x && newHead.y === game.food.y;

    // Se non ha mangiato, rimuovi la coda
    if (!ateFood) {
      newSnake.pop();
    }

    // Controlla collisione con se stesso (solo dopo il movimento)
    // La nuova testa non deve sovrapporsi al corpo
    for (let i = 1; i < newSnake.length; i++) {
      if (newSnake[i].x === newHead.x && newSnake[i].y === newHead.y) {
        dispatch({ type: 'game-over' });
        return entities;
      }
    }

    // Aggiorna lo stato del serpente
    game.snake = newSnake;

    // Se ha mangiato il cibo, genera nuovo cibo e aggiorna punteggio
    if (ateFood) {
      game.score += 10;
      game.food = getRandomFoodPosition(game.snake);
      dispatch({ type: 'score-update', score: game.score });

      // Aumenta velocità ogni 5 punti (minimo 100ms)
      if (game.score % 5 === 0 && game.speed > 100) {
        game.speed -= 15;
      }
    }

    game.lastUpdate = now;
  }

  return entities;
};
