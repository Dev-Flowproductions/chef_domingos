import React, { useState } from 'react';
import { Image, LayoutChangeEvent, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Assets, Colors } from '../lib/theme';

/** Figma frame: 874px artwork, shifted so the drawn border sits around a phone. */
const BASE_SIZE = 874;
const BASE_SHIFT = 274;

function coverBox(width: number, height: number) {
  const visibleWidth = BASE_SIZE - BASE_SHIFT;
  const size = Math.max(
    BASE_SIZE,
    height,
    width > 0 ? (width * BASE_SIZE) / visibleWidth : BASE_SIZE,
  );
  return { size, left: -BASE_SHIFT * (size / BASE_SIZE) };
}

/** Illustration behind every screen. Scales so the drawing always fills the page. */
export function PageBackground({ opacity = 0.4 }: { opacity?: number }) {
  const window = useWindowDimensions();
  const [box, setBox] = useState({ width: window.width, height: window.height });

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBox((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  };

  const { size, left } = coverBox(box.width, box.height);

  return (
    <View pointerEvents="none" style={styles.frame} onLayout={onLayout}>
      <Image
        source={Assets.bgIllustration}
        resizeMode="cover"
        style={[styles.image, { width: size, height: size, left, opacity }]}
      />
    </View>
  );
}

interface ScreenWrapperProps {
  children: React.ReactNode;
}

export default function ScreenWrapper({ children }: ScreenWrapperProps) {
  return (
    <View style={styles.container}>
      <PageBackground />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    overflow: 'hidden',
  },
  frame: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    top: 0,
  },
});
