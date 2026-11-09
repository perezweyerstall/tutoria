import crypto from 'node:crypto';
import { z } from 'zod';

export interface UnitInputForGeneration {
  id: string;
  title: string;
  topic: string;
  unitType: string;
  body: string;
  keyFormula: string | null;
}

export interface GeneratedCandidateDraft {
  id: string;
  lessonId: string;
  unitId: string | null;
  itemType: 'flashcard' | 'quiz';
  topic: string;
  prompt: string;
  answer: string;
  options: string[];
  explanation: string;
  generatorSource: 'local-deterministic' | 'configured-ai';
  status: 'pending';
}

function cleanText(text: string): string {
  return text
    .replace(/^(?:Tema|Tópico|Etiqueta|Concepto|Topic|Tag|Concept)\s*:\s*[^\n]+$/gim, '')
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
}

function extractDefinitionPairs(body: string): Array<{ term: string; definition: string }> {
  const pairs: Array<{ term: string; definition: string }> = [];
  const lines = body.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.replace(/^[-*•]\s+/, '').trim();
    const boldColon = line.match(/^\*\*([^*]{2,60})\*\*\s*(?::|—|-)\s*(.{12,300})$/);
    if (boldColon) {
      pairs.push({
        term: cleanText(boldColon[1]),
        definition: cleanText(boldColon[2]),
      });
      continue;
    }

    const plainColon = line.match(/^([\p{Lu}][\p{L}\p{N}\s\-()'/]{2,48}):\s+(.{15,300})$/u);
    if (
      plainColon &&
      !/^(tema|t[oó]pico|etiqueta|concepto|ejemplo|ejemplo resuelto|dado|paso\s*\d+|nota|frase|topic|tag|concept|example|worked example|given|find|step\s*\d+|note|phrase)$/i.test(
        plainColon[1].trim()
      )
    ) {
      pairs.push({
        term: cleanText(plainColon[1]),
        definition: cleanText(plainColon[2]),
      });
    }
  }

  return pairs;
}

function buildDistractors(
  correctAnswer: string,
  siblingAnswers: string[],
  unitTitle: string
): string[] {
  const pool = siblingAnswers
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.toLowerCase() !== correctAnswer.toLowerCase());

  const chosen: string[] = [];
  for (const candidate of pool) {
    if (chosen.length >= 3) break;
    if (!chosen.some((c) => c.toLowerCase() === candidate.toLowerCase())) {
      chosen.push(candidate.slice(0, 200));
    }
  }

  const fallbackDistractors = [
    `La magnitud permanece constante sin importar cómo cambien los parámetros en ${unitTitle}.`,
    `Escala exactamente en sentido opuesto a la relación planteada en ${unitTitle}.`,
    `Solo importan los valores iniciales de borde; las tasas intermedias no tienen efecto.`,
  ];

  for (const fb of fallbackDistractors) {
    if (chosen.length >= 3) break;
    if (
      fb.toLowerCase() !== correctAnswer.toLowerCase() &&
      !chosen.some((c) => c.toLowerCase() === fb.toLowerCase())
    ) {
      chosen.push(fb);
    }
  }

  const allOptions = [correctAnswer.slice(0, 200), ...chosen.slice(0, 3)];
  return allOptions.sort((a, b) => {
    const hashA = a.split('').reduce((acc, ch, idx) => acc + ch.charCodeAt(0) * (idx + 1), 0);
    const hashB = b.split('').reduce((acc, ch, idx) => acc + ch.charCodeAt(0) * (idx + 1), 0);
    return hashA - hashB;
  });
}

/**
 * Generador local determinista: produce borradores PENDIENTES de tarjetas y cuestionarios cortos
 * a partir de las unidades escritas por la persona usuaria, sin llamadas de red.
 */
export function generateDeterministicCandidates(
  lessonId: string,
  units: UnitInputForGeneration[]
): GeneratedCandidateDraft[] {
  const candidates: GeneratedCandidateDraft[] = [];

  const unitTakeaways = units.map((u) => {
    const sentences = cleanText(u.body)
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 18);
    return (
      sentences[0] ||
      (u.keyFormula
        ? `Se rige por la expresión ${u.keyFormula}.`
        : `Principio clave de ${cleanText(u.title)}.`)
    );
  });

  units.forEach((unit, idx) => {
    const unitTitle = cleanText(unit.title);
    const pairs = extractDefinitionPairs(unit.body);
    const sentences = cleanText(unit.body)
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 18);

    // 1. Tarjetas de definición
    for (const pair of pairs.slice(0, 2)) {
      candidates.push({
        id: crypto.randomUUID(),
        lessonId,
        unitId: unit.id,
        itemType: 'flashcard',
        topic: unit.topic,
        prompt: `Define «${pair.term}» en el contexto de ${unitTitle}.`,
        answer: pair.definition,
        options: [],
        explanation: `Extraído de tu unidad «${unitTitle}»: ${pair.term} — ${pair.definition}`,
        generatorSource: 'local-deterministic',
        status: 'pending',
      });
    }

    // 2. Tarjeta y pregunta de fórmula
    if (unit.keyFormula) {
      candidates.push({
        id: crypto.randomUUID(),
        lessonId,
        unitId: unit.id,
        itemType: 'flashcard',
        topic: unit.topic,
        prompt: `¿Cuál es la relación matemática clave en «${unitTitle}» y qué conecta?`,
        answer: `${unit.keyFormula}${sentences[0] ? ` — ${sentences[0]}` : ''}`,
        options: [],
        explanation: `Recuerda tanto la expresión simbólica (${unit.keyFormula}) como el significado físico o matemático de cada variable.`,
        generatorSource: 'local-deterministic',
        status: 'pending',
      });

      const formulaOptions = buildDistractors(
        unit.keyFormula,
        [
          ...units
            .filter((other) => other.id !== unit.id && other.keyFormula)
            .map((other) => other.keyFormula as string),
          `${unit.keyFormula.split('=')[0].trim()} = constante`,
          `1 / (${unit.keyFormula.split('=')[1]?.trim() || 'x'})`,
        ],
        unitTitle
      );

      candidates.push({
        id: crypto.randomUUID(),
        lessonId,
        unitId: unit.id,
        itemType: 'quiz',
        topic: unit.topic,
        prompt: `¿Qué expresión representa la relación estudiada en «${unitTitle}»?`,
        answer: unit.keyFormula.slice(0, 200),
        options: formulaOptions,
        explanation: `En tu unidad «${unitTitle}», la relación definida es ${unit.keyFormula}.`,
        generatorSource: 'local-deterministic',
        status: 'pending',
      });
    } else if (pairs.length === 0) {
      const lead = sentences[0] || cleanText(unit.body).slice(0, 220);
      candidates.push({
        id: crypto.randomUUID(),
        lessonId,
        unitId: unit.id,
        itemType: 'flashcard',
        topic: unit.topic,
        prompt: `Resume el principio central de «${unitTitle}».`,
        answer: lead,
        options: [],
        explanation:
          sentences[1] || `Repasa la unidad «${unitTitle}» para conectar este principio con ejemplos concretos.`,
        generatorSource: 'local-deterministic',
        status: 'pending',
      });
    }

    // 3. Pregunta conceptual corta por unidad
    const correctConcept =
      pairs[0]?.definition || unitTakeaways[idx] || cleanText(unit.body).slice(0, 180);
    const conceptPrompt = pairs[0]
      ? `¿Qué enunciado describe mejor «${pairs[0].term}»?`
      : `Según tus apuntes en «${unitTitle}», ¿cuál afirmación es correcta?`;

    const siblingPool = [
      ...unitTakeaways.filter((_, i) => i !== idx),
      ...pairs.slice(1).map((p) => p.definition),
    ];

    candidates.push({
      id: crypto.randomUUID(),
      lessonId,
      unitId: unit.id,
      itemType: 'quiz',
      topic: unit.topic,
      prompt: conceptPrompt,
      answer: correctConcept.slice(0, 200),
      options: buildDistractors(correctConcept.slice(0, 200), siblingPool, unitTitle),
      explanation: `De la unidad «${unitTitle}»: ${correctConcept.slice(0, 260)}`,
      generatorSource: 'local-deterministic',
      status: 'pending',
    });
  });

  return candidates;
}

