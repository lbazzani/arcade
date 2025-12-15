import React from 'react';
import { View } from 'react-native';

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

// Colori per i pezzi Tetris
const COLORS: { [key: string]: string } = {
  I: '#00F0F0',
  O: '#F0F000',
  T: '#A000F0',
  S: '#00F000',
  Z: '#F00000',
  J: '#0000F0',
  L: '#F0A000',
};

// Forme dei pezzi Tetris
const SHAPES: { [key: string]: number[][][] } = {
  I: [
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
  ],
  O: [
    [[1, 1], [1, 1]],
  ],
  T: [
    [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 1], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
    [[0, 1, 0], [1, 1, 0], [0, 1, 0]],
  ],
  S: [
    [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 1], [0, 0, 1]],
  ],
  Z: [
    [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    [[0, 0, 1], [0, 1, 1], [0, 1, 0]],
  ],
  J: [
    [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 1], [0, 1, 0], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 1], [0, 0, 1]],
    [[0, 1, 0], [0, 1, 0], [1, 1, 0]],
  ],
  L: [
    [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
    [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
    [[1, 1, 0], [0, 1, 0], [0, 1, 0]],
  ],
};

const PIECE_TYPES = Object.keys(SHAPES);

interface Position {
  x: number;
  y: number;
}

interface Piece {
  type: string;
  position: Position;
  rotation: number;
}

interface GameState {
  board: number[][];
  currentPiece: Piece;
  score: number;
  lastUpdate: number;
  gameSpeed: number;
}

// Crea una board vuota
const createEmptyBoard = (): number[][] => {
  return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0));
};

// Ottiene un pezzo casuale
const getRandomPiece = (): Piece => {
  const type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
  return {
    type,
    position: { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 },
    rotation: 0,
  };
};

// Ottiene la forma corrente del pezzo
const getCurrentShape = (piece: Piece): number[][] => {
  return SHAPES[piece.type][piece.rotation];
};

// Controlla se il pezzo può essere posizionato
const canPlacePiece = (board: number[][], piece: Piece): boolean => {
  const shape = getCurrentShape(piece);

  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        const boardX = piece.position.x + x;
        const boardY = piece.position.y + y;

        if (
          boardX < 0 ||
          boardX >= BOARD_WIDTH ||
          boardY >= BOARD_HEIGHT ||
          (boardY >= 0 && board[boardY][boardX])
        ) {
          return false;
        }
      }
    }
  }
  return true;
};

// Fissa il pezzo sulla board
const lockPiece = (board: number[][], piece: Piece): number[][] => {
  const newBoard = board.map(row => [...row]);
  const shape = getCurrentShape(piece);
  const pieceTypeIndex = PIECE_TYPES.indexOf(piece.type) + 1;

  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        const boardY = piece.position.y + y;
        const boardX = piece.position.x + x;
        if (boardY >= 0 && boardY < BOARD_HEIGHT) {
          newBoard[boardY][boardX] = pieceTypeIndex;
        }
      }
    }
  }
  return newBoard;
};

// Rimuove le righe completate
const clearLines = (board: number[][]): { newBoard: number[][], linesCleared: number } => {
  let linesCleared = 0;
  const newBoard = board.filter(row => {
    if (row.every(cell => cell !== 0)) {
      linesCleared++;
      return false;
    }
    return true;
  });

  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(0));
  }

  return { newBoard, linesCleared };
};

