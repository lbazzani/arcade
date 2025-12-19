import { GameListPage, GameItem } from '@/components/game-list-page';
import { getNumberGames } from '@/config/games';

// Get number games from centralized config and convert to GameItem format
const games: GameItem[] = getNumberGames().map((game, index) => ({
  id: String(index + 1),
  name: game.name,
  description: game.description,
  route: game.route,
  icon: game.icon,
  color: game.color,
  badge: game.badge,
}));

export default function NumberplayScreen() {
  return (
    <GameListPage
      title="NUMBERPLAY"
      subtitle="LOGIC GAMES"
      logoLetter="#"
      accentColor="#9B59B6"
      games={games}
      comingSoonText="More number games coming soon!"
      comingSoonIcon="🔢"
    />
  );
}
