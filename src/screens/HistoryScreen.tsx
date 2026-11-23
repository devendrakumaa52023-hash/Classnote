import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { deleteLecture, loadLectures, SavedLecture } from '../storage';
import { C, g } from '../theme';

export default function HistoryScreen({ onSelect }: { onSelect: (l: SavedLecture) => void }) {
  const [list, setList] = useState<SavedLecture[]>([]);

  const refresh = () => loadLectures().then(setList);
  useEffect(() => {
    refresh();
  }, []);

  const remove = (id: string) => {
    Alert.alert('Delete Lecture?', 'This removes the saved notes from your phone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteLecture(id);
          refresh();
        },
      },
    ]);
  };

  return (
    <ScrollView style={g.screen} contentContainerStyle={g.container}>
      <View style={g.headerRow}>
        <View>
          <Text style={g.h1}>Lecture Library</Text>
          <Text style={g.subtitle}>{list.length} saved sessions</Text>
        </View>
      </View>

      {list.length === 0 ? (
        <View style={[g.card, { alignItems: 'center', paddingVertical: 32 }]}>
          <Text style={{ fontSize: 32, marginBottom: 10 }}>🎙️</Text>
          <Text style={{ color: C.text, fontWeight: '700', fontSize: 15 }}>No lectures yet</Text>
          <Text style={[g.subtitle, { textAlign: 'center', marginTop: 4 }]}>
            Record your first class in the Studio tab to generate handouts & DPPs.
          </Text>
        </View>
      ) : (
        list.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={g.card}
            onPress={() => onSelect(item)}
            onLongPress={() => remove(item.id)}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: C.accent, fontSize: 11, fontWeight: '700' }}>
                {item.meta.grade} • {item.meta.subject}
              </Text>
              <Text style={{ color: C.muted, fontSize: 11 }}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Text style={{ color: C.text, fontSize: 16, fontWeight: '800' }}>
              {item.result.title || item.meta.topic || 'Untitled Lecture'}
            </Text>
            <Text numberOfLines={2} style={{ color: C.subtext, fontSize: 13, marginTop: 4 }}>
              {item.result.summary}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}
