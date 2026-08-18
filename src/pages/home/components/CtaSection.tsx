import { Link } from 'react-router-dom';

export default function CtaSection() {
  return (
    <section className="py-16 md:py-24 bg-primary-500">
      <div className="w-full px-4 md:px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold font-heading text-background-50 mb-4">
            지금 바로 StageLink AI를<br className="hidden md:block" /> 시작하세요
          </h2>
          <p className="text-sm md:text-base text-background-50/80 mb-8">
            공연자 등록부터 공연 의뢰까지, 5분이면 충분합니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="px-8 py-3.5 rounded-full bg-background-50 text-primary-600 font-medium text-sm hover:bg-background-100 transition-colors whitespace-nowrap"
            >
              공연자 등록
            </Link>
            <Link
              to="/requests"
              className="px-8 py-3.5 rounded-full border border-background-50/30 text-background-50 font-medium text-sm hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              공연 의뢰하기
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}