import React, { useState, useCallback } from 'react';
import { 
  Pressable, 
  StyleSheet, 
  ViewStyle, 
  StyleProp, 
  View,
  Animated,
  Platform
} from 'react-native';
import { Colors } from '../lib/colors';

interface FocusableProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  activeOpacity?: number;
  scaleOnFocus?: boolean;
  borderOnFocus?: boolean;
  autoFocus?: boolean;
}

export const Focusable: React.FC<FocusableProps> = ({ 
  children, 
  onPress, 
  style, 
  scaleOnFocus = true,
  borderOnFocus = true,
  autoFocus = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const onFocus = useCallback(() => {
    setIsFocused(true);
    if (scaleOnFocus) {
      Animated.spring(scaleAnim, {
        toValue: 1.05,
        useNativeDriver: true,
      }).start();
    }
  }, [scaleOnFocus]);

  const onBlur = useCallback(() => {
    setIsFocused(false);
    if (scaleOnFocus) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  }, [scaleOnFocus]);

  return (
    <Pressable
      onPress={onPress}
      onFocus={onFocus}
      onBlur={onBlur}
      focusable={true}
      hasTVPreferredFocus={autoFocus}
      style={({ pressed }) => [
        style,
        pressed && styles.pressed,
      ]}
    >
      <Animated.View style={[
        styles.container,
        { transform: [{ scale: scaleAnim }] },
        isFocused && borderOnFocus && styles.focusedBorder
      ]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  focusedBorder: {
    borderWidth: 3,
    borderColor: Colors.primary,
    // Add a slight glow for TV
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  pressed: {
    opacity: 0.7,
  }
});
