import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Colors, Assets } from '../../lib/theme';
import { usePointsStore } from '../../store/pointsStore';
import { useAuthStore } from '../../store/authStore';
import { useLocaleStore, localeTag } from '../../store/localeStore';
import { getTransactions, AppTransaction, TxFilter } from '../../services/lkm/transactions';
import JDLogo from '../../components/JDLogo';

type FilterKey = 'all' | 'earned' | 'used';

const FILTER_MAP: Record<FilterKey, TxFilter> = {
  all: 'todos',
  earned: 'ganhos',
  used: 'usados',
};

const FILTER_I18N: Record<FilterKey, string> = {
  all: 'wallet.filterAll',
  earned: 'wallet.filterEarned',
  used: 'wallet.filterUsed',
};

function formatDate(iso: string, tag: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(tag, { day: '2-digit', month: 'short' });
  } catch {
    return iso;
  }
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const dateTag = localeTag(locale);

  const { balance, loading: ptsLoading, fetch: fetchPoints } = usePointsStore();
  const { user } = useAuthStore();

  const [filter, setFilter] = useState<FilterKey>('all');
  const [transactions, setTransactions] = useState<AppTransaction[]>([]);
  const [txLoading, setTxLoading]     = useState(false);
  const [refreshing, setRefreshing]   = useState(false);

  const loadTransactions = useCallback(async (f: FilterKey) => {
    setTxLoading(true);
    try {
      const res = await getTransactions(FILTER_MAP[f]);
      setTransactions(res.transactions);
    } catch (err) {
      console.warn('[WalletScreen] failed to load transactions', err);
    } finally {
      setTxLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    fetchPoints();
    loadTransactions(filter);
  }, [user?.id]);

  const onFilterChange = (f: FilterKey) => {
    setFilter(f);
    loadTransactions(f);
  };

  const onRefresh = async () => {
    if (!user?.id) return;
    setRefreshing(true);
    await Promise.all([fetchPoints(), loadTransactions(filter)]);
    setRefreshing(false);
  };

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

        {/* Points */}
        <View style={styles.pointsBlock}>
          <Text style={styles.label}>{t('wallet.title')}</Text>
          {ptsLoading ? (
            <ActivityIndicator color={Colors.gold} style={{ marginVertical: 8 }} />
          ) : (
            <>
              <Text style={styles.pts}>{Number.isFinite(balance) ? balance : 0}</Text>
              <Text style={styles.ptsLabel}>PONTOS</Text>
            </>
          )}
        </View>

        <Text style={styles.histTitle}>{t('wallet.history')}</Text>

        {/* Filter pill */}
        <View style={styles.filterWrap}>
          <View style={styles.filterBar}>
            {(['all', 'earned', 'used'] as FilterKey[]).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
                onPress={() => onFilterChange(f)}
              >
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                  {t(FILTER_I18N[f])}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* History list */}
        {txLoading ? (
          <ActivityIndicator color={Colors.gold} style={{ marginTop: 32 }} />
        ) : (
          <View style={styles.list}>
            {transactions.length === 0 ? (
              <Text style={styles.empty}>{t('wallet.empty')}</Text>
            ) : (
              transactions.map((entry) => (
                <View key={entry.id} style={styles.entry}>
                  <Image
                    source={require('../../assets/restaurant-logo.png')}
                    style={styles.restaurantBadge}
                    resizeMode="contain"
                  />
                  <View style={styles.entryInfo}>
                    <Text style={styles.entryRestaurant}>{entry.restaurant}</Text>
                    <Text style={styles.entryMeal}>{entry.description} · {formatDate(entry.date, dateTag)}</Text>
                  </View>
                  <View style={styles.entryPts}>
                    <Text style={[styles.entryPtsNum, { color: entry.points > 0 ? Colors.gold : '#848484' }]}>
                      {entry.points > 0 ? `+${entry.points}` : entry.points}
                    </Text>
                    <Text style={[styles.entryPtsLabel, { color: entry.points > 0 ? Colors.gold : '#848484' }]}>
                      {t('common.points')}
                    </Text>
                  </View>
                </View>
              ))
            )}
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
  pointsBlock: { alignItems: 'center', marginBottom: 20 },
  label: { fontSize: 26, color: Colors.textPrimary },
  pts: { fontSize: 44, fontWeight: '800', color: Colors.gold, lineHeight: 56 },
  ptsLabel: { fontSize: 18, color: Colors.gold, letterSpacing: 1 },
  histTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  filterWrap: { marginBottom: 16 },
  filterBar: { flexDirection: 'row', borderWidth: 2, borderColor: Colors.gold, borderRadius: 30, overflow: 'hidden' },
  filterBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 30 },
  filterBtnActive: { backgroundColor: Colors.gold },
  filterText: { fontSize: 18, color: Colors.textPrimary },
  filterTextActive: { color: '#fff' },
  list: { gap: 12 },
  empty: { textAlign: 'center', color: Colors.textPrimary, marginTop: 32, fontSize: 15 },
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
  restaurantBadge: { width: 48, height: 48, borderRadius: 24, marginRight: 12, backgroundColor: '#fff' },
  entryInfo: { flex: 1 },
  entryRestaurant: { fontSize: 18, color: Colors.textPrimary, fontWeight: '400' },
  entryMeal: { fontSize: 14, color: Colors.textPrimary },
  entryPts: { alignItems: 'center' },
  entryPtsNum: { fontSize: 20, fontWeight: '800' },
  entryPtsLabel: { fontSize: 8, letterSpacing: 0.5 },
});
