import * as SQLite from 'expo-sqlite';

// Bump this suffix whenever scripts/build-search-index.js changes its schema
// or the content is reindexed, so devices pick up the new file instead of
// keeping a stale copy that was already imported to the SQLite directory.
const DATABASE_NAME = 'search-index-v1.db';

export interface SearchResult {
  book: string;
  chapterAnchor: string | null;
  chapterTitle: string | null;
  sectionAnchor: string | null;
  sectionTitle: string | null;
  lessonAnchor: string | null;
  lessonTitle: string | null;
  lessonNumber: number | null;
  paragraph: number | null;
  /** Min/max numbered verse in this paragraph. Lettered footnote verses ("a", "b")
   *  are cited as their preceding numbered verse, so they never affect this range. */
  verseStart: number | null;
  verseEnd: number | null;
  /** Nearest anchor the Reader can scroll to today (section, else lesson, else chapter). */
  anchor: string | null;
  /** Full paragraph/stanza text, for cases the caller wants more than the snippet. */
  text: string;
  /** Snippet with matches wrapped in [[ ]], ready for the caller to split and highlight. */
  snippet: string;
}

const ROMAN_NUMERAL_TABLE: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

function toRoman(num: number): string {
  let n = num;
  let result = '';
  for (const [value, symbol] of ROMAN_NUMERAL_TABLE) {
    while (n >= value) {
      result += symbol;
      n -= value;
    }
  }
  return result;
}

// Matches "Capítulo 5" (Theory, Manual) or "2. El proceso..." (Psicoterapia,
// Song, Clarificación terms) — the only two chapter-title shapes in the corpus.
function extractChapterNumber(title: string | null): string | null {
  if (!title) return null;
  const capMatch = title.match(/^Cap[íi]tulo\s+(\d+)/i);
  if (capMatch) return capMatch[1];
  const numMatch = title.match(/^(\d+)\./);
  return numMatch ? numMatch[1] : null;
}

// Derives the section/subsection citation label purely from the anchor's
// structural suffix, not the title text (more robust than parsing titles,
// which contain accents/punctuation/em-dashes). Anchor shapes:
//   theory-ch5-s3        -> depth 0 (plain section)      -> "III"
//   theory-ch19-s4a      -> depth 1 (lettered subsection) -> "IV-A"
//   theory-ch19-s4a-i    -> depth 2 (sub-subsection)      -> "IV-A" (dropped —
//     confirmed: a sub-subsection is purely organizational and never appears
//     in the citation; paragraph numbering just runs through it uninterrupted)
// A chapter's own "Introducción" section (anchor ends "-intro") -> "in".
function formatSectionPart(sectionAnchor: string | null): string | null {
  if (!sectionAnchor) return null;
  if (sectionAnchor.endsWith('-intro')) return 'in';
  const m = sectionAnchor.match(/-s(\d+)([a-z])?(?:-[a-z]+)?$/);
  if (!m) return null;
  const roman = toRoman(Number(m[1]));
  return m[2] ? `${roman}-${m[2].toUpperCase()}` : roman;
}

function formatParaVerse(result: SearchResult): string {
  if (result.paragraph == null) return '';
  const verse = result.verseStart == null
    ? ''
    : result.verseStart === result.verseEnd
    ? `:${result.verseStart}`
    : `:${result.verseStart}-${result.verseEnd}`;
  return `${result.paragraph}${verse}`;
}

function joinParaVerse(base: string, result: SearchResult): string {
  const pv = formatParaVerse(result);
  return pv ? `${base}.${pv}` : base;
}

// Text (T): T-Pre.{I-IV} for the Preface (roman numerals assigned by the app,
// not present in the source — see [[project_search_route_id_questions]]),
// T-In for the Text's own Introduction, T-<n>[.<section>] otherwise.
function formatTheoryRouteId(r: SearchResult): string {
  if (r.chapterAnchor === 'theory-prefacio') {
    const PREFACE_SECTION_ROMAN: Record<string, string> = {
      'theory-prefacio-s1': 'II',
      'theory-prefacio-s2': 'III',
      'theory-prefacio-s3': 'IV',
    };
    const roman = r.sectionAnchor ? PREFACE_SECTION_ROMAN[r.sectionAnchor] ?? 'I' : 'I';
    return joinParaVerse(`T-Pre.${roman}`, r);
  }
  if (r.chapterAnchor === 'theory-intro') {
    return joinParaVerse('T-In', r);
  }
  const chapterNum = extractChapterNumber(r.chapterTitle);
  const sectionPart = formatSectionPart(r.sectionAnchor);
  const base = sectionPart ? `T-${chapterNum}.${sectionPart}` : `T-${chapterNum}`;
  return joinParaVerse(base, r);
}

