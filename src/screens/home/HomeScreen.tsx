import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../lib/theme';
import { PageBackground } from '../../components/ScreenWrapper';
import { PageFrame, usePageLayout, WIDE_COLUMN } from '../../components/PageFrame';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { usePointsStore } from '../../store/pointsStore';
import JDLogo from '../../components/JDLogo';
import { UseVoucherModal } from '../../components/UseVoucherModal';
import RestaurantLogo from '../../components/RestaurantLogo';
import { discountCardImage, discountCardTheme, discountCustomerCopy } from '../../lib/discountCards';
import {
  POS_DISCOUNT_CATALOG,
  isDiscountVisibleToCustomers,
  type PosDiscountVisibility,
} from '../../lib/posDiscountCatalog';
import { listDiscountVisibility, type DiscountVisibilityRow } from '../../services/lkm/rewardOffers';
import type { RestaurantId } from '../../lib/menuI18n';

type HomeNav = NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;

const RESTAURANTS: {
  id: string;
  restaurantId: RestaurantId;
  image: number;
  imageScale: number;
  imageBg: string;
}[] = [
  {
    id: '1',
    restaurantId: 'portugueseLab',
    image: require('../../assets/portuguese-lab-food.jpg'),
    imageScale: 2.25,
    imageBg: '#ffffff',
  },
  {
    id: '2',
    restaurantId: 'pizzaLab',
    image: require('../../assets/pizza-lab-food.jpg'),
    imageScale: 2.15,
    imageBg: '#1a1a1a',
  },
];

