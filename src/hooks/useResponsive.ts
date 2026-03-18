import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

export type DeviceType = 'phone' | 'tablet' | 'tv';

export const useResponsive = () => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  const width = dimensions.width;
  
  /**
   * Device Detection Logic:
   * 1. If width < 768, it's ALWAYS a phone (Portrait) -> Bottom Tabs
   * 2. If Platform.isTV is true AND width > 1024, it's a TV -> Sidebar
   * 3. If width >= 768 and < 1024, it's a tablet -> Sidebar/Grid
   * 4. If width >= 1024, it's a large screen (TV/Desktop) -> Sidebar
   */
  
  let deviceType: DeviceType = 'phone';
  
  if (width >= 1024) {
    deviceType = 'tv'; // Desktop/TV scale
  } else if (width >= 768) {
    deviceType = 'tablet';
  } else if (Platform.isTV && width > 480) {
    // Only allow TV mode on larger screens to avoid breaking mobile emulation
    deviceType = 'tv';
  }

  return {
    ...dimensions,
    deviceType,
    isPhone: deviceType === 'phone',
    isTablet: deviceType === 'tablet',
    isTV: deviceType === 'tv',
  };
};
