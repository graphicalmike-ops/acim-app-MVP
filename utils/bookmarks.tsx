import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type BookId = 'theory' | 'workbook' | 'mft' | 'supplement';

export interface SavedBookmark {
  id: string;
  bookId: BookId;
  anchor: string;
  paragraph: number;
  notation: string;
  // The section's title (or, for a lesson/set with no sections, its own
  // name/subtitle) at save time — shown next to the notation as "T-26.IV.4:7
  // - La invitación al Espíritu Santo" so a saved item is recognizable
  // without re-opening it.
  name: string;
  note: string;
  date: string; // ISO
  // Exact verse numbers selected (e.g. [1, 3, 5] for a selection that skips
  // 2 and 4) — the citation notation still cites the min-max range, since
  // that's the only form ACIM citations support, but the shared/quoted text
  // and the reader's re-selection use this exact list.
  verses: number[];
}

// Reader route for a saved bookmark, including its exact verse list so the
// reader can re-select (underline) exactly the verses that were saved.
export function bookmarkHref(item: SavedBookmark): `/reader?${string}` {
  const versesParam = item.verses.length > 0 ? `&verses=${item.verses.join(',')}` : '';
  return `/reader?book=${item.bookId}&anchor=${item.anchor}&paragraph=${item.paragraph}${versesParam}`;
}

const KEY = 'acim_bookmarks';

interface BookmarksContextValue {
  bookmarks: SavedBookmark[];
  addBookmark: (input: Omit<SavedBookmark, 'id' | 'date'>) => void;
  deleteBookmark: (id: string) => void;
  clearAllBookmarks: () => void;
}

const BookmarksContext = createContext<BookmarksContextValue>({
  bookmarks: [],
  addBookmark: () => {},
  deleteBookmark: () => {},
  clearAllBookmarks: () => {},
});

export function BookmarksProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useState<SavedBookmark[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(raw => {
      if (raw) {
        try { setBookmarks(JSON.parse(raw) as SavedBookmark[]); } catch {}
      }
    });
  }, []);

  const addBookmark = useCallback((input: Omit<SavedBookmark, 'id' | 'date'>) => {
    setBookmarks(prev => {
      const next = [...prev, { ...input, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, date: new Date().toISOString() }];
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const deleteBookmark = useCallback((id: string) => {
    setBookmarks(prev => {
      const next = prev.filter(b => b.id !== id);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const clearAllBookmarks = useCallback(() => {
    setBookmarks([]);
    AsyncStorage.removeItem(KEY).catch(() => {});
  }, []);

  return (
    <BookmarksContext.Provider value={{ bookmarks, addBookmark, deleteBookmark, clearAllBookmarks }}>
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks() {
  return useContext(BookmarksContext);
}
