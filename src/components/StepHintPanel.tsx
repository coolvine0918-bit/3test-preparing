import React, { useState } from 'react';
import { QuestionDefinition, StepHintData, StudentInfo } from '../types/worksheet.ts';
import { requestStepHint } from '../services/apiClient.ts';
import { Lightbulb, Key, AlignLeft, HelpCircle, Loader2, Copy, Check } from 'lucide-react';

interface Props {
  question: QuestionDefinition;
  currentAnswer: string;
  student: StudentInfo;
  onApplySentenceFrame: (frame: string) => void;
}

export const StepHintPanel: React.FC<Props> = ({
  question,
  currentAnswer,
  student,
  onApplySentenceFrame,
}) => {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [hintCache, setHintCache] = useState<Record<number, StepHintData>>({});
  const [loadingStep, setLoadingStep] = useState<number | null>(null);
  const [copiedFrame, setCopiedFrame] = useState(false);

  const fetchHint = async (step: 1 | 2 | 3) => {
    setActiveStep(step);
    if (hintCache[step]) return;

    setLoadingStep(step);
    try {
      const data = await requestStepHint({
        questionId: question.id,
        questionNumber: question.questionNumber,
        questionTitle: question.title,
        currentAnswer,
        hintLevel: step,
        studentRegion: {
          sido: student.sido,
          sigungu: student.sigungu,
        },
      });
      setHintCache((prev) => ({ ...prev, [step]: data }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStep(null);
    }
  };

  const handleCopyOrApply = (text: string) => {
    onApplySentenceFrame(text);
    setCopiedFrame(true);
    setTimeout(() => setCopiedFrame(false), 2000);
  };

  const currentHint = hintCache[activeStep];

  return (
    <div className="bg-gradient-to-br from-indigo-50/70 via-white to-sky-50/50 rounded-xl p-4 border border-indigo-100 shadow-xs transition-all">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 text-indigo-900 font-semibold text-xs sm:text-sm">
          <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-400" />
          <span>자기주도 3단계 힌트 & 작성 유도</span>
        </div>
        <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded-full font-medium">
          스스로 답안 만들기
        </span>
      </div>

      {/* Step Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg text-xs mb-3">
        <button
          onClick={() => fetchHint(1)}
          className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-md font-medium transition-all ${
            activeStep === 1
              ? 'bg-white text-indigo-700 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Key className="w-3.5 h-3.5 text-indigo-500" />
          <span>1단계: 핵심 개념</span>
        </button>

        <button
          onClick={() => fetchHint(2)}
          className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-md font-medium transition-all ${
            activeStep === 2
              ? 'bg-white text-indigo-700 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlignLeft className="w-3.5 h-3.5 text-sky-500" />
          <span>2단계: 문장 뼈대</span>
        </button>

        <button
          onClick={() => fetchHint(3)}
          className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-md font-medium transition-all ${
            activeStep === 3
              ? 'bg-white text-indigo-700 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
          <span>3단계: AI 유도질문</span>
        </button>
      </div>

      {/* Hint Content Area */}
      <div className="min-h-[120px] bg-white rounded-lg p-3.5 border border-slate-200/80 shadow-2xs">
        {loadingStep === activeStep ? (
          <div className="flex flex-col items-center justify-center py-6 text-indigo-600 text-xs gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>AI 맞춤형 {activeStep}단계 힌트를 불러오는 중...</span>
          </div>
        ) : currentHint ? (
          <div className="space-y-3 text-xs">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                {currentHint.stepTitle}
              </h4>
            </div>

            <p className="text-slate-700 leading-relaxed whitespace-pre-line">
              {currentHint.content}
            </p>

            {/* Keyword tags */}
            {currentHint.keywordList && currentHint.keywordList.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                  필수 키워드 체크리스트:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentHint.keywordList.map((kw, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium text-[11px]"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Sentence frame */}
            {currentHint.sentenceFrame && (
              <div className="bg-sky-50/70 p-2.5 rounded-lg border border-sky-100 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-sky-900">
                  <span>추천 문장 작성 틀 (스스로 빈칸 채우기):</span>
                  <button
                    onClick={() => handleCopyOrApply(currentHint.sentenceFrame || '')}
                    className="inline-flex items-center gap-1 text-[11px] text-sky-700 hover:text-sky-900 font-bold bg-white px-2 py-0.5 rounded border border-sky-200 shadow-2xs"
                  >
                    {copiedFrame ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedFrame ? '답안에 삽입됨!' : '답안창에 적용'}</span>
                  </button>
                </div>
                <p className="text-sky-800 italic font-mono text-[11px] leading-relaxed">
                  "{currentHint.sentenceFrame}"
                </p>
              </div>
            )}

            {/* Scaffolding Question */}
            {currentHint.scaffoldingQuestion && (
              <div className="bg-amber-50/80 p-2.5 rounded-lg border border-amber-200/80">
                <span className="font-semibold text-amber-900 text-[11px] block mb-0.5">
                  생각해 볼 질문:
                </span>
                <p className="text-amber-800 font-medium">
                  "{currentHint.scaffoldingQuestion}"
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Default Static Scaffold if not yet fetched */
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">
                {activeStep === 1 && '1단계: 기본 개념 및 추천 키워드'}
                {activeStep === 2 && '2단계: 문장 구조 뼈대 가이드'}
                {activeStep === 3 && '3단계: AI 실시간 작성 유도 질문'}
              </span>
            </div>

            {activeStep === 1 && (
              <>
                <p className="text-slate-600 leading-relaxed">
                  {question.description}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {question.defaultKeyWords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium text-[11px]"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              </>
            )}

            {activeStep === 2 && (
              <div className="bg-sky-50/70 p-2.5 rounded-lg border border-sky-100 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-sky-900">
                  <span>문장 뼈대 예시:</span>
                  <button
                    onClick={() => handleCopyOrApply(question.sentenceTemplate)}
                    className="inline-flex items-center gap-1 text-[11px] text-sky-700 hover:text-sky-900 font-bold bg-white px-2 py-0.5 rounded border border-sky-200"
                  >
                    {copiedFrame ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedFrame ? '답안에 삽입됨!' : '답안창에 적용'}</span>
                  </button>
                </div>
                <p className="text-sky-800 italic font-mono text-[11px]">
                  "{question.sentenceTemplate}"
                </p>
              </div>
            )}

            {activeStep === 3 && (
              <div className="space-y-1.5">
                <p className="text-slate-600">
                  작성 중인 답안을 분석하여 부족한 점을 채울 수 있는 질문을 생성합니다.
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-700">
                  {question.guideQuestions.map((q, idx) => (
                    <li key={idx} className="text-[11px] text-amber-900 bg-amber-50/50 p-1 rounded">
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => fetchHint(activeStep)}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <span>✨ AI 맞춤형 심층 힌트 생성하기</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
