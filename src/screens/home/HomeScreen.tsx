import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Assets } from '../../lib/theme';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { usePointsStore } from '../../store/pointsStore';
import { useVouchersStore } from '../../store/vouchersStore';
import JDLogo from '../../components/JDLogo';
import {
  getFallbackCatalog,
  getFallbackOfferImage,
  getOfferCardTheme,
  localizeCatalogItem,
} from '../../lib/offerI18n';
import type { RestaurantId } from '../../lib/menuI18n';

type HomeNav = NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;

const { width } = Dimensions.get('window');
const CARD_W = width * 0.75;

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
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<HomeNav>();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { profile, fetchProfile } = useUserStore();
  const metaName = (user as { user_metadata?: { name?: string } })?.user_metadata?.name;
  const userName = profile?.name || metaName || '—';

  const { balance, loading: ptsLoading, error: ptsError, fetch: fetchPoints } = usePointsStore();
  const { catalog, catalogLoading, fetchCatalog } = useVouchersStore();

  useEffect(() => {
    if (user?.id) fetchProfile(user.id);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      fetchPoints();
      fetchCatalog();
    }, [user?.id]),
  );

  return (
    <View style={styles.root}>
      <Image source={Assets.bgIllustration} style={styles.bg} resizeMode="cover" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]}
      >
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
              {ptsError ? (
                <Text style={styles.pointsError}>{t('common.pointsLoadError')}</Text>
              ) : null}
            </>
          )}
        </View>

        {/* Exclusive Offers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.exclusiveOffers')}</Text>
        </View>

        {catalogLoading ? (
          <ActivityIndicator color={Colors.gold} style={{ marginVertical: 16 }} />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.voucherList}
            style={styles.voucherScroll}
          >
            {(catalog.length > 0 ? catalog : getFallbackCatalog(t)).map((raw) => {
              const v = localizeCatalogItem(raw, t);
              const isLight = getOfferCardTheme(v) === 'light';
              return (
              <View key={v.id} style={[styles.voucher, isLight && styles.voucherLight]}>
                <Image
                  source={v.imageUrl ? { uri: v.imageUrl } : getFallbackOfferImage(v)}
                  style={[styles.voucherBg, isLight ? styles.voucherBgLight : styles.voucherBgDark]}
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
                    {v.restaurantName}
                  </Text>
                  <Text style={styles.voucherTitle} numberOfLines={3}>{v.title}</Text>
                  <Text style={[styles.voucherValid, isLight && styles.voucherValidLight]} numberOfLines={1}>
                    {v.description}
                  </Text>
                  <View style={styles.voucherBtn}>
                    <Text style={styles.voucherBtnText}>{t('home.pointsCost', { count: v.pointsCost })}</Text>
                  </View>
                </View>
              </View>
            );
            })}
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
                <View style={[styles.restaurantImgWrap, { backgroundColor: r.imageBg }]}>
                  <Image
                    source={r.image}
                    style={[styles.restaurantImg, { transform: [{ scale: r.imageScale }] }]}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.restaurantFooter}>
                  <Image
                    source={require('../../assets/restaurant-logo.png')}
                    style={styles.restaurantLogo}
                    resizeMode="contain"
                  />
                  <Text style={styles.restaurantName}>{t(`menu.restaurants.${r.restaurantId}`)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
  greeting: { fontSize: 26, color: Colors.textPrimary, marginBottom: 4 },
  pointsNum: { fontSize: 44, fontWeight: '800', color: Colors.gold, lineHeight: 56 },
  pointsLabel: { fontSize: 18, color: Colors.gold, letterSpacing: 1 },
  pointsError: { fontSize: 12, color: '#b45309', marginTop: 8, textAlign: 'center', paddingHorizontal: 16 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  voucherScroll: { marginHorizontal: -20 },
  voucherList: { paddingHorizontal: 20, gap: 16 },
  voucher: {
    width: CARD_W,
    height: 170,
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: '#0a0a0a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  voucherLight: {
    backgroundColor: '#ffffff',
  },
  voucherBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  voucherBgDark: {
    transform: [{ scale: 1.7 }, { translateX: 68 }],
  },
  voucherBgLight: {
    transform: [{ scale: 1.55 }, { translateX: 58 }],
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
  voucherValid: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 12 },
  voucherValidLight: { color: 'rgba(60,60,60,0.85)' },
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
  restaurantName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginTop: 4 },
});
