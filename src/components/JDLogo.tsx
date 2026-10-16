import React from 'react';
import { View, Image, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';

interface JDLogoProps {
  size?: 'small' | 'large';
  onLongPress?: () => void;
}

const MONOGRAM = require('../assets/jd-monogram.png');

export default function JDLogo({ size = 'small', onLongPress }: JDLogoProps) {
  const dim = size === 'large' ? 168 : 72;

  const content = (
    <Image
      source={MONOGRAM}
      style={{ width: dim, height: dim }}
      resizeMode="contain"
      accessibilityLabel="Chef José Domingos"
    />
  );

  if (onLongPress) {
    const handleLongPress = () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onLongPress();
    };
    return (
      <Pressable onLongPress={handleLongPress} delayLongPress={3000} style={styles.container}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.container}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
