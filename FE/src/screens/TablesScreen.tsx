import { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api, ApiError } from '../api/client';
import type { Table } from '../api/types';
import type { TablesScreenProps } from '../navigation/types';
import { Button, Card, EmptyState, Fab, Field, Text, View } from '../components/ui';

const emptyForm = { table_number: '', capacity: '', location_description: '' };

export function TablesScreen({ route, navigation }: TablesScreenProps) {
  const { restaurant } = route.params;
  const [tables, setTables] = useState<Table[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await api.get<Table[] | { results: Table[] }>(`/tables/?restaurant=${restaurant.id}`);
      setTables(Array.isArray(res) ? res : res.results);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tables');
    } finally {
      setRefreshing(false);
    }
  }, [restaurant.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function createTable() {
    setSubmitting(true);
    setError(null);
    try {
      await api.post<Table>('/tables/', {
        restaurant: restaurant.id,
        table_number: form.table_number,
        capacity: Number(form.capacity),
        location_description: form.location_description,
      });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? JSON.stringify(e.body) : 'Failed to create table');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-50" edges={['top']}>
      <View className="px-5 pt-4 pb-8">
        <Text className="text-neutral-400 text-[13px] font-semibold uppercase tracking-wide mb-1">Tables</Text>
        <Text className="text-[32px] font-extrabold text-neutral-900 leading-9 tracking-tight">{restaurant.name}</Text>
      </View>

      {error ? (
        <View className="mx-5 mb-3 bg-red-50 rounded-xl px-3 py-2.5">
          <Text className="text-red-600 text-[13px] font-medium">{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={tables}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor="#4F46E5" />}
        contentContainerClassName="px-5 pb-24"
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListEmptyComponent={
          !refreshing ? <EmptyState title="No tables yet" subtitle="Tap the + button to add your first table." /> : null
        }
        renderItem={({ item }) => (
          <Card onPress={() => navigation.navigate('Slots', { restaurant, table: item })}>
            <View className="flex-row justify-between items-center">
              <View className="flex-1 pr-3">
                <Text className="text-[17px] font-bold text-neutral-900 mb-0.5">Table {item.table_number}</Text>
                <Text className="text-neutral-400 text-[13px]">
                  Seats {item.capacity}
                  {item.location_description ? ` · ${item.location_description}` : ''}
                </Text>
              </View>
              <Text className="text-neutral-300 text-xl">›</Text>
            </View>
          </Card>
        )}
      />

      <Fab onPress={() => setShowForm(true)} />

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowForm(false)}>
        <SafeAreaView className="flex-1 bg-white">
          <ScrollView className="flex-1 px-5" contentContainerClassName="pt-6 pb-10">
            <Text className="text-[22px] font-bold text-neutral-900 mb-5">New table</Text>
            <Field
              label="Table number"
              value={form.table_number}
              onChangeText={(v) => setForm({ ...form, table_number: v })}
            />
            <Field
              label="Capacity"
              value={form.capacity}
              onChangeText={(v) => setForm({ ...form, capacity: v })}
              keyboardType="numeric"
            />
            <Field
              label="Location description"
              value={form.location_description}
              onChangeText={(v) => setForm({ ...form, location_description: v })}
            />
            <View className="flex-row gap-3 mt-2">
              <View className="flex-1">
                <Button title="Cancel" variant="secondary" onPress={() => setShowForm(false)} />
              </View>
              <View className="flex-1">
                <Button
                  title="Save"
                  onPress={createTable}
                  loading={submitting}
                  disabled={!form.table_number || !form.capacity}
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
