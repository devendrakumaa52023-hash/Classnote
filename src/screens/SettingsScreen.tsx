import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { DEFAULT_MODEL } from '../shared/lecture';
import { loadSettings, saveSettings, Settings } from '../storage';
import { C, g } from '../theme';

export default function SettingsScreen() {
  const [s, setS] = useState<Settings>({
    mode: 'direct',
    backendUrl: '',
    apiKey: '',
    model: DEFAULT_MODEL,
    secret: '',
  });

  useEffect(() => {
    loadSettings().then((loaded) => {
      setS({
        ...loaded,
        mode: 'direct',
        model: !loaded.model || loaded.model.includes('2.5') ? 'gemini-3.8-flash' : loaded.model,
      });
    });
  }, []);

  const handleSave = async () => {
    const cleanModel = (s.model || 'gemini-3.8-flash').trim();
    const updated: Settings = { ...s, apiKey: s.apiKey.trim(), model: cleanModel };
    setS(updated);
    await saveSettings(updated);
    Alert.alert('Saved', `Engine configured with ${cleanModel}`);
  };

  return (
    <ScrollView style={g.screen} contentContainerStyle={g.container}>
      <View style={g.headerRow}>
        <View>
          <Text style={g.h1}>AI Engine</Text>
          <Text style={g.subtitle}>API Key & Model Routing</Text>
        </View>
        <View style={g.brandBadge}>
          <Text style={g.brandBadgeText}>{s.mode === 'direct' ? 'DIRECT' : 'SERVER'}</Text>
        </View>
      </View>

      <View style={g.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: C.text, fontSize: 15, fontWeight: '700' }}>
              Direct Device API Key
            </Text>
            <Text style={{ color: C.subtext, fontSize: 12, marginTop: 2 }}>
              Calls Gemini directly from your phone with zero server middleman
            </Text>
          </View>
          <Switch
            value={s.mode === 'direct'}
            onValueChange={(v) => setS({ ...s, mode: v ? 'direct' : 'backend' })}
            trackColor={{ false: C.border, true: C.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <Text style={[g.sectionLabel, { marginTop: 18 }]}>Gemini API Key</Text>
        <TextInput
          value={s.apiKey}
          onChangeText={(v) => setS({ ...s, apiKey: v })}
          placeholder="AIzaSy..."
          placeholderTextColor={C.muted}
          autoCapitalize="none"
          style={g.input}
        />

        <Text style={[g.sectionLabel, { marginTop: 18 }]}>Gemini Model</Text>
        <TextInput
          value={s.model}
          onChangeText={(v) => setS({ ...s, model: v })}
          placeholder="gemini-3.8-flash"
          placeholderTextColor={C.muted}
          autoCapitalize="none"
          style={g.input}
        />

        {s.mode === 'backend' && (
          <>
            <Text style={[g.sectionLabel, { marginTop: 18 }]}>Backend URL</Text>
            <TextInput
              value={s.backendUrl}
              onChangeText={(v) => setS({ ...s, backendUrl: v })}
              placeholder="https://your-server.onrender.com"
              placeholderTextColor={C.muted}
              autoCapitalize="none"
              style={g.input}
            />
          </>
        )}
      </View>

      <TouchableOpacity style={g.primaryBtn} onPress={handleSave}>
        <Text style={g.primaryBtnText}>Save Engine Configuration</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
