import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Baseline dimensions (Small iPhone)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/**
 * Scaled size based on screen width
 */
export const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;

/**
 * Scaled size based on screen height
 */
export const verticalScale = (size: number) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;

/**
 * Moderate scaling for cases where full scaling is too much
 */
export const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

/**
 * Scaled font size with minimums
 */
export const sFont = (size: number) => {
  const newSize = scale(size);
  if (Platform.isTV) {
    return Math.max(newSize, 24);
  }
  return Math.max(newSize, 14);
};

export { SCREEN_WIDTH, SCREEN_HEIGHT };
