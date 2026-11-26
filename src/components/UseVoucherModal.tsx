import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useKeepAwake } from 'expo-keep-awake';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import LoyaltyQrImage from './LoyaltyQrImage';
import { PageBackground } from './ScreenWrapper';
import { Colors } from '../lib/theme';
import { buildLoyaltyQrPayload } from '../lib/loyaltyQr';
import { ensureLkmCardLinked } from '../services/lkm/ensureCard';

type Props = {
  visible: boolean;
  title: string;
  points: number;
  onClose: () => void;
};

function KeepScreenAwake() {
  useKeepAwake();
  return null;
}

export function UseVoucherModal({ visible, title, points, onClose }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<'ask' | 'qr'>('ask');
  const [loading, setLoading] = useState(false);
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) return;
    setStep('ask');
    setLoading(false);
    setQrValue(null);
    setCode(null);
    setError(null);
  }, [visible]);

  const showQr = async () => {
    setStep('qr');
    setLoading(true);
    setError(null);
    try {
      const profile = await ensureLkmCardLinked();
      if (!profile.linked || !profile.cardCode) {
        setQrValue(null);
        setCode(null);
        setError(profile.errorMessage ?? t('ganhar.cardNotReady'));
        return;
      }
      setCode(profile.shortCode ?? profile.cardCode);
      setQrValue(buildLoyaltyQrPayload(profile.cardCode));
    } catch (err) {
      setQrValue(null);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    Alert.alert(t('ganhar.copiedTitle'), t('ganhar.copiedBody'));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={step === 'ask'}
      onRequestClose={onClose}
    >
      {step === 'ask' ? (
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.voucherName}>{title}</Text>
            <Text style={styles.points}>{t('rewards.ptsShort', { count: points })}</Text>
            <View style={styles.steps}>
              <Text style={styles.step}>{t('rewards.useVoucherStep1')}</Text>
              <Text style={styles.step}>{t('rewards.useVoucherStep2')}</Text>
              <Text style={styles.step}>{t('rewards.useVoucherStep3')}</Text>
            </View>
            <TouchableOpacity style={styles.primary} onPress={() => void showQr()} activeOpacity={0.85}>
              <Text style={styles.primaryText}>{t('rewards.useVoucher')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondary} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.secondaryText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.qrScreen}>
          <KeepScreenAwake />
          <PageBackground />
          <View style={[styles.qrHeader, { paddingTop: insets.top + 12 }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
              <Ionicons name="close" size={28} color={Colors.gold} />
            </TouchableOpacity>
          </View>
          <View style={styles.qrBody}>
            <Text style={styles.qrTitle}>{title}</Text>
            <View style={styles.claimedRow}>
              <Ionicons name="checkmark-circle" size={22} color={Colors.gold} />
              <Text style={styles.claimedText}>{t('rewards.voucherClaimed')}</Text>
            </View>
            <Text style={styles.qrHint}>{t('rewards.voucherQrBody')}</Text>
            {loading ? (
              <ActivityIndicator color={Colors.gold} size="large" style={{ marginTop: 32 }} />
            ) : error || !qrValue ? (
              <Text style={styles.error}>{error ?? t('ganhar.cardNotReady')}</Text>
            ) : (
              <>
                <View style={styles.qrWrap}>
                  <LoyaltyQrImage value={qrValue} size={220} />
                </View>
                {code ? <Text style={styles.code}>{code}</Text> : null}
                {code ? (
                  <TouchableOpacity style={styles.copyBtn} onPress={() => void copyCode()} activeOpacity={0.85}>
                    <Text style={styles.copyBtnText}>{t('ganhar.copyCode')}</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            )}
          </View>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(45, 40, 32, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
  },
  voucherName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gold,
    textAlign: 'center',
  },
  points: {
    marginTop: 6,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  claimedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  claimedText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.gold,
  },
  steps: {
    alignSelf: 'stretch',
    marginTop: 18,
    gap: 8,
  },
  step: {
    fontSize: 15,
    lineHeight: 22,
    color: '#757575',
  },
  primary: {
    marginTop: 22,
    backgroundColor: Colors.gold,
    borderRadius: 22,
    minWidth: 180,
    paddingHorizontal: 28,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondary: {
    marginTop: 12,
    paddingVertical: 8,
  },
  secondaryText: {
    color: Colors.gold,
    fontSize: 15,
  },
  qrScreen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  qrHeader: {
    paddingHorizontal: 16,
    alignItems: 'flex-end',
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrBody: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 12,
  },
  qrTitle: {
    fontSize: 28,
    color: Colors.gold,
    textAlign: 'center',
  },
  qrHint: {
    marginTop: 14,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  qrWrap: {
    marginTop: 28,
    width: 244,
    height: 244,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  code: {
    marginTop: 20,
    fontSize: 22,
    letterSpacing: 2,
    color: Colors.gold,
    textAlign: 'center',
  },
  copyBtn: {
    marginTop: 16,
    alignSelf: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.gold,
  },
  copyBtnText: { color: Colors.gold, fontSize: 15, fontWeight: '600', textAlign: 'center' },
  error: {
    marginTop: 28,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
});
