# StageLink AI — AI 공연 매칭 플랫폼

## 1. 프로젝트 설명

StageLink AI는 실력 있는 무명·신인 공연자(가수, 밴드, 뮤지션, 마술사 등)와 공연 수요자(카페, 식당, 호텔, 기업, 지자체, 교회, 학교, 복지기관 등)를 AI로 연결하고, 공연 기획·견적·계약·일정·결제까지 한 번에 처리하는 온라인 공연 매칭 플랫폼입니다.

핵심 가치: "실력 있는 아티스트에게 무대를, 공연이 필요한 곳에 최고의 아티스트를, AI가 사람과 무대를 연결한다."

## 2. 페이지 구조

| 경로 | 설명 |
|------|------|
| `/` | 랜딩 페이지 (플랫폼 소개, AI 매칭 체험, 인기 공연자, 공연 요청 CTA) |
| `/performers` | 공연자 목록 (지역/장르/예산 필터, 검색) |
| `/performers/:id` | 공연자 상세 프로필 (영상, 음원, 경력, 평점, 리뷰) |
| `/requests` | 공연 요청 목록 |
| `/requests/:id` | 공연 요청 상세 |
| `/matching` | AI 공연 매칭 (요청 입력 → AI 추천 결과) |
| `/login` | 로그인 |
| `/register` | 회원가입 (공연자 / 수요자 선택) |
| `/dashboard/performer` | 공연자 마이페이지 (프로필, 일정, 지원 현황, 수익) |
| `/dashboard/client` | 수요자 마이페이지 (요청 관리, 계약, 일정) |
| `/schedule` | 일정 관리 (월간 캘린더) |
| `/quotes` | 견적·계약 관리 (견적 요청/응답/계약 문서) |
| `/admin` | 관리자 대시보드 |
| `/terms` | 서비스 이용약관 |
| `/privacy` | 개인정보처리방침 |

## 3. 핵심 기능

- [x] 회원가입 및 로그인 (공연자 / 수요자 역할 구분) — Supabase Auth + `users` 테이블(role) 연동 완료
- [x] 공연자 프로필 등록 및 관리 (사진, 영상, 음원, 장르, 활동지역, 출연료) — 프로필 등록/수정 폼 + Supabase `performer_profiles` 연동 완료
- [x] 공연 요청 등록 (날짜, 지역, 시간, 예산, 장르, 행사 목적 등) — 등록 폼 + Supabase `performance_requests` 연동 완료
- [x] 공연자 검색 및 필터링 (지역, 장르, 예산, 평점) — 목록/상세/매칭 페이지가 Supabase `performer_profiles` 실데이터 로드 + Mock 폴백 연동 완료
- [x] AI 공연 매칭 및 추천 (요청 분석 → 최적 공연자 추천 + 매칭 점수) — 매칭 페이지가 실데이터 기반 추천 로직으로 동작
- [x] 공연 지원 및 수락 흐름 — `applications` 테이블, 공연 요청 목록 지원 모달, 공연자 지원 현황·수요자 받은 지원(수락/거절) 관리 완료
- [x] 견적서 / 계약서 작성 지원 — `quotes` 테이블 생성(RLS 적용), 공연자 상세에서 견적 요청 모달, `/quotes` 페이지에서 역할별 견적 목록·공연자 견적서 응답·수요자 계약 수락·견적서/계약서 문서 뷰 완료
- [x] 일정 관리 (캘린더) — `schedules` 테이블 생성(RLS 적용), 월간 캘린더 + 일정 추가/수정/삭제 모달 + 다가오는 일정 목록, `/schedule` 페이지 완료
- [x] 후기 및 평점 시스템 — `reviews` 테이블 생성(RLS + 평점 자동 반영 트리거), 공연자 상세 후기 목록/별점 작성 폼 연동 완료
- [x] 공연자 성장 점수 (StageLink Artist Score) — 평점(60)·경력(20)·후기(20) 합산 점수, 도넛 차트 + 상세 내역 패널, 목록 카드 컴팩트 배지, `computeArtistScore` 유틸 + `ArtistScoreBadge` 컴포넌트 완료
- [x] 관리자 대시보드 (가입자, 거래액, 매칭 통계) — `/admin` 페이지, admin 역할 접근 제어, 총 가입자/거래액/공연 요청/매칭률 통계 카드 + 장르 분포 + 최근 가입자/계약 목록 완료
- [x] 공연 요청 상세 페이지 — `/requests/:id` 페이지(요청 상세 정보, 역할별 지원/수락·거절 처리), 목록 카드 → 상세 연결, 공연 의뢰 대상 배지(`performer_id` 활용) 완료
- [x] 수락 → 견적·계약 연계 — 공연 요청 상세에서 지원 수락 시 해당 공연자와 수요자를 연결한 견적 요청(`quotes`) 자동 생성 완료
- [x] 계약 성사 → 공연자 일정 자동 등록 — 견적이 `accepted`(계약 성사)로 확정되면 DB 트리거(`trg_create_schedule_on_quote_accepted`)가 공연자 `schedules`에 일정 자동 생성 완료
- [x] 공연자 상세 "받은 공연 요청" 섹션 — 공연자 프로필을 겨냥한 요청 목록(`performer_id` 기준) 표시 완료
- [x] 알림 시스템 — `notifications` 테이블 + 트리거(지원 도착/수락/거절 시 자동 알림), 대시보드 알림 패널(읽지 않음 배지·모두 읽음) 완료
- [x] 수익 현황 — 공연자 대시보드에서 계약 성사(`accepted`) 견적 출연료 합산(누적/이번 달/예정) 표시, 실시간 반영 완료
- [x] 후기·평점 관리 — 대시보드에서 역할별 받은 후기(공연자, 평균 평점 포함) / 쓴 후기(수요자) 목록 + 통계 카드 평점·완료 공연 실데이터 반영 완료
- [x] 일정 완료 → 수요자 후기 작성 자동 노출 — `schedules`에 `client_id`·`performer_profile_id`·`quote_id` 연결 컬럼 추가, 계약 성사 트리거가 연결 정보를 채우고 일정이 `completed`로 전환되면 수요자에게 알림(`type=review`) 전송 + 수요자 대시보드에 "후기 작성하기" 섹션(별점·내용 모달, 실시간 반영) 완료
- [x] 중개 수수료 결제 (Toss Payments) — 계약 성사 시 수요자가 출연료 10% 수수료를 원화 결제. `prepare-toss-payment`/`confirm-toss-payment` Edge Function + Toss SDK V2 주문서형 위젯(`/payment/checkout`), 결제 승인 후 견적 `accepted` 전환(일정 자동 생성 트리거 연계) 완료
- [x] 알림 이메일 발송 (Resend) — 알림 생성 시 DB 트리거(`trg_send_notification_email`)가 `pg_net`으로 `send-notification-email` Edge Function을 호출해 수신자 이메일로 자동 발송 + `email_sent` 반영. 발송 전 Supabase Dashboard에 `RESEND_API_KEY`·`RESEND_FROM_DOMAIN` 시크릿 설정 필요
- [x] 이용약관·개인정보처리방침 페이지 — `/terms`, `/privacy` 정적 페이지 + 푸터 링크 연결 완료
- [x] 관리자 대시보드 월별 추이 통계 — 월별 거래액·신규 가입자 6개월 추이 차트(`MonthlyTrendChart`) 추가 완료

