import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, PermissionsAndroid, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { processLecture } from '../api';
import { loadSettings, saveLecture, SavedLecture } from '../storage';
import { Meta } from '../shared/lecture';
import { C, g } from '../theme';

const GRADES = ['Class 10', 'Class 11', 'Class 12', 'JEE', 'NEET'];
const SUBJECTS = ['Physics', 'Chemistry', 'Maths', 'Biology', 'Science', 'Other'];
const OPTIONS: any = {
  ...RecordingPresets.HIGH_QUALITY,
  extension: '.m4a', sampleRate: 16000, numberOfChannels: 1, bitRate: 32000, isMeteringEnabled: true,
  android: { extension: '.m4a', outputFormat: 'mpeg4', audioEncoder: 'aac' },
};

const Chips = <T extends string | number>({ items, value, onPick }: { items: T[]; value: T; onPick: (v: T) => void }) => (
  <View style={g.row}>
    {items.map((i) => (
      <TouchableOpacity key={String(i)} style={[g.chip, value === i && g.chipOn]} onPress={() => onPick(i)}>
        <Text style={[g.chipText, value === i && g.chipTextOn]}>{String(i)}</Text>
      </TouchableOpacity>
    ))}
  </View>
);
const fmt = (ms: number) => { const s = Math.floor(ms / 1000); return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };

export default function RecordScreen({ onDone }: { onDone: (l: SavedLecture) => void }) {
  const [meta, setMeta] = useState<Meta>({ grade: 'Class 10', subject: 'Physics', language: 'Hinglish', extraQuestions: 10 });
  const [phase, setPhase] = useState<'setup' | 'recording' | 'processing' | 'error'>('setup');
  const [paused, setPaused] = useState(false);
  const [stage, setStage] = useState('');
  const [err, setErr] = useState('');
  const [saved, setSaved] = useState<{ id: string; uri: string } | null>(null);
  const recorder = useAudioRecorder(OPTIONS);
  const st = useAudioRecorderState(recorder, 250);
  const level = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    const db = typeof st.metering === 'number' ? st.metering : -60;
    Animated.timing(level, { toValue: paused ? 0.1 : Math.max(0.1, Math.min(1, (db + 60) / 60)), duration: 200, useNativeDriver: true }).start();
  }, [st.metering, paused]);

  async function start() {
    const p = await requestRecordingPermissionsAsync();
    if (!p.granted) return Alert.alert('Microphone permission needed', 'Allow microphone access to record the lecture.');
    if (Platform.OS === 'android' && Platform.Version >= 33) await PermissionsAndroid.request('android.permission.POST_NOTIFICATIONS' as any);
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true, shouldPlayInBackground: true, allowsBackgroundRecording: true } as any);
      await recorder.prepareToRecordAsync();
      recorder.record();
      setPaused(false); setPhase('recording');
    } catch (e: any) { Alert.alert('Could not start recording', e.message); }
  }
  const togglePause = () => { if (paused) recorder.record(); else recorder.pause(); setPaused(!paused); };

  async function finish() {
    await recorder.stop();
    const src = recorder.uri;
    if (!src) { setErr('No audio was recorded.'); return setPhase('error'); }
    const id = String(Date.now());
    const dir = FileSystem.documentDirectory + 'lectures/';
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
    const dest = `${dir}${id}.m4a`;
    await FileSystem.copyAsync({ from: src, to: dest });
    setSaved({ id, uri: dest });
    run(id, dest);
  }

  async function run(id: string, uri: string) {
    setPhase('processing'); setErr('');
    try {
      const settings = await loadSettings();
      const result = await processLecture(uri, meta, settings, setStage);
      const entry: SavedLecture = { id, createdAt: Date.now(), meta, result, audioUri: uri };
      await saveLecture(entry);
      setPhase('setup'); setSaved(null);
      onDone(entry);
    } catch (e: any) { setErr(e.message || String(e)); setPhase('error'); }
  }

  if (phase === 'recording') {
    return (
      <View style={[g.screen, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
        <Text style={g.dim}>{meta.grade} • {meta.subject} • {meta.language}</Text>
        <Animated.View style={{ marginVertical: 36, width: 140, height: 140, borderRadius: 70, backgroundColor: paused ? C.dim : C.bad, opacity: 0.85, transform: [{ scale: Animated.add(0.7, level) }] }} />
        <Text style={{ color: C.text, fontSize: 48, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{fmt(st.durationMillis)}</Text>
        <Text style={[g.dim, { marginTop: 8 }]}>{paused ? 'Paused' : 'Recording… you can lock the screen and pocket the phone.'}</Text>
        <TouchableOpacity style={[g.btn, g.btn2, { width: '100%' }]} onPress={togglePause}><Text style={[g.btnText, { color: C.text }]}>{paused ? '▶ Resume' : '⏸ Pause'}</Text></TouchableOpacity>
        <TouchableOpacity style={[g.btn, { width: '100%' }]} onPress={finish}><Text style={g.btnText}>Finish & Generate Handout</Text></TouchableOpacity>
      </View>
    );
  }
  if (phase === 'processing') {
    return (
      <View style={[g.screen, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={[g.text, { marginTop: 16, textAlign: 'center' }]}>{stage || 'Working…'}</Text>
        <Text style={[g.dim, { marginTop: 8, textAlign: 'center' }]}>Long lectures can take a few minutes. Audio is saved on your phone.</Text>
      </View>
    );
  }
  if (phase === 'error') {
    return (
      <View style={[g.screen, { justifyContent: 'center', padding: 24 }]}>
        <Text style={[g.h1, { color: C.bad }]}>Processing failed</Text>
        <Text style={g.text}>{err}</Text>
        <Text style={[g.dim, { marginTop: 8 }]}>Your recording is safe on the device.</Text>
        {saved && <TouchableOpacity style={g.btn} onPress={() => run(saved.id, saved.uri)}><Text style={g.btnText}>Retry</Text></TouchableOpacity>}
        <TouchableOpacity style={[g.btn, g.btn2]} onPress={() => { setPhase('setup'); setSaved(null); }}><Text style={[g.btnText, { color: C.text }]}>Back</Text></TouchableOpacity>
      </View>
    );
  }
  return (
    <ScrollView style={g.screen} contentContainerStyle={g.pad}>
      <Text style={g.h1}>New Class</Text>
      <Text style={g.label}>Grade / Exam</Text><Chips items={GRADES} value={meta.grade} onPick={(grade) => setMeta({ ...meta, grade })} />
      <Text style={g.label}>Subject</Text><Chips items={SUBJECTS} value={meta.subject} onPick={(subject) => setMeta({ ...meta, subject })} />
      <Text style={g.label}>Language</Text><Chips items={['English', 'Hinglish'] as const} value={meta.language} onPick={(language) => setMeta({ ...meta, language })} />
      <Text style={g.label}>Extra practice questions</Text><Chips items={[5, 10, 15] as const} value={meta.extraQuestions} onPick={(extraQuestions) => setMeta({ ...meta, extraQuestions })} />
      <TouchableOpacity style={g.btn} onPress={start}><Text style={g.btnText}>🎙 Start Class</Text></TouchableOpacity>
      <Text style={[g.dim, { marginTop: 12 }]}>Tip: tap Start, lock the screen and place the phone in your shirt pocket with the mic facing out.</Text>
    </ScrollView>
  );
}
