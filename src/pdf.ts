import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { SavedLecture } from './storage';

const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function buildHtml(l: SavedLecture, opts: { answerKey: boolean; doubts: boolean }) {
  const h = l.result.handout, w = l.result.worksheet, d = l.result.student_doubts;
  const ul = (a: string[]) => `<ul>${(a || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  return `<html><head><meta charset="utf-8"><style>
@page{size:A4;margin:16mm} body{font-family:Helvetica,Arial,sans-serif;font-size:11pt;color:#111;line-height:1.45}
h1{font-size:20pt;margin:0 0 4px;color:#0b3d6b} h2{font-size:14pt;border-bottom:2px solid #0b3d6b;padding-bottom:3px;margin-top:22px;color:#0b3d6b}
h3{font-size:12pt;margin:12px 0 2px} .meta{color:#555;font-size:10pt} .box{border:1px solid #ccd;border-radius:6px;padding:8px;margin:8px 0;page-break-inside:avoid}
.f{font-family:Courier,monospace;background:#eef3f8;padding:2px 6px;border-radius:3px} .trap{background:#fff4e5;border-left:4px solid #e67e00;padding:6px 8px;margin:4px 0}
.ans{color:#0a6b2d} .warn{color:#b00020;font-weight:bold} svg{max-width:100%;height:auto} .pb{page-break-before:always}</style></head><body>
<h1>${esc(h.title)}</h1><div class="meta">${esc(h.subject)} • ${esc(h.grade)} • ${new Date(l.createdAt).toLocaleDateString()}</div>
<h2>Summary</h2>${ul(h.summary_bullets)}
<h2>Key Concepts</h2>${(h.key_concepts || []).map((c) => `<h3>${esc(c.heading)}</h3><div>${esc(c.explanation)}</div>`).join('')}
${h.diagram_svg ? `<h2>Diagram</h2><div style="text-align:center;border:1px solid #ccc">${h.diagram_svg}</div>${h.diagram_caption ? `<div class="meta" style="text-align:center">${esc(h.diagram_caption)}</div>` : ''}` : ''}
${h.formulas_and_rules?.length ? `<h2>Formulas &amp; Rules</h2>${h.formulas_and_rules.map((f) => `<div class="box"><b>${esc(f.name)}</b><br><span class="f">${esc(f.expression)}</span><br><small>${esc(f.variables_explained)}</small></div>`).join('')}` : ''}
${h.worked_examples?.length ? `<h2>Worked Examples</h2>${h.worked_examples.map((e, i) => `<div class="box"><b>Ex ${i + 1}.</b> ${esc(e.problem)}<ol>${e.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol><b class="ans">Answer: ${esc(e.final_answer)}</b></div>`).join('')}` : ''}
${h.exam_traps?.length ? `<h2>Exam Traps</h2>${h.exam_traps.map((t) => `<div class="trap">⚠ ${esc(t)}</div>`).join('')}` : ''}
${opts.doubts && d.length ? `<h2>Student Doubts Log</h2>${d.map((x) => `<div class="box"><b>[${esc(x.timestamp_approx)}] ${esc(x.concept_tag)}</b><br>Q: ${esc(x.student_question_summary)}<br>A: ${esc(x.teacher_explanation_summary)}<br>${x.clarity_status === 'Needs follow-up' ? '<span class="warn">Needs follow-up</span>' : '<span class="ans">Resolved in class</span>'}</div>`).join('')}` : ''}
<h2 class="pb">Practice Worksheet</h2>
${w.mcqs.length ? '<h3>Multiple Choice</h3>' : ''}${w.mcqs.map((q) => `<div class="box"><b>Q${q.q_no}.</b> ${esc(q.question)}${q.options.map((o, i) => `<div>(${'ABCD'[i]}) ${esc(o)}</div>`).join('')}</div>`).join('')}
${w.short_answer.length ? '<h3>Short Answer</h3>' : ''}${w.short_answer.map((q) => `<div class="box"><b>Q${q.q_no}.</b> ${esc(q.question)}<br><br><br></div>`).join('')}
${opts.answerKey ? `<h2 class="pb">Answer Key</h2>${w.mcqs.map((q) => `<div class="box"><b>Q${q.q_no}:</b> <span class="ans">${esc(q.correct_option)}</span><br><small>${esc(q.explanation)}</small></div>`).join('')}
${w.short_answer.map((q) => `<div class="box"><b>Q${q.q_no}:</b> <span class="ans">${esc(q.answer)}</span><br><small>${esc(q.step_by_step_solution)}</small></div>`).join('')}` : ''}
</body></html>`;
}

export async function exportPdf(l: SavedLecture, opts: { answerKey: boolean; doubts: boolean }) {
  const { uri } = await Print.printToFileAsync({ html: buildHtml(l, opts), width: 595, height: 842 });
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share handout', UTI: 'com.adobe.pdf' });
}
