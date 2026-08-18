export interface PerformanceRequest {
  id: string;
  title: string;
  eventType: string;
  date: string;
  region: string;
  venue: string;
  budget: number;
  duration: number;
  genres: string[];
  audienceSize: number;
  description: string;
  status: 'open' | 'matched' | 'closed';
  clientName: string;
}

export const performanceRequests: PerformanceRequest[] = [
  {
    id: '1',
    title: '기업 송년회 공연 (80명 규모)',
    eventType: '기업행사',
    date: '2026-12-20',
    region: '서울 강남',
    venue: '강남구 소재 연회장',
    budget: 100,
    duration: 120,
    genres: ['재즈', '보컬'],
    audienceSize: 80,
    description: '40~50대 직원들이 참석하는 송년회입니다. 분위기를 띄울 수 있는 재즈·보컬 공연이 필요합니다.',
    status: 'open',
    clientName: 'S기업 인사팀',
  },
  {
    id: '2',
    title: '카페 정기 공연 (월 2회)',
    eventType: '카페/식당',
    date: '2026-09-15',
    region: '경기 성남',
    venue: '판교 테크노밸리 카페',
    budget: 30,
    duration: 90,
    genres: ['어쿠스틱', '인디'],
    audienceSize: 30,
    description: '판교 테크노밸리 내 카페에서 매주 토요일 저녁 정기 공연을 진행합니다. 어쿠스틱 솔로 또는 듀오를 찾습니다.',
    status: 'open',
    clientName: '카페 모닝브리즈',
  },
  {
    id: '3',
    title: '지역축제 메인 무대 (5,000명)',
    eventType: '축제',
    date: '2026-10-03',
    region: '전남 여수',
    venue: '여수 엑스포장 야외무대',
    budget: 200,
    duration: 60,
    genres: ['국악', '퓨전'],
    audienceSize: 5000,
    description: '2026 여수 가을밤 문화축제 메인 무대 공연자를 모집합니다. 국악 또는 퓨전 장르로 가족 관객층을 사로잡을 수 있는 퍼포먼스를 기대합니다.',
    status: 'open',
    clientName: '여수시 문화관광과',
  },
  {
    id: '4',
    title: '웨딩 식전 연주',
    eventType: '웨딩',
    date: '2026-11-08',
    region: '서울 광진',
    venue: '광진구 웨딩홀',
    budget: 60,
    duration: 30,
    genres: ['클래식', '바이올린'],
    audienceSize: 150,
    description: '웨딩 식전 30분간 바이올린 솔로 또는 피아노·바이올린 듀오 연주가 필요합니다. 클래식 대표곡 위주로 부탁드립니다.',
    status: 'matched',
    clientName: '신랑신부 (개인)',
  },
  {
    id: '5',
    title: '교회 찬양 인도 (주일 예배)',
    eventType: '교회/성전',
    date: '2026-09-21',
    region: '경기 수원',
    venue: '수원시 영통구 교회',
    budget: 25,
    duration: 45,
    genres: ['찬양', 'CCM'],
    audienceSize: 200,
    description: '주일 2부 예배 찬양 인도팀이 필요합니다. 키보드·기타·보컬 구성의 3인 팀을 우대합니다.',
    status: 'open',
    clientName: '수원중앙교회',
  },
  {
    id: '6',
    title: '호텔 라운지 공연 (토~일)',
    eventType: '호텔/라운지',
    date: '2026-09-13',
    region: '서울 중구',
    venue: '명동 5성급 호텔 로비 라운지',
    budget: 150,
    duration: 180,
    genres: ['재즈', '피아노'],
    audienceSize: 50,
    description: '주말 저녁 6시~9시 호텔 로비 라운지에서 재즈 피아노 또는 보컬 공연이 필요합니다. 고객 응대 경험이 있는 분을 선호합니다.',
    status: 'open',
    clientName: '호텔 프라임 서울',
  },
];