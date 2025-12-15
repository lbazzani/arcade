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
    hp: 1, // Punti vita
  },
  FAST: {
    color: '#FF8844',
    speed: 0.45,
    points: 20,
    size: 1.0,
    hp: 1,
  },
  TANK: {
    color: '#8844FF',
    speed: 0.15,
    points: 50, // Più punti perché richiede più colpi
    size: 1.5,
    hp: 3, // Richiede 3 colpi per essere distrutto
  },
  ELITE: {
    color: '#FFD700', // Oro
    speed: 0.2,
    points: 80,
    size: 1.4,
    hp: 5, // Richiede 5 colpi
  },
};

interface Position {
  x: number;
  y: number;
}

interface Bullet extends Position {
  id: string;
  isEnemy?: boolean; // true se sparato da un nemico
}

interface Enemy extends Position {
  id: string;
  type: keyof typeof ENEMY_TYPES;
  hp: number; // Punti vita rimanenti
  maxHp: number; // Punti vita massimi (per mostrare indicatore)
  destroyed?: boolean;
  destroyedAt?: number; // timestamp distruzione per animazione
  lastShot?: number; // timestamp ultimo sparo
  lastHit?: number; // timestamp ultimo colpo subito (per flash)
}

interface Explosion {
  x: number;
  y: number;
  createdAt: number;
  isPlayer?: boolean; // true se è un'esplosione del giocatore
}

interface GameState {
  shipX: number;
  targetShipX: number | null; // Posizione target per movimento fluido
  bullets: Bullet[];
  enemies: Enemy[];
  explosions: Explosion[]; // Esplosioni attive (giocatore colpito)
  score: number;
  lives: number;
  lastUpdate: number;
  lastEnemySpawn: number;
  bulletIdCounter: number;
  enemyIdCounter: number;
  lastHitTime: number; // Per invincibilità temporanea dopo essere colpiti
}

// Componente astronave del giocatore - caccia compatto e aggressivo
const PlayerShip = ({ x, cellSize, gameHeight, isInvincible }: { x: number; cellSize: number; gameHeight: number; isInvincible?: boolean }) => {
  const s = cellSize * 0.5; // Dimensione ridotta
  const shipTop = gameHeight - s * 4;
  // Effetto lampeggio durante invincibilità
  const blinkOpacity = isInvincible ? (Math.floor(Date.now() / 100) % 2 === 0 ? 0.3 : 1) : 1;
  return (
    <View
      style={{
        position: 'absolute',
        left: x * cellSize,
        top: shipTop,
        width: s * 2.4,
        height: s * 2.8,
        opacity: blinkOpacity,
      }}
    >
      {/* Glow aggressivo */}
      <View
        style={{
          position: 'absolute',
          left: s * 0.4,
          top: s * 0.2,
          width: s * 1.6,
          height: s * 2,
          backgroundColor: '#00D4FF',
          borderRadius: s * 0.3,
          opacity: 0.15,
        }}
      />
      {/* Fusoliera principale - forma a freccia */}
      <View
        style={{
          position: 'absolute',
          left: s * 0.8,
          top: 0,
          width: s * 0.8,
          height: s * 2.2,
          backgroundColor: '#0a1628',
          borderTopLeftRadius: s * 0.4,
          borderTopRightRadius: s * 0.4,
          borderBottomLeftRadius: s * 0.1,
          borderBottomRightRadius: s * 0.1,
          borderWidth: 1.5,
          borderColor: '#00D4FF',
        }}
      />
      {/* Ala sinistra - delta aggressivo */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: s * 1.2,
          width: s * 1,
          height: s * 0.6,
          backgroundColor: '#00D4FF',
          borderTopLeftRadius: s * 0.05,
          borderBottomLeftRadius: s * 0.15,
          transform: [{ skewY: '-25deg' }],
        }}
      />
      {/* Ala destra - delta aggressivo */}
      <View
        style={{
          position: 'absolute',
          right: 0,
          top: s * 1.2,
          width: s * 1,
          height: s * 0.6,
          backgroundColor: '#00D4FF',
          borderTopRightRadius: s * 0.05,
          borderBottomRightRadius: s * 0.15,
          transform: [{ skewY: '25deg' }],
        }}
      />
      {/* Cockpit stretto */}
      <View
        style={{
          position: 'absolute',
          left: s * 0.95,
          top: s * 0.15,
          width: s * 0.5,
          height: s * 0.6,
          backgroundColor: '#00FFFF',
          borderTopLeftRadius: s * 0.25,
          borderTopRightRadius: s * 0.25,
          borderBottomLeftRadius: s * 0.1,
          borderBottomRightRadius: s * 0.1,
        }}
      />
      {/* Motori laterali */}
      <View
        style={{
          position: 'absolute',
          left: s * 0.5,
          bottom: s * 0.1,
          width: s * 0.3,
          height: s * 0.4,
          backgroundColor: '#FF4400',
          borderBottomLeftRadius: s * 0.05,
          borderBottomRightRadius: s * 0.05,
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: s * 0.5,
          bottom: s * 0.1,
          width: s * 0.3,
          height: s * 0.4,
          backgroundColor: '#FF4400',
          borderBottomLeftRadius: s * 0.05,
          borderBottomRightRadius: s * 0.05,
        }}
      />
      {/* Fiamme */}
      <View
        style={{
          position: 'absolute',
          left: s * 0.55,
          bottom: -s * 0.25,
          width: s * 0.2,
          height: s * 0.35,
          backgroundColor: '#FFFF00',
          borderBottomLeftRadius: s * 0.1,
          borderBottomRightRadius: s * 0.1,
          opacity: 0.9,
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: s * 0.55,
          bottom: -s * 0.25,
          width: s * 0.2,
          height: s * 0.35,
          backgroundColor: '#FFFF00',
          borderBottomLeftRadius: s * 0.1,
          borderBottomRightRadius: s * 0.1,
          opacity: 0.9,
        }}
      />
    </View>
  );
};