// Component per renderizzare il gioco
const Board = (props: any) => {
  const { board, currentPiece, cellSize } = props;
  const cells = [];

  // Renderizza la board
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      const cellValue = board[y][x];
      const color = cellValue ? COLORS[PIECE_TYPES[cellValue - 1]] : '#111';

      cells.push(
        <View
          key={`${x}-${y}`}
          style={{
            position: 'absolute',
            left: x * cellSize,
            top: y * cellSize,
            width: cellSize,
            height: cellSize,
            backgroundColor: color,
            borderWidth: 0.5,
            borderColor: '#222',
          }}
        />
      );
    }
  }

  // Renderizza il pezzo corrente
  const shape = getCurrentShape(currentPiece);
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        const screenX = currentPiece.position.x + x;
        const screenY = currentPiece.position.y + y;

        if (screenY >= 0 && screenY < BOARD_HEIGHT && screenX >= 0 && screenX < BOARD_WIDTH) {
          cells.push(
            <View
              key={`current-${x}-${y}`}
              style={{
                position: 'absolute',
                left: screenX * cellSize,
                top: screenY * cellSize,
                width: cellSize,
                height: cellSize,
                backgroundColor: COLORS[currentPiece.type],
                borderWidth: 0.5,
                borderColor: '#000',
              }}
            />
          );
        }
      }
    }
  }

  return <View style={{ width: BOARD_WIDTH * cellSize, height: BOARD_HEIGHT * cellSize }}>{cells}</View>;
};

// Inizializza il gioco
export const initializeGame = (cellSize: number) => {
  return {
    board: {
      board: createEmptyBoard(),
      currentPiece: getRandomPiece(),
      score: 0,
      lastUpdate: Date.now(),
      gameSpeed: 500,
      cellSize: cellSize,
      renderer: Board
    }
  };
};

// Game loop principale
export const GameLoop = (entities: any, { events, dispatch }: any) => {
  const state = entities.board;
  const now = Date.now();

  // Gestione eventi
  if (events && events.length) {
    events.forEach((event: any) => {
      const newPiece = {
        ...state.currentPiece,
        position: { ...state.currentPiece.position }
      };

      if (event.type === 'move-left') {
        newPiece.position.x--;
        if (canPlacePiece(state.board, newPiece)) {
          state.currentPiece = newPiece;
          dispatch({ type: 'piece-moved' });
        }
      } else if (event.type === 'move-right') {
        newPiece.position.x++;
        if (canPlacePiece(state.board, newPiece)) {
          state.currentPiece = newPiece;
          dispatch({ type: 'piece-moved' });
        }
      } else if (event.type === 'move-down') {
        newPiece.position.y++;
        if (canPlacePiece(state.board, newPiece)) {
          state.currentPiece = newPiece;
        }
      } else if (event.type === 'rotate') {
        const maxRotation = SHAPES[newPiece.type].length;
        newPiece.rotation = (newPiece.rotation + 1) % maxRotation;
        if (canPlacePiece(state.board, newPiece)) {
          state.currentPiece = newPiece;
          dispatch({ type: 'piece-rotated' });
        }
      }
    });
  }

  // Movimento automatico verso il basso
  if (now - state.lastUpdate > state.gameSpeed) {
    const newPiece = {
      ...state.currentPiece,
      position: { ...state.currentPiece.position }
    };
    newPiece.position.y++;

    if (canPlacePiece(state.board, newPiece)) {
      state.currentPiece = newPiece;
    } else {
      // Fissa il pezzo
      state.board = lockPiece(state.board, state.currentPiece);
      dispatch({ type: 'piece-locked' });

      // Pulisci le righe
      const { newBoard, linesCleared } = clearLines(state.board);
      state.board = newBoard;

      if (linesCleared > 0) {
        // Bonus per più linee: 1=40, 2=100, 3=300, 4=1200 (classico Tetris)
        const linePoints = [0, 40, 100, 300, 1200];
        state.score += linePoints[Math.min(linesCleared, 4)];
        dispatch({ type: 'score-update', score: state.score });
        dispatch({ type: 'lines-cleared', lines: linesCleared });
      }

      // Nuovo pezzo
      state.currentPiece = getRandomPiece();

      // Controlla game over
      if (!canPlacePiece(state.board, state.currentPiece)) {
        dispatch({ type: 'game-over' });
      }
    }

    state.lastUpdate = now;
  }

  return entities;
};
