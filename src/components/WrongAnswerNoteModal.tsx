import React, { useState } from 'react';
import { WrongAnswerItem, QuestionDefinition, StudentInfo, EvaluationResult } from '../types/worksheet.ts';
import { GradeBadge } from './GradeBadge.tsx';
import { requestGrade } from '../services/apiClient.ts';
import confetti from 'canvas-confetti';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Loader2,
  RefreshCw,
  BookOpen,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  wrongNotes: WrongAnswerItem[];
  questions: QuestionDefinition[];
  student: StudentInfo;
  onUpdateResolvedNote: (qNum: string, revisedText: string, newEvaluation: EvaluationResult) => void;
}

export const WrongAnswerNoteModal: React.FC<Props> = ({
  isOpen,
  onClose,
  wrongNotes,
  questions,
  student,
  onUpdateResolvedNote,
}) => {
  const [filter, setFilter] = useState<'pending' | 'resolved' | 'all'>('pending');
  const [editingAnswers, setEditingAnswers] = useState<Record<string, string>>({});
  const [isRegrading, setIsRegrading] = useState<Record<string, boolean>>({});
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleTextChange = (qNum: string, text: string) => {
    setEditingAnswers((prev) => ({ ...prev, [qNum]: text }));
  };

  const handleRegrade = async (item: WrongAnswerItem) => {
    const qDef = questions.find((q) => q.questionNumber === item.questionNumber);
    if (!qDef) return;

    const revisedText = (editingAnswers[item.questionNumber] || item.originalAnswer).trim();
    if (!revisedText) {
      setErrorMessages((prev) => ({ ...prev, [item.questionNumber]: '수정 답안을 입력해 주세요.' }));
      return;
    }

    setIsRegrading((prev) => ({ ...prev, [item.questionNumber]: true }));
    setErrorMessages((prev) => ({ ...prev, [item.questionNumber]: '' }));

    try {
      const result = await requestGrade({
        questionId: qDef.id,
        questionNumber: qDef.questionNumber,
        questionTitle: qDef.title,
        studentAnswer: revisedText,
        studentRegion: {
          sido: student.sido,
          sigungu: student.sigungu,
        },
        previousGrade: item.grade,
      });

      onUpdateResolvedNote(item.questionNumber, revisedText, result);

      if (result.grade === 1) {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessages((prev) => ({
        ...prev,
        [item.questionNumber]: err.message || '재채점 중 오류가 발생했습니다.',
      }));
    } finally {
      setIsRegrading((prev) => ({ ...prev, [item.questionNumber]: false }));
    }
  };

  const pendingList = wrongNotes.filter((n) => !n.resolved);
  const resolvedList = wrongNotes.filter((n) => n.resolved);
  const displayList =
    filter === 'pending' ? pendingList : filter === 'resolved' ? resolvedList : wrongNotes;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                성장형 오답 노트 & 재도전
              </h2>
              <p className="text-xs text-amber-100">
                부족했던 부분을 AI의 유도 질문으로 보완하여 1등급(만점)을 달성해 보세요!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'pending'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              보완 대기중 ({pendingList.length})
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'resolved'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              1등급 극복 완료 ({resolvedList.length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              전체 ({wrongNotes.length})
            </button>
          </div>

          <span className="text-[11px] text-slate-500 hidden sm:inline">
            학번: {student.studentId || '미입력'} | 이름: {student.name || '미입력'}
          </span>
        </div>

        {/* Content list */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {displayList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-medium">등록된 오답 노트가 없습니다.</p>
              <p className="text-xs text-slate-400">
                학습지에서 채점 후 1등급에 도전하고 싶은 문항의 [오답 노트에 담기] 버튼을 눌러보세요.
              </p>
            </div>
          ) : (
            displayList.map((item) => {
              const currentInput =
                editingAnswers[item.questionNumber] !== undefined
                  ? editingAnswers[item.questionNumber]
                  : item.revisedAnswer || item.originalAnswer;
              const isBusy = isRegrading[item.questionNumber];
              const error = errorMessages[item.questionNumber];

              return (
                <div
                  key={item.questionNumber}
                  className={`rounded-xl border p-4 space-y-3 transition-all ${
                    item.resolved
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-white border-amber-200 shadow-xs'
                  }`}
                >
                  {/* Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                        {item.questionNumber}
                      </span>
                      <span className="font-bold text-slate-800 text-xs sm:text-sm">
                        {item.questionTitle}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">기존 등급:</span>
                      <GradeBadge grade={item.grade} size="sm" />
                      {item.revisedGrade && (
                        <>
                          <span className="text-xs text-slate-400">➔</span>
                          <span className="text-xs text-emerald-600 font-semibold">수정 후:</span>
                          <GradeBadge grade={item.revisedGrade} size="sm" />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Previous Answer vs Guiding Question */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 block">
                        내가 작성했던 답안:
                      </span>
                      <p className="text-slate-800 leading-relaxed italic">
                        "{item.originalAnswer}"
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 space-y-1">
                      <div className="flex items-center gap-1 font-bold text-amber-900 text-[11px]">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>AI 보완 가이드 & 생각 유도 질문</span>
                      </div>
                      <p className="text-amber-950 font-medium leading-relaxed">
                        "{item.guidingQuestion}"
                      </p>
                      {item.missingConcepts.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {item.missingConcepts.map((m, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded bg-white text-[10px] text-amber-800 font-semibold border border-amber-200"
                            >
                              + {m}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Revision Editor */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>답안 수정 및 보완하기:</span>
                      {item.revisionCount > 0 && (
                        <span className="text-[11px] text-indigo-600">
                          {item.revisionCount}회 재도전함
                        </span>
                      )}
                    </div>
                    <textarea
                      rows={3}
                      value={currentInput}
                      onChange={(e) => handleTextChange(item.questionNumber, e.target.value)}
                      placeholder="유도 질문과 누락된 핵심 키워드를 참고하여 더 완벽한 문장으로 고쳐 써보세요."
                      className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-y"
                    />
                  </div>

                  {error && (
                    <div className="p-2 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Submit revision button */}
                  <div className="flex items-center justify-between pt-1">
                    {item.resolved ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 1등급 만점 달성 완료!
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        수정 후 다시 채점을 누르면 등급이 갱신됩니다.
                      </span>
                    )}

                    <button
                      onClick={() => handleRegrade(item)}
                      disabled={isBusy}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
                    >
                      {isBusy ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>재평가 분석 중...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>수정 답안으로 재채점 받기</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            오답 노트는 브라우저에 자동 보관되며, 교사 스프레드시트에도 수정 횟수가 실시간 기록됩니다.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
