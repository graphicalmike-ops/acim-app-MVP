import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/utils/theme';
import { Button } from '@/components/ui/button';
import { Text as UIText } from '@/components/ui/text';
import { Input } from '@/components/ui/input';

export default function NativeWindTest() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <View className="flex-1 items-center justify-center bg-old-background gap-4 px-6">
      <View className="bg-red-500 dark:bg-blue-500 p-6">
        <Text className="text-white text-xl">NativeWind OK ({isDark ? 'dark' : 'light'})</Text>
      </View>
      <Text className="text-old-font-primary">Token color test</Text>
      <Pressable onPress={toggleTheme} className="bg-old-primary-button-bg border border-old-dark-outline px-4 py-2">
        <Text className="text-old-font-primary">Toggle theme</Text>
      </Pressable>

      {/* RNR primitives — should already match the app's current look via
          the placeholder slot mapping in global.css/tailwind.config.js */}
      <Button onPress={toggleTheme}>
        <UIText>Default RNR button</UIText>
      </Button>
      <Button variant="secondary">
        <UIText>Secondary</UIText>
      </Button>
      <Input placeholder="RNR input" className="w-full" />
    </View>
  );
}
