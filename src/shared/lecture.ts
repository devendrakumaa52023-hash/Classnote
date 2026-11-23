export const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
export const FALLBACK_MODEL = 'gemini-2.5-flash';

export type Meta = { grade: string; subject: string; language: 'English' | 'Hinglish'; extraQuestions: 5 | 10 | 15 };

export interface LectureResult {
  handout: {
    title: string; subject: string; grade: string; summary_bullets: string[];
    key_concepts: { heading: string; explanation: string }[];
    formulas_and_rules: { name: string; expression: string; variables_explained: string }[];
    worked_examples: { problem: string; steps: string[]; final_answer: string }[];
    exam_traps: string[]; diagram_svg?: string | null; diagram_caption?: string | null;
  };
  student_doubts: {
    student_question_summary: string; timestamp_approx: string; concept_tag: string;
    teacher_explanation_summary: string; clarity_status: 'Resolved in class' | 'Needs follow-up';
  }[];
  worksheet: {
    mcqs: { q_no: number; question: string; options: string[]; correct_option: string; explanation: string }[];
    short_answer: { q_no: number; question: string; answer: string; step_by_step_solution: string }[];
  };
  transcript_clean: string;
}

export function parseResult(text: string): LectureResult {
  const clean = text.replace(/^```json\s*|^```\s*|```\s*$/gm, '').trim();
  const r = JSON.parse(clean);
  r.student_doubts ??= [];
  r.worksheet ??= { mcqs: [], short_answer: [] };
  r.worksheet.mcqs ??= []; r.worksheet.short_answer ??= [];
  r.transcript_clean ??= '';
  return r as LectureResult;
}
