import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  LayoutChangeEvent,
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
import {
  getFallbackCatalog,
  localizeCatalogItem,
  milestoneLabelForPts,
} from '../../lib/offerI18n';
import type { RewardsStackParamList } from '../../navigation/types';

type RewardsNav = NativeStackNavigationProp<RewardsStackParamList, 'RewardsMain'>;

const POINTS_TIERS = [
  { pts: 300, icon: require('../../assets/icon-cafe-rn.png'), labelKey: 'rewards.tierCoffee' },
  { pts: 600, icon: require('../../assets/icon-sobremesa-rn.png'), labelKey: 'rewards.tierDessert' },
  { pts: 900, icon: require('../../assets/icon-refeicao-rn.png'), labelKey: 'rewards.tierMeal' },
];

const MAX_PTS     = 900;
const CIRCLE_SIZE = 39;
const BAR_H       = 14;
const BAR_TOP     = (CIRCLE_SIZE - BAR_H) / 2;
const TIER_LABEL_WIDTH = 52;
const TIER_HALF   = TIER_LABEL_WIDTH / 2;
const CONTAINER_H = CIRCLE_SIZE + 20;

const FALLBACK_IMAGES = [
  require('../../assets/pizza-lab-food.jpg'),
  require('../../assets/portuguese-lab-food.jpg'),
];

