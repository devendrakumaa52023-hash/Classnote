import React, { useState } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import RecordScreen from './src/screens/RecordScreen';
import ResultScreen from './src/screens/ResultScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { SavedLecture } from './src/storage';
import { C, g } from './src/theme';

const TABS = [['record', '🎙 Record'], ['history', '📚 History'], ['settings', '⚙ Settings']] as const;

export default function App() {
  const [tab, setTab] = useState<'record' | 'history' | 'settings'>('record');
  const [open, setOpen] = useState<SavedLecture | null>(null);
  const [recording, setRecording] = useState(false);
  return (
    <SafeAreaView style={[g.screen, { paddingTop: 28 }]}>
      <StatusBar style="light" />
      <View style={{ flex: 1 }}>
        {open ? <ResultScreen lecture={open} onBack={() => setOpen(null)} />
          : tab === 'record' ? <RecordScreen onDone={setOpen} />
          : tab === 'history' ? <HistoryScreen key={String(open)} onOpen={setOpen} />
          : <SettingsScreen />}
      </View>
      {!open && (
        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: C.line, backgroundColor: C.card }}>
          {TABS.map(([k, label]) => (
            <TouchableOpacity key={k} style={{ flex: 1, padding: 14 }} onPress={() => setTab(k)}>
              <Text style={{ textAlign: 'center', color: tab === k ? C.accent : C.dim, fontWeight: '700' }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}
