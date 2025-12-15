import { StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface GameItem {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: string;
  color: string;
  badge?: string;
}

interface GameListPageProps {
  title: string;
  subtitle: string;
  logoLetter: string;
  accentColor: string;
  games: GameItem[];
  comingSoonText?: string;
  comingSoonIcon?: string;
}

export function GameListPage({
  title,
  subtitle,
  logoLetter,
  accentColor,
  games,
  comingSoonText,
  comingSoonIcon = '🎯',
}: GameListPageProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleGamePress = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={[styles.logoBox, { backgroundColor: accentColor }]}>
            <ThemedText style={styles.logoText}>{logoLetter}</ThemedText>
          </View>
          <View style={styles.titleTextContainer}>
            <ThemedText style={styles.titleText}>{title}</ThemedText>
            <ThemedText style={[styles.subtitleText, { color: accentColor }]}>
              {subtitle}
            </ThemedText>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.gamesContainer}
        showsVerticalScrollIndicator={false}
      >
        {games.map((game) => (
          <TouchableOpacity
            key={game.id}
            style={styles.gameCard}
            onPress={() => handleGamePress(game.route)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, { backgroundColor: game.color }]}>
              <ThemedText style={styles.gameIcon}>{game.icon}</ThemedText>
              {game.badge && (
                <View style={[styles.badgeContainer, { borderColor: accentColor }]}>
                  <ThemedText style={[styles.badgeText, { color: accentColor }]}>
                    {game.badge}
                  </ThemedText>
                </View>
              )}
            </View>
            <View style={styles.cardContent}>
              <ThemedText style={styles.gameName}>{game.name}</ThemedText>
              <ThemedText style={styles.gameDescription}>
                {game.description}
              </ThemedText>
            </View>
            <View style={styles.playArrow}>
              <ThemedText style={styles.playArrowText}>▶</ThemedText>
            </View>
          </TouchableOpacity>
        ))}

        {comingSoonText && (
          <View style={styles.comingSoonCard}>
            <ThemedText style={styles.comingSoonIcon}>{comingSoonIcon}</ThemedText>
            <ThemedText style={styles.comingSoonText}>{comingSoonText}</ThemedText>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#000',
  },
  header: {
    marginBottom: 30,
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
  subtitleText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    lineHeight: 14,
  },
  scrollContainer: {
    flex: 1,
  },
  gamesContainer: {
    gap: 16,
    paddingBottom: 20,
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
    position: 'relative',
  },
  gameIcon: {
    fontSize: 40,
    lineHeight: 48,
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#000',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
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
  comingSoonCard: {
    borderRadius: 16,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#222',
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  comingSoonIcon: {
    fontSize: 32,
    opacity: 0.5,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#444',
    fontWeight: '600',
  },
});
