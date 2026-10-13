import React from 'react';
import { GradeLevel } from '../types/worksheet.ts';
import { Award, CheckCircle2, AlertCircle, HelpCircle, AlertTriangle } from 'lucide-react';

interface Props {
  grade?: GradeLevel;
  score?: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const GradeBadge: React.FC<Props> = ({ grade, score, showScore = true, size = 'md' }) => {
  if (!grade) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
        <HelpCircle className="w-3.5 h-3.5" /> 미채점
      </span>
    );
  }

  const configs: Record<
    GradeLevel,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode; star: string }
  > = {
    1: {
      label: '1등급 (매우 우수)',
      bg: 'bg-indigo-50 text-indigo-700',
      text: 'text-indigo-800',
      border: 'border-indigo-300 ring-2 ring-indigo-200/50',
      icon: <Award className="w-4 h-4 text-amber-500 fill-amber-400" />,
      star: '★★★★★',
    },
    2: {
      label: '2등급 (우수)',
      bg: 'bg-emerald-50 text-emerald-700',
      text: 'text-emerald-800',
      border: 'border-emerald-300 ring-1 ring-emerald-200/50',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      star: '★★★★☆',
    },
    3: {
      label: '3등급 (보통)',
      bg: 'bg-amber-50 text-amber-800',
      text: 'text-amber-800',
      border: 'border-amber-300 ring-1 ring-amber-200/50',
      icon: <AlertCircle className="w-4 h-4 text-amber-600" />,
      star: '★★★☆☆',
    },
    4: {
      label: '4등급 (노력 요망)',
      bg: 'bg-orange-50 text-orange-800',
      text: 'text-orange-800',
      border: 'border-orange-300',
      icon: <AlertTriangle className="w-4 h-4 text-orange-600" />,
      star: '★★☆☆☆',
    },
    5: {
      label: '5등급 (재작성 권장)',
      bg: 'bg-rose-50 text-rose-700',
      text: 'text-rose-800',
      border: 'border-rose-300',
      icon: <AlertCircle className="w-4 h-4 text-rose-600" />,
      star: '★☆☆☆☆',
    },
  };

  const current = configs[grade];
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs md:text-sm px-3 py-1',
    lg: 'text-sm md:text-base px-4 py-2 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm font-semibold transition-all ${current.bg} ${current.border} ${sizeClasses[size]}`}
      title={current.label}
    >
      {current.icon}
      <span>{current.label}</span>
      {showScore && score !== undefined && (
        <span className="ml-1 px-1.5 py-0.5 rounded-md bg-white/80 text-[11px] font-bold text-slate-700 border border-black/5">
          {score}점
        </span>
      )}
    </span>
  );
};
