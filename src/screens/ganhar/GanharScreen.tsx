import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Assets } from '../../lib/theme';
import JDLogo from '../../components/JDLogo';

const QR_IMAGE = require('../../assets/qr-code.png');
const CODE = 'A3B2-C4D5-E6F7';

export default function GanharScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Image source={Assets.bgIllustration} style={styles.bg} resizeMode="cover" />

      {/* Logo */}
      <View style={styles.logoWrap}>
        <JDLogo size="small" />
      </View>

      {/* Title */}
      <View style={styles.titleBlock}>
        <Text style={styles.title}>Ganhar Pontos</Text>
        <Text style={styles.body}>
          Apresente este código no restaurante para acumular pontos na sua compra.
        </Text>
      </View>

      {/* QR code */}
      <View style={styles.qrWrap}>
        <Image source={QR_IMAGE} style={styles.qr} resizeMode="contain" />
      </View>

      {/* Code text */}
      <Text style={styles.code}>{CODE}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  bg: {
    position: 'absolute',
    width: 874,
    height: 874,
    left: -274,
    top: 0,
    opacity: 0.4,
  },
  logoWrap: { alignItems: 'center', marginBottom: 16 },
  titleBlock: { alignItems: 'center', marginBottom: 32 },
  title: {
    fontSize: 34,
    fontWeight: '400',
    color: Colors.gold,
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    fontSize: 18,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 28,
  },
  qrWrap: {
    width: 203,
    height: 203,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  qr: {
    width: '100%',
    height: '100%',
  },
  code: {
    fontSize: 34,
    fontWeight: '400',
    color: Colors.gold,
    textAlign: 'center',
    marginTop: 24,
    letterSpacing: 2,
  },
});
