import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

const genreOptions = [
  '트로트', '7080', '어쿠스틱', '포크', '재즈', '클래식', '인디', '버스커',
  'K-Pop', '댄스', '국악', '찬양', '힙합', 'R&B', '록', '마술', '코미디',
];

const regionOptions = [
  '서울', '경기', '인천', '강원', '충청', '대전', '전라', '광주', '경상', '대구', '부산', '울산', '제주',
];

interface ProfileForm {
  stage_name: string;
  genre: string[];
  bio: string;
  video_url: string;
  audio_url: string;
  fee: string;
  equipment: boolean;
  regions: string[];
  experience_count: string;
  photo_url: string;
}

const emptyForm: ProfileForm = {
  stage_name: '',
  genre: [],
  bio: '',
  video_url: '',
  audio_url: '',
  fee: '',
  equipment: false,
  regions: [],
  experience_count: '',
  photo_url: '',
};

const PLACEHOLDER_IMAGE =
  'https://readdy.ai/api/search-image?query=Elegant%20stage%20performance%20silhouette%20with%20warm%20golden%20spotlight%20and%20soft%20bokeh%20background%2C%20professional%20Korean%20musician%20on%20stage%2C%20atmospheric%20amber%20lighting%2C%20artistic%20and%20abstract%20composition%2C%20editorial%20concert%20photography%2C%20warm%20coral%20and%20amber%20tones&width=400&height=500&seq=performer-default&orientation=portrait';

function computeCompleteness(form: ProfileForm): { percent: number; filled: number; total: number } {
  const checks: [boolean, string][] = [
    [form.stage_name.trim().length > 0, '활동명'],
    [form.genre.length > 0, '장르'],
    [form.bio.trim().length > 0, '소개'],
    [form.fee.trim().length > 0, '출연료'],
    [form.regions.length > 0, '활동 지역'],
    [form.experience_count.trim().length > 0, '경력'],
    [form.video_url.trim().length > 0, '대표 영상'],
    [form.audio_url.trim().length > 0, '대표 음원'],
  ];
  const filled = checks.filter(([ok]) => ok).length;
  const total = checks.length;
  return { percent: Math.round((filled / total) * 100), filled, total };
}

function compressImageToBase64(file: File, maxDim = 500, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('이미지를 불러오지 못했습니다.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('파일을 읽지 못했습니다.'));
    reader.readAsDataURL(file);
  });
}

function formatFee(fee: string): string {
  const n = Number(fee);
  if (!fee || Number.isNaN(n) || n <= 0) return '출연료 협의';
  return `출연료 ${n.toLocaleString('ko-KR')}만원`;
}

