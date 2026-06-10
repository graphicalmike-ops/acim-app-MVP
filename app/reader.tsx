import React, { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, LayoutChangeEvent, useWindowDimensions, Pressable, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { BackIcon, HomeIcon } from '@/components/Icons';
import { TertiaryButton } from '@/components/TertiaryButton';
import { toTitleCase } from '@/utils/text';
import { saveLastRead } from '@/utils/lastRead';
import { RipplePressable } from '@/components/RipplePressable';

type Sentence = { verse: number; content: string; bold?: boolean; italic?: boolean; newline?: boolean; inline?: boolean; spaceBefore?: boolean };
type ContentBlock = {
  anchor: string | null;
  type: string;
  title?: string;
  subtitle?: string;
  paragraph?: number;
  spaceBefore?: boolean;
  compact?: boolean;
  indent?: boolean;
  center?: boolean;
  sentences?: Sentence[];
};

const CONTENT: Record<string, ContentBlock[]> = {
  'theory-prefacio': require('@/assets/content/theory/theory-prefacio.json'),
  'theory-ch1':  require('@/assets/content/theory/theory-ch1.json'),
  'theory-ch2':  require('@/assets/content/theory/theory-ch2.json'),
  'theory-ch3':  require('@/assets/content/theory/theory-ch3.json'),
  'theory-ch4':  require('@/assets/content/theory/theory-ch4.json'),
  'theory-ch5':  require('@/assets/content/theory/theory-ch5.json'),
  'theory-ch6':  require('@/assets/content/theory/theory-ch6.json'),
  'theory-ch7':  require('@/assets/content/theory/theory-ch7.json'),
  'theory-ch8':  require('@/assets/content/theory/theory-ch8.json'),
  'theory-ch9':  require('@/assets/content/theory/theory-ch9.json'),
  'theory-ch10': require('@/assets/content/theory/theory-ch10.json'),
  'theory-ch11': require('@/assets/content/theory/theory-ch11.json'),
  'theory-ch12': require('@/assets/content/theory/theory-ch12.json'),
  'theory-ch13': require('@/assets/content/theory/theory-ch13.json'),
  'theory-ch14': require('@/assets/content/theory/theory-ch14.json'),
  'theory-ch15': require('@/assets/content/theory/theory-ch15.json'),
  'theory-ch16': require('@/assets/content/theory/theory-ch16.json'),
  'theory-ch17': require('@/assets/content/theory/theory-ch17.json'),
  'theory-ch18': require('@/assets/content/theory/theory-ch18.json'),
  'theory-ch19': require('@/assets/content/theory/theory-ch19.json'),
  'theory-ch20': require('@/assets/content/theory/theory-ch20.json'),
  'theory-ch21': require('@/assets/content/theory/theory-ch21.json'),
  'theory-ch22': require('@/assets/content/theory/theory-ch22.json'),
  'theory-ch23': require('@/assets/content/theory/theory-ch23.json'),
  'theory-ch24': require('@/assets/content/theory/theory-ch24.json'),
  'theory-ch25': require('@/assets/content/theory/theory-ch25.json'),
  'theory-ch26': require('@/assets/content/theory/theory-ch26.json'),
  'theory-ch27': require('@/assets/content/theory/theory-ch27.json'),
  'theory-ch28': require('@/assets/content/theory/theory-ch28.json'),
  'theory-ch29': require('@/assets/content/theory/theory-ch29.json'),
  'theory-ch30': require('@/assets/content/theory/theory-ch30.json'),
  'theory-ch31': require('@/assets/content/theory/theory-ch31.json'),
  'workbook-intro':                  require('@/assets/content/workbook/workbook-intro.json'),
  'workbook-part1-lessons1-50':      require('@/assets/content/workbook/workbook-part1-lessons1-50.json'),
  'workbook-part1-review1':          require('@/assets/content/workbook/workbook-part1-review1.json'),
  'workbook-part1-lessons61-80':     require('@/assets/content/workbook/workbook-part1-lessons61-80.json'),
  'workbook-part1-review2':          require('@/assets/content/workbook/workbook-part1-review2.json'),
  'workbook-part1-lessons91-110':    require('@/assets/content/workbook/workbook-part1-lessons91-110.json'),
  'workbook-part1-review3':          require('@/assets/content/workbook/workbook-part1-review3.json'),
  'workbook-part1-lessons121-140':   require('@/assets/content/workbook/workbook-part1-lessons121-140.json'),
  'workbook-part1-review4':          require('@/assets/content/workbook/workbook-part1-review4.json'),
  'workbook-part1-lessons151-170':   require('@/assets/content/workbook/workbook-part1-lessons151-170.json'),
  'workbook-part1-review5':          require('@/assets/content/workbook/workbook-part1-review5.json'),
  'workbook-part1-lessons181-200':   require('@/assets/content/workbook/workbook-part1-lessons181-200.json'),
  'workbook-part1-review6':          require('@/assets/content/workbook/workbook-part1-review6.json'),
  'workbook-part2-intro':            require('@/assets/content/workbook/workbook-part2-intro.json'),
  'workbook-part2-set1':             require('@/assets/content/workbook/workbook-part2-set1.json'),
  'workbook-part2-set2':             require('@/assets/content/workbook/workbook-part2-set2.json'),
  'workbook-part2-set3':             require('@/assets/content/workbook/workbook-part2-set3.json'),
  'workbook-part2-set4':             require('@/assets/content/workbook/workbook-part2-set4.json'),
  'workbook-part2-set5':             require('@/assets/content/workbook/workbook-part2-set5.json'),
  'workbook-part2-set6':             require('@/assets/content/workbook/workbook-part2-set6.json'),
  'workbook-part2-set7':             require('@/assets/content/workbook/workbook-part2-set7.json'),
  'workbook-part2-set8':             require('@/assets/content/workbook/workbook-part2-set8.json'),
  'workbook-part2-set9':             require('@/assets/content/workbook/workbook-part2-set9.json'),
  'workbook-part2-set10':            require('@/assets/content/workbook/workbook-part2-set10.json'),
  'workbook-part2-set11':            require('@/assets/content/workbook/workbook-part2-set11.json'),
  'workbook-part2-set12':            require('@/assets/content/workbook/workbook-part2-set12.json'),
  'workbook-part2-set13':            require('@/assets/content/workbook/workbook-part2-set13.json'),
  'workbook-part2-set14':            require('@/assets/content/workbook/workbook-part2-set14.json'),
  'workbook-part2-final':            require('@/assets/content/workbook/workbook-part2-final.json'),
  'workbook-epilogue':               require('@/assets/content/workbook/workbook-epilogue.json'),
  'mft':               require('@/assets/content/mft.json'),
  'mft-clarification': require('@/assets/content/mft-clarification.json'),
  'supplements':       require('@/assets/content/supplements.json'),
  'supplement-song':  require('@/assets/content/supplement-song.json'),
};

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

function resolveContentKey(bookId: string, anchor: string): string {
  if (bookId === 'theory') {
    const m = anchor?.match(/^(theory-ch\d+)/);
    return m ? m[1] : 'theory-prefacio';
  }
  if (bookId === 'workbook') {
    const lm = anchor?.match(/^workbook-l(\d+)$/);
    if (lm) {
      const n = parseInt(lm[1], 10);
      if (n <= 50)               return 'workbook-part1-lessons1-50';
      if (n <= 60)               return 'workbook-part1-review1';
      if (n <= 80)               return 'workbook-part1-lessons61-80';
      if (n <= 90)               return 'workbook-part1-review2';
      if (n <= 110)              return 'workbook-part1-lessons91-110';
      if (n <= 120)              return 'workbook-part1-review3';
      if (n <= 140)              return 'workbook-part1-lessons121-140';
      if (n <= 150)              return 'workbook-part1-review4';
      if (n <= 170)              return 'workbook-part1-lessons151-170';
      if (n <= 180)              return 'workbook-part1-review5';
      if (n <= 200)              return 'workbook-part1-lessons181-200';
      if (n <= 220)              return 'workbook-part1-review6';
      if (n <= 230)              return 'workbook-part2-set1';
      if (n <= 240)              return 'workbook-part2-set2';
      if (n <= 250)              return 'workbook-part2-set3';
      if (n <= 260)              return 'workbook-part2-set4';
      if (n <= 270)              return 'workbook-part2-set5';
      if (n <= 280)              return 'workbook-part2-set6';
      if (n <= 290)              return 'workbook-part2-set7';
      if (n <= 300)              return 'workbook-part2-set8';
      if (n <= 310)              return 'workbook-part2-set9';
      if (n <= 320)              return 'workbook-part2-set10';
      if (n <= 330)              return 'workbook-part2-set11';
      if (n <= 340)              return 'workbook-part2-set12';
      if (n <= 350)              return 'workbook-part2-set13';
      if (n <= 360)              return 'workbook-part2-set14';
      if (n <= 365)              return 'workbook-part2-final';
    }
    if (anchor === 'workbook-intro')                 return 'workbook-part1-lessons1-50';
    if (anchor === 'workbook-part1-lessons1-50')    return 'workbook-part1-lessons1-50';
    if (anchor === 'workbook-part1-review1')          return 'workbook-part1-review1';
    if (anchor === 'workbook-part1-review1-intro')   return 'workbook-part1-review1';
    if (anchor === 'workbook-part1-lessons61-80')    return 'workbook-part1-lessons61-80';
    if (anchor === 'workbook-part1-review2')          return 'workbook-part1-review2';
    if (anchor === 'workbook-part1-review2-intro')    return 'workbook-part1-review2';
    if (anchor === 'workbook-part1-lessons91-110')   return 'workbook-part1-lessons91-110';
    if (anchor === 'workbook-part1-review3')          return 'workbook-part1-review3';
    if (anchor === 'workbook-part1-review3-intro')    return 'workbook-part1-review3';
    if (anchor === 'workbook-part1-lessons121-140')  return 'workbook-part1-lessons121-140';
    if (anchor === 'workbook-part1-review4')          return 'workbook-part1-review4';
    if (anchor === 'workbook-part1-review4-intro')    return 'workbook-part1-review4';
    if (anchor === 'workbook-part1-lessons151-170')  return 'workbook-part1-lessons151-170';
    if (anchor === 'workbook-part1-review5')         return 'workbook-part1-review5';
    if (anchor === 'workbook-part1-review5-intro')   return 'workbook-part1-review5';
    if (anchor === 'workbook-part1-lessons181-200')       return 'workbook-part1-lessons181-200';
    if (anchor === 'workbook-part1-lessons181-200-intro') return 'workbook-part1-lessons181-200';
    if (anchor === 'workbook-part1-review6')              return 'workbook-part1-review6';
    if (anchor === 'workbook-part1-review6-intro')        return 'workbook-part1-review6';
    if (anchor === 'workbook-part2-intro')                return 'workbook-part2-intro';
    if (anchor === 'workbook-part2-set1')                 return 'workbook-part2-set1';
    if (anchor === 'workbook-part2-set1-intro')           return 'workbook-part2-set1';
    if (anchor === 'workbook-part2-set2')                 return 'workbook-part2-set2';
    if (anchor === 'workbook-part2-set2-intro')           return 'workbook-part2-set2';
    if (anchor === 'workbook-part2-set3')                 return 'workbook-part2-set3';
    if (anchor === 'workbook-part2-set3-intro')           return 'workbook-part2-set3';
    if (anchor === 'workbook-part2-set4')                 return 'workbook-part2-set4';
    if (anchor === 'workbook-part2-set4-intro')           return 'workbook-part2-set4';
    if (anchor === 'workbook-part2-set5')                 return 'workbook-part2-set5';
    if (anchor === 'workbook-part2-set5-intro')           return 'workbook-part2-set5';
    if (anchor === 'workbook-part2-set6')                 return 'workbook-part2-set6';
    if (anchor === 'workbook-part2-set6-intro')           return 'workbook-part2-set6';
    if (anchor === 'workbook-part2-set7')                 return 'workbook-part2-set7';
    if (anchor === 'workbook-part2-set7-intro')           return 'workbook-part2-set7';
    if (anchor === 'workbook-part2-set8')                 return 'workbook-part2-set8';
    if (anchor === 'workbook-part2-set8-intro')           return 'workbook-part2-set8';
    if (anchor === 'workbook-part2-set9')                 return 'workbook-part2-set9';
    if (anchor === 'workbook-part2-set9-intro')           return 'workbook-part2-set9';
    if (anchor === 'workbook-part2-set10')                return 'workbook-part2-set10';
    if (anchor === 'workbook-part2-set10-intro')          return 'workbook-part2-set10';
    if (anchor === 'workbook-part2-set11')                return 'workbook-part2-set11';
    if (anchor === 'workbook-part2-set11-intro')          return 'workbook-part2-set11';
    if (anchor === 'workbook-part2-set12')                return 'workbook-part2-set12';
    if (anchor === 'workbook-part2-set12-intro')          return 'workbook-part2-set12';
    if (anchor === 'workbook-part2-set13')                return 'workbook-part2-set13';
    if (anchor === 'workbook-part2-set13-intro')          return 'workbook-part2-set13';
    if (anchor === 'workbook-part2-set14')                return 'workbook-part2-set14';
    if (anchor === 'workbook-part2-set14-intro')          return 'workbook-part2-set14';
    if (anchor === 'workbook-part2-final')                return 'workbook-part2-final';
    if (anchor === 'workbook-part2-final-intro')          return 'workbook-part2-final';
    if (anchor === 'workbook-epilogue')                   return 'workbook-epilogue';
    return 'workbook-intro';
  }
  if (bookId === 'mft') {
    if (anchor?.startsWith('supplement-mft-clarification') || anchor === 'supplement-mft-epilogo') {
      return 'mft-clarification';
    }
    return 'mft';
  }
  if (anchor?.startsWith('supplement-song')) return 'supplement-song';
  return 'supplements';
}

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
  const { book: bookId, anchor } = useLocalSearchParams<{ book: string; anchor: string }>();
  const { height: screenHeight } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
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

  const handleAnchorLayout = useCallback((e: LayoutChangeEvent, scrollToTop = false) => {
    if (hasScrolled.current) return;
    hasScrolled.current = true;
    const y = scrollToTop ? 0 : Math.max(0, e.nativeEvent.layout.y - 40);
    scrollRef.current?.scrollTo({ y, animated: false });
  }, []);

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

  const handleScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number } } }) => {
    const scrollY = e.nativeEvent.contentOffset.y;
    const midpoint = scrollY + screenHeight / 2;

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
  }, [screenHeight]);



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

