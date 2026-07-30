import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Colors, Assets } from '../../lib/theme';
import { getRestaurantMenu, type RestaurantId } from '../../lib/menuI18n';
import type { HomeStackParamList } from '../../navigation/types';
import JDLogo from '../../components/JDLogo';
import {
  formatMenuPrice,
  itemsForRestaurant,
  localizedDescription,
  localizedName,
  useMenuStore,
} from '../../store/menuStore';

type MenuRoute = RouteProp<HomeStackParamList, 'Menu'>;

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<MenuRoute>();
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith('pt') ? 'pt' : 'en';

  const restaurantId: RestaurantId = route.params?.restaurantId ?? 'portugueseLab';
  const menuConfig = getRestaurantMenu(restaurantId);
  const { items, loading, fetchMenus } = useMenuStore();

  const [activeCategory, setActiveCategory] = useState(menuConfig.defaultCategory);

  useFocusEffect(
    useCallback(() => {
      void fetchMenus();
    }, [fetchMenus]),
  );

  useEffect(() => {
    setActiveCategory(menuConfig.defaultCategory);
  }, [restaurantId, menuConfig.defaultCategory]);

  const restaurantItems = itemsForRestaurant(items, restaurantId);
  const categoryItems = restaurantItems.filter((i) => i.category_id === activeCategory);

  return (
    <View style={styles.root}>
      <Image source={Assets.bgIllustration} style={styles.bg} resizeMode="cover" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <View style={styles.logoWrap}>
          <JDLogo size="small" />
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.subtitle}>{t('menu.title')}</Text>
          <Text style={styles.title}>{t(`menu.restaurants.${restaurantId}`)}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catList}
          style={styles.catScroll}
        >
          {menuConfig.categories.map((catId) => (
            <TouchableOpacity
              key={catId}
              onPress={() => setActiveCategory(catId)}
              style={styles.catBtn}
            >
              <Text style={[styles.catText, activeCategory === catId && styles.catTextActive]}>
                {t(`menu.${restaurantId}.categories.${catId}`, {
                  defaultValue: catId,
                })}
              </Text>
              {activeCategory === catId && <View style={styles.catUnderline} />}
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionHeading}>
          {t(`menu.${restaurantId}.categories.${activeCategory}`, {
            defaultValue: activeCategory,
          })}
        </Text>

        {loading && restaurantItems.length === 0 ? (
          <ActivityIndicator color={Colors.gold} style={{ marginTop: 24 }} />
        ) : (
          <View style={styles.menuList}>
            {categoryItems.map((item, idx) => {
              const description = localizedDescription(item, locale);
              return (
                <View key={item.id}>
                  <View style={styles.menuRow}>
                    <View style={styles.menuNameBlock}>
                      <Text style={styles.menuName}>{localizedName(item, locale)}</Text>
                      {description ? (
                        <Text style={styles.menuDescription}>{description}</Text>
                      ) : null}
                    </View>
                    <View style={styles.menuDots} />
                    <Text style={styles.menuPrice}>{formatMenuPrice(item.price_euros, locale)}</Text>
                  </View>
                  {idx < categoryItems.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })}
            {categoryItems.length === 0 ? (
              <Text style={styles.empty}>{t('menu.emptyCategory')}</Text>
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

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
  backBtn: { alignSelf: 'flex-start', marginBottom: 4 },
  backText: { fontSize: 24, color: Colors.gold },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 26,
    color: Colors.textPrimary,
  },
  title: {
    fontSize: 34,
    fontWeight: '400',
    color: Colors.gold,
  },
  catScroll: {
    marginHorizontal: -20,
    marginBottom: 8,
  },
  catList: {
    paddingHorizontal: 20,
    gap: 24,
  },
  catBtn: {
    paddingBottom: 6,
    alignItems: 'center',
  },
  catText: {
    fontSize: 18,
    color: Colors.textPrimary,
  },
  catTextActive: {
    color: Colors.textPrimary,
    fontWeight: '400',
  },
  catUnderline: {
    height: 2,
    width: '100%',
    backgroundColor: Colors.gold,
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gold,
    marginTop: 16,
    marginBottom: 12,
  },
  menuList: {
    gap: 0,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  menuNameBlock: {
    flex: 1,
    gap: 4,
  },
  menuName: {
    fontSize: 18,
    color: Colors.textPrimary,
  },
  menuDescription: {
    fontSize: 13,
    color: '#757575',
    lineHeight: 18,
    paddingRight: 8,
  },
  menuDots: {
    width: 24,
    height: 1,
    backgroundColor: '#C8C8C8',
    marginHorizontal: 8,
    marginTop: 14,
  },
  menuPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E8E0D5',
  },
  empty: {
    fontSize: 14,
    color: '#757575',
    marginTop: 8,
  },
});
