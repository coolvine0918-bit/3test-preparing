import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || "";

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface GradeRequest {
  questionId: number;
  questionNumber: string; // e.g. "1", "2", "3", "6", "7", "8"
  questionTitle: string;
  studentAnswer: string;
  studentRegion?: {
    sido: string;
    sigungu: string;
  };
  previousGrade?: number;
}

export interface HintRequest {
  questionId: number;
  questionNumber: string;
  questionTitle: string;
  currentAnswer?: string;
  hintLevel: 1 | 2 | 3; // 1: 개념/키워드, 2: 문장 구조/뼈대, 3: 작성 유도 질문
  studentRegion?: {
    sido: string;
    sigungu: string;
  };
}

const QUESTION_RUBRICS: Record<string, string> = {
  "1": `[문항 1] 광역 자치 단체장의 역할
- 대상: 특별시장, 광역시장, 특별자치시장, 도지사, 특별자치도지사
- 핵심 개념: 광역 자치단체의 '집행 기관' (행정부 수반)
- 주요 역할:
  1) 시·도 행정 사무의 총괄 및 정책 집행
  2) 조례안 발의 및 규칙 제정권
  3) 시·도 예산안 편성 및 집행
  4) 소속 공무원 임면 및 지휘·감독
  5) 광역 공공사업(광역 교통망, 지역 균형 발전, 재난 대응 등) 추진
  6) 주민 복리 증진 사업 총괄
- 5등급 기준:
  1등급(5점): 집행기관 명시 + 핵심 역할(예산 집행, 행정 총괄, 조례안 제출 등) 2개 이상 정확 서술 + 논리적 완성도 우수
  2등급(4점): 행정 총괄 및 주요 역할 1~2개 포함되었으나 기관 성격(집행기관) 언급이 모호하거나 구체성 소폭 미흡
  3등급(3점): 대체적인 방향(시/도민을 위한 정책 집행 등)은 맞으나 조례/예산/행정 등 핵심 용어가 부족함
  4등급(2점): "지역을 위해 열심히 일한다" 등 단순 일반론만 나열하여 단체장의 고유 행정 권한이 드러나지 않음
  5등급(1점): 의결기관과 혼동(예: 조례를 최종 의결한다)하거나 오답/무관 내용/미작성`,

  "2": `[문항 2] 광역 의회의 역할
- 대상: 시·도의회 (예: 서울특별시의회, 경기도의회 등)
- 핵심 개념: 광역 자치단체의 '의결 기관' (입법 기관, 주민의 대표기관)
- 주요 역할:
  1) 시·도 조례의 제정, 개정, 폐지 (입법권)
  2) 시·도 예산안 심의·확정 및 결산 승인 (재정 통제권)
  3) 집행부(단체장)에 대한 행정사무감사 및 조사 (행정 감시 및 견제)
  4) 중요 정책 동의 및 청원 처리, 주민 의견 수렴
- 5등급 기준:
  1등급(5점): 의결기관/주민대표 명시 + 조례 제·개정, 예산안 심의, 행정사무감사 중 2개 이상 명확 기술 및 견제 역할 서술
  2등급(4점): 조례 제정 또는 예산 심의 등 핵심 역할이 기재되었으나 견제/감시 역할이나 기관 성격 설명이 다소 축약됨
  3등급(3점): "법을 만든다", "시장을 감시한다" 등 대략적 이해는 있으나 전문적 개념(조례, 예산 심의, 감사) 미흡
  4등급(2점): "시민을 대표한다", "회의를 한다" 등 피상적인 내용에 머무름
  5등급(1점): 집행기관과 혼동(예: 시정을 직접 집행한다)하거나 전혀 다른 서술`,

  "3": `[문항 3] 1번 광역 자치 단체장의 최근(6개월 이내) 한 일 한 가지 조사
- 핵심 요건:
  1) 학생이 선택/거주하는 광역 지역(시·도)의 단체장 명시 (예: 서울시장, 경기지사, 부산시장 등)
  2) 최근 6개월 이내의 실제 정책, 사업, 협약, 주민 지원, 대중교통 정책(기후동행카드, 경기패스 등), 민생 정책 등 구체적 활동 언급
  3) 해당 활동이 지역 주민에게 미치는 긍정적 효과나 의미 서술
- 5등급 기준:
  1등급(5점): 광역 단체장(또는 지역명) + 최근 구체적 정책/사업명 + 주민에게 미치는 영향/의의가 명확히 서술됨
  2등급(4점): 최근 활동 내용은 적절하나 구체적인 사업명칭이 다소 모호하거나 시기적 언급/의의가 소폭 부족함
  3등급(3점): 기초단체장의 일과 혼동했거나 일반적인 선거 공약 수준의 모호한 서술
  4등급(2점): 단순 키워드 1개이거나 실제 단체장 활동인지 불분명한 내용
  5등급(1점): 무관한 내용, 허위 사실, 미작성`,

  "6": `[문항 6] 기초 자치 단체장의 역할
- 대상: 시·군·구청장 (예: 수원시장, 해운대구청장, 평창군수 등)
- 핵심 개념: 기초 자치단체의 '집행 기관' (주민 생활 밀착형 행정 수반)
- 주요 역할:
  1) 기초 시·군·구 행정 사무 총괄 및 집행
  2) 주민 생활 밀착 복지·민원 행정(주민센터, 보건소, 쓰레기·청소, 주거 환경 등)
  3) 기초 조례안 제출 및 규칙 제정
  4) 기초 자치단체 예산안 편성 및 집행
  5) 소속 공무원 지휘·감독 및 관할 지역 안전 관리
- 5등급 기준:
  1등급(5점): 기초 집행기관 명시 + 주민 생활 밀착형 행정 및 고유 역할(예산 집행, 조례안 제출, 복지 등) 2개 이상 정확 기재 + 광역과의 차이 이해 반영
  2등급(4점): 기초 행정 총괄 및 주요 역할 기재되었으나 구체성 또는 기관 성격이 살짝 보충 필요
  3등급(3점): 광역 단체장과의 구분이 모호하거나 일상적 행정 표현 위주
  4등급(2점): "구민을 위해 일함" 등 너무 포괄적이고 단편적인 진술
  5등급(1점): 기초 의회와 혼동하거나 오개념 서술`,

  "7": `[문항 7] 기초 자치 의회의 역할
- 대상: 시·군·구의회 (예: 수원시의회, 종로구의회 등)
- 핵심 개념: 기초 자치단체의 '의결 기관' (주민 생활 밀착 입법 및 감시)
- 주요 역할:
  1) 기초 시·군·구 조례의 제정, 개정, 폐지
  2) 시·군·구 예산안 심의 및 결산 승인
  3) 구청장·시장·군수 등 집행부에 대한 행정사무감사 및 조사
  4) 주민 청원 및 민원 대변, 지역 현안 심의
- 5등급 기준:
  1등급(5점): 기초 의결기관 명시 + 기초 조례 제·개정, 예산 심의, 구청/시청 행정사무감사 등 2개 이상 명확 서술
  2등급(4점): 조례 제정 또는 예산 심의 등 주요 권한 기재되었으나 견제/감시 역할 설명 부족
  3등급(3점): 대략적인 역할은 맞으나 광역의회와의 연계 및 기초 자치의 전문적 용어 부족
  4등급(2점): "의원들이 모여 토론한다" 등 단순 절차적 기술
  5등급(1점): 집행기관과 혼동하거나 오개념`,

  "8": `[문항 8] 6번 기초 자치 단체장의 최근(6개월 이내) 한 일 한 가지 조사
- 핵심 요건:
  1) 학생 거주 기초 지역(시·군·구)의 단체장(구청장/시장/군수) 명시
  2) 최근 6개월 내 생활 밀착형 정책(골목 상권 활성화, 지역 축제, 복지센터 지원, 보행로 개선, 어린이/노인 지원 사업 등) 실제 사례 서술
  3) 해당 사업의 주민 생활 체감 효과 서술
- 5등급 기준:
  1등급(5점): 기초 단체장/지역 명시 + 구체적인 최근 생활밀착 정책/사업명 + 주민 생활 개선 효과 완결 서술
  2등급(4점): 정책 사례는 맞으나 광역 단위 사업과 다소 겹치거나 세부 설명 소폭 부족
  3등급(3점): 추상적인 시책(예: 복지를 늘렸다)에 그치고 구체 사례 부족
  4등급(2점): 단편적인 단어 나열
  5등급(1점): 허위 사실, 광역과 혼동, 미작성`,
};

