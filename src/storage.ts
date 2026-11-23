import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_MODEL, LectureResult, Meta } from './shared/lecture';

export type Settings = { mode: 'backend' | 'direct'; backendUrl: string; apiKey: string; model: string; secret: string };
export type SavedLecture = { id: string; createdAt: number; meta: Meta; result: LectureResult; audioUri: string };

export const defaultSettings: Settings = {
  mode: 'direct',
  backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL ?? '',
  apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '',
  model: process.env.EXPO_PUBLIC_GEMINI_MODEL ?? DEFAULT_MODEL,
  secret: '',
};

export async function loadSettings(): Promise<Settings> {
  try { return { ...defaultSettings, ...JSON.parse((await AsyncStorage.getItem('settings')) || '{}') }; }
  catch { return defaultSettings; }
}
export const saveSettings = (s: Settings) => AsyncStorage.setItem('settings', JSON.stringify(s));

export async function loadLectures(): Promise<SavedLecture[]> {
  try { return JSON.parse((await AsyncStorage.getItem('lectures')) || '[]'); } catch { return []; }
}
export async function saveLecture(l: SavedLecture) {
  const all = await loadLectures();
  await AsyncStorage.setItem('lectures', JSON.stringify([l, ...all.filter((x) => x.id !== l.id)]));
}
export async function deleteLecture(id: string) {
  const all = await loadLectures();
  await AsyncStorage.setItem('lectures', JSON.stringify(all.filter((x) => x.id !== id)));
}
