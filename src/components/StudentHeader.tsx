import React from 'react';
import { StudentInfo } from '../types/worksheet.ts';
import { KOREA_REGIONS } from '../data/questionsData.ts';
import { User, MapPin, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react';

interface Props {
  student: StudentInfo;
  onUpdateStudent: (updated: Partial<StudentInfo>) => void;
  completedCount: number;
  grade1Count: number;
  totalQuestions: number;
  wrongNoteCount: number;
  onOpenWrongNotes: () => void;
  onOpenTeacherDashboard: () => void;
  isTeacherConnected: boolean;
}

export const StudentHeader: React.FC<Props> = ({
  student,
  onUpdateStudent,
  completedCount,
  grade1Count,
  totalQuestions,
  wrongNoteCount,
  onOpenWrongNotes,
  onOpenTeacherDashboard,
  isTeacherConnected,
}) => {
  const sidos = Object.keys(KOREA_REGIONS);
  const currentSigungus = student.sido ? KOREA_REGIONS[student.sido] || [] : [];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs backdrop-blur-md bg-white/95">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  지방 자치와 시민 참여
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                  AI 스마트 학습지
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                단계별 힌트와 5등급 AI 피드백을 통해 스스로 답을 완성해 보세요
              </p>
            </div>
          </div>

          {/* Quick Action Badges */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenWrongNotes}
              className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                wrongNoteCount > 0
                  ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>오답 노트 & 복습</span>
              {wrongNoteCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                  {wrongNoteCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenTeacherDashboard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
            >
              <span>교사용 관리 & 시트</span>
              {isTeacherConnected && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-200 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Student Inputs & Live Progress */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 items-center">
          {/* Inputs */}
          <div className="md:col-span-8 flex flex-wrap sm:flex-nowrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 w-full sm:w-36">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="학번 (예: 20315)"
                value={student.studentId}
                onChange={(e) => onUpdateStudent({ studentId: e.target.value })}
                className="w-full text-xs font-medium text-slate-800 bg-transparent outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 w-full sm:w-32">
              <input
                type="text"
                placeholder="이름 (예: 홍길동)"
                value={student.name}
                onChange={(e) => onUpdateStudent({ name: e.target.value })}
                className="w-full text-xs font-medium text-slate-800 bg-transparent outline-none placeholder:text-slate-400"
              />
            </div>

            {/* Region selectors for dynamic context */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <div className="flex items-center gap-1 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-200 text-xs">
                <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <select
                  value={student.sido}
                  onChange={(e) => {
                    const newSido = e.target.value;
                    const defaultSigungu = KOREA_REGIONS[newSido]?.[0] || '';
                    onUpdateStudent({ sido: newSido, sigungu: defaultSigungu });
                  }}
                  className="bg-transparent text-xs font-medium text-slate-700 outline-none cursor-pointer"
                >
                  {sidos.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {currentSigungus.length > 0 && (
                <div className="flex items-center bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-200 text-xs">
                  <select
                    value={student.sigungu}
                    onChange={(e) => onUpdateStudent({ sigungu: e.target.value })}
                    className="bg-transparent text-xs font-medium text-slate-700 outline-none cursor-pointer max-w-[130px] truncate"
                  >
                    {currentSigungus.map((sg) => (
                      <option key={sg} value={sg}>
                        {sg}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Progress Counters */}
          <div className="md:col-span-4 flex items-center justify-between md:justify-end gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">학습 진행률</span>
                <span className="font-bold text-slate-800">
                  {completedCount} / {totalQuestions} 문항
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-indigo-600 block flex items-center justify-end gap-0.5">
                  <Sparkles className="w-3 h-3 text-amber-500 inline" /> 1등급 만점
                </span>
                <span className="font-bold text-indigo-700">
                  {grade1Count} / {totalQuestions}
                </span>
              </div>
            </div>

            {/* Micro Progress Bar */}
            <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / totalQuestions) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Missing Info Warning if blank */}
        {(!student.studentId || !student.name) && (
          <div className="mt-2 text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>정확한 채점 기록과 구글 시트 전송을 위해 <strong>학번</strong>과 <strong>이름</strong>을 입력해 주세요.</span>
          </div>
        )}
      </div>
    </header>
  );
};