export async function gradeStudentAnswer(req: GradeRequest) {
  const rubric = QUESTION_RUBRICS[req.questionNumber] || QUESTION_RUBRICS["1"];
  const regionContext = req.studentRegion
    ? `학생이 조사 중인 지역: ${req.studentRegion.sido} ${req.studentRegion.sigungu}`
    : "학생의 거주/조사 지역: 미지정 (전국 기준 평가)";

  const systemPrompt = `당신은 대한민국 중·고등학교 일반사회/정치와 법 교과의 전문 교사이자 따뜻한 AI 학습 코치입니다.
학생들이 주도적으로 사회과 개념(지방자치단체의 집행기관과 의결기관의 역할, 광역과 기초의 차이)을 이해할 수 있도록 공정하고 친절하게 평가해야 합니다.

[평가 원칙]
1. 정답을 엄격하되 학생의 성장을 돕는 5등급으로 평가합니다.
   - 1등급: 만점/탁월 (5점)
   - 2등급: 우수 (4점)
   - 3등급: 보통 (3점)
   - 4등급: 노력요망 (2점)
   - 5등급: 재작성권장 (1점)
2. 학생이 스스로 답을 보완할 수 있도록 '정답을 그대로 알려주지 말고', '생각을 유도하는 질문(guidingQuestion)'과 '힌트(exemplarHint)'를 제시하세요.
3. 칭찬할 점(strengths)과 아쉬운 점(improvements)을 명확하고 따뜻한 어조로 안내하세요.
4. 발견된 핵심 개념(keyConceptsFound)과 빠진 핵심 개념(missingConcepts)을 2~4개씩 추출하세요.`;

  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}년 ${now.getMonth() + 1}월`;
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(now.getMonth() - 6);
  const sixMonthsAgoStr = `${sixMonthsAgo.getFullYear()}년 ${sixMonthsAgo.getMonth() + 1}월`;

  const timeContext =
    req.questionNumber === '3' || req.questionNumber === '8'
      ? `\n[시간 기준 (최근 6개월 검증)]: 현재 시점은 ${currentYearMonth}이며, '최근 6개월 이내'는 ${sixMonthsAgoStr} 이후입니다. 학생이 적은 사건/정책이 1~2년 이상 지난 과거의 일이나 전임 단체장 시절의 일인지, 아니면 현재 추진 중인 최근 정책인지 분별하여 평가하세요.`
      : '';

  const userPrompt = `[문항 정보]
