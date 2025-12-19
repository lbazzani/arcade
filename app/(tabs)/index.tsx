import { GameListPage, GameItem } from '@/components/game-list-page';
import { getArcadeGames } from '@/config/games';

// Get arcade games from centralized config and convert to GameItem format
const games: GameItem[] = getArcadeGames().map((game, index) => ({
  id: String(index + 1),
  name: game.name,
  description: game.description,
  route: game.route,
  icon: game.icon,
  color: game.color,
}));

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
