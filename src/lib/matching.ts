import type { Performer } from '@/mocks/performers';

export interface MatchingCriteria {
  title?: string;
  eventType?: string;
  region?: string;
  budget?: number | string;
  genre?: string;
  duration?: number | string;
  audience?: number | string;
}

export interface MatchingBreakdown {
  genre: number;       // 장르 적합성 (0~100)
  region: number;      // 지역 적합성 (0~100)
  budget: number;      // 예산 적합성 (0~100)
  experience: number;  // 행사 경험 및 평점 (0~100)
  audience: number;    // 관객/행사 규모 적합성 (0~100)
}

export interface MatchingResult {
  performer: Performer;
  totalScore: number;
  breakdown: MatchingBreakdown;
  matchReasons: string[];
}

// 장르 간 유사도 관계
const RELATED_GENRES: Record<string, string[]> = {
  '재즈': ['보컬', '어쿠스틱', '클래식', 'R&B', '포크'],
  '보컬': ['재즈', '어쿠스틱', '발라드', 'R&B', 'K-Pop'],
  '어쿠스틱': ['포크', '인디', '버스커', '재즈', '보컬'],
  '포크': ['어쿠스틱', '인디', '7080', '버스커'],
  '인디': ['어쿠스틱', '록', '포크', '버스커'],
  '트로트': ['7080', '국악'],
  '7080': ['트로트', '포크', '어쿠스틱'],
  '클래식': ['재즈', '국악', '보컬'],
  '국악': ['클래식', '트로트', '포크'],
  'K-Pop': ['댄스', '힙합', 'R&B', '보컬'],
  '댄스': ['K-Pop', '힙합'],
  '힙합': ['R&B', 'K-Pop'],
  'R&B': ['보컬', '재즈', 'K-Pop', '힙합'],
  '록': ['인디', '어쿠스틱'],
  '마술': ['코미디'],
  '코미디': ['마술'],
};

export function calculatePerformerMatch(performer: Performer, criteria: MatchingCriteria): MatchingResult {
  const matchReasons: string[] = [];

  // 1. 장르 적합성 (0~100)
  let genreScore = 90;
  if (criteria.genre) {
    const reqGenre = criteria.genre.trim();
    const hasExact = performer.genres.some((g) => g.includes(reqGenre) || reqGenre.includes(g));
    if (hasExact) {
      genreScore = 100;
      matchReasons.push(`희망 장르(${reqGenre}) 완벽 일치`);
    } else {
      const related = RELATED_GENRES[reqGenre] || [];
      const hasRelated = performer.genres.some((g) => related.includes(g));
      if (hasRelated) {
        genreScore = 75;
        matchReasons.push(`행사 무드와 어울리는 ${performer.genres.join(', ')} 장르`);
      } else {
        genreScore = 40;
      }
    }
  }

  // 2. 지역 적합성 (0~100)
  let regionScore = 95;
  if (criteria.region) {
    const reqRegion = criteria.region.trim();
    const isMatched = performer.regions.some(
      (r) => r.includes(reqRegion) || reqRegion.includes(r) || r === '전국'
    );
    if (isMatched) {
      regionScore = 100;
      matchReasons.push(`${reqRegion} 활동 가능 아티스트`);
    } else {
      regionScore = 55;
    }
  }

  // 3. 예산 적합성 (0~100)
  let budgetScore = 90;
  const numBudget = Number(criteria.budget);
  if (numBudget && numBudget > 0) {
    if (performer.fee <= numBudget) {
      budgetScore = Math.min(100, Math.round(92 + ((numBudget - performer.fee) / numBudget) * 8));
      matchReasons.push(`예산(${numBudget}만원) 범위 내 출연료(${performer.fee}만원)`);
    } else if (performer.fee <= numBudget * 1.25) {
      budgetScore = Math.round(85 - ((performer.fee - numBudget) / numBudget) * 30);
      matchReasons.push(`협의 가능한 출연료 범위(${performer.fee}만원)`);
    } else {
      budgetScore = Math.max(35, Math.round(60 - ((performer.fee - numBudget) / numBudget) * 25));
    }
  }

  // 4. 경험 및 평점 (0~100)
  const ratingPart = (performer.rating / 5) * 60; // 최대 60점
  const expPart = Math.min(40, (performer.experienceCount / 100) * 40); // 최대 40점
  const experienceScore = Math.round(Math.min(100, Math.max(70, ratingPart + expPart)));
  if (performer.rating >= 4.8) {
    matchReasons.push(`관객 평점 ${performer.rating}점의 높은 만족도`);
  }

  // 5. 행사 및 관객 규모 적합성 (0~100)
  let audienceScore = 90;
  if (criteria.eventType) {
    audienceScore = 94;
  }
  const numAudience = Number(criteria.audience);
  if (numAudience > 0) {
    if (numAudience > 100 && performer.equipment) {
      audienceScore = 98;
      matchReasons.push('자체 음향 장비 보유로 대규모 공연 가능');
    } else {
      audienceScore = 92;
    }
  }

  // 가중치 적용 종합 점수
  const totalScore = Math.round(
    genreScore * 0.35 +
    regionScore * 0.20 +
    budgetScore * 0.20 +
    experienceScore * 0.15 +
    audienceScore * 0.10
  );

  return {
    performer,
    totalScore,
    breakdown: {
      genre: genreScore,
      region: regionScore,
      budget: budgetScore,
      experience: experienceScore,
      audience: audienceScore,
    },
    matchReasons: matchReasons.slice(0, 3),
  };
}

export function rankPerformersByMatch(
  performersList: Performer[],
  criteria: MatchingCriteria,
  limit = 4
): MatchingResult[] {
  return performersList
    .map((p) => calculatePerformerMatch(p, criteria))
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, limit);
}
