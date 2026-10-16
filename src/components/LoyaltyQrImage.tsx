import React, { useMemo } from 'react';
import { Image, View } from 'react-native';
import QRCode from 'qrcode';
import { qrMatrixToPngDataUri } from '../lib/qrPng';

type Props = {
  value: string;
  size?: number;
};

type QrModules = {
  size: number;
  data: Uint8Array;
};

export default function LoyaltyQrImage({ value, size = 200 }: Props) {
  const image = useMemo(() => {
    try {
      const qr = QRCode.create(value, { errorCorrectionLevel: 'H' });
      const modules = qr.modules as unknown as QrModules;
      const n = modules.size;
      const dark: boolean[] = Array.from(modules.data, (bit) => Boolean(bit));
      const quiet = 4;
      const scale = Math.max(4, Math.floor(size / (n + quiet * 2)));
      return qrMatrixToPngDataUri(dark, n, quiet, scale);
    } catch (err) {
      console.warn('[LoyaltyQrImage] QR generation failed:', err);
      return null;
    }
  }, [value, size]);

  if (!image) {
    return (
      <View
        style={{
          width: size,
          height: size,
          backgroundColor: '#fff',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#EF4444' }} />
      </View>
    );
  }

  return (
    <Image
      accessibilityLabel="QR"
      source={{ uri: image.uri }}
      style={{ width: image.dim, height: image.dim, alignSelf: 'center', backgroundColor: '#fff' }}
      resizeMode="contain"
    />
  );
}
