import './global.css';
import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import type { RootStackParamList } from './src/navigation/types';
import { LoginScreen } from './src/screens/LoginScreen';
import { RestaurantsScreen } from './src/screens/RestaurantsScreen';
import { TablesScreen } from './src/screens/TablesScreen';
import { SlotsScreen } from './src/screens/SlotsScreen';
import { BrowseScreen } from './src/screens/BrowseScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Syncs navigation state with the browser URL/history on web, so the
// browser's own Back/Forward buttons (and swipe-back trackpad gesture on
// Mac browsers) work as the equivalent of the native swipe gesture.
const linking = {
  prefixes: [],
  config: {
    screens: {
      Restaurants: '',
      Tables: 'tables',
      Slots: 'slots',
      Browse: 'browse',
    },
  },
};

function AppNavigator() {
  const { user } = useAuth();

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Restaurants" component={RestaurantsScreen} />
        <Stack.Screen name="Tables" component={TablesScreen} />
        <Stack.Screen name="Slots" component={SlotsScreen} />
        <Stack.Screen name="Browse" component={BrowseScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
