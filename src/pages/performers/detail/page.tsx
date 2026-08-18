import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { usePerformers } from '@/hooks/usePerformers';
import { useAuth } from '@/hooks/useAuth';
import ReviewsSection from '@/pages/performers/detail/components/ReviewsSection';
import ReceivedRequestsSection from '@/pages/performers/detail/components/ReceivedRequestsSection';
import ArtistScoreBadge from '@/components/feature/ArtistScoreBadge';
import QuoteRequestModal from '@/pages/quotes/components/QuoteRequestModal';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';

function getYoutubeEmbedUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const trimmed = url.trim();
    if (trimmed.includes('youtube.com/watch')) {
      const u = new URL(trimmed);
      const id = u.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (trimmed.includes('youtu.be/')) {
      const id = trimmed.split('youtu.be/')[1]?.split(/[?#]/)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (trimmed.includes('youtube.com/embed/')) {
      return trimmed;
    }
    if (trimmed.includes('youtube.com/shorts/')) {
      const id = trimmed.split('youtube.com/shorts/')[1]?.split(/[?#]/)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

export default function PerformerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const { performers, loading } = usePerformers();
  const performer = performers.find((p) => p.id === id);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  useEffect(() => {
    if (user && searchParams.get('quote') === '1') {
      if (profile?.role === 'performer') {
        alert('공연자 계정은 견적을 요청할 수 없습니다. 수요자(클라이언트) 계정으로 이용해 주세요.');
      } else {
        setQuoteModalOpen(true);
      }
      const next = new URLSearchParams(searchParams);
      next.delete('quote');
      setSearchParams(next, { replace: true });
    }
  }, [user, profile, searchParams, setSearchParams]);

  const handleQuoteClick = () => {
    if (!user) {
      alert('수요자 계정으로 로그인해야 견적을 요청할 수 있어요.');
      return;
    }
    if (profile?.role === 'performer') {
      alert('공연자 계정은 견적을 요청할 수 없습니다. 수요자(클라이언트) 계정으로 이용해 주세요.');
      return;
    }
    setQuoteModalOpen(true);
  };

  const handleRequestClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      alert('수요자 계정으로 로그인해야 공연을 의뢰할 수 있어요.');
      return;
    }
    if (profile?.role === 'performer') {
      e.preventDefault();
      alert('공연자 계정은 공연을 의뢰할 수 없습니다. 수요자(클라이언트) 계정으로 이용해 주세요.');
      return;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-50">
        <Navbar />
        <div className="pt-24 flex items-center justify-center min-h-[60vh]">
          <i className="ri-loader-4-line text-primary-500 text-2xl animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!performer) {
    return (
      <div className="min-h-screen bg-background-50">
        <Navbar />
        <div className="pt-24 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground-950 mb-2">공연자를 찾을 수 없습니다</h2>
            <Link to="/performers" className="text-primary-600 text-sm hover:underline">공연자 목록으로 돌아가기</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const requestNewPath = `/requests/new?performer=${performer.id}&performerName=${encodeURIComponent(performer.stageName)}`;
  const youtubeEmbed = getYoutubeEmbedUrl(performer.videoUrl);

  return (
    <div className="min-h-screen bg-background-50">
      <Navbar />
      <main className="pt-20 md:pt-24">
        <div className="w-full px-4 md:px-8 py-8 md:py-12">
          <div className="max-w-6xl mx-auto">
            <Link to="/performers" className="inline-flex items-center gap-1 text-sm text-foreground-500 hover:text-foreground-700 mb-6">
              <i className="ri-arrow-left-line" />
              목록으로 돌아가기
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Left: sticky image + booking summary */}
              <div className="lg:col-span-2">
                <div className="lg:sticky lg:top-24 space-y-4">
                  <div className="rounded-xl overflow-hidden border border-background-200 shadow-sm bg-background-100">
                    <img src={performer.image} alt={performer.stageName} className="w-full aspect-[4/5] object-cover" />
                  </div>

                  <div className="rounded-xl border border-background-200 bg-background-50 p-5 shadow-sm">
                    <div className="flex items-end justify-between mb-1">
                      <span className="text-sm text-foreground-600">출연료</span>
                      <span className="text-2xl font-bold text-primary-600">
                        {performer.fee > 0 ? `${performer.fee}만원` : '협의'}
                        {performer.fee > 0 && <span className="text-base font-normal text-foreground-500">부터</span>}
                      </span>
                    </div>
                    <p className="text-xs text-foreground-500 mb-4">행사 규모·장소에 따라 협의 가능</p>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-background-100 rounded-lg py-2.5 text-center">
                        <div className="flex items-center justify-center gap-0.5 text-sm font-semibold text-foreground-950">
                          <i className="ri-star-fill text-accent-500 text-xs" />
                          {performer.rating}
                        </div>
                        <div className="text-[11px] text-foreground-500 mt-0.5">평점</div>
                      </div>
                      <div className="bg-background-100 rounded-lg py-2.5 text-center">
                        <div className="text-sm font-semibold text-foreground-950">{performer.experienceCount}회</div>
                        <div className="text-[11px] text-foreground-500 mt-0.5">공연 경력</div>
                      </div>
                      <div className="bg-background-100 rounded-lg py-2.5 text-center">
                        <div className="text-sm font-semibold text-foreground-950">{performer.rebookingRate || 0}%</div>
                        <div className="text-[11px] text-foreground-500 mt-0.5">재섭외율</div>
                      </div>
                    </div>

                    {/* 음향 장비 보유 여부 안내 */}
                    <div className={`p-3 rounded-lg border text-xs mb-4 flex items-center gap-2 ${
                      performer.equipment
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-background-100 border-background-200 text-foreground-600'
                    }`}>
                      <i className={performer.equipment ? "ri-checkbox-circle-fill text-emerald-600 text-sm" : "ri-information-line text-foreground-400 text-sm"} />
                      <span>{performer.equipment ? '자체 음향 및 마이크 장비 보유 (지원 가능)' : '자체 음향 장비 미보유 (행사장 구비 필요)'}</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={handleQuoteClick}
                        className="w-full py-3 rounded-lg bg-primary-500 text-background-50 font-medium text-sm hover:bg-primary-600 transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <i className="ri-file-text-line" />
                        견적 요청하기
                      </button>
                      <Link
                        to={requestNewPath}
                        onClick={handleRequestClick}
                        className="w-full py-3 rounded-lg border border-primary-300 text-primary-600 font-medium text-sm hover:bg-primary-50 transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <i className="ri-calendar-event-line" />
                        공연 의뢰하기
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: profile detail */}
              <div className="lg:col-span-3 space-y-6">
                <div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {performer.genres.map((g) => (
                      <span key={g} className="px-3 py-1 rounded-full text-xs font-semibold bg-secondary-100 text-secondary-900 border border-secondary-200">
                        {g}
                      </span>
                    ))}
                  </div>

                  <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground-950 mb-2">{performer.stageName}</h1>
                  
                  {/* 활동 지역 & 장비 배지 */}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-foreground-600 mb-4">
                    <span className="flex items-center gap-1">
                      <i className="ri-map-pin-line text-primary-600" />
                      활동 지역: <strong className="text-foreground-900">{performer.regions.length > 0 ? performer.regions.join(', ') : '전국'}</strong>
                    </span>
                    {performer.equipment && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800">
                        <i className="ri-volume-up-line" />
                        음향장비 지원
                      </span>
                    )}
                  </div>

                  <div className="bg-accent-50 border border-accent-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <i className="ri-magic-line text-accent-600" />
                      <span className="text-sm font-semibold text-accent-900">AI 매칭 점수</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold text-accent-600">{performer.matchingScore}%</span>
                      <span className="text-sm text-accent-700 mb-1">이 수요자와 높은 적합도</span>
                    </div>
                  </div>
                </div>

                {/* 아티스트 소개글 */}
                <div className="bg-background-50 border border-background-200 rounded-xl p-6 shadow-sm">
                  <h2 className="font-heading font-semibold text-foreground-950 mb-3 text-base flex items-center gap-2">
                    <i className="ri-user-smile-line text-primary-600" />
                    아티스트 소개
                  </h2>
                  <p className="text-sm text-foreground-700 leading-relaxed whitespace-pre-line">
                    {performer.bio || '등록된 소개글이 없습니다.'}
                  </p>
                </div>

                {/* 🎬 미디어 섹션 (대표 영상 및 대표 음원) */}
                {(performer.videoUrl || performer.audioUrl) && (
                  <div className="bg-background-50 border border-background-200 rounded-xl p-6 shadow-sm space-y-5">
                    <h2 className="font-heading font-semibold text-foreground-950 text-base flex items-center gap-2">
                      <i className="ri-movie-line text-accent-600" />
                      대표 미디어 (영상 & 음원)
                    </h2>

                    {/* 대표 영상 */}
                    {performer.videoUrl && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground-700 flex items-center gap-1.5">
                            <i className="ri-youtube-fill text-red-600 text-sm" />
                            대표 공연 영상
                          </span>
                          <a
                            href={performer.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                          >
                            새 창에서 열기
                            <i className="ri-external-link-line" />
                          </a>
                        </div>
                        {youtubeEmbed ? (
                          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-background-200 shadow-xs bg-black">
                            <iframe
                              src={youtubeEmbed}
                              title={`${performer.stageName} 공연 영상`}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="w-full h-full border-0"
                            />
                          </div>
                        ) : (
                          <div className="p-4 bg-background-100 rounded-xl border border-background-200 flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 shrink-0">
                                <i className="ri-play-circle-line text-xl" />
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-medium text-foreground-900 truncate">영상 링크</p>
                                <p className="text-[11px] text-foreground-500 truncate">{performer.videoUrl}</p>
                              </div>
                            </div>
                            <a
                              href={performer.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 text-xs font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 shrink-0"
                            >
                              영상 보기
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 대표 음원 */}
                    {performer.audioUrl && (
                      <div className="space-y-2 pt-2 border-t border-background-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground-700 flex items-center gap-1.5">
                            <i className="ri-music-2-fill text-primary-600 text-sm" />
                            대표 음원
                          </span>
                          <a
                            href={performer.audioUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                          >
                            음원 바로가기
                            <i className="ri-external-link-line" />
                          </a>
                        </div>
                        <div className="p-4 bg-background-100 rounded-xl border border-background-200 flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center text-accent-600 shrink-0">
                              <i className="ri-headphone-line text-xl" />
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-medium text-foreground-900 truncate">등록된 대표 음원</p>
                              <p className="text-[11px] text-foreground-500 truncate">{performer.audioUrl}</p>
                            </div>
                          </div>
                          <a
                            href={performer.audioUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs font-medium bg-accent-500 text-white rounded-lg hover:bg-accent-600 shrink-0"
                          >
                            듣기
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {performer.mainEvents.length > 0 && (
                  <div className="bg-background-50 border border-background-200 rounded-xl p-6 shadow-sm">
                    <h2 className="font-heading font-semibold text-foreground-950 mb-3 text-base flex items-center gap-2">
                      <i className="ri-trophy-line text-amber-500" />
                      주요 행사 이력
                    </h2>
                    <ul className="space-y-2">
                      {performer.mainEvents.map((e, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-foreground-700">
                          <i className="ri-check-line text-accent-500 shrink-0" />
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {performer.sns && (
                  <div className="flex items-center gap-2 text-sm text-foreground-600">
                    <i className="ri-instagram-line text-lg" />
                    <span>SNS: <strong className="text-foreground-900">{performer.sns}</strong></span>
                  </div>
                )}

                <ArtistScoreBadge
                  rating={performer.rating}
                  experienceCount={performer.experienceCount}
                  reviewCount={performer.reviewCount}
                />
              </div>
            </div>

            <ReviewsSection performerId={performer.id} performerName={performer.stageName} />
            <ReceivedRequestsSection performerId={performer.id} performerUserId={performer.userId} />
          </div>
        </div>
      </main>
      <Footer />

      <QuoteRequestModal
        open={quoteModalOpen}
        performerId={performer.id}
        performerUserId={performer.userId}
        performerName={performer.stageName}
        onClose={() => setQuoteModalOpen(false)}
        onSubmitted={() => setQuoteModalOpen(false)}
      />
    </div>
  );
}