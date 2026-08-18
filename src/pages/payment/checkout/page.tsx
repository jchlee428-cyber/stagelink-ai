import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

type PreparedTossPayment = {
  orderId: string;
  orderName: string;
  amount: number;
  currency: 'KRW';
  customerKey: string | null;
  successUrl: string;
  failUrl: string;
};

type TossRedirectRequest = Pick<
  PreparedTossPayment,
  'orderId' | 'orderName' | 'successUrl' | 'failUrl'
>;

type TossPaymentsInstance = Awaited<ReturnType<typeof loadTossPayments>>;
type PaymentWidgetInstance = Awaited<ReturnType<TossPaymentsInstance['widgets']>>;

interface QuoteSummary {
  id: string;
  title: string;
  performer_name: string | null;
  proposed_fee: number | null;
  status: string;
  payment_status: string | null;
}

const formatKRW = (n: number) => `${n.toLocaleString('ko-KR')}원`;

export default function PaymentCheckoutPage() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [quote, setQuote] = useState<QuoteSummary | null>(null);
  const [quoteError, setQuoteError] = useState('');
  const [initError, setInitError] = useState('');
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [serverAmount, setServerAmount] = useState<number | null>(null);

  const preparedRef = useRef<PreparedTossPayment | null>(null);
  const widgetsRef = useRef<PaymentWidgetInstance | null>(null);
  const initStartedRef = useRef(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user || !quoteId) return;
    let cancelled = false;
    supabase
      .from('quotes')
      .select('id, title, performer_name, proposed_fee, status, payment_status')
      .eq('id', quoteId)
      .eq('client_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setQuoteError('견적을 찾을 수 없습니다.');
          return;
        }
        if (data.status !== 'quoted') {
          setQuoteError('이미 처리된 견적입니다.');
          return;
        }
        if (data.payment_status === 'paid') {
          setQuoteError('이미 결제가 완료된 견적입니다.');
          return;
        }
        setQuote(data as QuoteSummary);
      });
    return () => {
      cancelled = true;
    };
  }, [user, quoteId]);

  useEffect(() => {
    if (!quote || !quoteId || initStartedRef.current) return;
    initStartedRef.current = true;
    let cancelled = false;

    async function init() {
      const methodCount = document.querySelectorAll('#toss-payment-method').length;
      const agreementCount = document.querySelectorAll('#toss-agreement').length;
      if (methodCount !== 1 || agreementCount !== 1) {
        setInitError('결제 위젯을 초기화할 수 없습니다. 새로고침해주세요.');
        return;
      }

      const basePath = __BASE_PATH__.split('/').filter(Boolean).join('/');
      const pathPrefix = basePath ? `/${basePath}` : '';

      const { data: preparedData, error: prepareError } = await supabase.functions.invoke(
        'prepare-toss-payment',
        { body: { quoteId, basePath: pathPrefix } },
      );
      if (cancelled) return;
      if (prepareError || !preparedData) {
        setInitError('결제를 준비하지 못했습니다. 다시 시도해주세요.');
        return;
      }
      const preparedPayment = preparedData as PreparedTossPayment;
      preparedRef.current = preparedPayment;
      setServerAmount(preparedPayment.amount);

      const tossPayments = await loadTossPayments(import.meta.env.VITE_PUBLIC_TOSS_CLIENT_KEY);
      if (cancelled) return;

      const customerKey = preparedPayment.customerKey ?? ANONYMOUS;
      const widgets = tossPayments.widgets({ customerKey });
      widgetsRef.current = widgets;

      await widgets.setAmount({ currency: preparedPayment.currency, value: preparedPayment.amount });
      await widgets.renderPaymentMethods({ selector: '#toss-payment-method', variantKey: 'DEFAULT' });
      await widgets.renderAgreement({ selector: '#toss-agreement', variantKey: 'AGREEMENT' });

      if (!cancelled) setReady(true);
    }

    init().catch(() => {
      if (!cancelled) setInitError('결제 위젯을 불러오지 못했습니다. 다시 시도해주세요.');
    });

    return () => {
      cancelled = true;
    };
  }, [quote, quoteId]);

  const handlePayment = async () => {
    const preparedPayment = preparedRef.current;
    const paymentWidgets = widgetsRef.current;
    if (!preparedPayment || !paymentWidgets) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      const redirectRequest: TossRedirectRequest = {
        orderId: preparedPayment.orderId,
        orderName: preparedPayment.orderName,
        successUrl: preparedPayment.successUrl,
        failUrl: preparedPayment.failUrl,
      };
      await paymentWidgets.requestPayment(redirectRequest);
    } catch {
      setSubmitError('결제 요청 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-50 flex items-center justify-center">
        <i className="ri-loader-4-line text-primary-500 text-2xl animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const estimatedFee = quote && quote.proposed_fee != null ? quote.proposed_fee * 1000 : null;
  const displayFee = serverAmount ?? estimatedFee;

  return (
    <div className="min-h-screen bg-background-50 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 md:pt-28 pb-16">
        <div className="w-full px-4 md:px-8">
          <div className="max-w-2xl mx-auto">
            <Link
              to="/quotes"
              className="inline-flex items-center gap-1 text-sm text-foreground-500 hover:text-foreground-700 mb-6"
            >
              <i className="ri-arrow-left-line" />
              견적 목록으로
            </Link>

            <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground-950 mb-2">
              중개 수수료 결제
            </h1>
            <p className="text-sm text-foreground-600 mb-8">
              계약 성사를 위해 중개 수수료(출연료의 10%)를 결제해주세요.
            </p>

            {quoteError ? (
              <div className="bg-background-50 border border-background-200 rounded-lg p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-secondary-100 flex items-center justify-center mx-auto mb-3">
                  <i className="ri-error-warning-line text-secondary-700 text-xl" />
                </div>
                <p className="text-foreground-600 text-sm mb-5">{quoteError}</p>
                <Link
                  to="/quotes"
                  className="inline-flex items-center gap-1 px-5 py-2.5 rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap"
                >
                  견적 목록으로 돌아가기
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-background-50 border border-background-200 rounded-lg p-5 md:p-6">
                  {quote ? (
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-5">
                        <div className="min-w-0">
                          <h2 className="font-medium text-foreground-900 text-base">{quote.title}</h2>
                          <p className="text-sm text-foreground-500 mt-1">
                            {quote.performer_name || '공연자'}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium whitespace-nowrap">
                          계약 진행
                        </span>
                      </div>

                      <dl className="space-y-3 border-t border-background-200 pt-4">
                        <div className="flex items-center justify-between gap-4">
                          <dt className="text-sm text-foreground-500">출연료</dt>
                          <dd className="text-sm font-medium text-foreground-900">
                            {quote.proposed_fee ?? '—'}만원
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <dt className="text-sm text-foreground-500">중개 수수료 (10%)</dt>
                          <dd className="text-lg font-bold text-primary-600">
                            {displayFee != null ? formatKRW(displayFee) : '—'}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <i className="ri-loader-4-line text-primary-500 text-xl animate-spin" />
                    </div>
                  )}
                </div>

                <div className="bg-background-50 border border-background-200 rounded-lg p-5 md:p-6">
                  <h3 className="font-heading font-semibold text-foreground-950 text-base mb-4">
                    결제 수단 선택
                  </h3>
                  <div id="toss-payment-method" />
                  <div id="toss-agreement" />
                </div>

                {initError && (
                  <div className="bg-accent-100/60 border border-accent-200 rounded-lg p-4 text-sm text-accent-800">
                    {initError}
                  </div>
                )}

                {submitError && (
                  <div className="bg-accent-100/60 border border-accent-200 rounded-lg p-4 text-sm text-accent-800">
                    {submitError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={!ready || submitting}
                  className="w-full px-6 py-3.5 rounded-lg bg-primary-500 text-background-50 text-base font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {submitting
                    ? '결제 진행 중...'
                    : !ready
                      ? '결제 수단 불러오는 중...'
                      : displayFee != null
                        ? `${formatKRW(displayFee)} 결제하기`
                        : '결제하기'}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}