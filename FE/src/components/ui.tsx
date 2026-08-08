import { ActivityIndicator, Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';

const PRIMARY = '#4F46E5';

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
}) {
  const styles = {
    primary: 'bg-indigo-600 active:bg-indigo-700',
    secondary: 'bg-neutral-100 active:bg-neutral-200',
    danger: 'bg-red-600 active:bg-red-700',
    ghost: 'bg-transparent active:bg-neutral-100',
  } as const;
  const textStyles = {
    primary: 'text-white',
    secondary: 'text-neutral-800',
    danger: 'text-white',
    ghost: 'text-neutral-600',
  } as const;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`rounded-2xl px-5 py-3.5 items-center flex-row justify-center gap-2 ${styles[variant]} ${
        disabled ? 'opacity-40' : ''
      }`}
      style={variant === 'primary' && !disabled ? shadow(PRIMARY, 0.25) : undefined}
    >
      {loading ? <ActivityIndicator size="small" color={variant === 'primary' ? '#fff' : PRIMARY} /> : null}
      <Text className={`font-semibold text-[15px] ${textStyles[variant]}`}>{title}</Text>
    </Pressable>
  );
}

export function IconButton({
  onPress,
  children,
}: {
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      className="w-9 h-9 rounded-full items-center justify-center bg-neutral-100 active:bg-neutral-200"
    >
      {children}
    </Pressable>
  );
}

export function Fab({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-indigo-600 items-center justify-center active:bg-indigo-700"
      style={shadow(PRIMARY, 0.4)}
    >
      <Text className="text-white text-3xl leading-8 -mt-0.5">+</Text>
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View className="mb-4">
      <Text className="text-[13px] font-semibold text-neutral-500 mb-1.5">{label}</Text>
      <TextInput
        className="border border-neutral-200 bg-neutral-50 rounded-xl px-4 py-3 text-[15px] text-neutral-900"
        placeholderTextColor="#A3A3A3"
        {...props}
      />
    </View>
  );
}

export function Card({
  children,
  onPress,
  className = '',
}: {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
}) {
  const content = (
    <View
      className={`bg-white border border-neutral-100 rounded-2xl p-4 ${className}`}
      style={shadow('#000000', 0.05)}
    >
      {children}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} className="active:opacity-70">
      {content}
    </Pressable>
  );
}

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  open: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  active: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  reserved: { bg: 'bg-amber-50', text: 'text-amber-600' },
  fulfilled: { bg: 'bg-blue-50', text: 'text-blue-600' },
  expired: { bg: 'bg-neutral-100', text: 'text-neutral-500' },
  inactive: { bg: 'bg-neutral-100', text: 'text-neutral-500' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-600' },
};

export function Badge({ label, tone = 'active' }: { label: string; tone?: string }) {
  const colors = BADGE_COLORS[tone] ?? BADGE_COLORS.active;
  return (
    <View className={`px-2.5 py-1 rounded-full ${colors.bg}`}>
      <Text className={`text-[11px] font-bold uppercase tracking-wide ${colors.text}`}>{label}</Text>
    </View>
  );
}

export function Avatar({ label }: { label: string }) {
  return (
    <View className="w-10 h-10 rounded-full bg-indigo-600 items-center justify-center">
      <Text className="text-white font-bold text-[15px]">{label.slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}

export function ModeSwitcher({
  mode,
  onSwitch,
}: {
  mode: 'owner' | 'diner';
  onSwitch: (mode: 'owner' | 'diner') => void;
}) {
  return (
    <Pressable
      onPress={() => onSwitch(mode === 'owner' ? 'diner' : 'owner')}
      className="flex-row items-center gap-1.5 bg-neutral-900 rounded-full pl-3 pr-2.5 py-1.5 active:bg-neutral-700"
    >
      <Text className="text-white text-[12px] font-semibold">
        {mode === 'owner' ? 'Switch to Diner' : 'Switch to Owner'}
      </Text>
      <Text className="text-white text-[12px]">⇄</Text>
    </Pressable>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="items-center justify-center py-16 px-6">
      <View className="w-16 h-16 rounded-full bg-neutral-100 items-center justify-center mb-3">
        <Text className="text-2xl">✦</Text>
      </View>
      <Text className="text-neutral-900 font-semibold text-base mb-1">{title}</Text>
      {subtitle ? <Text className="text-neutral-400 text-center text-sm">{subtitle}</Text> : null}
    </View>
  );
}

function shadow(color: string, opacity: number) {
  return {
    shadowColor: color,
    shadowOpacity: opacity,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  };
}

export { View, Text };
