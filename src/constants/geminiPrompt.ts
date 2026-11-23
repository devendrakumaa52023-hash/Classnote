// src/constants/geminiPrompt.ts

export const buildLectureSystemPrompt = (params: {
  grade: string;
  subject: string;
  language: string;
  questionCount: number;
}) => `
You are an expert Indian curriculum educator and academic content creator. Listen carefully to the attached classroom lecture recording (${params.grade} — ${params.subject}, spoken in ${params.language}) and convert it into a structured, student-ready study handout, student doubt log, and practice worksheet.

### STRICT PEDAGOGICAL & FORMATTING RULES:
1. **Language & Code-Switching:** The teacher and students may speak in English, Hindi, or Hinglish. Understand all spoken explanations, questions, and nuances accurately, and write the final JSON output strictly in clear, natural academic English.
2. **Filter Classroom Noise:** Completely ignore attendance roll calls, disciplinary remarks, jokes, and off-topic chatter. Focus strictly on academic instruction and student academic doubts.
3. **Math & Science Notation:** Convert all spoken equations, variables, chemical formulas, Greek letters, and units into clean mathematical notation (e.g., write "$x^2 + 2x - 5 = 0$" or "τ = r × F" instead of spelling out "tau equals r cross F").
4. **Stay Grounded to the Lecture:** Base all notes, diagrams, and extra questions strictly on the concepts and difficulty level taught in this recording. Do not introduce advanced topics the teacher has not covered yet.
5. **Intelligent SVG Diagrams (When Required):**
   - Generate a clean, self-contained SVG string inside \`diagram_svg\` ONLY if the lecture involves a physical setup, free-body diagram, circuit, ray optics diagram, geometry figure, biology structure, or kinematics/function graph. Otherwise return \`null\`.
   - SVG rules: \`<svg viewBox="0 0 600 360" xmlns="http://www.w3.org/2000/svg">\`, solid white background \`<rect width="600" height="360" fill="#ffffff"/>\`, high-contrast dark strokes (\`#1e293b\`), accent arrows (\`#2563eb\` or \`#dc2626\`), clear readable \`<text>\` labels (font-size 13–15px) positioned with generous padding so labels NEVER overlap lines or shapes.
6. **Student Doubts Extraction:**
   - Carefully listen for any interruptions or questions asked by students during the class.
   - Log every academic doubt in \`student_doubts\`, identify the exact concept that triggered it, summarize how the teacher answered it, and mark \`clarity_status\` as \`"Needs follow-up"\` if the teacher postponed the answer or the student still sounded confused. If no student doubts were asked, return an empty array \`[]\`.
7. **Practice Worksheet Generation:**
   - Generate exactly **${params.questionCount} brand-new practice questions** split into ~60% Conceptual/Application MCQs (\`mcqs\`) and ~40% Short-Answer/Numerical problems (\`short_answer\`).
   - Do NOT copy the class examples verbatim—change numerical values, scenarios, or framing while testing the exact same formulas and concepts.

Follow the provided JSON response schema strictly.
`;

/** Same values as `Type` from @google/genai, inlined so the React Native bundle doesn't need the SDK. */
const Type = { OBJECT: 'OBJECT', ARRAY: 'ARRAY', STRING: 'STRING', INTEGER: 'INTEGER' } as const;

/** Passed as generationConfig.responseSchema (device) / config.responseSchema (backend). */
export const responseSchema: any = {
  type: Type.OBJECT,
  properties: {
    handout: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        subject: { type: Type.STRING },
        grade: { type: Type.STRING },
        summary_bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
        key_concepts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { heading: { type: Type.STRING }, explanation: { type: Type.STRING } },
            required: ['heading', 'explanation'],
          },
        },
        formulas_and_rules: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { name: { type: Type.STRING }, expression: { type: Type.STRING }, variables_explained: { type: Type.STRING } },
            required: ['name', 'expression', 'variables_explained'],
          },
        },
        worked_examples: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { problem: { type: Type.STRING }, steps: { type: Type.ARRAY, items: { type: Type.STRING } }, final_answer: { type: Type.STRING } },
            required: ['problem', 'steps', 'final_answer'],
          },
        },
        exam_traps: { type: Type.ARRAY, items: { type: Type.STRING } },
        diagram_svg: { type: Type.STRING, nullable: true },
        diagram_caption: { type: Type.STRING, nullable: true },
      },
      required: ['title', 'subject', 'grade', 'summary_bullets', 'key_concepts', 'formulas_and_rules', 'worked_examples', 'exam_traps'],
    },
    student_doubts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          student_question_summary: { type: Type.STRING },
          timestamp_approx: { type: Type.STRING },
          concept_tag: { type: Type.STRING },
          teacher_explanation_summary: { type: Type.STRING },
          clarity_status: { type: Type.STRING, enum: ['Resolved in class', 'Needs follow-up'] },
        },
        required: ['student_question_summary', 'timestamp_approx', 'concept_tag', 'teacher_explanation_summary', 'clarity_status'],
      },
    },
    worksheet: {
      type: Type.OBJECT,
      properties: {
        mcqs: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              q_no: { type: Type.INTEGER }, question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correct_option: { type: Type.STRING }, explanation: { type: Type.STRING },
            },
            required: ['q_no', 'question', 'options', 'correct_option', 'explanation'],
          },
        },
        short_answer: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              q_no: { type: Type.INTEGER }, question: { type: Type.STRING },
              answer: { type: Type.STRING }, step_by_step_solution: { type: Type.STRING },
            },
            required: ['q_no', 'question', 'answer', 'step_by_step_solution'],
          },
        },
      },
      required: ['mcqs', 'short_answer'],
    },
    transcript_clean: { type: Type.STRING },
  },
  required: ['handout', 'student_doubts', 'worksheet', 'transcript_clean'],
};
