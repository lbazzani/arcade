import { GameListPage, GameItem } from '@/components/game-list-page';

const numberGames: GameItem[] = [
  {
    id: '1',
    name: 'Sudoku',
    description: 'Fill the grid with numbers 1-9',
    route: '/numbergames/sudoku',
    icon: '9️⃣',
    color: '#9B59B6',
  },
];

export default function NumberplayScreen() {
  return (
    <GameListPage
      title="NUMBERPLAY"
      subtitle="LOGIC GAMES"
      logoLetter="#"
      accentColor="#9B59B6"
      games={numberGames}
      comingSoonText="More number games coming soon!"
      comingSoonIcon="🔢"
    />
  );
}
