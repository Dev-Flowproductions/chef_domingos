import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useQueryClient } from '@tanstack/react-query';
import { MainTabParamList } from '../../navigation';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { createOrder } from '../../services/api/orders';
import CartItemComponent from '../../components/CartItem';
import Button from '../../components/Button';
import Header from '../../components/Header';

type Nav = BottomTabNavigationProp<MainTabParamList>;

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const { items, updateQuantity, removeItem, clearCart, getTotal } = useCartStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async () => {
    if (!user) return;
    if (items.length === 0) return;

    setLoading(true);
    try {
      await createOrder(
        user.id,
        { items: items.map((i) => ({ pizza_id: i.pizza.id, quantity: i.quantity })) },
        getTotal()
      );
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      Alert.alert('Order placed!', 'Your order has been received.', [
        { text: 'View Orders', onPress: () => navigation.navigate('Orders') },
        { text: 'OK' },
      ]);
    } catch (err) {
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Header title="Cart" />
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add some pizzas to get started</Text>
          <Button
            title="Browse Menu"
            onPress={() => navigation.navigate('Menu')}
            style={styles.browseBtn}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="Cart"
        rightElement={
          <TouchableOpacity onPress={clearCart}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        }
      />
      <FlatList
        data={items}
        keyExtractor={(item) => item.pizza.id}
        renderItem={({ item }) => (
          <CartItemComponent
            item={item}
            onUpdateQuantity={updateQuantity}
            onRemove={removeItem}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>€{getTotal().toFixed(2)}</Text>
        </View>
        <Button
          title="Place Order"
          onPress={handlePlaceOrder}
          loading={loading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  browseBtn: {
    paddingHorizontal: 32,
  },
  clearText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#374151',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#E63946',
  },
});
