import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Assets } from '../../lib/theme';
import JDLogo from '../../components/JDLogo';

const POINTS = 250;

const POINTS_TIERS = [
  { pts: 300, icon: require('../../assets/icon-cafe-rn.png') },
  { pts: 600, icon: require('../../assets/icon-sobremesa-rn.png') },
  { pts: 900, icon: require('../../assets/icon-refeicao-rn.png') },
];

const MAX_PTS = 900;
const CIRCLE_SIZE = 39;
const BAR_H = 14;
const BAR_TOP = (CIRCLE_SIZE - BAR_H) / 2;
const CONTAINER_H = CIRCLE_SIZE + 20; // circle + pts label below

const VOUCHERS = [
  {
    id: '1',
    tag: 'Oferta de Amanhã',
    title: '2ª Pizza com 50%\nde Desconto',
    valid: 'Válido no Pizza Lab',
    pts: '100 Pontos',
    image: require('../../assets/pizza-lab-food.jpg'),
  },
  {
    id: '2',
    tag: 'Oferta Especial',
    title: 'Sobremesa Grátis',
    valid: 'Válido no Portuguese Lab',
    pts: '200 Pontos',
    image: require('../../assets/portuguese-lab-food.jpg'),
  },
  {
    id: '3',
    tag: 'Esta Semana',
    title: 'Café Grátis',
    valid: 'Válido em todos os restaurantes',
    pts: '300 Pontos',
    image: require('../../assets/pizza-lab-food.jpg'),
  },
];

export default function RecompensasScreen() {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);

  const fillWidth = barWidth * Math.min(POINTS / MAX_PTS, 1);

  const onBarLayout = (e: LayoutChangeEvent) => {
    setBarWidth(e.nativeEvent.layout.width);
  };

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

        <View style={styles.titleBlock}>
          <Text style={styles.label}>Recompensas</Text>
        </View>

        {/* ── Ofertas Grátis ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ofertas Grátis!</Text>
          <Text style={styles.sectionSubtitle}>
            Faltam apenas {POINTS_TIERS[0].pts - POINTS} pontos para a sua primeira oferta grátis!
          </Text>

          {/* Bar + circles container */}
          <View style={styles.progressContainer} onLayout={onBarLayout}>
            {/* Track */}
            <View style={styles.progressTrack} />
            {/* Fill */}
            <View style={[styles.progressFill, { width: fillWidth }]} />

            {/* Circles on top of bar */}
            {barWidth > 0 && POINTS_TIERS.map((tier) => {
              const isDone = POINTS >= tier.pts;
              const cx = barWidth * (tier.pts / MAX_PTS) - CIRCLE_SIZE / 2;
              return (
                <View key={tier.pts} style={[styles.tierWrapper, { left: cx }]}>
                  <View style={[styles.tierCircle, isDone && styles.tierCircleDone]}>
                    <Image source={tier.icon} style={styles.tierIcon} />
                  </View>
                  <Text style={styles.tierPts}>{tier.pts} pts</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Ofertas Exclusivas ── */}
        <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Ofertas Exclusivas</Text>
        <View style={styles.list}>
          {VOUCHERS.map((v) => (
            <View key={v.id} style={styles.voucher}>
              <Image source={v.image} style={styles.voucherBg} resizeMode="cover" />
              <View style={styles.overlay} />
              <View style={styles.voucherContent}>
                <Text style={styles.vTag}>{v.tag}</Text>
                <Text style={styles.vTitle}>{v.title}</Text>
                <Text style={styles.vValid}>{v.valid}</Text>
                <TouchableOpacity style={styles.vBtn} activeOpacity={0.85}>
                  <Text style={styles.vBtnText}>{v.pts}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  bg: {
    position: 'absolute',
    width: 874,
    height: 874,
    left: -274,
    top: 0,
    opacity: 0.4,
  },
  scroll: { paddingHorizontal: 20 },
  logoWrap: { alignItems: 'center', marginBottom: 4 },
  titleBlock: { alignItems: 'center', marginBottom: 16 },
  label: { fontSize: 26, color: Colors.textPrimary },
  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#757575',
    marginBottom: 14,
  },
  progressContainer: {
    height: CONTAINER_H,
    position: 'relative',
  },
  progressTrack: {
    position: 'absolute',
    top: BAR_TOP,
    left: 0,
    right: 0,
    height: BAR_H,
    borderRadius: 30,
    backgroundColor: 'rgba(191,153,78,0.5)',
  },
  progressFill: {
    position: 'absolute',
    top: BAR_TOP,
    left: 0,
    height: BAR_H,
    borderRadius: 30,
    backgroundColor: Colors.gold,
  },
  tierWrapper: {
    position: 'absolute',
    top: 0,
    width: CIRCLE_SIZE,
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
  tierCircleDone: {
    backgroundColor: 'rgba(191,153,78,0.15)',
  },
  tierIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  tierPts: {
    fontSize: 10,
    color: '#757575',
    marginTop: 4,
    textAlign: 'center',
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
  voucherBg: { position: 'absolute', width: '100%', height: '100%' },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
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
  vBtnText: { color: '#fff', fontSize: 12 },
});
