import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors } from '../../lib/theme';
import { hasAdminAccess } from '../../lib/adminAccess';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import {
  lookupCustomerByCard,
  reverseCustomerPoints,
  StaffEarnTransaction,
  StaffLookupResult,
} from '../../services/lkm/staffPoints';
import type { ProfileStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'StaffRemovePoints'>;

function formatTxDate(iso: string | null, locale: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso.slice(0, 16);
  return d.toLocaleString(locale.startsWith('pt') ? 'pt-PT' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function StaffRemovePointsScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const [permission, requestPermission] = useCameraPermissions();
  const user = useAuthStore((s) => s.user);
  const profile = useUserStore((s) => s.profile);
  const isAdmin = hasAdminAccess({
    email: user?.email ?? profile?.email,
    isAdminFlag: profile?.is_admin,
    appMetadata: (user as { app_metadata?: Record<string, unknown> } | null)?.app_metadata,
  });

  useFocusEffect(
    useCallback(() => {
      if (!isAdmin) navigation.goBack();
    }, [isAdmin, navigation]),
  );

  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [cardInput, setCardInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);
  const [customer, setCustomer] = useState<StaffLookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualPoints, setManualPoints] = useState('');
  const [reason, setReason] = useState('');
  const [busyTxId, setBusyTxId] = useState<string | null>(null);

  const lookup = useCallback(async (rawCode: string) => {
    const trimmed = rawCode.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    setCustomer(null);
    setScanLocked(true);
    try {
      const res = await lookupCustomerByCard(trimmed);
      setCustomer(res);
      setCardInput(trimmed);
    } catch (err) {
      setError((err as Error).message);
      setScanLocked(false);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const onBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (scanLocked || loading || customer) return;
      void lookup(data);
    },
    [scanLocked, loading, customer, lookup],
  );

  const reset = () => {
    setCardInput('');
    setCustomer(null);
    setError(null);
    setScanLocked(false);
    setManualPoints('');
    setReason('');
    setBusyTxId(null);
  };

  const confirmReverse = (opts: { points?: number; lkmTxId?: string; label: string }) => {
    if (!customer) return;
    Alert.alert(
      t('staff.removeConfirmTitle'),
      t('staff.removeConfirmBody', { label: opts.label, name: customer.name ?? customer.cardCode }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('staff.removeConfirmAction'),
          style: 'destructive',
          onPress: () => void doReverse(opts),
        },
      ],
    );
  };

  const doReverse = async (opts: { points?: number; lkmTxId?: string }) => {
    if (!customer) return;
    setBusyTxId(opts.lkmTxId ?? 'manual');
    setError(null);
    try {
      const res = await reverseCustomerPoints({
        cardCode: customer.cardCode,
        points: opts.points,
        lkmTxId: opts.lkmTxId,
        reason: reason.trim() || undefined,
      });
      Alert.alert(
        t('common.success'),
        t('staff.removeSuccess', { count: res.pointsRemoved, balance: res.newBalance }),
      );
      const refreshed = await lookupCustomerByCard(customer.cardCode);
      setCustomer(refreshed);
      setManualPoints('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyTxId(null);
    }
  };

  const onManualSubmit = () => {
    const pts = Number(manualPoints.replace(',', '.'));
    if (!Number.isFinite(pts) || pts <= 0) {
      Alert.alert(t('common.error'), t('staff.removeInvalidPoints'));
      return;
    }
    confirmReverse({
      points: Math.round(pts),
      label: t('staff.removeManualLabel', { count: Math.round(pts) }),
    });
  };

  const onTxPress = (tx: StaffEarnTransaction) => {
    if (tx.alreadyReversed || busyTxId) return;
    confirmReverse({
      lkmTxId: tx.id,
      label: t('staff.removeTxLabel', {
        count: tx.points,
        restaurant: tx.restaurant,
      }),
    });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
      <TouchableOpacity style={styles.close} onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={28} color={Colors.textPrimary} />
      </TouchableOpacity>

      <Text style={styles.title}>{t('staff.removeTitle')}</Text>
      <Text style={styles.subtitle}>{t('staff.removeHint')}</Text>

      {!customer ? (
        <>
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'scan' && styles.modeBtnActive]}
              onPress={() => setMode('scan')}
            >
              <Text style={[styles.modeBtnText, mode === 'scan' && styles.modeBtnTextActive]}>
                {t('staff.modeScan')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'manual' && styles.modeBtnActive]}
              onPress={() => setMode('manual')}
            >
              <Text style={[styles.modeBtnText, mode === 'manual' && styles.modeBtnTextActive]}>
                {t('staff.modeManual')}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {mode === 'scan' ? (
              <View style={styles.cameraWrap}>
                {!permission?.granted ? (
                  <View style={styles.cameraPlaceholder}>
                    <Text style={styles.cameraPlaceholderText}>{t('staff.removeCameraPermission')}</Text>
                    <TouchableOpacity style={styles.btn} onPress={() => void requestPermission()}>
                      <Text style={styles.btnText}>{t('staff.cameraAllow')}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <CameraView
                    style={styles.camera}
                    facing="back"
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                    onBarcodeScanned={scanLocked || customer ? undefined : onBarcodeScanned}
                  />
                )}
                {loading ? (
                  <View style={styles.cameraOverlay}>
                    <ActivityIndicator color="#fff" size="large" />
                  </View>
                ) : null}
              </View>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  value={cardInput}
                  onChangeText={setCardInput}
                  placeholder={t('staff.removeCardPlaceholder')}
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={[styles.btn, loading && styles.btnDisabled]}
                  onPress={() => void lookup(cardInput)}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>{t('staff.removeLookup')}</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>
        </>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.customerCard}>
            <Text style={styles.customerName}>{customer.name ?? '—'}</Text>
            <Text style={styles.customerMeta}>{customer.email ?? customer.cardCode}</Text>
            <Text style={styles.customerBalance}>
              {t('staff.removeBalance', { count: customer.balance })}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>{t('staff.removeRecentTitle')}</Text>
          {customer.transactions.length === 0 ? (
            <Text style={styles.empty}>{t('staff.removeNoTx')}</Text>
          ) : (
            customer.transactions.map((tx) => (
              <TouchableOpacity
                key={tx.id}
                style={[styles.txRow, tx.alreadyReversed && styles.txRowDisabled]}
                activeOpacity={0.85}
                disabled={tx.alreadyReversed || Boolean(busyTxId)}
                onPress={() => onTxPress(tx)}
              >
                <View style={styles.txText}>
                  <Text style={styles.txRestaurant}>{tx.restaurant}</Text>
                  <Text style={styles.txMeta}>
                    {formatTxDate(tx.date, i18n.language)}
                    {tx.amountPaid > 0 ? ` · ${tx.amountPaid.toFixed(2)}€` : ''}
                  </Text>
                  {tx.alreadyReversed ? (
                    <Text style={styles.txReversed}>{t('staff.removeAlready')}</Text>
                  ) : null}
                </View>
                {busyTxId === tx.id ? (
                  <ActivityIndicator color={Colors.gold} />
                ) : (
                  <Text style={[styles.txPoints, tx.alreadyReversed && styles.txPointsMuted]}>
                    −{tx.points}
                  </Text>
                )}
              </TouchableOpacity>
            ))
          )}

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>{t('staff.removeManualTitle')}</Text>
          <TextInput
            style={styles.input}
            value={manualPoints}
            onChangeText={setManualPoints}
            placeholder={t('staff.removePointsPlaceholder')}
            placeholderTextColor="#999"
            keyboardType="number-pad"
            editable={!busyTxId}
          />
          <TextInput
            style={[styles.input, { marginTop: 10 }]}
            value={reason}
            onChangeText={setReason}
            placeholder={t('staff.removeReasonPlaceholder')}
            placeholderTextColor="#999"
            editable={!busyTxId}
          />
          <TouchableOpacity
            style={[styles.btnDanger, Boolean(busyTxId) && styles.btnDisabled]}
            onPress={onManualSubmit}
            disabled={Boolean(busyTxId)}
          >
            {busyTxId === 'manual' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>{t('staff.removeManualBtn')}</Text>
            )}
          </TouchableOpacity>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.secondaryBtn} onPress={reset}>
            <Text style={styles.secondaryBtnText}>{t('staff.removeAnother')}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 20 },
  close: { alignSelf: 'flex-end', padding: 8 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, marginTop: 8 },
  subtitle: { fontSize: 14, color: '#757575', marginTop: 8, marginBottom: 16, lineHeight: 20 },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0D4C0',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  modeBtnActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  modeBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  modeBtnTextActive: { color: '#fff' },
  scroll: { paddingBottom: 40 },
  cameraWrap: {
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  camera: { flex: 1 },
  cameraPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  cameraPlaceholderText: { color: '#fff', textAlign: 'center', lineHeight: 22 },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E0D5',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  btn: {
    backgroundColor: Colors.gold,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  btnDanger: {
    backgroundColor: '#B45309',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  error: { color: '#dc2626', marginTop: 14, lineHeight: 20 },
  customerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E0D5',
    padding: 16,
    marginBottom: 18,
  },
  customerName: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  customerMeta: { fontSize: 13, color: '#757575', marginTop: 4 },
  customerBalance: { fontSize: 16, fontWeight: '600', color: Colors.gold, marginTop: 10 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  empty: { fontSize: 14, color: '#757575', marginBottom: 8 },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E0D5',
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  txRowDisabled: { opacity: 0.55 },
  txText: { flex: 1 },
  txRestaurant: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  txMeta: { fontSize: 12, color: '#757575', marginTop: 2 },
  txReversed: { fontSize: 12, color: '#B45309', marginTop: 4 },
  txPoints: { fontSize: 16, fontWeight: '700', color: '#B45309' },
  txPointsMuted: { color: '#999' },
  secondaryBtn: { marginTop: 24, alignItems: 'center', padding: 12 },
  secondaryBtnText: { color: Colors.gold, fontSize: 15, textDecorationLine: 'underline' },
});
