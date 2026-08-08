export type Restaurant = {
  id: number;
  owner: number;
  name: string;
  description: string;
  cuisine_type: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  timezone: string;
  phone_number: string;
  email: string;
  is_active: boolean;
  latitude: string | null;
  longitude: string | null;
  created_at: string;
  updated_at: string;
};

export type Table = {
  id: number;
  restaurant: number;
  table_number: string;
  capacity: number;
  location_description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AvailabilitySlotStatus = 'open' | 'reserved' | 'expired' | 'fulfilled' | 'cancelled';

export type AvailabilitySlot = {
  id: number;
  table: number;
  start_time: string;
  end_time: string;
  credit_value: string;
  prepay_price: string;
  status: AvailabilitySlotStatus;
  created_at: string;
  updated_at: string;
};

export type BrowseSlot = {
  id: number;
  start_time: string;
  end_time: string;
  credit_value: string;
  prepay_price: string;
  status: AvailabilitySlotStatus;
  restaurant_id: number;
  restaurant_name: string;
  cuisine_type: string;
  city: string;
  state: string;
  latitude: string | null;
  longitude: string | null;
  table_number: string;
  capacity: number;
  distance_miles: number | null;
};

export type AuthUser = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
};
