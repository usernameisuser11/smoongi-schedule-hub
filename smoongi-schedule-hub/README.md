# 수뭉이 일정함

상명대학교 학생들이 놓치기 쉬운 학사일정, HUSS, K-MOOC, 바이오헬스, 비교과 신청 일정과 FAQ를 한 곳에 모아 보여주는 웹서비스입니다.

기존 프리에 일정 조율 앱 코드를 갈아엎고, Render 배포와 Neon DB 인프라를 재사용하는 방향으로 바꿨습니다.

## 핵심 기능

- 일정 모아보기
- D-Day 표시
- 카테고리 필터
- FAQ 검색
- Gemini API 기반 자유 질문 답변
- 실제 수뭉이 이미지를 활용한 귀여운 UI
- 출처, 마지막 확인일, 확인 필요 여부 표시
- Neon DB 자동 테이블 생성 및 시드 데이터 삽입

## 실행

```bash
npm install
npm start
```

로컬 주소:

```text
http://localhost:4174
```

## Render 배포

Build Command:

```bash
npm install
```

Start Command:

```bash
npm start
```

## 기존 프리에 Neon DB 재사용

기존 프리에에서 쓰던 Neon DB를 그대로 가져오면 됩니다.

Render 환경변수 `DATABASE_URL`에 기존 Neon connection string을 넣으면 서버가 시작될 때 새 서비스용 테이블만 추가로 생성합니다. 기존 프리에 테이블은 삭제하거나 수정하지 않습니다.

자동 생성되는 새 테이블:

- `info_items`
- `faqs`
- `question_logs`

## 환경변수

```bash
PORT=4174
DATABASE_URL=postgresql://...
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-1.5-flash
ADMIN_KEY=원하는_관리자키
```

`DATABASE_URL`이 없으면 메모리 시드 데이터로 실행됩니다.

## API

```http
GET /api/items
GET /api/faqs
POST /api/ask
POST /api/admin/items
POST /api/admin/faqs
```

관리자 API는 `ADMIN_KEY`가 설정되어 있으면 요청 헤더에 아래 값을 넣어야 합니다.

```http
x-admin-key: 설정한_ADMIN_KEY
```

## 운영 원칙

- 학생은 무료로 사용
- 공식 공지 기반으로 일정 등록
- AI 답변은 등록된 자료를 바탕으로만 안내
- 세부 시간, 대상, 변경사항은 공식 공지 확인 문구를 항상 표시
- 수익화는 홍보 배너, 상단 노출, 카드뉴스 제작 대행 중심으로 시작
