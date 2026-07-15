import React, { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, LayoutChangeEvent, useWindowDimensions, Pressable, Animated, BackHandler, ToastAndroid, Platform, PanResponder, Share } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { MenuView } from '@react-native-menu/menu';
import { BackIcon, HomeIcon, ActionsIcon } from '@/components/Icons';
import { TertiaryButton } from '@/components/TertiaryButton';
import { ReaderToolButton } from '@/components/ReaderToolButton';
import { NoteInput } from '@/components/NoteInput';
import { SavedItemRow } from '@/components/SavedItemRow';
import { toTitleCase } from '@/utils/text';
import { saveLastRead } from '@/utils/lastRead';
import { RipplePressable } from '@/components/RipplePressable';
import { AppScrollView } from '@/components/AppScrollView';
import { useTheme, useThemeColors } from '@/utils/theme';
import { splitQueryTerms, normalizeForMatch, formatRouteId, SearchResult } from '@/utils/search';
import { Colors } from '@/constants/Colors';
import { UIFonts } from '@/constants/Typography';
import { Sentence, ContentBlock, CONTENT, resolveContentKey, getVersesText } from '@/utils/content';
import { useBookmarks, BookId as SavedBookId, bookmarkHref, SavedBookmark } from '@/utils/bookmarks';

const NO_HIGHLIGHT_TERMS: string[] = [];

// The toolbar drawer's tools-only ("peek") content height — computed from its
// own fixed styling (toolsDrawerContainer padding 8+12, toolsDrawerHandleWrap
// padding 8*2+margin 4, handle 6, and a single ReaderToolButton row's known
// 63px height) rather than measured via onLayout, since a post-mount
// measurement correction was visibly snapping the drawer right after its
// open animation finished. The device's bottom safe-area inset (Android's
// gesture/button nav bar) is added on top of this at the call site, since
// SafeAreaView's own bottom padding would otherwise eat into this budget.
const TOOLBAR_PEEK_CONTENT_HEIGHT = 109;

const BOOK_SEQUENCES: Record<string, string[]> = {
  theory: [
    'theory-prefacio',
    'theory-ch1',  'theory-ch2',  'theory-ch3',  'theory-ch4',  'theory-ch5',
    'theory-ch6',  'theory-ch7',  'theory-ch8',  'theory-ch9',  'theory-ch10',
    'theory-ch11', 'theory-ch12', 'theory-ch13', 'theory-ch14', 'theory-ch15',
    'theory-ch16', 'theory-ch17', 'theory-ch18', 'theory-ch19', 'theory-ch20',
    'theory-ch21', 'theory-ch22', 'theory-ch23', 'theory-ch24', 'theory-ch25',
    'theory-ch26', 'theory-ch27', 'theory-ch28', 'theory-ch29', 'theory-ch30',
    'theory-ch31',
  ],
  workbook: [
    'workbook-part1-lessons1-50',  'workbook-part1-review1',
    'workbook-part1-lessons61-80', 'workbook-part1-review2',
    'workbook-part1-lessons91-110','workbook-part1-review3',
    'workbook-part1-lessons121-140','workbook-part1-review4',
    'workbook-part1-lessons151-170','workbook-part1-review5',
    'workbook-part1-lessons181-200','workbook-part1-review6',
    'workbook-part2-intro',
    'workbook-part2-set1',  'workbook-part2-set2',  'workbook-part2-set3',
    'workbook-part2-set4',  'workbook-part2-set5',  'workbook-part2-set6',
    'workbook-part2-set7',  'workbook-part2-set8',  'workbook-part2-set9',
    'workbook-part2-set10', 'workbook-part2-set11', 'workbook-part2-set12',
    'workbook-part2-set13', 'workbook-part2-set14',
    'workbook-part2-final', 'workbook-epilogue',
  ],
  mft:        ['mft', 'mft-clarification'],
  supplement: ['supplements', 'supplement-song'],
};

function getMarginTop(type: string, prevType: string | null, isFirst: boolean): number {
  if (type === 'book-heading')        return 40;
  if (type === 'part-heading')        return (isFirst || prevType === 'book-heading') ? 40 : 80;
  if (type === 'lesson-group-heading') return isFirst ? 40 : 80;
  if (type === 'chapter-heading')     { if (prevType === 'part-heading' || prevType === 'lesson-set-heading' || prevType === 'lesson-group-heading') return 4; return (isFirst || prevType === 'book-heading') ? 40 : 80; }
  if (type === 'section-heading')     return 40;
  if (type === 'lesson-set-heading')  return isFirst ? 40 : 80;
  if (type === 'lesson-heading')      return isFirst ? 40 : 80;
  if (prevType === 'lesson-heading' || prevType === 'chapter-heading' || prevType === 'lesson-group-heading')  return 40;
  return 20;
}