const aiResponseSchema = z.object({
  items: z
    .array(
      z.object({
        itemType: z.enum(['flashcard', 'quiz']),
        topic: z.string().min(1).max(80),
        prompt: z.string().min(4).max(500),
        answer: z.string().min(1).max(400),
        options: z.array(z.string().min(1).max(200)).max(6).default([]),
        explanation: z.string().min(3).max(600),
      })
    )
    .min(1),
});

export async function generateCandidateItemsWithFallback(
  lessonId: string,
  units: UnitInputForGeneration[]
): Promise<{
  candidates: GeneratedCandidateDraft[];
  source: 'local-deterministic' | 'configured-ai';
  notice: string;
}> {
  const apiKey = process.env.OPTIONAL_AI_API_KEY?.trim();
  const baseUrl = process.env.OPTIONAL_AI_BASE_URL?.trim();
  const model = process.env.OPTIONAL_AI_MODEL?.trim() || 'gpt-4o-mini';

  if (!apiKey || !baseUrl) {
    const candidates = generateDeterministicCandidates(lessonId, units);
    return {
      candidates,
      source: 'local-deterministic',
      notice:
        'Borradores generados localmente con reglas deterministas integradas (sin requerir APIs externas). Revísalos y apruébalos abajo antes de incorporarlos a tu mazo.',
    };
  }

  try {
    const endpoint = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Genera en español latino borradores de tarjetas de estudio y preguntas cortas de opción múltiple basados estrictamente en las unidades proporcionadas. Devuelve JSON { "items": [{ "itemType": "flashcard"|"quiz", "topic": string, "prompt": string, "answer": string, "options": string[], "explanation": string }] }.',
          },
          {
            role: 'user',
            content: JSON.stringify(
              units.map((u) => ({
                title: u.title,
                topic: u.topic,
                formula: u.keyFormula,
                body: u.body.slice(0, 1500),
              }))
            ),
          },
        ],
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      throw new Error(`El endpoint opcional devolvió HTTP ${response.status}`);
    }

    const payload = await response.json();
    const rawJson = payload?.choices?.[0]?.message?.content;
    const parsed = aiResponseSchema.parse(JSON.parse(rawJson));

    const candidates: GeneratedCandidateDraft[] = parsed.items.map((item) => ({
      id: crypto.randomUUID(),
      lessonId,
      unitId: units[0]?.id ?? null,
      itemType: item.itemType,
      topic: item.topic,
      prompt: item.prompt,
      answer: item.answer,
      options: item.itemType === 'quiz' ? item.options : [],
      explanation: item.explanation,
      generatorSource: 'configured-ai',
      status: 'pending',
    }));

    return {
      candidates,
      source: 'configured-ai',
      notice:
        'Borradores generados mediante el endpoint configurado. Nada entra al repaso hasta que lo apruebes explícitamente abajo.',
    };
  } catch (err) {
    const fallbackCandidates = generateDeterministicCandidates(lessonId, units);
    const reason = err instanceof Error ? err.message : 'Endpoint no disponible';
    return {
      candidates: fallbackCandidates,
      source: 'local-deterministic',
      notice: `El generador externo configurado no estuvo disponible (${reason}); se utilizó automáticamente el generador determinista local integrado. Revisa y aprueba tus borradores abajo.`,
    };
  }
}
