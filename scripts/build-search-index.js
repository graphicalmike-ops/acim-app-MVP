#!/usr/bin/env node

/**
 * Builds assets/search/search-index.db, a SQLite FTS5 full-text index over
 * every content JSON file under assets/content/.
 *
 * Each indexed row is one logical paragraph (fragments split across a
 * stanza/quote are merged into a single row — see buildRows()). Route-id
 * formatting (e.g. "T-26.IV.4:7") is NOT baked into the index: chapter/section
 * anchors and titles carry enough structure (see formatRouteId() in
 * utils/search.ts) for the app to derive the citation from the stored
 * metadata columns, without needing to rebuild the index if the naming
 * convention ever changes.
 *
 * Run with: node scripts/build-search-index.js
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const CONTENT_DIR = path.join(__dirname, '..', 'assets', 'content');
const OUT_DIR = path.join(__dirname, '..', 'assets', 'search');
const OUT_FILE = path.join(OUT_DIR, 'search-index.db');

// Maps a content file (relative to assets/content/) to a stable book id.
// Index files (theory-index.json, workbook-index.json, etc.) are nav data,
// not readable content, and are intentionally excluded.
const BOOK_FILES = [
  { book: 'theory', files: globDir('theory') },
  { book: 'workbook', files: globDir('workbook') },
  { book: 'mft', files: ['mft.json'] },
  { book: 'mft', files: ['mft-clarification.json'] },
  { book: 'psychotherapy', files: ['supplements.json'] },
  { book: 'song', files: ['supplement-song.json'] },
];

function globDir(dir) {
  const full = path.join(CONTENT_DIR, dir);
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(dir, f));
}

function flattenSentences(sentences) {
  // Mirrors the Reader's own rendering, which inserts a space between every
  // sentence fragment (app/reader.tsx) regardless of inline/italic splits;
  // collapsing repeated whitespace afterwards keeps snippets clean.
  return sentences
    .map((s) => s.content)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseLessonNumber(anchor) {
  const m = anchor && anchor.match(/^workbook-l(\d+)$/);
  return m ? Number(m[1]) : null;
}

// Chapters whose paragraphs carry no explicit number in the source at all
// (unlike a stanza-continuation's `paragraph: null`, which inherits the
// preceding real number — these have no preceding number to inherit).
// "Anexo a Un Curso de Milagros" is cited as P-Anexo.<n> using the ordinal
// position of each paragraph (confirmed 2026-07-10). Workbook review lessons
// have a similar unnumbered opening line, but those stay uncited on purpose
// (confirmed same session) — do not add them here.
const ORDINAL_PARAGRAPH_CHAPTERS = new Set(['supplement-anexo']);

function buildRows(book, filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const entries = JSON.parse(raw);

  const rows = [];
  let chapterAnchor = null;
  let chapterTitle = null;
  let sectionAnchor = null;
  let sectionTitle = null;
  let lessonAnchor = null;
  let lessonTitle = null;
  let order = 0;
  let ordinalParagraphCounter = 0;

  // A paragraph interrupted by a stanza/quote is split across multiple
  // sequential JSON entries (text -> stanza -> text, sometimes with a second
  // stanza). Continuation fragments mark `paragraph: null` to mean "still
  // part of the previous paragraph" (occasionally they repeat the same
  // explicit number instead of null). Without merging these, each fragment
  // becomes its own search row with an incomplete verse range, and the
  // `paragraph: null` fragments would be indexed with no paragraph number at
  // all. This accumulator merges every fragment of one logical paragraph
  // into a single row, in source order, before it's written out — the
  // content JSON and the reader's own stanza rendering are untouched, this
  // only affects how the search index groups rows.
  let group = null; // { paragraph, blockType, sentenceTexts: [], verses: [] }

  function flushGroup() {
    if (!group) return;
    const text = group.sentenceTexts.join(' ').replace(/\s+/g, ' ').trim();
    if (text) {
      order += 1;
      // Lettered footnote verses ("a", "b") are cited as their preceding
      // numbered verse, not their own number — they never extend a verse
      // range, so only integers count toward verseStart/verseEnd.
      const numericVerses = group.verses.filter((v) => typeof v === 'number');
      const verseStart = numericVerses.length ? Math.min(...numericVerses) : null;
      const verseEnd = numericVerses.length ? Math.max(...numericVerses) : null;
      rows.push({
        book,
        chapterAnchor,
        chapterTitle,
        sectionAnchor,
        sectionTitle,
        lessonAnchor,
        lessonTitle,
        lessonNumber: parseLessonNumber(lessonAnchor),
        paragraph: group.paragraph,
        verseStart,
        verseEnd,
        blockType: group.blockType,
        order,
        // Nearest anchor the reader can actually scroll to today.
        anchor: sectionAnchor || lessonAnchor || chapterAnchor,
        text,
      });
    }
    group = null;
  }

  for (const entry of entries) {
    const { type } = entry;

    if (type === 'book-heading' || type === 'part-heading') {
      // Book/part headings are structural only; they don't reset chapter context.
      continue;
    }

    if (type === 'chapter-heading' || type === 'lesson-group-heading' || type === 'lesson-set-heading') {
      flushGroup();
      chapterAnchor = entry.anchor;
      chapterTitle = entry.title;
      sectionAnchor = null;
      sectionTitle = null;
      lessonAnchor = null;
      lessonTitle = null;
      ordinalParagraphCounter = 0;
      continue;
    }

    if (type === 'section-heading') {
      flushGroup();
      sectionAnchor = entry.anchor;
      sectionTitle = entry.title;
      continue;
    }

    if (type === 'lesson-heading') {
      flushGroup();
      lessonAnchor = entry.anchor;
      lessonTitle = entry.subtitle || entry.title;
      sectionAnchor = null;
      sectionTitle = null;
      continue;
    }

    if (type === 'text' || type === 'stanza') {
      const sentences = entry.sentences || [];
      const fragmentText = flattenSentences(sentences);
      if (!fragmentText) continue;
      const fragmentVerses = sentences.map((s) => s.verse);

      // `paragraph: null` only means "continue the group" when the group
      // already has a real number to inherit into. A document/section where
      // paragraphs are never numbered at all (e.g. "Anexo a Un Curso de
      // Milagros") produces a run of independent entries that are ALL
      // `paragraph: null` — those are separate paragraphs, not one fragment
      // stretched across a stanza, and must not collapse into a single row.
      // Ordinal-numbered chapters are never a continuation: every entry gets
      // its own fresh ordinal (confirmed none of them are stanza-split), and
      // group.paragraph holding a *computed* ordinal must not be mistaken
      // for a real source number that a later `paragraph: null` could inherit.
      const isContinuation = !ORDINAL_PARAGRAPH_CHAPTERS.has(chapterAnchor)
        && group != null && group.paragraph != null
        && (entry.paragraph == null || entry.paragraph === group.paragraph);
      if (isContinuation) {
        group.sentenceTexts.push(fragmentText);
        group.verses.push(...fragmentVerses);
      } else {
        flushGroup();
        let paragraph = entry.paragraph ?? null;
        if (paragraph == null && ORDINAL_PARAGRAPH_CHAPTERS.has(chapterAnchor)) {
          ordinalParagraphCounter += 1;
          paragraph = ordinalParagraphCounter;
        }
        group = {
          paragraph,
          blockType: type,
          sentenceTexts: [fragmentText],
          verses: [...fragmentVerses],
        };
      }
    }
  }

  flushGroup();

  return rows;
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  if (fs.existsSync(OUT_FILE)) fs.unlinkSync(OUT_FILE);

  const db = new Database(OUT_FILE);
  db.pragma('journal_mode = DELETE'); // avoid shipping a -wal/-shm sidecar file as an asset

  db.exec(`
    CREATE VIRTUAL TABLE search_index USING fts5(
      text,
      book UNINDEXED,
      chapter_anchor UNINDEXED,
      chapter_title UNINDEXED,
      section_anchor UNINDEXED,
      section_title UNINDEXED,
      lesson_anchor UNINDEXED,
      lesson_title UNINDEXED,
      lesson_number UNINDEXED,
      paragraph UNINDEXED,
      verse_start UNINDEXED,
      verse_end UNINDEXED,
      block_type UNINDEXED,
      anchor UNINDEXED,
      sort_order UNINDEXED,
      tokenize = 'unicode61 remove_diacritics 2'
    );
  `);

  const insert = db.prepare(`
    INSERT INTO search_index (
      text, book, chapter_anchor, chapter_title, section_anchor, section_title,
      lesson_anchor, lesson_title, lesson_number, paragraph, verse_start, verse_end,
      block_type, anchor, sort_order
    ) VALUES (
      @text, @book, @chapterAnchor, @chapterTitle, @sectionAnchor, @sectionTitle,
      @lessonAnchor, @lessonTitle, @lessonNumber, @paragraph, @verseStart, @verseEnd,
      @blockType, @anchor, @order
    )
  `);

  let total = 0;
  const insertMany = db.transaction((rows) => {
    for (const row of rows) insert.run(row);
  });

  for (const group of BOOK_FILES) {
    for (const relFile of group.files) {
      const filePath = path.join(CONTENT_DIR, relFile);
      if (!fs.existsSync(filePath)) {
        console.warn(`skip (missing): ${relFile}`);
        continue;
      }
      const rows = buildRows(group.book, filePath);
      insertMany(rows);
      total += rows.length;
      console.log(`${relFile}: ${rows.length} rows`);
    }
  }

  db.close();
  console.log(`\nWrote ${total} rows to ${path.relative(process.cwd(), OUT_FILE)}`);
}

main();
