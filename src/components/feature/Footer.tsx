import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-secondary-100 border-t border-secondary-200">
      <div className="w-full px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                <i className="ri-music-2-line text-background-50 text-lg" />
              </div>
              <span className="text-lg font-bold font-heading text-foreground-950">StageLink AI</span>
            </div>
            <p className="text-sm text-foreground-600 leading-relaxed">
              AI가 공연자와 수요자를 연결하는<br />스마트 공연 매칭 플랫폼
            </p>
          </div>
          
          <div>
            <h4 className="font-heading font-semibold text-foreground-950 mb-4 text-sm">서비스</h4>
            <ul className="space-y-2">
              <li><Link to="/performers" className="text-sm text-foreground-600 hover:text-primary-600">공연자 찾기</Link></li>
              <li><Link to="/matching" className="text-sm text-foreground-600 hover:text-primary-600">AI 매칭</Link></li>
              <li><Link to="/requests" className="text-sm text-foreground-600 hover:text-primary-600">공연 요청</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-heading font-semibold text-foreground-950 mb-4 text-sm">안내</h4>
            <ul className="space-y-2">
              <li><Link to="/guide" className="text-sm text-foreground-600 hover:text-primary-600">이용 가이드</Link></li>
              <li><Link to="/pricing" className="text-sm text-foreground-600 hover:text-primary-600">요금 안내</Link></li>
              <li><Link to="/faq" className="text-sm text-foreground-600 hover:text-primary-600">자주 묻는 질문</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-heading font-semibold text-foreground-950 mb-4 text-sm">고객센터</h4>
            <ul className="space-y-2">
              <li><span className="text-sm text-foreground-600">help@stagelink.ai</span></li>
              <li><span className="text-sm text-foreground-600">평일 09:00 - 18:00</span></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-secondary-200 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-foreground-500">© StageLink AI. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/admin" className="text-xs text-foreground-500 hover:text-foreground-700">관리자 페이지</Link>
            <Link to="/privacy" className="text-xs text-foreground-500 hover:text-foreground-700">개인정보처리방침</Link>
            <Link to="/terms" className="text-xs text-foreground-500 hover:text-foreground-700">이용약관</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}