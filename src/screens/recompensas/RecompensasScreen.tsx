import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Assets } from '../../lib/theme';
import { usePointsStore } from '../../store/pointsStore';
import { useAuthStore } from '../../store/authStore';
import { useVouchersStore } from '../../store/vouchersStore';
import JDLogo from '../../components/JDLogo';
import { getFallbackCatalog, localizeCatalogItem } from '../../lib/offerI18n';
import { formatVoucherExpiry, moneyCooldownRemainingMs } from '../../lib/loyaltyRules';
import type { RewardsStackParamList } from '../../navigation/types';

type RewardsNav = NativeStackNavigationProp<RewardsStackParamList, 'RewardsMain'>;

const FALLBACK_IMAGES = [
  require('../../assets/pizza-lab-food.jpg'),
  require('../../assets/portuguese-lab-food.jpg'),
];

export default function RecompensasScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<RewardsNav>();

  const { balance, loading: ptsLoading, fetch: fetchPoints } = usePointsStore();
  const {
    moneyCatalog,
    catalogLoading,
    fetchCatalog,
    claim,
    claiming,
    myVouchers,
    fetchMyVouchers,
    moneyCooldownUntil,
    hasActiveVoucher,
  } = useVouchersStore();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    if (!user?.id) return;
    fetchPoints();
    fetchCatalog();
    fetchMyVouchers();
  }, [user?.id]);

  useEffect(() => {
    if (!moneyCooldownUntil) return;
    const id = setInterval(() => setNowTick(Date.now()), 60_000);
    return () => clearInterval(id);
  }, [moneyCooldownUntil]);

  const cooldownMs = useMemo(
    () => moneyCooldownRemainingMs(moneyCooldownUntil, nowTick),
    [moneyCooldownUntil, nowTick],
  );
  const moneyBlocked = cooldownMs > 0;
  const redeemBlocked = moneyBlocked || hasActiveVoucher;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPoints(), fetchCatalog(), fetchMyVouchers()]);
    setRefreshing(false);
  };

  const handleClaim = async (catalogId: string, title: string, cost: number) => {
    if (hasActiveVoucher) {
      Alert.alert(t('rewards.noStackTitle'), t('rewards.noStackBody'));
      return;
    }
    if (moneyBlocked) {
      Alert.alert(
        t('rewards.cooldownTitle'),
        t('rewards.cooldownBody', {
          until: formatVoucherExpiry(moneyCooldownUntil!, i18n.language),
        }),
      );
      return;
    }
    if (balance < cost) {
      Alert.alert(
        t('rewards.insufficientPoints'),
        t('rewards.needPoints', { cost, title, balance }),
      );
      return;
    }
    Alert.alert(
      t('rewards.claimTitle'),
      t('rewards.claimConfirmSpend', { title, cost }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('rewards.claim'),
          onPress: async () => {
            try {
              await claim(catalogId);
              await Promise.all([fetchPoints(), fetchCatalog(), fetchMyVouchers()]);
              Alert.alert(t('common.success'), t('rewards.claimSuccessQr', { title, cost }), [
                { text: t('rewards.viewVouchers'), onPress: () => navigation.navigate('MyVouchers') },
                { text: t('common.ok'), style: 'cancel' },
              ]);
            } catch (err) {
              const msg = (err as Error).message;
              if (msg === 'ACTIVE_VOUCHER') {
                Alert.alert(t('rewards.noStackTitle'), t('rewards.noStackBody'));
                await fetchMyVouchers();
                return;
              }
              if (msg.startsWith('COOLDOWN:')) {
                const until = msg.slice('COOLDOWN:'.length);
                Alert.alert(
                  t('rewards.cooldownTitle'),
                  t('rewards.cooldownBody', {
                    until: formatVoucherExpiry(until, i18n.language),
                  }),
                );
                await fetchCatalog();
                return;
              }
              Alert.alert(t('common.error'), msg);
            }
          },
        },
      ],
    );
  };

  const list = moneyCatalog.length > 0 ? moneyCatalog : getFallbackCatalog(t);
  const activeCount = myVouchers.filter((v) => v.state === 'active' || v.state === 'pending').length;

  return (
    <View style={styles.root}>
      <Image source={Assets.bgIllustration} style={styles.bg} resizeMode="cover" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
      >
        <View style={styles.logoWrap}>
          <JDLogo size="small" />
        </View>

        <View style={styles.pointsBlock}>
          <Text style={styles.label}>{t('rewards.title')}</Text>
          {ptsLoading ? (
            <ActivityIndicator color={Colors.gold} style={{ marginVertical: 8 }} />
          ) : (
            <>
              <Text style={styles.pointsNum}>{Number.isFinite(balance) ? balance : 0}</Text>
              <Text style={styles.pointsLabel}>{t('common.points')}</Text>
              <Text style={styles.earnHint}>{t('rewards.earnRate')}</Text>
              <Text style={styles.spendHint}>{t('rewards.spendHint')}</Text>
            </>
          )}
          <TouchableOpacity
            style={styles.myVouchersBtn}
            onPress={() => navigation.navigate('MyVouchers')}
            activeOpacity={0.85}
          >
            <Ionicons name="ticket-outline" size={18} color={Colors.gold} />
            <Text style={styles.myVouchersText}>
              {t('rewards.myVouchers')}
              {activeCount > 0 ? ` (${activeCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>{t('rewards.moneyVouchers')}</Text>
        <Text style={styles.sectionSubtitle}>{t('rewards.moneyVouchersHint')}</Text>
        {hasActiveVoucher ? (
          <Text style={styles.cooldownBanner}>{t('rewards.noStackBanner')}</Text>
        ) : moneyBlocked && moneyCooldownUntil ? (
          <Text style={styles.cooldownBanner}>
            {t('rewards.cooldownBanner', {
              until: formatVoucherExpiry(moneyCooldownUntil, i18n.language),
            })}
          </Text>
        ) : null}

        {catalogLoading ? (
          <ActivityIndicator color={Colors.gold} style={{ marginVertical: 16 }} />
        ) : (
          <View style={styles.list}>
            {list.map((raw, i) => {
              const v = localizeCatalogItem(raw, t);
              const disabled = claiming || redeemBlocked;
              return (
                <View key={v.id} style={[styles.voucher, redeemBlocked && styles.voucherDimmed]}>
                  <Image
                    source={v.imageUrl ? { uri: v.imageUrl } : FALLBACK_IMAGES[i % 2]}
                    style={styles.voucherBg}
                    resizeMode="cover"
                  />
                  <View style={styles.overlay} />
                  <View style={styles.voucherContent}>
                    <Text style={styles.vTag}>{v.restaurantName}</Text>
                    <Text style={styles.vTitle}>{v.title}</Text>
                    <Text style={styles.vValid}>{v.description}</Text>
                    <TouchableOpacity
                      style={[styles.vBtn, disabled && styles.vBtnDisabled]}
                      activeOpacity={0.85}
                      onPress={() => handleClaim(v.id, v.title, v.pointsCost)}
                      disabled={disabled}
                    >
                      <Text style={styles.vBtnText}>
                        {hasActiveVoucher
                          ? t('rewards.noStackShort')
                          : moneyBlocked
                            ? t('rewards.cooldownShort')
                            : t('rewards.redeemForPoints', { count: v.pointsCost })}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  bg: { position: 'absolute', width: 874, height: 874, left: -274, top: 0, opacity: 0.4 },
  scroll: { paddingHorizontal: 20 },
  logoWrap: { alignItems: 'center', marginBottom: 4 },
  pointsBlock: { alignItems: 'center', marginBottom: 24 },
  label: { fontSize: 26, color: Colors.textPrimary, marginBottom: 8 },
  pointsNum: { fontSize: 48, fontWeight: '300', color: Colors.gold, lineHeight: 56 },
  pointsLabel: { fontSize: 14, letterSpacing: 2, color: Colors.textPrimary, marginBottom: 8 },
  earnHint: { fontSize: 12, color: '#757575', textAlign: 'center' },
  spendHint: {
    fontSize: 13,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: 8,
    marginHorizontal: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  myVouchersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.gold,
  },
  myVouchersText: { fontSize: 14, color: Colors.gold, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  sectionSubtitle: { fontSize: 12, color: '#757575', marginBottom: 14, lineHeight: 18 },
  cooldownBanner: {
    fontSize: 13,
    color: '#8a5a00',
    backgroundColor: 'rgba(191,153,78,0.18)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    lineHeight: 18,
  },
  list: { gap: 16 },
  voucher: {
    height: 189,
    borderRadius: 13,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  voucherDimmed: { opacity: 0.72 },
  voucherBg: { position: 'absolute', width: '100%', height: '100%' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.48)' },
  voucherContent: { flex: 1, padding: 20, justifyContent: 'center' },
  vTag: { color: '#fff', fontSize: 14, marginBottom: 4 },
  vTitle: { color: Colors.gold, fontSize: 19, fontWeight: '700', lineHeight: 24, marginBottom: 8 },
  vValid: { color: '#fff', fontSize: 14, marginBottom: 12 },
  vBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  vBtnDisabled: { opacity: 0.5 },
  vBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
