import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { CartItem as CartItemType } from '../types';
import QuantitySelector from './QuantitySelector';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (pizzaId: string, quantity: number) => void;
  onRemove: (pizzaId: string) => void;
}

export default function CartItemComponent({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: item.pizza.image_url }}
        style={styles.image}
        contentFit="cover"
      />
      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={1}>{item.pizza.name}</Text>
        <Text style={styles.price}>€{(item.pizza.price * item.quantity).toFixed(2)}</Text>
        <QuantitySelector
          quantity={item.quantity}
          onIncrease={() => onUpdateQuantity(item.pizza.id, item.quantity + 1)}
          onDecrease={() => onUpdateQuantity(item.pizza.id, item.quantity - 1)}
        />
      </View>
      <TouchableOpacity onPress={() => onRemove(item.pizza.id)} style={styles.removeBtn}>
        <Text style={styles.removeTxt}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 10,
  },
  details: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E63946',
    marginBottom: 6,
  },
  removeBtn: {
    padding: 6,
  },
  removeTxt: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});
