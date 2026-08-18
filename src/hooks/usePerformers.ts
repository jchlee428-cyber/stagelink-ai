import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { performers as mockPerformers, type Performer } from '@/mocks/performers';

const PLACEHOLDER_IMAGE =
  'https://readdy.ai/api/search-image?query=Elegant%20stage%20performance%20silhouette%20with%20warm%20golden%20spotlight%20and%20soft%20bokeh%20background%2C%20professional%20Korean%20musician%20on%20stage%2C%20atmospheric%20amber%20lighting%2C%20artistic%20and%20abstract%20composition%2C%20editorial%20concert%20photography%2C%20warm%20coral%20and%20amber%20tones&width=400&height=500&seq=performer-default&orientation=portrait';

interface PerformerProfileRow {
  id: string;
  user_id: string | null;
  stage_name: string | null;
  genre: string[] | null;
  bio: string | null;
  video_url?: string | null;
  audio_url?: string | null;
  fee: number | null;
  equipment: boolean;
  regions: string[] | null;
  experience_count: number;
  rating: number | string | null;
  score: number | null;
  photo_url: string | null;
}

function mapProfile(row: PerformerProfileRow): Performer {
  const stageName = row.stage_name ?? '무명 공연자';
  return {
    id: row.id,
    userId: row.user_id ?? '',
    name: stageName,
    stageName,
    genres: row.genre ?? [],
    regions: row.regions ?? [],
    fee: row.fee ?? 0,
    rating: Number(row.rating ?? 4.5),
    experienceCount: row.experience_count ?? 0,
    rebookingRate: 0,
    reviewCount: 0,
    image: row.photo_url || PLACEHOLDER_IMAGE,
    bio: row.bio ?? '',
    matchingScore: row.score ?? 80,
    mainEvents: [],
    sns: '',
    equipment: row.equipment ?? false,
    videoUrl: row.video_url ?? null,
    audioUrl: row.audio_url ?? null,
  };
}

export interface UsePerformersResult {
  performers: Performer[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function usePerformers(): UsePerformersResult {
  const [performers, setPerformers] = useState<Performer[]>(mockPerformers);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformers = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      supabase.from('performer_profiles').select('*'),
      supabase.from('reviews').select('performer_id'),
    ]).then(([profileRes, reviewRes]) => {
      const { data, error: fetchError } = profileRes;
      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      const reviewCounts = new Map<string, number>();
      (reviewRes.data ?? []).forEach((r) => {
        const pid = String((r as Record<string, unknown>).performer_id);
        reviewCounts.set(pid, (reviewCounts.get(pid) ?? 0) + 1);
      });

      if (data && data.length > 0) {
        setPerformers(
          data.map((row) => {
            const performer = mapProfile(row);
            return { ...performer, reviewCount: reviewCounts.get(row.id) ?? 0 };
          }),
        );
      } else {
        setPerformers(mockPerformers);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchPerformers();
  }, [fetchPerformers]);

  useEffect(() => {
    const channel = supabase
      .channel('performers-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'performer_profiles' },
        () => {
          fetchPerformers();
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews' },
        () => {
          fetchPerformers();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPerformers]);

  return { performers, loading, error, retry: fetchPerformers };
}