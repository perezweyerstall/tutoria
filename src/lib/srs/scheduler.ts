export type SrsAction = 'again' | 'hard' | 'good' | 'easy';
export type SrsCardState = 'new' | 'learning' | 'review' | 'relearning';

export interface SrsScheduleSnapshot {
  state: SrsCardState;
  dueAt: string;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  lapses: number;
  lastReviewedAt: string | null;
}

export interface SrsTransitionResult extends SrsScheduleSnapshot {
  action: SrsAction;
  humanInterval: string;
  formulaExplanation: string;
}

export const MIN_EASE_FACTOR = 1.3;
export const MAX_EASE_FACTOR = 3.2;
export const DEFAULT_EASE_FACTOR = 2.5;
const TEN_MINUTES_IN_DAYS = 10 / 1440;
const TWELVE_HOURS_IN_DAYS = 0.5;

function clampEase(value: number): number {
  return Math.round(Math.min(MAX_EASE_FACTOR, Math.max(MIN_EASE_FACTOR, value)) * 100) / 100;
}

function roundDays(days: number): number {
  if (days < 0.1) {
    return Math.round(days * 100000) / 100000;
  }
  return Math.round(days * 10) / 10;
}

export function formatIntervalDays(days: number): string {
  const totalMinutes = Math.round(days * 1440);
  if (totalMinutes < 60) {
    return `${Math.max(1, totalMinutes)}m`;
  }
  if (days < 1) {
    const hours = Math.round(days * 24 * 10) / 10;
    return `${hours}h`;
  }
  if (days < 30) {
    const rounded = Math.round(days * 10) / 10;
    return `${rounded}d`;
  }
  const months = Math.round((days / 30) * 10) / 10;
  return `${months}mes`;
}

export function isCardDue(dueAtIso: string, now: Date = new Date()): boolean {
  const dueMs = Date.parse(dueAtIso);
  if (Number.isNaN(dueMs)) return true;
  return dueMs <= now.getTime();
}

export function computeNextSrsState(
  current: SrsScheduleSnapshot,
  action: SrsAction,
  now: Date = new Date()
): SrsTransitionResult {
  const nowIso = now.toISOString();
  const prevInterval = Math.max(0, current.intervalDays);
  const prevEase = current.easeFactor || DEFAULT_EASE_FACTOR;
  const prevReps = Math.max(0, current.repetitions);
  const prevLapses = Math.max(0, current.lapses);

  let nextIntervalDays = prevInterval;
  let nextEase = prevEase;
  let nextReps = prevReps;
  let nextLapses = prevLapses;
  let nextState: SrsCardState = current.state;
  let formulaExplanation = '';

  switch (action) {
    case 'again': {
      nextEase = clampEase(prevEase - 0.2);
      nextReps = 0;
      nextLapses = prevReps > 0 || current.lastReviewedAt ? prevLapses + 1 : prevLapses;
      nextState = prevReps > 0 ? 'relearning' : 'learning';
      nextIntervalDays = roundDays(TEN_MINUTES_IN_DAYS);
      formulaExplanation = `Reinicia repeticiones a 0, facilidad ${prevEase.toFixed(2)} → ${nextEase.toFixed(2)} (−0.20, mínimo ${MIN_EASE_FACTOR.toFixed(2)}), reintento breve en 10 minutos.`;
      break;
    }

    case 'hard': {
      nextEase = clampEase(prevEase - 0.15);
      nextReps = prevReps + 1;
      nextState = 'review';
      if (prevReps === 0 || prevInterval < 0.5) {
        nextIntervalDays = TWELVE_HOURS_IN_DAYS;
        formulaExplanation = `Primer recuerdo con esfuerzo: programa en 12 horas, facilidad ${prevEase.toFixed(2)} → ${nextEase.toFixed(2)} (−0.15).`;
      } else {
        nextIntervalDays = roundDays(Math.max(1, prevInterval * 1.2));
        formulaExplanation = `Intervalo ${prevInterval}d × 1.20 = ${nextIntervalDays}d; facilidad ${prevEase.toFixed(2)} → ${nextEase.toFixed(2)} (−0.15).`;
      }
      break;
    }

    case 'good': {
      nextEase = clampEase(prevEase);
      nextReps = prevReps + 1;
      nextState = 'review';
      if (prevReps === 0) {
        nextIntervalDays = 1;
        formulaExplanation = `Primer recuerdo sólido (rep. 1): intervalo = 1 día, facilidad estable en ${nextEase.toFixed(2)}.`;
      } else if (prevReps === 1) {
        nextIntervalDays = 3;
        formulaExplanation = `Segundo recuerdo sólido (rep. 2): intervalo = 3 días, facilidad estable en ${nextEase.toFixed(2)}.`;
      } else {
        nextIntervalDays = roundDays(Math.max(prevInterval + 1, prevInterval * nextEase));
        formulaExplanation = `Intervalo ${prevInterval}d × facilidad ${nextEase.toFixed(2)} = ${nextIntervalDays}d.`;
      }
      break;
    }

    case 'easy': {
      nextEase = clampEase(prevEase + 0.15);
      nextReps = prevReps + 1;
      nextState = 'review';
      if (prevReps === 0) {
        nextIntervalDays = 4;
        formulaExplanation = `Recuerdo inmediato inicial: intervalo = 4 días, facilidad ${prevEase.toFixed(2)} → ${nextEase.toFixed(2)} (+0.15).`;
      } else {
        nextIntervalDays = roundDays(
          Math.max(prevInterval + 2, prevInterval * nextEase * 1.3)
        );
        formulaExplanation = `Intervalo ${prevInterval}d × facilidad ${nextEase.toFixed(2)} × bono 1.30 = ${nextIntervalDays}d.`;
      }
      break;
    }
  }

  const dueMs = now.getTime() + Math.round(nextIntervalDays * 86_400_000);
  const dueAt = new Date(dueMs).toISOString();

  return {
    action,
    state: nextState,
    dueAt,
    intervalDays: nextIntervalDays,
    easeFactor: nextEase,
    repetitions: nextReps,
    lapses: nextLapses,
    lastReviewedAt: nowIso,
    humanInterval: formatIntervalDays(nextIntervalDays),
    formulaExplanation,
  };
}

export function previewAllSrsActions(
  current: SrsScheduleSnapshot,
  now: Date = new Date()
): Record<SrsAction, SrsTransitionResult> {
  return {
    again: computeNextSrsState(current, 'again', now),
    hard: computeNextSrsState(current, 'hard', now),
    good: computeNextSrsState(current, 'good', now),
    easy: computeNextSrsState(current, 'easy', now),
  };
}
