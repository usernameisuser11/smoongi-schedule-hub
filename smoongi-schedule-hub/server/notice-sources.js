const OFFICIAL_NOTICE_URL = "https://www.smu.ac.kr/kor/life/notice.do?mode=list&srCampus=smu";
const SEOUL_DIRECTORY_URL = "https://www.smu.ac.kr/kor/edu/seoul01.do";

const NOTICE_CATEGORIES = [
  "학사",
  "일반",
  "사회봉사",
  "등록/장학",
  "학생생활",
  "글로벌",
  "진로취업",
  "비교과",
];

// 공식 서울캠퍼스 대학소개 페이지에서 학과 링크를 자동 발견하는 것이 기본 전략이다.
// 아래 목록은 페이지 구조 변경/링크 누락 시에도 최소한의 학과 공지를 제공하기 위한 검증된 보조 소스다.
const VERIFIED_DEPARTMENT_SOURCES = [
  {
    key: "cs",
    name: "컴퓨터과학전공",
    url: "https://www.smu.ac.kr/cs/community/notice.do",
  },
  {
    key: "engedu",
    name: "영어교육과",
    url: "https://www.smu.ac.kr/engedu/community/notice.do",
  },
  {
    key: "space",
    name: "공간환경학부",
    url: "https://www.smu.ac.kr/space/community/notice.do",
  },
];

const NON_DEPARTMENT_SITE_KEYS = new Set([
  "kor",
  "admission",
  "grad",
  "oia",
  "icee",
  "dormitory",
  "museum",
  "library",
  "fund",
  "portal",
  "sugang",
  "smarts",
  "peerorum",
]);

module.exports = {
  OFFICIAL_NOTICE_URL,
  SEOUL_DIRECTORY_URL,
  NOTICE_CATEGORIES,
  VERIFIED_DEPARTMENT_SOURCES,
  NON_DEPARTMENT_SITE_KEYS,
};
