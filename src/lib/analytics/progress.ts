export interface FlashcardAnalyticsInput {
  id: string;
  topic: string;
  state: string;
  dueAt: string;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  lapses: number;
}

export interface ReviewLogAnalyticsInput {
  topic: string;
  action: string;
  reviewedAt: string;
}

export interface QuizQuestionAnalyticsInput {
  id: string;
  topic: string;
  timesAnswered: number;
  timesCorrect: number;
}

export interface StudySessionAnalyticsInput {
  topic: string;
  activityType: string;
  durationMinutes: number;
  itemsCompleted: number;
  startedAt: string;
}

export interface GoalAnalyticsInput {
  id: string;
  title: string;
  metric: string;
  targetValue: number;
  period: string;
  completed: boolean;
}

export interface UnitAnalyticsInput {
  id: string;
  completedAt: string | null;
}

export interface WeeklyVolumePoint {
  weekLabel: string;
  weekStartIso: string;
  minutes: number;
  sessionsCount: number;
}

export interface StabilityDistribution {
  newCount: number;
  learningCount: number;
  familiarCount: number;
  stableCount: number;
  dueNowCount: number;
}

export interface WeakTopicSummary {
  topic: string;
  weaknessScore: number;
  lapses: number;
  strainedReviews: number;
  totalReviews: number;
  quizIncorrect: number;
  quizTotal: number;
  averageEase: number;
  reasons: string[];
}

export interface GoalProgressSummary extends GoalAnalyticsInput {
  currentValue: number;
  progressPercent: number;
}

export interface StreakFreeProgressSummary {
  weeklyVolume: WeeklyVolumePoint[];
  totalStudyMinutes: number;
  thisWeekMinutes: number;
  thisWeekReviews: number;
  completedUnitsCount: number;
  totalUnitsCount: number;
  stability: StabilityDistribution;
  weakTopics: WeakTopicSummary[];
  goalProgress: GoalProgressSummary[];
}

const SPANISH_SHORT_MONTHS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

function getMondayUtc(date: Date): Date {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = copy.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setUTCDate(copy.getUTCDate() + diff);
  return copy;
}

/**
 * Calcula métricas de avance libres de rachas diarias y diagnósticos transparentes de temas débiles.
 */
