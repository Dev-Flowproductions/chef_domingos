import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Colors, Assets } from '../lib/theme';

interface ScreenWrapperProps {
  children: React.ReactNode;
}

export default function ScreenWrapper({ children }: ScreenWrapperProps) {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: Assets.bgIllustration }}
        style={styles.bg}
        resizeMode="cover"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  bg: {
    position: 'absolute',
    width: 874,
    height: 874,
    left: -311,
    top: 0,
    opacity: 0.5,
  },
});
