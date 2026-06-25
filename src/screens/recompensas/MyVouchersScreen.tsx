import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import LoyaltyQrImage from '../../components/LoyaltyQrImage';
import { Colors, Assets } from '../../lib/theme';
import { useVouchersStore } from '../../store/vouchersStore';
import type { RewardsStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RewardsStackParamList, 'MyVouchers'>;

const STATE_KEYS: Record<string, string> = {
  active: 'rewards.voucherStateActive',
  pending: 'rewards.voucherStatePending',
  used: 'rewards.voucherStateUsed',
  expired: 'rewards.voucherStateExpired',
};

export default function MyVouchersScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { myVouchers, vouchersLoading, fetchMyVouchers } = useVouchersStore();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void fetchMyVouchers();
    }, [fetchMyVouchers]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyVouchers();
    setRefreshing(false);
  };

  const copyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    Alert.alert(t('ganhar.copiedTitle'), t('ganhar.copiedBody'));
  };

  const activeVouchers = myVouchers.filter((v) => v.state === 'active' || v.state === 'pending');

  return (
    <View style={styles.root}>
      <Image source={Assets.bgIllustration} style={styles.bg} resizeMode="cover" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />
        }
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          <Text style={styles.backText}>{t('rewards.backToCatalog')}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t('rewards.myVouchers')}</Text>
        <Text style={styles.subtitle}>{t('rewards.myVouchersHint')}</Text>

        {vouchersLoading && myVouchers.length === 0 ? (
          <ActivityIndicator color={Colors.gold} style={{ marginTop: 32 }} />
        ) : activeVouchers.length === 0 ? (
          <Text style={styles.empty}>{t('rewards.myVouchersEmpty')}</Text>
        ) : (
          <View style={styles.list}>
            {activeVouchers.map((v) => {
              const stateKey = STATE_KEYS[v.state] ?? STATE_KEYS.active;
              const qrValue = v.qrValue || v.id;
              return (
                <View key={v.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{v.title}</Text>
                  <Text style={styles.cardMeta}>
                    {v.restaurantName} · {t(stateKey)}
                  </Text>
                  {v.expiresAt ? (
                    <Text style={styles.cardMeta}>{t('rewards.expires', { date: v.expiresAt.slice(0, 10) })}</Text>
                  ) : null}
                  <View style={styles.qrWrap}>
                    <LoyaltyQrImage value={qrValue} size={160} />
                  </View>
                  <Text style={styles.code}>{qrValue}</Text>
                  <TouchableOpacity style={styles.copyBtn} onPress={() => void copyCode(qrValue)}>
                    <Text style={styles.copyBtnText}>{t('ganhar.copyCode')}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {myVouchers.some((v) => v.state === 'used' || v.state === 'expired') ? (
          <View style={styles.pastSection}>
            <Text style={styles.pastTitle}>{t('rewards.pastVouchers')}</Text>
            {myVouchers
              .filter((v) => v.state === 'used' || v.state === 'expired')
              .map((v) => (
                <View key={v.id} style={styles.pastRow}>
                  <Text style={styles.pastRowTitle}>{v.title}</Text>
                  <Text style={styles.pastRowState}>
                    {t(STATE_KEYS[v.state] ?? 'rewards.voucherStateUsed')}
                  </Text>
                </View>
              ))}
          </View>
        ) : null}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  bg: { position: 'absolute', width: 874, height: 874, left: -274, top: 0, opacity: 0.4 },
  scroll: { paddingHorizontal: 20 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 4 },
  backText: { fontSize: 16, color: Colors.textPrimary },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#757575', marginBottom: 20, lineHeight: 20 },
  empty: { textAlign: 'center', color: Colors.textPrimary, marginTop: 40, fontSize: 15 },
  list: { gap: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  cardMeta: { fontSize: 13, color: '#757575', marginTop: 4, textAlign: 'center' },
  qrWrap: {
    marginTop: 16,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    backgroundColor: '#fff',
  },
  code: { fontSize: 16, color: Colors.gold, marginTop: 12, letterSpacing: 1 },
  copyBtn: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.gold,
  },
  copyBtnText: { color: Colors.gold, fontSize: 14, fontWeight: '600' },
  pastSection: { marginTop: 28 },
  pastTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 10 },
  pastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  pastRowTitle: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  pastRowState: { fontSize: 13, color: '#888' },
});
