import React, { useState } from 'react';
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

type Filter = 'Todos' | 'Ganhos' | 'Usados';

const HISTORY = [
  { id: '1', restaurant: 'Portuguese Lab', meal: 'Almoço - 15 Mai', pts: 250, gain: true },
  { id: '2', restaurant: 'Portuguese Lab', meal: 'Almoço - 12 Mai', pts: -80, gain: false },
  { id: '3', restaurant: 'Portuguese Lab', meal: 'Almoço - 10 Mai', pts: 100, gain: true },
  { id: '4', restaurant: 'Portuguese Lab', meal: 'Almoço - 8 Mai', pts: 40, gain: true },
  { id: '5', restaurant: 'Pizza Lab', meal: 'Jantar - 5 Mai', pts: -80, gain: false },
  { id: '6', restaurant: 'Pizza Lab', meal: 'Almoço - 2 Mai', pts: 200, gain: true },
];

const TOTAL_POINTS = 250;

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('Todos');

  const filtered = HISTORY.filter((h) => {
    if (filter === 'Ganhos') return h.pts > 0;
    if (filter === 'Usados') return h.pts < 0;
    return true;
  });

  return (
    <View style={styles.root}>
      <Image source={Assets.bgIllustration} style={styles.bg} resizeMode="cover" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]}
      >
        {/* Logo */}
        <View style={styles.logoWrap}>
          <JDLogo size="small" />
        </View>

        {/* Points */}
        <View style={styles.pointsBlock}>
          <Text style={styles.label}>A minha Carteira</Text>
          <Text style={styles.pts}>{TOTAL_POINTS}</Text>
          <Text style={styles.ptsLabel}>PONTOS</Text>
        </View>

        {/* History title */}
        <Text style={styles.histTitle}>Histórico de Pontos</Text>

        {/* Filter pill */}
        <View style={styles.filterWrap}>
          <View style={styles.filterBar}>
            {(['Todos', 'Ganhos', 'Usados'] as Filter[]).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* History list */}
        <View style={styles.list}>
          {filtered.map((entry) => (
            <View key={entry.id} style={styles.entry}>
              <Image source={require('../../assets/restaurant-logo.png')} style={styles.restaurantBadge} resizeMode="contain" />
              <View style={styles.entryInfo}>
                <Text style={styles.entryRestaurant}>{entry.restaurant}</Text>
                <Text style={styles.entryMeal}>{entry.meal}</Text>
              </View>
              <View style={styles.entryPts}>
                <Text
                  style={[
                    styles.entryPtsNum,
                    { color: entry.pts > 0 ? Colors.gold : '#848484' },
                  ]}
                >
                  {entry.pts > 0 ? `+${entry.pts}` : entry.pts}
                </Text>
                <Text style={[styles.entryPtsLabel, { color: entry.pts > 0 ? Colors.gold : '#848484' }]}>
                  PONTOS
                </Text>
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
  pointsBlock: { alignItems: 'center', marginBottom: 20 },
  label: { fontSize: 26, color: Colors.textPrimary },
  pts: { fontSize: 44, fontWeight: '800', color: Colors.gold, lineHeight: 56 },
  ptsLabel: { fontSize: 18, color: Colors.gold, letterSpacing: 1 },
  histTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  filterWrap: { marginBottom: 16 },
  filterBar: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: Colors.gold,
    borderRadius: 30,
    overflow: 'hidden',
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 30,
  },
  filterBtnActive: {
    backgroundColor: Colors.gold,
  },
  filterText: { fontSize: 18, color: Colors.textPrimary },
  filterTextActive: { color: '#fff' },
  list: { gap: 12 },
  entry: {
    backgroundColor: '#fff',
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  restaurantBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#fff',
  },
  entryInfo: { flex: 1 },
  entryRestaurant: { fontSize: 18, color: Colors.textPrimary, fontWeight: '400' },
  entryMeal: { fontSize: 14, color: Colors.textPrimary },
  entryPts: { alignItems: 'center' },
  entryPtsNum: { fontSize: 20, fontWeight: '800' },
  entryPtsLabel: { fontSize: 8, letterSpacing: 0.5 },
});
