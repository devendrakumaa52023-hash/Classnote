
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  PermissionsAndroid,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { processLecture } from '../api';
import { loadSettings, saveLecture, SavedLecture } from '../storage';
import { Meta } from '../shared/lecture';
import { C, g } from '../theme';

const GRADES = ['Class 10', 'Class 11', 'Class 12', 'JEE', 'NEET'];
const SUBJECTS = ['Physics', 'Chemistry', 'Maths', 'Biology', 'Other'];

const OPTIONS: any = {
  ...RecordingPresets.HIGH_QUALITY,
  extension: '.m4a',
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 32000,
  isMeteringEnabled: true,
  android: { extension: '.m4a', outputFormat: 'mpeg4', audioEncoder: 'aac' },
};

const fmt = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export default function RecordScreen({ onDone }: { onDone: (l: SavedLecture) => void }) {
  const [meta, setMeta] = useState<Meta>({
    grade: 'Class 11',
    subject: 'Physics',
    topic: '',
    language: 'English + Hinglish',
  });
  const [phase, setPhase] = useState<'setup' | 'recording' | 'processing' | 'error'>('setup');
  const [paused, setPaused] = useState(false);
  const [stage, setStage] = useState('');
  const [err, setErr] = useState('');
  const [savedAudio, setSavedAudio] = useState<{ id: string; uri: string } | null>(null);

  const recorder = useAudioRecorder(OPTIONS);
  const st = useAudioRecorderState(recorder, 250);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (phase === 'recording' && !paused) {
      const db = typeof st.metering === 'number' ? st.metering : -50;
      const scale = 1 + Math.max(0, Math.min(0.28, (db + 55) / 140));
      Animated.spring(pulse, { toValue: scale, useNativeDriver: true, friction: 6 }).start();
    } else {
      pulse.setValue(1);
    }
  }, [st.metering, phase, paused]);

  const startRecording = async () => {
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Microphone access is required to record lectures.');
        return;
      }
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        shouldPlayInBackground: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setPaused(false);
      setPhase('recording');
    } catch (e: any) {
      Alert.alert('Mic Error', e?.message || 'Could not start recording.');
    }
  };

  const togglePause = () => {
    if (paused) {
      recorder.record();
      setPaused(false);
    } else {
      recorder.pause();
      setPaused(true);
    }
  };

  const runAI = async (id: string, uri: string) => {
    setPhase('processing');
    setErr('');
    try {
      const settings = await loadSettings();
      const result = await processLecture(uri, meta, settings, setStage);
      const item: SavedLecture = {
        id,
        createdAt: Date.now(),
        meta,
        result,
        audioUri: uri,
      };
      await saveLecture(item);
      setPhase('setup');
      onDone(item);
    } catch (e: any) {
      setErr(e?.message || 'AI synthesis failed');
      setPhase('error');
    }
  };

  const finishAndGenerate = async () => {
    try {
      await recorder.stop();
      const rawUri = recorder.uri;
      if (!rawUri) throw new Error('No audio file captured.');
      const id = String(Date.now());
      const dir = `${FileSystem.documentDirectory}lectures/`;
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      const dest = `${dir}${id}.m4a`;
      await FileSystem.copyAsync({ from: rawUri, to: dest });
      setSavedAudio({ id, uri: dest });
      await runAI(id, dest);
    } catch (e: any) {
      setErr(e?.message || 'Failed to save audio');
      setPhase('error');
    }
  };

  if (phase === 'processing') {
    return (
      <View style={[g.screen, { justifyContent: 'center', alignItems: 'center', padding: 28 }]}>
        <View
          style={{
            width: 84,
            height: 84,
            borderRadius: 42,
            backgroundColor: C.primaryGlow,
            borderWidth: 1.5,
            borderColor: C.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <ActivityIndicator size="large" color={C.accent} />
        </View>
        <Text style={[g.h1, { textAlign: 'center' }]}>Synthesizing ClassNote</Text>
        <Text style={{ color: C.accent, fontSize: 14, fontWeight: '600', marginTop: 8 }}>
          {stage || 'Structuring concepts, doubts & DPP...'}
        </Text>
        <Text style={[g.subtitle, { textAlign: 'center', marginTop: 10 }]}>
          Audio is safely backed up locally on your phone.
        </Text>
      </View>
    );
  }

  if (phase === 'error') {
    return (
      <View style={[g.screen, { justifyContent: 'center', padding: 24 }]}>
        <View style={[g.card, { borderColor: C.danger }]}>
          <Text style={{ color: C.danger, fontSize: 18, fontWeight: '800', marginBottom: 8 }}>
            Processing Interrupted
          </Text>
          <Text style={{ color: C.text, fontSize: 13, lineHeight: 20 }}>{err}</Text>
          <Text style={{ color: C.subtext, fontSize: 12, marginTop: 12 }}>
            Your lecture audio is safely saved on this device.
          </Text>
        </View>
        {savedAudio && (
          <TouchableOpacity
            style={[g.primaryBtn, { marginTop: 8 }]}
            onPress={() => runAI(savedAudio.id, savedAudio.uri)}
          >
            <Text style={g.primaryBtnText}>Retry AI Generation</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={{ alignItems: 'center', paddingVertical: 14 }}
          onPress={() => setPhase('setup')}
        >
          <Text style={{ color: C.subtext, fontWeight: '700' }}>Back to Studio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === 'recording') {
    return (
      <View style={[g.screen, { justifyContent: 'space-between', padding: 24 }]}>
        <View style={g.headerRow}>
          <View>
            <Text style={g.h1}>Live Capture</Text>
            <Text style={g.subtitle}>
              {meta.grade} • {meta.subject}
            </Text>
          </View>
          <View
            style={[
              g.brandBadge,
              {
                borderColor: paused ? C.warning : C.danger,
                backgroundColor: paused ? 'rgba(245,158,11,0.16)' : 'rgba(244,63,94,0.16)',
              },
            ]}
          >
            <Text style={{ color: paused ? C.warning : C.danger, fontSize: 11, fontWeight: '800' }}>
              {paused ? '● PAUSED' : '● ON AIR'}
            </Text>
          </View>
        </View>

        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View
            style={{
              width: 190,
              height: 190,
              borderRadius: 95,
              backgroundColor: C.primaryGlow,
              borderWidth: 2,
              borderColor: paused ? C.warning : C.primary,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: pulse }],
            }}
          >
            <View
              style={{
                width: 146,
                height: 146,
                borderRadius: 73,
                backgroundColor: C.card,
                borderWidth: 1,
                borderColor: C.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: C.text, fontSize: 34, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
                {fmt(st.durationMillis || 0)}
              </Text>
              <Text style={{ color: C.accent, fontSize: 11, fontWeight: '700', marginTop: 4 }}>
                POCKET MODE READY
              </Text>
            </View>
          </Animated.View>
          <Text style={[g.subtitle, { textAlign: 'center', marginTop: 22, maxWidth: 270 }]}>
            You can lock your screen and keep the phone in your shirt pocket while teaching.
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          <TouchableOpacity
            onPress={togglePause}
            style={{
              backgroundColor: C.cardElevated,
              borderWidth: 1,
              borderColor: C.border,
              borderRadius: 16,
              paddingVertical: 15,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: C.text, fontWeight: '700', fontSize: 15 }}>
              {paused ? '▶ Resume Lecture' : '⏸ Pause Lecture'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={finishAndGenerate}
            style={[g.primaryBtn, { backgroundColor: C.success, shadowColor: C.success }]}
          >
            <Text style={g.primaryBtnText}>✨ Finish & Generate Notes</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={g.screen} contentContainerStyle={g.container}>
      <View style={g.headerRow}>
        <View>
          <Text style={g.h1}>ClassNote AI</Text>
          <Text style={g.subtitle}>Classroom Lecture to Handout & DPP</Text>
        </View>
        <View style={g.brandBadge}>
          <Text style={g.brandBadgeText}>GEMINI 3.8</Text>
        </View>
      </View>

      <View style={g.card}>
        <Text style={g.sectionLabel}>1. Target Batch / Grade</Text>
        <View style={g.row}>
          {GRADES.map((gr) => (
            <TouchableOpacity
              key={gr}
              onPress={() => setMeta({ ...meta, grade: gr })}
              style={[g.chip, meta.grade === gr && g.chipOn]}
            >
              <Text style={[g.chipText, meta.grade === gr && g.chipTextOn]}>{gr}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[g.sectionLabel, { marginTop: 18 }]}>2. Subject</Text>
        <View style={g.row}>
          {SUBJECTS.map((sub) => (
            <TouchableOpacity
              key={sub}
              onPress={() => setMeta({ ...meta, subject: sub })}
              style={[g.chip, meta.subject === sub && g.chipOn]}
            >
              <Text style={[g.chipText, meta.subject === sub && g.chipTextOn]}>{sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[g.sectionLabel, { marginTop: 18 }]}>3. Chapter / Topic (Optional)</Text>
        <TextInput
          value={meta.topic}
          onChangeText={(t) => setMeta({ ...meta, topic: t })}
          placeholder="e.g., Rotational Dynamics — Moment of Inertia"
          placeholderTextColor={C.muted}
          style={g.input}
        />
      </View>

      <TouchableOpacity style={g.primaryBtn} onPress={startRecording}>
        <Text style={g.primaryBtnText}>🎙️ Start Classroom Recording</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
