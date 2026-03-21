import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from 'react';
import {Text, StyleSheet, Animated, Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';

type ToastType = 'success' | 'error';

interface Toast {
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

const TOAST_DURATION = 2500;
const SLIDE_DURATION = 250;

export function ToastProvider({children}: {children: React.ReactNode}) {
  const [toast, setToast] = useState<Toast | null>(null);
  const translateY = useRef(new Animated.Value(-100)).current;
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const insets = useSafeAreaInsets();

  const showToast = useCallback(
    (message: string, type: ToastType = 'success') => {
      if (timeout.current) clearTimeout(timeout.current);

      setToast({message, type});
      translateY.setValue(-100);

      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();

      timeout.current = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -100,
          duration: SLIDE_DURATION,
          useNativeDriver: true,
        }).start(() => setToast(null));
      }, TOAST_DURATION);
    },
    [translateY],
  );

  return (
    <ToastContext.Provider value={{showToast}}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toast,
            toast.type === 'error' ? styles.error : styles.success,
            {
              top: insets.top + (Platform.OS === 'ios' ? 0 : 8),
              transform: [{translateY}],
            },
          ]}
        >
          <Ionicons
            name={toast.type === 'error' ? 'close-circle' : 'checkmark-circle'}
            size={20}
            color="#fff"
          />
          <Text style={styles.text}>{toast.message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 9999,
  },
  success: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  error: {
    backgroundColor: '#D32F2F',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  text: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
});
