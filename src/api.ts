import * as FileSystem from 'expo-file-system/legacy';
import { parseResult, FALLBACK_MODEL, LectureResult, Meta } from './shared/lecture';
import { buildLectureSystemPrompt, responseSchema } from './constants/geminiPrompt';
import { Settings } from './storage';

const BASE = 'https://generativelanguage.googleapis.com';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function processLecture(uri: string, meta: Meta, s: Settings, onStage: (t: string) => void): Promise<LectureResult> {
  return s.mode === 'backend' ? viaBackend(uri, meta, s, onStage) : viaDevice(uri, meta, s, onStage);
}

async function viaBackend(uri: string, meta: Meta, s: Settings, onStage: (t: string) => void) {
  if (!s.backendUrl) throw new Error('Set the Backend URL in Settings (or switch to Direct API Key mode).');
  onStage('Uploading audio to server…');
  const res = await FileSystem.uploadAsync(`${s.backendUrl.replace(/\/$/, '')}/api/process-lecture`, uri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: { 'Content-Type': 'audio/mp4', 'x-meta': JSON.stringify(meta), 'x-api-secret': s.secret },
  });
  if (res.status !== 200) {
    let msg = res.body; try { msg = JSON.parse(res.body).error; } catch {}
    throw new Error(`Server error ${res.status}: ${msg}`);
  }
  return parseResult(res.body);
}

async function viaDevice(uri: string, meta: Meta, s: Settings, onStage: (t: string) => void) {
  if (!s.apiKey) throw new Error('Add your Gemini API key in Settings.');
  const key = s.apiKey;
  onStage('Uploading audio to Gemini Files API…');
  const up = await FileSystem.uploadAsync(`${BASE}/upload/v1beta/files?key=${key}`, uri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: { 'X-Goog-Upload-Protocol': 'raw', 'Content-Type': 'audio/mp4' },
  });
  if (up.status !== 200) throw new Error(`Upload failed (${up.status}): ${up.body.slice(0, 200)}`);
  let file = JSON.parse(up.body).file;
  onStage('Preparing audio…');
  for (let i = 0; i < 90 && file.state === 'PROCESSING'; i++) {
    await sleep(2000);
    file = await (await fetch(`${BASE}/v1beta/${file.name}?key=${key}`)).json();
  }
  if (file.state !== 'ACTIVE') throw new Error('Gemini could not process the audio file.');
  try {
    let lastErr = '';
    for (const model of [s.model, FALLBACK_MODEL]) {
      onStage(`Transcribing & building handout (${model})…`);
      const r = await fetch(`${BASE}/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: buildLectureSystemPrompt({ grade: meta.grade, subject: meta.subject, language: meta.language, questionCount: meta.extraQuestions }) }] },
          contents: [{ role: 'user', parts: [{ fileData: { mimeType: file.mimeType, fileUri: file.uri } }, { text: 'Process the attached lecture recording and return the JSON.' }] }],
          generationConfig: { responseMimeType: 'application/json', responseSchema, temperature: 0.2 },
        }),
      });
      const j = await r.json();
      if (r.ok) return parseResult(j.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') ?? '');
      lastErr = j.error?.message || `HTTP ${r.status}`;
    }
    throw new Error(lastErr);
  } finally {
    fetch(`${BASE}/v1beta/${file.name}?key=${key}`, { method: 'DELETE' }).catch(() => {});
  }
}
