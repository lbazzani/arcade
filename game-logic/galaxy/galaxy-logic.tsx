import React from 'react';
import { View } from 'react-native';

export const GAME_WIDTH = 10; // Unità logiche
export const GAME_HEIGHT = 20;

// Tipi di nemici con caratteristiche diverse
export const ENEMY_TYPES = {
  BASIC: {
    color: '#FF4444',
    speed: 0.25,
    points: 10,
    size: 1.2,
  },
  FAST: {
    color: '#FF8844',
    speed: 0.45,
    points: 20,
    size: 1.0,
  },
  TANK: {
    color: '#8844FF',
    speed: 0.15,
    points: 30,
    size: 1.5,
  },
};

interface Position {
  x: number;
  y: number;
}

interface Bullet extends Position {
  id: string;
}

interface Enemy extends Position {
  id: string;
  type: keyof typeof ENEMY_TYPES;
  destroyed?: boolean;
}

interface GameState {
  shipX: number;
  bullets: Bullet[];
  enemies: Enemy[];
  score: number;
  lastUpdate: number;
  lastEnemySpawn: number;
  bulletIdCounter: number;
  enemyIdCounter: number;
}

// Componente astronave del giocatore
const PlayerShip = ({ x, y, cellSize }: { x: number; y: number; cellSize: number }) => {
  return (
    <View
      style={{
        position: 'absolute',
        left: x * cellSize,
        bottom: y * cellSize,
        width: cellSize * 1.8,
        height: cellSize * 2,
      }}
    >
      {/* Corpo principale */}
      <View
        style={{
          position: 'absolute',
          left: cellSize * 0.4,
          top: cellSize * 0.3,
          width: cellSize * 1.0,
          height: cellSize * 1.4,
          backgroundColor: '#00D4FF',
          borderRadius: cellSize * 0.2,
        }}
      />
      {/* Ala sinistra */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: cellSize * 0.8,
          width: cellSize * 0.5,
          height: cellSize * 0.8,
          backgroundColor: '#0088FF',
          borderTopLeftRadius: cellSize * 0.3,
          borderBottomLeftRadius: cellSize * 0.2,
        }}
      />
      {/* Ala destra */}
      <View
        style={{
          position: 'absolute',
          right: 0,
          top: cellSize * 0.8,
          width: cellSize * 0.5,
          height: cellSize * 0.8,
          backgroundColor: '#0088FF',
          borderTopRightRadius: cellSize * 0.3,
          borderBottomRightRadius: cellSize * 0.2,
        }}
      />
      {/* Cockpit */}
      <View
        style={{
          position: 'absolute',
          left: cellSize * 0.6,
          top: cellSize * 0.1,
          width: cellSize * 0.6,
          height: cellSize * 0.5,
          backgroundColor: '#00FFFF',
          borderRadius: cellSize * 0.3,
        }}
      />
      {/* Motore sinistro */}
      <View
        style={{
          position: 'absolute',
          left: cellSize * 0.2,
          bottom: 0,
          width: cellSize * 0.3,
          height: cellSize * 0.4,
          backgroundColor: '#FF6600',
          borderBottomLeftRadius: cellSize * 0.15,
          borderBottomRightRadius: cellSize * 0.15,
        }}
      />
      {/* Motore destro */}
      <View
        style={{
          position: 'absolute',
          right: cellSize * 0.2,
          bottom: 0,
          width: cellSize * 0.3,
          height: cellSize * 0.4,
          backgroundColor: '#FF6600',
          borderBottomLeftRadius: cellSize * 0.15,
          borderBottomRightRadius: cellSize * 0.15,
        }}
      />
    </View>
  );
};

