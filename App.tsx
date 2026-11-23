
import React, { useState } from 'react';
import { SafeAreaView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { C } from './src/theme';
import { SavedLecture } from './src/storage';
import RecordScreen from './src/screens/RecordScreen';
import ResultScreen from './src/screens/ResultScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';

type Tab = 'record' | 'history' | 'settings';

export default function App() {
  const [tab, setTab] = useState<Tab>('record');
  const [activeLecture, setActiveLecture] = useState<SavedLecture | null>(null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={{ flex: 1 }}>
        {activeLecture ? (
          <ResultScreen
            lecture={activeLecture}
            onBack={() => setActiveLecture(null)}
          />
        ) : tab === 'record' ? (
          <RecordScreen onDone={(lec) => setActiveLecture(lec)} />
        ) : tab === 'history' ? (
          <HistoryScreen onSelect={(lec) => setActiveLecture(lec)} />
        ) : (
          <SettingsScreen />
        )}
      </View>

      {!activeLecture && (
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: C.surface,
            borderTopWidth: 1,
            borderTopColor: C.border,
            paddingHorizontal: 14,
            paddingVertical: 10,
            gap: 8,
          }}
        >
          {(
            [
              { id: 'record', label: 'Studio', icon: '🎙️' },
              { id: 'history', label: 'Library', icon: '📚' },
              { id: 'settings', label: 'Engine', icon: '⚙️' },
            ] as const
          ).map((item) => {
            const active = tab === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setTab(item.id)}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: active ? C.primaryGlow : 'transparent',
                  borderWidth: 1,
                  borderColor: active ? C.primary : 'transparent',
                }}
              >
                <Text style={{ fontSize: 15 }}>{item.icon}</Text>
                <Text
                  style={{
                    color: active ? C.text : C.subtext,
                    fontWeight: active ? '700' : '600',
                    fontSize: 13,
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </SafeAreaView>
  );
}
