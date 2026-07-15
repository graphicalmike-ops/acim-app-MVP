export type Sentence = { verse: number; content: string; bold?: boolean; italic?: boolean; newline?: boolean; inline?: boolean; spaceBefore?: boolean };
export type ContentBlock = {
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

export const CONTENT: Record<string, ContentBlock[]> = {
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

export function resolveContentKey(bookId: string, anchor: string): string {
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
    return 'workbook-part1-lessons1-50';
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

function stripMarkup(text: string): string {
  return text
    .replace(/\*\*_([^_]+)_\*\*/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/\{NT:([^}]+)\}/g, '$1');
}

// Mirrors reader.tsx's scrollTargetBlock resolution: scan forward from the
// anchor until the next anchored block (section/chapter/lesson boundary),
// looking for the text block whose own `paragraph` number matches.
function findParagraphBlock(bookId: string, anchor: string, paragraph: number): ContentBlock | null {
  const key = resolveContentKey(bookId, anchor);
  const blocks = CONTENT[key] ?? [];
  const anchorIdx = blocks.findIndex(b => b.anchor === anchor);
  if (anchorIdx < 0) return null;

  for (let i = anchorIdx + 1; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.anchor != null) break;
    if (b.type === 'text' && b.paragraph === paragraph) return b;
  }
  return blocks[anchorIdx] ?? null;
}

export function getParagraphText(bookId: string, anchor: string, paragraph: number): string | null {
  const target = findParagraphBlock(bookId, anchor, paragraph);
  if (!target?.sentences?.length) return null;

  return target.sentences
    .map(s => stripMarkup(s.content))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Same as getParagraphText but limited to the exact verse numbers in `verses`
// — used for sharing exactly what was selected/saved (which may skip verses,
// e.g. [1, 3, 5]) rather than the whole paragraph or a filled-in range. Falls
// back to the full paragraph when the list is empty (older bookmarks saved
// before exact verse tracking was added).
export function getVersesText(bookId: string, anchor: string, paragraph: number, verses: number[]): string | null {
  const target = findParagraphBlock(bookId, anchor, paragraph);
  if (!target?.sentences?.length) return null;

  const verseSet = new Set(verses);
  const sentences = verseSet.size === 0
    ? target.sentences
    : target.sentences.filter(s => verseSet.has(s.verse));
  if (!sentences.length) return null;

  return sentences
    .map(s => stripMarkup(s.content))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
