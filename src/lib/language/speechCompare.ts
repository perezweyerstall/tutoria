export interface LanguageComparisonInput {
  phrase: string;
  targetDurationSec: number;
  recordedDurationSec: number;
  activeSpeechSec: number;
  recognizedTranscript?: string | null;
}

export interface WordComparisonToken {
  word: string;
  matched: boolean;
}

export interface LanguageComparisonResult {
  wordCount: number;
  estimatedSyllables: number;
  targetDurationSec: number;
  recordedDurationSec: number;
  activeSpeechSec: number;
  pauseRatio: number;
  wordsPerMinute: number;
  pacingRatio: number;
  pronunciationOverlap: number | null;
  wordTokens: WordComparisonToken[];
  timingBand: 'steady' | 'faster-than-target' | 'slower-than-target';
  feedbackSummary: string;
  nonMedicalNotice: string;
}

export const LANGUAGE_NON_MEDICAL_NOTICE =
  'Retroalimentación exclusiva para práctica personal de idiomas: la duración, la proporción de pausas y la coincidencia de transcripción son referencias informales de estudio y no constituyen una evaluación médica, clínica, audiológica ni de terapia del lenguaje.';

function normalizeTokens(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

export function estimateTargetDurationSec(phrase: string): {
  wordCount: number;
  estimatedSyllables: number;
  recommendedSec: number;
} {
  const words = normalizeTokens(phrase);
  const wordCount = Math.max(1, words.length);
  const vowelClusters = phrase
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .match(/[aeiouy]+/g);
  const estimatedSyllables = Math.max(wordCount, vowelClusters ? vowelClusters.length : wordCount * 2);
  const recommendedSec = Math.max(
    1.2,
    Math.round((estimatedSyllables / 3.2 + 0.35) * 10) / 10
  );
  return { wordCount, estimatedSyllables, recommendedSec };
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = new Array<number>(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) {
      prev[j] = curr[j];
    }
  }
  return prev[b.length];
}

export function compareLanguagePractice(
  input: LanguageComparisonInput
): LanguageComparisonResult {
  const { wordCount, estimatedSyllables } = estimateTargetDurationSec(input.phrase);
  const targetSec = Math.max(0.4, Math.round(input.targetDurationSec * 100) / 100);
  const recordedSec = Math.max(0.2, Math.round(input.recordedDurationSec * 100) / 100);
  const clampedActive = Math.min(recordedSec, Math.max(0.1, input.activeSpeechSec));
  const activeSec = Math.round(clampedActive * 100) / 100;

  const pauseRatio = Math.round(Math.max(0, (recordedSec - activeSec) / recordedSec) * 100) / 100;
  const wordsPerMinute = Math.round((wordCount / (recordedSec / 60)) * 10) / 10;
  const pacingRatio = Math.round((recordedSec / targetSec) * 100) / 100;

  let timingBand: LanguageComparisonResult['timingBand'] = 'steady';
  if (pacingRatio < 0.78) {
    timingBand = 'faster-than-target';
  } else if (pacingRatio > 1.28) {
    timingBand = 'slower-than-target';
  }

  const rawWords = input.phrase
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const targetNorm = normalizeTokens(input.phrase);

  let pronunciationOverlap: number | null = null;
  let wordTokens: WordComparisonToken[] = rawWords.map((w) => ({ word: w, matched: false }));

  if (input.recognizedTranscript && input.recognizedTranscript.trim().length > 0) {
    const spokenNorm = normalizeTokens(input.recognizedTranscript);
    let matchedCount = 0;

    wordTokens = rawWords.map((rawWord) => {
      const cleanTarget = normalizeTokens(rawWord)[0] ?? '';
      if (!cleanTarget) return { word: rawWord, matched: true };

      const hit = spokenNorm.some((spoken) => {
        if (spoken === cleanTarget) return true;
        const maxLen = Math.max(spoken.length, cleanTarget.length);
        if (maxLen >= 4 && levenshteinDistance(spoken, cleanTarget) <= 1) {
          return true;
        }
        return false;
      });
      if (hit) matchedCount += 1;
      return { word: rawWord, matched: hit };
    });

    const joinedTarget = targetNorm.join(' ');
    const joinedSpoken = spokenNorm.join(' ');
    const charMax = Math.max(1, joinedTarget.length, joinedSpoken.length);
    const charSim = Math.max(0, 1 - levenshteinDistance(joinedTarget, joinedSpoken) / charMax);
    const tokenSim = rawWords.length > 0 ? matchedCount / rawWords.length : 0;
    pronunciationOverlap = Math.round((charSim * 0.5 + tokenSim * 0.5) * 100) / 100;
  }

  const feedbackParts: string[] = [];
  if (timingBand === 'steady') {
    feedbackParts.push(
      `El ritmo (${recordedSec.toFixed(1)} s frente a ${targetSec.toFixed(1)} s de referencia, ${wordsPerMinute} PPM) estuvo dentro de un rango conversacional estable.`
    );
  } else if (timingBand === 'faster-than-target') {
    feedbackParts.push(
      `La locución (${recordedSec.toFixed(1)} s frente a ${targetSec.toFixed(1)} s de referencia) fue rápida; prueba dar un poco más de duración a las vocales tónicas.`
    );
  } else {
    feedbackParts.push(
      `La locución (${recordedSec.toFixed(1)} s frente a ${targetSec.toFixed(1)} s de referencia) tomó tiempo adicional; intenta enlazar palabras contiguas en grupos cortos.`
    );
  }

  if (pauseRatio > 0.38) {
    feedbackParts.push(
      `Las pausas representaron el ${Math.round(pauseRatio * 100)} % de la grabación; ensayar bloques de 2 a 3 palabras ayuda a suavizar las transiciones.`
    );
  }

  if (pronunciationOverlap !== null) {
    const pct = Math.round(pronunciationOverlap * 100);
    feedbackParts.push(
      `La coincidencia de palabras fue del ${pct} % (guía de autoestudio, sin valor clínico ni médico).`
    );
  }

  return {
    wordCount,
    estimatedSyllables,
    targetDurationSec: targetSec,
    recordedDurationSec: recordedSec,
    activeSpeechSec: activeSec,
    pauseRatio,
    wordsPerMinute: wordsPerMinute,
    pacingRatio,
    pronunciationOverlap,
    wordTokens,
    timingBand,
    feedbackSummary: feedbackParts.join(' '),
    nonMedicalNotice: LANGUAGE_NON_MEDICAL_NOTICE,
  };
}
