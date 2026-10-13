import { EvaluationResult, StepHintData } from '../types/worksheet.ts';

const RUBRIC_KEYWORDS: Record<string, { required: string[]; optional: string[]; title: string }> = {
  '1': {
    required: ['집행', '행정'],
    optional: ['예산', '조례', '공무원', '총괄', '정책', '사업'],
    title: '광역 자치 단체장의 역할',
  },
  '2': {
    required: ['의결', '조례'],
    optional: ['예산', '심의', '감사', '견제', '주민 대표'],
    title: '광역 의회의 역할',
  },
  '3': {
    required: ['최근', '사업'],
    optional: ['정책', '주민', '복지', '교통', '지원', '혜택'],
    title: '광역 단체장 최근 활동 조사',
  },
  '6': {
    required: ['집행', '생활'],
    optional: ['민원', '복지', '예산', '구청', '시청', '환경'],
    title: '기초 자치 단체장의 역할',
  },
  '7': {
    required: ['의결', '조례'],
    optional: ['기초', '예산', '심의', '감사', '구의회', '시의회'],
    title: '기초 자치 의회의 역할',
  },
  '8': {
    required: ['최근', '사업'],
    optional: ['생활', '골목', '동네', '복지', '주민', '개선'],
    title: '기초 단체장 최근 활동 조사',
  },
};

function staticFallbackGrade(
  questionNumber: string,
  answer: string
): EvaluationResult {
  const meta = RUBRIC_KEYWORDS[questionNumber] || RUBRIC_KEYWORDS['1'];
  const text = answer.trim();

  const foundReq = meta.required.filter((k) => text.includes(k));
  const foundOpt = meta.optional.filter((k) => text.includes(k));
  const missing = [...meta.required, ...meta.optional].filter((k) => !text.includes(k)).slice(0, 3);

  let grade: 1 | 2 | 3 | 4 | 5 = 3;
  let score = 3;
  let gradeLabel = '3등급 (보통)';

  if (text.length < 10) {
    grade = 5;
    score = 1;
    gradeLabel = '5등급 (재작성 권장)';
  } else if (foundReq.length >= 2 && foundOpt.length >= 2 && text.length >= 35) {
    grade = 1;
    score = 5;
    gradeLabel = '1등급 (매우 우수)';
  } else if (foundReq.length >= 1 && foundOpt.length >= 1 && text.length >= 25) {
    grade = 2;
    score = 4;
    gradeLabel = '2등급 (우수)';
  } else if (foundReq.length >= 1 || foundOpt.length >= 1) {
    grade = 3;
    score = 3;
    gradeLabel = '3등급 (보통)';
  } else {
    grade = 4;
    score = 2;
    gradeLabel = '4등급 (노력 요망)';
  }

  return {
    grade,
    gradeLabel,
    score,
    isCorrect: grade <= 2,
    strengths:
      grade <= 2
        ? '기관의 핵심 성격과 주요 역할을 논리적으로 잘 서술하였습니다.'
        : '질문의 의도를 파악하고 성실하게 답변을 작성하였습니다.',
    improvements:
      grade === 1
        ? '완벽한 서술입니다. 다른 문항도 이와 같이 꼼꼼히 탐구해 보세요.'
        : `핵심 개념인 [${missing.join(', ')}] 관련 내용을 조금 더 보충해 보세요.`,
    keyConceptsFound: [...foundReq, ...foundOpt],
    missingConcepts: missing,
    guidingQuestion: `이 기관이 주민의 삶을 개선하기 위해 갖는 가장 대표적인 권한과 책임은 무엇일까요?`,
    exemplarHint: `기관의 성격(집행 또는 의결)을 명시하고 대표적인 업무를 2가지 이상 적어보세요.`,
    evaluatedAt: new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  };
}

export async function requestGrade(payload: {
  questionId: number;
  questionNumber: string;
  questionTitle: string;
  studentAnswer: string;
  studentRegion?: {
    sido: string;
    sigungu: string;
  };
  previousGrade?: number;
}): Promise<EvaluationResult> {
  try {
    const response = await fetch('/api/grade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        ...data,
        evaluatedAt: new Date().toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      };
    }
  } catch (err) {
    console.warn('Backend /api/grade unavailable, switching to static rubric evaluator:', err);
  }

  // Fallback for static hosts (GitHub Pages)
  return staticFallbackGrade(payload.questionNumber, payload.studentAnswer);
}

export async function requestStepHint(payload: {
  questionId: number;
  questionNumber: string;
  questionTitle: string;
  currentAnswer?: string;
  hintLevel: 1 | 2 | 3;
  studentRegion?: {
    sido: string;
    sigungu: string;
  };
}): Promise<StepHintData> {
  try {
    const response = await fetch('/api/hint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('Backend /api/hint unavailable, switching to static scaffold hint:', err);
  }

  // Static Fallback for GitHub Pages
  const meta = RUBRIC_KEYWORDS[payload.questionNumber] || RUBRIC_KEYWORDS['1'];
  if (payload.hintLevel === 1) {
    return {
      step: 1,
      stepTitle: '1단계: 핵심 개념 및 필수 키워드',
      content: '이 기관이 지방자치단체에서 법을 만드는 곳인지, 행정을 집행하는 곳인지 구분하는 것이 가장 중요합니다.',
      scaffoldingQuestion: '이 기관의 가장 주된 권한은 무엇일까요?',
      keywordList: [...meta.required, ...meta.optional.slice(0, 3)],
    };
  } else if (payload.hintLevel === 2) {
    return {
      step: 2,
      stepTitle: '2단계: 문장 뼈대 서술틀',
      content: '문장의 시작과 끝을 갖춘 완전한 서술형 문장으로 틀을 잡아보세요.',
      scaffoldingQuestion: '괄호 안에 들어갈 단어를 넣어 문장을 완성해 보세요.',
      keywordList: meta.required,
      sentenceFrame: '우리 지역의 [기관 명칭]은(는) [기관 성격]으로서, 주민을 위해 [주요 업무]를 수행합니다.',
    };
  } else {
    return {
      step: 3,
      stepTitle: '3단계: AI 자기주도 유도 질문',
      content: '작성한 문장에 구체적인 법적 권한이나 주민 생활에 미치는 영향이 드러나 있는지 점검해 보세요.',
      scaffoldingQuestion: '예산이나 조례와 관련해서 이 기관은 어떤 역할을 담당할까요?',
      keywordList: meta.optional,
    };
  }
}
