// netlify/functions/diagnose.js
// ─────────────────────────────────────────────────────────────
// 그로스벤처스 AI 사업계획서 진단 — Claude API 프록시
//
// 역할:
//  1) 브라우저 → 이 함수 → api.anthropic.com 으로 중계 (CORS 해결)
//  2) API 키를 서버(환경변수)에만 보관 → 브라우저에 노출되지 않음
//
// 필요 환경변수 (Netlify 대시보드에서 설정):
//  - ANTHROPIC_API_KEY : Anthropic 콘솔에서 발급한 API 키
//
// 호출 경로: POST /.netlify/functions/diagnose
// ─────────────────────────────────────────────────────────────

exports.handler = async function (event) {
  // CORS 프리플라이트 대응
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS,
      body: JSON.stringify({ error: 'POST 요청만 허용됩니다.' }),
    };
  }

  const API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!API_KEY) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({
        error: 'ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다. Netlify 대시보드에서 설정하세요.',
      }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: '요청 본문이 올바른 JSON이 아닙니다.' }),
    };
  }

  // 브라우저가 보낸 messages/model/max_tokens 를 그대로 Anthropic으로 전달
  const body = {
    model: payload.model || 'claude-sonnet-4-6',
    max_tokens: payload.max_tokens || 4000,
    messages: payload.messages || [],
  };

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await res.text(); // 그대로 패스스루
    return {
      statusCode: res.status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: data,
    };
  } catch (e) {
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ error: 'Anthropic API 호출 실패: ' + String(e) }),
    };
  }
};
