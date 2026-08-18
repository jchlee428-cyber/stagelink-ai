import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { Link } from 'react-router-dom';

const tiers = [
  {
    name: '무료 이용',
    price: '0원',
    unit: '가입 · 검색 · 등록',
    highlight: false,
    features: [
      '회원가입 및 프로필 작성',
      '공연자 검색 및 목록 확인',
      '공연 요청 등록',
      'AI 매칭 추천 확인',
      '후기 및 평점 열람',
    ],
    cta: '무료로 시작하기',
    to: '/register',
  },
  {
    name: '성사 수수료',
    price: '계약 성사 시',
    unit: '출연료의 일정 비율',
    highlight: true,
    features: [
      '견적 요청 및 응답',
      '계약서 작성·관리',
      '일정 관리 기능',
      '안전한 결제 연동',
      '고객센터 우선 지원',
    ],
    cta: '공연 요청하기',
    to: '/requests/new',
  },
];

const faqNotes = [
  {
    q: '수수료는 언제 발생하나요?',
    a: '계약이 성사되어 실제 결제가 이루어질 때만 중개 수수료가 발생합니다. 검색, 요청 등록, 견적 확인까지는 모두 무료예요.',
  },
  {
    q: '수수료율은 어디서 확인하나요?',
    a: '견적 및 계약 단계에서 정확한 수수료 금액이 안내됩니다. 결제 전에 반드시 확인할 수 있어요.',
  },
  {
    q: '결제는 어떤 방식으로 가능한가요?',
    a: '토스페이먼츠 등 제휴 결제 대행사를 통해 안전하게 처리됩니다.',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background-50 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 md:pt-28 pb-16">
        <div className="w-full px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <span className="inline-block px-4 py-1.5 rounded-full bg-accent-100 text-accent-800 text-xs font-medium mb-4">
                <i className="ri-price-tag-3-line mr-1" />
                요금 안내
              </span>
              <h1 className="text-2xl md:text-4xl font-bold font-heading text-foreground-950">
                필요한 만큼만, 투명하게
              </h1>
              <p className="text-sm md:text-base text-foreground-500 mt-3">
                가입부터 매칭까지 무료로 이용하고, 계약이 성사될 때만 합리적인 수수료가 발생해요.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-3xl mx-auto">
              {tiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`rounded-lg border p-6 md:p-8 ${
                    tier.highlight
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-background-200 bg-background-50'
                  }`}
                >
                  <h2 className="font-heading font-semibold text-foreground-950 text-base mb-1">{tier.name}</h2>
                  <div className="flex items-baseline gap-2 mt-3 mb-1">
                    <span className="text-3xl md:text-4xl font-bold font-heading text-foreground-950">{tier.price}</span>
                  </div>
                  <p className="text-xs text-foreground-500 mb-5">{tier.unit}</p>
                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <i
                          className={`ri-check-line mt-0.5 shrink-0 ${
                            tier.highlight ? 'text-primary-600' : 'text-foreground-500'
                          }`}
                        />
                        <span className="text-sm text-foreground-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={tier.to}
                    className={`inline-flex w-full items-center justify-center gap-1.5 px-5 py-3 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                      tier.highlight
                        ? 'bg-primary-500 text-background-50 hover:bg-primary-600'
                        : 'bg-background-100 text-foreground-700 hover:bg-background-200'
                    }`}
                  >
                    {tier.cta} <i className="ri-arrow-right-line" />
                  </Link>
                </div>
              ))}
            </div>

            <div className="max-w-3xl mx-auto">
              <h2 className="font-heading font-semibold text-foreground-950 text-lg text-center mb-5">
                요금 관련 자주 묻는 질문
              </h2>
              <div className="space-y-3">
                {faqNotes.map((note) => (
                  <div key={note.q} className="bg-background-50 border border-background-200 rounded-lg p-5">
                    <h3 className="font-medium text-foreground-900 text-sm mb-2">{note.q}</h3>
                    <p className="text-sm text-foreground-600 leading-relaxed">{note.a}</p>
                  </div>
                ))}
              </div>
              <div className="text-center mt-6">
                <Link
                  to="/faq"
                  className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  더 많은 질문 보기 <i className="ri-arrow-right-line" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}