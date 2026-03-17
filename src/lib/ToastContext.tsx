import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'success',
    visible: false,
  });

  const timerRef = useRef<any>(null);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    setToast({ message, type, visible: true });
    
    timerRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastInternal {...toast} onHide={() => setToast(prev => ({ ...prev, visible: false }))} />
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

// Internal component for the animation
import Animated, { 
  FadeInUp, 
  FadeOutUp, 
  Layout, 
  SlideInUp, 
  SlideOutUp,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from './colors';

const { width: SW } = Dimensions.get('window');

function ToastInternal({ message, type, visible, onHide }: { 
  message: string; 
  type: ToastType; 
  visible: boolean;
  onHide: () => void;
}) {
  if (!visible) return null;

  const iconName = type === 'success' ? 'checkmark-circle' : type === 'error' ? 'alert-circle' : 'information-circle';
  const iconColor = type === 'success' ? '#4ade80' : type === 'error' ? '#f87171' : '#60a5fa';

  return (
    <Animated.View 
      entering={FadeInUp.springify().damping(15).stiffness(120)}
      exiting={FadeOutUp}
      style={[styles.toastContainer]}
    >
      <Animated.View 
        entering={FadeInUp.delay(100).springify()}
        style={styles.toastContent}
      >
        <Ionicons name={iconName} size={22} color={iconColor} />
        <Text style={styles.toastText} numberOfLines={2}>{message}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    gap: 10,
    maxWidth: '100%',
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
