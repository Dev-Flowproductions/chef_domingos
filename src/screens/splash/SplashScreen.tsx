import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Assets } from '../../lib/theme';
import JDLogo from '../../components/JDLogo';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const insets = useSafeAreaInsets();
  const spin = useRef(new Animated.Value(0)).current;
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    );
    loop.start();

    const timer = setTimeout(() => onFinishRef.current(), 2500);
    return () => {
      clearTimeout(timer);
      loop.stop();
    };
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Image source={Assets.bgIllustration} style={styles.bg} resizeMode="cover" />
      <View style={styles.logoWrap}>
        <JDLogo size="large" />
      </View>
      <Animated.View style={[styles.spinner, { transform: [{ rotate }] }]}>
        <View style={styles.spinnerInner} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bg: {
    position: 'absolute',
    width: 874,
    height: 874,
    left: -311,
    top: 0,
    opacity: 0.6,
  },
  logoWrap: {
    alignItems: 'center',
  },
  spinner: {
    position: 'absolute',
    bottom: 120,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
    borderColor: Colors.gold,
    borderTopColor: 'transparent',
  },
  spinnerInner: {
    flex: 1,
  },
});
