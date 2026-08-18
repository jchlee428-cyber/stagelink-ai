import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { Link } from 'react-router-dom';

const steps = [
  {
    icon: 'ri-user-add-line',
    title: '회원가입',
    desc: '이메일로 가입하고 공연자 또는 수요자 역할을 선택하세요. 가입은 무료입니다.',
  },
  {
    icon: 'ri-search-line',
    title: '공연자 찾기 / 등록',
    desc: '수요자는 공연자를 검색하고, 공연자는 프로필과 공연 영상을 등록하세요.',
  },
  {
    icon: 'ri-flashlight-line',
    title: 'AI 매칭 & 요청',
    desc: '장르·지역·예산을 입력하면 AI가 최적의 공연자를 추천해줍니다.',
  },
  {
    icon: 'ri-file-list-3-line',
    title: '견적 · 계약',
    desc: '견적을 주고받고, 수락하면 계약서까지 플랫폼에서 바로 확인할 수 있어요.',
  },
  {
    icon: 'ri-calendar-check-line',
    title: '일정 관리 & 공연',
    desc: '성사된 공연 일정을 한 곳에서 관리하고 공연을 진행하세요.',
  },
  {
    icon: 'ri-star-line',
    title: '후기 & 성장',
    desc: '공연 후 후기를 남기면 공연자의 평점과 성장 점수에 반영됩니다.',
  },
];

const performerGuide = [
  '프로필에 대표 사진과 공연 영상, 경력을 충실히 등록하면 매칭 확률이 높아져요.',
  '활동 지역과 출연료 범위를 정확히 설정하면 적합한 요청만 받을 수 있어요.',
  '받은 견적 요청에 빠르게 응답하면 수요자의 신뢰를 얻을 수 있어요.',
  '공연 완료 후 받은 후기는 성장 점수에 반영되어 더 좋은 기회로 이어져요.',
];

const clientGuide = [
  '공연 요청을 등록할 때 일시, 장소, 예산, 행사 목적을 구체적으로 적으면 좋아요.',
  'AI 추천 공연자의 프로필과 후기를 꼼꼼히 확인한 뒤 견적을 요청하세요.',
  '견적을 비교하고 마음에 드는 공연자를 선택하면 계약이 성사돼요.',
  '공연이 끝난 뒤에는 솔직한 후기를 남겨 다른 수요자에게 도움을 주세요.',
];

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-background-50 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 md:pt-28 pb-16">
        <div className="w-full px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <span className="inline-block px-4 py-1.5 rounded-full bg-accent-100 text-accent-800 text-xs font-medium mb-4">
                <i className="ri-book-open-line mr-1" />
                이용 가이드
              </span>
              <h1 className="text-2xl md:text-4xl font-bold font-heading text-foreground-950">
                StageLink AI 이용 방법
              </h1>
              <p className="text-sm md:text-base text-foreground-500 mt-3">
                여섯 단계로 공연 매칭의 모든 과정을 안내해드려요.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
              {steps.map((step, index) => (
                <div key={step.title} className="bg-background-50 border border-background-200 rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
                      <i className={`${step.icon} text-lg`} />
                    </div>
                    <span className="text-xs font-medium text-foreground-500">STEP {index + 1}</span>
                  </div>
                  <h3 className="font-heading font-semibold text-foreground-950 text-base mb-1.5">{step.title}</h3>
                  <p className="text-sm text-foreground-600 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="bg-background-50 border border-background-200 rounded-lg p-6 md:p-8">
                <div className="flex items-center gap-2 mb-5">
                  <i className="ri-mic-line text-primary-600 text-xl" />
                  <h2 className="font-heading font-semibold text-foreground-950 text-lg">공연자를 위한 팁</h2>
                </div>
                <ul className="space-y-4">
                  {performerGuide.map((tip) => (
                    <li key={tip} className="flex items-start gap-3">
                      <i className="ri-checkbox-circle-line text-primary-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-foreground-600 leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/performer/profile"
                  className="inline-flex items-center gap-1.5 mt-6 px-5 py-2.5 rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap"
                >
                  프로필 등록하기 <i className="ri-arrow-right-line" />
                </Link>
              </section>

              <section className="bg-background-50 border border-background-200 rounded-lg p-6 md:p-8">
                <div className="flex items-center gap-2 mb-5">
                  <i className="ri-calendar-event-line text-accent-600 text-xl" />
                  <h2 className="font-heading font-semibold text-foreground-950 text-lg">수요자를 위한 팁</h2>
                </div>
                <ul className="space-y-4">
                  {clientGuide.map((tip) => (
                    <li key={tip} className="flex items-start gap-3">
                      <i className="ri-checkbox-circle-line text-accent-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-foreground-600 leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/requests/new"
                  className="inline-flex items-center gap-1.5 mt-6 px-5 py-2.5 rounded-full bg-accent-500 text-background-50 text-sm font-medium hover:bg-accent-600 transition-colors whitespace-nowrap"
                >
                  공연 요청 등록하기 <i className="ri-arrow-right-line" />
                </Link>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}