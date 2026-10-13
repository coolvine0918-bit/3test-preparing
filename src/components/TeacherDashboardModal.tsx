import React, { useState } from 'react';
import { SheetSubmissionRecord } from '../types/worksheet.ts';
import {
  USER_SPREADSHEET_ID,
  USER_SPREADSHEET_URL,
  APPS_SCRIPT_CODE_SNIPPET,
  HARDCODED_APPS_SCRIPT_URL,
  submitToAppsScript,
} from '../services/appsScriptService.ts';
import {
  X,
  FileSpreadsheet,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  Code2,
  Send,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  appsScriptUrl: string;
  onSetAppsScriptUrl: (url: string) => void;
  submissions: SheetSubmissionRecord[];
  onRefreshSubmissions: () => void;
  isSyncing: boolean;
}

export const TeacherDashboardModal: React.FC<Props> = ({
  isOpen,
  onClose,
  appsScriptUrl,
  onSetAppsScriptUrl,
  submissions,
  onRefreshSubmissions,
  isSyncing,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [urlInput, setUrlInput] = useState(appsScriptUrl || HARDCODED_APPS_SCRIPT_URL);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE_SNIPPET);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleSaveUrl = () => {
    onSetAppsScriptUrl(urlInput.trim());
    setTestResult({
      type: 'success',
      text: 'Apps Script 웹 앱 URL이 성공적으로 저장되었습니다.',
    });
  };

  const handleTestSubmit = async () => {
    const targetUrl = urlInput.trim() || appsScriptUrl;
    if (!targetUrl) {
      setTestResult({ type: 'error', text: '먼저 Apps Script 웹 앱 URL을 입력해 주세요.' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const testRecord: SheetSubmissionRecord = {
      timestamp: new Date().toLocaleString('ko-KR'),
      studentId: '99999',
      name: '연동테스트',
      region: '서울특별시 종로구',
      overallGrade: '1등급',
      totalScore: 30,
      q1_answer: '테스트 답안입니다.',
      q1_grade: '1등급',
      q2_answer: '테스트 답안입니다.',
      q2_grade: '1등급',
      q3_answer: '테스트 답안입니다.',
      q3_grade: '1등급',
      q6_answer: '테스트 답안입니다.',
      q6_grade: '1등급',
      q7_answer: '테스트 답안입니다.',
      q7_grade: '1등급',
      q8_answer: '테스트 답안입니다.',
      q8_grade: '1등급',
      wrongNoteRevisedCount: 0,
      teacherComment: 'Google Apps Script 연결 테스트 성공',
    };

    const res = await submitToAppsScript(testRecord, targetUrl);
    setIsTesting(false);

    if (res.success) {
      setTestResult({
        type: 'success',
        text: '지정하신 구글 스프레드시트(1tprMbtu...)로 테스트 데이터가 성공적으로 전송되었습니다!',
      });
    } else {
      setTestResult({
        type: 'error',
        text: res.message || '전송 실패. 웹 앱 배포 권한이 [모든 사용자(Anyone)]로 설정되었는지 확인해 주세요.',
      });
    }
  };

  // Grade Distribution Calculation
  const gradeCounts: Record<string, number> = {
    '1등급': 0,
    '2등급': 0,
    '3등급': 0,
    '4등급': 0,
    '5등급': 0,
  };
  submissions.forEach((s) => {
    if (gradeCounts[s.overallGrade] !== undefined) {
      gradeCounts[s.overallGrade]++;
    }
  });

  const downloadCSV = () => {
    if (submissions.length === 0) {
      alert('다운로드할 제출 데이터가 없습니다.');
      return;
    }

    const headers = [
      '제출일시', '학번', '이름', '지역', '종합등급', '총점(30점)',
      '1번 등급', '2번 등급', '3번 등급', '6번 등급', '7번 등급', '8번 등급',
      '오답노트 수정횟수',
    ];

    const rows = submissions.map((s) => [
      s.timestamp,
      s.studentId,
      s.name,
      s.region,
      s.overallGrade,
      s.totalScore,
      s.q1_grade,
      s.q2_grade,
      s.q3_grade,
      s.q6_grade,
      s.q7_grade,
      s.q8_grade,
      s.wrongNoteRevisedCount,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join(
        '\n'
      );

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `지방자치_학습지_제출명단_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                교사용 구글 스프레드시트 & Apps Script 관리
              </h2>
              <p className="text-xs text-slate-400">
                지정된 스프레드시트로 학생들의 5등급 채점 답안이 실시간 자동 전송됩니다
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

        {/* Status Alerts */}
        {testResult && (
          <div
            className={`px-5 py-2.5 text-xs flex items-center gap-2 border-b ${
              testResult.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {testResult.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{testResult.text}</span>
          </div>
        )}

        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Section 1: Designated Google Sheet Info */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50/70 via-white to-sky-50/50 border border-indigo-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-indigo-900 block">지정된 교사 구글 스프레드시트</span>
                <span className="text-[11px] font-mono text-slate-600">ID: {USER_SPREADSHEET_ID}</span>
              </div>

              <a
                href={USER_SPREADSHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>선생님 구글 시트 바로가기</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Apps Script Setup Instructions Card */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-indigo-600" />
                  <span>Google Apps Script 간편 연동 가이드</span>
                </span>
                <button
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 transition-all text-[11px]"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? '스크립트 복사완료!' : '앱스 스크립트 코드 복사'}</span>
                </button>
              </div>

              <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
                <li>
                  <a href={USER_SPREADSHEET_URL} target="_blank" rel="noreferrer" className="text-indigo-600 underline font-semibold">
                    지정 스프레드시트
                  </a>{' '}
                  상단 메뉴에서 <strong>확장 프로그램 &gt; Apps Script</strong>를 클릭합니다.
                </li>
                <li>기존 코드를 지우고 위 <strong>[앱스 스크립트 코드 복사]</strong> 버튼을 눌러 붙여넣은 뒤 저장(Ctrl+S)합니다.</li>
                <li>
                  우측 상단 <strong>배포 &gt; 새 배포</strong> 클릭 후 유형에서 <strong>웹 앱</strong>을 선택합니다.
                </li>
                <li>
                  액세스 권한을 <strong>'모든 사용자(Anyone)'</strong>로 지정하고 배포 후 나오는 <strong>웹 앱 URL</strong>을 아래에 입력하세요.
                </li>
              </ol>

              {/* Web App URL Input */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="font-semibold text-slate-700">배포된 Apps Script 웹 앱 URL:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  선생님 웹 앱 주소 하드코딩 적용됨 (상시 연결)
                </span>
              </div>
              <div className="pt-1 flex flex-wrap sm:flex-nowrap items-center gap-2">
                <input
                  type="text"
                  placeholder="https://script.google.com/macros/s/.../exec (Apps Script 웹 앱 URL)"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 text-xs p-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                />
                <button
                  onClick={handleSaveUrl}
                  className="px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors shrink-0"
                >
                  URL 저장
                </button>
                <button
                  onClick={handleTestSubmit}
                  disabled={isTesting}
                  className="px-3.5 py-2 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-1 shrink-0 disabled:opacity-50"
                >
                  {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>연동 테스트</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Real-time Grade Analytics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
            {(['1등급', '2등급', '3등급', '4등급', '5등급'] as const).map((gradeStr) => {
              const count = gradeCounts[gradeStr] || 0;
              const percent = submissions.length > 0 ? Math.round((count / submissions.length) * 100) : 0;
              return (
                <div key={gradeStr} className="p-2.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500 block">{gradeStr}</span>
                  <span className="text-lg font-black text-slate-800 block my-0.5">{count}명</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{percent}%</span>
                </div>
              );
            })}
          </div>

          {/* Section 3: Submissions Table */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  실시간 학생 제출 명단 ({submissions.length}명)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onRefreshSubmissions}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md font-medium transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
                  <span>새로고침</span>
                </button>
                <button
                  onClick={downloadCSV}
                  className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 px-2.5 py-1 rounded-md transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV 다운로드</span>
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">제출시간</th>
                    <th className="py-2.5 px-3">학번</th>
                    <th className="py-2.5 px-3">이름</th>
                    <th className="py-2.5 px-3">지역</th>
                    <th className="py-2.5 px-3">종합 등급</th>
                    <th className="py-2.5 px-3 text-center">1번(광역장)</th>
                    <th className="py-2.5 px-3 text-center">2번(광역의회)</th>
                    <th className="py-2.5 px-3 text-center">3번(광역활동)</th>
                    <th className="py-2.5 px-3 text-center">6번(기초장)</th>
                    <th className="py-2.5 px-3 text-center">7번(기초의회)</th>
                    <th className="py-2.5 px-3 text-center">8번(기초활동)</th>
                    <th className="py-2.5 px-3 text-center">오답노트 수정</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {submissions.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-slate-400">
                        아직 제출된 학생 데이터가 없습니다. 학생이 학습지에서 [최종 제출]을 완료하면 즉시 이곳과 구글 스프레드시트에 기록됩니다.
                      </td>
                    </tr>
                  ) : (
                    submissions.map((sub, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-3 text-[11px] text-slate-400">{sub.timestamp}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{sub.studentId}</td>
                        <td className="py-2 px-3 font-semibold">{sub.name}</td>
                        <td className="py-2 px-3 text-[11px] text-slate-500">{sub.region}</td>
                        <td className="py-2 px-3">
                          <span className="font-bold text-indigo-700">{sub.overallGrade}</span>
                          <span className="text-[10px] text-slate-400 ml-1">({sub.totalScore}점)</span>
                        </td>
                        <td className="py-2 px-3 text-center text-[11px]">{sub.q1_grade}</td>
                        <td className="py-2 px-3 text-center text-[11px]">{sub.q2_grade}</td>
                        <td className="py-2 px-3 text-center text-[11px]">{sub.q3_grade}</td>
                        <td className="py-2 px-3 text-center text-[11px]">{sub.q6_grade}</td>
                        <td className="py-2 px-3 text-center text-[11px]">{sub.q7_grade}</td>
                        <td className="py-2 px-3 text-center text-[11px]">{sub.q8_grade}</td>
                        <td className="py-2 px-3 text-center">
                          {sub.wrongNoteRevisedCount > 0 ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                              {sub.wrongNoteRevisedCount}회 수정
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            {appsScriptUrl ? 'Google Apps Script 웹 앱 실시간 연동 활성화됨' : '웹 앱 URL을 등록하면 실시간 전송됩니다'}
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
