import { gradeStudentAnswer, generateStepHint, GradeRequest, HintRequest } from './geminiService.ts';

function sendJson(res: any, statusCode: number, data: any) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.end(JSON.stringify(data));
}

export async function handleGrade(req: any, res: any) {
  try {
    const body = (req.body || {}) as GradeRequest;
    if (!body || !body.studentAnswer) {
      return sendJson(res, 400, { error: '답안 내용이 누락되었습니다.' });
    }
    const result = await gradeStudentAnswer(body);
    return sendJson(res, 200, result);
  } catch (err: any) {
    console.error('Grade handler error:', err);
    return sendJson(res, 500, { error: err.message || '채점 처리 중 오류가 발생했습니다.' });
  }
}

export async function handleHint(req: any, res: any) {
  try {
    const body = (req.body || {}) as HintRequest;
    if (!body || !body.questionNumber) {
      return sendJson(res, 400, { error: '문항 정보가 누락되었습니다.' });
    }
    const result = await generateStepHint(body);
    return sendJson(res, 200, result);
  } catch (err: any) {
    console.error('Hint handler error:', err);
    return sendJson(res, 500, { error: err.message || '힌트 생성 중 오류가 발생했습니다.' });
  }
}

export async function handleAppsScriptSubmit(req: any, res: any) {
  try {
    const { webAppUrl, record } = req.body || {};
    if (!webAppUrl || !webAppUrl.startsWith('https://script.google.com')) {
      return sendJson(res, 400, { error: '올바른 Google Apps Script 웹 앱 URL이 필요합니다.' });
    }

    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record),
      redirect: 'follow',
    });

    const responseText = await response.text();
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
        // Returned Google authorization or permission page
        return sendJson(res, 200, {
          result: 'html_response',
          message: 'Google Apps Script가 웹페이지를 반환했습니다. 브라우저 직접 전송 모드로 진행합니다.',
        });
      }
      parsed = { result: 'success', raw: responseText };
    }

    return sendJson(res, 200, parsed);
  } catch (err: any) {
    console.error('Apps Script proxy error:', err);
    return sendJson(res, 500, { error: err.message || 'Apps Script 전송 실패' });
  }
}

export async function handleAppsScriptFetch(req: any, res: any) {
  try {
    const { webAppUrl } = req.body || {};
    if (!webAppUrl || !webAppUrl.startsWith('https://script.google.com')) {
      return sendJson(res, 400, { error: '올바른 Google Apps Script 웹 앱 URL이 필요합니다.' });
    }

    const response = await fetch(webAppUrl, {
      method: 'GET',
      redirect: 'follow',
    });

    const responseText = await response.text();
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = { result: 'error', raw: responseText };
    }

    return sendJson(res, 200, parsed);
  } catch (err: any) {
    console.error('Apps Script fetch proxy error:', err);
    return sendJson(res, 500, { error: err.message || 'Apps Script 데이터 조회 실패' });
  }
}