// Componente nemico
const EnemyShip = ({ enemy, cellSize }: { enemy: Enemy; cellSize: number }) => {
  const config = ENEMY_TYPES[enemy.type];

  if (enemy.destroyed) {
    // Animazione esplosione
    return (
      <View
        style={{
          position: 'absolute',
          left: enemy.x * cellSize,
          top: enemy.y * cellSize,
          width: cellSize * config.size * 1.5,
          height: cellSize * config.size * 1.5,
        }}
      >
        <View
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#FFA500',
            borderRadius: cellSize * config.size,
            opacity: 0.8,
          }}
        />
      </View>
    );
  }

  return (
    <View
      style={{
        position: 'absolute',
        left: enemy.x * cellSize,
        top: enemy.y * cellSize,
        width: cellSize * config.size * 1.5,
        height: cellSize * config.size * 1.5,
      }}
    >
      {/* Corpo principale */}
      <View
        style={{
          position: 'absolute',
          left: cellSize * config.size * 0.25,
          top: 0,
          width: cellSize * config.size,
          height: cellSize * config.size * 1.2,
          backgroundColor: config.color,
          borderRadius: cellSize * config.size * 0.2,
        }}
      />
      {/* Ala sinistra */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: cellSize * config.size * 0.3,
          width: cellSize * config.size * 0.4,
          height: cellSize * config.size * 0.6,
          backgroundColor: config.color,
          opacity: 0.7,
          borderTopLeftRadius: cellSize * config.size * 0.2,
          borderBottomLeftRadius: cellSize * config.size * 0.2,
        }}
      />
      {/* Ala destra */}
      <View
        style={{
          position: 'absolute',
          right: 0,
          top: cellSize * config.size * 0.3,
          width: cellSize * config.size * 0.4,
          height: cellSize * config.size * 0.6,
          backgroundColor: config.color,
          opacity: 0.7,
          borderTopRightRadius: cellSize * config.size * 0.2,
          borderBottomRightRadius: cellSize * config.size * 0.2,
        }}
      />
      {/* Dettaglio centrale */}
      <View
        style={{
          position: 'absolute',
          left: cellSize * config.size * 0.45,
          top: cellSize * config.size * 0.2,
          width: cellSize * config.size * 0.6,
          height: cellSize * config.size * 0.4,
          backgroundColor: '#FFF',
          opacity: 0.3,
          borderRadius: cellSize * config.size * 0.2,
        }}
      />
    </View>
  );
};

// Component per renderizzare il gioco
const GameBoard = (props: any) => {
  const { shipX, bullets, enemies, cellSize } = props;
  const elements = [];

  // Renderizza astronave del giocatore
  elements.push(
    <PlayerShip key="ship" x={shipX} y={1} cellSize={cellSize} />
  );

  // Renderizza proiettili
  bullets.forEach((bullet: Bullet) => {
    elements.push(
      <View
        key={`bullet-${bullet.id}`}
        style={{
          position: 'absolute',
          left: bullet.x * cellSize + cellSize * 0.4,
          top: bullet.y * cellSize,
          width: cellSize * 0.25,
          height: cellSize * 0.8,
          backgroundColor: '#FFFF00',
          borderRadius: cellSize * 0.12,
          shadowColor: '#FFFF00',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: cellSize * 0.3,
        }}
      />
    );
  });

  // Renderizza nemici
  enemies.forEach((enemy: Enemy) => {
    elements.push(
      <EnemyShip key={`enemy-${enemy.id}`} enemy={enemy} cellSize={cellSize} />
    );
  });

  return (
    <View style={{
      width: GAME_WIDTH * cellSize,
      height: GAME_HEIGHT * cellSize,
      backgroundColor: '#000',
    }}>
      {elements}
    </View>
  );
};

// Inizializza il gioco
export const initializeGame = (cellSize: number) => {
  return {
    game: {
      shipX: GAME_WIDTH / 2 - 0.9, // Centra l'astronave
      bullets: [],
      enemies: [],
      score: 0,
      lastUpdate: Date.now(),
      lastEnemySpawn: Date.now(),
      bulletIdCounter: 0,
      enemyIdCounter: 0,
      cellSize: cellSize,
      renderer: GameBoard,
    },
  };
};

