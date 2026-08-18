-- ==============================================================================
-- Supabase Storage: avatars 버킷 생성 및 RLS 정책 설정
-- ==============================================================================

-- 1. avatars 버킷 생성 (공개 읽기 허용)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- 2. 누구나 프로필 이미지를 조회할 수 있도록 허용 (Public Read)
CREATE POLICY "Public Access avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 3. 로그인한 사용자가 자신의 폴더에 이미지를 업로드할 수 있도록 허용
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (auth.uid()::text = (storage.foldername(name))[1])
);

-- 4. 로그인한 사용자가 자신의 이미지를 수정/덮어쓸 수 있도록 허용
CREATE POLICY "Authenticated users can update own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (auth.uid()::text = (storage.foldername(name))[1])
);

-- 5. 로그인한 사용자가 자신의 이미지를 삭제할 수 있도록 허용
CREATE POLICY "Authenticated users can delete own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (auth.uid()::text = (storage.foldername(name))[1])
);