export default function ReaderScreen() {
  const { book: bookId, anchor, paragraph: paragraphParam, q: searchQuery, verses: versesParam } = useLocalSearchParams<{ book: string; anchor: string; paragraph?: string; q?: string; verses?: string }>();
  const highlightTerms = useMemo(
    () => (searchQuery ? splitQueryTerms(searchQuery).map(normalizeForMatch) : NO_HIGHLIGHT_TERMS),
    [searchQuery]
  );
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();
  const { isDark } = useTheme();
  const t = useThemeColors();
  const styles = useMemo(() => createStyles(t, isDark), [t, isDark]);
  const scrollRef = useRef<ScrollView>(null);
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
  const hasScrolled = useRef(false);
  const chapterPositions = useRef<{ y: number; block: ContentBlock }[]>([]);
  const activeChapterRef = useRef<ContentBlock | null>(null);
  const [scrolledChapterBlock, setScrolledChapterBlock] = useState<ContentBlock | null>(null);
  const sectionPositions = useRef<{ y: number; block: ContentBlock }[]>([]);
  const activeSectionRef = useRef<ContentBlock | null>(null);
  const [scrolledSectionBlock, setScrolledSectionBlock] = useState<ContentBlock | null>(null);
  const [ntSheet, setNtSheet] = useState<{ word: string; note: string } | null>(null);
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const openNtSheet = useCallback((word: string, note: string) => {
    sheetAnim.setValue(0);
    setNtSheet({ word, note });
    requestAnimationFrame(() => {
      Animated.timing(sheetAnim, { toValue: 1, duration: 260, useNativeDriver: true }).start();
    });
  }, [sheetAnim]);

  const closeNtSheet = useCallback(() => {
    Animated.timing(sheetAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setNtSheet(null);
    });
  }, [sheetAnim]);

  // Tapping an already-saved (yellow-highlighted) verse opens this sheet
  // instead of toggling selection — a read-only peek at the saved note,
  // reusing the N.T. sheet's own visuals via the shared sheet* styles.
  const [savedNoteSheet, setSavedNoteSheet] = useState<SavedBookmark | null>(null);
  const savedNoteSheetAnim = useRef(new Animated.Value(0)).current;
  const openSavedNoteSheet = useCallback((bookmark: SavedBookmark) => {
    savedNoteSheetAnim.setValue(0);
    setSavedNoteSheet(bookmark);
    requestAnimationFrame(() => {
      Animated.timing(savedNoteSheetAnim, { toValue: 1, duration: 260, useNativeDriver: true }).start();
    });
  }, [savedNoteSheetAnim]);

  const closeSavedNoteSheet = useCallback(() => {
    Animated.timing(savedNoteSheetAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setSavedNoteSheet(null);
    });
  }, [savedNoteSheetAnim]);

  // Verse selection (for bookmarking): verses are keyed as `${blockKey}:${sentenceIndex}`.
  const [selectedVerses, setSelectedVerses] = useState<Set<string>>(new Set());
  const selectedVersesRef = useRef<Set<string>>(new Set());
  const verseBlockLayouts = useRef<Map<number, { y: number; height: number }>>(new Map());
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'toolbar' | 'save'>('toolbar');
  const drawerModeRef = useRef(drawerMode);
  useEffect(() => { drawerModeRef.current = drawerMode; }, [drawerMode]);
  const [noteText, setNoteText] = useState('');
  const drawerAnim = useRef(new Animated.Value(0)).current;
  // Extra height (px) added on top of each drawer's base height when the user
  // drags its handle upward — lets it expand toward the top. In save mode the
  // base is the 75%-screen height; in toolbar mode it's the measured peek
  // (tools-only) height, so dragging up reveals the recent-saves list beneath.
  const drawerExtraHeight = useRef(new Animated.Value(0)).current;
  // Plain-JS mirror of drawerExtraHeight's current value (Animated.Value has
  // no public synchronous getter) — lets each new drag gesture continue from
  // wherever the toolbar drawer currently sits instead of always restarting
  // from 0, so it can be dragged up/down repeatedly in one session.
  const drawerExtraHeightValueRef = useRef(0);
  const setDrawerExtraHeight = useCallback((v: number) => {
    drawerExtraHeight.setValue(v);
    drawerExtraHeightValueRef.current = v;
  }, [drawerExtraHeight]);
  const lastTouchYRef = useRef(0);
  const { bookmarks, addBookmark, deleteBookmark } = useBookmarks();

  const handleShareSavedNote = useCallback(() => {
    if (!savedNoteSheet) return;
    const verseText = getVersesText(savedNoteSheet.bookId, savedNoteSheet.anchor, savedNoteSheet.paragraph, savedNoteSheet.verses ?? []);
    const message = verseText ? `${verseText}\n\n${savedNoteSheet.notation}` : `${savedNoteSheet.notation} — ${savedNoteSheet.note}`;
    Share.share({ message });
  }, [savedNoteSheet]);

  const handleDeleteSavedNote = useCallback(() => {
    if (!savedNoteSheet) return;
    deleteBookmark(savedNoteSheet.id);
    if (Platform.OS === 'android') ToastAndroid.show('Eliminado', ToastAndroid.SHORT);
    closeSavedNoteSheet();
  }, [savedNoteSheet, deleteBookmark, closeSavedNoteSheet]);

  const openDrawer = useCallback(() => {
    setDrawerExtraHeight(0);
    setDrawerVisible(true);
    requestAnimationFrame(() => {
      Animated.timing(drawerAnim, { toValue: 1, duration: 260, useNativeDriver: true }).start();
    });
  }, [drawerAnim, setDrawerExtraHeight]);

  const closeDrawer = useCallback(() => {
    Animated.timing(drawerAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setDrawerVisible(false);
      setDrawerMode('toolbar');
      setNoteText('');
      setDrawerExtraHeight(0);
    });
  }, [drawerAnim, setDrawerExtraHeight]);

  const toggleVerse = useCallback((verseKey: string) => {
    setSelectedVerses(prev => {
      const next = new Set(prev);
      if (next.has(verseKey)) next.delete(verseKey);
      else next.add(verseKey);
      selectedVersesRef.current = next;
      if (prev.size === 0 && next.size > 0) openDrawer();
      else if (prev.size > 0 && next.size === 0) closeDrawer();
      return next;
    });
  }, [openDrawer, closeDrawer]);

  const recordVerseBlockLayout = useCallback((blockKey: number, e: LayoutChangeEvent) => {
    verseBlockLayouts.current.set(blockKey, { y: e.nativeEvent.layout.y, height: e.nativeEvent.layout.height });
  }, []);

  const clearVerseSelection = useCallback(() => {
    selectedVersesRef.current = new Set();
    setSelectedVerses(new Set());
    closeDrawer();
  }, [closeDrawer]);

  // Returns from the save-verses drawer back to the selection-toolbar drawer
  // (verse selection stays intact) — used by both the hardware back button
  // and a downward drag past the threshold while in save mode.
  const handleBackToToolbar = useCallback(() => {
    Animated.timing(drawerAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setDrawerMode('toolbar');
      setNoteText('');
      setDrawerExtraHeight(0);
      requestAnimationFrame(() => {
        Animated.timing(drawerAnim, { toValue: 1, duration: 260, useNativeDriver: true }).start();
      });
    });
  }, [drawerAnim, setDrawerExtraHeight]);

  // Resting ("peek") height of the toolbar drawer — content height plus the
  // device's bottom safe-area inset, so SafeAreaView's own inset padding
  // doesn't eat into the tools' budget and get squeezed under the nav bar.
  const toolbarBaseHeight = TOOLBAR_PEEK_CONTENT_HEIGHT + bottomInset;

  // The drag PanResponder below is created once via useRef and never
  // recreated, so its callbacks close over whatever these values were on
  // that first render. Mirroring the latest values into refs (synced every
  // render) keeps the drag math correct even if screen/inset dimensions
  // change later (rotation, split-screen) — and, on the JS/Fast-Refresh
  // side, is what actually makes edits to the height-cap logic below take
  // effect without a full reload.
  const screenHeightRef = useRef(screenHeight);
  const topInsetRef = useRef(topInset);
  const toolbarBaseHeightRef = useRef(toolbarBaseHeight);
  useEffect(() => {
    screenHeightRef.current = screenHeight;
    topInsetRef.current = topInset;
    toolbarBaseHeightRef.current = toolbarBaseHeight;
  });

  // Drag-to-dismiss anywhere on the drawer's non-interactive surface. Writes
  // directly into drawerAnim (rather than a separate offset) so a partial
  // drag blends seamlessly into openDrawer/closeDrawer's own animation of
  // the same value. Dragging up instead expands the drawer's height (via
  // drawerExtraHeight): toolbar mode tops out at 75% of the screen (matching
  // the save drawer's own resting height), save mode reaches all the way to
  // 100%. Each new drag picks up from wherever it currently sits (via
  // incremental per-frame deltas) so it can be dragged up/down repeatedly
  // within one session. On release, any net downward pull anchors it back to
  // the resting height (tools peek in toolbar mode, 75%-screen in save
  // mode); a net upward drag leaves it wherever it was released.
  const DRAWER_CLOSE_THRESHOLD = 100;
  const baseHeightFor = (mode: 'toolbar' | 'save') => (mode === 'save' ? screenHeightRef.current * 0.75 : toolbarBaseHeightRef.current);
  const maxTotalHeightFor = (mode: 'toolbar' | 'save') => (mode === 'toolbar' ? screenHeightRef.current * 0.75 : screenHeightRef.current - topInsetRef.current);
  const maxExtraFor = (mode: 'toolbar' | 'save') => Math.max(0, maxTotalHeightFor(mode) - baseHeightFor(mode));
  const drawerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 4 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderGrant: (_, gesture) => {
        lastTouchYRef.current = gesture.y0;
      },
      onPanResponderMove: (_, gesture) => {
        const mode = drawerModeRef.current;
        // Toolbar mode, dragging up from peek: snap straight to its 75%
        // resting height (like tapping "Guardar" does for the save drawer)
        // instead of continuously tracking the finger — an upward drag is a
        // reveal trigger, not a proportional slider.
        if (mode === 'toolbar' && drawerExtraHeightValueRef.current === 0 && gesture.dy < 0) {
          lastTouchYRef.current = gesture.moveY;
          const max = maxExtraFor('toolbar');
          setDrawerExtraHeight(max);
          Animated.spring(drawerExtraHeight, { toValue: max, useNativeDriver: false }).start();
          return;
        }
        // Already expanded, or actively dragging upward: adjust the extra
        // (reveal) height, relative to wherever it currently is.
        if (drawerExtraHeightValueRef.current > 0 || gesture.dy < 0) {
          const deltaY = gesture.moveY - lastTouchYRef.current;
          lastTouchYRef.current = gesture.moveY;
          const max = maxExtraFor(mode);
          setDrawerExtraHeight(Math.max(0, Math.min(max, drawerExtraHeightValueRef.current - deltaY)));
          return;
        }
        lastTouchYRef.current = gesture.moveY;
        const fraction = Math.max(0, Math.min(1, 1 - gesture.dy / 500));
        drawerAnim.setValue(fraction);
      },
      onPanResponderRelease: (_, gesture) => {
        const mode = drawerModeRef.current;
        if (drawerExtraHeightValueRef.current > 0) {
          // Any net downward pull anchors back to the initial (peek) state,
          // regardless of how far up it had been dragged; a net upward drag
          // leaves it wherever it currently sits.
          if (gesture.dy >= 0) {
            setDrawerExtraHeight(0);
            Animated.spring(drawerExtraHeight, { toValue: 0, useNativeDriver: false }).start();
          }
          return;
        }
        if (gesture.dy > DRAWER_CLOSE_THRESHOLD) {
          if (mode === 'save') handleBackToToolbar();
          else clearVerseSelection();
        } else {
          Animated.spring(drawerAnim, { toValue: 1, useNativeDriver: true }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(drawerAnim, { toValue: 1, useNativeDriver: true }).start();
        setDrawerExtraHeight(0);
        Animated.spring(drawerExtraHeight, { toValue: 0, useNativeDriver: false }).start();
      },
    })
  ).current;

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (drawerModeRef.current === 'save') {
        handleBackToToolbar();
        return true;
      }
      if (selectedVersesRef.current.size > 0) {
        clearVerseSelection();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [clearVerseSelection, handleBackToToolbar]);

  // verseFraction (0..1): how far into this block the target verse sits,
  // estimated as (sentence index / sentence count) since RN can't measure an
  // individual inline text run's own layout. Used to keep a saved bookmark's
  // actual verse within the top half of the screen — breathing room above it
  // (e.g. preceding, unsaved sentences of the same paragraph) is fine, but
  // the verse itself must never land below the 50% mark.
  const handleAnchorLayout = useCallback((e: LayoutChangeEvent, scrollToTop = false, verseFraction: number | null = null) => {
    if (hasScrolled.current) return;
    hasScrolled.current = true;
    let y: number;
    if (scrollToTop) {
      y = 0;
    } else {
      const { y: blockY, height: blockHeight } = e.nativeEvent.layout;
      const defaultY = Math.max(0, blockY - 40);
      if (verseFraction != null) {
        const estimatedVerseY = blockY + verseFraction * blockHeight;
        const verseScreenPosition = estimatedVerseY - defaultY;
        y = verseScreenPosition > screenHeight * 0.5 ? Math.max(0, estimatedVerseY - screenHeight * 0.5) : defaultY;
      } else {
        y = defaultY;
      }
    }
    scrollRef.current?.scrollTo({ y, animated: false });
    // This programmatic jump-to-anchor isn't a user scroll gesture — sync
    // lastScrollY so the next onScroll's delta is ~0 instead of reading as a
    // big downward scroll and hiding the nav bar right on entry.
    lastScrollY.current = y;
  }, [screenHeight]);

  const recordChapterLayout = useCallback((block: ContentBlock, e: LayoutChangeEvent) => {
    const y = e.nativeEvent.layout.y;
    const positions = chapterPositions.current.filter(p => p.block !== block);
    positions.push({ y, block });
    positions.sort((a, b) => a.y - b.y);
    chapterPositions.current = positions;
  }, []);

  const recordSectionLayout = useCallback((block: ContentBlock, e: LayoutChangeEvent) => {
    const y = e.nativeEvent.layout.y;
    const positions = sectionPositions.current.filter(p => p.block !== block);
    positions.push({ y, block });
    positions.sort((a, b) => a.y - b.y);
    sectionPositions.current = positions;
  }, []);

  const [navBarHeight, setNavBarHeight] = useState(0);
  const navBarAnim = useRef(new Animated.Value(0)).current; // 0 = visible, 1 = hidden
  const navBarHiddenRef = useRef(false);
  const lastScrollY = useRef(0);

  const setNavBarHidden = useCallback((hidden: boolean) => {
    if (navBarHiddenRef.current === hidden) return;
    navBarHiddenRef.current = hidden;
    Animated.timing(navBarAnim, { toValue: hidden ? 1 : 0, duration: 220, useNativeDriver: true }).start();
  }, [navBarAnim]);

  const handleNavBarLayout = useCallback((e: LayoutChangeEvent) => {
    setNavBarHeight(e.nativeEvent.layout.height);
  }, []);

  useFocusEffect(
    useCallback(() => {
      navBarHiddenRef.current = false;
      lastScrollY.current = 0;
      navBarAnim.setValue(0);
    }, [navBarAnim])
  );

  const handleScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number } } }) => {
    const scrollY = e.nativeEvent.contentOffset.y;
    const midpoint = scrollY + screenHeight / 2;

    const delta = scrollY - lastScrollY.current;
    if (scrollY <= 0) {
      setNavBarHidden(false);
    } else if (delta > 8) {
      setNavBarHidden(true);
    } else if (delta < -8) {
      setNavBarHidden(false);
    }
    lastScrollY.current = scrollY;

    let foundChapter: ContentBlock | null = null;
    for (const pos of chapterPositions.current) {
      if (pos.y <= midpoint) foundChapter = pos.block;
      else break;
    }
    if (foundChapter !== activeChapterRef.current) {
      activeChapterRef.current = foundChapter;
      setScrolledChapterBlock(foundChapter);
    }

    let foundSection: ContentBlock | null = null;
    for (const pos of sectionPositions.current) {
      if (pos.y <= midpoint) foundSection = pos.block;
      else break;
    }
    // Discard section if it belongs to a previous chapter (its Y is before the current chapter's Y)
    if (foundSection && foundChapter) {
      const chapterY = chapterPositions.current.find(p => p.block === foundChapter)?.y ?? 0;
      const sectionY = sectionPositions.current.find(p => p.block === foundSection)?.y ?? 0;
      if (sectionY < chapterY) foundSection = null;
    }
    if (foundSection !== activeSectionRef.current) {
      activeSectionRef.current = foundSection;
      setScrolledSectionBlock(foundSection);
    }

    if (selectedVersesRef.current.size > 0) {
      const viewportTop = scrollY;
      const viewportBottom = scrollY + screenHeight;
      let changed = false;
      const next = new Set(selectedVersesRef.current);
      for (const verseKey of selectedVersesRef.current) {
        const blockKey = Number(verseKey.split(':')[0]);
        const layout = verseBlockLayouts.current.get(blockKey);
        if (!layout) continue;
        const blockBottom = layout.y + layout.height;
        if (blockBottom < viewportTop || layout.y > viewportBottom) {
          next.delete(verseKey);
          changed = true;
        }
      }
      if (changed) {
        selectedVersesRef.current = next;
        setSelectedVerses(next);
        if (next.size === 0) closeDrawer();
      }
    }
  }, [screenHeight, closeDrawer]);



