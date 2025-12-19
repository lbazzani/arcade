import { useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

// Tipi di feedback disponibili
export type FeedbackType = 'shoot' | 'explosion' | 'hit' | 'enemyDestroyed' | 'gameOver' | 'powerup' | 'jump' | 'coin' | 'stomp';

// Mappa dei suoni - file generati in assets/sounds/
const SOUND_FILES: Partial<Record<FeedbackType, any>> = {
  shoot: require('@/assets/sounds/laser.wav'),
  explosion: require('@/assets/sounds/explosion.wav'),
  hit: require('@/assets/sounds/hit.wav'),
  enemyDestroyed: require('@/assets/sounds/explosion.wav'), // Usa stesso suono di explosion
  gameOver: require('@/assets/sounds/gameOver.wav'),
  powerup: require('@/assets/sounds/powerup.wav'),
  jump: require('@/assets/sounds/jump.wav'),
  coin: require('@/assets/sounds/coin.wav'),
  stomp: require('@/assets/sounds/stomp.wav'),
};

export function useGameSounds() {
  const feedbackEnabled = useRef(true);
  const soundsRef = useRef<Map<FeedbackType, Audio.Sound>>(new Map());
  const loadedRef = useRef(false);

  // Carica i suoni all'avvio
  useEffect(() => {
    const loadSounds = async () => {
      if (loadedRef.current) return;
      loadedRef.current = true;

      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          allowsRecordingIOS: false,
          interruptionModeIOS: 1, // DO_NOT_MIX
          interruptionModeAndroid: 1,
        });

        // Carica ogni suono disponibile
        for (const [type, file] of Object.entries(SOUND_FILES)) {
          if (file) {
            try {
              const { sound } = await Audio.Sound.createAsync(file, {
                volume: 1.0,
                shouldPlay: false,
              });
              soundsRef.current.set(type as FeedbackType, sound);
              console.log(`✓ Suono ${type} caricato`);
            } catch (e) {
              console.warn(`Impossibile caricare suono ${type}:`, e);
            }
          }
        }
        console.log('Audio inizializzato correttamente');
      } catch (e) {
        console.warn('Audio non disponibile:', e);
      }
    };

    loadSounds();

    return () => {
      // Cleanup
      soundsRef.current.forEach(async (sound) => {
        try {
          await sound.unloadAsync();
        } catch {
          // Ignora errori di cleanup
        }
      });
      soundsRef.current.clear();
    };
  }, []);

  const playFeedback = useCallback(async (type: FeedbackType) => {
    if (!feedbackEnabled.current) return;

    // Prova a riprodurre il suono se disponibile
    const sound = soundsRef.current.get(type);
    if (sound) {
      try {
        await sound.setVolumeAsync(1.0);
        await sound.setPositionAsync(0);
        await sound.playAsync();
        console.log(`▶ Riproduzione ${type}`);
      } catch (e) {
        console.warn(`Errore riproduzione ${type}:`, e);
      }
    } else {
      console.log(`⚠ Suono ${type} non trovato`);
    }

    // Feedback haptic (vibrazione) - sempre attivo come fallback
    try {
      switch (type) {
        case 'shoot':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'explosion':
        case 'enemyDestroyed':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'hit':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'gameOver':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setTimeout(async () => {
            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            } catch {
              // Ignora
            }
          }, 200);
          break;
        case 'powerup':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'jump':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'coin':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'stomp':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
      }
    } catch {
      // Haptics non disponibile
    }
  }, []);

  const toggleFeedback = useCallback(() => {
    feedbackEnabled.current = !feedbackEnabled.current;
    return feedbackEnabled.current;
  }, []);

  const isFeedbackEnabled = useCallback(() => {
    return feedbackEnabled.current;
  }, []);

  return {
    playFeedback,
    toggleFeedback,
    isFeedbackEnabled,
  };
}
