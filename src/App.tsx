import React, { useState, useEffect, useRef } from 'react';
import {
  StudentInfo,
  AnswerState,
  EvaluationResult,
  WrongAnswerItem,
  SheetSubmissionRecord,
} from './types/worksheet.ts';
import { QUESTIONS, WORKSHEET_TITLE } from './data/questionsData.ts';
import { StudentHeader } from './components/StudentHeader.tsx';
import { WorksheetCard } from './components/WorksheetCard.tsx';
import { WrongAnswerNoteModal } from './components/WrongAnswerNoteModal.tsx';
import { TeacherDashboardModal } from './components/TeacherDashboardModal.tsx';
import { SubmissionSummaryModal } from './components/SubmissionSummaryModal.tsx';
import {
  USER_SPREADSHEET_ID,
  USER_SPREADSHEET_URL,
  HARDCODED_APPS_SCRIPT_URL,
  submitToAppsScript,
  fetchFromAppsScript,
} from './services/appsScriptService.ts';
import confetti from 'canvas-confetti';
import {
  Send,
  FileCheck2,
  Sparkles,
  BookOpen,
  Award,
  AlertCircle,
  FileSpreadsheet,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

const STORAGE_KEYS = {
  STUDENT: 'local_gov_worksheet_student',
  ANSWERS: 'local_gov_worksheet_answers',
  WRONG_NOTES: 'local_gov_worksheet_wrong_notes',
  APPS_SCRIPT_URL: 'local_gov_worksheet_apps_script_url',
  SUBMISSIONS: 'local_gov_worksheet_submissions',
};

export default function App() {
  // 1. Student Profile State
  const [student, setStudent] = useState<StudentInfo>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENT);
      return saved
        ? JSON.parse(saved)
        : { studentId: '', name: '', sido: '서울특별시', sigungu: '종로구' };
    } catch {
      return { studentId: '', name: '', sido: '서울특별시', sigungu: '종로구' };
    }
  });

  // 2. Answers State
  const [answers, setAnswers] = useState<Record<string, AnswerState>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ANSWERS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // 3. Wrong Notes State
  const [wrongNotes, setWrongNotes] = useState<WrongAnswerItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WRONG_NOTES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 4. Google Apps Script Web App URL State (Defaults to teacher's hardcoded deployment URL)
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.APPS_SCRIPT_URL) || HARDCODED_APPS_SCRIPT_URL;
  });

  const [submissions, setSubmissions] = useState<SheetSubmissionRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 5. Modals State
  const [isWrongNotesOpen, setIsWrongNotesOpen] = useState(false);
  const [isTeacherDashboardOpen, setIsTeacherDashboardOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<SheetSubmissionRecord | null>(null);
  const [isSendingToSheets, setIsSendingToSheets] = useState(false);
  const [sheetSentSuccess, setSheetSentSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastAutoSyncTime, setLastAutoSyncTime] = useState<string | null>(null);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENT, JSON.stringify(student));
  }, [student]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ANSWERS, JSON.stringify(answers));
  }, [answers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WRONG_NOTES, JSON.stringify(wrongNotes));
  }, [wrongNotes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APPS_SCRIPT_URL, appsScriptUrl);
  }, [appsScriptUrl]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
  }, [submissions]);

  // Initial fetch of existing records from Apps Script if available
  useEffect(() => {
    if (appsScriptUrl) {
      fetchFromAppsScript(appsScriptUrl).then((records) => {
        if (records && records.length > 0) {
          setSubmissions((prev) => {
            const map = new Map<string, SheetSubmissionRecord>();
            [...records, ...prev].forEach((item) => {
              const key = `${item.studentId}_${item.name}_${item.timestamp}`;
              if (!map.has(key)) map.set(key, item);
            });
            return Array.from(map.values());
          });
        }
      });
    }
  }, [appsScriptUrl]);

  const handleUpdateStudent = (updated: Partial<StudentInfo>) => {
    setStudent((prev) => ({ ...prev, ...updated }));
  };

  const handleUpdateAnswerText = (qNum: string, text: string) => {
    setAnswers((prev) => {
      const existing = prev[qNum] || { questionNumber: qNum, answerText: '', history: [] };
      return {
        ...prev,
        [qNum]: {
          ...existing,
          answerText: text,
        },
      };
    });
  };

  // Build a snapshot record
  const createSnapshotRecord = (
    currentAnswers: Record<string, AnswerState>,
    currentWrongNotes: WrongAnswerItem[]
  ): SheetSubmissionRecord => {
    let totalScore = 0;
    QUESTIONS.forEach((q) => {
      const score = currentAnswers[q.questionNumber]?.evaluation?.score || 0;
      totalScore += score;
    });

    let overallGrade = '작성 중';
    if (totalScore >= 27) overallGrade = '1등급';
    else if (totalScore >= 23) overallGrade = '2등급';
    else if (totalScore >= 18) overallGrade = '3등급';
    else if (totalScore >= 13) overallGrade = '4등급';
    else if (totalScore > 0) overallGrade = '5등급';

    const timestamp = new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const revisionCountTotal = currentWrongNotes.reduce((acc, curr) => acc + curr.revisionCount, 0);

    return {
      timestamp,
      studentId: student.studentId || '미입력',
      name: student.name || '미입력',
      region: `${student.sido} ${student.sigungu}`,
      overallGrade,
      totalScore,
      q1_answer: currentAnswers['1']?.answerText || '',
      q1_grade: currentAnswers['1']?.evaluation?.gradeLabel || '',
      q2_answer: currentAnswers['2']?.answerText || '',
      q2_grade: currentAnswers['2']?.evaluation?.gradeLabel || '',
      q3_answer: currentAnswers['3']?.answerText || '',
      q3_grade: currentAnswers['3']?.evaluation?.gradeLabel || '',
      q6_answer: currentAnswers['6']?.answerText || '',
      q6_grade: currentAnswers['6']?.evaluation?.gradeLabel || '',
      q7_answer: currentAnswers['7']?.answerText || '',
      q7_grade: currentAnswers['7']?.evaluation?.gradeLabel || '',
      q8_answer: currentAnswers['8']?.answerText || '',
      q8_grade: currentAnswers['8']?.evaluation?.gradeLabel || '',
      wrongNoteRevisedCount: revisionCountTotal,
      teacherComment:
        overallGrade === '1등급'
          ? '광역과 기초의 자치단체장(집행)과 의회(의결)의 핵심 역할 및 법적 권한을 완벽히 이해하였으며, 지역 시정 조사 활동까지 매우 우수하게 수행함.'
          : overallGrade === '2등급'
          ? '지방자치의 집행·의결 기관 성격을 잘 이해하고 있으며, 오답 노트를 활용한 발전적 학습 태도가 돋보임.'
          : overallGrade === '작성 중'
          ? '현재 학습지를 풀이하는 중입니다.'
          : '기초 개념을 성실히 학습하였으나 세부 권한과 기관별 구분에 대해 오답 노트 복습을 추천함.',
    };
  };

  const handleEvaluationComplete = (qNum: string, evalResult: EvaluationResult) => {
    let updatedAnswers: Record<string, AnswerState> = {};
    setAnswers((prev) => {
      const existing = prev[qNum] || { questionNumber: qNum, answerText: '', history: [] };
      const newHistory = [
        ...existing.history,
        {
          text: existing.answerText,
          evaluatedAt: evalResult.evaluatedAt,
          grade: evalResult.grade,
        },
      ];
      updatedAnswers = {
        ...prev,
        [qNum]: {
          ...existing,
          evaluation: evalResult,
          history: newHistory,
        },
      };
      return updatedAnswers;
    });

    const targetQ = QUESTIONS.find((q) => q.questionNumber === qNum);
    const qTitle = targetQ ? targetQ.title : `문항 ${qNum}`;
    const currentText = answers[qNum]?.answerText || '';

    let updatedWrongNotes: WrongAnswerItem[] = [];

    // If grade is not 1, automatically sync/update wrong note
    if (evalResult.grade > 1) {
      setWrongNotes((prev) => {
        const idx = prev.findIndex((n) => n.questionNumber === qNum);
        const item: WrongAnswerItem = {
          questionNumber: qNum,
          questionTitle: qTitle,
          originalAnswer: currentText,
          grade: evalResult.grade,
          missingConcepts: evalResult.missingConcepts,
          guidingQuestion: evalResult.guidingQuestion,
          improvements: evalResult.improvements,
          resolved: false,
          revisionCount: idx >= 0 ? prev[idx].revisionCount : 0,
        };

        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], ...item };
          updatedWrongNotes = updated;
          return updated;
        }
        updatedWrongNotes = [...prev, item];
        return updatedWrongNotes;
      });
    } else {
      setWrongNotes((prev) => {
        const updated = prev.map((n) =>
          n.questionNumber === qNum
            ? {
                ...n,
                resolved: true,
                revisedGrade: 1 as const,
              }
            : n
        );
        updatedWrongNotes = updated;
        return updated;
      });
    }

    // Auto-sync to teacher's Google Apps Script if studentId and name are entered
    if (student.studentId && student.name && appsScriptUrl) {
      const record = createSnapshotRecord(
        {
          ...answers,
          [qNum]: {
            questionNumber: qNum,
            answerText: currentText,
            history: [],
            evaluation: evalResult,
          },
        },
        updatedWrongNotes
      );
      submitToAppsScript(record, appsScriptUrl).then((res) => {
        if (res.success) {
          setLastAutoSyncTime(new Date().toLocaleTimeString('ko-KR'));
        }
      });
    }
  };

  const handleAddToWrongNote = (qNum: string) => {
    const ans = answers[qNum];
    if (!ans || !ans.evaluation) return;

    const targetQ = QUESTIONS.find((q) => q.questionNumber === qNum);
    const qTitle = targetQ ? targetQ.title : `문항 ${qNum}`;

    setWrongNotes((prev) => {
      if (prev.some((n) => n.questionNumber === qNum)) {
        return prev;
      }
      return [
        ...prev,
        {
          questionNumber: qNum,
          questionTitle: qTitle,
          originalAnswer: ans.answerText,
          grade: ans.evaluation!.grade,
          missingConcepts: ans.evaluation!.missingConcepts,
          guidingQuestion: ans.evaluation!.guidingQuestion,
          improvements: ans.evaluation!.improvements,
          resolved: ans.evaluation!.grade === 1,
          revisionCount: 0,
        },
      ];
    });

    setIsWrongNotesOpen(true);
  };

  const handleUpdateResolvedNote = (
    qNum: string,
    revisedText: string,
    newEvaluation: EvaluationResult
  ) => {
    handleUpdateAnswerText(qNum, revisedText);
    setAnswers((prev) => {
      const existing = prev[qNum];
      if (!existing) return prev;
      return {
        ...prev,
        [qNum]: {
          ...existing,
          answerText: revisedText,
          evaluation: newEvaluation,
          history: [
            ...existing.history,
            {
              text: revisedText,
              evaluatedAt: newEvaluation.evaluatedAt,
              grade: newEvaluation.grade,
            },
          ],
        },
      };
    });

    setWrongNotes((prev) =>
      prev.map((n) => {
        if (n.questionNumber === qNum) {
          return {
            ...n,
            revisedAnswer: revisedText,
            revisedGrade: newEvaluation.grade,
            resolved: newEvaluation.grade === 1,
            revisionCount: n.revisionCount + 1,
            missingConcepts: newEvaluation.missingConcepts,
            guidingQuestion: newEvaluation.guidingQuestion,
            improvements: newEvaluation.improvements,
          };
        }
        return n;
      })
    );

    // Auto-save to Google Apps Script after revision
    if (student.studentId && student.name && appsScriptUrl) {
      const record = createSnapshotRecord(answers, wrongNotes);
      submitToAppsScript(record, appsScriptUrl).then((res) => {
        if (res.success) {
          setLastAutoSyncTime(new Date().toLocaleTimeString('ko-KR'));
        }
      });
    }
  };

  const completedCount = QUESTIONS.filter((q) => answers[q.questionNumber]?.evaluation).length;
  const grade1Count = QUESTIONS.filter(
    (q) => answers[q.questionNumber]?.evaluation?.grade === 1
  ).length;
  const wrongNotesPendingCount = wrongNotes.filter((n) => !n.resolved).length;

  const handleRefreshSubmissions = async () => {
    if (!appsScriptUrl) return;
    try {
      const records = await fetchFromAppsScript(appsScriptUrl);
      if (records.length > 0) {
        setSubmissions(records);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit All Worksheet & Push to Google Apps Script in Real-time
  const handleSubmitAll = async () => {
    setSubmitError(null);

    if (!student.studentId.trim() || !student.name.trim()) {
      setSubmitError('제출하기 전에 학번과 이름을 반드시 입력해 주세요.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (completedCount < QUESTIONS.length) {
      const uncompleted = QUESTIONS.filter((q) => !answers[q.questionNumber]?.evaluation)
        .map((q) => `${q.questionNumber}번`)
        .join(', ');
      setSubmitError(`아직 채점을 완료하지 않은 문항이 있습니다: ${uncompleted}`);
      return;
    }

    let totalScore = 0;
    QUESTIONS.forEach((q) => {
      const score = answers[q.questionNumber]?.evaluation?.score || 1;
      totalScore += score;
    });

    let overallGrade = '3등급';
    if (totalScore >= 27) overallGrade = '1등급';
    else if (totalScore >= 23) overallGrade = '2등급';
    else if (totalScore >= 18) overallGrade = '3등급';
    else if (totalScore >= 13) overallGrade = '4등급';
    else overallGrade = '5등급';

    const timestamp = new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const revisionCountTotal = wrongNotes.reduce((acc, curr) => acc + curr.revisionCount, 0);

    const record: SheetSubmissionRecord = {
      timestamp,
      studentId: student.studentId,
      name: student.name,
      region: `${student.sido} ${student.sigungu}`,
      overallGrade,
      totalScore,
      q1_answer: answers['1']?.answerText || '',
      q1_grade: answers['1']?.evaluation?.gradeLabel || '',
      q2_answer: answers['2']?.answerText || '',
      q2_grade: answers['2']?.evaluation?.gradeLabel || '',
      q3_answer: answers['3']?.answerText || '',
      q3_grade: answers['3']?.evaluation?.gradeLabel || '',
      q6_answer: answers['6']?.answerText || '',
      q6_grade: answers['6']?.evaluation?.gradeLabel || '',
      q7_answer: answers['7']?.answerText || '',
      q7_grade: answers['7']?.evaluation?.gradeLabel || '',
      q8_answer: answers['8']?.answerText || '',
      q8_grade: answers['8']?.evaluation?.gradeLabel || '',
      wrongNoteRevisedCount: revisionCountTotal,
      teacherComment:
        overallGrade === '1등급'
          ? '광역과 기초의 자치단체장(집행)과 의회(의결)의 핵심 역할 및 법적 권한을 완벽히 이해하였으며, 지역 시정 조사 활동까지 매우 우수하게 수행함.'
          : overallGrade === '2등급'
          ? '지방자치의 집행·의결 기관 성격을 잘 이해하고 있으며, 오답 노트를 활용한 발전적 학습 태도가 돋보임.'
          : '기초 개념을 성실히 학습하였으나 세부 권한과 기관별 구분에 대해 오답 노트 복습을 추천함.',
    };

    setActiveSubmission(record);
    setSubmissions((prev) => [record, ...prev]);

    // Push to Google Apps Script immediately
    setIsSendingToSheets(true);
    setSheetSentSuccess(false);
    try {
      const res = await submitToAppsScript(record, appsScriptUrl);
      if (res.success) {
        setSheetSentSuccess(true);
        setLastAutoSyncTime(new Date().toLocaleTimeString('ko-KR'));
      }
    } catch (err) {
      console.error('Apps Script transmission error:', err);
    } finally {
      setIsSendingToSheets(false);
    }

    confetti({
      particleCount: 100,
      spread: 100,
      origin: { y: 0.5 },
    });

    setIsSummaryOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28">
      {/* 1. Sticky Student Header */}
      <StudentHeader
        student={student}
        onUpdateStudent={handleUpdateStudent}
        completedCount={completedCount}
        grade1Count={grade1Count}
        totalQuestions={QUESTIONS.length}
        wrongNoteCount={wrongNotesPendingCount}
        onOpenWrongNotes={() => setIsWrongNotesOpen(true)}
        onOpenTeacherDashboard={() => setIsTeacherDashboardOpen(true)}
        isTeacherConnected={true}
      />

      {/* 2. Main Content Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Banner Section */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>지방자치 5등급 자기주도 탐구</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>구글 시트 실시간 전송 활성화됨</span>
                </span>
                <a
                  href={USER_SPREADSHEET_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors border border-white/20"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>시트 열기</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-snug">
              {WORKSHEET_TITLE}
            </h2>

            <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed max-w-2xl">
              광역 자치단체와 기초 자치단체의 <strong>집행 기관(단체장)</strong>과{' '}
              <strong>의결 기관(의회)</strong>의 역할을 직접 탐구하고 서술해 보세요. 작성이
              어려울 땐 <strong>3단계 힌트</strong>를 활용하고, 채점 후엔{' '}
              <strong>오답 노트</strong>에서 1등급에 도전할 수 있습니다!
            </p>

            {/* Quick Status */}
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-indigo-200">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-400" />
                총 {QUESTIONS.length}문항 (1, 2, 3, 6, 7, 8번)
              </span>
              <span className="text-indigo-400">•</span>
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-400" />
                정답 기준 5등급 AI 자동 채점
              </span>
              <span className="text-indigo-400">•</span>
              <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Apps Script 배포 주소 자동 연동 중
                {lastAutoSyncTime && ` (최근 동기화: ${lastAutoSyncTime})`}
              </span>
            </div>
          </div>
        </div>

        {/* Global Alert / Submit Error */}
        {submitError && (
          <div className="p-4 rounded-2xl bg-rose-50 text-rose-800 border border-rose-200 text-xs sm:text-sm flex items-center gap-3 shadow-xs animate-shake">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-semibold">{submitError}</span>
          </div>
        )}

        {/* Question Cards List */}
        <div className="space-y-6">
          {QUESTIONS.map((q) => {
            const ansState = answers[q.questionNumber] || {
              questionNumber: q.questionNumber,
              answerText: '',
              history: [],
            };
            const isSaved = wrongNotes.some((n) => n.questionNumber === q.questionNumber);

            return (
              <WorksheetCard
                key={q.questionNumber}
                question={q}
                answerState={ansState}
                student={student}
                onUpdateAnswer={(text) => handleUpdateAnswerText(q.questionNumber, text)}
                onEvaluationComplete={(evalResult) =>
                  handleEvaluationComplete(q.questionNumber, evalResult)
                }
                onAddToWrongNote={handleAddToWrongNote}
                isSavedInWrongNotes={isSaved}
              />
            );
          })}
        </div>
      </main>

      {/* Bottom Floating Submission Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:p-4 z-40 shadow-xl">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  작성 현황: {completedCount} / {QUESTIONS.length} 완료
                </span>
                {grade1Count > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    1등급 {grade1Count}개
                  </span>
                )}
                {lastAutoSyncTime && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold hidden md:inline">
                    시트 실시간 저장됨 ({lastAutoSyncTime})
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {student.studentId && student.name
                  ? `${student.studentId} ${student.name} (${student.sido} ${student.sigungu})`
                  : '학번과 이름을 상단에서 먼저 입력해 주세요'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsWrongNotesOpen(true)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors hidden sm:inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>오답 노트 ({wrongNotesPendingCount})</span>
            </button>

            <button
              onClick={handleSubmitAll}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-200 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>학습지 최종 제출 & 구글 시트 즉시 전송</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Modals */}
      <WrongAnswerNoteModal
        isOpen={isWrongNotesOpen}
        onClose={() => setIsWrongNotesOpen(false)}
        wrongNotes={wrongNotes}
        questions={QUESTIONS}
        student={student}
        onUpdateResolvedNote={handleUpdateResolvedNote}
      />

      <TeacherDashboardModal
        isOpen={isTeacherDashboardOpen}
        onClose={() => setIsTeacherDashboardOpen(false)}
        appsScriptUrl={appsScriptUrl}
        onSetAppsScriptUrl={(url) => setAppsScriptUrl(url)}
        submissions={submissions}
        onRefreshSubmissions={handleRefreshSubmissions}
        isSyncing={false}
      />

      <SubmissionSummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        student={student}
        answers={answers}
        questions={QUESTIONS}
        submissionRecord={activeSubmission}
        appsScriptUrl={appsScriptUrl}
        isSendingToSheets={isSendingToSheets}
        sheetSentSuccess={sheetSentSuccess}
      />
    </div>
  );
}
