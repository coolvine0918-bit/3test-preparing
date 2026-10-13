export interface StudentInfo {
  studentId: string; // 학번 (예: 20315)
  name: string; // 이름
  sido: string; // 시·도
  sigungu: string; // 시·군·구
}

export type GradeLevel = 1 | 2 | 3 | 4 | 5;

export interface QuestionDefinition {
  id: number;
  questionNumber: string; // "1", "2", "3", "6", "7", "8"
  badge: string; // "광역 집행", "광역 의결", "광역 활동", "기초 집행", "기초 의결", "기초 활동"
  title: string;
  originalText: string;
  description: string;
  guideQuestions: string[];
  defaultKeyWords: string[];
  sentenceTemplate: string;
}

export interface EvaluationResult {
  grade: GradeLevel;
  gradeLabel: string;
  score: number; // 1~5점
  isCorrect: boolean;
  strengths: string;
  improvements: string;
  keyConceptsFound: string[];
  missingConcepts: string[];
  guidingQuestion: string;
  exemplarHint: string;
  evaluatedAt: string;
}

export interface StepHintData {
  step: 1 | 2 | 3;
  stepTitle: string;
  content: string;
  scaffoldingQuestion: string;
  keywordList: string[];
  sentenceFrame?: string;
}

export interface AnswerState {
  questionNumber: string;
  answerText: string;
  history: Array<{
    text: string;
    evaluatedAt: string;
    grade: GradeLevel;
  }>;
  evaluation?: EvaluationResult;
  isLocked?: boolean;
}

export interface WrongAnswerItem {
  questionNumber: string;
  questionTitle: string;
  originalAnswer: string;
  grade: GradeLevel;
  missingConcepts: string[];
  guidingQuestion: string;
  improvements: string;
  revisedAnswer?: string;
  revisedGrade?: GradeLevel;
  resolved: boolean;
  revisionCount: number;
}

export interface SheetSubmissionRecord {
  timestamp: string;
  studentId: string;
  name: string;
  region: string;
  overallGrade: string;
  totalScore: number;
  q1_answer: string;
  q1_grade: string;
  q2_answer: string;
  q2_grade: string;
  q3_answer: string;
  q3_grade: string;
  q6_answer: string;
  q6_grade: string;
  q7_answer: string;
  q7_grade: string;
  q8_answer: string;
  q8_grade: string;
  wrongNoteRevisedCount: number;
  teacherComment: string;
}
