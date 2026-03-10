import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius } from '../lib/theme';

interface GoldButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'filled' | 'outline';
  style?: ViewStyle;
}

export default function GoldButton({ title, onPress, variant = 'filled', style }: GoldButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        variant === 'outline' ? styles.outline : styles.filled,
        style,
      ]}
      activeOpacity={0.85}
    >
      <Text style={[styles.text, variant === 'outline' ? styles.outlineText : styles.filledText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: Radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  filled: {
    backgroundColor: Colors.gold,
  },
  outline: {
    borderWidth: 2,
    borderColor: Colors.gold,
    backgroundColor: 'transparent',
  },
  text: {
    fontSize: 18,
    fontWeight: '400',
  },
  filledText: {
    color: Colors.white,
  },
  outlineText: {
    color: Colors.gold,
  },
});
