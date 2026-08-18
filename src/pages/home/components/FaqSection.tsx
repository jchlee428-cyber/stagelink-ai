import { useState } from 'react';
import { Link } from 'react-router-dom';

const faqs = [
  {
    q: 'StageLink AI는 어떤 서비스인가요?',
    a: '실력 있는 공연자와 공연이 필요한 수요자를 AI로 연결해주는 온라인 공연 매칭 플랫폼입니다. 공연 요청부터 견적·계약·일정·후기까지 한 곳에서 처리할 수 있어요.',
  },
  {
    q: '공연자를 찾으려면 어떻게 해야 하나요?',
    a: '공연 요청을 등록하면 AI가 장르, 지역, 예산, 행사 목적에 맞는 공연자를 추천해줍니다. 또는 공연자 목록에서 직접 검색하고 견적을 요청할 수도 있어요.',
  },
  {
    q: '공연자 등록은 무료인가요?',
    a: '네, 공연자 등록과 프로필 작성은 무료입니다. 공연이 성사되어 수익이 발생할 때만 소정의 중개 수수료가 발생합니다.',
  },
  {
    q: '출연료와 계약은 어떻게 진행되나요?',
    a: '수요자가 견적을 요청하면 공연자가 출연료를 제안하고, 수요자가 수락하면 계약이 성사됩니다. 계약서 문서도 플랫폼에서 바로 확인할 수 있어요.',
  },
  {
    q: '어떤 장르의 공연자를 만날 수 있나요?',
    a: '가수, 밴드, 뮤지션, 마술사, 코미디언 등 다양한 장르의 공연자를 만날 수 있습니다. 트로트, 재즈, 어쿠스틱, 클래식부터 인디, 댄스까지 폭넓게 지원하고 있어요.',
  },
  {
    q: '공연 후 후기를 남길 수 있나요?',
    a: '네, 공연이 완료되면 수요자가 별점과 함께 후기를 남길 수 있어요. 후기는 공연자의 평점과 성장 점수에 반영되어 더 좋은 매칭에 도움이 됩니다.',
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  };

  return (
    <section className="py-16 md:py-24 bg-background-100 border-y border-background-200">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="w-full px-4 md:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 md:mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent-100 text-accent-800 text-xs font-medium mb-4">
              <i className="ri-question-line mr-1" />
              자주 묻는 질문
            </span>
            <h2 className="text-2xl md:text-4xl font-bold font-heading text-foreground-950">궁금한 점을 알려드릴게요</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={faq.q} className="bg-background-50 border border-background-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-background-100/60 transition-colors"
                  >
                    <span className="text-sm md:text-base font-medium text-foreground-900">{faq.q}</span>
                    <i
                      className={`ri-arrow-down-s-line text-foreground-500 text-lg transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-sm text-foreground-600 leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-foreground-500 mb-3">더 궁금한 점이 있으신가요?</p>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap"
            >
              지금 시작하기 <i className="ri-arrow-right-line" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}