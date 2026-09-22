# 수뭉이 일정함 · SMU Schedule Hub

상명대학교 서울캠퍼스의 학사일정, 통합공지, 학과 공지를 수뭉이 UI 안에서 모아보는 Node 기반 웹앱입니다.

## 핵심 기능

- 상명대학교 공식 학사일정 자동 수집
- 서울캠퍼스 통합공지 목록 수집 및 분류
- 서울캠퍼스 대학소개 페이지에서 학과 홈페이지를 자동 발견해 학과 공지 수집
- 전체 / 통합공지 / 학과공지 전환
- 학사, 일반, 사회봉사, 등록/장학, 학생생활, 글로벌, 진로취업, 비교과 필터
- 학과 선택, 제목/작성자/학과 검색, 최신순/오래된순 정렬
- 15개 단위 서버 페이징과 이전/다음/페이지 번호 UI
- 수집 실패 소스는 경고로 표시하고, 가짜 공지 데이터로 대체하지 않음
- 공식 원문 링크 제공

## 실행

```bash
npm install
npm start
```

기본 포트는 `4174`이며 Render에서는 `PORT` 환경변수를 사용합니다.

```text
http://localhost:4174
```

## API

### 학사일정

```text
GET /api/academic-schedules?campus=seoul&year=2026
```

강제 새로고침:

```text
GET /api/academic-schedules?campus=seoul&year=2026&refresh=true
```

### 공지 허브

```text
GET /api/notices?campus=seoul&page=1&pageSize=15
```

지원 파라미터:

- `source=all|integrated|department`
- `department=cs`처럼 학과 source key 지정
- `category=학사` 등 통합공지 분류
- `query=검색어`
- `sort=latest|oldest`
- `page=1`
- `pageSize=15` (서버에서 5~50 범위로 제한)
- `refresh=true`로 공식 페이지 강제 재수집

예시:

```text
GET /api/notices?campus=seoul&source=department&department=cs&query=졸업&page=1&pageSize=15
```

## 공지 수집 구조

백엔드 엔트리포인트는 `server/app-server.js`입니다.

공지 수집은 `server/notice-service.js`가 담당하며 다음 순서로 동작합니다.

1. 상명대학교 공식 통합공지 `https://www.smu.ac.kr/kor/life/notice.do` 수집
2. 서울캠퍼스 대학소개 `https://www.smu.ac.kr/kor/edu/seoul01.do`에서 학과 홈페이지 링크 자동 발견
3. 발견한 site key 기준으로 `/{siteKey}/community/notice.do` 형태의 공식 학과 공지 페이지 수집
4. `articleNo`, 제목, 작성일, 작성자, 분류, 출처를 정규화
5. 메모리 + 파일 캐시에 보관
6. 일부 학과 페이지 수집이 실패해도 다른 소스 결과는 유지하고 `warnings`에 실패 사유를 반환
7. 전체 수집 실패 시 마지막 캐시가 있으면 stale 캐시를 사용하고, 캐시도 없으면 빈 결과와 공식 링크만 반환

학과 자동 발견이 실패할 경우를 위해 `server/notice-sources.js`에 검증된 보조 소스도 유지합니다. 현재 보조 소스에는 컴퓨터과학전공, 영어교육과, 공간환경학부가 포함되어 있습니다. 정상 환경에서는 서울캠퍼스 대학소개 페이지의 링크를 우선 사용하므로 보조 목록에 없는 학과도 자동 발견 대상입니다.

## 환경변수

```bash
PORT=4174
CACHE_TTL_MS=43200000
NOTICE_CACHE_TTL_MS=1800000
NOTICE_SOURCE_LIMIT=45
NOTICE_SOURCE_CONCURRENCY=5
DATA_DIR=
SMU_SEOUL_CALENDAR_URL=https://www.smu.ac.kr/kor/life/academicCalendar.do?mode=list
SMU_CHEONAN_CALENDAR_URL=https://www.smu.ac.kr/kor/life/academicCalendar.do?mode=list
SMU_RENDER_JS=false
SMU_SCHEDULE_JSON_URLS=
```

- `NOTICE_CACHE_TTL_MS`: 공지 캐시 유효시간. 기본 30분
- `NOTICE_SOURCE_LIMIT`: 자동 발견 후 한 번에 확인할 최대 학과 소스 수
- `NOTICE_SOURCE_CONCURRENCY`: 학과 공지 동시 요청 수
- `DATA_DIR`: 캐시 파일 저장 위치. 미설정 시 `server/.cache`

## 파일 구조

```text
index.html
app.js
styles.css
notice-hub.js
notice-hub.css
server/
  app-server.js
  academic-schedule-service.js
  notice-service.js
  notice-sources.js
```

## 알려진 한계

- 상명대 공식 홈페이지의 HTML 구조나 학과 홈페이지 경로가 바뀌면 해당 소스 수집이 일시적으로 실패할 수 있습니다. 이 경우 API의 `warnings`와 `sourceSummaries`에서 상태를 확인할 수 있습니다.
- 자동 발견은 공식 서울캠퍼스 대학소개 페이지에 노출된 학과 링크를 기준으로 합니다. 대학소개 페이지에 링크가 없는 별도 사업단/연구소 공지는 학과공지 범위에 포함하지 않습니다.
- 각 학과의 최신 목록 페이지를 모으는 구조이므로 학과별 전체 과거 공지 아카이브를 한 번에 모두 내려받는 기능은 아직 제공하지 않습니다.
- 학사일정 API는 기존 호환성을 위해 마지막 캐시/백업 일정 fallback을 유지하지만, 공지 API는 가짜 샘플 공지로 대체하지 않습니다.

## 데이터 사용 원칙

공개된 상명대학교 공식 페이지의 목록 정보만 읽고, 로그인 세션이나 비공개 API를 우회하지 않습니다. 최종 신청 조건, 마감 시간, 첨부파일은 반드시 원문 공지를 확인해야 합니다.

## PWA 설치

Render 배포 주소 `https://smoongi-schedule-hub.onrender.com/`로 직접 접속하세요. 인스타그램 `l.instagram.com` 경유 페이지에서는 외부 브라우저에서 열어야 홈 화면에 추가할 수 있습니다.

- iPhone/iPad: Safari → 공유 → 홈 화면에 추가. 설치 후 독립 화면으로 실행됩니다.
- Android: Chrome → 앱 설치 또는 홈 화면에 추가. 설치 안내가 제공되면 화면의 설치 버튼으로도 진행할 수 있습니다.
- 학사일정/공지는 공식 사이트와 통신해야 하므로 오프라인에서는 실시간 조회 불가합니다. 서비스 워커는 화면/스타일/스크립트/아이콘만 저장하며 `/api/` 응답은 저장하지 않습니다.
