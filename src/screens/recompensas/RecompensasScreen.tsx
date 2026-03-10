import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Assets } from '../../lib/theme';
import JDLogo from '../../components/JDLogo';

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
    title: 'Sobremesa Grátis',
    valid: 'Válido no Portuguese Lab',
    pts: '200 Pontos',
    image: 'https://www.figma.com/api/mcp/asset/5c74d365-838a-4db9-b3eb-956c553e5867',
  },
  {
    id: '3',
    tag: 'Esta Semana',
    title: 'Café Grátis',
    valid: 'Válido em todos os restaurantes',
    pts: '300 Pontos',
    image: 'https://www.figma.com/api/mcp/asset/5c74d365-838a-4db9-b3eb-956c553e5867',
  },
];

export default function RecompensasScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <Image source={{ uri: Assets.bgIllustration }} style={styles.bg} resizeMode="cover" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.logoWrap}>
          <JDLogo size="small" />
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.label}>Recompensas</Text>
          <Text style={styles.title}>Ofertas Exclusivas</Text>
        </View>

        <View style={styles.list}>
          {VOUCHERS.map((v) => (
            <View key={v.id} style={styles.voucher}>
              <Image source={{ uri: v.image }} style={styles.voucherBg} resizeMode="cover" />
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
  titleBlock: { alignItems: 'center', marginBottom: 20 },
  label: { fontSize: 26, color: Colors.textPrimary },
  title: { fontSize: 34, fontWeight: '400', color: Colors.gold },
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
  voucherBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  voucherContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
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
