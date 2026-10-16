import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
  RefreshControl,
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
  getStaffUserHistory,
  listStaffDirectory,
  lookupCustomerByCard,
  reverseCustomerPoints,
  StaffEarnTransaction,
  StaffHistoryTransaction,
  StaffLookupResult,
  StaffUserRow,
} from '../../services/lkm/staffPoints';
import type { ProfileStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'StaffRemovePoints'>;
type DirectoryTab = 'users' | 'txs' | 'scan';

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

function shortId(id: string): string {
  return id.slice(0, 8);
}

function displayName(user: { name: string | null; email: string | null; id: string }): string {
  return user.name?.trim() || user.email?.trim() || shortId(user.id);
}

function matchesFilter(
  q: string,
  fields: Array<string | null | undefined>,
): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return fields.some((v) => (v ?? '').toLowerCase().includes(needle));
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

  const [tab, setTab] = useState<DirectoryTab>('users');
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<StaffUserRow[]>([]);
  const [allTxs, setAllTxs] = useState<StaffHistoryTransaction[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cardInput, setCardInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);
  const [customer, setCustomer] = useState<StaffLookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualPoints, setManualPoints] = useState('');
  const [reason, setReason] = useState('');
  const [busyTxId, setBusyTxId] = useState<string | null>(null);

  const loadDirectory = useCallback(async () => {
    setError(null);
    try {
      const res = await listStaffDirectory();
      setUsers(res.users);
      setAllTxs(res.transactions);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isAdmin) return;
      setLoadingList(true);
      void loadDirectory().finally(() => setLoadingList(false));
    }, [isAdmin, loadDirectory]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDirectory();
    setRefreshing(false);
  };

  const filteredUsers = useMemo(
    () =>
      users.filter((u) =>
        matchesFilter(query, [u.name, u.email, u.id, u.cardCode, u.shortCode]),
      ),
    [users, query],
  );

  const filteredTxs = useMemo(
    () =>
      allTxs.filter((tx) =>
        matchesFilter(query, [
          tx.userName,
          tx.userEmail,
          tx.userId,
          tx.cardCode,
          tx.description,
          tx.restaurant,
        ]),
      ),
    [allTxs, query],
  );

  const openUser = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStaffUserHistory(userId);
      setCustomer(res);
      setScanLocked(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

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
    setTab('users');
  };

  const confirmReverse = (opts: { points?: number; lkmTxId?: string; label: string }) => {
    if (!customer) return;
    Alert.alert(
      t('staff.removeConfirmTitle'),
      t('staff.removeConfirmBody', { label: opts.label, name: customer.name ?? customer.cardCode ?? customer.userId }),
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
        userId: customer.userId,
        points: opts.points,
        lkmTxId: opts.lkmTxId,
        reason: reason.trim() || undefined,
      });
      Alert.alert(
        t('common.success'),
        t('staff.removeSuccess', { count: res.pointsRemoved, balance: res.newBalance }),
      );
      const refreshed = await getStaffUserHistory(customer.userId);
      setCustomer(refreshed);
      setManualPoints('');
      await loadDirectory();
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

  const onEarnPress = (tx: StaffEarnTransaction) => {
    if (tx.alreadyReversed || busyTxId) return;
    confirmReverse({
      lkmTxId: tx.id,
      label: t('staff.removeTxLabel', {
        count: tx.points,
        restaurant: tx.restaurant,
      }),
    });
  };

  const onHistoryPress = (tx: StaffHistoryTransaction) => {
    if (!tx.reversible || tx.alreadyReversed || busyTxId) return;
    onEarnPress({
      id: tx.id,
      restaurant: tx.restaurant,
      date: tx.date,
      amountPaid: tx.amountPaid,
      points: tx.points,
      alreadyReversed: tx.alreadyReversed,
    });
  };

  const renderTxRow = (tx: StaffHistoryTransaction, showUser: boolean) => {
    const reversible = tx.reversible && !tx.alreadyReversed;
    const ptsColor = tx.points > 0 ? Colors.gold : '#B45309';
    return (
      <TouchableOpacity
        key={`${tx.userId}-${tx.id}`}
        style={[styles.txRow, tx.alreadyReversed && styles.txRowDisabled]}
        activeOpacity={reversible ? 0.85 : 1}
        disabled={!reversible || Boolean(busyTxId)}
        onPress={() => (customer ? onHistoryPress(tx) : void openUser(tx.userId))}
      >
        <View style={styles.txText}>
          {showUser ? (
            <Text style={styles.txRestaurant}>{displayName({ id: tx.userId, name: tx.userName, email: tx.userEmail })}</Text>
          ) : (
            <Text style={styles.txRestaurant}>{tx.restaurant}</Text>
          )}
          <Text style={styles.txMeta}>
            {showUser ? `${tx.description} · ` : ''}
            {formatTxDate(tx.date, i18n.language)}
            {tx.amountPaid > 0 ? ` · ${tx.amountPaid.toFixed(2)}€` : ''}
          </Text>
          {showUser ? <Text style={styles.txId}>{t('staff.userIdLabel', { id: shortId(tx.userId) })}</Text> : null}
          {tx.alreadyReversed ? <Text style={styles.txReversed}>{t('staff.removeAlready')}</Text> : null}
          {customer && reversible ? <Text style={styles.txHint}>{t('staff.tapToReverse')}</Text> : null}
        </View>
        {busyTxId === tx.id ? (
          <ActivityIndicator color={Colors.gold} />
        ) : (
          <Text style={[styles.txPoints, { color: ptsColor }, tx.alreadyReversed && styles.txPointsMuted]}>
            {tx.points > 0 ? `+${tx.points}` : String(tx.points)}
          </Text>
        )}
      </TouchableOpacity>
    );
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
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder={t('staff.searchPlaceholder')}
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.modeRow}>
            {([
              { id: 'users', label: t('staff.usersTab') },
              { id: 'txs', label: t('staff.txsTab') },
              { id: 'scan', label: t('staff.scanTab') },
            ] as const).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.modeBtn, tab === item.id && styles.modeBtnActive]}
                onPress={() => setTab(item.id)}
              >
                <Text style={[styles.modeBtnText, tab === item.id && styles.modeBtnTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading && tab !== 'scan' ? (
            <ActivityIndicator color={Colors.gold} style={{ marginTop: 24 }} />
          ) : null}

          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              tab === 'scan' ? undefined : (
                <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={Colors.gold} />
              )
            }
          >
            {tab === 'users' ? (
              <>
                {loadingList && users.length === 0 ? (
                  <ActivityIndicator color={Colors.gold} style={{ marginTop: 24 }} />
                ) : filteredUsers.length === 0 ? (
                  <Text style={styles.empty}>{t('staff.noUsers')}</Text>
                ) : (
                  filteredUsers.map((u) => (
                    <TouchableOpacity
                      key={u.id}
                      style={styles.userRow}
                      activeOpacity={0.85}
                      onPress={() => void openUser(u.id)}
                    >
                      <View style={styles.txText}>
                        <Text style={styles.customerName}>{displayName(u)}</Text>
                        <Text style={styles.customerMeta}>{u.email ?? u.cardCode ?? '—'}</Text>
                        <Text style={styles.txId}>{t('staff.userIdLabel', { id: shortId(u.id) })}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#999" />
                    </TouchableOpacity>
                  ))
                )}
              </>
            ) : null}

            {tab === 'txs' ? (
              <>
                {loadingList && allTxs.length === 0 ? (
                  <ActivityIndicator color={Colors.gold} style={{ marginTop: 24 }} />
                ) : filteredTxs.length === 0 ? (
                  <Text style={styles.empty}>{t('staff.noAllTx')}</Text>
                ) : (
                  filteredTxs.map((tx) => renderTxRow(tx, true))
                )}
              </>
            ) : null}

            {tab === 'scan' ? (
              <>
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
                <TextInput
                  style={[styles.input, { marginTop: 14 }]}
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
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>
        </>
      ) : (
        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.customerCard}>
            <Text style={styles.customerName}>{customer.name ?? '—'}</Text>
            <Text style={styles.customerMeta}>{customer.email ?? customer.cardCode ?? '—'}</Text>
            <Text style={styles.txId}>{t('staff.userIdLabel', { id: customer.userId })}</Text>
            <Text style={styles.customerBalance}>
              {t('staff.removeBalance', { count: customer.balance })}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>{t('staff.historyAllTitle')}</Text>
          {(customer.history ?? []).length === 0 ? (
            <Text style={styles.empty}>{t('staff.removeNoTx')}</Text>
          ) : (
            (customer.history ?? []).map((tx) => renderTxRow(tx, false))
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
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 16, marginTop: 12 },
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
  modeBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
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
  empty: { fontSize: 14, color: '#757575', marginBottom: 8, marginTop: 12 },
  userRow: {
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
  txId: { fontSize: 11, color: '#9a9a9a', marginTop: 2 },
  txHint: { fontSize: 12, color: Colors.gold, marginTop: 4 },
  txReversed: { fontSize: 12, color: '#B45309', marginTop: 4 },
  txPoints: { fontSize: 16, fontWeight: '700' },
  txPointsMuted: { color: '#999' },
  secondaryBtn: { marginTop: 24, alignItems: 'center', padding: 12 },
  secondaryBtnText: { color: Colors.gold, fontSize: 15, textDecorationLine: 'underline' },
});
