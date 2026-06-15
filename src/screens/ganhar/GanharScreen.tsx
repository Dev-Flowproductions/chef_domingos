import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import LoyaltyQrImage from '../../components/LoyaltyQrImage';
import { Colors, Assets } from '../../lib/theme';
import { buildLoyaltyQrPayload } from '../../lib/loyaltyQr';
import { ensureLkmCardLinked } from '../../services/lkm/ensureCard';
import { useAuthStore } from '../../store/authStore';
import JDLogo from '../../components/JDLogo';

export default function GanharScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [cardCode, setCardCode] = useState<string | null>(null);
  const [shortCode, setShortCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsRegistration, setNeedsRegistration] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setNeedsRegistration(true);
      setError(t('ganhar.cardNotReady'));
      return;
    }
    setLoading(true);
    setError(null);
    setNeedsRegistration(false);
    try {
      const profile = await ensureLkmCardLinked();
      if (profile.linked && profile.cardCode) {
        setCardCode(profile.cardCode);
        setShortCode(profile.shortCode ?? null);
      } else {
        setNeedsRegistration(true);
        setCardCode(null);
        setShortCode(null);
        setError(profile.errorMessage ?? null);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, t]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const displayCode = shortCode ?? cardCode;
  const qrValue = cardCode ? buildLoyaltyQrPayload(cardCode) : null;

  const copyCode = async () => {
    if (!displayCode) return;
    await Clipboard.setStringAsync(displayCode);
    Alert.alert(t('ganhar.copiedTitle'), t('ganhar.copiedBody'));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Image source={Assets.bgIllustration} style={styles.bg} resizeMode="cover" />

      <View style={styles.logoWrap}>
        <JDLogo size="small" />
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.title}>{t('ganhar.title')}</Text>
        <Text style={styles.body}>{t('ganhar.body')}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.gold} size="large" style={{ marginVertical: 40 }} />
      ) : needsRegistration || !qrValue ? (
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>
            {error ?? t('ganhar.cardNotReady')}
          </Text>
          {!error ? (
            <Text style={styles.messageHint}>{t('ganhar.cardNotReadyHint')}</Text>
          ) : null}
          <TouchableOpacity style={styles.retryBtn} onPress={() => void loadProfile()}>
            <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.qrWrap}>
            <LoyaltyQrImage value={qrValue} size={180} />
          </View>
          <Text style={styles.code}>{displayCode}</Text>
          <TouchableOpacity style={styles.copyBtn} onPress={() => void copyCode()}>
            <Text style={styles.copyBtnText}>{t('ganhar.copyCode')}</Text>
          </TouchableOpacity>
        </>
      )}
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
  bg: { position: 'absolute', width: 874, height: 874, left: -274, top: 0, opacity: 0.4 },
  logoWrap: { alignItems: 'center', marginBottom: 16 },
  titleBlock: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 34, fontWeight: '400', color: Colors.gold, textAlign: 'center', marginBottom: 16 },
  body: { fontSize: 18, color: Colors.textPrimary, textAlign: 'center', lineHeight: 28 },
  qrWrap: {
    width: 203,
    height: 203,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    overflow: 'hidden',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  code: {
    fontSize: 28,
    fontWeight: '400',
    color: Colors.gold,
    textAlign: 'center',
    marginTop: 24,
    letterSpacing: 2,
  },
  copyBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.gold,
  },
  copyBtnText: { color: Colors.gold, fontSize: 15, fontWeight: '600' },
  messageBox: { alignItems: 'center', paddingHorizontal: 12, marginTop: 8 },
  messageText: { fontSize: 16, color: Colors.textPrimary, textAlign: 'center', lineHeight: 24 },
  messageHint: { fontSize: 14, color: 'rgba(45,45,45,0.7)', textAlign: 'center', lineHeight: 22, marginTop: 12 },
  retryBtn: {
    marginTop: 20,
    backgroundColor: Colors.gold,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 22,
  },
  retryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
