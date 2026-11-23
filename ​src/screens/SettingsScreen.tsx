import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { loadSettings, saveSettings, Settings } from '../storage';
import { C, g } from '../theme';

export default function SettingsScreen() {
  const [s, setS] = useState<Settings | null>(null);
  useEffect(() => { loadSettings().then(setS); }, []);
  if (!s) return null;
  const f = (k: keyof Settings, label: string, secure = false) => (
    <>
      <Text style={g.label}>{label}</Text>
      <TextInput style={g.input} value={String(s[k])} secureTextEntry={secure} autoCapitalize="none" autoCorrect={false}
        placeholderTextColor={C.dim} onChangeText={(v) => setS({ ...s, [k]: v })} />
    </>
  );
  return (
    <ScrollView style={g.screen} contentContainerStyle={g.pad} keyboardShouldPersistTaps="handled">
      <Text style={g.h1}>Settings</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={g.text}>Direct Device API Key mode</Text>
          <Text style={g.dim}>Call Gemini straight from the phone (testing). Your key is stored on this device.</Text>
        </View>
        <Switch value={s.mode === 'direct'} onValueChange={(v) => setS({ ...s, mode: v ? 'direct' : 'backend' })} />
      </View>
      {s.mode === 'direct' ? f('apiKey', 'Gemini API key', true) : (<>{f('backendUrl', 'Backend URL (e.g. https://app.onrender.com)')}{f('secret', 'API secret (optional)', true)}</>)}
      {f('model', 'Gemini model (fallback: gemini-2.5-flash)')}
      <TouchableOpacity style={g.btn} onPress={async () => { await saveSettings(s); Alert.alert('Saved'); }}><Text style={g.btnText}>Save</Text></TouchableOpacity>
    </ScrollView>
  );
}
