import { StyleSheet } from 'react-native';
export const C = { bg: '#0f172a', card: '#1e293b', line: '#334155', text: '#f1f5f9', dim: '#94a3b8', accent: '#38bdf8', ok: '#4ade80', warn: '#fb923c', bad: '#f87171' };
export const g = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  pad: { padding: 16, paddingBottom: 40 },
  h1: { color: C.text, fontSize: 22, fontWeight: '800', marginBottom: 12 },
  h2: { color: C.accent, fontSize: 16, fontWeight: '700', marginTop: 18, marginBottom: 8 },
  label: { color: C.dim, fontSize: 13, marginTop: 14, marginBottom: 6 },
  text: { color: C.text, fontSize: 15, lineHeight: 22 },
  dim: { color: C.dim, fontSize: 13 },
  card: { backgroundColor: C.card, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: C.line },
  btn: { backgroundColor: C.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  btnText: { color: '#02131f', fontWeight: '800', fontSize: 16 },
  btn2: { backgroundColor: C.card, borderColor: C.line, borderWidth: 1 },
  input: { backgroundColor: C.card, color: C.text, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: C.line },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.line },
  chipOn: { backgroundColor: C.accent, borderColor: C.accent },
  chipText: { color: C.text, fontSize: 14 },
  chipTextOn: { color: '#02131f', fontWeight: '700' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 6 },
});
