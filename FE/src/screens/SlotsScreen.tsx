import { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api, ApiError } from '../api/client';
import type { AvailabilitySlot } from '../api/types';
import type { SlotsScreenProps } from '../navigation/types';
import { Badge, Button, Card, EmptyState, Fab, Field, Text, View } from '../components/ui';

const emptyForm = { start_time: '', end_time: '', credit_value: '', prepay_price: '' };

export function SlotsScreen({ route }: SlotsScreenProps) {
  const { table } = route.params;
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await api.get<AvailabilitySlot[] | { results: AvailabilitySlot[] }>(
        `/availability-slots/?table=${table.id}`,
      );
      setSlots(Array.isArray(res) ? res : res.results);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load availability slots');
    } finally {
      setRefreshing(false);
    }
  }, [table.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function createSlot() {
    setSubmitting(true);
    setError(null);
    try {
      await api.post<AvailabilitySlot>('/availability-slots/', {
        table: table.id,
        start_time: form.start_time,
        end_time: form.end_time,
        credit_value: form.credit_value,
        prepay_price: form.prepay_price,
      });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? JSON.stringify(e.body) : 'Failed to create slot');
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelSlot(slot: AvailabilitySlot) {
    setError(null);
    try {
      await api.patch<AvailabilitySlot>(`/availability-slots/${slot.id}/`, { status: 'cancelled' });
      load();
    } catch (e) {
      setError(e instanceof ApiError ? JSON.stringify(e.body) : 'Failed to cancel slot');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-50" edges={['top']}>
      <View className="px-5 pt-4 pb-8">
        <Text className="text-neutral-400 text-[13px] font-semibold uppercase tracking-wide mb-1">Availability</Text>
        <Text className="text-[32px] font-extrabold text-neutral-900 leading-9 tracking-tight">Table {table.table_number}</Text>
      </View>

      {error ? (
        <View className="mx-5 mb-3 bg-red-50 rounded-xl px-3 py-2.5">
          <Text className="text-red-600 text-[13px] font-medium">{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={slots}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor="#4F46E5" />}
        contentContainerClassName="px-5 pb-24"
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListEmptyComponent={
          !refreshing ? (
            <EmptyState title="No availability slots yet" subtitle="Tap the + button to open a slot for booking." />
          ) : null
        }
        renderItem={({ item }) => (
          <Card>
            <View className="flex-row justify-between items-start mb-2">
              <Text className="font-bold text-neutral-900 text-[15px] flex-1 pr-2">
                {new Date(item.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                {'  ·  '}
                {new Date(item.start_time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} –{' '}
                {new Date(item.end_time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              </Text>
              <Badge label={item.status} tone={item.status} />
            </View>
            <View className="flex-row items-center gap-4">
              <View>
                <Text className="text-neutral-400 text-[11px] font-semibold uppercase">Credit</Text>
                <Text className="text-neutral-900 font-semibold text-[15px]">${item.credit_value}</Text>
              </View>
              <View>
                <Text className="text-neutral-400 text-[11px] font-semibold uppercase">Prepay</Text>
                <Text className="text-emerald-600 font-semibold text-[15px]">${item.prepay_price}</Text>
              </View>
            </View>
            {item.status === 'open' ? (
              <Pressable onPress={() => cancelSlot(item)} className="mt-3 self-start">
                <Text className="text-red-500 text-[13px] font-semibold">Cancel slot</Text>
              </Pressable>
            ) : null}
          </Card>
        )}
      />

      <Fab onPress={() => setShowForm(true)} />

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowForm(false)}>
        <SafeAreaView className="flex-1 bg-white">
          <ScrollView className="flex-1 px-5" contentContainerClassName="pt-6 pb-10">
            <Text className="text-[22px] font-bold text-neutral-900 mb-5">New availability slot</Text>
            <Field
              label="Start time (ISO, e.g. 2026-08-10T18:00:00Z)"
              value={form.start_time}
              onChangeText={(v) => setForm({ ...form, start_time: v })}
              autoCapitalize="none"
            />
            <Field
              label="End time (ISO)"
              value={form.end_time}
              onChangeText={(v) => setForm({ ...form, end_time: v })}
              autoCapitalize="none"
            />
            <Field
              label="Credit value ($)"
              value={form.credit_value}
              onChangeText={(v) => setForm({ ...form, credit_value: v })}
              keyboardType="numeric"
            />
            <Field
              label="Prepay price ($)"
              value={form.prepay_price}
              onChangeText={(v) => setForm({ ...form, prepay_price: v })}
              keyboardType="numeric"
            />
            <View className="flex-row gap-3 mt-2">
              <View className="flex-1">
                <Button title="Cancel" variant="secondary" onPress={() => setShowForm(false)} />
              </View>
              <View className="flex-1">
                <Button
                  title="Save"
                  onPress={createSlot}
                  loading={submitting}
                  disabled={!form.start_time || !form.end_time || !form.credit_value || !form.prepay_price}
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
