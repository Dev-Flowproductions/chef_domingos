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
  TextInput,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../lib/theme';
import {
  POS_DISCOUNT_CATALOG,
  POS_DISCOUNT_KINDS,
  defaultDiscountHidden,
  discountsOfKind,
  isDiscountVisibleToCustomers,
  lisbonDateISO,
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

function formatPtDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  if (!year || !month || !day) return '';
  return `${day}/${month}/${year}`;
}

function parsePtDate(text: string): string | null {
  const match = text.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function maskDate(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
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
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const today = lisbonDateISO();

  const applyRows = useCallback((rows: DiscountVisibilityRow[]) => {
    const next = new Map(rows.map((row) => [row.catalogId, row]));
    setSaved(next);
    const nextDrafts: Record<string, string> = {};
    for (const discount of POS_DISCOUNT_CATALOG) {
      const from = next.get(discount.id)?.visibleFrom;
      nextDrafts[discount.id] = from ? formatPtDate(from) : '';
    }
    setDrafts(nextDrafts);
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

  const persist = async (discount: PosDiscount, hidden: boolean, visibleFrom: string | null) => {
    setSavingId(discount.id);
    try {
      const row = await setDiscountVisibility(discount.id, hidden, visibleFrom);
      setSaved((current) => {
        const next = new Map(current);
        next.set(discount.id, row);
        return next;
      });
      setDrafts((current) => ({
        ...current,
        [discount.id]: row.visibleFrom ? formatPtDate(row.visibleFrom) : '',
      }));
    } catch (err) {
      Alert.alert(t('common.error'), (err as Error).message);
      const previous = saved.get(discount.id)?.visibleFrom;
      setDrafts((current) => ({
        ...current,
        [discount.id]: previous ? formatPtDate(previous) : '',
      }));
    } finally {
      setSavingId(null);
    }
  };

  const saveDate = (discount: PosDiscount) => {
    const text = (drafts[discount.id] ?? '').trim();
    const current = visibilityFor(discount, saved);
    if (text === '') {
      if (current.visibleFrom != null) void persist(discount, current.hidden, null);
      return;
    }
    const parsed = parsePtDate(text);
    if (!parsed) {
      Alert.alert(t('common.error'), t('staff.visibleFromInvalid'));
      setDrafts((rows) => ({
        ...rows,
        [discount.id]: current.visibleFrom ? formatPtDate(current.visibleFrom) : '',
      }));
      return;
    }
    if (parsed !== current.visibleFrom) void persist(discount, current.hidden, parsed);
  };

  const shareCatalog = () => {
    const lines = [
      t('staff.posListHeader'),
      '',
      ...POS_DISCOUNT_CATALOG.map((discount) => {
        const name = t(`staff.catalogItems.${discount.id}`);
        const visibility = visibilityFor(discount, saved);
        const shown = isDiscountVisibleToCustomers(discount, visibility, today);
        const points = discount.pointsCost != null ? ` — ${discount.pointsCost} pts` : '';
        const code = discount.lkmCode != null ? ` — LKM ${discount.lkmCode}` : '';
        const when = visibility.visibleFrom ? ` — ${formatPtDate(visibility.visibleFrom)}` : '';
        return `• ${name}${points}${code}${when} — ${shown ? t('staff.visibleNow') : t('staff.hiddenFromCustomers')}`;
      }),
      '',
      t('staff.posListFooter'),
    ];
    void Share.share({ message: lines.join('\n') });
  };

  return (
    <View style={styles.root}>
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
                const shown = isDiscountVisibleToCustomers(discount, visibility, today);
                const busy = savingId === discount.id;
                const status = visibility.hidden
                  ? t('staff.hiddenFromCustomers')
                  : visibility.visibleFrom && visibility.visibleFrom > today
                    ? t('staff.visibleFromDate', { date: formatPtDate(visibility.visibleFrom) })
                    : t('staff.visibleNow');
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
                          void persist(discount, !visible, visibility.visibleFrom);
                        }}
                        trackColor={{ false: '#d8d0c4', true: Colors.goldLight }}
                        thumbColor={!visibility.hidden ? Colors.gold : '#f4f3f4'}
                      />
                    </View>
                    <Text style={styles.dateLabel}>{t('staff.visibleFromLabel')}</Text>
                    <View style={styles.dateRow}>
                      <TextInput
                        style={styles.dateInput}
                        value={drafts[discount.id] ?? ''}
                        onChangeText={(text) => {
                          setDrafts((rows) => ({ ...rows, [discount.id]: maskDate(text) }));
                        }}
                        onEndEditing={() => saveDate(discount)}
                        placeholder={t('staff.visibleFromPlaceholder')}
                        placeholderTextColor="#aaa"
                        keyboardType="number-pad"
                        maxLength={10}
                        editable={!busy && !loading}
                      />
                      {(drafts[discount.id] ?? '') !== '' ? (
                        <TouchableOpacity
                          onPress={() => {
                            setDrafts((rows) => ({ ...rows, [discount.id]: '' }));
                            if (visibility.visibleFrom != null) void persist(discount, visibility.hidden, null);
                          }}
                          disabled={busy || loading}
                        >
                          <Text style={styles.clearDate}>{t('staff.clearDate')}</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <Text style={styles.dateHint}>{t('staff.visibleFromHint')}</Text>
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
  root: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: 20, flexGrow: 1 },
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
  dateLabel: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginTop: 8 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E8E0D5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: '#fff',
  },
  clearDate: { color: Colors.gold, fontSize: 13, fontWeight: '700' },
  dateHint: { fontSize: 12, color: '#757575', lineHeight: 17, marginTop: 6 },
});
