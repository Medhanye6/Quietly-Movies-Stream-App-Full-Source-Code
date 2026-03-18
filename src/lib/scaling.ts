import { Dimensions, Platform } from 'react-native';

// Baseline dimensions (Small iPhone)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/**
 * Scaled size based on screen width
 */
export const scale = (size: number) => {
  const { width } = Dimensions.get('window');
  return (width / guidelineBaseWidth) * size;
};

/**
 * Scaled size based on screen height
 */
export const verticalScale = (size: number) => {
  const { height } = Dimensions.get('window');
  return (height / guidelineBaseHeight) * size;
};

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

export const getDimensions = () => Dimensions.get('window');