// Componente nemico - caccia aggressivo compatto
const EnemyShip = ({ enemy, cellSize, yScale, now }: { enemy: Enemy; cellSize: number; yScale: number; now: number }) => {
  const config = ENEMY_TYPES[enemy.type];
  const s = cellSize * config.size * 0.45; // Ridotto

  // Flash bianco quando colpito
  const wasRecentlyHit = enemy.lastHit && (now - enemy.lastHit < 100);

  if (enemy.destroyed && enemy.destroyedAt) {
    // Animazione esplosione basata sul tempo
    const elapsed = now - enemy.destroyedAt;
    const progress = Math.min(elapsed / 300, 1); // 300ms durata
    const scale = 1 + progress * 1.5; // Espande
    const opacity = 1 - progress * 0.8; // Dissolvenza
    const explosionSize = s * 2 * scale;

    // Centro esplosione sulla posizione del nemico (considerando offset del nemico)
    const centerX = enemy.x * cellSize + s * 1.1; // Centro del nemico
    const centerY = enemy.y * cellSize * yScale + s * 1.2;

    return (
      <View
        style={{
          position: 'absolute',
          left: centerX - explosionSize / 2,
          top: centerY - explosionSize / 2,
          width: explosionSize,
          height: explosionSize,
        }}
      >
        {/* Cerchio esterno - arancione */}
        <View
          style={{
            position: 'absolute',
            width: explosionSize,
            height: explosionSize,
            backgroundColor: '#FF4400',
            borderRadius: explosionSize / 2,
            opacity: opacity * 0.6,
          }}
        />
        {/* Cerchio medio - giallo */}
        <View
          style={{
            position: 'absolute',
            left: explosionSize * 0.15,
            top: explosionSize * 0.15,
            width: explosionSize * 0.7,
            height: explosionSize * 0.7,
            backgroundColor: '#FFAA00',
            borderRadius: explosionSize * 0.35,
            opacity: opacity * 0.8,
          }}
        />
        {/* Nucleo - bianco */}
        <View
          style={{
            position: 'absolute',
            left: explosionSize * 0.35,
            top: explosionSize * 0.35,
            width: explosionSize * 0.3,
            height: explosionSize * 0.3,
            backgroundColor: '#FFFFFF',
            borderRadius: explosionSize * 0.15,
            opacity: opacity,
          }}
        />
      </View>
    );
  }

  // Mostra HP solo se il nemico ha più di 1 HP massimo
  const showHpBar = enemy.maxHp > 1;
  const hpBarWidth = s * 1.8;
  const hpPercent = enemy.hp / enemy.maxHp;

  return (
    <View
      style={{
        position: 'absolute',
        left: enemy.x * cellSize,
        top: enemy.y * cellSize * yScale,
        width: s * 2.2,
        height: s * 2.4,
      }}
    >
      {/* Barra HP sopra il nemico */}
      {showHpBar && (
        <View
          style={{
            position: 'absolute',
            left: (s * 2.2 - hpBarWidth) / 2,
            top: -s * 0.5,
            width: hpBarWidth,
            height: s * 0.25,
            backgroundColor: '#333',
            borderRadius: s * 0.1,
            overflow: 'hidden',
          }}
        >
          {/* Barra HP riempimento */}
          <View
            style={{
              width: `${hpPercent * 100}%`,
              height: '100%',
              backgroundColor: hpPercent > 0.5 ? '#44FF44' : hpPercent > 0.25 ? '#FFAA00' : '#FF4444',
              borderRadius: s * 0.1,
            }}
          />
        </View>
      )}
      {/* Contatore HP numerico */}
      {showHpBar && (
        <View
          style={{
            position: 'absolute',
            left: (s * 2.2 - s * 0.8) / 2,
            top: -s * 0.9,
            width: s * 0.8,
            height: s * 0.4,
            backgroundColor: 'rgba(0,0,0,0.7)',
            borderRadius: s * 0.1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: s * 0.6,
              height: s * 0.25,
              backgroundColor: config.color,
              borderRadius: s * 0.05,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          />
        </View>
      )}
      {/* Glow - flash bianco se colpito */}
      <View
        style={{
          position: 'absolute',
          left: s * 0.3,
          top: s * 0.2,
          width: s * 1.6,
          height: s * 1.8,
          backgroundColor: wasRecentlyHit ? '#FFFFFF' : config.color,
          borderRadius: s * 0.3,
          opacity: wasRecentlyHit ? 0.6 : 0.2,
        }}
      />
      {/* Fusoliera - invertita (punta in basso) */}
      <View
        style={{
          position: 'absolute',
          left: s * 0.7,
          top: s * 0.3,
          width: s * 0.8,
          height: s * 1.8,
          backgroundColor: wasRecentlyHit ? '#FFFFFF' : '#1a1a2e',
          borderTopLeftRadius: s * 0.1,
          borderTopRightRadius: s * 0.1,
          borderBottomLeftRadius: s * 0.4,
          borderBottomRightRadius: s * 0.4,
          borderWidth: 1.5,
          borderColor: config.color,
        }}
      />
      {/* Ala sinistra - sweep forward */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: s * 0.5,
          width: s * 0.9,
          height: s * 0.5,
          backgroundColor: wasRecentlyHit ? '#FFFFFF' : config.color,
          borderTopLeftRadius: s * 0.05,
          borderBottomLeftRadius: s * 0.2,
          transform: [{ skewY: '20deg' }],
        }}
      />
      {/* Ala destra - sweep forward */}
      <View
        style={{
          position: 'absolute',
          right: 0,
          top: s * 0.5,
          width: s * 0.9,
          height: s * 0.5,
          backgroundColor: wasRecentlyHit ? '#FFFFFF' : config.color,
          borderTopRightRadius: s * 0.05,
          borderBottomRightRadius: s * 0.2,
          transform: [{ skewY: '-20deg' }],
        }}
      />
      {/* Cockpit/sensore */}
      <View
        style={{
          position: 'absolute',
          left: s * 0.85,
          top: s * 0.5,
          width: s * 0.5,
          height: s * 0.4,
          backgroundColor: enemy.type === 'TANK' ? '#FF0000' : enemy.type === 'ELITE' ? '#FF00FF' : '#FFFF00',
          borderRadius: s * 0.2,
        }}
      />
      {/* Cannoni laterali */}
      <View
        style={{
          position: 'absolute',
          left: s * 0.2,
          top: s * 0.1,
          width: s * 0.15,
          height: s * 0.8,
          backgroundColor: config.color,
          borderRadius: s * 0.05,
          opacity: 0.8,
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: s * 0.2,
          top: s * 0.1,
          width: s * 0.15,
          height: s * 0.8,
          backgroundColor: config.color,
          borderRadius: s * 0.05,
          opacity: 0.8,
        }}
      />
    </View>
  );
};

// Component per renderizzare il gioco
const GameBoard = (props: any) => {
  const { shipX, bullets, enemies, explosions, cellSize, gameHeight, lastHitTime } = props;
  const now = Date.now();
  const elements = [];

  // Scala Y per mappare GAME_HEIGHT logico all'altezza reale
  const yScale = gameHeight / (GAME_HEIGHT * cellSize);

  // Invincibilità dopo essere stati colpiti
  const invincibilityTime = 1500;
  const timeSinceHit = now - (lastHitTime || 0);
  const isInvincible = timeSinceHit < invincibilityTime;
  const showRedFlash = timeSinceHit < 200; // Flash rosso per 200ms

  // Renderizza astronave del giocatore
  elements.push(
    <PlayerShip key="ship" x={shipX} cellSize={cellSize} gameHeight={gameHeight} isInvincible={isInvincible} />
  );

  // Renderizza proiettili - laser compatti (blu giocatore, rosso nemici)
  bullets.forEach((bullet: Bullet) => {
    const bx = bullet.x * cellSize + cellSize * 0.45;
    const by = bullet.y * cellSize * yScale;
    const bw = cellSize * 0.15;
    const bh = cellSize * 0.6;
    const isEnemy = bullet.isEnemy;
    const mainColor = isEnemy ? '#FF4444' : '#00D4FF';
    const glowColor = isEnemy ? '#FF6666' : '#00FFFF';
    elements.push(
      <View
        key={`bullet-${bullet.id}`}
        style={{
          position: 'absolute',
          left: bx,
          top: by,
          width: bw,
          height: bh,
        }}
      >
        {/* Scia */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: isEnemy ? 0 : bh * 0.2,
            width: bw,
            height: bh * 0.9,
            backgroundColor: glowColor,
            borderRadius: bw * 0.5,
            opacity: 0.5,
          }}
        />
        {/* Corpo laser */}
        <View
          style={{
            position: 'absolute',
            left: bw * 0.15,
            top: isEnemy ? bh * 0.2 : 0,
            width: bw * 0.7,
            height: bh * 0.8,
            backgroundColor: mainColor,
            borderRadius: bw * 0.35,
          }}
        />
        {/* Nucleo */}
        <View
          style={{
            position: 'absolute',
            left: bw * 0.25,
            top: isEnemy ? bh * 0.3 : bh * 0.1,
            width: bw * 0.5,
            height: bh * 0.5,
            backgroundColor: '#FFFFFF',
            borderRadius: bw * 0.25,
          }}
        />
      </View>
    );
  });

  // Renderizza nemici
  enemies.forEach((enemy: Enemy) => {
    elements.push(
      <EnemyShip key={`enemy-${enemy.id}`} enemy={enemy} cellSize={cellSize} yScale={yScale} now={now} />
    );
  });

  // Renderizza esplosioni del giocatore
  (explosions || []).forEach((explosion: Explosion, index: number) => {
    const elapsed = now - explosion.createdAt;
    const progress = Math.min(elapsed / 500, 1); // 500ms durata
    const scale = 1 + progress * 2;
    const opacity = 1 - progress;
    const explosionSize = cellSize * 2 * scale;

    const expX = explosion.x * cellSize + cellSize * 0.6 - explosionSize / 2;
    const expY = explosion.y * cellSize * yScale - explosionSize / 2;

    elements.push(
      <View
        key={`player-explosion-${index}`}
        style={{
          position: 'absolute',
          left: expX,
          top: expY,
          width: explosionSize,
          height: explosionSize,
        }}
      >
        {/* Cerchio esterno rosso */}
        <View
          style={{
            position: 'absolute',
            width: explosionSize,
            height: explosionSize,
            backgroundColor: '#FF0000',
            borderRadius: explosionSize / 2,
            opacity: opacity * 0.5,
          }}
        />
        {/* Cerchio medio arancione */}
        <View
          style={{
            position: 'absolute',
            left: explosionSize * 0.2,
            top: explosionSize * 0.2,
            width: explosionSize * 0.6,
            height: explosionSize * 0.6,
            backgroundColor: '#FF6600',
            borderRadius: explosionSize * 0.3,
            opacity: opacity * 0.7,
          }}
        />
        {/* Nucleo bianco */}
        <View
          style={{
            position: 'absolute',
            left: explosionSize * 0.35,
            top: explosionSize * 0.35,
            width: explosionSize * 0.3,
            height: explosionSize * 0.3,
            backgroundColor: '#FFFFFF',
            borderRadius: explosionSize * 0.15,
            opacity: opacity,
          }}
        />
      </View>
    );
  });

  return (
    <View style={{
      width: GAME_WIDTH * cellSize,
      height: gameHeight,
      backgroundColor: '#000',
    }}>
      {elements}
      {/* Flash rosso quando colpiti */}
      {showRedFlash && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: GAME_WIDTH * cellSize,
            height: gameHeight,
            backgroundColor: '#FF0000',
            opacity: 0.3,
          }}
        />
      )}
    </View>
  );
};