문항 번호: ${req.questionNumber}번
문항 제목: ${req.questionTitle}
${regionContext}${timeContext}

[채점 기준 루브릭]
${rubric}

[학생이 작성한 답안]
"${req.studentAnswer}"

위 답안을 분석하여 채점 결과를 JSON으로 제공해 주세요.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            grade: {
              type: Type.INTEGER,
              description: "1부터 5까지의 등급 (1등급이 최우수, 5등급이 최하위)",
            },
            gradeLabel: {
              type: Type.STRING,
              description: "예: '1등급 (매우 우수)', '2등급 (우수)', '3등급 (보통)', '4등급 (노력 요망)', '5등급 (재작성 권장)'",
            },
            score: {
              type: Type.INTEGER,
              description: "점수 (1~5점)",
            },
            isCorrect: {
              type: Type.BOOLEAN,
              description: "1등급 또는 2등급인 경우 true",
            },
            strengths: {
              type: Type.STRING,
              description: "학생 답안에서 잘 서술된 부분과 칭찬",
            },
            improvements: {
              type: Type.STRING,
              description: "더 완벽한 답안이 되기 위해 보완해야 할 부분",
            },
            keyConceptsFound: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "학생 답안에 포함된 올바른 핵심 개념 키워드",
            },
            missingConcepts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "추가하면 좋을 누락된 핵심 개념 키워드",
            },
            guidingQuestion: {
              type: Type.STRING,
              description: "학생이 스스로 답을 완성하도록 돕는 유도 질문",
            },
            exemplarHint: {
              type: Type.STRING,
              description: "정답을 직접 주지 않고 생각의 방향을 열어주는 힌트 가이드",
            },
          },
          required: [
            "grade",
            "gradeLabel",
            "score",
            "isCorrect",
            "strengths",
            "improvements",
            "keyConceptsFound",
            "missingConcepts",
            "guidingQuestion",
            "exemplarHint",
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return parsed;
  } catch (error) {
    console.error("Gemini grading error:", error);
    // Fallback safe evaluation if API call fails
    return {
      grade: 3,
      gradeLabel: "3등급 (보통 - 시스템 대체 평가)",
      score: 3,
      isCorrect: false,
      strengths: "답안을 성실히 작성하였습니다.",
      improvements: "핵심 기관의 역할과 권한을 조금 더 구체적으로 기술해 보세요.",
      keyConceptsFound: ["지방자치", "주민"],
      missingConcepts: ["집행기관/의결기관 구분", "조례/예산"],
      guidingQuestion: "이 기관이 주민을 위해 행사하는 가장 대표적인 법적 권한은 무엇일까요?",
      exemplarHint: "기관의 성격(법을 만드는지, 행정을 집행하는지)을 중심으로 적어보세요.",
    };
  }
}

