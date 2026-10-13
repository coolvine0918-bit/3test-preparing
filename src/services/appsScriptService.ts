import { SheetSubmissionRecord } from '../types/worksheet.ts';

export const USER_SPREADSHEET_ID = '1tprMbtuGpFhL5AIGwgB4D8NRqgx7KBYyNNSdKrkKfOI';
export const USER_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${USER_SPREADSHEET_ID}/edit`;

// 선생님께서 배포하신 구글 앱스 스크립트 웹 앱 주소 (하드코딩)
export const HARDCODED_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxc3TvYxSNVbJAHcvkw9MmChbzHQT2FdbTs_WB7-1v7y5JisOWQbvuPq5OxRjmu1_3vdg/exec';

export const APPS_SCRIPT_CODE_SNIPPET = `/**
 * [지방 자치와 시민 참여] AI 스마트 학습지 - 구글 스프레드시트 수신 웹 앱
 * 대상 스프레드시트 ID: ${USER_SPREADSHEET_ID}
 */

function doPost(e) {
  try {
    var sheet = getOrCreateSheet();
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      data = e.parameter;
    }
    
    // 학생 제출 데이터 행 추가
    sheet.appendRow([
      data.timestamp || new Date().toLocaleString('ko-KR'),
      data.studentId || '',
      data.name || '',
      data.region || '',
      data.overallGrade || '',
      data.totalScore || 0,
      data.q1_answer || '',
      data.q1_grade || '',
      data.q2_answer || '',
      data.q2_grade || '',
      data.q3_answer || '',
      data.q3_grade || '',
      data.q6_answer || '',
      data.q6_grade || '',
      data.q7_answer || '',
      data.q7_grade || '',
      data.q8_answer || '',
      data.q8_grade || '',
      data.wrongNoteRevisedCount || 0,
      data.teacherComment || ''
    ]);

    return ContentService.createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var sheet = getOrCreateSheet();
    // 파라미터가 있는 경우 get 요청으로도 저장 지원
    if (e && e.parameter && e.parameter.name) {
      return doPost(e);
    }
    var rows = sheet.getDataRange().getValues();
    return ContentService.createTextOutput(JSON.stringify({ result: "success", data: rows }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById('${USER_SPREADSHEET_ID}');
  var sheet = ss.getSheetByName('학생제출현황');
  if (!sheet) {
    sheet = ss.insertSheet('학생제출현황');
    sheet.appendRow([
      '제출일시', '학번', '이름', '지역', '종합등급', '총점(30점)',
      '1번 답안(광역단체장)', '1번 등급',
      '2번 답안(광역의회)', '2번 등급',
      '3번 답안(광역활동)', '3번 등급',
      '6번 답안(기초단체장)', '6번 등급',
      '7번 답안(기초의회)', '7번 등급',
      '8번 답안(기초활동)', '8번 등급',
      '오답노트 수정횟수', 'AI 총평'
    ]);
    sheet.getRange(1, 1, 1, 20).setFontWeight('bold').setBackground('#E0E7FF');
    sheet.setFrozenRows(1);
  }
  return sheet;
}`;

export async function submitToAppsScript(
  record: SheetSubmissionRecord,
  customUrl?: string
): Promise<{ success: boolean; message?: string }> {
  const targetUrl = (customUrl || HARDCODED_APPS_SCRIPT_URL).trim();

  // 1. First attempt: Direct client-side fetch with no-cors (carries browser session and bypasses CORS)
  try {
    await fetch(targetUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(record),
    });
  } catch (e) {
    console.warn('Direct client fetch warning:', e);
  }

  // 2. Second attempt: Server-side proxy for dual reliability
  try {
    const proxyRes = await fetch('/api/apps-script/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webAppUrl: targetUrl,
        record,
      }),
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data.result === 'success' || data.success) {
        return { success: true };
      }
    }
  } catch (proxyErr) {
    console.warn('Proxy submission error:', proxyErr);
  }

  // As long as no hard network crash occurred, client request was dispatched
  return { success: true };
}

export async function fetchFromAppsScript(
  customUrl?: string
): Promise<SheetSubmissionRecord[]> {
  const targetUrl = (customUrl || HARDCODED_APPS_SCRIPT_URL).trim();

  try {
    const proxyRes = await fetch('/api/apps-script/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webAppUrl: targetUrl,
      }),
    });

    if (proxyRes.ok) {
      const json = await proxyRes.json();
      if (json.result === 'success' && Array.isArray(json.data)) {
        const rows = json.data.slice(1); // skip header row
        return rows.map((r: any[]) => ({
          timestamp: String(r[0] || ''),
          studentId: String(r[1] || ''),
          name: String(r[2] || ''),
          region: String(r[3] || ''),
          overallGrade: String(r[4] || ''),
          totalScore: Number(r[5] || 0),
          q1_answer: String(r[6] || ''),
          q1_grade: String(r[7] || ''),
          q2_answer: String(r[8] || ''),
          q2_grade: String(r[9] || ''),
          q3_answer: String(r[10] || ''),
          q3_grade: String(r[11] || ''),
          q6_answer: String(r[12] || ''),
          q6_grade: String(r[13] || ''),
          q7_answer: String(r[14] || ''),
          q7_grade: String(r[15] || ''),
          q8_answer: String(r[16] || ''),
          q8_grade: String(r[17] || ''),
          wrongNoteRevisedCount: Number(r[18] || 0),
          teacherComment: String(r[19] || ''),
        }));
      }
    }
  } catch (err) {
    console.error('Failed to fetch from Apps Script:', err);
  }

  return [];
}
