import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface JDLogoProps {
  size?: 'small' | 'large';
}

export default function JDLogo({ size = 'small' }: JDLogoProps) {
  const fontSize = size === 'large' ? 120 : 52;
  const subtitleSize = size === 'large' ? 18 : 0;
  const topOffset = size === 'large' ? 6 : 5;

  return (
    <View style={styles.container}>
      <View style={styles.letters}>
        <Text style={[styles.letter, { fontSize, color: '#B59363' }]}>J</Text>
        <Text style={[styles.letter, styles.letterD, { fontSize, top: topOffset, color: '#8E7D65' }]}>D</Text>
      </View>
      {size === 'large' && (
        <Text style={[styles.subtitle, { fontSize: subtitleSize }]}>
          By Chef José Domingos
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  letters: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  letter: {
    fontStyle: 'italic',
    fontWeight: '400',
    lineHeight: undefined,
  },
  letterD: {
    position: 'relative',
  },
  subtitle: {
    fontStyle: 'italic',
    color: '#8E7D65',
    marginTop: 4,
  },
});