// Workbook (L): individual lessons (1-365, including the combined 361-365
// block) cite by bare lesson number regardless of which part/set/review file
// they live in; everything else is essay/intro content between lessons.
function formatWorkbookRouteId(r: SearchResult): string {
  if (r.lessonNumber != null) {
    const num = r.lessonAnchor === 'workbook-l361' ? '361-365' : `${r.lessonNumber}`;
    return joinParaVerse(`L-${num}`, r);
  }

  const chAnchor = r.chapterAnchor ?? '';

  if (chAnchor === 'workbook-intro') return joinParaVerse('L-in', r);
  if (chAnchor === 'workbook-part1-lessons181-200-intro') return joinParaVerse('L-in.181-200', r);

  const reviewMatch = chAnchor.match(/^workbook-part1-review(\d+)-intro$/);
  if (reviewMatch) return joinParaVerse(`L-r${toRoman(Number(reviewMatch[1]))}.in`, r);

  if (chAnchor === 'workbook-part2-intro') return joinParaVerse('L-pII.in', r);

  const setMatch = chAnchor.match(/^workbook-part2-set(\d+)$/);
  if (setMatch) return joinParaVerse(`L-pII.${setMatch[1]}`, r);

  if (chAnchor === 'workbook-part2-final-intro' || chAnchor === 'workbook-part2-final') {
    return joinParaVerse('L-lf.in', r);
  }

  if (chAnchor === 'workbook-epilogue') return joinParaVerse('L-ep', r);

  // Not expected given the confirmed corpus coverage, but fail soft rather
  // than throw if a new Workbook zone is ever added without updating this.
  return joinParaVerse('L', r);
}

// Manual (M) / Clarificación de términos (C) share one book id in the index
// (mirrors the same anchor-prefix check reader.tsx's resolveContentKey uses).
function formatMftRouteId(r: SearchResult): string {
  const chAnchor = r.chapterAnchor ?? '';
  const isClarification = chAnchor.startsWith('supplement-mft-clarification') || chAnchor === 'supplement-mft-epilogo';
  const letter = isClarification ? 'C' : 'M';

  if (chAnchor === 'supplement-mft-intro' || chAnchor === 'supplement-mft-clarification-intro') {
    return joinParaVerse(`${letter}-in`, r);
  }
  if (chAnchor === 'supplement-mft-epilogo') return joinParaVerse('C-ep', r);

  const termMatch = chAnchor.match(/^supplement-mft-clarification-t(\d+)$/);
  if (termMatch) return joinParaVerse(`C-${termMatch[1]}`, r);

  const chapterNum = extractChapterNumber(r.chapterTitle);
  const sectionPart = formatSectionPart(r.sectionAnchor);
  const base = sectionPart ? `M-${chapterNum}.${sectionPart}` : `M-${chapterNum}`;
  return joinParaVerse(base, r);
}

// Psicoterapia (P) — the "psychotherapy" book id also carries the standalone
// "Anexo a Un Curso de Milagros" appendix, cited as P-Anexo.<n> using each
// paragraph's ordinal position (the source has no real paragraph numbers
// here — see ORDINAL_PARAGRAPH_CHAPTERS in scripts/build-search-index.js).
function formatPsychotherapyRouteId(r: SearchResult): string {
  const chAnchor = r.chapterAnchor ?? '';
  if (chAnchor === 'supplement-anexo') return joinParaVerse('P-Anexo', r);
  if (chAnchor === 'supplement-psycho-intro') return joinParaVerse('P-in', r);

  const chapterNum = extractChapterNumber(r.chapterTitle);
  const sectionPart = formatSectionPart(r.sectionAnchor);
  const base = sectionPart ? `P-${chapterNum}.${sectionPart}` : `P-${chapterNum}`;
  return joinParaVerse(base, r);
}

// El Canto de la Oración (O) — uniform chapter+section structure, no
// book-level intro or other special cases.
function formatSongRouteId(r: SearchResult): string {
  const chapterNum = extractChapterNumber(r.chapterTitle);
  const sectionPart = formatSectionPart(r.sectionAnchor);
  const base = sectionPart ? `O-${chapterNum}.${sectionPart}` : `O-${chapterNum}`;
  return joinParaVerse(base, r);
}

/**
 * Formats the official UCDM-style citation for a search result, e.g.
 * "T-26.IV.4:7", "L-pII.1.1:1-7", "M-4.I-A.3:1-8", "T-Pre.II.1:1".
 * See [[project_search_feature]] / [[project_search_route_id_questions]]
 * (Claude memory) for the full confirmed notation this implements.
 */