// Controlla collisione tra proiettile e nemico
const checkCollision = (bullet: Bullet, enemy: Enemy): boolean => {
  const enemyConfig = ENEMY_TYPES[enemy.type];
  const distance = Math.sqrt(
    Math.pow(bullet.x - enemy.x, 2) + Math.pow(bullet.y - enemy.y, 2)
  );
  return distance < enemyConfig.size * 0.8;
};

// Scegli tipo di nemico casuale (con probabilità diverse)
const getRandomEnemyType = (): keyof typeof ENEMY_TYPES => {
  const rand = Math.random();
  if (rand < 0.6) return 'BASIC';      // 60% basic
  if (rand < 0.85) return 'FAST';      // 25% fast
  return 'TANK';                        // 15% tank
};

// Game loop principale
export const GameLoop = (entities: any, { events, dispatch }: any) => {
  const state = entities.game as GameState;
  const now = Date.now();
  const deltaTime = now - state.lastUpdate;

  // Gestione eventi (movimento astronave e sparo)
  if (events && events.length) {
    events.forEach((event: any) => {
      if (event.type === 'move-left') {
        state.shipX = Math.max(0, state.shipX - 0.5);
      } else if (event.type === 'move-right') {
        state.shipX = Math.min(GAME_WIDTH - 1.8, state.shipX + 0.5);
      } else if (event.type === 'shoot') {
        // Crea nuovo proiettile
        state.bullets.push({
          x: state.shipX + 0.75, // Centro dell'astronave
          y: GAME_HEIGHT - 3.5,
          id: `${state.bulletIdCounter++}`,
        });
      }
    });
  }

  // Aggiorna proiettili (muovi verso l'alto)
  if (deltaTime > 30) {
    state.bullets = state.bullets
      .map(bullet => ({
        ...bullet,
        y: bullet.y - 0.5,
      }))
      .filter(bullet => bullet.y > 0); // Rimuovi proiettili fuori schermo
  }

  // Spawna nemici (più frequentemente con il passare del tempo)
  const spawnRate = Math.max(800, 1500 - Math.floor(state.score / 100) * 100);
  if (now - state.lastEnemySpawn > spawnRate) {
    const enemyType = getRandomEnemyType();
    const enemyConfig = ENEMY_TYPES[enemyType];
    const maxX = GAME_WIDTH - enemyConfig.size * 1.5;
    const randomX = Math.random() * maxX;

    state.enemies.push({
      x: randomX,
      y: 0,
      id: `${state.enemyIdCounter++}`,
      type: enemyType,
    });
    state.lastEnemySpawn = now;
  }

  // Aggiorna nemici (muovi verso il basso con velocità diverse)
  if (deltaTime > 50) {
    state.enemies = state.enemies.map(enemy => {
      const enemyConfig = ENEMY_TYPES[enemy.type];
      return {
        ...enemy,
        y: enemy.y + enemyConfig.speed,
      };
    });

    // Controlla collisioni
    const newBullets: Bullet[] = [];
    const newEnemies: Enemy[] = [];

    state.bullets.forEach(bullet => {
      let bulletHit = false;
      state.enemies.forEach(enemy => {
        if (!enemy.destroyed && checkCollision(bullet, enemy)) {
          enemy.destroyed = true;
          bulletHit = true;
          const enemyConfig = ENEMY_TYPES[enemy.type];
          state.score += enemyConfig.points;
          dispatch({ type: 'score-update', score: state.score });
        }
      });
      if (!bulletHit) {
        newBullets.push(bullet);
      }
    });

    // Rimuovi nemici distrutti o fuori schermo
    state.enemies.forEach(enemy => {
      if (enemy.y < GAME_HEIGHT && !enemy.destroyed) {
        newEnemies.push(enemy);
      }
    });

    state.bullets = newBullets;
    state.enemies = newEnemies;

    // Controlla game over (nemico raggiunge il fondo)
    const enemyReachedBottom = state.enemies.some(enemy => enemy.y >= GAME_HEIGHT - 3);
    if (enemyReachedBottom) {
      dispatch({ type: 'game-over' });
    }

    state.lastUpdate = now;
  }

  return entities;
};
