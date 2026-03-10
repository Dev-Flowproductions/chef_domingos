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

const CATEGORIES = ['Menus', 'Principais', 'Vegetariano', 'Sobremesa'];

const MENU_ITEMS: Record<string, { name: string; price: string }[]> = {
  Menus: [
    { name: 'Menu do Dia', price: '9,90€' },
    { name: 'Menu Executive', price: '14,90€' },
    { name: 'Menu Família', price: '32,00€' },
  ],
  Principais: [
    { name: 'Medalhões de novilho', price: '12,90€' },
    { name: 'Escalopes de frango', price: '11,90€' },
    { name: 'Bifinho de frango grelhados', price: '12,50€' },
    { name: 'Bacalhau à Brás', price: '14,50€' },
    { name: 'Salmão grelhado', price: '13,90€' },
  ],
  Vegetariano: [
    { name: 'Risotto de cogumelos', price: '11,50€' },
    { name: 'Lasanha de legumes', price: '10,90€' },
    { name: 'Salada Caesar', price: '9,50€' },
  ],
  Sobremesa: [
    { name: 'Pastel de nata', price: '1,50€' },
    { name: 'Mousse de chocolate', price: '4,90€' },
    { name: 'Pudim flan', price: '4,50€' },
    { name: 'Tarte de maçã', price: '5,00€' },
  ],
};

const RESTAURANTS = ['Portuguese Lab', 'Pizza Lab'];

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState('Principais');
  const [activeRestaurant, setActiveRestaurant] = useState('Portuguese Lab');

  const items = MENU_ITEMS[activeCategory] ?? [];

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

        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.subtitle}>Menu</Text>
          <Text style={styles.title}>{activeRestaurant}</Text>
        </View>

        {/* Category tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catList}
          style={styles.catScroll}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={styles.catBtn}
            >
              <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>
                {cat}
              </Text>
              {activeCategory === cat && <View style={styles.catUnderline} />}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Section heading */}
        <Text style={styles.sectionHeading}>{activeCategory}</Text>

        {/* Menu items */}
        <View style={styles.menuList}>
          {items.map((item, idx) => (
            <View key={idx}>
              <View style={styles.menuRow}>
                <Text style={styles.menuName}>{item.name}</Text>
                <View style={styles.menuDots} />
                <Text style={styles.menuPrice}>{item.price}</Text>
              </View>
              {idx < items.length - 1 && <View style={styles.divider} />}
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
