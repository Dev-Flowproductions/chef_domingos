import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Assets } from '../../lib/theme';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const insets = useSafeAreaInsets();
  const spin = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();

    const timer = setTimeout(onFinish, 2500);
    return () => clearTimeout(timer);
  }, []);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Image source={{ uri: Assets.bgIllustration }} style={styles.bg} resizeMode="cover" />
      <View style={styles.logoWrap}>
        <View style={styles.letters}>
          <Text style={[styles.letter, { color: '#B59363' }]}>J</Text>
          <Text style={[styles.letter, styles.letterD, { color: '#8E7D65' }]}>D</Text>
        </View>
        <Text style={styles.subtitle}>By Chef José Domingos</Text>
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
  letters: {
    flexDirection: 'row',
  },
  letter: {
    fontSize: 130,
    fontStyle: 'italic',
    fontWeight: '400',
    lineHeight: 150,
  },
  letterD: {
    marginTop: 12,
  },
  subtitle: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#8E7D65',
    marginTop: 4,
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
