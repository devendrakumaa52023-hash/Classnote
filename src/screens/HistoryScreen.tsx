import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { deleteLecture, loadLectures, SavedLecture } from '../storage';
import { C, g } from '../theme';

export default function HistoryScreen({ onOpen }: { onOpen: (l: SavedLecture) => void }) {
  const [items, setItems] = useState<SavedLecture[]>([]);
  const refresh = useCallback(() => { loadLectures().then(setItems); }, []);
  useEffect(refresh, []);
  return (
    <View style={g.screen}>
      <FlatList
        contentContainerStyle={g.pad}
        data={items}
        keyExtractor={(i) => i.id}
        ListHeaderComponent={<Text style={g.h1}>Past Lectures</Text>}
        ListEmptyComponent={<Text style={g.dim}>No lectures yet. Record your first class!</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={g.card} onPress={() => onOpen(item)}
            onLongPress={() => Alert.alert('Delete lecture?', item.result.handout.title, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: async () => { await deleteLecture(item.id); refresh(); } },
            ])}>
            <Text style={[g.text, { fontWeight: '700' }]}>{item.result.handout.title}</Text>
            <Text style={g.dim}>{item.meta.grade} • {item.meta.subject} • {new Date(item.createdAt).toLocaleString()}</Text>
            <Text style={[g.dim, { color: C.accent }]}>{item.result.student_doubts.length} doubts • {item.result.worksheet.mcqs.length} MCQs</Text>
          </TouchableOpacity>
        )}
      />
      <Text style={[g.dim, { textAlign: 'center', paddingBottom: 8 }]}>Long-press a lecture to delete it</Text>
    </View>
  );
}
