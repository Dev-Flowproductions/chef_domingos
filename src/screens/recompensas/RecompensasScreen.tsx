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
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../lib/theme';
import { PageBackground } from '../../components/ScreenWrapper';
import { PageFrame, usePageLayout, WIDE_COLUMN } from '../../components/PageFrame';
import { usePointsStore } from '../../store/pointsStore';
import { useAuthStore } from '../../store/authStore';
import { useVouchersStore } from '../../store/vouchersStore';
import JDLogo from '../../components/JDLogo';
import { UseVoucherModal } from '../../components/UseVoucherModal';
import { localizeCatalogItem } from '../../lib/offerI18n';
import { discountCardImage, discountCardTheme, discountCustomerCopy } from '../../lib/discountCards';
import {
  POS_DISCOUNT_CATALOG,
  isDiscountVisibleToCustomers,
  type PosDiscountVisibility,
} from '../../lib/posDiscountCatalog';
import { listDiscountVisibility, type DiscountVisibilityRow } from '../../services/lkm/rewardOffers';
import { formatVoucherExpiry, moneyCooldownRemainingMs } from '../../lib/loyaltyRules';
import type { RewardsStackParamList } from '../../navigation/types';

type RewardsNav = NativeStackNavigationProp<RewardsStackParamList, 'RewardsMain'>;

function visibilityMap(rows: DiscountVisibilityRow[]): Map<string, PosDiscountVisibility> {
  return new Map(rows.map((row) => [row.catalogId, { hidden: row.hidden, visibleFrom: row.visibleFrom }]));
}

export default function RecompensasScreen() {
  const insets = useSafeAreaInsets();
  const { width, isTablet } = usePageLayout(WIDE_COLUMN);
  const content = Math.min(Math.max(width - 40, 0), WIDE_COLUMN);
  const voucherWidth = isTablet ? (content - 16) / 2 : undefined;
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<RewardsNav>();

  const { balance, loading: ptsLoading, fetch: fetchPoints } = usePointsStore();
  const {
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
  const [visibility, setVisibility] = useState<Map<string, PosDiscountVisibility>>(new Map());
  const [voucherUse, setVoucherUse] = useState<{ title: string; cost: number } | null>(null);

  const loadVisibility = async () => {
    try {
      const rows = await listDiscountVisibility();
      setVisibility(visibilityMap(rows));
    } catch {
      setVisibility(new Map());
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    fetchPoints();
    fetchCatalog();
    fetchMyVouchers();
    void loadVisibility();
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

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPoints(), fetchCatalog(), fetchMyVouchers(), loadVisibility()]);
    setRefreshing(false);
  };

  const handlePosPrize = (title: string, cost: number) => {
    if (balance < cost) {
      Alert.alert(
        t('rewards.insufficientPoints'),
        t('rewards.needPoints', { cost, title, balance }),
      );
      return;
    }
    setVoucherUse({ title, cost });
  };

  const handleClaim = async (catalogId: string, title: string, cost: number, euroValue?: number) => {
    if (POS_DISCOUNT_CATALOG.some((discount) => discount.id === catalogId)) {
      handlePosPrize(title, cost);
      return;
    }
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
              if (msg === 'POS_PRIZE') {
                handlePosPrize(title, cost);
                return;
              }
              if (msg === 'TILL_ONLY') {
                Alert.alert(t('rewards.posPrizeTitle'), t('rewards.moneyVouchersHint'));
                return;
              }
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

  const catalogList = POS_DISCOUNT_CATALOG.filter(
    (discount) => discount.pointsCost != null && isDiscountVisibleToCustomers(discount, visibility.get(discount.id)),
  ).map((discount) => {
    const copy = discountCustomerCopy(discount, t);
    return {
      id: discount.id,
      title: copy.title,
      description: copy.description,
      restaurantName: copy.restaurantName,
      pointsCost: discount.pointsCost ?? 0,
      euroValue: discount.euroValue ?? 0,
      imageUrl: '',
      restaurantId: '',
      expiresAt: null,
    };
  });
  const list = catalogList;
  const activeCount = myVouchers.filter((v) => v.state === 'active' || v.state === 'pending').length;

  return (
    <>
    <View style={styles.root}>
      <PageBackground />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12, paddingBottom: (insets.bottom || 8) + 88 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
      >
        <PageFrame maxWidth={WIDE_COLUMN}>
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

        <View style={[styles.list, isTablet && styles.listTablet]}>
            {list.length === 0 ? <Text style={styles.sectionSubtitle}>{t('rewards.noVisibleDiscounts')}</Text> : null}
            {list.map((raw) => {
              const v = localizeCatalogItem(raw, t);
              const isLight = discountCardTheme(v.id) === 'light';
              return (
                <TouchableOpacity
                  key={v.id}
                  activeOpacity={0.9}
                  onPress={() => handleClaim(v.id, v.title, v.pointsCost, v.euroValue)}
                  disabled={claiming}
                  style={[styles.voucher, voucherWidth != null && { width: voucherWidth }, isLight && styles.voucherLight]}
                >
                  <Image
                    source={discountCardImage(v.id)}
                    style={styles.voucherBg}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={
                      isLight
                        ? ['rgba(255,255,255,0.98)', 'rgba(255,255,255,0.9)', 'rgba(255,255,255,0)']
                        : ['rgba(10,10,10,0.97)', 'rgba(10,10,10,0.78)', 'rgba(0,0,0,0)']
                    }
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.voucherGradient}
                  />
                  <View style={styles.voucherContent}>
                    <Text style={[styles.vTag, isLight && styles.vTagLight]}>{v.restaurantName}</Text>
                    <Text style={styles.vTitle}>{v.title}</Text>
                    <View style={styles.vBtn}>
                      <Text style={styles.vBtnText}>{t('rewards.ptsShort', { count: v.pointsCost })}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
        </View>

        <View style={{ height: 24 }} />
        </PageFrame>
      </ScrollView>
    </View>
    <UseVoucherModal
      visible={voucherUse != null}
      title={voucherUse?.title ?? ''}
      points={voucherUse?.cost ?? 0}
      onClose={() => setVoucherUse(null)}
    />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background, overflow: 'hidden' },
  scrollView: { flex: 1 },
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
  listTablet: { flexDirection: 'row', flexWrap: 'wrap' },
  voucher: {
    height: 189,
    borderRadius: 13,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0a0a0a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  voucherLight: { backgroundColor: '#ffffff' },
  voucherBg: { position: 'absolute', width: '100%', height: '100%' },
  voucherGradient: { position: 'absolute', top: 0, left: 0, bottom: 0, width: '72%' },
  voucherContent: { width: '62%', flex: 1, padding: 20, justifyContent: 'center' },
  vTag: { color: 'rgba(255,255,255,0.75)', fontSize: 14, marginBottom: 4 },
  vTagLight: { color: 'rgba(60,60,60,0.75)' },
  vTitle: { color: Colors.gold, fontSize: 19, fontWeight: '700', lineHeight: 24, marginBottom: 8 },
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
