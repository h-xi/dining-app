import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { Button, Field, Text, View } from '../components/ui';

export function LoginScreen() {
  const { login, register, loading, error, clearError } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const canSubmit =
    email.trim().length > 0 && password.length > 0 && (mode === 'login' || firstName.trim().length > 0);

  function submit() {
    if (mode === 'login') {
      login(email.trim(), password).catch(() => {});
    } else {
      register(email.trim(), password, firstName.trim(), lastName.trim()).catch(() => {});
    }
  }

  function switchMode(next: 'login' | 'signup') {
    setMode(next);
    clearError();
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-neutral-50" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerClassName="flex-1 justify-center px-6">
        <View className="items-center mb-10">
          <View className="w-16 h-16 rounded-2xl bg-indigo-600 items-center justify-center mb-5">
            <Text className="text-white text-3xl">◆</Text>
          </View>
          <Text className="text-[26px] font-bold text-neutral-900 mb-1.5">Restaurant Portal</Text>
          <Text className="text-neutral-400 text-center text-[15px]">
            Manage your restaurants, tables, and{'\n'}last-minute availability.
          </Text>
        </View>

        <View
          className="bg-white rounded-2xl border border-neutral-100 p-5"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 3,
          }}
        >
          <View className="flex-row bg-neutral-100 rounded-xl p-1 mb-5">
            <Pressable
              onPress={() => switchMode('login')}
              className={`flex-1 py-2 rounded-lg items-center ${mode === 'login' ? 'bg-white' : ''}`}
              style={mode === 'login' ? { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4 } : undefined}
            >
              <Text className={`font-semibold text-[13px] ${mode === 'login' ? 'text-neutral-900' : 'text-neutral-400'}`}>
                Log in
              </Text>
            </Pressable>
            <Pressable
              onPress={() => switchMode('signup')}
              className={`flex-1 py-2 rounded-lg items-center ${mode === 'signup' ? 'bg-white' : ''}`}
              style={mode === 'signup' ? { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4 } : undefined}
            >
              <Text className={`font-semibold text-[13px] ${mode === 'signup' ? 'text-neutral-900' : 'text-neutral-400'}`}>
                Sign up
              </Text>
            </Pressable>
          </View>

          {mode === 'signup' ? (
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Field label="First name" value={firstName} onChangeText={setFirstName} />
              </View>
              <View className="flex-1">
                <Field label="Last name" value={lastName} onChangeText={setLastName} />
              </View>
            </View>
          ) : null}

          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder={mode === 'signup' ? 'At least 8 characters' : undefined}
          />

          {error ? (
            <View className="bg-red-50 rounded-xl px-3 py-2.5 mb-4">
              <Text className="text-red-600 text-[13px] font-medium">{error}</Text>
            </View>
          ) : null}

          <Button
            title={mode === 'login' ? 'Log in' : 'Create account'}
            onPress={submit}
            disabled={!canSubmit}
            loading={loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
