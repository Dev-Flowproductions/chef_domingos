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
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../lib/theme';
import { RESTAURANT_IDS, RESTAURANT_MENUS, type RestaurantId } from '../../lib/menuI18n';
import { hasAdminAccess } from '../../lib/adminAccess';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import {
  formatMenuPrice,
  itemsForRestaurant,
  localizedDescription,
  localizedName,
  useMenuStore,
} from '../../store/menuStore';

export default function AdminMenuScreen() {
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

  const { items, loading, fetchMenus, createItem, updateItem, setItemVisibleToCustomers } =
    useMenuStore();
  const [restaurantId, setRestaurantId] = useState<RestaurantId>('portugueseLab');
  const [categoryId, setCategoryId] = useState(RESTAURANT_MENUS.portugueseLab.defaultCategory);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newVisible, setNewVisible] = useState(true);
  const [saving, setSaving] = useState(false);

  const categories = RESTAURANT_MENUS[restaurantId].categories;

  useFocusEffect(
    useCallback(() => {
      if (!isAdmin) {
        navigation.goBack();
        return;
      }
      void fetchMenus({ includeInactive: true });
    }, [isAdmin, fetchMenus, navigation]),
  );

  const categoryItems = useMemo(
    () =>
      itemsForRestaurant(items, restaurantId, { includeInactive: true }).filter(
        (i) => i.category_id === categoryId,
      ),
    [items, restaurantId, categoryId],
  );

  const startEdit = (id: string, name: string, price: number, description: string) => {
    setEditingId(id);
    setEditName(name);
    setEditPrice(String(price).replace('.', ','));
    setEditDescription(description);
    setAdding(false);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const price = Number(String(editPrice).replace(',', '.'));
    if (!(price >= 0) || !editName.trim()) {
      Alert.alert(t('common.error'), t('staff.menuInvalid'));
      return;
    }
    setSaving(true);
    const desc = editDescription.trim() || null;
    const updates =
      locale === 'pt'
        ? { name_pt: editName.trim(), description_pt: desc, price_euros: price }
        : { name_en: editName.trim(), description_en: desc, price_euros: price };
    const { error } = await updateItem(editingId, updates);
    setSaving(false);
    if (error) {
      Alert.alert(t('common.error'), error.message);
      return;
    }
    setEditingId(null);
  };

  const handleAdd = async () => {
    const price = Number(String(newPrice).replace(',', '.'));
    if (!(price >= 0) || !newName.trim()) {
      Alert.alert(t('common.error'), t('staff.menuInvalid'));
      return;
    }
    setSaving(true);
    const { error } = await createItem({
      restaurantId,
      categoryId,
      namePt: newName.trim(),
      nameEn: newName.trim(),
      descriptionPt: newDescription.trim() || undefined,
      descriptionEn: newDescription.trim() || undefined,
      priceEuros: price,
      visibleToCustomers: newVisible,
    });
    setSaving(false);
    if (error) {
      Alert.alert(t('common.error'), error.message);
      return;
    }
    setNewName('');
    setNewPrice('');
    setNewDescription('');
    setNewVisible(true);
    setAdding(false);
  };

  const toggleVisibility = (id: string, name: string, currentlyVisible: boolean) => {
    Alert.alert(
      currentlyVisible ? t('staff.menuHideTitle') : t('staff.menuShowTitle'),
      currentlyVisible ? t('staff.menuHideBody', { name }) : t('staff.menuShowBody', { name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: currentlyVisible ? t('staff.menuHide') : t('staff.menuShow'),
          onPress: async () => {
            const { error } = await setItemVisibleToCustomers(id, !currentlyVisible);
            if (error) Alert.alert(t('common.error'), error.message);
          },
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <ScrollView
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => fetchMenus({ includeInactive: true })}
            tintColor={Colors.gold}
          />
        }
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t('common.back')}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t('staff.manageMenu')}</Text>
        <Text style={styles.hint}>{t('staff.manageMenuHint')}</Text>

        <Text style={styles.label}>{t('staff.pickRestaurant')}</Text>
        <View style={styles.chipRow}>
          {RESTAURANT_IDS.map((id) => (
            <TouchableOpacity
              key={id}
              style={[styles.chip, restaurantId === id && styles.chipActive]}
              onPress={() => {
                setRestaurantId(id);
                setCategoryId(RESTAURANT_MENUS[id].defaultCategory);
                setEditingId(null);
                setAdding(false);
              }}
            >
              <Text style={[styles.chipText, restaurantId === id && styles.chipTextActive]}>
                {t(`menu.restaurants.${id}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t('staff.pickCategory')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={styles.chipRow}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, categoryId === cat && styles.chipActive]}
                onPress={() => {
                  setCategoryId(cat);
                  setEditingId(null);
                  setAdding(false);
                }}
              >
                <Text style={[styles.chipText, categoryId === cat && styles.chipTextActive]}>
                  {t(`menu.${restaurantId}.categories.${cat}`, { defaultValue: cat })}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {categoryItems.map((item) => {
          const name = localizedName(item, locale);
          const description = localizedDescription(item, locale) ?? '';
          const isEditing = editingId === item.id;
          const hidden = !item.is_active;
          return (
            <View key={item.id} style={[styles.itemCard, hidden && styles.itemCardHidden]}>
              {isEditing ? (
                <>
                  <TextInput
                    style={styles.input}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder={t('staff.menuNewName')}
                    placeholderTextColor="#aaa"
                  />
                  <TextInput
                    style={[styles.input, styles.inputMultiline]}
                    value={editDescription}
                    onChangeText={setEditDescription}
                    placeholder={t('staff.menuDescriptionPlaceholder')}
                    placeholderTextColor="#aaa"
                    multiline
                  />
                  <TextInput
                    style={styles.input}
                    value={editPrice}
                    onChangeText={setEditPrice}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#aaa"
                  />
                  <View style={styles.rowActions}>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => setEditingId(null)}>
                      <Text style={styles.secondaryBtnText}>{t('common.cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.primaryBtn, saving && styles.disabled]}
                      onPress={saveEdit}
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.primaryBtnText}>{t('common.save')}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.nameRow}>
                        <Text style={[styles.itemName, hidden && styles.itemNameHidden]}>{name}</Text>
                        <View style={[styles.badge, hidden ? styles.badgeHidden : styles.badgeLive]}>
                          <Ionicons
                            name={hidden ? 'eye-off' : 'eye'}
                            size={12}
                            color={hidden ? '#8a5a00' : '#3d6b3d'}
                          />
                          <Text style={[styles.badgeText, hidden ? styles.badgeTextHidden : styles.badgeTextLive]}>
                            {hidden ? t('staff.menuHiddenBadge') : t('staff.menuLiveBadge')}
                          </Text>
                        </View>
                      </View>
                      {description ? (
                        <Text style={styles.itemDesc} numberOfLines={2}>
                          {description}
                        </Text>
                      ) : (
                        <Text style={styles.itemDescMuted}>{t('staff.menuNoDescription')}</Text>
                      )}
                      <Text style={styles.itemPrice}>{formatMenuPrice(item.price_euros, locale)}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => startEdit(item.id, name, item.price_euros, description)}
                      style={styles.iconBtn}
                    >
                      <Ionicons name="pencil-outline" size={20} color={Colors.gold} />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={[styles.visibilityBtn, hidden && styles.visibilityBtnShow]}
                    onPress={() => toggleVisibility(item.id, name, item.is_active)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={hidden ? 'eye-outline' : 'eye-off-outline'}
                      size={18}
                      color={hidden ? Colors.gold : '#7a4a12'}
                    />
                    <Text style={[styles.visibilityText, hidden && styles.visibilityTextShow]}>
                      {hidden ? t('staff.menuShowOnApp') : t('staff.menuHideFromApp')}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          );
        })}

        {adding ? (
          <View style={styles.itemCard}>
            <Text style={styles.label}>{t('staff.menuNewName')}</Text>
            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholderTextColor="#aaa"
            />
            <Text style={styles.label}>{t('staff.menuDescription')}</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={newDescription}
              onChangeText={setNewDescription}
              placeholder={t('staff.menuDescriptionPlaceholder')}
              placeholderTextColor="#aaa"
              multiline
            />
            <Text style={styles.label}>{t('staff.menuNewPrice')}</Text>
            <TextInput
              style={styles.input}
              value={newPrice}
              onChangeText={setNewPrice}
              keyboardType="decimal-pad"
              placeholder="0,00"
              placeholderTextColor="#aaa"
            />
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>{t('staff.menuVisibleToCustomers')}</Text>
                <Text style={styles.switchHint}>{t('staff.menuVisibleHint')}</Text>
              </View>
              <Switch
                value={newVisible}
                onValueChange={setNewVisible}
                trackColor={{ false: '#d8d0c4', true: Colors.goldLight }}
                thumbColor={newVisible ? Colors.gold : '#f4f3f4'}
              />
            </View>
            <View style={styles.rowActions}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setAdding(false)}>
                <Text style={styles.secondaryBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, saving && styles.disabled]}
                onPress={handleAdd}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>{t('staff.menuAdd')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.addBtn} onPress={() => setAdding(true)}>
            <Ionicons name="add-circle-outline" size={22} color={Colors.gold} />
            <Text style={styles.addBtnText}>{t('staff.menuAdd')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 20, flexGrow: 1 },
  back: { color: Colors.gold, fontSize: 16, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  hint: { fontSize: 14, color: '#757575', marginBottom: 16, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
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
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E0D5',
    padding: 14,
    marginBottom: 10,
    gap: 8,
  },
  itemCardHidden: {
    backgroundColor: '#F7F1E6',
    borderColor: '#E4D3B0',
    borderStyle: 'dashed',
  },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  itemName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, flexShrink: 1 },
  itemNameHidden: { color: '#8a5a00' },
  itemDesc: { fontSize: 13, color: '#757575', marginTop: 4, lineHeight: 18 },
  itemDescMuted: { fontSize: 12, color: '#aaa', marginTop: 4, fontStyle: 'italic' },
  itemPrice: { fontSize: 14, color: '#757575', marginTop: 4 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeLive: { backgroundColor: '#e8f4e8' },
  badgeHidden: { backgroundColor: '#f5e6c8' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeTextLive: { color: '#3d6b3d' },
  badgeTextHidden: { color: '#8a5a00' },
  iconBtn: { padding: 8 },
  visibilityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F5EFE4',
    borderWidth: 1,
    borderColor: '#E4D3B0',
  },
  visibilityBtnShow: {
    backgroundColor: 'rgba(191,153,78,0.12)',
    borderColor: Colors.gold,
  },
  visibilityText: { fontSize: 13, fontWeight: '700', color: '#7a4a12' },
  visibilityTextShow: { color: Colors.gold },
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
  inputMultiline: { minHeight: 72, textAlignVertical: 'top' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  switchLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  switchHint: { fontSize: 12, color: '#757575', marginTop: 2, lineHeight: 16 },
  rowActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  primaryBtn: {
    flex: 1,
    backgroundColor: Colors.gold,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { color: Colors.gold, fontWeight: '600', fontSize: 15 },
  disabled: { opacity: 0.6 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderRadius: 24,
    borderStyle: 'dashed',
  },
  addBtnText: { color: Colors.gold, fontSize: 16, fontWeight: '600' },
});
