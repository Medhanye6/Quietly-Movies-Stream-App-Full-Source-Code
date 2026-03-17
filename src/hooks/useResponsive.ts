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
  
  // Logic based on USER requirements:
  // Layout Logic: width > 1024 (TV/Desktop) -> Sidebar
  // 768 < width < 1024 (Tablet) -> Grid
  // width < 768 (Phone) -> List + Bottom Tabs
  
  let deviceType: DeviceType = 'phone';
  if (width > 1024 || Platform.isTV) {
    deviceType = 'tv';
  } else if (width >= 768) {
    deviceType = 'tablet';
  }

  return {
    ...dimensions,
    deviceType,
    isPhone: deviceType === 'phone',
    isTablet: deviceType === 'tablet',
    isTV: deviceType === 'tv',
  };
};