const SUPERSCRIPT: Record<string, string> = {
  '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹',
};
const SUPERSCRIPT_ALPHA: Record<string, string> = {
  'a':'ᵃ','b':'ᵇ','c':'ᶜ','d':'ᵈ','e':'ᵉ','f':'ᶠ','g':'ᵍ','h':'ʰ',
  'i':'ⁱ','j':'ʲ','k':'ᵏ','l':'ˡ','m':'ᵐ','n':'ⁿ','o':'ᵒ','p':'ᵖ',
  'r':'ʳ','s':'ˢ','t':'ᵗ','u':'ᵘ','v':'ᵛ','w':'ʷ','x':'ˣ','y':'ʸ','z':'ᶻ',
};
function toSuperscript(n: number | string): string {
  if (typeof n === 'string') return SUPERSCRIPT_ALPHA[n] ?? n;
  return String(n).split('').map(d => SUPERSCRIPT[d]).join('');
}

const NT_NOTES: Record<string, string> = {
  unicidad: 'A la palabra "unicidad", que de acuerdo con el Diccionario de la Real Academia Española significa "calidad de único", se le ha dado aquí un nuevo significado. En la presente obra se ha utilizado "unicidad" exclusivamente para traducir la palabra inglesa "oneness" en su acepción de: "calidad, estado o hecho de ser uno".',
  impecables: 'La palabra "impecable" no tiene aquí el significado más usual de "intachable, irreprochable", sino el más literal de "sin pecado".',
  impecablemente: 'La palabra "impecable" no tiene aquí el significado más usual de "intachable, irreprochable", sino el más literal de "sin pecado".',
  impecabilidad: 'La palabra "impecable" no tiene aquí el significado más usual de "intachable, irreprochable", sino el más literal de "sin pecado".',
  impecable: 'La palabra "impecable" no tiene aquí el significado más usual de "intachable, irreprochable", sino el más literal de "sin pecado".',
  especialismo: 'Se ha utilizado "especialismo" para traducir el término inglés "specialness", cuyo significado es "la calidad, condición, estado o deseo de ser especial".',
};

function extractSectionLabel(title: string): string {
  const m = title.match(/^([IVX]+|[A-Z]|[0-9]+)\./);
  if (!m) return '';
  return `Secc. ${m[1].toUpperCase()}`;
}

// Builds a case/accent-folded copy of `text` where each entry lines up 1:1
// with `chars` (text split by code point), so match ranges found in the
// normalized string can be sliced straight back out of the original.
function normalizeForHighlight(text: string): { normalized: string; chars: string[] } {
  const chars = Array.from(text);
  const normalized = chars
    .map((ch) => {
      const stripped = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return (stripped[0] ?? ch).toLowerCase();
    })
    .join('');
  return { normalized, chars };
}

function isWordChar(ch: string | undefined): boolean {
  return !!ch && /[\p{L}\p{N}]/u.test(ch);
}

// Finds whole-word matches for each (already-normalized) term, mirroring
// FTS5's prefix-match semantics: a term matches any word that *starts* with
// it, and the whole word gets highlighted — not just the typed prefix.
function findHighlightRanges(normalized: string, terms: string[]): [number, number][] {
  const ranges: [number, number][] = [];
  for (const term of terms) {
    if (!term) continue;
    let from = 0;
    let idx: number;
    while ((idx = normalized.indexOf(term, from)) !== -1) {
      from = idx + 1;
      if (isWordChar(normalized[idx - 1])) continue; // mid-word, not a token start
      let end = idx + term.length;
      while (isWordChar(normalized[end])) end++;
      ranges.push([idx, end]);
    }
  }
  if (!ranges.length) return ranges;
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [ranges[0]];
  for (const [s, e] of ranges.slice(1)) {
    const last = merged[merged.length - 1];
    if (s <= last[1]) last[1] = Math.max(last[1], e);
    else merged.push([s, e]);
  }
  return merged;
}

function highlightText(
  text: string,
  terms: string[],
  keyPrefix: string,
  boldFontFamily = 'Lora_700Bold'
): (string | React.ReactElement)[] {
  if (!terms.length) return [text];
  const { normalized, chars } = normalizeForHighlight(text);
  const ranges = findHighlightRanges(normalized, terms);
  if (!ranges.length) return [text];
  const out: (string | React.ReactElement)[] = [];
  let cursor = 0;
  ranges.forEach(([s, e], idx) => {
    if (s > cursor) out.push(chars.slice(cursor, s).join(''));
    out.push(<Text key={`${keyPrefix}-${idx}`} style={{ fontFamily: boldFontFamily }}>{chars.slice(s, e).join('')}</Text>);
    cursor = e;
  });
  if (cursor < chars.length) out.push(chars.slice(cursor).join(''));
  return out;
}

