import { GameListPage, GameItem } from '@/components/game-list-page';

const wordGames: GameItem[] = [
  {
    id: '1',
    name: 'Slidle',
    description: 'Slide tiles to form words',
    route: '/wordgames/slidle',
    icon: '🔤',
    color: '#FF6B9D',
    badge: 'DAILY',
  },
  {
    id: '2',
    name: 'Fives',
    description: 'Guess the 5-letter word in 6 attempts',
    route: '/wordgames/fives',
    icon: '5️⃣',
    color: '#E85D75',
  },
];

export default function WordplayScreen() {
  return (
    <GameListPage
      title="WORDPLAY"
      subtitle="PUZZLE GAMES"
      logoLetter="W"
      accentColor="#FF6B9D"
      games={wordGames}
      comingSoonText="More word games coming soon!"
      comingSoonIcon="🎯"
    />
  );
}
