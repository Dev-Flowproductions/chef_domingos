import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Switch,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../lib/theme';
import { PageBackground } from '../../components/ScreenWrapper';
import {
  POS_DISCOUNT_CATALOG,
  POS_DISCOUNT_KINDS,
  defaultDiscountHidden,
  discountsOfKind,
  isDiscountVisibleToCustomers,
  type PosDiscount,
  type PosDiscountKind,
  type PosDiscountVisibility,
} from '../../lib/posDiscountCatalog';
import {
  listDiscountVisibility,
  setDiscountVisibility,
  type DiscountVisibilityRow,
} from '../../services/lkm/rewardOffers';
import { hasAdminAccess } from '../../lib/adminAccess';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';

function kindLabelKey(kind: PosDiscountKind): 'staff.catalogMoney' | 'staff.catalogPercent' | 'staff.catalogArticle' {
  switch (kind) {
    case 'money':
      return 'staff.catalogMoney';
    case 'percent':
      return 'staff.catalogPercent';
    case 'article':
      return 'staff.catalogArticle';
    default: {
      const unexpected: never = kind;
      return unexpected;
    }
  }
}

function visibilityFor(
  discount: PosDiscount,
  saved: Map<string, DiscountVisibilityRow>,
): PosDiscountVisibility {
  const row = saved.get(discount.id);
  return {
    hidden: row?.hidden ?? defaultDiscountHidden(discount.kind),
    visibleFrom: row?.visibleFrom ?? null,
  };
}

export default function AdminOffersScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const profile = useUserStore((s) => s.profile);
  const isAdmin = hasAdminAccess({
    email: user?.email ?? profile?.email,
    isAdminFlag: profile?.is_admin,
    appMetadata: (user as { app_metadata?: Record<string, unknown> } | null)?.app_metadata,
  });

  const [saved, setSaved] = useState<Map<string, DiscountVisibilityRow>>(new Map());
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const applyRows = useCallback((rows: DiscountVisibilityRow[]) => {
    setSaved(new Map(rows.map((row) => [row.catalogId, row])));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      applyRows(await listDiscountVisibility());
    } catch (err) {
      Alert.alert(t('common.error'), (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [applyRows, t]);

  useFocusEffect(
    useCallback(() => {
      if (!isAdmin) {
        navigation.goBack();
        return;
      }
      void load();
    }, [isAdmin, load, navigation]),
  );

  const persist = async (discount: PosDiscount, hidden: boolean) => {
    setSavingId(discount.id);
    try {
      const row = await setDiscountVisibility(discount.id, hidden, null);
      setSaved((current) => {
        const next = new Map(current);
        next.set(discount.id, row);
        return next;
      });
    } catch (err) {
      Alert.alert(t('common.error'), (err as Error).message);
    } finally {
      setSavingId(null);
    }
  };

  const shareCatalog = () => {
    const lines = [
      t('staff.posListHeader'),
      '',
      ...POS_DISCOUNT_CATALOG.map((discount) => {
        const name = t(`staff.catalogItems.${discount.id}`);
        const visibility = visibilityFor(discount, saved);
        const shown = isDiscountVisibleToCustomers(discount, visibility);
        const points = discount.pointsCost != null ? ` — ${discount.pointsCost} pts` : '';
        const code = discount.lkmCode != null ? ` — LKM ${discount.lkmCode}` : '';
        return `• ${name}${points}${code} — ${shown ? t('staff.visibleNow') : t('staff.hiddenFromCustomers')}`;
      }),
      '',
      t('staff.posListFooter'),
    ];
    void Share.share({ message: lines.join('\n') });
  };

  return (
    <View style={styles.root}>
      <PageBackground />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.gold} />}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t('common.back')}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t('staff.manageOffers')}</Text>
        <Text style={styles.hint}>{t('staff.manageOffersHint')}</Text>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>{t('staff.catalogTitle')}</Text>
          <TouchableOpacity onPress={shareCatalog}>
            <Text style={styles.shareLink}>{t('staff.sharePosList')}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.posNote}>{t('staff.posListNote')}</Text>

        {POS_DISCOUNT_KINDS.map((kind) => {
          const items = discountsOfKind(kind);
          return (
            <View key={kind} style={styles.group}>
              <Text style={styles.groupTitle}>{t(kindLabelKey(kind))}</Text>
              {items.map((discount) => {
                const visibility = visibilityFor(discount, saved);
                const shown = isDiscountVisibleToCustomers(discount, visibility);
                const busy = savingId === discount.id;
                const status = shown ? t('staff.visibleNow') : t('staff.hiddenFromCustomers');
                return (
                  <View key={discount.id} style={styles.card}>
                    <View style={styles.cardHead}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.offerTitle}>{t(`staff.catalogItems.${discount.id}`)}</Text>
                        <Text style={styles.offerMeta}>
                          {discount.pointsCost != null ? `${discount.pointsCost} pts` : ''}
                          {discount.lkmCode != null ? ` · LKM ${discount.lkmCode}` : ''}
                        </Text>
                        <Text style={[styles.status, shown ? styles.statusOn : styles.statusOff]}>{status}</Text>
                      </View>
                      {busy ? <ActivityIndicator color={Colors.gold} /> : null}
                    </View>
                    <View style={styles.switchRow}>
                      <Text style={styles.switchLabel}>{t('staff.visibleToCustomers')}</Text>
                      <Switch
                        value={!visibility.hidden}
                        disabled={busy || loading}
                        onValueChange={(visible) => {
                          void persist(discount, !visible);
                        }}
                        trackColor={{ false: '#d8d0c4', true: Colors.goldLight }}
                        thumbColor={!visibility.hidden ? Colors.gold : '#f4f3f4'}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background, overflow: 'hidden' },
  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: 20, flexGrow: 1, width: '100%', maxWidth: 800, alignSelf: 'center' },
  back: { color: Colors.gold, fontSize: 16, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  hint: { fontSize: 14, color: '#757575', marginBottom: 16, lineHeight: 20 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  shareLink: { color: Colors.gold, fontSize: 13, fontWeight: '700' },
  posNote: { fontSize: 12, color: '#757575', lineHeight: 18, marginBottom: 12 },
  group: { marginBottom: 8 },
  groupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#757575',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 12,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E0D5',
    padding: 14,
    marginBottom: 10,
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  offerTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  offerMeta: { fontSize: 13, color: '#757575', marginTop: 2 },
  status: { fontSize: 13, fontWeight: '700', marginTop: 6 },
  statusOn: { color: Colors.gold },
  statusOff: { color: '#757575' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 12,
  },
  switchLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
});
