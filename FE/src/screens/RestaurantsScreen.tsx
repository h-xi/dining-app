import { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, RefreshControl, ScrollView } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api, ApiError } from '../api/client';
import { geocodeAddress } from '../api/geocode';
import type { Restaurant } from '../api/types';
import { useAuth } from '../context/AuthContext';
import type { RestaurantsScreenProps } from '../navigation/types';
import { Avatar, Badge, Button, Card, EmptyState, Fab, Field, ModeSwitcher, Text, View } from '../components/ui';

const emptyForm = {
  name: '',
  description: '',
  cuisine_type: '',
  address_line1: '',
  city: '',
  state: '',
  postal_code: '',
};

export function RestaurantsScreen({ navigation }: RestaurantsScreenProps) {
  const { user, logout } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await api.get<Restaurant[] | { results: Restaurant[] }>('/restaurants/');
      setRestaurants(Array.isArray(res) ? res : res.results);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load restaurants');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createRestaurant() {
    setSubmitting(true);
    setError(null);
    try {
      const coords = await geocodeAddress(
        [form.address_line1, form.city, form.state, form.postal_code].filter(Boolean).join(', '),
      );
      await api.post<Restaurant>('/restaurants/', {
        ...form,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
      });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? JSON.stringify(e.body) : 'Failed to create restaurant');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-50" edges={['top']}>
      <View className="flex-row justify-between items-start px-5 pt-4 pb-8">
        <View className="flex-row items-center gap-3">
          <Avatar label={user?.email ?? '?'} />
          <View>
            <Text className="text-[32px] font-extrabold text-neutral-900 leading-9 tracking-tight">Restaurants</Text>
            {user ? <Text className="text-neutral-400 text-[13px] mt-0.5">{user.email}</Text> : null}
          </View>
        </View>
        <View className="items-end gap-2">
          <ModeSwitcher
            mode="owner"
            onSwitch={() => navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Browse' }] }))}
          />
          <Pressable onPress={logout} hitSlop={8}>
            <Text className="text-red-500 font-semibold text-[13px]">Log out</Text>
          </Pressable>
        </View>
      </View>

      {error ? (
        <View className="mx-5 mb-3 bg-red-50 rounded-xl px-3 py-2.5">
          <Text className="text-red-600 text-[13px] font-medium">{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={restaurants}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor="#4F46E5" />}
        contentContainerClassName="px-5 pb-24"
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListEmptyComponent={
          !refreshing ? <EmptyState title="No restaurants yet" subtitle="Tap the + button to add your first one." /> : null
        }
        renderItem={({ item }) => (
          <Card onPress={() => navigation.navigate('Tables', { restaurant: item })}>
            <View className="flex-row justify-between items-start">
              <View className="flex-1 pr-3">
                <Text className="text-[17px] font-bold text-neutral-900 mb-0.5">{item.name}</Text>
                <Text className="text-neutral-400 text-[13px]">
                  {item.city}, {item.state}
                </Text>
                {item.cuisine_type ? (
                  <Text className="text-neutral-500 text-[13px] mt-1">{item.cuisine_type}</Text>
                ) : null}
              </View>
              <Badge label={item.is_active ? 'Active' : 'Inactive'} tone={item.is_active ? 'active' : 'inactive'} />
            </View>
          </Card>
        )}
      />

      <Fab onPress={() => setShowForm(true)} />

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowForm(false)}>
        <SafeAreaView className="flex-1 bg-white">
          <ScrollView className="flex-1 px-5" contentContainerClassName="pt-6 pb-10">
            <Text className="text-[22px] font-bold text-neutral-900 mb-5">New restaurant</Text>
            <Field label="Name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
            <Field
              label="Description"
              value={form.description}
              onChangeText={(v) => setForm({ ...form, description: v })}
              multiline
            />
            <Field
              label="Cuisine type"
              value={form.cuisine_type}
              onChangeText={(v) => setForm({ ...form, cuisine_type: v })}
            />
            <Field
              label="Address line 1"
              value={form.address_line1}
              onChangeText={(v) => setForm({ ...form, address_line1: v })}
            />
            <Field label="City" value={form.city} onChangeText={(v) => setForm({ ...form, city: v })} />
            <Field label="State" value={form.state} onChangeText={(v) => setForm({ ...form, state: v })} />
            <Field
              label="Postal code"
              value={form.postal_code}
              onChangeText={(v) => setForm({ ...form, postal_code: v })}
            />
            <Text className="text-[12px] text-neutral-400 mb-4">
              We'll automatically look up the map location from this address.
            </Text>
            <View className="flex-row gap-3 mt-2">
              <View className="flex-1">
                <Button title="Cancel" variant="secondary" onPress={() => setShowForm(false)} />
              </View>
              <View className="flex-1">
                <Button
                  title="Save"
                  onPress={createRestaurant}
                  loading={submitting}
                  disabled={!form.name || !form.address_line1 || !form.city}
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
