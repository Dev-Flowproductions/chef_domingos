import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../lib/theme';
import { RESTAURANT_IDS, RESTAURANT_MENUS, type RestaurantId } from '../../lib/menuI18n';
import {
  PromoBenefit,
  buildPromoDescription,
  buildPromoTitle,
  buildStaffInstruction,
  computePromoValues,
} from '../../lib/menuCatalog';
import {
  AdminOffer,
  OfferKind,
  createAdminOffer,
  deactivateAdminOffer,
  listAdminOffers,
} from '../../services/lkm/rewardOffers';
import { POINTS_PER_EURO } from '../../lib/loyaltyRules';
import { hasAdminAccess } from '../../lib/adminAccess';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import {
  itemsForRestaurant,
  localizedName,
  useMenuStore,
} from '../../store/menuStore';

export default function AdminOffersScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith('pt') ? 'pt' : 'en';
  const user = useAuthStore((s) => s.user);
  const profile = useUserStore((s) => s.profile);
  const isAdmin = hasAdminAccess({
    email: user?.email ?? profile?.email,
    isAdminFlag: profile?.is_admin,
    appMetadata: (user as { app_metadata?: Record<string, unknown> } | null)?.app_metadata,
  });
  const { items: menuRows, fetchMenus } = useMenuStore();

  const [offers, setOffers] = useState<AdminOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [kind, setKind] = useState<OfferKind>('promo');
  const [restaurantId, setRestaurantId] = useState<RestaurantId>('pizzaLab');
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>('diavola');
  const [benefit, setBenefit] = useState<PromoBenefit>('free');
  const [euroValue, setEuroValue] = useState('5');
  const [pointsCost, setPointsCost] = useState(String(5 * POINTS_PER_EURO));
  const [daysValid, setDaysValid] = useState('14');

  const menuItems = useMemo(
    () => itemsForRestaurant(menuRows, restaurantId, { forAdminPromo: true }),
    [menuRows, restaurantId],
  );
  const menuByCategory = useMemo(() => {
    const categories = RESTAURANT_MENUS[restaurantId].categories.filter(
      (categoryId) =>
        !(RESTAURANT_MENUS[restaurantId].adminExcludedCategories ?? []).includes(categoryId),
    );
    return categories
      .map((categoryId) => ({
        categoryId,
        items: menuItems.filter((item) => item.category_id === categoryId),
      }))
      .filter((group) => group.items.length > 0);
  }, [restaurantId, menuItems]);

  const selectedItem =
    menuItems.find((i) => i.item_key === selectedItemKey) ?? menuItems[0] ?? null;

  const promoPreview = useMemo(() => {
    if (!selectedItem) return null;
    const values = computePromoValues(selectedItem.price_euros, benefit);
    const itemName = localizedName(selectedItem, locale);
    const restaurantName = t(`menu.restaurants.${restaurantId}`);
    return {
      ...values,
      itemName,
      title: buildPromoTitle(itemName, benefit, locale),
      description: buildPromoDescription(
        itemName,
        restaurantName,
        benefit,
        values.euroValue,
        values.pointsCost,
        locale,
      ),
      staffInstruction: buildStaffInstruction(itemName, benefit, values.euroValue, locale),
    };
  }, [selectedItem, benefit, restaurantId, t, locale]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listAdminOffers();
      setOffers(list);
    } catch (err) {
      Alert.alert(t('common.error'), (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      if (!isAdmin) {
        navigation.goBack();
        return;
      }
      void fetchMenus();
      void load();
    }, [isAdmin, load, navigation, fetchMenus]),
  );

  const handleCreate = async () => {
    if (!isAdmin) {
      Alert.alert(t('common.error'), t('staff.adminRequired'));
      return;
    }

    if (kind === 'promo') {
      if (!selectedItem || !promoPreview) {
        Alert.alert(t('common.error'), t('staff.offerNeedItem'));
        return;
      }
    } else {
      const euros = Number(String(euroValue).replace(',', '.'));
      const points = Number(pointsCost);
      if (!(points > 0) || !(euros > 0)) {
        Alert.alert(t('common.error'), t('staff.offerInvalid'));
        return;
      }
    }

    const days = Math.max(1, Number(daysValid) || 14);
    const startsAt = new Date().toISOString();
    const ends = new Date();
    ends.setDate(ends.getDate() + days);

    setSaving(true);
    try {
      if (kind === 'promo' && selectedItem && promoPreview) {
        await createAdminOffer({
          euroValue: promoPreview.euroValue,
          pointsCost: promoPreview.pointsCost,
          title: promoPreview.title,
          description: promoPreview.description,
          offerKind: 'promo',
          startsAt,
          endsAt: ends.toISOString(),
          restaurantId,
          menuItemKey: selectedItem.item_key,
          promoBenefit: benefit,
          itemPrice: selectedItem.price_euros,
          staffInstruction: promoPreview.staffInstruction,
        });
      } else {
        await createAdminOffer({
          euroValue: Number(String(euroValue).replace(',', '.')),
          pointsCost: Number(pointsCost),
          offerKind: 'money',
        });
      }
      await load();
      Alert.alert(t('common.success'), t('staff.offerCreated'));
    } catch (err) {
      Alert.alert(t('common.error'), (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = (offer: AdminOffer) => {
    Alert.alert(t('staff.deactivateTitle'), t('staff.deactivateBody', { title: offer.title }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('staff.deactivate'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deactivateAdminOffer(offer.id);
            await load();
          } catch (err) {
            Alert.alert(t('common.error'), (err as Error).message);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.gold} />}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t('common.back')}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t('staff.manageOffers')}</Text>
        <Text style={styles.hint}>{t('staff.manageOffersHint')}</Text>

        <View style={styles.kindRow}>
          <TouchableOpacity
            style={[styles.kindBtn, kind === 'promo' && styles.kindBtnActive]}
            onPress={() => setKind('promo')}
          >
            <Text style={[styles.kindText, kind === 'promo' && styles.kindTextActive]}>
              {t('staff.kindPromo')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.kindBtn, kind === 'money' && styles.kindBtnActive]}
            onPress={() => setKind('money')}
          >
            <Text style={[styles.kindText, kind === 'money' && styles.kindTextActive]}>
              {t('staff.kindMoney')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {kind === 'promo' ? (
            <>
              <Text style={styles.label}>{t('staff.pickRestaurant')}</Text>
              <View style={styles.chipRow}>
                {RESTAURANT_IDS.map((id) => (
                  <TouchableOpacity
                    key={id}
                    style={[styles.chip, restaurantId === id && styles.chipActive]}
                    onPress={() => {
                      setRestaurantId(id);
                      const first = itemsForRestaurant(menuRows, id, { forAdminPromo: true })[0];
                      setSelectedItemKey(first?.item_key ?? null);
                    }}
                  >
                    <Text style={[styles.chipText, restaurantId === id && styles.chipTextActive]}>
                      {t(`menu.restaurants.${id}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>{t('staff.pickBenefit')}</Text>
              <View style={styles.chipRow}>
                {(['free', 'off20'] as PromoBenefit[]).map((b) => (
                  <TouchableOpacity
                    key={b}
                    style={[styles.chip, benefit === b && styles.chipActive]}
                    onPress={() => setBenefit(b)}
                  >
                    <Text style={[styles.chipText, benefit === b && styles.chipTextActive]}>
                      {b === 'free' ? t('staff.benefitFree') : t('staff.benefitOff20')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>
                {t('staff.pickMenuItem')} ({menuItems.length})
              </Text>
              <View style={styles.itemList}>
                {menuByCategory.map((group) => (
                  <View key={group.categoryId}>
                    <Text style={styles.categoryHeader}>
                      {t(`menu.${restaurantId}.categories.${group.categoryId}`)}
                    </Text>
                    {group.items.map((item) => {
                      const active = selectedItem?.item_key === item.item_key;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[styles.itemRow, active && styles.itemRowActive]}
                          onPress={() => setSelectedItemKey(item.item_key)}
                        >
                          <Text style={[styles.itemName, active && styles.itemNameActive]}>
                            {localizedName(item, locale)}
                          </Text>
                          <Text style={styles.itemPrice}>{item.price_euros.toFixed(2)}€</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>

              <Text style={styles.label}>{t('staff.daysValid')}</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={daysValid}
                onChangeText={setDaysValid}
                placeholder="14"
                placeholderTextColor="#aaa"
              />

              {promoPreview ? (
                <View style={styles.preview}>
                  <Text style={styles.previewTitle}>{promoPreview.title}</Text>
                  <Text style={styles.previewLine}>
                    {t('staff.previewPos', { amount: promoPreview.euroValue.toFixed(2) })}
                  </Text>
                  <Text style={styles.previewLine}>
                    {t('staff.previewPoints', { count: promoPreview.pointsCost })}
                  </Text>
                  <Text style={styles.previewHint}>{t('staff.previewMath')}</Text>
                </View>
              ) : null}
            </>
          ) : (
            <>
              <Text style={styles.label}>{t('staff.posDiscount')}</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={euroValue}
                onChangeText={(v) => {
                  setEuroValue(v);
                  const euros = Number(String(v).replace(',', '.'));
                  if (euros > 0) setPointsCost(String(Math.round(euros * POINTS_PER_EURO)));
                }}
                placeholder="5"
                placeholderTextColor="#aaa"
              />
              <Text style={styles.label}>{t('staff.pointsCost')}</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={pointsCost}
                onChangeText={setPointsCost}
                placeholder={String(5 * POINTS_PER_EURO)}
                placeholderTextColor="#aaa"
              />
              <Text style={styles.spendNote}>{t('staff.pointsSpendNote')}</Text>
            </>
          )}

          <TouchableOpacity
            style={[styles.createBtn, saving && styles.btnDisabled]}
            onPress={handleCreate}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.createBtnText}>{t('staff.createOffer')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>{t('staff.existingOffers')}</Text>
        {loading && offers.length === 0 ? (
          <ActivityIndicator color={Colors.gold} />
        ) : (
          offers.map((offer) => (
            <View key={offer.id} style={[styles.offerRow, !offer.is_active && styles.offerInactive]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.offerTitle}>{offer.title}</Text>
                <Text style={styles.offerMeta}>
                  {offer.offer_kind === 'promo' ? t('staff.kindPromo') : t('staff.kindMoney')}
                  {' · '}
                  {Number(offer.euro_value) > 0 ? `${offer.euro_value}€ · ` : ''}
                  {offer.points_cost} pts
                  {!offer.is_active ? ` · ${t('staff.inactive')}` : ''}
                </Text>
              </View>
              {offer.is_active && (
                <TouchableOpacity onPress={() => handleDeactivate(offer)}>
                  <Ionicons name="trash-outline" size={22} color="#B00020" />
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 20 },
  back: { color: Colors.gold, fontSize: 16, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  hint: { fontSize: 14, color: '#757575', marginBottom: 16, lineHeight: 20 },
  kindRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  kindBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E8E0D5',
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  kindBtnActive: { borderColor: Colors.gold, backgroundColor: 'rgba(191,153,78,0.12)' },
  kindText: { fontSize: 14, color: Colors.textPrimary },
  kindTextActive: { color: Colors.gold, fontWeight: '700' },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E0D5',
    marginBottom: 28,
    gap: 8,
  },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#e0d8cc',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: '#Faf8f5',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1.5,
    borderColor: '#E8E0D5',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  chipActive: { borderColor: Colors.gold, backgroundColor: 'rgba(191,153,78,0.12)' },
  chipText: { fontSize: 13, color: Colors.textPrimary },
  chipTextActive: { color: Colors.gold, fontWeight: '700' },
  itemList: {
    borderWidth: 1,
    borderColor: '#E8E0D5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#757575',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: '#Faf8f5',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0ebe3',
  },
  itemRowActive: { backgroundColor: 'rgba(191,153,78,0.12)' },
  itemName: { fontSize: 14, color: Colors.textPrimary, flex: 1 },
  itemNameActive: { fontWeight: '700', color: Colors.gold },
  itemPrice: { fontSize: 14, color: '#757575', marginLeft: 8 },
  preview: {
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    gap: 4,
  },
  previewTitle: { color: Colors.gold, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  previewLine: { color: '#fff', fontSize: 14 },
  previewHint: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 6, lineHeight: 16 },
  spendNote: { fontSize: 12, color: '#757575', marginTop: 4, lineHeight: 16 },
  createBtn: {
    marginTop: 12,
    backgroundColor: Colors.gold,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D5',
    gap: 12,
  },
  offerInactive: { opacity: 0.5 },
  offerTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  offerMeta: { fontSize: 13, color: '#757575', marginTop: 2 },
});
