// netlify/functions/diagnose.js
// ─────────────────────────────────────────────────────────────
// 그로스벤처스 AI 사업계획서 진단 — Claude API 스트리밍 프록시
//
// 왜 스트리밍인가:
//  일반 함수는 응답을 "다 받은 뒤" 반환 → 긴 진단(20~60초)이면
//  Netlify가 10초에서 연결을 끊어 504 Inactivity Timeout 발생.
//  스트리밍은 Claude가 생성하는 즉시 브라우저로 흘려보내므로
//  "데이터 없음" 상태가 생기지 않아 타임아웃을 회피한다.
//
// 필요 환경변수: ANTHROPIC_API_KEY
// 호출 경로: POST /.netlify/functions/diagnose
// ─────────────────────────────────────────────────────────────

export default async function handler(request) {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (request.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: CORS });
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST 요청만 허용됩니다.' }), {
      status: 405, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!API_KEY) {
    return new Response(JSON.stringify({
      error: 'ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다. Netlify 대시보드에서 설정하세요.',
    }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }

  let payload;
  try {
    payload = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: '요청 본문이 올바른 JSON이 아닙니다.' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const body = {
    model: payload.model || 'claude-sonnet-4-6',
    max_tokens: payload.max_tokens || 8000,
    messages: payload.messages || [],
    stream: true,
  };

  let upstream;
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Anthropic API 호출 실패: ' + String(e) }), {
      status: 502, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  if (!upstream.ok) {
    const errText = await upstream.text();
    return new Response(errText, {
      status: upstream.status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      ...CORS,
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}
