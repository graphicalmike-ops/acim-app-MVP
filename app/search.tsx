import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { RipplePressable } from '@/components/RipplePressable';
import { TertiaryButton } from '@/components/TertiaryButton';
import { SearchBar } from '@/components/SearchBar';
import { BackIcon } from '@/components/Icons';
import { BookSectionHeading } from '@/components/BookSectionHeading';
import { AppScrollView } from '@/components/AppScrollView';
import { useTheme, useThemeColors } from '@/utils/theme';
import { UIFonts } from '@/constants/Typography';
import { searchContent, formatRouteId, splitSnippet, truncateSnippetSegments, SearchResult } from '@/utils/search';

// No pagination — every match is fetched in one query. The corpus is only
// ~5,000 rows total and FTS5 is an indexed lookup (not a scan), so this stays
// fast regardless of how many rows come back; MAX_RESULTS just needs to be
// comfortably above the corpus size.
const MAX_RESULTS = 10000;
const EXCERPT_MAX_CHARS = 160;

// Fixed display order/titles, matching how the rest of the app organizes books
// (see assets/content/*-index.json book titles).
const BOOK_ORDER = ['theory', 'workbook', 'mft', 'psychotherapy', 'song'] as const;
const BOOK_TITLES: Record<string, string> = {
  theory: 'Libro de Texto',
  workbook: 'Libro de Ejercicios',
  mft: 'Manual para el Maestro',
  psychotherapy: 'Psicoterapia',
  song: 'El Canto de la Oración',
};

function groupByBook(results: SearchResult[]): { book: string; title: string; items: SearchResult[] }[] {
  const groups = new Map<string, SearchResult[]>();
  for (const r of results) {
    if (!groups.has(r.book)) groups.set(r.book, []);
    groups.get(r.book)!.push(r);
  }
  return BOOK_ORDER
    .filter((book) => groups.has(book))
    .map((book) => ({ book, title: BOOK_TITLES[book] ?? book, items: groups.get(book)! }));
}

function formatResultsCount(count: number): string {
  return count === 1 ? '1 resultado' : `${count} resultados`;
}