// Inizializza il gioco
export const initializeGame = (cellSize: number, gameHeight: number) => {
  return {
    game: {
      shipX: GAME_WIDTH / 2 - 0.9, // Centra l'astronave
      targetShipX: null,
      bullets: [],
      enemies: [],
      explosions: [],
      score: 0,
      lives: 3,
      lastUpdate: Date.now(),
      lastEnemySpawn: Date.now(),
      bulletIdCounter: 0,
      enemyIdCounter: 0,
      lastHitTime: 0,
      cellSize: cellSize,
      gameHeight: gameHeight,
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
  if (rand < 0.5) return 'BASIC';      // 50% basic
  if (rand < 0.75) return 'FAST';      // 25% fast
  if (rand < 0.92) return 'TANK';      // 17% tank
  return 'ELITE';                       // 8% elite
};

// Controlla collisione proiettile nemico con giocatore
const checkPlayerHit = (bullet: Bullet, shipX: number): boolean => {
  // Posizione giocatore: shipX, y circa GAME_HEIGHT - 3.5, larghezza ~1.2
  const playerY = GAME_HEIGHT - 3.5;
  const playerWidth = 1.2;
  const playerHeight = 1.4;

  return (
    bullet.x >= shipX &&
    bullet.x <= shipX + playerWidth &&
    bullet.y >= playerY - playerHeight &&
    bullet.y <= playerY + playerHeight
  );
};

// Game loop principale
export const GameLoop = (entities: any, { events, dispatch }: any) => {
  const state = entities.game as GameState & { targetShipX: number | null; lives: number };
  const now = Date.now();
  const deltaTime = now - state.lastUpdate;

  // Gestione eventi (sparo giocatore)
  // La nave ha larghezza s*2.4 dove s=cellSize*0.5, quindi larghezza in unità logiche ~1.2
  // Il centro è a shipX + 0.6, ma il proiettile ha offset nel render di 0.45
  // Quindi x = shipX + 0.6 - 0.45 = shipX + 0.15 per centrare visivamente
  if (events && events.length) {
    events.forEach((event: any) => {
      if (event.type === 'shoot') {
        state.bullets.push({
          x: state.shipX + 0.15,
          y: GAME_HEIGHT - 3.5,
          id: `p${state.bulletIdCounter++}`,
          isEnemy: false,
        });
      }
    });
  }

  // Movimento fluido verso targetShipX
  if (state.targetShipX !== null && state.targetShipX !== undefined) {
    const diff = state.targetShipX - state.shipX;
    const speed = 0.8;
    if (Math.abs(diff) > 0.05) {
      state.shipX += diff * speed;
    } else {
      state.shipX = state.targetShipX;
    }
    state.shipX = Math.max(0, Math.min(GAME_WIDTH - 1.8, state.shipX));
  }

  // Aggiorna proiettili
  if (deltaTime > 30) {
    state.bullets = state.bullets
      .map(bullet => ({
        ...bullet,
        y: bullet.isEnemy ? bullet.y + 0.4 : bullet.y - 0.5,
      }))
      .filter(bullet => bullet.y > 0 && bullet.y < GAME_HEIGHT);
  }

  // Spawna nemici
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
      hp: enemyConfig.hp,
      maxHp: enemyConfig.hp,
      lastShot: now,
    });
    state.lastEnemySpawn = now;
  }

  // Aggiorna nemici e sparo nemici
  if (deltaTime > 50) {
    state.enemies = state.enemies.map(enemy => {
      const enemyConfig = ENEMY_TYPES[enemy.type];

      // Nemici sparano - tutti tranne BASIC
      // Spara quando è passato abbastanza tempo dall'ultimo sparo
      const canShoot = enemy.type !== 'BASIC' && enemy.y > 2 && enemy.y < GAME_HEIGHT - 5;
      // Intervallo sparo: FAST più frequente, ELITE medio, TANK lento
      const shootInterval = enemy.type === 'FAST' ? 800 : enemy.type === 'ELITE' ? 1000 : 1500; // ms tra spari
      const timeSinceLastShot = now - (enemy.lastShot || 0);
      const shouldShoot = canShoot && timeSinceLastShot > shootInterval && !enemy.destroyed;

      if (shouldShoot) {
        // Centro del nemico: la nave nemica ha larghezza s*2.2 dove s = cellSize * config.size * 0.45
        // In unità logiche: config.size * 0.45 * 2.2 ≈ config.size
        // Quindi il centro è a enemy.x + config.size/2, ma il proiettile ha offset render di 0.45
        const enemyCenterX = enemy.x + (enemyConfig.size * 0.45 * 2.2 / 2) - 0.45;
        state.bullets.push({
          x: enemyCenterX,
          y: enemy.y + 1.5,
          id: `e${state.bulletIdCounter++}`,
          isEnemy: true,
        });
        enemy.lastShot = now;
      }

      return {
        ...enemy,
        y: enemy.y + enemyConfig.speed,
      };
    });

    // Controlla collisioni proiettili giocatore vs nemici
    const newBullets: Bullet[] = [];
    const newEnemies: Enemy[] = [];

    state.bullets.forEach(bullet => {
      let bulletHit = false;

      if (!bullet.isEnemy) {
        // Proiettile giocatore vs nemici
        state.enemies.forEach(enemy => {
          if (!enemy.destroyed && checkCollision(bullet, enemy)) {
            bulletHit = true;
            enemy.hp -= 1;
            enemy.lastHit = now; // Per flash visivo

            if (enemy.hp <= 0) {
              // Nemico distrutto
              enemy.destroyed = true;
              enemy.destroyedAt = now; // Per animazione esplosione
              const enemyConfig = ENEMY_TYPES[enemy.type];
              state.score += enemyConfig.points;
              dispatch({ type: 'score-update', score: state.score });
              dispatch({ type: 'enemy-destroyed' }); // Feedback haptic
            } else {
              // Nemico colpito ma non distrutto - bonus punti ridotto
              state.score += 5;
              dispatch({ type: 'score-update', score: state.score });
            }
          }
        });
      } else {
        // Proiettile nemico vs giocatore
        // Invincibilità per 1.5 secondi dopo essere colpiti
        const invincibilityTime = 1500;
        const isInvincible = now - state.lastHitTime < invincibilityTime;

        if (!isInvincible && checkPlayerHit(bullet, state.shipX)) {
          bulletHit = true;
          state.lives -= 1;
          state.lastHitTime = now;

          // Aggiungi esplosione sulla posizione del giocatore
          state.explosions.push({
            x: state.shipX + 0.6, // Centro della nave
            y: GAME_HEIGHT - 3.5,
            createdAt: now,
            isPlayer: true,
          });

          dispatch({ type: 'lives-update', lives: state.lives });
          dispatch({ type: 'player-hit' }); // Evento per suono/vibrazione

          if (state.lives <= 0) {
            dispatch({ type: 'game-over' });
          }
        }
      }

      if (!bulletHit) {
        newBullets.push(bullet);
      }
    });

    // Rimuovi nemici fuori schermo o dopo animazione esplosione (300ms)
    state.enemies.forEach(enemy => {
      if (enemy.y >= GAME_HEIGHT) return; // Fuori schermo

      if (enemy.destroyed && enemy.destroyedAt) {
        // Mantieni durante animazione (300ms)
        if (now - enemy.destroyedAt < 300) {
          newEnemies.push(enemy);
        }
      } else if (!enemy.destroyed) {
        newEnemies.push(enemy);
      }
    });

    state.bullets = newBullets;
    state.enemies = newEnemies;

    // Rimuovi esplosioni scadute (500ms)
    state.explosions = state.explosions.filter(exp => now - exp.createdAt < 500);

    // Game over se nemico raggiunge il fondo
    const enemyReachedBottom = state.enemies.some(enemy => enemy.y >= GAME_HEIGHT - 3);
    if (enemyReachedBottom) {
      dispatch({ type: 'game-over' });
    }

    state.lastUpdate = now;
  }

  return entities;
};