export default function HomeScreen() {
  const { width, isTablet, content } = usePageLayout(WIDE_COLUMN);
  const cardW = isTablet ? Math.floor((content - 16) / 2) : width * 0.75;
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<HomeNav>();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { profile, fetchProfile } = useUserStore();
  const metaName = (user as { user_metadata?: { name?: string } })?.user_metadata?.name;
  const userName = profile?.name || metaName || '—';

  const { balance, loading: ptsLoading, error: ptsError, fetch: fetchPoints } = usePointsStore();
  const [visibility, setVisibility] = useState<Map<string, PosDiscountVisibility>>(new Map());
  const [promosLoading, setPromosLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    if (user?.id) fetchProfile(user.id);
  }, [user?.id]);

  const loadVisibility = useCallback(async () => {
    try {
      const rows = await listDiscountVisibility();
      setVisibility(new Map(rows.map((row: DiscountVisibilityRow) => [row.catalogId, { hidden: row.hidden, visibleFrom: row.visibleFrom }])));
    } catch {
      setVisibility(new Map());
    } finally {
      setPromosLoading(false);
    }
  }, []);

  const specials = useMemo(
    () => POS_DISCOUNT_CATALOG.filter(
      (discount) => discount.kind !== 'money'
        && discount.pointsCost != null
        && isDiscountVisibleToCustomers(discount, visibility.get(discount.id)),
    ),
    [visibility],
  );

  const refreshHome = useCallback(async () => {
    if (!user?.id) return;
    await Promise.all([fetchPoints(), fetchProfile(user.id), loadVisibility()]);
  }, [user?.id, fetchPoints, fetchProfile, loadVisibility]);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      void refreshHome();
    }, [user?.id, refreshHome]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshHome();
    setRefreshing(false);
  };
  const [voucherUse, setVoucherUse] = useState<{ title: string; cost: number } | null>(null);
  const openSpecial = (title: string, cost: number) => {
    if (balance < cost) {
      Alert.alert(
        t('rewards.insufficientPoints'),
        t('rewards.needPoints', { cost, title, balance }),
      );
      return;
    }
    setVoucherUse({ title, cost });
  };

  const promoCards = specials.map((discount) => {
    const copy = discountCustomerCopy(discount, t);
    const isLight = discountCardTheme(discount.id) === 'light';
    return (
      <TouchableOpacity
        key={discount.id}
        style={[styles.voucherShadow, { width: cardW }]}
        activeOpacity={0.9}
        onPress={() => openSpecial(copy.title, discount.pointsCost ?? 0)}
      >
        <View style={[styles.voucher, isLight && styles.voucherLight]}>
          <Image
          source={discountCardImage(discount.id)}
          style={styles.voucherBg}
          resizeMode="cover"
          />
          <LinearGradient
          colors={
            isLight
              ? ['rgba(255,255,255,0.98)', 'rgba(255,255,255,0.88)', 'rgba(255,255,255,0)']
              : ['rgba(10,10,10,0.97)', 'rgba(10,10,10,0.75)', 'rgba(0,0,0,0)']
          }
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.voucherGradient}
          />
          <View style={styles.voucherContent}>
          <Text style={[styles.voucherTag, isLight && styles.voucherTagLight]}>
            {copy.restaurantName}
          </Text>
          <Text style={styles.voucherTitle} numberOfLines={3}>{copy.title}</Text>
          <View style={styles.voucherBtn}>
            <Text style={styles.voucherBtnText}>
              {t('rewards.ptsShort', { count: discount.pointsCost ?? 0 })}
            </Text>
          </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  });

  return (
    <>
    <View style={styles.root}>
      <PageBackground />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12, paddingBottom: (insets.bottom || 8) + 88 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />
        }
      >
        <PageFrame maxWidth={WIDE_COLUMN}>
        <View style={styles.logoWrap}>
          <JDLogo size="small" />
        </View>

        {/* Greeting + Points */}
        <View style={styles.pointsBlock}>
          <Text style={styles.greeting}>{t('home.greeting', { name: userName })}</Text>
          {ptsLoading ? (
            <ActivityIndicator color={Colors.gold} style={{ marginVertical: 12 }} />
          ) : (
            <>
              <Text style={styles.pointsNum}>{Number.isFinite(balance) ? balance : 0}</Text>
              <Text style={styles.pointsLabel}>{t('common.points')}</Text>
              <Text style={styles.expiryHint}>{t('home.pointsExpiry')}</Text>
              {ptsError ? (
                <Text style={styles.pointsError}>{t('common.pointsLoadError')}</Text>
              ) : null}
            </>
          )}
        </View>

        {/* Admin timed promos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.exclusiveOffers')}</Text>
          <Text style={styles.sectionHint}>{t('home.promoHint')}</Text>
        </View>

        {promosLoading ? (
          <ActivityIndicator color={Colors.gold} style={{ marginVertical: 16 }} />
        ) : specials.length === 0 ? (
          <Text style={styles.emptyPromos}>{t('home.noPromos')}</Text>
        ) : isTablet ? (
          <View style={styles.voucherGrid}>{promoCards}</View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.voucherList}
            style={[styles.voucherScroll, Platform.OS === 'web' ? styles.voucherScrollWeb : null]}
          >
            {promoCards}
          </ScrollView>
        )}

        {/* Restaurants */}
        <View style={[styles.section, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>{t('home.ourRestaurants')}</Text>
          <View style={styles.restaurants}>
            {RESTAURANTS.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={styles.restaurantCard}
                onPress={() => navigation.navigate('Menu', { restaurantId: r.restaurantId })}
                activeOpacity={0.9}
              >
                <View style={[styles.restaurantImgWrap, { backgroundColor: r.imageBg, height: isTablet ? 180 : 130 }]}>
                  <Image
                    source={r.image}
                    style={[styles.restaurantImg, { transform: [{ scale: r.imageScale }] }]}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.restaurantFooter}>
                  {r.restaurantId === 'pizzaLab' ? (
                    <View style={styles.pizzaLogoWrap}>
                      <Image
                        source={require('../../assets/pizza-lab-logo.png')}
                        style={styles.pizzaWordmark}
                        resizeMode="contain"
                        accessibilityLabel="Pizza Lab"
                      />
                    </View>
                  ) : (
                    <View style={styles.restaurantLogoWrap}>
                      <RestaurantLogo restaurantId={r.restaurantId} size={54} />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
  greeting: { fontSize: 26, color: Colors.textPrimary, marginBottom: 4 },
  pointsNum: { fontSize: 44, fontWeight: '800', color: Colors.gold, lineHeight: 56 },
  pointsLabel: { fontSize: 18, color: Colors.gold, letterSpacing: 1 },
  pointsError: { fontSize: 12, color: '#b45309', marginTop: 8, textAlign: 'center', paddingHorizontal: 16 },
  expiryHint: { fontSize: 12, color: '#757575', marginTop: 6, textAlign: 'center' },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  sectionHint: { fontSize: 12, color: '#757575', marginBottom: 4, lineHeight: 16 },
  emptyPromos: { fontSize: 13, color: '#888', paddingHorizontal: 4, marginBottom: 12 },
  voucherScroll: { marginHorizontal: -20 },
  voucherScrollWeb: {
    scrollbarWidth: 'none',
  },
  voucherList: { paddingHorizontal: 20, gap: 16 },
  voucherGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  voucherShadow: {
    borderRadius: 13,
  },
  voucher: {
    height: 170,
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: '#0a0a0a',
  },
  voucherLight: {
    backgroundColor: '#ffffff',
  },
  voucherBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  voucherGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '80%',
  },
  voucherContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '62%',
    paddingHorizontal: 16,
    paddingVertical: 18,
    justifyContent: 'center',
  },
  voucherTag: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 6, letterSpacing: 0.3 },
  voucherTagLight: { color: 'rgba(60,60,60,0.75)' },
  voucherTitle: { color: Colors.gold, fontSize: 16, fontWeight: '700', lineHeight: 22, marginBottom: 10 },
  voucherBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  voucherBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  restaurants: { flexDirection: 'row', gap: 16, marginTop: 8 },
  restaurantCard: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  restaurantImgWrap: {
    width: '100%',
    height: 130,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantImg: {
    width: '100%',
    height: '100%',
  },
  restaurantFooter: { backgroundColor: '#fff', paddingVertical: 10, alignItems: 'center', gap: 4 },
  restaurantLogo: { width: 54, height: 54, borderRadius: 27, marginTop: -27, backgroundColor: '#fff' },
  restaurantLogoWrap: { marginTop: -27, backgroundColor: '#fff', borderRadius: 27 },
  pizzaLogoWrap: {
    marginTop: -20,
    backgroundColor: '#FEFCF3',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pizzaWordmark: { width: 124, height: 36 },
});
