import React from 'react';
import { StudentInfo, AnswerState, SheetSubmissionRecord, QuestionDefinition } from '../types/worksheet.ts';
import { GradeBadge } from './GradeBadge.tsx';
import { USER_SPREADSHEET_ID, USER_SPREADSHEET_URL } from '../services/appsScriptService.ts';
import {
  X,
  Award,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  Sparkles,
  MapPin,
  User,
  Calendar,
  ExternalLink,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: StudentInfo;
  answers: Record<string, AnswerState>;
  questions: QuestionDefinition[];
  submissionRecord: SheetSubmissionRecord | null;
  appsScriptUrl: string;
  isSendingToSheets: boolean;
  sheetSentSuccess: boolean;
}

export const SubmissionSummaryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  student,
  answers,
  questions,
  submissionRecord,
  appsScriptUrl,
  isSendingToSheets,
  sheetSentSuccess,
}) => {
  if (!isOpen || !submissionRecord) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-amber-300">
              <Award className="w-6 h-6 fill-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                최종 학습 평가 성적표 & 제출 완료
              </h2>
              <p className="text-xs text-indigo-200">
                &lt;지방 자치와 시민 참여&gt; AI 자기주도 스마트 학습지 결과
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Sheets Transmission Banner */}
          <div
            className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
              sheetSentSuccess
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : isSendingToSheets
                ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {sheetSentSuccess
                  ? `선생님 구글 스프레드시트(${USER_SPREADSHEET_ID.slice(0, 8)}...)로 전송 완료되었습니다!`
                  : isSendingToSheets
                  ? 'Apps Script를 통해 구글 스프레드시트로 전송하는 중...'
                  : appsScriptUrl
                  ? '구글 스프레드시트 연동 준비 완료'
                  : '학습지 제출이 완료되었습니다 (로컬 보관 완료).'}
              </span>
            </div>
            <a
              href={USER_SPREADSHEET_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-900 underline text-[11px]"
            >
              <span>시트 열기</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Student Profile Card & Overall Grade */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  {student.studentId} {student.name}
                </span>
                <span className="text-slate-300">|</span>
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                  {student.sido} {student.sigungu}
                </span>
                <span className="text-slate-300">|</span>
                <span className="inline-flex items-center gap-1 text-slate-400 text-[11px]">
                  <Calendar className="w-3.5 h-3.5" />
                  {submissionRecord.timestamp}
                </span>
              </div>

              <h3 className="text-lg font-black text-slate-900">
                {student.name} 학생의 종합 성취 결과
              </h3>

              <p className="text-xs text-slate-500">
                오답 노트를 통한 성장 노력 및 단계별 힌트 활용도가 높게 반영되었습니다.
              </p>
            </div>

            {/* Overall Grade Badge */}
            <div className="text-center bg-white px-5 py-3.5 rounded-xl border border-indigo-200 shadow-xs min-w-[150px]">
              <span className="text-[11px] font-bold text-slate-500 block mb-0.5">
                종합 산출 등급
              </span>
              <span className="text-2xl font-black text-indigo-600 block">
                {submissionRecord.overallGrade}
              </span>
              <span className="text-xs font-semibold text-slate-700 block mt-0.5">
                총 {submissionRecord.totalScore}점 / 30점 만점
              </span>
            </div>
          </div>

          {/* 6 Questions Summary Grid */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>문항별 세부 등급 및 답안 요약</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {questions.map((q) => {
                const ans = answers[q.questionNumber];
                const evalRes = ans?.evaluation;
                return (
                  <div
                    key={q.questionNumber}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-colors space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-md bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                          {q.questionNumber}
                        </span>
                        <span className="font-bold text-slate-800 text-xs truncate max-w-[180px]">
                          {q.title}
                        </span>
                      </div>
                      <GradeBadge grade={evalRes?.grade} score={evalRes?.score} size="sm" />
                    </div>

                    <p className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded-lg leading-relaxed line-clamp-2">
                      "{ans?.answerText || '(미작성)'}"
                    </p>

                    {evalRes && (
                      <p className="text-[10px] text-indigo-700 font-medium">
                        ✓ {evalRes.strengths.slice(0, 60)}...
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Teacher Comment */}
          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-1.5 text-xs">
            <span className="font-bold text-indigo-900 text-xs block">
              👨‍🏫 AI 교사 종합 지도 의견:
            </span>
            <p className="text-indigo-950 leading-relaxed">
              {submissionRecord.teacherComment}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>학습지 성적표 인쇄하기</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-xs"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