function renderInline(
  text: string,
  onNt?: (word: string, note: string) => void,
  highlightTerms: string[] = NO_HIGHLIGHT_TERMS
): (string | React.ReactElement)[] {
  const parts = text.split(/(\*\*_[^_]+_\*\*|\*\*[^*]+\*\*|_[^_]+_|\{NT:[^}]+\})/);
  return parts.flatMap((part, i) => {
    if (part.startsWith('**_') && part.endsWith('_**')) {
      return <Text key={i} style={{ fontFamily: 'Lora_700Bold_Italic' }}>{part.slice(3, -3)}</Text>;
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <Text key={i} style={{ fontFamily: 'Lora_700Bold' }}>{part.slice(2, -2)}</Text>;
    }
    if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
      return <Text key={i} style={styles.italic}>{part.slice(1, -1)}</Text>;
    }
    if (part.startsWith('{NT:') && part.endsWith('}')) {
      const word = part.slice(4, -1);
      const note = NT_NOTES[word.toLowerCase()];
      return (
        <Text key={i} style={styles.ntWord} onPress={note && onNt ? () => onNt(word, note) : undefined}>
          {word}
        </Text>
      );
    }
    return highlightText(part, highlightTerms, `hl-${i}`);
  });
}

  const bookBlocks = useMemo(() => {
    const key = resolveContentKey(bookId, anchor);
    return (CONTENT[key] ?? []) as ContentBlock[];
  }, [bookId, anchor]);

  // When a search result links here with a paragraph number, scroll past the
  // section/lesson heading straight to that paragraph's own text block —
  // otherwise landing on the section start is only correct by coincidence.
  const scrollTargetBlock = useMemo(() => {
    if (!anchor) return null;
    const anchorIdx = bookBlocks.findIndex(b => b.anchor === anchor);
    if (anchorIdx < 0) return null;
    const paragraphNum = paragraphParam ? Number(paragraphParam) : NaN;
    if (!Number.isNaN(paragraphNum)) {
      for (let i = anchorIdx + 1; i < bookBlocks.length; i++) {
        const b = bookBlocks[i];
        if (b.anchor != null) break; // next section/chapter/lesson boundary
        if (b.type === 'text' && b.paragraph === paragraphNum) return b;
      }
    }
    return bookBlocks[anchorIdx];
  }, [bookBlocks, anchor, paragraphParam]);

  // Landing here from a saved bookmark (exact verses in the URL) — pre-select
  // those verses so they show the same underline a live selection gets, and
  // open the toolbar drawer so the user can act on them right away.
  useEffect(() => {
    if (!versesParam || !scrollTargetBlock) return;
    const blockIdx = bookBlocks.indexOf(scrollTargetBlock);
    if (blockIdx < 0) return;
    const verseSet = new Set(versesParam.split(',').map(Number));
    const keys = new Set<string>();
    scrollTargetBlock.sentences?.forEach((s, si) => {
      if (verseSet.has(s.verse)) keys.add(`${blockIdx}:${si}`);
    });
    if (keys.size > 0) {
      selectedVersesRef.current = keys;
      setSelectedVerses(keys);
      openDrawer();
    }
  }, [bookBlocks, scrollTargetBlock, versesParam, openDrawer]);

  // Every verse that belongs to a saved bookmark gets a yellow highlight —
  // independent of how the reader was entered (index, search, or a bookmark
  // link) and independent of the live selection (underline) above, so users
  // can spot previously saved passages without opening the bookmarks list.
  // Mirrors the anchor/paragraph lookup above: find the section/chapter
  // block matching the bookmark's anchor, then scan forward to the block
  // sharing its paragraph number, stopping at the next anchored heading.
  // Maps back to the owning bookmark (not just a boolean) so tapping a
  // highlighted verse can open that bookmark's saved note.
  const savedVerseMap = useMemo(() => {
    const map = new Map<string, SavedBookmark>();
    for (const bm of bookmarks) {
      if (bm.bookId !== bookId || bm.verses.length === 0) continue;
      const anchorIdx = bookBlocks.findIndex(b => b.anchor === bm.anchor);
      if (anchorIdx < 0) continue;
      const verseSet = new Set(bm.verses);
      for (let i = anchorIdx + 1; i < bookBlocks.length; i++) {
        const b = bookBlocks[i];
        if (b.anchor != null) break;
        if (b.paragraph === bm.paragraph) {
          b.sentences?.forEach((s, si) => {
            if (verseSet.has(s.verse)) map.set(`${i}:${si}`, bm);
          });
        }
      }
    }
    return map;
  }, [bookmarks, bookBlocks, bookId]);

  // A saved verse opens its note sheet on tap rather than joining the live
  // selection — the two interactions (viewing vs. selecting-to-act-on) would
  // otherwise be indistinguishable from the same tap.
  const handleVersePress = useCallback((verseKey: string) => {
    const bookmark = savedVerseMap.get(verseKey);
    if (bookmark) openSavedNoteSheet(bookmark);
    else toggleVerse(verseKey);
  }, [savedVerseMap, openSavedNoteSheet, toggleVerse]);

  useEffect(() => {
    setScrolledChapterBlock(null);
    setScrolledSectionBlock(null);
    activeChapterRef.current = null;
    activeSectionRef.current = null;
  }, [anchor]);

  const navChapterBlock = useMemo(() => {
    if (scrolledChapterBlock) return scrolledChapterBlock;
    let last: ContentBlock | null = null;
    for (const b of bookBlocks) {
      if (b.type === 'chapter-heading' || b.type === 'lesson-heading' || b.type === 'lesson-set-heading') last = b;
      if (anchor && b.anchor === anchor) break;
    }
    // Anchor may point to a skipped group heading (e.g. workbook-part1-lessons1-50).
    // Fall back to the first lesson/chapter heading in the file.
    if (!last) last = bookBlocks.find(b => b.type === 'chapter-heading' || b.type === 'lesson-heading') ?? null;
    return last;
  }, [bookBlocks, anchor, scrolledChapterBlock]);

  const navSectionBlock = useMemo(() => {
    if (scrolledSectionBlock) return scrolledSectionBlock;
    let last: ContentBlock | null = null;
    let anchorIdx = -1;
    for (let i = 0; i < bookBlocks.length; i++) {
      const b = bookBlocks[i];
      if (b.type === 'chapter-heading' || b.type === 'lesson-heading' || b.type === 'lesson-set-heading') last = null;
      if (b.type === 'section-heading') last = b;
      if (anchor && b.anchor === anchor) { anchorIdx = i; break; }
    }
    // No section precedes the anchor — peek forward to find the first section.
    // Stop if body text appears first (chapter has an intro, so no default section).
    if (!last && anchorIdx >= 0) {
      for (let i = anchorIdx + 1; i < bookBlocks.length; i++) {
        const b = bookBlocks[i];
        if (b.type === 'chapter-heading' || b.type === 'lesson-heading') break;
        if (b.type === 'section-heading') { last = b; break; }
        if (b.type === 'text' || b.type === 'stanza') break;
      }
    }
    return last;
  }, [bookBlocks, anchor, scrolledSectionBlock]);

  // Resolves the current verse selection into a citation ("T-26.IV.4:7") and
  // the section-level anchor/paragraph the bookmark should reopen at — reuses
  // the search feature's own formatRouteId so citations stay consistent with
  // the rest of the app. Selection can span multiple blocks; only the first
  // selected block's paragraph/verse range is cited (matches how ACIM
  // citations only ever reference a single paragraph's verse range).
  const buildSelectionNotation = useCallback((): { anchor: string; paragraph: number; notation: string; name: string; verses: number[] } | null => {
    let minBlockIdx = Infinity;
    let paragraph: number | null = null;
    let verseMin = Infinity;
    let verseMax = -Infinity;
    let verseSet = new Set<number>();
    for (const verseKey of selectedVersesRef.current) {
      const [blockIdxStr, sentIdxStr] = verseKey.split(':');
      const blockIdx = Number(blockIdxStr);
      const block = bookBlocks[blockIdx];
      if (!block || block.paragraph == null) continue;
      if (blockIdx < minBlockIdx) {
        minBlockIdx = blockIdx;
        paragraph = block.paragraph;
        verseMin = Infinity;
        verseMax = -Infinity;
        verseSet = new Set<number>();
      }
      if (blockIdx === minBlockIdx) {
        const verse = block.sentences?.[Number(sentIdxStr)]?.verse;
        if (verse != null) {
          verseMin = Math.min(verseMin, verse);
          verseMax = Math.max(verseMax, verse);
          verseSet.add(verse);
        }
      }
    }
    if (paragraph == null) return null;

    let searchBook = bookId;
    if (bookId === 'supplement') {
      searchBook = navChapterBlock?.anchor?.startsWith('supplement-song') ? 'song' : 'psychotherapy';
    }
    const lessonMatch = navChapterBlock?.type === 'lesson-heading' ? navChapterBlock.anchor?.match(/^workbook-l(\d+)$/) : null;

    const result: SearchResult = {
      book: searchBook,
      chapterAnchor: navChapterBlock?.anchor ?? null,
      chapterTitle: navChapterBlock?.title ?? null,
      sectionAnchor: navSectionBlock?.anchor ?? null,
      sectionTitle: navSectionBlock?.title ?? null,
      lessonAnchor: navChapterBlock?.type === 'lesson-heading' ? navChapterBlock.anchor ?? null : null,
      lessonTitle: null,
      lessonNumber: lessonMatch ? Number(lessonMatch[1]) : null,
      paragraph,
      verseStart: verseMin === Infinity ? null : verseMin,
      verseEnd: verseMax === -Infinity ? null : verseMax,
      anchor: anchor ?? null,
      text: '',
      snippet: '',
    };

    // A section's own title already carries its name (e.g. "IV. La invitación
    // al Espíritu Santo"). Lessons/sets have no sections — their heading's
    // title is just a number/range ("Lección 1", "(221-230)"), so the actual
    // name lives in its subtitle instead.
    const name = navSectionBlock?.title ?? navChapterBlock?.subtitle ?? navChapterBlock?.title ?? '';

    return {
      anchor: navSectionBlock?.anchor ?? navChapterBlock?.anchor ?? anchor ?? '',
      paragraph,
      notation: formatRouteId(result),
      name,
      verses: [...verseSet].sort((a, b) => a - b),
    };
  }, [bookBlocks, bookId, anchor, navChapterBlock, navSectionBlock]);

  const handleShareSelection = useCallback(() => {
    const resolved = buildSelectionNotation();
    if (!resolved) return;
    const verseText = getVersesText(bookId, resolved.anchor, resolved.paragraph, resolved.verses);
    const message = verseText ? `${verseText}\n\n${resolved.notation}` : resolved.notation;
    Share.share({ message });
  }, [buildSelectionNotation, bookId]);

  const handleSaveTapped = useCallback(() => {
    Animated.timing(drawerAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setDrawerMode('save');
      setDrawerExtraHeight(0);
      requestAnimationFrame(() => {
        Animated.timing(drawerAnim, { toValue: 1, duration: 260, useNativeDriver: true }).start();
      });
    });
  }, [drawerAnim, setDrawerExtraHeight]);

  const handleSubmitNote = useCallback(() => {
    if (!noteText.trim()) return;
    const resolved = buildSelectionNotation();
    if (resolved) {
      addBookmark({ bookId: bookId as SavedBookId, anchor: resolved.anchor, paragraph: resolved.paragraph, notation: resolved.notation, name: resolved.name, note: noteText.trim(), verses: resolved.verses });
    }
    Animated.timing(drawerAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setDrawerVisible(false);
      setDrawerMode('toolbar');
      setNoteText('');
      setDrawerExtraHeight(0);
      selectedVersesRef.current = new Set();
      setSelectedVerses(new Set());
    });
    if (Platform.OS === 'android') ToastAndroid.show('Guardado', ToastAndroid.SHORT);
  }, [noteText, buildSelectionNotation, addBookmark, bookId, drawerAnim, setDrawerExtraHeight]);

  const recentBookmarks = useMemo(
    () => [...bookmarks].sort((a, b) => b.date.localeCompare(a.date)),
    [bookmarks]
  );

  // Shared between the toolbar and save drawers so both can list recent saves.
  const recentBookmarksSection = recentBookmarks.length > 0 ? (
    <View style={styles.saveDrawerFullBleed}>
      <View style={styles.saveDrawerListHeader} {...drawerPanResponder.panHandlers}>
        <Text style={[styles.saveDrawerListHeaderText, { color: t.fontColorGray }]}>Guardados recientes</Text>
      </View>
      <ScrollView style={styles.saveDrawerList} keyboardShouldPersistTaps="handled">
        {recentBookmarks.map(item => (
          <SavedItemRow
            key={item.id}
            item={item}
            onPress={() => {
              if (navigating) return;
              setNavigating(true);
              startLoadBar();
              // Drawer stays open (not animated closed) until the saved
              // item's screen actually opens, per its own transition.
              setTimeout(() => router.push(bookmarkHref(item)), 200);
            }}
          />
        ))}
      </ScrollView>
    </View>
  ) : null;

  const navTitle = useMemo(() => {
    if (!scrolledChapterBlock) {
      // Repaso intro (anchor = workbook-part1-review1-intro etc.)
      if (/^workbook-part1-review\d+-intro$/.test(anchor ?? '')) {
        const group = bookBlocks.find(b => b.type === 'lesson-group-heading');
        if (group?.title) return toTitleCase(group.title);
      }
      // Part II intro
      if (anchor === 'workbook-part2-intro') return 'Parte II';
      // Workbook (Part I) overall intro
      if (anchor === 'workbook-intro') return 'Parte I';
    }
    // Workbook (Part I) overall intro stays "Parte I" regardless of scroll position —
    // it isn't thematically part of the "Lecciones 1 al 50" group it happens to be bundled with.
    if (scrolledChapterBlock?.anchor === 'workbook-intro') return 'Parte I';
    // Part II intro stays "Parte II" regardless of scroll position — its file has no
    // lesson-group-heading for the generic rule below to fall back on, so it would
    // otherwise collapse to the raw chapter title ("Introducción").
    if (scrolledChapterBlock?.anchor === 'workbook-part2-intro') return 'Parte II';
    // When user scrolls into "Introducción" in a Repaso file, keep group heading as title
    if (scrolledChapterBlock?.type === 'chapter-heading') {
      const group = bookBlocks.find(b => b.type === 'lesson-group-heading');
      if (group?.title) return toTitleCase(group.title);
    }
    // Part II set intro/heading (scroll-driven or static via navChapterBlock)
    if (navChapterBlock?.type === 'lesson-set-heading') {
      const setMatch = navChapterBlock.anchor?.match(/^workbook-part2-set(\d+)$/);
      if (setMatch && navChapterBlock.subtitle) return `${setMatch[1]}. ${toTitleCase(navChapterBlock.subtitle)}`;
      return toTitleCase(navChapterBlock.subtitle ?? navChapterBlock.title ?? '');
    }
    if (!navChapterBlock) return '';
    if (navChapterBlock.type === 'lesson-heading') {
      return navChapterBlock.title ?? '';
    }
    if (bookId === 'mft' && navChapterBlock.type === 'chapter-heading') {
      const a = navChapterBlock.anchor ?? '';
      if (a.startsWith('supplement-mft-clarification') || a === 'supplement-mft-epilogo') {
        return 'Clarificación de Términos';
      }
      if (navChapterBlock.subtitle) return navChapterBlock.title ?? '';
    }
    if (bookId === 'supplement' && navChapterBlock.type === 'chapter-heading') {
      const a = navChapterBlock.anchor ?? '';
      if (a === 'supplement-psycho-intro' || a === 'supplement-psycho-ch1' || a === 'supplement-anexo') {
        let parentTitle = '';
        for (const b of bookBlocks) {
          if (b.type === 'book-heading' || b.type === 'part-heading') parentTitle = b.title ?? '';
          if (b.anchor === a) break;
        }
        return toTitleCase(parentTitle || (navChapterBlock.title ?? ''));
      }
      return toTitleCase(navChapterBlock.title ?? '');
    }
    if (navChapterBlock.subtitle) {
      const num = navChapterBlock.title?.match(/\d+/)?.[0] ?? '';
      return num
        ? `${num}. ${toTitleCase(navChapterBlock.subtitle)}`
        : toTitleCase(navChapterBlock.subtitle);
    }
    return toTitleCase(navChapterBlock.title ?? '');
  }, [navChapterBlock, bookBlocks, anchor, scrolledChapterBlock]);

  const navSubtitle = useMemo(() => {
    if (!scrolledChapterBlock) {
      if (/^workbook-part1-review\d+-intro$/.test(anchor ?? '')) return 'Introducción';
      if (anchor === 'workbook-part2-intro') return 'Introducción';
      if (anchor === 'workbook-intro') return 'Introducción';
    }
    // Workbook (Part I) overall intro — subtitle stays "Introducción" regardless of scroll position
    if (scrolledChapterBlock?.anchor === 'workbook-intro') return 'Introducción';
    // Part II intro — subtitle stays "Introducción" regardless of scroll position
    if (scrolledChapterBlock?.anchor === 'workbook-part2-intro') return 'Introducción';
    // When scrolled into "Introducción" chapter in a Repaso file
    if (scrolledChapterBlock?.type === 'chapter-heading') {
      const group = bookBlocks.find(b => b.type === 'lesson-group-heading');
      if (group) return 'Introducción';
    }
    // Part II set intro/heading
    if (navChapterBlock?.type === 'lesson-set-heading') return 'Introducción';
    if (navChapterBlock?.type === 'lesson-heading') {
      return navChapterBlock.subtitle ?? '';
    }
    if (bookId === 'mft' && navChapterBlock?.type === 'chapter-heading') {
      const a = navChapterBlock.anchor ?? '';
      if (a.startsWith('supplement-mft-clarification') || a === 'supplement-mft-epilogo') {
        return navChapterBlock.title ?? '';
      }
      if (navChapterBlock.subtitle) return navChapterBlock.subtitle;
    }
    if (bookId === 'supplement' && navChapterBlock?.type === 'chapter-heading') {
      const a = navChapterBlock.anchor ?? '';
      if (a === 'supplement-psycho-intro' || a === 'supplement-psycho-ch1' || a === 'supplement-anexo') return navChapterBlock.title ?? '';
      const section = scrolledChapterBlock ? scrolledSectionBlock : navSectionBlock;
      return section?.title ?? '';
    }
    if (!navSectionBlock) return '';
    return toTitleCase(navSectionBlock.title ?? '');
  }, [navChapterBlock, navSectionBlock, anchor, scrolledChapterBlock, scrolledSectionBlock, bookBlocks]);

  const anchorToSave = useMemo(() =>
    scrolledSectionBlock?.anchor
    ?? scrolledChapterBlock?.anchor
    ?? navSectionBlock?.anchor
    ?? navChapterBlock?.anchor
    ?? anchor,
  [scrolledSectionBlock, scrolledChapterBlock, navSectionBlock, navChapterBlock, anchor]);

  const breadcrumbToSave = useMemo((): string => {
    const chAnchor = (scrolledChapterBlock ?? navChapterBlock)?.anchor ?? anchor;

    let book: string;
    if (bookId === 'theory') book = 'Texto';
    else if (bookId === 'workbook') book = 'Ejercicios';
    else if (bookId === 'mft') book = 'Manual';
    else if (chAnchor.includes('supplement-song') || anchor.includes('supplement-song')) book = 'Canto';
    else if (chAnchor.includes('supplement-psycho') || anchor.includes('supplement-psycho')) book = 'Psicoterapia';
    else book = 'Suplementos';

    let part2: string | null = null;
    let part3: string | null = null;

    if (bookId === 'theory') {
      const t = navChapterBlock?.title ?? '';
      const capNum = t.match(/^cap[íi]tulo\s+(\d+)/i)?.[1];
      part2 = capNum ? `Cap. ${capNum}` : (t ? toTitleCase(t) : null);
      const sl = navSectionBlock?.title ? extractSectionLabel(navSectionBlock.title) : '';
      if (sl) part3 = sl;

    } else if (bookId === 'workbook') {
      if (anchor === 'workbook-epilogue') {
        part2 = 'Epílogo';
      } else if (anchor === 'workbook-part2-intro') {
        part2 = 'Parte II';
      } else if (navChapterBlock?.type === 'lesson-heading') {
        const num = navChapterBlock.title?.match(/\d+/)?.[0];
        if (num) part2 = `Lección ${num}`;
      } else if (navChapterBlock?.type === 'lesson-set-heading') {
        part2 = navChapterBlock.anchor === 'workbook-part2-final'
          ? 'Lecciones 361 - 365'
          : (navTitle || null);
      } else if (navChapterBlock?.type === 'chapter-heading') {
        const t = navChapterBlock.title ?? '';
        // navTitle is overridden by the group heading when inside a Repaso file
        if (navTitle && navTitle !== toTitleCase(t)) {
          part2 = navTitle;
        } else {
          part2 = toTitleCase(t);
        }
      }

    } else if (bookId === 'mft') {
      const mftAnchor = navChapterBlock?.anchor ?? '';
      if (mftAnchor === 'supplement-mft-epilogo') {
        part2 = 'Epílogo';
      } else if (mftAnchor.startsWith('supplement-mft-clarification')) {
        part2 = 'Clarificación';
        const termNum = (navSubtitle || '').match(/^(\d+)\./)?.[1];
        if (termNum) part3 = `Cap. ${termNum}`;
      } else if (navChapterBlock?.type === 'chapter-heading') {
        const t = navChapterBlock.title ?? '';
        const capNum = t.match(/^cap[íi]tulo\s+(\d+)/i)?.[1];
        part2 = capNum ? `Cap. ${capNum}` : (t ? toTitleCase(t) : null);
        const sl = navSectionBlock?.title ? extractSectionLabel(navSectionBlock.title) : '';
        if (sl) part3 = sl;
      }

    } else {
      // supplement
      if (chAnchor === 'supplement-anexo' || anchor === 'supplement-anexo') {
        part2 = 'Anexo';
      } else if (navChapterBlock?.type === 'chapter-heading') {
        const t = navChapterBlock.title ?? '';
        const numMatch = t.match(/^(\d+)\./);
        part2 = numMatch ? `Cap. ${numMatch[1]}` : (t ? toTitleCase(t) : null);
        const sl = navSectionBlock?.title ? extractSectionLabel(navSectionBlock.title) : '';
        if (sl) part3 = sl;
      }
    }

    return [book, part2, part3].filter(Boolean).join(' · ');
  }, [bookId, navChapterBlock, navSectionBlock, navTitle, navSubtitle, anchor, scrolledChapterBlock]);

  const titleToSave = useMemo(() => navSubtitle || navTitle || '', [navSubtitle, navTitle]);

  useEffect(() => {
    if (!bookId) return;
    saveLastRead({ bookId, anchor: anchorToSave, breadcrumb: breadcrumbToSave, title: titleToSave });
  }, [bookId, anchorToSave, breadcrumbToSave, titleToSave]);

  const isChapterFile = useMemo(() => /^theory-ch\d+$/.test(resolveContentKey(bookId, anchor)), [bookId, anchor]);

  const rootChapterAnchor = useMemo(() =>
    bookBlocks.find(b => b.type === 'chapter-heading')?.anchor ?? null,
  [bookBlocks]);

  const currentContentKey = useMemo(() => resolveContentKey(bookId, anchor), [bookId, anchor]);
  const nextContentKey = useMemo(() => {
    const seq = BOOK_SEQUENCES[bookId] ?? [];
    const idx = seq.indexOf(currentContentKey);
    return idx >= 0 && idx < seq.length - 1 ? seq[idx + 1] : null;
  }, [bookId, currentContentKey]);

  const visibleBlocks = useMemo(() => {
    const result: { block: ContentBlock; mt: number; key: number; numbered: boolean }[] = [];
    let numbered = false;
    for (let i = 0; i < bookBlocks.length; i++) {
      const block = bookBlocks[i];
      if ((block as any)._comment) continue;
      if (block.type === 'lesson-group-heading' && !/workbook-part1-review/.test(block.anchor ?? '')) continue;
      if (block.type === 'book-heading' && isChapterFile) continue;
      if (block.type === 'chapter-heading' && block.anchor !== 'theory-prefacio') numbered = true;
      if (block.type === 'lesson-set-heading') numbered = true;
      if (block.type === 'lesson-heading') numbered = true;
      const prevType = result.length > 0 ? result[result.length - 1].block.type : null;
      const baseMt = getMarginTop(block.type, prevType, result.length === 0);
      const mt = block.compact ? 2 : block.spaceBefore ? baseMt + 20 : baseMt;
      result.push({ block, mt, key: i, numbered });
    }
    return result;
  }, [bookBlocks, isChapterFile]);

  return (
    <SafeAreaView style={styles.topArea} edges={['top']}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={t.darkerBackgroundColor} />
      <Animated.View
        style={[
          styles.navBar,
          navBarHeight > 0 && {
            transform: [{
              translateY: navBarAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -navBarHeight] }),
            }],
          },
        ]}
        onLayout={handleNavBarLayout}
      >
        <View style={styles.navRow}>
          <View style={styles.navLeft}>
            <TertiaryButton hitSize={40} onPress={() => router.back()}>
              {(pressed) => <BackIcon size={16} color={pressed ? t.pressedIconColor : t.fontColorPrimary} />}
            </TertiaryButton>
            <View style={[styles.navMeta, !navSubtitle && { justifyContent: 'center' }]}>
              <Text style={[styles.navSection, !navSubtitle && styles.navSectionOnly]} numberOfLines={1}>{navTitle}</Text>
              {!!navSubtitle && <Text style={styles.navChapter} numberOfLines={1}>{navSubtitle}</Text>}
            </View>
          </View>
          <TertiaryButton hitSize={40} onPress={() => setTimeout(() => router.navigate('/home'), 100)}>
            {(pressed) => <HomeIcon size={16} color={pressed ? t.pressedIconColor : t.fontColorPrimary} />}
          </TertiaryButton>
        </View>
      </Animated.View>

      <AppScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: navBarHeight }]}
        onScroll={handleScroll}
      >
        {visibleBlocks.map(({ block, mt, key, numbered }) => {
          // Landing on a saved bookmark: estimate where the first saved verse
          // falls within this paragraph (by sentence position) so the scroll
          // can keep it within the top half of the screen even if it isn't
          // the paragraph's first sentence.
          const onLayout = block === scrollTargetBlock
            ? (e: LayoutChangeEvent) => {
                let verseFraction: number | null = null;
                if (versesParam && block.sentences?.length) {
                  const firstSavedVerse = Math.min(...versesParam.split(',').map(Number));
                  const idx = block.sentences.findIndex(s => s.verse === firstSavedVerse);
                  if (idx >= 0) verseFraction = idx / block.sentences.length;
                }
                handleAnchorLayout(e, false, verseFraction);
              }
            : undefined;
          switch (block.type) {

            case 'book-heading':
              return (
                <Text key={key} selectable style={[styles.bookHeading, { marginTop: mt }]} onLayout={onLayout}>
                  {block.title}
                </Text>
              );

            case 'part-heading':
              return (
                <Text key={key} selectable style={[styles.partHeading, { marginTop: mt }]} onLayout={onLayout}>
                  {block.title}
                </Text>
              );

            case 'chapter-heading': {
              const chapterLayout = (e: LayoutChangeEvent) => {
                recordChapterLayout(block, e);
                if (block === scrollTargetBlock) handleAnchorLayout(e, block.anchor === rootChapterAnchor);
              };
              const isSetIntro = /^workbook-part2-set\d+-intro$/.test(block.anchor ?? '');
              const fmt = (s: string) => bookId === 'mft' ? s : toTitleCase(s);
              return (
                <View key={key} style={{ marginTop: mt }} onLayout={chapterLayout}>
                  {block.subtitle ? (
                    <>
                      <Text selectable style={styles.chapterNumber}>{fmt(block.title ?? '')}</Text>
                      <Text selectable style={[styles.chapterHeading, { marginTop: 4 }]}>{fmt(block.subtitle ?? '')}</Text>
                    </>
                  ) : (
                    <Text selectable style={isSetIntro ? styles.chapterNumber : styles.chapterHeading}>{fmt(block.title ?? '')}</Text>
                  )}
                </View>
              );
            }

            case 'section-heading': {
              const sectionLayout = (e: LayoutChangeEvent) => {
                recordSectionLayout(block, e);
                if (block === scrollTargetBlock) handleAnchorLayout(e);
              };
              return (
                <Text key={key} selectable style={[styles.sectionHeading, { marginTop: mt }]} onLayout={sectionLayout}>
                  {block.title}
                </Text>
              );
            }

            case 'lesson-group-heading':
              return (
                <Text key={key} selectable style={[styles.lessonTitle, { marginTop: mt }]} onLayout={block === scrollTargetBlock ? (e) => handleAnchorLayout(e, true) : undefined}>
                  {block.title}
                </Text>
              );

            case 'lesson-set-heading': {
              const setLayout = (e: LayoutChangeEvent) => {
                recordChapterLayout(block, e);
                if (block === scrollTargetBlock) handleAnchorLayout(e, true);
              };
              if (block.anchor === 'workbook-part2-final') {
                return (
                  <Text key={key} selectable style={[styles.lessonTitle, { marginTop: mt }]} onLayout={setLayout}>
                    {block.subtitle}
                  </Text>
                );
              }
              return (
                <View key={key} style={{ marginTop: mt }} onLayout={setLayout}>
                  <Text selectable style={styles.lessonSetSubtitle}>{block.subtitle}</Text>
                </View>
              );
            }

            case 'lesson-heading': {
              const lessonLayout = (e: LayoutChangeEvent) => {
                recordChapterLayout(block, e);
                if (block === scrollTargetBlock) handleAnchorLayout(e);
              };
              return (
                <View key={key} style={{ marginTop: mt }} onLayout={lessonLayout}>
                  <Text selectable style={styles.lessonTitle}>{block.title}</Text>
                  {block.subtitle && (
                    <Text selectable style={[styles.lessonSubtitle, { marginTop: 4 }]}>{block.subtitle}</Text>
                  )}
                </View>
              );
            }

            case 'stanza': {
              const stSentences = block.sentences ?? [];
              const stHasLineBreaks = stSentences.some(s => s.newline);
              const stFont = (s: Sentence) =>
                s.bold && !s.italic ? 'Lora_700Bold' :
                s.bold &&  s.italic ? 'Lora_700Bold_Italic' :
                                      'Lora_400Regular_Italic';
              const stanzaHighlightTerms = block === scrollTargetBlock ? highlightTerms : NO_HIGHLIGHT_TERMS;
              const stanzaBlockLayout = (e: LayoutChangeEvent) => {
                recordVerseBlockLayout(key, e);
                onLayout?.(e);
              };
              if (stHasLineBreaks) {
                return (
                  <View key={key} style={[styles.stanzaBlock, { marginTop: mt }]} onLayout={stanzaBlockLayout}>
                    {stSentences.map((s, si) => {
                      const verseKey = `${key}:${si}`;
                      const selected = selectedVerses.has(verseKey);
                      const saved = savedVerseMap.has(verseKey);
                      return (
                        <Text
                          key={si}
                          selectable
                          onPress={() => handleVersePress(verseKey)}
                          style={[
                            styles.bodyLarge,
                            { fontFamily: stFont(s) },
                            s.spaceBefore && si > 0 && { marginTop: 20 },
                            saved && styles.verseSaved,
                            selected && styles.verseSelected,
                          ]}
                        >
                          {s.verse !== 1 && toSuperscript(s.verse)}
                          {renderInline(s.content, openNtSheet, stanzaHighlightTerms)}
                        </Text>
                      );
                    })}
                  </View>
                );
              }
              return (
                <Text key={key} selectable style={[styles.bodyLarge, styles.stanzaBlock, { marginTop: mt }]} onLayout={stanzaBlockLayout}>
                  {stSentences.map((s, si) => {
                    const verseKey = `${key}:${si}`;
                    const selected = selectedVerses.has(verseKey);
                    const saved = savedVerseMap.has(verseKey);
                    return (
                      <Text key={si} onPress={() => handleVersePress(verseKey)} style={[{ fontFamily: stFont(s) }, saved && styles.verseSaved, selected && styles.verseSelected]}>
                        {s.verse !== 1 && toSuperscript(s.verse)}
                        {renderInline(s.content, openNtSheet, stanzaHighlightTerms)}
                        {si < stSentences.length - 1 ? ' ' : ''}
                      </Text>
                    );
                  })}
                </Text>
              );
            }

            case 'text': {
              const sentences = block.sentences ?? [];
              const hasLineBreaks = sentences.some(s => s.newline);
              const textHighlightTerms = block === scrollTargetBlock ? highlightTerms : NO_HIGHLIGHT_TERMS;
              const textBlockLayout = (e: LayoutChangeEvent) => {
                recordVerseBlockLayout(key, e);
                onLayout?.(e);
              };
              if (hasLineBreaks) {
                // Each sentence gets its own line UNLESS inline:true, which attaches it to the previous line
                const lines: { sentences: { s: Sentence; oi: number }[]; spaceBefore: boolean }[] = [];
                sentences.forEach((s, oi) => {
                  if (s.inline && lines.length > 0) {
                    lines[lines.length - 1].sentences.push({ s, oi });
                  } else {
                    lines.push({ sentences: [{ s, oi }], spaceBefore: !!s.spaceBefore });
                  }
                });
                return (
                  <View key={key} style={{ marginTop: mt }} onLayout={textBlockLayout}>
                    {lines.map((line, li) => (
                      <Text key={li} selectable style={[
                        styles.bodyLarge,
                        line.spaceBefore && { marginTop: 20 },
                      ]}>
                        {li === 0 && numbered && block.paragraph != null && <Text style={styles.bodyLarge}>{block.paragraph}.{'  '}</Text>}
                        {line.sentences.map(({ s, oi }, si) => {
                          const verseKey = `${key}:${oi}`;
                          const selected = selectedVerses.has(verseKey);
                          const saved = savedVerseMap.has(verseKey);
                          return (
                            <Text
                              key={si}
                              onPress={() => handleVersePress(verseKey)}
                              style={[
                                s.bold && s.italic  ? { fontFamily: 'Lora_700Bold_Italic' } : undefined,
                                s.bold && !s.italic ? { fontFamily: 'Lora_700Bold' } : undefined,
                                !s.bold && s.italic ? { fontFamily: 'Lora_400Regular_Italic' } : undefined,
                                saved && styles.verseSaved,
                                selected && styles.verseSelected,
                              ]}
                            >
                              {s.verse !== 1 && toSuperscript(s.verse)}
                              {s.italic
                                ? highlightText(s.content, textHighlightTerms, `it-${si}`, 'Lora_700Bold_Italic')
                                : renderInline(s.content, openNtSheet, textHighlightTerms)}
                              {si < line.sentences.length - 1 ? ' ' : ''}
                            </Text>
                          );
                        })}
                      </Text>
                    ))}
                  </View>
                );
              }
              return (
                <Text key={key} selectable style={[styles.bodyLarge, { marginTop: mt }, block.indent && styles.stanzaBlock, block.center && { textAlign: 'center' }]} onLayout={textBlockLayout}>
                  {numbered && block.paragraph != null && `${block.paragraph}.  `}
                  {sentences.map((s, si) => {
                    const verseKey = `${key}:${si}`;
                    const selected = selectedVerses.has(verseKey);
                    const saved = savedVerseMap.has(verseKey);
                    return (
                      <Text
                        key={si}
                        onPress={() => handleVersePress(verseKey)}
                        style={[
                          s.bold && s.italic  ? { fontFamily: 'Lora_700Bold_Italic' } : undefined,
                          s.bold && !s.italic ? { fontFamily: 'Lora_700Bold' } : undefined,
                          !s.bold && s.italic ? styles.italic : undefined,
                          saved && styles.verseSaved,
                          selected && styles.verseSelected,
                        ]}
                      >
                        {s.verse !== 1 && toSuperscript(s.verse)}
                        {s.italic
                          ? highlightText(s.content, textHighlightTerms, `it-${si}`, 'Lora_700Bold_Italic')
                          : renderInline(s.content, openNtSheet, textHighlightTerms)}
                        {si < sentences.length - 1 ? ' ' : ''}
                      </Text>
                    );
                  })}
                </Text>
              );
            }

            default:
              return null;
          }
        })}
        {nextContentKey && (
          <View style={styles.nextChapterContainer}>
            <RipplePressable
              style={({ pressed }) => [styles.nextChapterBtn, pressed && styles.nextChapterBtnPressed]}
              onPress={() => {
                if (navigating) return;
                setNavigating(true);
                startLoadBar();
                setTimeout(() => router.replace({ pathname: '/reader', params: { book: bookId, anchor: nextContentKey } }), 200);
              }}
            >
              <Text style={styles.nextChapterLabel}>
                {bookId === 'workbook' ? 'Siguiente lección'
                  : (currentContentKey === 'supplements' && nextContentKey === 'supplement-song') ? 'Siguiente libro'
                  : 'Siguiente capítulo'}
              </Text>
            </RipplePressable>
          </View>
        )}
      </AppScrollView>
      </SafeAreaView>

      {/* Android's edge-to-edge status bar is always transparent (its
          backgroundColor is ignored under edge-to-edge), so app content
          underneath shows through it. This fixed strip — a sibling above
          everything else in topArea, including the animated nav bar — paints
          that inset area so a sliding-away nav bar never peeks through it. */}
      <View pointerEvents="none" style={[styles.statusBarBackdrop, { height: topInset, backgroundColor: t.darkerBackgroundColor }]} />

      {ntSheet && (
        <Pressable style={StyleSheet.absoluteFill} onPress={closeNtSheet}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.sheetOverlayBg, { opacity: sheetAnim }]} pointerEvents="none" />
        </Pressable>
      )}
      {ntSheet && (
        <Animated.View style={[styles.sheetSlide, { transform: [{ translateY: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [500, 0] }) }] }]}>
          <SafeAreaView edges={['bottom']} style={styles.sheetContainer}>
            <Pressable>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetLabel}>Nota de traducción — {ntSheet.word}</Text>
              <Text style={styles.sheetText}>{ntSheet.note}</Text>
            </Pressable>
          </SafeAreaView>
        </Animated.View>
      )}

      {savedNoteSheet && (
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSavedNoteSheet}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.sheetOverlayBg, { opacity: savedNoteSheetAnim }]} pointerEvents="none" />
        </Pressable>
      )}
      {savedNoteSheet && (
        <Animated.View style={[styles.sheetSlide, { transform: [{ translateY: savedNoteSheetAnim.interpolate({ inputRange: [0, 1], outputRange: [500, 0] }) }] }]}>
          <SafeAreaView edges={['bottom']} style={styles.sheetContainer}>
            <Pressable>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetTitleRow}>
                <Text style={[styles.sheetLabel, styles.sheetTitleText]}>
                  {savedNoteSheet.name ? `${savedNoteSheet.notation} - ${savedNoteSheet.name}` : savedNoteSheet.notation}
                </Text>
                <View onStartShouldSetResponder={() => true} onResponderTerminationRequest={() => false}>
                  <MenuView
                    onPressAction={({ nativeEvent }) => {
                      if (nativeEvent.event === 'share') handleShareSavedNote();
                      else if (nativeEvent.event === 'delete') handleDeleteSavedNote();
                    }}
                    actions={[
                      { id: 'share', title: 'Compartir' },
                      { id: 'delete', title: 'Eliminar', attributes: { destructive: true } },
                    ]}
                  >
                    <TertiaryButton hitSize={40} rippleColor={t.darkerBackgroundColor}>
                      {(pressed) => <ActionsIcon size={16} color={pressed ? t.pressedIconColor : t.fontColorPrimary} />}
                    </TertiaryButton>
                  </MenuView>
                </View>
              </View>
              <Text style={styles.sheetText}>{savedNoteSheet.note || 'Sin nota'}</Text>
            </Pressable>
          </SafeAreaView>
        </Animated.View>
      )}

      {drawerVisible && drawerMode === 'save' && (
        <Pressable style={StyleSheet.absoluteFill} onPress={handleBackToToolbar}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.sheetOverlayBg, { opacity: drawerAnim }]} pointerEvents="none" />
        </Pressable>
      )}
      {drawerVisible && (
        <Animated.View style={[styles.sheetSlide, { transform: [{ translateY: drawerAnim.interpolate({ inputRange: [0, 1], outputRange: [500, 0] }) }] }]}>
          {drawerMode === 'toolbar' ? (
            <Animated.View style={{ height: Animated.add(toolbarBaseHeight, drawerExtraHeight) }}>
              <View style={[styles.toolsDrawerContainer, { flex: 1, paddingBottom: bottomInset }]}>
                <View {...drawerPanResponder.panHandlers}>
                  <View style={styles.toolsDrawerHandleWrap}>
                    <View style={styles.toolsDrawerHandle} />
                  </View>
                  <View style={styles.toolsDrawerRow}>
                    <ReaderToolButton variant="save" style={styles.toolsDrawerButton} onPress={handleSaveTapped} />
                    {/* Notes button hidden — may be restored later
                    <ReaderToolButton variant="notes" style={styles.toolsDrawerButton} />
                    */}
                    <ReaderToolButton variant="share" style={styles.toolsDrawerButton} onPress={handleShareSelection} />
                  </View>
                </View>
                {recentBookmarksSection}
              </View>
            </Animated.View>
          ) : (
            <Animated.View style={{ height: Animated.add(screenHeight * 0.75, drawerExtraHeight) }}>
              <View style={[styles.saveDrawerContainer, { flex: 1, paddingBottom: bottomInset }]}>
                <View {...drawerPanResponder.panHandlers}>
                  <View style={styles.toolsDrawerHandleWrap}>
                    <View style={styles.toolsDrawerHandle} />
                  </View>
                  <Text style={[styles.saveDrawerTitle, { color: t.fontColorPrimary }]}>Guardar versos</Text>
                </View>
                <View style={styles.saveDrawerNoteInputWrap}>
                  <NoteInput value={noteText} onChangeText={setNoteText} onSubmit={handleSubmitNote} autoFocus />
                </View>
                {recentBookmarksSection}
              </View>
            </Animated.View>
          )}
        </Animated.View>
      )}

      {loadBarVisible && (
        <View style={[loadBarStyles.track, { backgroundColor: isDark ? 'transparent' : t.darkOutline }]}>
          <Animated.View style={[
            loadBarStyles.fill,
            { backgroundColor: isDark ? t.darkerBackgroundColor : t.fontColorPrimary },
            { transform: [{ translateX: loadBarAnim.interpolate({ inputRange: [0, 1], outputRange: [-screenWidth, 0] }) }] },
          ]} />
        </View>
      )}
    </SafeAreaView>
  );
}

