import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Colors, Assets } from '../../lib/theme';
import { useAuthStore } from '../../store/authStore';
import JDLogo from '../../components/JDLogo';

type MainTabNav = BottomTabNavigationProp<any>;

const { width } = Dimensions.get('window');

const POINTS = 250;
const POINTS_TIERS = [
  { label: 'Café Grátis', pts: 300, icon: '☕' },
  { label: 'Sobremesa Grátis', pts: 600, icon: '🍰' },
  { label: 'Refeição Grátis', pts: 900, icon: '🍽️' },
];

const RESTAURANTS = [
  {
    id: '1',
    name: 'Portuguese Lab',
    image: 'https://www.figma.com/api/mcp/asset/5c74d365-838a-4db9-b3eb-956c553e5867',
  },
  {
    id: '2',
    name: 'Pizza Lab',
    image: 'https://www.figma.com/api/mcp/asset/5c74d365-838a-4db9-b3eb-956c553e5867',
  },
];

const VOUCHERS = [
  {
    id: '1',
    tag: 'Oferta de Amanhã',
    title: '2ª Pizza com 50%\nde Desconto',
    valid: 'Válido no Pizza Lab',
    pts: '100 Pontos',
    image: 'https://www.figma.com/api/mcp/asset/5c74d365-838a-4db9-b3eb-956c553e5867',
  },
  {
    id: '2',
    tag: 'Oferta Especial',
    title: 'Sobremesa\nGrátis',
    valid: 'Válido no Portuguese Lab',
    pts: '200 Pontos',
    image: 'https://www.figma.com/api/mcp/asset/5c74d365-838a-4db9-b3eb-956c553e5867',
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MainTabNav>();
  const { user } = useAuthStore();
  const userName = (user as any)?.user_metadata?.name || 'Maria';

  const progressPct = Math.min(POINTS / POINTS_TIERS[2].pts, 1) * 100;

  return (
    <View style={styles.root}>
      <Image source={{ uri: Assets.bgIllustration }} style={styles.bg} resizeMode="cover" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]}
      >
        {/* Logo */}
        <View style={styles.logoWrap}>
          <JDLogo size="small" />
        </View>

        {/* Greeting + Points */}
        <View style={styles.pointsBlock}>
          <Text style={styles.greeting}>Olá, {userName}!</Text>
          <Text style={styles.pointsNum}>{POINTS}</Text>
          <Text style={styles.pointsLabel}>PONTOS</Text>
        </View>

        {/* Offers progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ofertas Grátis!</Text>
          <Text style={styles.sectionSubtitle}>
            Faltam apenas {POINTS_TIERS[0].pts - POINTS} pontos para a sua primeira oferta grátis!
          </Text>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <View style={styles.tiers}>
            {POINTS_TIERS.map((tier) => (
              <View key={tier.pts} style={styles.tierItem}>
                <View style={[styles.tierCircle, POINTS >= tier.pts && styles.tierCircleDone]}>
                  <Text style={styles.tierIcon}>{tier.icon}</Text>
                </View>
                <Text style={styles.tierPts}>{tier.pts} pts</Text>
                <Text style={styles.tierLabel}>{tier.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Exclusive Offers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ofertas Exclusivas</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.voucherList}
          style={styles.voucherScroll}
        >
          {VOUCHERS.map((v) => (
            <View key={v.id} style={styles.voucher}>
              <Image source={{ uri: v.image }} style={styles.voucherBg} resizeMode="cover" />
              <View style={styles.voucherOverlay} />
              <Text style={styles.voucherTag}>{v.tag}</Text>
              <Text style={styles.voucherTitle}>{v.title}</Text>
              <Text style={styles.voucherValid}>{v.valid}</Text>
              <View style={styles.voucherBtn}>
                <Text style={styles.voucherBtnText}>{v.pts}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Restaurants */}
        <View style={[styles.section, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Os Nossos Restaurantes</Text>
          <View style={styles.restaurants}>
            {RESTAURANTS.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={styles.restaurantCard}
                onPress={() => navigation.navigate('Menu')}
                activeOpacity={0.9}
              >
                <Image source={{ uri: r.image }} style={styles.restaurantImg} resizeMode="cover" />
                <View style={styles.restaurantFooter}>
                  <View style={styles.restaurantLogo}>
                    <Text style={styles.restaurantLogoText}>L</Text>
                  </View>
                  <Text style={styles.restaurantName}>{r.name}</Text>
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

const CARD_W = width * 0.82;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  bg: {
    position: 'absolute',
    width: 874,
    height: 874,
    left: -274,
    top: 0,
    opacity: 0.4,
  },
  scroll: {
    paddingHorizontal: 20,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 4,
  },
  pointsBlock: {
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 26,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  pointsNum: {
    fontSize: 44,
    fontWeight: '800',
    color: Colors.gold,
    lineHeight: 56,
  },
  pointsLabel: {
    fontSize: 18,
    color: Colors.gold,
    letterSpacing: 1,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#757575',
    marginBottom: 10,
  },
  progressBg: {
    height: 14,
    borderRadius: 30,
    backgroundColor: 'rgba(191,153,78,0.35)',
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: 30,
  },
  tiers: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 4,
  },
  tierItem: {
    alignItems: 'center',
    gap: 2,
  },
  tierCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.gold,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierCircleDone: {
    backgroundColor: Colors.gold,
  },
  tierIcon: {
    fontSize: 16,
  },
  tierPts: {
    fontSize: 10,
    color: '#757575',
  },
  tierLabel: {
    fontSize: 9,
    color: '#757575',
    textAlign: 'center',
  },
  voucherScroll: {
    marginHorizontal: -20,
  },
  voucherList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  voucher: {
    width: CARD_W,
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
  voucherBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  voucherOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  voucherTag: {
    color: '#fff',
    fontSize: 14,
    marginTop: 20,
    marginLeft: 20,
  },
  voucherTitle: {
    color: Colors.gold,
    fontSize: 19,
    fontWeight: '700',
    marginLeft: 20,
    marginTop: 4,
    lineHeight: 24,
  },
  voucherValid: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 20,
    marginTop: 16,
  },
  voucherBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginTop: 10,
  },
  voucherBtnText: {
    color: '#fff',
    fontSize: 12,
  },
  restaurants: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  restaurantCard: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  restaurantImg: {
    width: '100%',
    height: 130,
  },
  restaurantFooter: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    alignItems: 'center',
    gap: 4,
  },
  restaurantLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
  },
  restaurantLogoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  restaurantName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: 4,
  },
});
