import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';

type Category = '전체' | '서비스 이용' | '공연자' | '공연 요청' | '결제·수수료' | '계정';

type FaqItem = {
  category: Exclude<Category, '전체'>;
  q: string;
  a: string;
  link?: { label: string; to: string };
};

const faqs: FaqItem[] = [
  {
    category: '서비스 이용',
    q: 'StageLink AI는 어떤 서비스인가요?',
    a: '실력 있는 공연자와 공연이 필요한 수요자를 AI로 연결해주는 온라인 공연 매칭 플랫폼입니다. 공연 요청부터 견적·계약·일정·후기까지 한 곳에서 처리할 수 있어요.',
  },
  {
    category: '서비스 이용',
    q: '수수료 없이 둘러볼 수 있나요?',
    a: '네, 공연자 목록 확인과 검색은 누구나 무료로 이용할 수 있어요. 견적 요청과 공연 요청 등록도 무료이며, 실제로 계약이 성사될 때만 중개 수수료가 발생합니다.',
  },
  {
    category: '서비스 이용',
    q: 'AI 매칭은 어떻게 동작하나요?',
    a: '공연 요청 시 입력한 장르, 지역, 예산, 행사 목적 정보를 기반으로 AI가 가장 적합한 공연자를 분석해 추천합니다. 공연자의 경력, 평점, 성장 점수까지 종합적으로 반영해요.',
    link: { label: 'AI 매칭 바로가기', to: '/matching' },
  },
  {
    category: '공연자',
    q: '공연자 등록은 무료인가요?',
    a: '네, 공연자 등록과 프로필 작성은 무료입니다. 공연이 성사되어 수익이 발생할 때만 소정의 중개 수수료가 발생해요.',
    link: { label: '프로필 등록하기', to: '/performer/profile' },
  },
  {
    category: '공연자',
    q: '어떤 장르의 공연자를 만날 수 있나요?',
    a: '가수, 밴드, 뮤지션, 마술사, 코미디언 등 다양한 장르의 공연자를 만날 수 있습니다. 트로트, 재즈, 어쿠스틱, 클래식부터 인디, 댄스까지 폭넓게 지원하고 있어요.',
    link: { label: '공연자 둘러보기', to: '/performers' },
  },
  {
    category: '공연자',
    q: '프로필에는 어떤 정보를 등록하나요?',
    a: '대표 사진, 공연 영상, 활동 경력, 주요 레퍼토리, 활동 지역, 출연료 범위 등을 등록할 수 있어요. 정보가 충실할수록 AI 추천과 매칭 성사율이 높아집니다.',
  },
  {
    category: '공연자',
    q: '성장 점수는 무엇인가요?',
    a: '공연을 완료하고 받은 후기와 평점, 활동 이력이 반영되어 산출되는 점수예요. 점수가 높을수록 더 좋은 공연 기회를 추천받을 수 있습니다.',
  },
  {
    category: '공연 요청',
    q: '공연자를 찾으려면 어떻게 해야 하나요?',
    a: '공연 요청을 등록하면 AI가 장르, 지역, 예산, 행사 목적에 맞는 공연자를 추천해줍니다. 또는 공연자 목록에서 직접 검색하고 견적을 요청할 수도 있어요.',
    link: { label: '공연 요청 등록하기', to: '/requests/new' },
  },
  {
    category: '공연 요청',
    q: '출연료와 계약은 어떻게 진행되나요?',
    a: '수요자가 견적을 요청하면 공연자가 출연료를 제안하고, 수요자가 수락하면 계약이 성사됩니다. 계약서 문서도 플랫폼에서 바로 확인할 수 있어요.',
    link: { label: '견적 관리하기', to: '/quotes' },
  },
  {
    category: '공연 요청',
    q: '공연 후 후기를 남길 수 있나요?',
    a: '네, 공연이 완료되면 수요자가 별점과 함께 후기를 남길 수 있어요. 후기는 공연자의 평점과 성장 점수에 반영되어 더 좋은 매칭에 도움이 됩니다.',
  },
  {
    category: '결제·수수료',
    q: '중개 수수료는 얼마인가요?',
    a: '수수료율은 계약 성사 시 출연료의 일정 비율로 책정되며, 구체적인 비율은 견적 및 계약 단계에서 확인할 수 있어요. 결제 전에 금액이 명확히 안내됩니다.',
  },
  {
    category: '결제·수수료',
    q: '결제는 어떤 방식으로 하나요?',
    a: '토스페이먼츠 등 제휴된 결제 대행사를 통해 안전하게 처리돼요. 결제 완료 후에는 계약 및 일정 정보가 자동으로 연동됩니다.',
  },
  {
    category: '결제·수수료',
    q: '결제를 취소하거나 환불받을 수 있나요?',
    a: '공연 시작 전에는 관련 정책에 따라 취소 및 환불이 가능해요. 다만 공연자와 수요자 간 합의된 계약 조건과 결제 대행사의 정책에 따를 수 있으니, 자세한 내용은 고객센터로 문의해 주세요.',
  },
  {
    category: '계정',
    q: '비밀번호를 잊어버렸어요.',
    a: '로그인 화면의 "비밀번호 찾기"를 눌러 가입한 이메일을 입력하면, 비밀번호 재설정 링크가 발송됩니다. 이메일을 확인해 새 비밀번호를 설정할 수 있어요.',
    link: { label: '비밀번호 재설정하기', to: '/forgot-password' },
  },
  {
    category: '계정',
    q: '공연자와 수요자 계정을 동시에 쓸 수 있나요?',
    a: '하나의 계정으로 공연자 또는 수요자 역할 중 하나로 가입하게 돼요. 다른 역할이 필요하다면 별도의 계정으로 가입하는 것을 권장합니다.',
  },
  {
    category: '계정',
    q: '회원 탈퇴는 어떻게 하나요?',
    a: '마이페이지의 계정 설정에서 회원 탈퇴를 신청할 수 있어요. 관련 법령에 따라 일정 기간 정보가 보관된 뒤 안전하게 파기됩니다.',
  },
];