const loadBarStyles = StyleSheet.create({
  track: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, overflow: 'hidden' },
  fill: { position: 'absolute', left: 0, right: 0, height: 3 },
});

function createStyles(t: ReturnType<typeof useThemeColors>, isDark: boolean) {
  return StyleSheet.create({
  topArea: {
    flex: 1,
    backgroundColor: t.darkerBackgroundColor,
  },
  container: {
    flex: 1,
    backgroundColor: t.backgroundColor,
  },

  // Nav bar
  statusBarBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  navBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: t.darkerBackgroundColor,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  navMeta: {
    flex: 1,
    gap: 2,
  },
  navChapter: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 12,
    color: t.fontColorGray,
  },
  navSection: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 14,
    color: t.fontColorPrimary,
  },
  // Title-only nav bar (no subtitle) uses body-s-regular instead of the bold title style.
  navSectionOnly: {
    fontFamily: UIFonts.bodySRegular.fontFamily,
    fontSize: UIFonts.bodySRegular.fontSize,
  },

  // Content
  scroll: {
    flex: 1,
    backgroundColor: t.backgroundColor,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },

  // Block styles — all Lora, color textPrimary
  bookHeading: {
    fontFamily: 'Lora_700Bold',
    fontSize: 26,
    color: t.fontColorPrimary,
  },
  partHeading: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 20,
    color: t.fontColorPrimary,
  },
  chapterNumber: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 20,
    color: t.fontColorPrimary,
  },
  chapterHeading: {
    fontFamily: 'Lora_700Bold',
    fontSize: 22,
    color: t.fontColorPrimary,
  },
  sectionHeading: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 20,
    color: t.fontColorPrimary,
  },
  lessonSetSubtitle: {
    fontFamily: 'Lora_700Bold',
    fontSize: 22,
    color: t.fontColorPrimary,
  },
  lessonTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 20,
    color: t.fontColorPrimary,
  },
  lessonSubtitle: {
    fontFamily: 'Lora_700Bold',
    fontSize: 22,
    color: t.fontColorPrimary,
  },
  stanzaBlock: {
    marginHorizontal: 20,
  },
  bodyLarge: {
    fontFamily: 'Lora_400Regular',
    fontSize: 17,
    lineHeight: 32,
    color: t.fontColorPrimary,
  },
  italic: {
    fontFamily: 'Lora_400Regular_Italic',
  },
  ntWord: {
    color: t.ntWordColor,
    textDecorationLine: 'underline',
    fontFamily: isDark ? 'Lora_700Bold' : undefined,
  },
  verseSelected: {
    textDecorationLine: 'underline',
    textDecorationColor: t.darkOutline,
  },
  verseSaved: {
    backgroundColor: t.savedHighlight,
  },

  // N.T. bottom sheet
  sheetSlide: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheetOverlayBg: {
    backgroundColor: t.overlay,
  },
  sheetContainer: {
    backgroundColor: t.darkerBackgroundColor,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: t.darkOutline,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetLabel: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 17,
    color: t.fontColorPrimary,
    marginBottom: 12,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  sheetTitleText: {
    flex: 1,
    marginBottom: 0,
  },
  sheetText: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 15,
    lineHeight: 23,
    color: t.fontColorPrimary,
    marginBottom: 16,
  },

  // Reader tools drawer
  toolsDrawerContainer: {
    backgroundColor: t.darkerBackgroundColor,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  toolsDrawerHandleWrap: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 4,
  },
  toolsDrawerHandle: {
    width: 60,
    height: 6,
    backgroundColor: t.darkOutline,
    borderRadius: 3,
  },
  toolsDrawerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  toolsDrawerButton: {
    flex: 1,
  },

  // Save-verses drawer
  saveDrawerContainer: {
    backgroundColor: t.darkerBackgroundColor,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  saveDrawerTitle: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  saveDrawerNoteInputWrap: {
    marginBottom: 12,
  },
  saveDrawerFullBleed: {
    flex: 1,
    marginHorizontal: -16,
    backgroundColor: t.backgroundColor,
  },
  saveDrawerListHeader: {
    paddingTop: 24,
    paddingBottom: 12,
    paddingHorizontal: 24,
  },
  saveDrawerListHeaderText: UIFonts.capsBodyXsRegular,
  saveDrawerList: {
    flex: 1,
  },

  // Next-chapter button
  nextChapterContainer: {
    marginTop: 60,
  },
  // Bar always renders on a fixed white background (Figma: primary-button-bg,
  // same value in both themes), so its text color is fixed to the light-mode
  // equivalent here rather than pulled from useThemeColors() — otherwise
  // dark mode flips it to white-on-white and the label disappears.
  nextChapterBtn: {
    overflow: 'hidden',
    backgroundColor: Colors.primaryButtonBg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.darkOutline,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextChapterBtnPressed: {},
  nextChapterLabel: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 16,
    color: Colors.fontColorPrimary,
  },

  });
}
