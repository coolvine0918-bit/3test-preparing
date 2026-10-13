import React, { useState } from 'react';
import { QuestionDefinition, AnswerState, StudentInfo, EvaluationResult } from '../types/worksheet.ts';
import { GradeBadge } from './GradeBadge.tsx';
import { StepHintPanel } from './StepHintPanel.tsx';
import { requestGrade } from '../services/apiClient.ts';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  BookMarked,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Loader2,
  FileText,
} from 'lucide-react';

interface Props {
  question: QuestionDefinition;
  answerState: AnswerState;
  student: StudentInfo;
  onUpdateAnswer: (text: string) => void;
  onEvaluationComplete: (evalResult: EvaluationResult) => void;
  onAddToWrongNote: (qNum: string) => void;
  isSavedInWrongNotes: boolean;
}

export const WorksheetCard: React.FC<Props> = ({
  question,
  answerState,
  student,
  onUpdateAnswer,
  onEvaluationComplete,
  onAddToWrongNote,
  isSavedInWrongNotes,
}) => {
  const [showHints, setShowHints] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const evaluation = answerState.evaluation;

  const handleGrade = async () => {
    if (!answerState.answerText.trim()) {
      setErrorMessage('답안을 입력한 후 채점을 진행해 주세요.');
      return;
    }
    setErrorMessage(null);
    setIsGrading(true);

    try {
      const result = await requestGrade({
        questionId: question.id,
        questionNumber: question.questionNumber,
        questionTitle: question.title,
        studentAnswer: answerState.answerText,
        studentRegion: {
          sido: student.sido,
          sigungu: student.sigungu,
        },
        previousGrade: evaluation?.grade,
      });

      onEvaluationComplete(result);

      if (result.grade === 1) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || '채점 요청에 실패했습니다.');
    } finally {
      setIsGrading(false);
    }
  };

  const handleApplyFrame = (frame: string) => {
    if (!answerState.answerText) {
      onUpdateAnswer(frame);
    } else {
      onUpdateAnswer(`${answerState.answerText}\n${frame}`);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Question Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-white to-indigo-50/20 border-b border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-sm shadow-xs">
              {question.questionNumber}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {question.badge}
            </span>
            {student.sido && (question.questionNumber === '3' || question.questionNumber === '8') && (
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                (조사 대상: {question.questionNumber === '3' ? student.sido : `${student.sido} ${student.sigungu}`})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {evaluation && <GradeBadge grade={evaluation.grade} score={evaluation.score} />}
            <button
              onClick={() => setShowHints(!showHints)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                showHints
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>단계별 힌트</span>
              {showHints ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
          {question.title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
          {question.description}
        </p>
      </div>

      {/* Hints Accordion */}
      {showHints && (
        <div className="px-4 sm:px-5 pt-3">
          <StepHintPanel
            question={question}
            currentAnswer={answerState.answerText}
            student={student}
            onApplySentenceFrame={handleApplyFrame}
          />
        </div>
      )}

      {/* Answer Form */}
      <div className="p-4 sm:p-5 space-y-3">
        <div className="relative">
          <textarea
            rows={4}
            value={answerState.answerText}
            onChange={(e) => onUpdateAnswer(e.target.value)}
            placeholder="여기에 자신의 생각을 바탕으로 답안을 작성하세요. (작성이 막히면 상단 '단계별 힌트'를 활용해 보세요)"
            className="w-full text-sm leading-relaxed p-3.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all placeholder:text-slate-400 resize-y"
          />
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400 px-1">
            <span>
              {answerState.answerText.length > 0
                ? `${answerState.answerText.length}자 작성됨`
                : '아직 작성되지 않음'}
            </span>
            {answerState.history.length > 0 && (
              <span className="text-indigo-600 font-medium">
                총 {answerState.history.length}회 채점/수정 이력 있음
              </span>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={handleGrade}
              disabled={isGrading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 active:scale-98 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isGrading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI 5등급 분석 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{evaluation ? '다시 채점받기' : 'AI 5등급 채점하기'}</span>
                </>
              )}
            </button>

            {answerState.answerText && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('답안을 초기화하시겠습니까?')) {
                    onUpdateAnswer('');
                  }
                }}
                className="text-xs text-slate-400 hover:text-slate-600 p-2"
                title="답안 초기화"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Add to Wrong Notes CTA */}
          {evaluation && evaluation.grade > 1 && (
            <button
              onClick={() => onAddToWrongNote(question.questionNumber)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isSavedInWrongNotes
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <BookMarked className="w-3.5 h-3.5 text-amber-600" />
              <span>{isSavedInWrongNotes ? '오답 노트에 등록됨' : '오답 노트에 담기'}</span>
            </button>
          )}
        </div>

        {/* Evaluation Feedback Card */}
        {evaluation && (
          <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3 transition-all animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">AI 종합 피드백</span>
                <GradeBadge grade={evaluation.grade} score={evaluation.score} />
              </div>
              <span className="text-[11px] text-slate-400">
                평가 시간: {evaluation.evaluatedAt}
              </span>
            </div>

            {/* Grade 1 Celebration */}
            {evaluation.grade === 1 && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">
                  축하합니다! 핵심 개념과 논리가 완벽하게 기술되어 1등급(만점)을 달성했습니다!
                </span>
              </div>
            )}

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-white border border-emerald-100 shadow-2xs space-y-1">
                <div className="flex items-center gap-1 font-bold text-emerald-800 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>잘 작성된 부분</span>
                </div>
                <p className="text-slate-700 leading-relaxed text-[11px] sm:text-xs">
                  {evaluation.strengths}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-amber-100 shadow-2xs space-y-1">
                <div className="flex items-center gap-1 font-bold text-amber-800 text-[11px]">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>더 보완할 부분</span>
                </div>
                <p className="text-slate-700 leading-relaxed text-[11px] sm:text-xs">
                  {evaluation.improvements}
                </p>
              </div>
            </div>

            {/* Concept Tags */}
            <div className="space-y-1.5 text-xs">
              {evaluation.keyConceptsFound.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold text-slate-500">인정된 개념:</span>
                  {evaluation.keyConceptsFound.map((kw, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium"
                    >
                      ✓ {kw}
                    </span>
                  ))}
                </div>
              )}

              {evaluation.missingConcepts.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold text-slate-500">추천 보완 개념:</span>
                  {evaluation.missingConcepts.map((kw, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-medium"
                    >
                      + {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Guiding Question for Student Scaffolding */}
            {evaluation.guidingQuestion && evaluation.grade > 1 && (
              <div className="p-3 rounded-lg bg-indigo-50/80 border border-indigo-200/80 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-indigo-900 text-xs">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                  <span>1등급 달성을 위한 AI 유도 질문:</span>
                </div>
                <p className="text-indigo-950 font-medium leading-relaxed">
                  "{evaluation.guidingQuestion}"
                </p>
                {evaluation.exemplarHint && (
                  <p className="text-indigo-700/90 text-[11px] pt-1">
                    💡 힌트: {evaluation.exemplarHint}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
