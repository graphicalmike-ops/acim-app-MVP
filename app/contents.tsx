import { useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { RipplePressable } from '@/components/RipplePressable';
import { StatusBar } from 'expo-status-bar';
import { BackIcon, HomeIcon, PlusIcon, MinusIcon } from '@/components/Icons';
import { TertiaryButton } from '@/components/TertiaryButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { toTitleCase } from '@/utils/text';

const INDEX_FILES = {
  theory:     require('@/assets/content/theory-index.json'),
  workbook:   require('@/assets/content/workbook-index.json'),
  mft:        require('@/assets/content/mft-index.json'),
  supplement: require('@/assets/content/supplement-index.json'),
} as const;

type FlatItemType = 'Item' | 'Title-L1' | 'Title-L2' | 'Accordion';
type FlatChild = { label: string; subtitle?: string; id: string; anchor?: string; bookId: string };
type FlatItem = {
  type: FlatItemType;
  label: string;
  subtitle?: string;
  id: string;
  anchor?: string;
  bookId: string;
  children?: FlatChild[];
};

function buildAllItems(books: any[]): FlatItem[] {
  const items: FlatItem[] = [];
  for (const book of books) {
    if ((book as any)._comment) continue;
    items.push({ type: 'Title-L1', label: book.title, id: book.id, bookId: book.id });
    for (const child of book.children ?? []) {
      if (child._comment) continue;
      if (child.component === 'title-l2') {
        items.push({ type: 'Title-L2', label: child.title, id: child.id, bookId: book.id });
        for (const grandchild of child.children ?? []) {
          if (grandchild._comment) continue;
          const item = buildItem(grandchild, book.id);
          if (item) items.push(item);
        }
      } else {
        const item = buildItem(child, book.id);
        if (item) items.push(item);
      }
    }
  }
  return items;
}

function buildItem(node: any, bookId: string): FlatItem | null {
  if (!node || node._comment) return null;
  if (node.component === 'accordion') {
    return {
      type: 'Accordion',
      label: node.title,
      subtitle: node.subtitle,
      id: node.id,
      bookId,
      children: (node.children ?? [])
        .filter((c: any) => !c._comment)
        .map((c: any) => ({ label: c.title, subtitle: c.subtitle, id: c.id, anchor: c.anchor, bookId })),
    };
  }
  return { type: 'Item', label: node.title, subtitle: node.subtitle, id: node.id, anchor: node.anchor, bookId };
}

// Computed once at module load — not on every screen mount
const ITEMS_BY_BOOK = Object.fromEntries(
  Object.entries(INDEX_FILES).map(([key, idx]) => [key, buildAllItems((idx as any).books)])
) as Record<string, FlatItem[]>;

export default function ContentsScreen() {
  const { anchor } = useLocalSearchParams<{ anchor: string }>();
  const items = ITEMS_BY_BOOK[anchor] ?? ITEMS_BY_BOOK.theory;
  const bookTitle = items.find(i => i.type === 'Title-L1')?.label ?? '';
  const { width: screenWidth } = useWindowDimensions();

  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [loadBarVisible, setLoadBarVisible] = useState(false);
  const loadBarAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const itemYPositions = useRef<Map<string, number>>(new Map());

  const toggleAccordion = useCallback((id: string) => {
    setOpenAccordion(prev => {
      if (prev === id) return null;
      const oldY = itemYPositions.current.get(id) ?? 0;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const newY = itemYPositions.current.get(id) ?? 0;
          const delta = oldY - newY;
          if (delta > 0) {
            scrollRef.current?.scrollTo({ y: Math.max(0, scrollY.current - delta), animated: false });
          }
        });
      });
      return id;
    });
  }, []);

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

  return (
    <SafeAreaView style={styles.topArea} edges={['top']}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <StatusBar style="dark" backgroundColor={Colors.backgroundDark} />
        <View style={styles.navBar}>
          <View style={styles.navRow}>
            <View style={styles.navLeft}>
              <TertiaryButton hitSize={40} onPress={() => router.back()}>
                {() => <BackIcon size={16} color={Colors.textPrimary} />}
              </TertiaryButton>
              <Text style={styles.navTitle}>{toTitleCase(bookTitle)}</Text>
            </View>
            <TertiaryButton hitSize={40} onPress={() => router.navigate('/home')}>
              {() => <HomeIcon size={16} color={Colors.textPrimary} />}
            </TertiaryButton>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          onScroll={(e) => { scrollY.current = e.nativeEvent.contentOffset.y; }}
          scrollEventThrottle={16}
        >
          {items.map((item) => {
            if (item.type === 'Title-L1') {
              return null;
            }

            if (item.type === 'Title-L2') {
              return (
                <View key={item.id} style={styles.titleL1Item}>
                  <Text style={styles.titleL1}>{toTitleCase(item.label)}</Text>
                </View>
              );
            }

            if (item.type === 'Accordion') {
              const isOpen = openAccordion === item.id;
              return (
                <View key={item.id} onLayout={(e) => itemYPositions.current.set(item.id, e.nativeEvent.layout.y)}>
                  <RipplePressable
                    style={[styles.item, isOpen && styles.accordionExpanded]}
                    rippleColor={isOpen ? Colors.background : Colors.backgroundDark}
                    onPress={() => toggleAccordion(item.id)}
                  >
                    {() => (
                      <>
                        <View style={styles.itemRow}>
                          <View style={styles.itemText}>
                            <Text style={styles.itemLabelBold}>{item.bookId === 'mft' ? item.label : toTitleCase(item.label)}</Text>
                            {item.subtitle && (
                              <Text style={styles.itemSubtitle}>{item.bookId === 'mft' ? item.subtitle : toTitleCase(item.subtitle)}</Text>
                            )}
                          </View>
                          {isOpen ? <MinusIcon color={Colors.textMuted} /> : <PlusIcon color={Colors.textMuted} />}
                        </View>
                        <View style={styles.divider} />
                      </>
                    )}
                  </RipplePressable>
                  {isOpen && item.children?.map((child, childIndex) => (
                    <RipplePressable
                      key={child.id}
                      style={[styles.item, styles.accordionChildItem]}
                      rippleColor={Colors.background}
                      onPress={() => { if (navigating) return; setNavigating(true); startLoadBar(); const anchor = childIndex === 0 && child.bookId === 'theory' ? item.id : (child.anchor ?? child.id); requestAnimationFrame(() => router.push(`/reader?book=${child.bookId}&anchor=${anchor}`)); }}
                    >
                      <>
                        <View style={[styles.itemRow, styles.accordionChildRow]}>
                          <View style={styles.itemText}>
                            <Text style={styles.itemLabel}>{child.label}</Text>
                            {child.subtitle && (
                              <Text style={styles.itemSubtitle}>{child.subtitle}</Text>
                            )}
                          </View>
                        </View>
                        <View style={styles.divider} />
                      </>
                    </RipplePressable>
                  ))}
                </View>
              );
            }

            return (
              <RipplePressable
                key={item.id}
                style={styles.item}
                rippleColor={Colors.backgroundDark}
                onPress={() => { if (navigating) return; setNavigating(true); startLoadBar(); requestAnimationFrame(() => router.push(`/reader?book=${item.bookId}&anchor=${item.anchor ?? item.id}`)); }}
              >
                {() => (
                  <>
                    <View style={styles.itemRow}>
                      <View style={styles.itemText}>
                        <Text style={styles.itemLabel}>{item.bookId === 'mft' ? item.label : toTitleCase(item.label)}</Text>
                        {item.subtitle && (
                          <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.divider} />
                  </>
                )}
              </RipplePressable>
            );
          })}
        </ScrollView>
        {loadBarVisible && (
          <View style={styles.loadBarTrack}>
            <Animated.View style={[
              styles.loadBarFill,
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
    backgroundColor: Colors.backgroundDark,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  navBar: {
    height: 60,
    backgroundColor: Colors.backgroundDark,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
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
    fontFamily: 'MerriweatherSans_400Regular',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 40,
  },
  item: {
    overflow: 'hidden',
    paddingLeft: 24,
    paddingRight: 24,
    paddingTop: 14,
    gap: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  divider: {
    height: 2,
    backgroundColor: Colors.darkOutline,
  },
  itemText: {
    flex: 1,
    gap: 2,
  },
  itemLabel: {
    fontFamily: 'MerriweatherSans_400Regular',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  itemLabelBold: {
    fontFamily: 'MerriweatherSans_700Bold',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  accordionExpanded: {
    backgroundColor: Colors.backgroundDark,
  },
  accordionExpandedPressed: {},
  accordionChildItem: {
    backgroundColor: Colors.backgroundDark,
  },
  accordionChildItemPressed: {},
  accordionChildRow: {
    paddingLeft: 24,
  },
  itemLabelHover: {
    color: Colors.darkOutline,
  },
  itemLabelPressed: {
    fontFamily: 'MerriweatherSans_700Bold',
    color: Colors.darkOutline,
  },
  itemSubtitle: {
    fontFamily: 'MerriweatherSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  itemSubtitleHover: {
    color: Colors.darkOutline,
  },
  titleL1Item: {
    paddingTop: 32,
    paddingBottom: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.background,
  },
  titleL1: {
    fontFamily: 'MerriweatherSans_700Bold',
    fontSize: 14,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  titleItem: {
    paddingTop: 32,
    paddingBottom: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.backgroundDark,
  },
  titleL2: {
    fontFamily: 'MerriweatherSans_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
  },
  loadBarTrack: {
    height: 3,
    backgroundColor: Colors.darkOutline,
    overflow: 'hidden',
  },
  loadBarFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.textPrimary,
  },
});
