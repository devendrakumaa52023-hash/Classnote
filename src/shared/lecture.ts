export const DEFAULT_MODEL = 'gemini-3.8-flash';

export interface Meta {
  grade: string;
  subject: string;
  topic?: string;
  language?: string;
}

export interface DoubtItem {
  question: string;
  answer: string;
  timestamp?: string;
}

export interface PracticeQuestion {
  q: string;
  options?: string[];
  answer: string;
  hint?: string;
}

export interface LectureResult {
  title: string;
  summary: string;
  keyConcepts: { heading: string; points: string[] }[];
  formulasOrRules?: string[];
  diagramMermaid?: string;
  doubts: DoubtItem[];
  worksheet: PracticeQuestion[];
  cleanTranscript: string;
}
