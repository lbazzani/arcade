import { GameListPage, GameItem } from '@/components/game-list-page';

const games: GameItem[] = [
  {
    id: '1',
    name: 'Tetris',
    description: 'Classic block puzzle game',
    route: '/games/tetris',
    icon: '🎮',
    color: '#4A90E2',
  },
  {
    id: '2',
    name: 'Galaxy Shooter',
    description: 'Space combat arcade action',
    route: '/games/galaxy',
    icon: '🚀',
    color: '#00D4FF',
  },
  {
    id: '3',
    name: 'Snake',
    description: 'Eat, grow, survive!',
    route: '/games/snake',
    icon: '🐍',
    color: '#4CAF50',
  },
  {
    id: '4',
    name: 'Flappy Bird',
    description: 'Tap to fly through pipes',
    route: '/games/flappy',
    icon: '🐤',
    color: '#FFD93D',
  },
  {
    id: '5',
    name: 'Breakout',
    description: 'Smash all the bricks!',
    route: '/games/breakout',
    icon: '🧱',
    color: '#FF4757',
  },
];

export default function HomeScreen() {
  return (
    <GameListPage
      title="ARCADE"
      subtitle="CLASSIC GAMES"
      logoLetter="A"
      accentColor="#00D4FF"
      games={games}
    />
  );
}
