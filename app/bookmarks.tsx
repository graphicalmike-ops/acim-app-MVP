import { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { BackIcon } from '@/components/Icons';
import { SavedItemRow } from '@/components/SavedItemRow';
import { AppScrollView } from '@/components/AppScrollView';
import { TertiaryButton } from '@/components/TertiaryButton';
import { useTheme, useThemeColors } from '@/utils/theme';
import { useBookmarks, bookmarkHref } from '@/utils/bookmarks';
import { UIFonts } from '@/constants/Typography';

export default function BookmarksScreen() {
  const { isDark } = useTheme();
  const t = useThemeColors();
  const { width: screenWidth } = useWindowDimensions();
  const { bookmarks } = useBookmarks();

  const [navigating, setNavigating] = useState(false);
  const [loadBarVisible, setLoadBarVisible] = useState(false);
  const loadBarAnim = useRef(new Animated.Value(0)).current;

  const startLoadBar = useCallback(() => {
    setLoadBarVisible(true);
    loadBarAnim.setValue(0);
    Animated.timing(loadBarAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [loadBarAnim]);

  useFocusEffect(
    useCallback(() => {
      setNavigating(false);
      setLoadBarVisible(false);
      loadBarAnim.stopAnimation();
      loadBarAnim.setValue(0);
    }, [loadBarAnim])
  );

  const sortedBookmarks = [...bookmarks].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <SafeAreaView style={[styles.topArea, { backgroundColor: t.darkerBackgroundColor }]} edges={['top']}>
      <SafeAreaView style={[styles.container, { backgroundColor: t.backgroundColor }]} edges={['bottom']}>
        <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={t.darkerBackgroundColor} />
        <View style={[styles.navBar, { backgroundColor: t.darkerBackgroundColor }]}>
          <View style={styles.navRow}>
            <View style={styles.navLeft}>
              <TertiaryButton hitSize={40} onPress={() => router.back()}>
                {(pressed) => <BackIcon size={16} color={pressed ? t.pressedIconColor : t.fontColorPrimary} />}
              </TertiaryButton>
              <Text style={[styles.navTitle, { color: t.fontColorPrimary }]}>Guardados</Text>
            </View>
          </View>
        </View>

        <AppScrollView
          contentContainerStyle={styles.content}
          style={[styles.scrollView, { backgroundColor: t.backgroundColor }]}
        >
          {sortedBookmarks.map((item) => (
            <SavedItemRow
              key={item.id}
              item={item}
              onPress={() => {
                if (navigating) return;
                setNavigating(true);
                startLoadBar();
                setTimeout(() => router.push(bookmarkHref(item)), 200);
              }}
            />
          ))}
        </AppScrollView>
        {loadBarVisible && (
          <View style={[styles.loadBarTrack, { backgroundColor: isDark ? 'transparent' : t.darkOutline }]}>
            <Animated.View style={[
              styles.loadBarFill,
              { backgroundColor: isDark ? t.darkerBackgroundColor : t.fontColorPrimary },
              { transform: [{ translateX: loadBarAnim.interpolate({ inputRange: [0, 1], outputRange: [-screenWidth, 0] }) }] },
            ]} />
          </View>
        )}
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  navBar: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  navLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  navTitle: {
    flex: 1,
    fontFamily: UIFonts.bodySRegular.fontFamily,
    fontSize: UIFonts.bodySRegular.fontSize,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  loadBarTrack: {
    height: 3,
    overflow: 'hidden',
  },
  loadBarFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
  },
});
