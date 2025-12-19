import { GameListPage, GameItem } from '@/components/game-list-page';
import { getWordGames } from '@/config/games';

// Get word games from centralized config and convert to GameItem format
const games: GameItem[] = getWordGames().map((game, index) => ({
  id: String(index + 1),
  name: game.name,
  description: game.description,
  route: game.route,
  icon: game.icon,
  color: game.color,
  badge: game.badge,
}));

export default function WordplayScreen() {
  return (
    <GameListPage
      title="WORDPLAY"
      subtitle="PUZZLE GAMES"
      logoLetter="W"
      accentColor="#FF6B9D"
      games={games}
      comingSoonText="More word games coming soon!"
      comingSoonIcon="🎯"
    />
  );
}
