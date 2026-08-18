import { useSearchParams, Link } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';

export default function PaymentFailPage() {
  const [searchParams] = useSearchParams();
  const message = searchParams.get('message') || '결제가 완료되지 않았습니다.';

  return (
    <div className="min-h-screen bg-background-50 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 md:pt-28 pb-16">
        <div className="w-full px-4 md:px-8">
          <div className="max-w-xl mx-auto">
            <div className="bg-background-50 border border-background-200 rounded-lg p-8 md:p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-accent-100 flex items-center justify-center mb-4 mx-auto">
                <i className="ri-close-line text-accent-600 text-3xl" />
              </div>
              <h1 className="text-2xl font-bold font-heading text-foreground-950 mb-2">
                결제가 완료되지 않았습니다
              </h1>
              <p className="text-sm text-foreground-600 mb-6">{message}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/quotes"
                  className="px-6 py-3 rounded-full bg-primary-500 text-background-50 text-sm font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap"
                >
                  견적 목록으로 돌아가기
                </Link>
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="px-6 py-3 rounded-full border border-background-200 text-foreground-700 text-sm font-medium hover:bg-background-100 transition-colors whitespace-nowrap"
                >
                  결제 다시 시도
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}