## 4. 데이터 모델 설계

### Table: users
| 필드 | 타입 | 설명 |
|------|------|------|
| id | uuid | 기본키 |
| email | text | 이메일 |
| role | text | performer 또는 client |
| name | text | 이름/상호명 |
| phone | text | 연락처 |
| region | text | 주요 활동 지역 |
| created_at | timestamp | 가입일 |

### Table: performer_profiles
| 필드 | 타입 | 설명 |
|------|------|------|
| id | uuid | 기본키 |
| user_id | uuid | users.id 참조 |
| stage_name | text | 활동명 |
| genre | text[] | 음악 장르 |
| bio | text | 소개 |
| video_url | text | 대표 영상 |
| audio_url | text | 대표 음원 |
| fee | integer | 출연료 (만원 단위) |
| equipment | boolean | 장비 보유 여부 |
| regions | text[] | 활동 가능 지역 |
| experience_count | integer | 공연 경력 횟수 |
| rating | decimal | 평균 평점 |
| score | integer | AI 매칭 점수 |

### Table: performance_requests
| 필드 | 타입 | 설명 |
|------|------|------|
| id | uuid | 기본키 |
| client_id | uuid | users.id 참조 |
| title | text | 공연명/행사명 |
| event_type | text | 행사 종류 |
| date | date | 공연 날짜 |
| region | text | 공연 지역 |
| venue | text | 공연 장소 |
| budget | integer | 예산 (만원 단위) |
| duration | integer | 공연 시간 (분) |
| genre | text[] | 희망 장르 |
| audience_size | integer | 예상 관객 수 |
| description | text | 상세 설명 |
| status | text | open / matched / closed |

### Table: applications
| 필드 | 타입 | 설명 |
|------|------|------|
| id | uuid | 기본키 |
| request_id | uuid | performance_requests.id 참조 |
| performer_id | uuid | users.id 참조 |
| message | text | 지원 메시지 |
| proposed_fee | integer | 제안 출연료 |
| status | text | pending / accepted / rejected |

### Table: reviews
| 필드 | 타입 | 설명 |
|------|------|------|
| id | uuid | 기본키 |
| performer_id | uuid | performer_profiles.id 참조 |
| client_id | uuid | users.id 참조 |
| client_name | text | 작성자 이름 |
| rating | integer | 평점 (1~5) |
| comment | text | 후기 내용 |
| event_name | text | 행사명 |
| created_at | timestamp | 작성일 |

