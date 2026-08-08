import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import * as Location from 'expo-location';
import { CommonActions } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../api/client';
import type { BrowseSlot } from '../api/types';
import type { BrowseScreenProps } from '../navigation/types';
import { Card, EmptyState, ModeSwitcher, Text, View } from '../components/ui';

export function BrowseScreen({ navigation }: BrowseScreenProps) {
  const [slots, setSlots] = useState<BrowseSlot[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<'pending' | 'granted' | 'denied'>('pending');

  const load = useCallback(async (coords?: { latitude: number; longitude: number }) => {
    setRefreshing(true);
    try {
      const query = coords ? `?lat=${coords.latitude}&lng=${coords.longitude}` : '';
      const res = await api.get<BrowseSlot[] | { results: BrowseSlot[] }>(`/browse/slots/${query}`);
      setSlots(Array.isArray(res) ? res : res.results);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load availability');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('denied');
        load();
        return;
      }
      setLocationStatus('granted');
      try {
        const position = await Location.getCurrentPositionAsync({});
        load(position.coords);
      } catch {
        load();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-neutral-50" edges={['top']}>
      <View className="flex-row justify-between items-start px-5 pt-4 pb-8">
        <View>
          <Text className="text-neutral-400 text-[13px] font-semibold uppercase tracking-wide mb-1">Diner</Text>
          <Text className="text-[32px] font-extrabold text-neutral-900 leading-9 tracking-tight">Tonight's tables</Text>
          {locationStatus === 'denied' ? (
            <Text className="text-neutral-400 text-[12px] mt-1">Enable location to sort by distance</Text>
          ) : null}
        </View>
        <ModeSwitcher
          mode="diner"
          onSwitch={() =>
            navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Restaurants' }] }))
          }
        />
      </View>

      {error ? (
        <View className="mx-5 mb-3 bg-red-50 rounded-xl px-3 py-2.5">
          <Text className="text-red-600 text-[13px] font-medium">{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={slots}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load()} tintColor="#4F46E5" />}
        contentContainerClassName="px-5 pb-10"
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListEmptyComponent={
          !refreshing ? (
            <EmptyState title="No open tables right now" subtitle="Check back soon — restaurants add slots throughout the day." />
          ) : null
        }
        renderItem={({ item }) => (
          <Card>
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-1 pr-3">
                <Text className="text-[17px] font-bold text-neutral-900 mb-0.5">{item.restaurant_name}</Text>
                <Text className="text-neutral-400 text-[13px]">
                  {item.distance_miles != null ? `${item.distance_miles} mi away` : `${item.city}, ${item.state}`}
                  {item.cuisine_type ? ` · ${item.cuisine_type}` : ''}
                </Text>
              </View>
            </View>
            <Text className="text-neutral-600 text-[13px] mb-2">
              {new Date(item.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              {'  ·  '}
              {new Date(item.start_time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} –{' '}
              {new Date(item.end_time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              {'  ·  '}Seats {item.capacity}
            </Text>
            <View className="flex-row items-center gap-4">
              <View>
                <Text className="text-neutral-400 text-[11px] font-semibold uppercase">Credit value</Text>
                <Text className="text-neutral-900 font-semibold text-[15px]">${item.credit_value}</Text>
              </View>
              <View>
                <Text className="text-neutral-400 text-[11px] font-semibold uppercase">Prepay</Text>
                <Text className="text-emerald-600 font-semibold text-[15px]">${item.prepay_price}</Text>
              </View>
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}
