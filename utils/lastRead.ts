import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LastReadState {
  bookId: string;
  anchor: string;
  breadcrumb: string;
  title: string;
}

const KEY = 'acim_last_read';

export async function saveLastRead(state: LastReadState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

export async function loadLastRead(): Promise<LastReadState | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LastReadState;
  } catch {
    return null;
  }
}

export async function clearLastRead(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {}
}
