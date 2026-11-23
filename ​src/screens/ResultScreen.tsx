import React, { useState } from 'react';
import { Alert, Modal, ScrollView, Switch, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { exportPdf } from '../pdf';
import { SavedLecture } from '../storage';
import { C, g } from '../theme';

const TABS = ['Handout', 'Doubts', 'Worksheet', 'Transcript'];

export default function ResultScreen({ lecture, onBack }: { lecture: SavedLecture; onBack: () => void }) {
  const [tab, setTab] = useState(0);
  const [showKey, setShowKey] = useState(false);
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(false);
  const [optKey, setOptKey] = useState(true);
  const [optDoubts, setOptDoubts] = useState(true);
  const [busy, setBusy] = useState(false);
  const { width } = useWindowDimensions();
  const { handout: h, student_doubts: d, worksheet: w, transcript_clean: t } = lecture.result;
  const followUps = d.filter((x) => x.clarity_status === 'Needs follow-up').length;

  async function doExport() {
    setBusy(true);
    try { await exportPdf(lecture, { answerKey: optKey, doubts: optDoubts }); setModal(false); }
    catch (e: any) { Alert.alert('Export failed', e.message); }
    setBusy(false);
  }
  const lines = t.split('\n').filter((l) => l.trim() && l.toLowerCase().includes(q.toLowerCase()));

  return (
    <View style={g.screen}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 }}>
        <TouchableOpacity onPress={onBack}><Text style={{ color: C.accent, fontSize: 16 }}>‹ Back</Text></TouchableOpacity>
        <Text style={[g.text, { flex: 1, fontWeight: '700' }]} numberOfLines={1}>{h.title}</Text>
        <TouchableOpacity onPress={() => setModal(true)} style={[g.chip, g.chipOn]}><Text style={g.chipTextOn}>PDF / Share</Text></TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: C.line }}>
        {TABS.map((n, i) => (
          <TouchableOpacity key={n} style={{ flex: 1, paddingVertical: 10, borderBottomWidth: 2, borderColor: tab === i ? C.accent : 'transparent' }} onPress={() => setTab(i)}>
            <Text style={{ color: tab === i ? C.accent : C.dim, textAlign: 'center', fontSize: 13, fontWeight: '600' }}>{n}{i === 1 && followUps ? ` ●` : ''}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView contentContainerStyle={g.pad} keyboardShouldPersistTaps="handled">
        {tab === 0 && (<>
          <Text style={g.dim}>{h.subject} • {h.grade}</Text>
          <Text style={g.h2}>Summary</Text>
          {h.summary_bullets.map((b, i) => <Text key={i} style={g.text}>• {b}</Text>)}
          <Text style={g.h2}>Key Concepts</Text>
          {h.key_concepts.map((c, i) => <View key={i} style={g.card}><Text style={[g.text, { fontWeight: '700' }]}>{c.heading}</Text><Text style={g.text}>{c.explanation}</Text></View>)}
          {h.diagram_svg ? (<>
            <Text style={g.h2}>Diagram</Text>
            <View style={{ backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden' }}><SvgXml xml={h.diagram_svg} width={width - 32} height={(width - 32) * 0.6} /></View>
            {h.diagram_caption ? <Text style={[g.dim, { marginTop: 6 }]}>{h.diagram_caption}</Text> : null}
          </>) : null}
          {h.formulas_and_rules.length > 0 && <Text style={g.h2}>Formulas & Rules</Text>}
          {h.formulas_and_rules.map((f, i) => <View key={i} style={g.card}><Text style={[g.text, { fontWeight: '700' }]}>{f.name}</Text><Text style={[g.text, { color: C.ok, fontFamily: 'monospace' }]}>{f.expression}</Text><Text style={g.dim}>{f.variables_explained}</Text></View>)}
          {h.worked_examples.length > 0 && <Text style={g.h2}>Worked Examples</Text>}
          {h.worked_examples.map((e, i) => <View key={i} style={g.card}><Text style={[g.text, { fontWeight: '700' }]}>Ex {i + 1}. {e.problem}</Text>{e.steps.map((s, j) => <Text key={j} style={g.text}>{j + 1}. {s}</Text>)}<Text style={[g.text, { color: C.ok, marginTop: 6 }]}>Answer: {e.final_answer}</Text></View>)}
          {h.exam_traps.length > 0 && <Text style={g.h2}>Exam Traps</Text>}
          {h.exam_traps.map((x, i) => <View key={i} style={[g.card, { borderColor: C.warn }]}><Text style={g.text}>⚠ {x}</Text></View>)}
        </>)}
        {tab === 1 && (<>
          <Text style={g.h2}>{d.length} doubt(s) • {followUps} need follow-up</Text>
          {d.length === 0 && <Text style={g.dim}>No student doubts were detected in this lecture.</Text>}
          {d.map((x, i) => {
            const open = x.clarity_status === 'Needs follow-up';
            return (
              <View key={i} style={[g.card, open && { borderColor: C.warn }]}>
                <Text style={g.dim}>~{x.timestamp_approx} • {x.concept_tag}</Text>
                <Text style={[g.text, { fontWeight: '700' }]}>Q: {x.student_question_summary}</Text>
                <Text style={g.text}>A: {x.teacher_explanation_summary}</Text>
                <View style={[g.badge, { backgroundColor: open ? C.warn : C.ok }]}><Text style={{ color: '#111', fontWeight: '700', fontSize: 12 }}>{open ? '⚑ Needs follow-up next class' : '✓ Resolved in class'}</Text></View>
              </View>
            );
          })}
        </>)}
        {tab === 2 && (<>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={g.text}>Show answer key & solutions</Text><Switch value={showKey} onValueChange={setShowKey} />
          </View>
          <Text style={g.h2}>Multiple Choice</Text>
          {w.mcqs.map((m) => (
            <View key={m.q_no} style={g.card}>
              <Text style={[g.text, { fontWeight: '700' }]}>Q{m.q_no}. {m.question}</Text>
              {m.options.map((o, i) => <Text key={i} style={[g.text, showKey && o === m.correct_option && { color: C.ok, fontWeight: '700' }]}>({'ABCD'[i]}) {o}</Text>)}
              {showKey && <Text style={[g.dim, { marginTop: 6 }]}>✓ {m.correct_option}{'\n'}{m.explanation}</Text>}
            </View>
          ))}
          <Text style={g.h2}>Short Answer</Text>
          {w.short_answer.map((s) => (
            <View key={s.q_no} style={g.card}>
              <Text style={[g.text, { fontWeight: '700' }]}>Q{s.q_no}. {s.question}</Text>
              {showKey && <Text style={[g.text, { color: C.ok, marginTop: 6 }]}>Answer: {s.answer}{'\n'}<Text style={g.dim}>{s.step_by_step_solution}</Text></Text>}
            </View>
          ))}
        </>)}
        {tab === 3 && (<>
          <TextInput style={g.input} placeholder="Search transcript…" placeholderTextColor={C.dim} value={q} onChangeText={setQ} />
          <View style={{ height: 10 }} />
          {lines.map((l, i) => <Text key={i} style={[g.text, { marginBottom: 6, color: l.startsWith('Student:') ? C.warn : C.text }]}>{l}</Text>)}
          {lines.length === 0 && <Text style={g.dim}>No matching lines.</Text>}
        </>)}
      </ScrollView>
      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' }}>
          <View style={{ backgroundColor: C.card, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
            <Text style={g.h1}>Export PDF</Text>
            <Text style={g.dim}>Includes handout, diagram and practice worksheet.</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}><Text style={g.text}>Include answer key</Text><Switch value={optKey} onValueChange={setOptKey} /></View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}><Text style={g.text}>Include student doubts</Text><Switch value={optDoubts} onValueChange={setOptDoubts} /></View>
            <TouchableOpacity style={g.btn} onPress={doExport} disabled={busy}><Text style={g.btnText}>{busy ? 'Generating…' : 'Create PDF & Share (WhatsApp)'}</Text></TouchableOpacity>
            <TouchableOpacity style={[g.btn, g.btn2]} onPress={() => setModal(false)}><Text style={[g.btnText, { color: C.text }]}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