export async function generateStepHint(req: HintRequest) {
  const rubric = QUESTION_RUBRICS[req.questionNumber] || QUESTION_RUBRICS["1"];
  const regionContext = req.studentRegion
    ? `학생 조사 지역: ${req.studentRegion.sido} ${req.studentRegion.sigungu}`
    : "지역: 일반";

  const systemPrompt = `당신은 학생이 답안을 직접 베끼지 않고 '스스로 답을 찾아 작성하도록 돕는' 자기주도 학습 코치입니다.
학생의 단계(${req.hintLevel}단계)에 맞추어 적절한 수준의 힌트를 제공해야 합니다.

- 1단계: 핵심 개념 및 필수 키워드 힌트 (어떤 개념에 주목해야 하는지)
- 2단계: 문장 구조 및 뼈대 가이드 (어떤 틀로 문장을 쓰면 좋은지 빈칸/뼈대 제시)
- 3단계: 학생이 지금까지 쓴 내용을 바탕으로 한 맞춤형 유도 질문 및 확장 힌트

절대로 완성된 모범답안을 그대로 제시하지 마세요! 학생이 생각해서 채울 수 있는 물음표나 뼈대 형태로 안내하세요.`;

  const userPrompt = `[문항] ${req.questionNumber}번: ${req.questionTitle}
${regionContext}
[루브릭 정보]
${rubric}
[요청 단계] ${req.hintLevel}단계 힌트
[학생이 현재 작성한 글] "${req.currentAnswer || "(아직 작성하지 않음)"}"`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            step: { type: Type.INTEGER },
            stepTitle: { type: Type.STRING },
            content: { type: Type.STRING, description: "힌트 본문 설명" },
            scaffoldingQuestion: { type: Type.STRING, description: "스스로에게 해볼 질문" },
            keywordList: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "참고할 핵심 키워드 목록",
            },
            sentenceFrame: {
              type: Type.STRING,
              description: "문장 작성 뼈대 예시 (예: '~은/는 우리 지역의 [  ] 기관으로서, ~을/를 담당합니다.')",
            },
          },
          required: ["step", "stepTitle", "content", "scaffoldingQuestion", "keywordList", "sentenceFrame"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini hint error:", error);
    return {
      step: req.hintLevel,
      stepTitle: `${req.hintLevel}단계 힌트 안내`,
      content: "지방자치단체에서 법을 만드는 곳인지, 행정을 집행하는 곳인지 구별해 보세요.",
      scaffoldingQuestion: "이 기관이 주로 다루는 일은 무엇일까요?",
      keywordList: ["집행기관", "의결기관", "조례", "예산"],
      sentenceFrame: "우리 지역의 [기관 성격]으로서, [주요 업무]를 수행합니다.",
    };
  }
}