export default function RecompensasScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const navigation = useNavigation<RewardsNav>();

  const { balance, nextMilestone, ptsToNext, loading: ptsLoading, fetch: fetchPoints } = usePointsStore();
  const { catalog, catalogLoading, fetchCatalog, claim, claiming, myVouchers, fetchMyVouchers } = useVouchersStore();
  const { user } = useAuthStore();

  const [barWidth, setBarWidth] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const trackSpan = Math.max(0, barWidth - TIER_LABEL_WIDTH);
  const fillWidth = trackSpan * Math.min(balance / MAX_PTS, 1);

  const onBarLayout = (e: LayoutChangeEvent) => {
    setBarWidth(e.nativeEvent.layout.width);
  };

  useEffect(() => {
    if (!user?.id) return;
    fetchPoints();
    fetchCatalog();
    fetchMyVouchers();
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPoints(), fetchCatalog(), fetchMyVouchers()]);
    setRefreshing(false);
  };

  const handleClaim = async (catalogId: string, title: string, cost: number) => {
    if (balance < cost) {
      Alert.alert(
        t('rewards.insufficientPoints'),
        t('rewards.needPoints', { cost, title, balance }),
      );
      return;
    }
    Alert.alert(
      t('rewards.claimTitle'),
      t('rewards.claimConfirm', { title, cost }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('rewards.claim'),
          onPress: async () => {
            try {
              await claim(catalogId);
              await fetchPoints();
              Alert.alert(t('common.success'), t('rewards.claimSuccess', { title }), [
                { text: t('rewards.viewVouchers'), onPress: () => navigation.navigate('MyVouchers') },
                { text: t('common.ok'), style: 'cancel' },
              ]);
            } catch (err) {
              Alert.alert(t('common.error'), (err as Error).message);
            }
          },
        },
      ],
    );
  };

  const milestoneName = nextMilestone
    ? milestoneLabelForPts(nextMilestone.pts, t) || nextMilestone.label
    : '';

  const subtitleText = nextMilestone
    ? t('rewards.ptsToMilestone', {
        count: ptsToNext,
        milestone: milestoneName.toLowerCase(),
      })
    : t('rewards.allMilestones');

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

        <View style={styles.titleBlock}>
          <Text style={styles.label}>{t('rewards.title')}</Text>
          <TouchableOpacity
            style={styles.myVouchersBtn}
            onPress={() => navigation.navigate('MyVouchers')}
            activeOpacity={0.85}
          >
            <Ionicons name="ticket-outline" size={18} color={Colors.gold} />
            <Text style={styles.myVouchersText}>
              {t('rewards.myVouchers')}
              {myVouchers.filter((v) => v.state === 'active' || v.state === 'pending').length > 0
                ? ` (${myVouchers.filter((v) => v.state === 'active' || v.state === 'pending').length})`
                : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Ofertas Grátis ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('rewards.freeOffers')}</Text>
          {ptsLoading ? (
            <ActivityIndicator color={Colors.gold} style={{ marginVertical: 12 }} />
          ) : (
            <>
              <Text style={styles.sectionSubtitle}>{subtitleText}</Text>

              <View style={styles.progressContainer} onLayout={onBarLayout}>
                <View style={styles.progressTrack} />
                <View style={[styles.progressFill, { width: fillWidth }]} />

                {barWidth > 0 && POINTS_TIERS.map((tier) => {
                  const isDone = balance >= tier.pts;
                  const centerX = TIER_HALF + trackSpan * (tier.pts / MAX_PTS);
                  const left = centerX - TIER_HALF;
                  return (
                    <View key={tier.pts} style={[styles.tierWrapper, { left }]}>
                      <View style={[styles.tierCircle, isDone && styles.tierCircleDone]}>
                        <Image source={tier.icon} style={styles.tierIcon} />
                      </View>
                      <Text style={styles.tierPts}>{t('rewards.ptsShort', { count: tier.pts })}</Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </View>

        {/* ── Ofertas Exclusivas ── */}
        <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>{t('rewards.exclusiveOffers')}</Text>

        {catalogLoading ? (
          <ActivityIndicator color={Colors.gold} style={{ marginVertical: 16 }} />
        ) : (
          <View style={styles.list}>
            {(catalog.length > 0 ? catalog : getFallbackCatalog(t)).map((raw, i) => {
              const v = localizeCatalogItem(raw, t);
              return (
              <View key={v.id} style={styles.voucher}>
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
                    style={[styles.vBtn, claiming && styles.vBtnDisabled]}
                    activeOpacity={0.85}
                    onPress={() => handleClaim(v.id, v.title, v.pointsCost)}
                    disabled={claiming}
                  >
                    <Text style={styles.vBtnText}>{t('rewards.pointsCost', { count: v.pointsCost })}</Text>
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
  titleBlock: { alignItems: 'center', marginBottom: 16 },
  label: { fontSize: 26, color: Colors.textPrimary },
  myVouchersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.gold,
  },
  myVouchersText: { fontSize: 14, color: Colors.gold, fontWeight: '600' },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  sectionSubtitle: { fontSize: 11, color: '#757575', marginBottom: 14 },
  progressContainer: { height: CONTAINER_H, position: 'relative' },
  progressTrack: {
    position: 'absolute',
    top: BAR_TOP,
    left: TIER_HALF,
    right: TIER_HALF,
    height: BAR_H,
    borderRadius: 30,
    backgroundColor: 'rgba(191,153,78,0.5)',
  },
  progressFill: {
    position: 'absolute',
    top: BAR_TOP,
    left: TIER_HALF,
    height: BAR_H,
    borderRadius: 30,
    backgroundColor: Colors.gold,
  },
  tierWrapper: {
    position: 'absolute',
    top: 0,
    width: TIER_LABEL_WIDTH,
    alignItems: 'center',
  },
  tierCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
    borderColor: Colors.gold,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tierCircleDone: { backgroundColor: 'rgba(191,153,78,0.15)' },
  tierIcon: { width: 16, height: 16, resizeMode: 'contain' },
  tierPts: { fontSize: 10, color: '#757575', marginTop: 4, textAlign: 'center' },
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
  voucherBg: { position: 'absolute', width: '100%', height: '100%' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.48)' },
  voucherContent: { flex: 1, padding: 20, justifyContent: 'center' },
  vTag: { color: '#fff', fontSize: 14, marginBottom: 4 },
  vTitle: { color: Colors.gold, fontSize: 19, fontWeight: '700', lineHeight: 24, marginBottom: 16 },
  vValid: { color: '#fff', fontSize: 14, marginBottom: 12 },
  vBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  vBtnDisabled: { opacity: 0.5 },
  vBtnText: { color: '#fff', fontSize: 12 },
});
