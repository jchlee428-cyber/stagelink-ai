export interface ArtistScoreBreakdown {
  total: number;
  ratingScore: number;
  experienceScore: number;
  reviewScore: number;
  rating: number;
  experienceCount: number;
  reviewCount: number;
}

export interface ArtistScoreTier {
  label: string;
  badgeClass: string;
}

const MAX_RATING = 60;
const MAX_EXPERIENCE = 20;
const MAX_REVIEW = 20;

export function computeArtistScore(
  rating: number,
  experienceCount: number,
  reviewCount: number,
): ArtistScoreBreakdown {
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
  const safeExperience = Math.max(0, Number(experienceCount) || 0);
  const safeReview = Math.max(0, Number(reviewCount) || 0);

  const ratingScore = Math.round((safeRating / 5) * MAX_RATING);
  const experienceScore = Math.min(safeExperience, MAX_EXPERIENCE);
  const reviewScore = Math.min(safeReview, MAX_REVIEW);

  return {
    total: ratingScore + experienceScore + reviewScore,
    ratingScore,
    experienceScore,
    reviewScore,
    rating: safeRating,
    experienceCount: safeExperience,
    reviewCount: safeReview,
  };
}

export function artistScoreTier(total: number): ArtistScoreTier {
  if (total >= 85) return { label: '우수', badgeClass: 'bg-accent-100 text-accent-900' };
  if (total >= 70) return { label: '준수', badgeClass: 'bg-primary-100 text-primary-700' };
  return { label: '성장 중', badgeClass: 'bg-secondary-100 text-secondary-800' };
}