function renderInline(text: string, onNt?: (word: string, note: string) => void): (string | React.ReactElement)[] {
  const parts = text.split(/(\*\*_[^_]+_\*\*|\*\*[^*]+\*\*|_[^_]+_|\{NT:[^}]+\})/);
  return parts.map((part, i) => {
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
    return part;
  });
}

  const bookBlocks = useMemo(() => {
    const key = resolveContentKey(bookId, anchor);
    return (CONTENT[key] ?? []) as ContentBlock[];
  }, [bookId, anchor]);

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
    for (const b of bookBlocks) {
      if (b.type === 'chapter-heading' || b.type === 'lesson-heading' || b.type === 'lesson-set-heading') last = null;
      if (b.type === 'section-heading') last = b;
      if (anchor && b.anchor === anchor) break;
    }
    return last;
  }, [bookBlocks, anchor, scrolledSectionBlock]);

  const navTitle = useMemo(() => {
    if (!scrolledChapterBlock) {
      // Repaso intro (anchor = workbook-part1-review1-intro etc.)
      if (/^workbook-part1-review\d+-intro$/.test(anchor ?? '')) {
        const group = bookBlocks.find(b => b.type === 'lesson-group-heading');
        if (group?.title) return toTitleCase(group.title);
      }
      // Part II intro
      if (anchor === 'workbook-part2-intro') return 'Parte II';
    }
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
    }
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
      <StatusBar style="dark" backgroundColor={Colors.backgroundDark} />
      <View style={styles.navBar}>
        <View style={styles.navRow}>
          <View style={styles.navLeft}>
            <TertiaryButton hitSize={40} onPress={() => router.back()}>
              {() => <BackIcon size={16} color={Colors.textPrimary} />}
            </TertiaryButton>
            <View style={[styles.navMeta, !navSubtitle && { justifyContent: 'center' }]}>
              <Text style={styles.navSection} numberOfLines={1}>{navTitle}</Text>
              {!!navSubtitle && <Text style={styles.navChapter} numberOfLines={1}>{navSubtitle}</Text>}
            </View>
          </View>
          <TertiaryButton hitSize={40} onPress={() => router.navigate('/home')}>
            {() => <HomeIcon size={16} color={Colors.textPrimary} />}
          </TertiaryButton>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={100}
      >
        {visibleBlocks.map(({ block, mt, key, numbered }) => {
          const onLayout = block.anchor === anchor ? handleAnchorLayout : undefined;
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
                if (block.anchor === anchor) handleAnchorLayout(e, block.anchor === rootChapterAnchor);
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
                if (block.anchor === anchor) handleAnchorLayout(e);
              };
              return (
                <Text key={key} selectable style={[styles.sectionHeading, { marginTop: mt }]} onLayout={sectionLayout}>
                  {block.title}
                </Text>
              );
            }

            case 'lesson-group-heading':
              return (
                <Text key={key} selectable style={[styles.lessonTitle, { marginTop: mt }]} onLayout={block.anchor === anchor ? (e) => handleAnchorLayout(e, true) : undefined}>
                  {block.title}
                </Text>
              );

            case 'lesson-set-heading': {
              const setLayout = (e: LayoutChangeEvent) => {
                recordChapterLayout(block, e);
                if (block.anchor === anchor) handleAnchorLayout(e, true);
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
                if (block.anchor === anchor) handleAnchorLayout(e);
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
              if (stHasLineBreaks) {
                return (
                  <View key={key} style={[styles.stanzaBlock, { marginTop: mt }]} onLayout={onLayout}>
                    {stSentences.map((s, si) => (
                      <Text key={si} selectable style={[
                        styles.bodyText,
                        { fontFamily: stFont(s) },
                        s.spaceBefore && si > 0 && { marginTop: 20 },
                      ]}>
                        {s.verse !== 1 && toSuperscript(s.verse)}
                        {renderInline(s.content, openNtSheet)}
                      </Text>
                    ))}
                  </View>
                );
              }
              return (
                <Text key={key} selectable style={[styles.bodyText, styles.stanzaBlock, { marginTop: mt }]} onLayout={onLayout}>
                  {stSentences.map((s, si) => (
                    <Text key={si} style={{ fontFamily: stFont(s) }}>
                      {s.verse !== 1 && toSuperscript(s.verse)}
                      {renderInline(s.content, openNtSheet)}
                      {si < stSentences.length - 1 ? ' ' : ''}
                    </Text>
                  ))}
                </Text>
              );
            }

            case 'text': {
              const sentences = block.sentences ?? [];
              const hasLineBreaks = sentences.some(s => s.newline);
              if (hasLineBreaks) {
                // Each sentence gets its own line UNLESS inline:true, which attaches it to the previous line
                const lines: { sentences: typeof sentences; spaceBefore: boolean }[] = [];
                for (const s of sentences) {
                  if (s.inline && lines.length > 0) {
                    lines[lines.length - 1].sentences.push(s);
                  } else {
                    lines.push({ sentences: [s], spaceBefore: !!s.spaceBefore });
                  }
                }
                return (
                  <View key={key} style={{ marginTop: mt }} onLayout={onLayout}>
                    {lines.map((line, li) => (
                      <Text key={li} selectable style={[
                        styles.bodyText,
                        line.spaceBefore && { marginTop: 20 },
                      ]}>
                        {li === 0 && numbered && block.paragraph != null && <Text style={styles.bodyText}>{block.paragraph}.{'  '}</Text>}
                        {line.sentences.map((s, si) => (
                          <Text key={si} style={[
                            s.bold && s.italic  ? { fontFamily: 'Lora_700Bold_Italic' } : undefined,
                            s.bold && !s.italic ? { fontFamily: 'Lora_700Bold' } : undefined,
                            !s.bold && s.italic ? { fontFamily: 'Lora_400Regular_Italic' } : undefined,
                          ]}>
                            {s.verse !== 1 && toSuperscript(s.verse)}
                            {s.italic ? s.content : renderInline(s.content, openNtSheet)}
                            {si < line.sentences.length - 1 ? ' ' : ''}
                          </Text>
                        ))}
                      </Text>
                    ))}
                  </View>
                );
              }
              return (
                <Text key={key} selectable style={[styles.bodyText, { marginTop: mt }, block.indent && styles.stanzaBlock, block.center && { textAlign: 'center' }]} onLayout={onLayout}>
                  {numbered && block.paragraph != null && `${block.paragraph}.  `}
                  {sentences.map((s, si) => (
                    <Text key={si} style={[
                      s.bold && s.italic  ? { fontFamily: 'Lora_700Bold_Italic' } : undefined,
                      s.bold && !s.italic ? { fontFamily: 'Lora_700Bold' } : undefined,
                      !s.bold && s.italic ? styles.italic : undefined,
                    ]}>
                      {s.verse !== 1 && toSuperscript(s.verse)}
                      {s.italic ? s.content : renderInline(s.content, openNtSheet)}
                      {si < sentences.length - 1 ? ' ' : ''}
                    </Text>
                  ))}
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
              onPress={() => router.replace({ pathname: '/reader', params: { book: bookId, anchor: nextContentKey } })}
            >
              <Text style={styles.nextChapterLabel}>
                {bookId === 'workbook' ? 'Siguiente lección'
                  : (currentContentKey === 'supplements' && nextContentKey === 'supplement-song') ? 'Siguiente libro'
                  : 'Siguiente capítulo'}
              </Text>
            </RipplePressable>
          </View>
        )}
      </ScrollView>
      </SafeAreaView>

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

  // Nav bar
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
    justifyContent: 'space-between',
    height: 39,
  },
  navChapter: {
    fontFamily: 'MerriweatherSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  navSection: {
    fontFamily: 'MerriweatherSans_400Regular',
    fontSize: 14,
    color: Colors.textPrimary,
  },

  // Content
  scroll: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },

  // Block styles — all Lora, color textPrimary
  bookHeading: {
    fontFamily: 'Lora_700Bold',
    fontSize: 26,
    color: Colors.textPrimary,
  },
  partHeading: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 20,
    color: Colors.textPrimary,
  },
  chapterNumber: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 20,
    color: Colors.textPrimary,
  },
  chapterHeading: {
    fontFamily: 'Lora_700Bold',
    fontSize: 22,
    color: Colors.textPrimary,
  },
  sectionHeading: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 20,
    color: Colors.textPrimary,
  },
  lessonSetSubtitle: {
    fontFamily: 'Lora_700Bold',
    fontSize: 22,
    color: Colors.textPrimary,
  },
  lessonTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 20,
    color: Colors.textPrimary,
  },
  lessonSubtitle: {
    fontFamily: 'Lora_700Bold',
    fontSize: 22,
    color: Colors.textPrimary,
  },
  stanzaBlock: {
    marginHorizontal: 20,
  },
  bodyText: {
    fontFamily: 'Lora_400Regular',
    fontSize: 17,
    lineHeight: 24,
    color: Colors.textPrimary,
  },
  italic: {
    fontFamily: 'Lora_400Regular_Italic',
  },
  ntWord: {
    color: '#803000',
    textDecorationLine: 'underline',
  },

  // N.T. bottom sheet
  sheetSlide: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheetOverlayBg: {
    backgroundColor: Colors.overlay,
  },
  sheetContainer: {
    backgroundColor: Colors.backgroundDark,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.darkOutline,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetLabel: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 17,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  sheetText: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 15,
    lineHeight: 23,
    color: Colors.textPrimary,
    marginBottom: 16,
  },

  // Next-chapter button
  nextChapterContainer: {
    marginTop: 60,
  },
  nextChapterBtn: {
    overflow: 'hidden',
    backgroundColor: Colors.surface,
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
    fontFamily: 'MerriweatherSans_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
  },

});