export function computeStreakFreeProgress(
  input: {
    flashcards: FlashcardAnalyticsInput[];
    reviewLogs: ReviewLogAnalyticsInput[];
    quizQuestions: QuizQuestionAnalyticsInput[];
    sessions: StudySessionAnalyticsInput[];
    goals: GoalAnalyticsInput[];
    units: UnitAnalyticsInput[];
  },
  now: Date = new Date()
): StreakFreeProgressSummary {
  const currentMonday = getMondayUtc(now);
  const weeklyBuckets: WeeklyVolumePoint[] = [];

  for (let offset = 5; offset >= 0; offset--) {
    const start = new Date(currentMonday.getTime() - offset * 7 * 86_400_000);
    const monthStr = SPANISH_SHORT_MONTHS[start.getUTCMonth()];
    const dayNum = start.getUTCDate();
    weeklyBuckets.push({
      weekLabel: `${dayNum} ${monthStr}`,
      weekStartIso: start.toISOString(),
      minutes: 0,
      sessionsCount: 0,
    });
  }

  let totalStudyMinutes = 0;
  for (const session of input.sessions) {
    const mins = Math.max(0, Number(session.durationMinutes) || 0);
    totalStudyMinutes += mins;

    const parsedStart = new Date(session.startedAt);
    if (!Number.isNaN(parsedStart.getTime())) {
      const sessionMondayIso = getMondayUtc(parsedStart).toISOString();
      const bucket = weeklyBuckets.find((b) => b.weekStartIso === sessionMondayIso);
      if (bucket) {
        bucket.minutes = Math.round((bucket.minutes + mins) * 10) / 10;
        bucket.sessionsCount += 1;
      }
    }
  }

  const thisWeekStartMs = currentMonday.getTime();
  const thisWeekMinutes = weeklyBuckets[weeklyBuckets.length - 1]?.minutes ?? 0;
  const thisWeekReviews = input.reviewLogs.filter((log) => {
    const t = Date.parse(log.reviewedAt);
    return !Number.isNaN(t) && t >= thisWeekStartMs;
  }).length;

  const stability: StabilityDistribution = {
    newCount: 0,
    learningCount: 0,
    familiarCount: 0,
    stableCount: 0,
    dueNowCount: 0,
  };

  for (const card of input.flashcards) {
    const dueMs = Date.parse(card.dueAt);
    if (Number.isNaN(dueMs) || dueMs <= now.getTime()) {
      stability.dueNowCount += 1;
    }

    if (card.state === 'new') {
      stability.newCount += 1;
    } else if (card.state === 'learning' || card.state === 'relearning' || card.intervalDays < 1) {
      stability.learningCount += 1;
    } else if (card.intervalDays <= 7) {
      stability.familiarCount += 1;
    } else {
      stability.stableCount += 1;
    }
  }

  const topicStats = new Map<
    string,
    {
      lapses: number;
      easeSum: number;
      cardCount: number;
      strainedReviews: number;
      totalReviews: number;
      quizIncorrect: number;
      quizTotal: number;
    }
  >();

  const ensureTopic = (topic: string) => {
    const key = topic.trim() || 'General';
    let entry = topicStats.get(key);
    if (!entry) {
      entry = {
        lapses: 0,
        easeSum: 0,
        cardCount: 0,
        strainedReviews: 0,
        totalReviews: 0,
        quizIncorrect: 0,
        quizTotal: 0,
      };
      topicStats.set(key, entry);
    }
    return entry;
  };

  for (const card of input.flashcards) {
    const entry = ensureTopic(card.topic);
    entry.lapses += Math.max(0, card.lapses);
    entry.easeSum += card.easeFactor || 2.5;
    entry.cardCount += 1;
  }

  for (const log of input.reviewLogs) {
    const entry = ensureTopic(log.topic);
    entry.totalReviews += 1;
    if (log.action === 'again' || log.action === 'hard') {
      entry.strainedReviews += 1;
    }
  }

  for (const q of input.quizQuestions) {
    const entry = ensureTopic(q.topic);
    entry.quizTotal += Math.max(0, q.timesAnswered);
    entry.quizIncorrect += Math.max(0, q.timesAnswered - q.timesCorrect);
  }

  const weakTopics: WeakTopicSummary[] = [];

  for (const [topic, stats] of topicStats.entries()) {
    const avgEase = stats.cardCount > 0 ? stats.easeSum / stats.cardCount : 2.5;
    const reasons: string[] = [];
    let score = 0;

    if (stats.lapses > 0) {
      score += stats.lapses * 22;
      reasons.push(
        `${stats.lapses} tropiezo${stats.lapses === 1 ? '' : 's'} de recuperación («Otra vez»)`
      );
    }

    if (stats.strainedReviews > 0) {
      const strainRatio = stats.totalReviews > 0 ? stats.strainedReviews / stats.totalReviews : 0;
      if (strainRatio >= 0.35 || stats.strainedReviews >= 2) {
        score += Math.round(strainRatio * 35) + stats.strainedReviews * 6;
        reasons.push(
          `${stats.strainedReviews}/${stats.totalReviews} repasos marcados como Otra vez o Difícil`
        );
      }
    }

    if (stats.cardCount > 0 && avgEase < 2.25) {
      score += Math.round((2.35 - avgEase) * 40);
      reasons.push(`Factor de facilidad promedio reducido (${avgEase.toFixed(2)})`);
    }

    if (stats.quizIncorrect > 0) {
      const missRate = stats.quizTotal > 0 ? stats.quizIncorrect / stats.quizTotal : 0;
      score += stats.quizIncorrect * 18 + Math.round(missRate * 25);
      reasons.push(
        `${stats.quizIncorrect}/${stats.quizTotal} respuestas incorrectas en cuestionarios cortos`
      );
    }

    if (score > 0 && reasons.length > 0) {
      weakTopics.push({
        topic,
        weaknessScore: score,
        lapses: stats.lapses,
        strainedReviews: stats.strainedReviews,
        totalReviews: stats.totalReviews,
        quizIncorrect: stats.quizIncorrect,
        quizTotal: stats.quizTotal,
        averageEase: Math.round(avgEase * 100) / 100,
        reasons,
      });
    }
  }

  weakTopics.sort((a, b) => b.weaknessScore - a.weaknessScore);

  const completedUnitsCount = input.units.filter((u) => Boolean(u.completedAt)).length;

  const goalProgress: GoalProgressSummary[] = input.goals.map((goal) => {
    let currentValue = 0;
    if (goal.metric === 'weekly_minutes') {
      currentValue = Math.round(thisWeekMinutes);
    } else if (goal.metric === 'weekly_reviews') {
      currentValue = thisWeekReviews;
    } else if (goal.metric === 'units_completed') {
      currentValue = completedUnitsCount;
    }
    const progressPercent = Math.min(
      100,
      Math.round((currentValue / Math.max(1, goal.targetValue)) * 100)
    );
    return {
      ...goal,
      currentValue,
      progressPercent,
    };
  });

  return {
    weeklyVolume: weeklyBuckets,
    totalStudyMinutes: Math.round(totalStudyMinutes * 10) / 10,
    thisWeekMinutes,
    thisWeekReviews,
    completedUnitsCount,
    totalUnitsCount: input.units.length,
    stability,
    weakTopics,
    goalProgress,
  };
}