export default function SearchScreen() {
  const t = useThemeColors();
  const { isDark } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

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

  // Search only fires on explicit submission (search-icon tap or the
  // keyboard's search key) — not as the user types.
  const handleSearch = useCallback(() => {
    setSubmittedQuery(query.trim());
  }, [query]);

  const handleClearSearch = useCallback(() => {
    setSubmittedQuery('');
  }, []);

  // Submitted query changed: fetch every match in one shot (no pagination).
  useEffect(() => {
    let cancelled = false;
    if (!submittedQuery) {
      setResults([]);
      setSearching(false);
      setLoadBarVisible(false);
      return;
    }
    setSearching(true);
    startLoadBar();
    (async () => {
      const items = await searchContent(submittedQuery, MAX_RESULTS);
      if (!cancelled) {
        setResults(items);
        setSearching(false);
        setLoadBarVisible(false);
      }
    })();
    return () => { cancelled = true; };
  }, [submittedQuery, startLoadBar]);

  const openResult = useCallback((result: SearchResult) => {
    if (navigating) return;
    setNavigating(true);
    startLoadBar();
    const anchor = result.anchor ?? result.chapterAnchor ?? result.lessonAnchor;
    const paragraphParam = result.paragraph != null ? `&paragraph=${result.paragraph}` : '';
    const queryParam = submittedQuery ? `&q=${encodeURIComponent(submittedQuery)}` : '';
    setTimeout(() => router.push(`/reader?book=${result.book}&anchor=${anchor}${paragraphParam}${queryParam}`), 200);
  }, [navigating, startLoadBar, submittedQuery]);

  const groups = groupByBook(results);

  return (
    <SafeAreaView style={[styles.topArea, { backgroundColor: t.darkerBackgroundColor }]} edges={['top']}>
      <SafeAreaView style={[styles.container, { backgroundColor: t.backgroundColor }]} edges={['bottom']}>
        <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={t.darkerBackgroundColor} />
        <View style={[styles.navBar, { backgroundColor: t.darkerBackgroundColor }]}>
          <View style={styles.navRow}>
            <TertiaryButton hitSize={40} onPress={() => router.back()}>
              {(pressed) => <BackIcon size={16} color={pressed ? t.pressedIconColor : t.fontColorPrimary} />}
            </TertiaryButton>
            <View style={styles.navSearchBar}>
              <SearchBar
                value={query}
                onChangeText={setQuery}
                onSubmit={handleSearch}
                onClear={handleClearSearch}
                searched={submittedQuery.length > 0 && query === submittedQuery}
                placeholder="Buscar"
                autoFocus
              />
            </View>
          </View>
        </View>

        <AppScrollView
          contentContainerStyle={styles.content}
          style={[styles.scrollView, { backgroundColor: t.backgroundColor }, searching ? { pointerEvents: 'none' } : null]}
          keyboardShouldPersistTaps="handled"
        >
          {submittedQuery.length > 0 && (
            <View style={styles.headerItem}>
              <Text style={[styles.titleL1, { color: t.fontColorGray }]}>
                {searching ? 'Buscando…' : formatResultsCount(results.length)}
              </Text>
            </View>
          )}

          {!searching && submittedQuery.length > 0 && results.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: t.fontColorGray }]}>No se encontraron resultados.</Text>
            </View>
          )}

          {!searching && groups.map((group) => (
            <View key={group.book}>
              <BookSectionHeading label={group.title} />
              {group.items.map((result, idx) => {
                const segments = truncateSnippetSegments(splitSnippet(result.snippet), EXCERPT_MAX_CHARS);
                return (
                  <RipplePressable
                    key={`${result.anchor}-${result.paragraph}-${idx}`}
                    style={styles.item}
                    rippleColor={t.darkerBackgroundColor}
                    onPress={() => openResult(result)}
                  >
                    {() => (
                      <>
                        <View style={styles.itemRow}>
                          <View style={styles.itemText}>
                            <Text style={[styles.itemLabel, { color: t.fontColorPrimary }]}>{formatRouteId(result)}</Text>
                            <Text style={[styles.itemSubtitle, { color: t.fontColorGray }]}>
                              {segments.map((seg, i) => (
                                <Text key={i} style={seg.highlighted ? styles.itemSubtitleBold : undefined}>
                                  {seg.text}
                                </Text>
                              ))}
                            </Text>
                          </View>
                        </View>
                        <View style={[styles.divider, { backgroundColor: t.darkOutline }]} />
                      </>
                    )}
                  </RipplePressable>
                );
              })}
            </View>
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
  topArea: { flex: 1 },
  container: { flex: 1 },
  navBar: { paddingHorizontal: 24, paddingVertical: 10 },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  navSearchBar: { flex: 1 },
  scrollView: { flex: 1 },
  content: { paddingBottom: 40 },
  headerItem: { paddingTop: 24, paddingBottom: 12, paddingHorizontal: 24 },
  titleL1: UIFonts.capsBodyXsRegular,
  emptyState: { paddingHorizontal: 24, paddingTop: 12 },
  emptyText: { fontFamily: 'NotoSans_500Medium', fontSize: 14 },
  item: { overflow: 'hidden', paddingLeft: 24, paddingRight: 24, paddingTop: 14, gap: 14 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  itemText: { flex: 1, gap: 2 },
  itemLabel: { fontFamily: 'NotoSans_500Medium', fontSize: 14 },
  itemSubtitle: { fontFamily: 'NotoSans_500Medium', fontSize: 12 },
  itemSubtitleBold: { fontFamily: 'NotoSans_700Bold' },
  divider: { height: 2 },
  loadBarTrack: { height: 3, overflow: 'hidden' },
  loadBarFill: { position: 'absolute', left: 0, right: 0, height: 3 },
});
