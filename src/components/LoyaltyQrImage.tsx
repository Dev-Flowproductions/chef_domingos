import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import QRCode from 'qrcode';
import { Colors } from '../lib/theme';

type Props = {
  value: string;
  size?: number;
};

export default function LoyaltyQrImage({ value, size = 180 }: Props) {
  const matrix = useMemo(() => {
    try {
      const qr = QRCode.create(value, { errorCorrectionLevel: 'M' });
      return { size: qr.modules.size, data: qr.modules.data as Uint8Array };
    } catch (err) {
      console.warn('[LoyaltyQrImage] QR generation failed:', err);
      return null;
    }
  }, [value]);

  if (!matrix) {
    return (
      <View style={[styles.wrap, { width: size, height: size }]}>
        <View style={styles.failedDot} />
      </View>
    );
  }

  const cellSize = size / matrix.size;

  return (
    <View style={{ width: size, height: size, backgroundColor: '#fff' }}>
      {Array.from({ length: matrix.size }, (_, row) => (
        <View key={row} style={{ flexDirection: 'row' }}>
          {Array.from({ length: matrix.size }, (_, col) => {
            const idx = row * matrix.size + col;
            const dark = matrix.data[idx] === 1;
            return (
              <View
                key={col}
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: dark ? '#1a1a1a' : '#ffffff',
                }}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  failedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
});
