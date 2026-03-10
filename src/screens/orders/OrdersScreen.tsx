import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOrders } from '../../hooks/useOrders';
import Header from '../../components/Header';
import { Order, OrderStatus } from '../../types';

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  preparing: '#8B5CF6',
  ready: '#10B981',
  completed: '#6B7280',
  cancelled: '#EF4444',
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function OrderCard({ order }: { order: Order }) {
  const statusColor = STATUS_COLORS[order.status] ?? '#6B7280';
  const statusLabel = STATUS_LABELS[order.status] ?? order.status;
  const date = new Date(order.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>Order #{order.id.slice(0, 8).toUpperCase()}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>
      <Text style={styles.date}>{date}</Text>
      {order.order_items && order.order_items.length > 0 && (
        <View style={styles.items}>
          {order.order_items.map((item) => (
            <Text key={item.id} style={styles.itemText}>
              {item.quantity}x {item.pizza?.name ?? 'Pizza'}
            </Text>
          ))}
        </View>
      )}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>€{order.total_price.toFixed(2)}</Text>
      </View>
    </View>
  );
}

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { data: orders, isLoading, refetch, isRefetching } = useOrders();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="My Orders" />

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color="#E63946" size="large" />
        </View>
      )}

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OrderCard order={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#E63946"
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.center}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySubtitle}>Your order history will appear here</Text>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  date: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 10,
  },
  items: {
    marginBottom: 10,
  },
  itemText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#E63946',
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
