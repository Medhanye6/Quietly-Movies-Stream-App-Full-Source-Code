import { Dimensions, Platform } from 'react-native';

/**
 * Categorical Scaling Utility
 * --------------------------
 * Prevents overscaling on large displays by using different
 * baseline widths for different device categories.
 */

const getBaselines = (width: number) => {
  if (width >= 1024) return { baseWidth: 1280, baseHeight: 720 }; // TV/Desktop
  if (width >= 768)  return { baseWidth: 768,  baseHeight: 1024 }; // Tablet
  return { baseWidth: 375, baseHeight: 812 }; // Phone
};

/**
 * Scaled size based on screen width and device category
 */
export const scale = (size: number) => {
  const { width } = Dimensions.get('window');
  const { baseWidth } = getBaselines(width);
  return (width / baseWidth) * size;
};

/**
 * Scaled size based on screen height and device category
 */
export const verticalScale = (size: number) => {
  const { height, width } = Dimensions.get('window');
  const { baseHeight } = getBaselines(width);
  return (height / baseHeight) * size;
};

/**
 * Moderate scaling for cases where full scaling is too much
 */
export const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

/**
 * Scaled font size with categorical minimums
 */
export const sFont = (size: number) => {
  const { width } = Dimensions.get('window');
  const newSize = scale(size);
  
  // High-def / TV / Desktop
  if (width >= 1024 || (Platform.isTV && Platform.OS !== 'web')) {
    return Math.max(newSize, 22);
  }
  // Tablet
  if (width >= 768) {
    return Math.max(newSize, 18);
  }
  // Phone
  return Math.max(newSize, 14);
};

export const getDimensions = () => Dimensions.get('window');
