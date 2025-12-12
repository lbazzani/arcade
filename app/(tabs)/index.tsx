import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';

interface Game {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: string;
  color: string;
}

const games: Game[] = [
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
  const router = useRouter();

  const handleGamePress = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <ThemedText style={styles.logoText}>B</ThemedText>
          </View>
          <View style={styles.titleTextContainer}>
            <ThemedText style={styles.titleText}>BAZZANI</ThemedText>
            <ThemedText style={styles.arcadeText}>ARCADE</ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.gamesContainer}>
        {games.map((game) => (
          <TouchableOpacity
            key={game.id}
            style={styles.gameCard}
            onPress={() => handleGamePress(game.route)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, { backgroundColor: game.color }]}>
              <ThemedText style={styles.gameIcon}>{game.icon}</ThemedText>
            </View>
            <View style={styles.cardContent}>
              <ThemedText style={styles.gameName}>
                {game.name}
              </ThemedText>
              <ThemedText style={styles.gameDescription}>
                {game.description}
              </ThemedText>
            </View>
            <View style={styles.playArrow}>
              <ThemedText style={styles.playArrowText}>▶</ThemedText>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#000',
  },
  header: {
    marginBottom: 50,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logoBox: {
    width: 56,
    height: 56,
    backgroundColor: '#00D4FF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000',
    lineHeight: 36,
  },
  titleTextContainer: {
    justifyContent: 'center',
    gap: 2,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#fff',
    lineHeight: 32,
  },
  arcadeText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 4,
    color: '#FF6600',
    lineHeight: 16,
  },
  gamesContainer: {
    gap: 16,
  },
  gameCard: {
    flexDirection: 'row',
    borderRadius: 16,
    backgroundColor: '#111',
    alignItems: 'center',
    minHeight: 100,
    overflow: 'hidden',
  },
  iconContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameIcon: {
    fontSize: 40,
    lineHeight: 48,
  },
  cardContent: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  gameName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
    lineHeight: 24,
  },
  gameDescription: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
  playArrow: {
    paddingRight: 20,
  },
  playArrowText: {
    fontSize: 20,
    color: '#555',
  },
});