export function formatRouteId(result: SearchResult): string {
  switch (result.book) {
    case 'theory': return formatTheoryRouteId(result);
    case 'workbook': return formatWorkbookRouteId(result);
    case 'mft': return formatMftRouteId(result);
    case 'psychotherapy': return formatPsychotherapyRouteId(result);
    case 'song': return formatSongRouteId(result);
    default: return formatParaVerse(result);
  }
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      await SQLite.importDatabaseFromAssetAsync(DATABASE_NAME, {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        assetId: require('@/assets/search/search-index.db'),
      });
      return SQLite.openDatabaseAsync(DATABASE_NAME);
    })();
  }
  return dbPromise;
}

// Control characters (\x01/\x02) that won't occur in the source Spanish
// text, used as match delimiters so splitSnippet() can find them unambiguously.
const HIGHLIGHT_START = '';
const HIGHLIGHT_END = '';

function toMatchQuery(query: string): string | null {
  const terms = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    // Escape FTS5 special characters and treat each term as a prefix match.
    .map((term) => `"${term.replace(/"/g, '""')}"*`);
  return terms.length ? terms.join(' ') : null;
}

export async function searchContent(query: string, limit = 50): Promise<SearchResult[]> {
  const matchQuery = toMatchQuery(query);
  if (!matchQuery) return [];

  const db = await getDb();
  const rows = await db.getAllAsync<{
    book: string;
    chapter_anchor: string | null;
    chapter_title: string | null;
    section_anchor: string | null;
    section_title: string | null;
    lesson_anchor: string | null;
    lesson_title: string | null;
    lesson_number: number | null;
    paragraph: number | null;
    verse_start: number | null;
    verse_end: number | null;
    anchor: string | null;
    text: string;
    snip: string;
  }>(
    `SELECT
       book, chapter_anchor, chapter_title, section_anchor, section_title,
       lesson_anchor, lesson_title, lesson_number, paragraph, verse_start, verse_end,
       anchor, text,
       snippet(search_index, 0, ?, ?, '…', 24) AS snip
     FROM search_index
     WHERE search_index MATCH ?
     ORDER BY rank
     LIMIT ?`,
    [HIGHLIGHT_START, HIGHLIGHT_END, matchQuery, limit]
  );

  return rows.map((row) => ({
    book: row.book,
    chapterAnchor: row.chapter_anchor,
    chapterTitle: row.chapter_title,
    sectionAnchor: row.section_anchor,
    sectionTitle: row.section_title,
    lessonAnchor: row.lesson_anchor,
    lessonTitle: row.lesson_title,
    lessonNumber: row.lesson_number,
    paragraph: row.paragraph,
    verseStart: row.verse_start,
    verseEnd: row.verse_end,
    anchor: row.anchor,
    text: row.text,
    snippet: row.snip,
  }));
}

/** Splits a snippet from searchContent() into plain/highlighted segments for rendering. */
export function splitSnippet(snippet: string): { text: string; highlighted: boolean }[] {
  const segments: { text: string; highlighted: boolean }[] = [];
  const pattern = new RegExp(`${HIGHLIGHT_START}(.*?)${HIGHLIGHT_END}`, 'gs');
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(snippet))) {
    if (match.index > lastIndex) {
      segments.push({ text: snippet.slice(lastIndex, match.index), highlighted: false });
    }
    segments.push({ text: match[1], highlighted: true });
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < snippet.length) {
    segments.push({ text: snippet.slice(lastIndex), highlighted: false });
  }
  return segments;
}

/**
 * Caps splitSnippet() output at maxChars (counting only visible text, not
 * highlight boundaries), cutting mid-segment if needed and appending '…'.
 * FTS5's own snippet() truncates by token count, which doesn't bound
 * character length precisely enough on its own for a fixed-width excerpt.
 */
export function truncateSnippetSegments(
  segments: { text: string; highlighted: boolean }[],
  maxChars: number
): { text: string; highlighted: boolean }[] {
  const totalLength = segments.reduce((sum, s) => sum + s.text.length, 0);
  if (totalLength <= maxChars) return segments;

  const result: { text: string; highlighted: boolean }[] = [];
  let remaining = maxChars;
  for (const segment of segments) {
    if (remaining <= 0) break;
    if (segment.text.length <= remaining) {
      result.push(segment);
      remaining -= segment.text.length;
    } else {
      result.push({ text: segment.text.slice(0, remaining), highlighted: segment.highlighted });
      remaining = 0;
    }
  }
  if (result.length) result[result.length - 1].text += '…';
  return result;
}