export default function PerformerProfilePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [existingRating, setExistingRating] = useState<number | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [photoSuccess, setPhotoSuccess] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?next=/performer/profile', { replace: true });
      return;
    }
    if (user) {
      supabase
        .from('performer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setForm({
              stage_name: data.stage_name ?? '',
              genre: data.genre ?? [],
              bio: data.bio ?? '',
              video_url: data.video_url ?? '',
              audio_url: data.audio_url ?? '',
              fee: data.fee != null ? String(data.fee) : '',
              equipment: data.equipment ?? false,
              regions: data.regions ?? [],
              experience_count: data.experience_count != null ? String(data.experience_count) : '',
              photo_url: data.photo_url ?? '',
            });
            if (data.rating != null) setExistingRating(Number(data.rating));
          }
          setLoading(false);
        });
    }
  }, [authLoading, user, navigate]);

  const completeness = useMemo(() => computeCompleteness(form), [form]);

  const toggle = (field: 'genre' | 'regions', value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((x) => x !== value)
        : [...prev[field], value],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setErrorMsg('');
    setSaved(false);

    const { error } = await supabase.from('performer_profiles').upsert(
      {
        user_id: user.id,
        stage_name: form.stage_name,
        genre: form.genre,
        bio: form.bio,
        video_url: form.video_url,
        audio_url: form.audio_url,
        fee: form.fee ? Number(form.fee) : null,
        equipment: form.equipment,
        regions: form.regions,
        experience_count: form.experience_count ? Number(form.experience_count) : 0,
        photo_url: form.photo_url,
      },
      { onConflict: 'user_id' },
    );

    setSaving(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setSaved(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('이미지 파일만 업로드할 수 있습니다.');
      setPhotoSuccess('');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPhotoError('10MB 이하의 이미지를 선택해주세요.');
      setPhotoSuccess('');
      return;
    }

    setUploadingPhoto(true);
    setPhotoError('');
    setPhotoSuccess('');

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `${user.id}/${Date.now()}.${ext}`;

    // Candidate buckets in order of preference
    const candidateBuckets = ['avatars', 'performer-photos', 'photos', 'public', 'AVATARS'];
    let uploadedUrl: string | null = null;

    for (const bucket of candidateBuckets) {
      try {
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, file, { cacheControl: '3600', upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
          if (urlData?.publicUrl) {
            uploadedUrl = urlData.publicUrl;
            break;
          }
        }
      } catch {
        // continue to next bucket or fallback
      }
    }

    if (uploadedUrl) {
      setForm((prev) => ({ ...prev, photo_url: uploadedUrl! }));
      setUploadingPhoto(false);
      setPhotoSuccess('프로필 사진이 성공적으로 업로드되었습니다.');
      return;
    }

    // Fallback: If Supabase Storage bucket is not available, compress image locally to base64 DataURL
    try {
      const base64Url = await compressImageToBase64(file, 600, 0.85);
      setForm((prev) => ({ ...prev, photo_url: base64Url }));
      setPhotoSuccess('프로필 이미지가 등록되었습니다. 하단 "프로필 저장"을 눌러 완료하세요.');
    } catch {
      setPhotoError('이미지 변환 중 오류가 발생했습니다. 직접 이미지 URL을 입력하시거나 다시 시도해 주세요.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setForm((prev) => ({ ...prev, photo_url: '' }));
    setPhotoSuccess('기본 이미지로 변경되었습니다.');
    setPhotoError('');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background-50 flex items-center justify-center">
        <i className="ri-loader-4-line text-primary-500 text-2xl animate-spin" />
      </div>
    );
  }

  const scoreLabel =
    completeness.percent === 100
      ? '완벽한 프로필이에요!'
      : completeness.percent >= 60
        ? '좋아요, 조금만 더 채워보세요'
        : completeness.percent >= 30
          ? '프로필을 더 채우면 매칭률이 올라가요'
          : '프로필 작성을 시작해보세요';

  return (
    <div className="min-h-screen bg-background-50 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 md:pt-24 pb-16">
        <div className="w-full px-4 md:px-8 py-8 md:py-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => navigate('/dashboard/performer')}
                className="text-sm text-foreground-500 hover:text-foreground-700 flex items-center gap-1"
              >
                <i className="ri-arrow-left-line" />
                마이페이지로
              </button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground-950">공연자 프로필</h1>
                <p className="text-sm text-foreground-600 mt-1">프로필을 상세히 작성할수록 더 좋은 공연 기회를 만날 수 있어요</p>
              </div>
              <Link
                to="/performers"
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 whitespace-nowrap"
              >
                <i className="ri-eye-line" />
                공연자 목록 보기
              </Link>
            </div>

            {saved && (
              <div className="mb-6 flex items-center gap-3 bg-primary-100 border border-primary-200 rounded-lg p-4">
                <i className="ri-checkbox-circle-line text-primary-600 text-xl" />
                <p className="text-sm text-primary-800 font-medium">프로필이 저장되었습니다.</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <form onSubmit={handleSubmit} className="lg:col-span-2 bg-background-50 rounded-xl border border-background-200 p-6 md:p-8 space-y-6">
                {/* 프로필 사진 업로드 */}
                <div className="flex flex-col items-center gap-3 pb-6 border-b border-background-200">
                  <div className="relative group w-28 h-28 rounded-full overflow-hidden border-2 border-primary-300 shadow-sm bg-background-100">
                    <img
                      src={form.photo_url || PLACEHOLDER_IMAGE}
                      alt="프로필 사진"
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                      title="사진 변경하기"
                    >
                      <i className="ri-camera-line text-2xl mb-1" />
                      <span className="text-[11px] font-medium">사진 변경</span>
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  {/* 버튼 그룹 */}
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-medium bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-primary-200"
                    >
                      <i className="ri-upload-2-line" />
                      내 사진 선택
                    </button>
                    {form.photo_url && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="px-3 py-1.5 text-xs font-medium text-foreground-600 hover:text-foreground-900 hover:bg-background-100 rounded-lg transition-colors cursor-pointer border border-background-300"
                      >
                        기본 사진으로
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="px-3 py-1.5 text-xs font-medium text-foreground-500 hover:text-foreground-800 rounded-lg transition-colors cursor-pointer"
                    >
                      {showUrlInput ? 'URL 닫기' : 'URL로 입력'}
                    </button>
                  </div>

                  {showUrlInput && (
                    <div className="w-full max-w-md mt-2 flex items-center gap-2">
                      <input
                        type="url"
                        value={form.photo_url}
                        onChange={(e) => setForm((prev) => ({ ...prev, photo_url: e.target.value }))}
                        placeholder="https://example.com/photo.jpg"
                        className="flex-1 px-3 py-1.5 text-xs border border-background-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  )}

                  {uploadingPhoto && (
                    <p className="text-xs text-primary-600 flex items-center gap-1 mt-1">
                      <i className="ri-loader-4-line animate-spin text-sm" />
                      이미지 처리 중...
                    </p>
                  )}

                  {photoSuccess && (
                    <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1 mt-1">
                      <i className="ri-checkbox-circle-fill text-emerald-500" />
                      {photoSuccess}
                    </p>
                  )}

                  {photoError && (
                    <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg flex items-center gap-1 mt-1">
                      <i className="ri-error-warning-fill text-rose-500" />
                      {photoError}
                    </p>
                  )}
                </div>

                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center">
                      <i className="ri-user-smile-line text-primary-600 text-sm" />
                    </div>
                    <h2 className="font-heading font-semibold text-foreground-950 text-base">기본 정보</h2>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                      활동명 <span className="text-accent-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.stage_name}
                      onChange={(e) => setForm({ ...form, stage_name: e.target.value })}
                      placeholder="무대에서 사용하는 이름"
                      className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">소개</label>
                    <textarea
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      maxLength={500}
                      rows={5}
                      placeholder="경력, 대표 공연, 강점 등을 자유롭게 소개해주세요"
                      className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                    />
                    <p className="text-right text-xs text-foreground-400 mt-1">{form.bio.length}/500</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground-700 mb-1.5">출연료 (만원)</label>
                      <input
                        type="number"
                        value={form.fee}
                        onChange={(e) => setForm({ ...form, fee: e.target.value })}
                        placeholder="예: 70"
                        className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground-700 mb-1.5">공연 경력 (회)</label>
                      <input
                        type="number"
                        value={form.experience_count}
                        onChange={(e) => setForm({ ...form, experience_count: e.target.value })}
                        placeholder="예: 28"
                        className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                      />
                    </div>
                  </div>
                </section>

                <div className="border-t border-background-200" />

                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-secondary-100 flex items-center justify-center">
                      <i className="ri-music-2-line text-secondary-700 text-sm" />
                    </div>
                    <h2 className="font-heading font-semibold text-foreground-950 text-base">공연 스타일</h2>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">음악 장르 (복수 선택)</label>
                    <div className="flex flex-wrap gap-2">
                      {genreOptions.map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => toggle('genre', g)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                            form.genre.includes(g)
                              ? 'bg-primary-500 text-background-50 border-primary-500'
                              : 'bg-background-50 text-foreground-600 border-background-200 hover:border-primary-300'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">활동 가능 지역 (복수 선택)</label>
                    <div className="flex flex-wrap gap-2">
                      {regionOptions.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => toggle('regions', r)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                            form.regions.includes(r)
                              ? 'bg-secondary-500 text-background-50 border-secondary-500'
                              : 'bg-background-50 text-foreground-600 border-background-200 hover:border-secondary-400'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-foreground-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.equipment}
                      onChange={(e) => setForm({ ...form, equipment: e.target.checked })}
                      className="rounded border-background-300"
                    />
                    자체 음향·장비 보유
                  </label>
                </section>

                <div className="border-t border-background-200" />

                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-accent-100 flex items-center justify-center">
                      <i className="ri-play-circle-line text-accent-700 text-sm" />
                    </div>
                    <h2 className="font-heading font-semibold text-foreground-950 text-base">미디어</h2>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">대표 영상 URL</label>
                    <input
                      type="url"
                      value={form.video_url}
                      onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                      placeholder="https://youtube.com/..."
                      className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">대표 음원 URL</label>
                    <input
                      type="url"
                      value={form.audio_url}
                      onChange={(e) => setForm({ ...form, audio_url: e.target.value })}
                      placeholder="https://soundcloud.com/..."
                      className="w-full px-4 py-3 rounded-lg border border-background-200 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    />
                  </div>
                </section>

                {errorMsg && <p className="text-sm text-accent-600">{errorMsg}</p>}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3.5 rounded-lg bg-primary-500 text-background-50 font-medium text-sm hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 whitespace-nowrap"
                >
                  <i className="ri-save-line" />
                  {saving ? '저장 중...' : '프로필 저장'}
                </button>
              </form>

              <aside className="lg:col-span-1">
                <div className="lg:sticky lg:top-24 space-y-4">
                  <div className="bg-background-50 rounded-xl border border-background-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="font-heading font-semibold text-foreground-950 text-sm">프로필 완성도</h2>
                      <span className="text-sm font-bold font-heading text-primary-600">{completeness.percent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-background-200 overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full bg-primary-500 transition-all duration-500"
                        style={{ width: `${completeness.percent}%` }}
                      />
                    </div>
                    <p className="text-xs text-foreground-500">
                      {completeness.filled}/{completeness.total} 항목 작성 완료
                    </p>
                    <p className="text-xs text-foreground-600 mt-2 font-medium">{scoreLabel}</p>
                  </div>

                  <div className="bg-background-50 rounded-xl border border-background-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-background-200">
                      <p className="text-xs font-medium text-foreground-500 flex items-center gap-1">
                        <i className="ri-eye-line" /> 수요자에게 보이는 미리보기
                      </p>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-background-200 bg-background-100 shrink-0">
                          <img
                            src={form.photo_url || PLACEHOLDER_IMAGE}
                            alt="프로필"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading font-semibold text-foreground-950 text-base truncate">
                            {form.stage_name || '활동명을 입력해주세요'}
                          </h3>
                          <div className="flex items-center gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <i
                                key={n}
                                className={`text-sm ${existingRating && n <= Math.round(existingRating) ? 'ri-star-fill text-accent-500' : 'ri-star-line text-foreground-300'}`}
                              />
                            ))}
                            <span className="text-xs text-foreground-500 ml-1">{existingRating?.toFixed(1) ?? '신규'}</span>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-primary-600 whitespace-nowrap">{formatFee(form.fee)}</span>
                      </div>

                      {form.genre.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {form.genre.slice(0, 4).map((g) => (
                            <span key={g} className="px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-800 text-xs font-medium">
                              {g}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-sm text-foreground-600 line-clamp-3 mb-3">
                        {form.bio || '소개가 아직 없어요. 경력과 강점을 작성해주세요.'}
                      </p>

                      {form.regions.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-foreground-500 mb-2">
                          <i className="ri-map-pin-line" />
                          <span>{form.regions.join(' · ')}</span>
                        </div>
                      )}

                      {form.experience_count && (
                        <div className="flex items-center gap-1 text-xs text-foreground-500">
                          <i className="ri-award-line" />
                          <span>공연 {Number(form.experience_count)}회 경력</span>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled
                        className="mt-4 w-full py-2.5 rounded-lg bg-primary-500 text-background-50 text-sm font-medium opacity-70 cursor-not-allowed whitespace-nowrap"
                      >
                        프로필 보기
                      </button>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}