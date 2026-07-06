# Moayo Campus Prototype

상명대학교 대학생의 학과, 동아리, 팀플, 학생회 일정을 조율하는 데 특화한 정적 프로토타입입니다.

## 방향

Moayo Campus는 개인 일정 관리 앱이 아니라 그룹 일정 조율 앱입니다. 학사일정과 학과/동아리 일정을 기본 레이어로 표시하고, 참여자는 본인이 안 되는 시간만 입력합니다.

## 핵심 기능

- 상명대 학과/동아리/팀플 일정 조율 방 설정
- 상명대 학사일정 자동 수집 API 연동
- 학과/동아리/학생회 고정 일정 등록
- 참여자별 불가능 시간 입력
- 학사일정, 그룹 고정 일정, 참여자 불가능 시간을 피한 추천 시간 계산
- 가장 좋은 확정안을 `.ics` 캘린더 파일로 내보내기

## 학사일정 자동 수집

프론트는 `/api/academic-schedules?campus=seoul&year=2026`을 먼저 호출합니다. API 호출에 실패하면 샘플 데이터로 fallback합니다.

백엔드는 `server/academic-schedule-service.js`에 있습니다.

```bash
node server/academic-schedule-service.js
```

기본 전략은 아래 순서입니다.

1. 상명대 공식 학사일정 페이지 자동 수집
2. 서버 렌더링 HTML, 임베디드 JSON, 렌더링 텍스트 순서로 파싱
3. 필요하면 `SMU_RENDER_JS=true`로 Playwright 기반 JS 렌더링 수집 사용
4. 수집 결과를 파일 캐시와 메모리 캐시에 저장
5. 프론트는 우리 API만 호출
6. 공식 페이지 구조가 바뀌거나 수집 실패 시 마지막 캐시 또는 fallback 데이터 사용

환경변수:

```bash
PORT=4174
CACHE_TTL_MS=43200000
SMU_SEOUL_CALENDAR_URL=https://www.smu.ac.kr/cs/admission/calendar.do
SMU_RENDER_JS=false
SMU_SCHEDULE_JSON_URLS=
```

상명대 내부에서 공개 JSON 엔드포인트를 확인하면 `SMU_SCHEDULE_JSON_URLS`에 URL 템플릿을 넣으면 됩니다. `{year}`, `{campus}` 치환을 지원합니다.

에브리타임 데이터는 로그인 세션이나 앱 내부 API를 무단으로 긁는 방식 대신, 사용자가 직접 공유/복사/내보내기 가능한 텍스트나 CSV를 가져오는 보조 입력으로만 다루는 편이 안전합니다.

## 실행

브라우저에서 `index.html`을 바로 열거나 아래처럼 정적 서버로 실행합니다.

```bash
python3 -m http.server 4173
```

## 기존 Moayo에 붙일 때

- `room`: 기존 방 생성 데이터와 연결
- `academicEvents`: `/api/academic-schedules` 응답으로 대체
- `groupLayerEvents`: 학과/동아리 운영진이 등록한 고정 일정 테이블로 대체
- `blockedEvents`: 참여자가 입력한 불가능 시간 테이블로 대체
- `candidateWindows`: 기존 Moayo 날짜/시간 후보 범위로 대체
