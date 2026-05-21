import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Colors, Assets } from '../../lib/theme';
import { getRestaurantMenu, type RestaurantId } from '../../lib/menuI18n';
import type { HomeStackParamList } from '../../navigation/types';
import JDLogo from '../../components/JDLogo';

type MenuRoute = RouteProp<HomeStackParamList, 'Menu'>;

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<MenuRoute>();
  const { t } = useTranslation();

  const restaurantId: RestaurantId = route.params?.restaurantId ?? 'portugueseLab';
  const menuConfig = getRestaurantMenu(restaurantId);

  const [activeCategory, setActiveCategory] = useState(menuConfig.defaultCategory);

  useEffect(() => {
    setActiveCategory(menuConfig.defaultCategory);
  }, [restaurantId, menuConfig.defaultCategory]);

  const itemIds = menuConfig.items[activeCategory] ?? [];

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
                {t(`menu.${restaurantId}.categories.${catId}`)}
              </Text>
              {activeCategory === catId && <View style={styles.catUnderline} />}
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionHeading}>
          {t(`menu.${restaurantId}.categories.${activeCategory}`)}
        </Text>

        <View style={styles.menuList}>
          {itemIds.map((itemId, idx) => (
            <View key={itemId}>
              <View style={styles.menuRow}>
                <Text style={styles.menuName}>
                  {t(`menu.${restaurantId}.items.${itemId}.name`)}
                </Text>
                <View style={styles.menuDots} />
                <Text style={styles.menuPrice}>
                  {t(`menu.${restaurantId}.items.${itemId}.price`)}
                </Text>
              </View>
              {idx < itemIds.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
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
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuName: {
    fontSize: 18,
    color: Colors.textPrimary,
    flex: 1,
  },
  menuDots: {
    flex: 0.5,
    height: 1,
    backgroundColor: '#C8C8C8',
    marginHorizontal: 8,
  },
  menuPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: '#E8E0D5',
  },
});