const categories: Category[] = ['전체', '서비스 이용', '공연자', '공연 요청', '결제·수수료', '계정'];

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('전체');
  const [query, setQuery] = useState('');
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const honeypot = (formData.get('company_alt') as string || '').trim();
    if (honeypot) {
      setFormStatus('success');
      form.reset();
      return;
    }

    setFormStatus('sending');
    setFormError('');

    const payload = new URLSearchParams();
    formData.forEach((value, key) => {
      if (key !== 'company_alt') {
        payload.append(key, value as string);
      }
    });

    try {
      const res = await fetch('https://readdy.ai/api/form/da1g5bomlpfrg29fphkg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload.toString(),
      });
      const responseText = await res.text();
      let parsed: any = null;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = null;
      }
      const serverMsg = parsed?.meta?.message || parsed?.message || parsed?.meta?.detail || responseText;
      const isSpam = typeof serverMsg === 'string' && serverMsg.toLowerCase().includes('spam');

      if (res.ok && parsed?.code === 'OK' && !isSpam) {
        setFormStatus('success');
        form.reset();
      } else {
        setFormStatus('error');
        setFormError(typeof serverMsg === 'string' ? serverMsg : '문의 전송에 실패했습니다. 다시 시도해 주세요.');
      }
    } catch {
      setFormStatus('error');
      setFormError('네트워크 오류가 발생했습니다. 다시 시도해 주세요.');
    }
  };

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return faqs.filter((faq) => {
      const matchCategory = activeCategory === '전체' || faq.category === activeCategory;
      const matchQuery =
        keyword === '' ||
        faq.q.toLowerCase().includes(keyword) ||
        faq.a.toLowerCase().includes(keyword);
      return matchCategory && matchQuery;
    });
  }, [activeCategory, query]);

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
    <div className="min-h-screen bg-background-50 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 md:pt-28 pb-16">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
        <div className="w-full px-4 md:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <span className="inline-block px-4 py-1.5 rounded-full bg-accent-100 text-accent-800 text-xs font-medium mb-4">
                <i className="ri-question-line mr-1" />
                자주 묻는 질문
              </span>
              <h1 className="text-2xl md:text-4xl font-bold font-heading text-foreground-950">
                무엇이든 물어보세요
              </h1>
              <p className="text-sm md:text-base text-foreground-500 mt-3">
                서비스 이용에 관한 궁금증을 카테고리별로 빠르게 확인할 수 있어요.
              </p>
            </div>

            <div className="mb-6">
              <div className="relative">
                <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-foreground-400 text-lg" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="궁금한 내용을 검색해보세요"
                  className="w-full pl-11 pr-4 py-3 rounded-full border border-background-300 bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-shadow"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setActiveCategory(category);
                    setOpenKey(null);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeCategory === category
                      ? 'bg-primary-500 text-background-50'
                      : 'bg-background-100 text-foreground-600 hover:bg-background-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16 bg-background-100 border border-background-200 rounded-lg">
                <i className="ri-emotion-sad-line text-4xl text-foreground-300" />
                <p className="text-sm text-foreground-500 mt-3">검색 결과가 없어요. 다른 키워드로 찾아보세요.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((faq) => {
                  const isOpen = openKey === faq.q;
                  return (
                    <div
                      key={faq.q}
                      className="bg-background-50 border border-background-200 rounded-lg overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenKey(isOpen ? null : faq.q)}
                        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-background-100/60 transition-colors"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="shrink-0 px-2 py-0.5 rounded-md bg-secondary-100 text-secondary-900 text-[11px] font-medium mt-0.5">
                            {faq.category}
                          </span>
                          <span className="text-sm md:text-base font-medium text-foreground-900">{faq.q}</span>
                        </div>
                        <i
                          className={`ri-arrow-down-s-line text-foreground-500 text-lg shrink-0 transition-transform duration-300 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      <div
                        className={`grid transition-all duration-300 ease-in-out ${
                          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <p className="px-5 pb-4 pl-[88px] text-sm text-foreground-600 leading-relaxed">{faq.a}</p>
                          {faq.link && (
                            <div className="px-5 pb-5 pl-[88px]">
                              <Link
                                to={faq.link.to}
                                className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
                              >
                                {faq.link.label} <i className="ri-arrow-right-line" />
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-10 bg-accent-100/60 border border-accent-200 rounded-lg p-6 md:p-8">
              <div className="text-center mb-6">
                <h2 className="font-heading font-semibold text-foreground-950 text-base md:text-lg mb-2">
                  아직 궁금한 점이 남아있나요?
                </h2>
                <p className="text-sm text-foreground-600">
                  아래 양식을 작성해 주시면 평일 09:00 - 18:00 에 답변드려요.
                </p>
              </div>

              {formStatus === 'success' ? (
                <div className="text-center py-8">
                  <i className="ri-checkbox-circle-line text-4xl text-primary-500" />
                  <p className="text-sm text-foreground-800 font-medium mt-3">문의가 접수되었어요.</p>
                  <p className="text-xs text-foreground-500 mt-1">빠른 시일 내에 답변드리겠습니다.</p>
                </div>
              ) : (
                <form
                  data-readdy-form
                  id="faq-contact-form"
                  onSubmit={handleSubmit}
                  className="max-w-lg mx-auto space-y-4"
                >
                  <input
                    type="text"
                    name="company_alt"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    readOnly
                    className="hp-field"
                  />
                  <div>
                    <label htmlFor="faq-name" className="block text-sm font-medium text-foreground-800 mb-1.5">
                      이름
                    </label>
                    <input
                      id="faq-name"
                      name="name"
                      type="text"
                      required
                      placeholder="이름을 입력해 주세요"
                      className="w-full px-4 py-2.5 rounded-md border border-background-300 bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-shadow"
                    />
                  </div>
                  <div>
                    <label htmlFor="faq-email" className="block text-sm font-medium text-foreground-800 mb-1.5">
                      이메일
                    </label>
                    <input
                      id="faq-email"
                      name="email"
                      type="email"
                      required
                      placeholder="답변 받을 이메일을 입력해 주세요"
                      className="w-full px-4 py-2.5 rounded-md border border-background-300 bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-shadow"
                    />
                  </div>
                  <div>
                    <label htmlFor="faq-message" className="block text-sm font-medium text-foreground-800 mb-1.5">
                      문의 내용
                    </label>
                    <textarea
                      id="faq-message"
                      name="message"
                      required
                      maxLength={500}
                      rows={4}
                      placeholder="궁금한 점을 자세히 적어주세요 (최대 500자)"
                      className="w-full px-4 py-2.5 rounded-md border border-background-300 bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-shadow resize-none"
                    />
                  </div>

                  {formStatus === 'error' && (
                    <p className="text-sm text-accent-700 bg-accent-100 rounded-md px-4 py-2.5">{formError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={formStatus === 'sending'}
                    className="inline-flex w-full items-center justify-center gap-1.5 px-6 py-3 rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {formStatus === 'sending' ? (
                      <>
                        <i className="ri-loader-4-line animate-spin" />
                        전송 중...
                      </>
                    ) : (
                      <>
                        <i className="ri-mail-send-line" />
                        문의하기
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}