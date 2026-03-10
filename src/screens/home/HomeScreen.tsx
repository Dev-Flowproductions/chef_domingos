import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../../navigation';
import { useAuthStore } from '../../store/authStore';
import { useMenu } from '../../hooks/useMenu';
import { useCartStore } from '../../store/cartStore';
import PizzaCard from '../../components/PizzaCard';
import { Pizza } from '../../types';

type Nav = BottomTabNavigationProp<MainTabParamList>;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();
  const { data: pizzas } = useMenu();
  const { addItem, items } = useCartStore();

  const featured = pizzas?.slice(0, 3) ?? [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.hero, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.greeting}>
          Hello, {user?.user_metadata?.name || 'Guest'} 👋
        </Text>
        <Text style={styles.heroTitle}>What pizza{'\n'}are you craving?</Text>

        <TouchableOpacity
          style={styles.orderBtn}
          onPress={() => navigation.navigate('Menu')}
        >
          <Text style={styles.orderBtnText}>Order Now</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Pizzas</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {featured.map((pizza) => (
          <PizzaCard
            key={pizza.id}
            pizza={pizza}
            onPress={() => navigation.navigate('Menu')}
            onAddToCart={(p: Pizza) => addItem(p)}
          />
        ))}
      </View>

      {items.length > 0 && (
        <TouchableOpacity
          style={styles.cartBanner}
          onPress={() => navigation.navigate('Cart')}
        >
          <Text style={styles.cartBannerText}>
            🛒 {items.length} item{items.length > 1 ? 's' : ''} in cart — View Cart
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  hero: {
    backgroundColor: '#E63946',
    paddingHorizontal: 24,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  greeting: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 38,
    marginBottom: 24,
  },
  orderBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignSelf: 'flex-start',
  },
  orderBtnText: {
    color: '#E63946',
    fontSize: 15,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  seeAll: {
    fontSize: 14,
    color: '#E63946',
    fontWeight: '600',
  },
  cartBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#1D3557',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  cartBannerText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
