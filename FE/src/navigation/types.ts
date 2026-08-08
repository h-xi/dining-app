import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { Restaurant, Table } from '../api/types';

export type RootStackParamList = {
  Restaurants: undefined;
  Tables: { restaurant: Restaurant };
  Slots: { restaurant: Restaurant; table: Table };
  Browse: undefined;
};

export type RestaurantsScreenProps = NativeStackScreenProps<RootStackParamList, 'Restaurants'>;
export type TablesScreenProps = NativeStackScreenProps<RootStackParamList, 'Tables'>;
export type SlotsScreenProps = NativeStackScreenProps<RootStackParamList, 'Slots'>;
export type BrowseScreenProps = NativeStackScreenProps<RootStackParamList, 'Browse'>;
