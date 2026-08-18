import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { supabase } from '@/lib/supabase';

interface ConfirmResult {
  status: string;
  orderId: string;
  amount: number;
  quoteId: string;
}

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<ConfirmResult | null>(null);
  const confirmedRef = useRef(false);

  useEffect(() => {
    if (confirmedRef.current) return;
    confirmedRef.current = true;

    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amountParam = searchParams.get('amount');

    if (!paymentKey || !orderId || !amountParam) {
      setState('error');
      setErrorMsg('결제 정보가 올바르지 않습니다.');
      return;
    }

    const amount = Number(amountParam);

    supabase.functions
      .invoke('confirm-toss-payment', {
        body: { paymentKey, orderId, amount },
      })
      .then(({ data, error }) => {
        if (error) {
          setState('error');
          setErrorMsg(error.message || '결제 승인에 실패했습니다.');
          return;
        }
        if (data?.status === 'paid') {
          setResult(data as ConfirmResult);
          setState('success');
        } else {
          setState('error');
          setErrorMsg(data?.message || '결제 승인에 실패했습니다.');
        }
      })
      .catch(() => {
        setState('error');
        setErrorMsg('결제 승인에 실패했습니다. 다시 시도해주세요.');
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background-50 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 md:pt-28 pb-16">
        <div className="w-full px-4 md:px-8">
          <div className="max-w-xl mx-auto">
            <div className="bg-background-50 border border-background-200 rounded-lg p-8 md:p-10 text-center">
              {state === 'loading' && (
                <div className="flex flex-col items-center">
                  <i className="ri-loader-4-line text-primary-500 text-3xl animate-spin mb-4" />
                  <p className="text-sm text-foreground-600">결제를 승인하고 있어요...</p>
                </div>
              )}

              {state === 'success' && (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-accent-100 flex items-center justify-center mb-4">
                    <i className="ri-check-line text-accent-600 text-3xl" />
                  </div>
                  <h1 className="text-2xl font-bold font-heading text-foreground-950 mb-2">
                    결제가 완료되었습니다
                  </h1>
                  <p className="text-sm text-foreground-600 mb-1">
                    중개 수수료 결제가 완료되어 계약이 성사되었어요.
                  </p>
                  {result && (
                    <p className="text-sm text-foreground-500 mb-6">
                      결제 금액 {result.amount.toLocaleString('ko-KR')}원
                    </p>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <Link
                      to="/quotes"
                      className="px-6 py-3 rounded-full bg-primary-500 text-background-50 text-sm font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap"
                    >
                      견적·계약 확인
                    </Link>
                    <Link
                      to="/schedule"
                      className="px-6 py-3 rounded-full border border-background-200 text-foreground-700 text-sm font-medium hover:bg-background-100 transition-colors whitespace-nowrap"
                    >
                      일정 보기
                    </Link>
                  </div>
                </div>
              )}

              {state === 'error' && (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-accent-100 flex items-center justify-center mb-4">
                    <i className="ri-error-warning-line text-accent-600 text-3xl" />
                  </div>
                  <h1 className="text-2xl font-bold font-heading text-foreground-950 mb-2">
                    결제 승인에 실패했습니다
                  </h1>
                  <p className="text-sm text-foreground-600 mb-6">{errorMsg}</p>
                  <Link
                    to="/quotes"
                    className="px-6 py-3 rounded-full bg-primary-500 text-background-50 text-sm font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap"
                  >
                    견적 목록으로 돌아가기
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}