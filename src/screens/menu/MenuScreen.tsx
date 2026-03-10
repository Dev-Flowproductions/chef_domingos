import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMenu } from '../../hooks/useMenu';
import { useCartStore } from '../../store/cartStore';
import PizzaCard from '../../components/PizzaCard';
import Header from '../../components/Header';
import { Pizza } from '../../types';

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const { data: pizzas, isLoading, error } = useMenu();
  const { addItem } = useCartStore();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = useMemo(() => {
    const cats = new Set(pizzas?.map((p) => p.category).filter(Boolean) ?? []);
    return ['All', ...Array.from(cats)];
  }, [pizzas]);

  const filtered = useMemo(() => {
    return (pizzas ?? []).filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategory === 'All' || p.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [pizzas, search, activeCategory]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Our Menu" />

      <View style={styles.searchWrapper}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search pizzas..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {categories.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, activeCategory === cat && styles.catChipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color="#E63946" size="large" />
        </View>
      )}

      {error && (
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load menu. Pull to refresh.</Text>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PizzaCard
            pizza={item}
            onPress={() => {}}
            onAddToCart={(p: Pizza) => addItem(p)}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>No pizzas found</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    height: 46,
    fontSize: 15,
    color: '#111827',
  },
  categories: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  catChipActive: {
    backgroundColor: '#E63946',
  },
  catText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  catTextActive: {
    color: '#FFFFFF',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 15,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 15,
  },
});