### Table: schedules
| 필드 | 타입 | 설명 |
|------|------|------|
| id | uuid | 기본키 |
| user_id | uuid | users.id 참조 (공연자) |
| client_id | uuid | users.id 참조 (수요자, 계약 성사 연계) |
| performer_profile_id | uuid | performer_profiles.id 참조 (후기 연계) |
| quote_id | uuid | quotes.id 참조 (원본 견적 연계) |
| title | text | 일정 제목 |
| event_date | date | 일정 날짜 |
| start_time | text | 시작 시간 |
| end_time | text | 종료 시간 |
| location | text | 장소 |
| event_type | text | 행사 종류 |
| description | text | 메모 |
| status | text | scheduled / completed / cancelled |
| created_at | timestamp | 작성일 |

### Table: quotes
| 필드 | 타입 | 설명 |
|------|------|------|
| id | uuid | 기본키 |
| client_id | uuid | users.id 참조 (수요자) |
| performer_id | text | performer_profiles.id 참조 (공연자 프로필) |
| performer_user_id | uuid | 공연자 계정 (users.id) |
| title | text | 행사명 |
| event_date | date | 공연 날짜 |
| region | text | 지역 |
| venue | text | 장소 |
| duration | integer | 공연 시간 (분) |
| budget | integer | 수요자 예산 (만원) |
| genre | text[] | 장르 |
| description | text | 요청 내용 |
| client_name | text | 수요자 이름 |
| performer_name | text | 공연자 이름 |
| status | text | requested / quoted / accepted / rejected |
| proposed_fee | integer | 공연자 제안 출연료 |
| quote_note | text | 공연자 견적 메모 |
| created_at | timestamp | 작성일 |
| updated_at | timestamp | 수정일 |
| fee_amount | integer | 중개 수수료 금액 (원) |
| payment_status | text | 결제 상태 (pending_payment / paid) |
| toss_order_id | text | 토스 주문 ID (checkout_session_id) |
| toss_payment_key | text | 토스 결제 키 |

## 5. 백엔드 / 서드파티 연동 계획

- **Supabase (Readdy Backend 또는 SaaS Supabase)**: 사용자 인증, 데이터베이스, Storage(영상/음원/이미지), Edge Functions(AI 매칭 로직)
- **결제 시스템**: Toss Payments 연동 완료 (계약 성사 시 수요자 중개 수수료 10% 결제), 프리미엄 구독은 추후
- **AI 매칭**: 초기에는 프론트엔드 시뮬레이션 → 추후 Edge Functions + 외부 AI API 연동

## 6. 개발 단계 계획

### Phase 1: 랜딩 페이지 + 공연자 발견 (UI 시각화)
- **목표**: 플랫폼의 첫인성과 핵심 가치를 보여주는 랜딩 페이지, 공연자 목록 및 검색 UI 구축
- **산출물**: 
  - 홈페이지 (히어로, AI 매칭 체험 섹션, 인기 공연자, 공연 요청 CTA, 수요자/공연자 안내)
  - 공연자 목록 페이지 (필터, 검색, 카드 그리드)
  - 공연자 상세 프로필 페이지
  - Mock 데이터 기반 동작

### Phase 2: 회원 인증 및 역할 시스템
- **목표**: 공연자/수요자 회원가입 및 로그인, 역할 기반 접근 제어
- **산출물**: 로그인 페이지, 회원가입 페이지(역할 선택), 대시보드 기초 구조

### Phase 3: 프로필 및 공연 요청 CRUD
- **목표**: 실제 데이터 등록/조회/수정 기능
- **산출물**: 공연자 프로필 등록/수정, 공연 요청 등록/관리, Supabase 연동
- **상태**: ✅ 완료 — `performer_profiles`, `performance_requests` 테이블 생성(RLS 적용), 프로필 등록/수정 폼(`/performer/profile`), 공연 요청 등록 Supabase 저장, 요청 목록 실데이터 로드

### Phase 4: AI 매칭 및 지원 흐름
- **목표**: 공연 요청 → AI 추천 → 지원 → 수락 흐름 구현
- **산출물**: AI 매칭 페이지, 지원/수락 기능, 매칭 점수 표시
- **상태**: ✅ 완료 — `applications` 테이블 생성(RLS 적용), 공연 요청 목록 지원 모달, 공연자 지원 현황·수요자 받은 지원(수락/거절) 관리, AI 매칭·공연자 목록·상세 페이지를 Supabase `performer_profiles` 실데이터 로드 + Mock 폴백으로 연결

### Phase 5: 관리자 및 부가 기능
- **목표**: 관리자 대시보드, 후기, 일정 관리, 성장 점수, 견적·계약
- **산출물**: 관리자 페이지, 후기 시스템, 캘린더 UI, 견적·계약 관리
- **상태**: ✅ 완료 — 후기·평점, 일정 관리(캘린더), 성장 점수, 견적·계약, 관리자 대시보드 모두 완료

### Phase 6: 결제 및 수익화
- **목표**: 중개 수수료 결제, 프리미엄 구독 모델
- **산출물**: 결제 연동, 구독 플랜 페이지
- **상태**: 🔄 진행 중 — 중개 수수료 결제(Toss Payments, 출연료 10%) 완료, 프리미엄 구독 모델은 추후