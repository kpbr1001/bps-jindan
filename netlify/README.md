# 그로스벤처스 AI 사업계획서 진단 (Beconic)

지원공고와 사업계획서를 비교해 **적합성·감점 리스크·보완 방향**을 진단하는 단일 페이지 웹앱.

## 주요 기능 (v2.1)
- **공고별 동적 배점** — 공고 배점표를 그대로 추출해 채점 (20/25/30/25 등 가변)
- **스마트 발췌** — 긴 공고문에서 붙임 배점표·성과지표 구간을 우선 포착
- **모드 분기** — 공고 있으면 적합성 진단, 없으면 계획서 품질 진단
- **근거 자기검증** — AI가 제시한 근거를 원문과 대조, 미검증 항목은 "확인 필요" 강등
- **에러 표시** — API 실패 시 원인(상태코드)을 화면에 노출

## 구조
```
├── index.html              # 진단툴 (프론트 전체)
├── netlify.toml            # Netlify 배포 설정
├── netlify/functions/
│   └── diagnose.js         # Claude API 프록시 (키는 서버에만 보관)
└── og_banner.png           # 공유 카드 이미지
```

## 배포 (Netlify + GitHub)
1. 이 레포를 Netlify에 Import (Add new site → Import from Git)
2. Build 설정: Build command 비움 / Publish `.` / Functions `netlify/functions`
3. 환경변수 `ANTHROPIC_API_KEY` 설정 → 자동 재배포
4. 이후 이 레포에 push하면 자동 배포

## 컴플라이언스
- 단정 표현 금지, "자가진단 참고점수" 라벨, 면책 고지
- 중소기업상담회사 제2025-684호 · 070-4103-4177

© 그로스벤처스(주) · Beconic
