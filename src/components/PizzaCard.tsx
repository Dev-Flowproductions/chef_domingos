import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Pizza } from '../types';

interface PizzaCardProps {
  pizza: Pizza;
  onPress: (pizza: Pizza) => void;
  onAddToCart: (pizza: Pizza) => void;
}

export default function PizzaCard({ pizza, onPress, onAddToCart }: PizzaCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(pizza)} activeOpacity={0.9}>
      <Image
        source={{ uri: pizza.image_url }}
        style={styles.image}
        contentFit="cover"
        placeholder={{ uri: 'https://placehold.co/300x200/FFF5F5/E63946?text=Pizza' }}
      />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{pizza.name}</Text>
        <Text style={styles.description} numberOfLines={2}>{pizza.description}</Text>
        <View style={styles.footer}>
          <Text style={styles.price}>€{pizza.price.toFixed(2)}</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => onAddToCart(pizza)}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 160,
  },
  info: {
    padding: 12,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 10,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E63946',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E63946',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 24,
  },
});
