import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Dimensioni del frame mobile su web desktop
const WEB_FRAME_WIDTH = 390;
const WEB_FRAME_MAX_HEIGHT = 844;

export function useGameDimensions() {
  const insets = useSafeAreaInsets();
  const windowDims = useWindowDimensions();

  // Su web
  if (Platform.OS === 'web') {
    const isMobileWidth = windowDims.width <= 500;

    if (isMobileWidth) {
      // Su telefono web, usa le dimensioni reali della finestra
      return {
        width: windowDims.width,
        height: windowDims.height,
        insets: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        },
      };
    }

    // Su desktop web, usa le dimensioni del frame
    return {
      width: WEB_FRAME_WIDTH,
      height: Math.min(WEB_FRAME_MAX_HEIGHT, windowDims.height - 40),
      insets: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
    };
  }

  // Su mobile nativo usiamo le dimensioni reali
  return {
    width: windowDims.width,
    height: windowDims.height,
    insets,
  };
}
