import crypto from 'node:crypto';
import { toSafeFilename } from '../security/safeFilename';

export type SubjectKind =
  | 'mathematics'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'computer-science'
  | 'language'
  | 'general-science';

export type UnitKind = 'concept' | 'interactive-lab' | 'worked-example' | 'language-drill';

export type FormulaKind =
  | 'pendulum-period'
  | 'spring-energy'
  | 'linear-kinematics'
  | 'quadratic'
  | 'exponential-growth'
  | 'ohms-law'
  | 'derivative-secant'
  | 'weighted-ratio';

export interface InteractiveSlider {
  symbol: string;
  label: string;
  min: number;
  max: number;
  step: number;
  initial: number;
  unit: string;
}

export interface InteractiveConfig {
  kind: 'formula-explorer' | 'step-prediction' | 'concept-check';
  prompt: string;
  expressionLabel: string;
  formulaKind: FormulaKind;
  sliders: InteractiveSlider[];
  checkpointQuestion: string;
  expectedAnswer: string;
  numericTolerance: number;
  choices: string[];
  hint: string;
  explanation: string;
}

export interface ParsedUnitDraft {
  id: string;
  orderIndex: number;
  title: string;
  topic: string;
  unitType: UnitKind;
  body: string;
  keyFormula: string | null;
  interactiveConfig: InteractiveConfig;
  estimatedMinutes: number;
}

export interface ParsedStudyPlanStepDraft {
  id: string;
  unitId: string | null;
  orderIndex: number;
  stepType:
    | 'read-and-explore'
    | 'interactive-checkpoint'
    | 'approve-retrieval'
    | 'spaced-review';
  title: string;
  rationale: string;
  targetMinutes: number;
}

export interface ParsedLessonBundle {
  lessonId: string;
  title: string;
  subject: SubjectKind;
  sourceFormat: 'markdown' | 'text' | 'notes';
  safeSourceFilename: string | null;
  summary: string;
  estimatedMinutes: number;
  units: ParsedUnitDraft[];
  studyPlanSteps: ParsedStudyPlanStepDraft[];
}

function stripMarkdownFormatting(input: string): string {
  return input
    .replace(/^(?:Tema|Tópico|Etiqueta|Concepto|Topic|Tag|Concept)\s*:\s*[^\n]+$/gim, '')
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}

function extractFormula(text: string): string | null {
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  for (const line of lines) {
    const codeMatch = line.match(/`([^`]*=[^`]+)`/);
    if (codeMatch && codeMatch[1].length <= 100) {
      return codeMatch[1].trim();
    }
    const blockMath = line.match(/\$\$([^$]*=[^$]+)\$\$/);
    if (blockMath && blockMath[1].length <= 100) {
      return blockMath[1].trim();
    }
    const inlineEq = line.match(
      /^([A-Za-z][A-Za-z0-9_'()\s]{0,18}=\s*[0-9A-Za-z_+\-*/^().\s]{2,80})$/
    );
    if (inlineEq) {
      return inlineEq[1].trim();
    }
  }
  const anywhereEq = text.match(
    /\b([A-Za-z](?:\([A-Za-z0-9,]+\))?\s*=\s*[0-9A-Za-z_+\-*/^().\s]{3,50})/
  );
  if (anywhereEq) {
    const candidate = anywhereEq[1].split(/[.;,\n]/)[0].trim();
    if (candidate.length >= 5 && candidate.length <= 80 && !candidate.includes('http')) {
      return candidate;
    }
  }
  return null;
}

function inferTopicFromSection(lessonTitle: string, unitTitle: string, body: string): string {
  const topicTagMatch = body.match(
    /(?:^|\n)\s*(?:Tema|Tópico|Etiqueta|Concepto|Topic|Tag|Concept)\s*:\s*([^\n]+)/i
  );
  if (topicTagMatch) {
    return stripMarkdownFormatting(topicTagMatch[1]).slice(0, 72);
  }
  const cleanedUnit = stripMarkdownFormatting(unitTitle);
  if (
    cleanedUnit &&
    !/^(introducción|resumen|ejemplo|práctica|parte\s+\d+|sección\s+\d+|introduction|overview|summary|example|practice|part\s+\d+|section\s+\d+)$/i.test(
      cleanedUnit
    )
  ) {
    return cleanedUnit.slice(0, 72);
  }
  return stripMarkdownFormatting(lessonTitle).slice(0, 72) || 'Estudio general';
}

function classifyUnitType(
  subject: SubjectKind,
  title: string,
  body: string,
  keyFormula: string | null
): UnitKind {
  const lower = `${title}\n${body}`.toLowerCase();
  if (
    subject === 'language' ||
    /\b(pronunciaci[oó]n|frase|cadencia|s[ií]laba|voz alta|di[aá]logo|pronunciation|phrase|cadence|syllable|say aloud|dialogue)\b/.test(
      lower
    )
  ) {
    return 'language-drill';
  }
  if (
    /\b(ejemplo resuelto|ejemplo\b|resuelve\b|paso\s*1|dado:|worked example|example\b|solve\b|step\s*1|given:)/.test(
      lower
    )
  ) {
    return 'worked-example';
  }
  if (
    keyFormula ||
    /\b(explora|par[aá]metro|proporcional|derivada|pendiente|velocidad|per[ií]odo|energ[ií]a|voltaje|tasa|explore|parameter|proportional|derivative|slope|velocity|period|energy|voltage|rate)\b/.test(
      lower
    )
  ) {
    return 'interactive-lab';
  }
  return 'concept';
}

export function buildInteractiveConfig(
  title: string,
  body: string,
  keyFormula: string | null,
  subject: SubjectKind
): InteractiveConfig {
  const combined = `${title}\n${body}\n${keyFormula ?? ''}`.toLowerCase();

  if (/\b(p[eé]ndulo|pendulum|oscil|arm[oó]nic|harmonic|sqrt\s*\(\s*l\s*\/\s*g)\b/.test(combined)) {
    return {
      kind: 'formula-explorer',
      prompt:
        'Ajusta la longitud L de la cuerda y la gravedad g para observar cómo responde de forma no lineal el período T del péndulo.',
      expressionLabel: keyFormula || 'T = 2π · √(L / g)',
      formulaKind: 'pendulum-period',
      sliders: [
        { symbol: 'L', label: 'Longitud L', min: 0.25, max: 4.0, step: 0.25, initial: 1.0, unit: 'm' },
        { symbol: 'g', label: 'Gravedad g', min: 1.6, max: 24.8, step: 0.2, initial: 9.8, unit: 'm/s²' },
      ],
      checkpointQuestion:
        'Ajusta L = 4.0 m y g = 9.8 m/s² (cuatro veces la longitud de 1.0 m). ¿Qué período T (en segundos) tiene el péndulo?',
      expectedAnswer: '4.01',
      numericTolerance: 0.12,
      choices: [],
      hint: 'Cuadruplicar L dentro de √(L / g) multiplica el período T por √4 = 2.',
      explanation:
        'Como T = 2π√(L/g), el período escala con la raíz cuadrada de la longitud: al pasar de 1 m a 4 m, T se duplica de ~2.01 s a ~4.01 s.',
    };
  }

  if (/\b(resorte|spring|hooke|cin[eé]tica|kinetic|0\.5\s*\*\s*[km]|1\/2\s*[km]|x\^2|v\^2)\b/.test(combined)) {
    return {
      kind: 'formula-explorer',
      prompt:
        'Modifica el coeficiente k y el desplazamiento o rapidez x para visualizar el crecimiento cuadrático en E = ½·k·x².',
      expressionLabel: keyFormula || 'E = 0.5 · k · x²',
      formulaKind: 'spring-energy',
      sliders: [
        { symbol: 'k', label: 'Coeficiente k', min: 1, max: 10, step: 1, initial: 4, unit: 'N/m' },
        { symbol: 'x', label: 'Desplazamiento x', min: 0, max: 6, step: 0.5, initial: 2, unit: 'm' },
      ],
      checkpointQuestion:
        'Usando el explorador, ¿cuánto vale la energía E cuando k = 4 y x = 3?',
      expectedAnswer: '18',
      numericTolerance: 0.1,
      choices: [],
      hint: 'Calcula 0.5 × 4 × 3². Observa cómo elevar x al cuadrado domina frente a los cambios lineales.',
      explanation:
        'Al sustituir k = 4 y x = 3 en E = 0.5 · k · x² obtenemos 0.5 × 4 × 9 = 18.',
    };
  }

  if (
    /\b(derivada|derivative|tangente|tangent|secante|secant|instant[aá]nea|l[ií]mite|limit|d\/dx|f'\(x\)|linealizaci[oó]n|linearization)\b/.test(
      combined
    )
  ) {
    return {
      kind: 'formula-explorer',
      prompt:
        'Desliza el tamaño de paso h hacia 0 para ver cómo la pendiente secante converge hacia la pendiente tangente sobre f(x) = x².',
      expressionLabel: keyFormula || 'm_sec = ((x₀ + h)² − x₀²) / h = 2x₀ + h',
      formulaKind: 'derivative-secant',
      sliders: [
        { symbol: 'x0', label: 'Punto x₀', min: -3, max: 4, step: 0.5, initial: 3, unit: '' },
        { symbol: 'h', label: 'Paso h', min: 0.05, max: 2.5, step: 0.05, initial: 1.0, unit: '' },
      ],
      checkpointQuestion:
        'En x₀ = 3 sobre f(x) = x², ¿a qué pendiente exacta se aproxima la recta secante cuando h → 0?',
      expectedAnswer: '6',
      numericTolerance: 0.1,
      choices: [],
      hint: 'Simplifica ((3 + h)² − 9) / h = 6 + h y acerca h a cero.',
      explanation:
        'El cociente incremental se simplifica a 2x₀ + h. Al evaluar en x₀ = 3 cuando h → 0 resulta f′(3) = 6.',
    };
  }

  if (
    /\b(ohm|voltaje|voltage|corriente|current|resistencia|resistance|circuito|circuit|v\s*=\s*i\s*\*\s*r|i\s*=\s*v\s*\/\s*r)\b/.test(
      combined
    )
  ) {
    return {
      kind: 'formula-explorer',
      prompt:
        'Explora la proporcionalidad directa e inversa en I = V / R variando el voltaje V y la resistencia R.',
      expressionLabel: keyFormula || 'I = V / R',
      formulaKind: 'ohms-law',
      sliders: [
        { symbol: 'V', label: 'Voltaje V', min: 1, max: 24, step: 1, initial: 12, unit: 'V' },
        { symbol: 'R', label: 'Resistencia R', min: 1, max: 12, step: 0.5, initial: 4, unit: 'Ω' },
      ],
      checkpointQuestion:
        'Si el voltaje es V = 12 V y la resistencia R se duplica de 3 Ω a 6 Ω, ¿cuál es la corriente resultante I (en A)?',
      expectedAnswer: '2',
      numericTolerance: 0.05,
      choices: [],
      hint: 'Con voltaje fijo, la corriente es inversamente proporcional a la resistencia: I = 12 / 6.',
      explanation:
        'Por I = V / R, duplicar la resistencia manteniendo V = 12 V reduce la corriente a la mitad: de 4 A a 2 A.',
    };
  }

  if (
    /\b(exponencial|exponential|decaimiento|decay|vida media|half-life|compuesto|crecimiento|growth|e\^|poblaci[oó]n|population)\b/.test(
      combined
    )
  ) {
    return {
      kind: 'formula-explorer',
      prompt:
        'Ajusta la cantidad inicial N₀ y la tasa continua r en N(t) = N₀ · e^(r·t) para comparar crecimiento (r > 0) y decaimiento (r < 0).',
      expressionLabel: keyFormula || 'N(t) = N₀ · e^(r · t)',
      formulaKind: 'exponential-growth',
      sliders: [
        { symbol: 'N0', label: 'Inicial N₀', min: 10, max: 200, step: 10, initial: 100, unit: '' },
        { symbol: 'r', label: 'Tasa r', min: -0.5, max: 0.5, step: 0.05, initial: 0.2, unit: '/t' },
      ],
      checkpointQuestion:
        'Cuando N₀ = 100 y la tasa es r = 0, ¿en qué valor permanece N(t) para t = 5?',
      expectedAnswer: '100',
      numericTolerance: 0.5,
      choices: [],
      hint: 'Cuando r = 0, e^(0 · t) = 1 para todo instante t.',
      explanation:
        'Una tasa igual a cero implica ausencia de crecimiento o decaimiento: N(5) = 100 · e⁰ = 100.',
    };
  }

  if (
    /\b(velocidad|velocity|aceleraci[oó]n|acceleration|cinem[aá]tica|kinematics|v0|desplazamiento|displacement|movimiento|motion)\b/.test(
      combined
    )
  ) {
    return {
      kind: 'formula-explorer',
      prompt:
        'Ajusta la velocidad inicial v₀ y la aceleración constante a para inspeccionar v(t) = v₀ + a·t en el tiempo.',
      expressionLabel: keyFormula || 'v(t) = v₀ + a · t',
      formulaKind: 'linear-kinematics',
      sliders: [
        { symbol: 'v0', label: 'Inicial v₀', min: -5, max: 15, step: 1, initial: 2, unit: 'm/s' },
        { symbol: 'a', label: 'Aceleración a', min: -4, max: 6, step: 0.5, initial: 3, unit: 'm/s²' },
      ],
      checkpointQuestion:
        '¿Cuánto vale v(4) en m/s cuando la velocidad inicial es v₀ = 2 m/s y la aceleración es a = 3 m/s²?',
      expectedAnswer: '14',
      numericTolerance: 0.1,
      choices: [],
      hint: 'Suma el incremento de velocidad durante 4 segundos (3 × 4) a v₀ = 2.',
      explanation: 'v(4) = 2 + 3 × 4 = 14 m/s.',
    };
  }

  if (subject === 'mathematics' || keyFormula) {
    return {
      kind: 'formula-explorer',
      prompt:
        'Interactúa con el parámetro cuadrático a y el término lineal b sobre y(x) = a·x² + b·x para observar cómo compiten ambos términos.',
      expressionLabel: keyFormula || 'y(x) = a · x² + b · x',
      formulaKind: 'quadratic',
      sliders: [
        { symbol: 'a', label: 'Cuadrático a', min: -3, max: 3, step: 0.5, initial: 1, unit: '' },
        { symbol: 'b', label: 'Lineal b', min: -6, max: 6, step: 1, initial: 3, unit: '' },
      ],
      checkpointQuestion: 'Evalúa y(2) cuando a = 1 y b = 3 en y(x) = a·x² + b·x.',
      expectedAnswer: '10',
      numericTolerance: 0.1,
      choices: [],
      hint: 'Sustituye x = 2: 1·(2²) + 3·(2).',
      explanation: 'En x = 2, el término a·x² aporta 4 y el término b·x aporta 6, sumando y(2) = 10.',
    };
  }

  const plainSentences = stripMarkdownFormatting(body)
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 20);

  const anchorSentence =
    plainSentences[0] ||
    `La recuperación activa fortalece la comprensión de ${stripMarkdownFormatting(title)}.`;

  return {
    kind: 'concept-check',
    prompt:
      'Explora el índice de práctica activa abajo y verifica la idea central de esta unidad antes de avanzar.',
    expressionLabel: 'Índice de retención = Profundidad activa ÷ (1 + Lectura pasiva)',
    formulaKind: 'weighted-ratio',
    sliders: [
      { symbol: 'depth', label: 'Práctica activa', min: 1, max: 10, step: 1, initial: 6, unit: 'pts' },
      { symbol: 'load', label: 'Lectura pasiva', min: 0, max: 9, step: 1, initial: 2, unit: 'pts' },
    ],
    checkpointQuestion: `¿Cuál enunciado resume con precisión la idea principal de «${stripMarkdownFormatting(title)}»?`,
    expectedAnswer: anchorSentence.slice(0, 180),
    numericTolerance: 0,
    choices: [
      anchorSentence.slice(0, 180),
      `Ocurre exactamente lo contrario sin importar las condiciones en ${stripMarkdownFormatting(title)}.`,
      `Ninguna relación ni condición aplica dentro de ${stripMarkdownFormatting(title)}.`,
    ],
    hint: 'Relee el principio inicial de esta unidad de aprendizaje y compara la condición exacta.',
    explanation: `Tomado directamente de tu unidad: «${anchorSentence.slice(0, 220)}»`,
  };
}

interface RawSection {
  title: string;
  body: string;
}

function splitRawContentIntoSections(rawContent: string, fallbackTitle: string): RawSection[] {
  const normalized = rawContent.replace(/\r\n/g, '\n').trim();
  const lines = normalized.split('\n');

  const headingIndices: Array<{ index: number; level: number; text: string }> = [];
  lines.forEach((line, idx) => {
    const match = line.match(/^(#{1,4})\s+(.+)$/);
    if (match) {
      headingIndices.push({
        index: idx,
        level: match[1].length,
        text: stripMarkdownFormatting(match[2]),
      });
    }
  });

  if (headingIndices.length >= 2) {
    const sections: RawSection[] = [];
    const preHeading = lines.slice(0, headingIndices[0].index).join('\n').trim();
    if (preHeading.length > 30) {
      sections.push({
        title: `${fallbackTitle}: Panorama inicial`,
        body: preHeading,
      });
    }

    for (let i = 0; i < headingIndices.length; i++) {
      const current = headingIndices[i];
      const nextLineIdx =
        i + 1 < headingIndices.length ? headingIndices[i + 1].index : lines.length;
      const sectionBody = lines
        .slice(current.index + 1, nextLineIdx)
        .join('\n')
        .trim();

      if (sectionBody.length > 0) {
        sections.push({
          title: current.text || `Unidad ${sections.length + 1}`,
          body: sectionBody,
        });
      }
    }

    if (sections.length > 0) {
      return sections;
    }
  }

  const hrBlocks = normalized
    .split(/\n\s*---+\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (hrBlocks.length >= 2) {
    return hrBlocks.map((block, idx) => {
      const firstLine = block.split('\n')[0].trim();
      const headingMatch = firstLine.match(/^#{1,4}\s+(.+)$/);
      if (headingMatch) {
        return {
          title: stripMarkdownFormatting(headingMatch[1]),
          body: block.split('\n').slice(1).join('\n').trim() || block,
        };
      }
      const shortHeading = stripMarkdownFormatting(firstLine).slice(0, 64);
      return {
        title: shortHeading || `${fallbackTitle} — Parte ${idx + 1}`,
        body: block,
      };
    });
  }

  const paragraphs = normalized
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => !/^#{1}\s+/.test(p) && p.length > 0);

  if (paragraphs.length === 0) {
    return [{ title: fallbackTitle, body: normalized }];
  }

  if (paragraphs.length <= 4) {
    return paragraphs.map((para, idx) => {
      const colonMatch = para.match(/^([\p{L}\p{N}\s\-()']{3,50}):\s+/u);
      const derivedTitle = colonMatch
        ? stripMarkdownFormatting(colonMatch[1])
        : stripMarkdownFormatting(para.split(/[.!?\n]/)[0]).slice(0, 56) ||
          `${fallbackTitle} — Unidad ${idx + 1}`;
      return {
        title: derivedTitle,
        body: para,
      };
    });
  }

  const grouped: RawSection[] = [];
  for (let i = 0; i < paragraphs.length; i += 2) {
    const chunk = paragraphs.slice(i, i + 2).join('\n\n');
    const firstSentence = stripMarkdownFormatting(paragraphs[i].split(/[.!?\n]/)[0]).slice(0, 56);
    grouped.push({
      title: firstSentence || `${fallbackTitle} — Unidad ${grouped.length + 1}`,
      body: chunk,
    });
  }

  return grouped;
}

export function parseLessonIntoStudyPlan(input: {
  title?: string;
  subject: SubjectKind;
  sourceFormat: 'markdown' | 'text' | 'notes';
  sourceFilename?: string | null;
  rawContent: string;
}): ParsedLessonBundle {
  const normalized = input.rawContent.replace(/\r\n/g, '\n').trim();
  const h1Match = normalized.match(/^#\s+(.+)$/m);
  const firstNonEmptyLine = normalized
    .split('\n')
    .map((l) => stripMarkdownFormatting(l))
    .find((l) => l.length >= 3);

  const resolvedTitle =
    (input.title && input.title.trim()) ||
    (h1Match ? stripMarkdownFormatting(h1Match[1]) : '') ||
    (firstNonEmptyLine ? firstNonEmptyLine.slice(0, 80) : 'Lección de estudio sin título');

  const safeSourceFilename = input.sourceFilename
    ? toSafeFilename(input.sourceFilename, { fallback: 'apuntes-leccion', maxLength: 64 })
    : null;

  const rawSections = splitRawContentIntoSections(normalized, resolvedTitle);
  const lessonId = crypto.randomUUID();

  const units: ParsedUnitDraft[] = rawSections.map((section, idx) => {
    const keyFormula = extractFormula(section.body);
    const unitType = classifyUnitType(input.subject, section.title, section.body, keyFormula);
    const topic = inferTopicFromSection(resolvedTitle, section.title, section.body);
    const wordCount = section.body.split(/\s+/).filter(Boolean).length;
    const estimatedMinutes = Math.max(3, Math.min(20, Math.ceil(wordCount / 45) + 2));
    const interactiveConfig = buildInteractiveConfig(
      section.title,
      section.body,
      keyFormula,
      input.subject
    );

    return {
      id: crypto.randomUUID(),
      orderIndex: idx,
      title: section.title.slice(0, 140),
      topic,
      unitType,
      body: section.body,
      keyFormula,
      interactiveConfig,
      estimatedMinutes,
    };
  });

  const studyPlanSteps: ParsedStudyPlanStepDraft[] = [];
  units.forEach((unit, idx) => {
    studyPlanSteps.push({
      id: crypto.randomUUID(),
      unitId: unit.id,
      orderIndex: idx,
      stepType: 'interactive-checkpoint',
      title: `Unidad ${idx + 1}: ${unit.title}`,
      rationale:
        unit.unitType === 'language-drill'
          ? 'Lee la estructura de la frase y practica el ritmo y la pronunciación en el Laboratorio de Idiomas.'
          : 'Lee el concepto, manipula los deslizadores interactivos y resuelve el punto de verificación.',
      targetMinutes: unit.estimatedMinutes,
    });
  });

  studyPlanSteps.push({
    id: crypto.randomUUID(),
    unitId: null,
    orderIndex: studyPlanSteps.length,
    stepType: 'approve-retrieval',
    title: 'Generar y aprobar tarjetas y cuestionario corto',
    rationale:
      'Revisa los borradores generados; edita o descarta los que no aporten valor antes de programarlos.',
    targetMinutes: 4,
  });

  studyPlanSteps.push({
    id: crypto.randomUUID(),
    unitId: null,
    orderIndex: studyPlanSteps.length,
    stepType: 'spaced-review',
    title: 'Completar la primera pasada de repaso espaciado',
    rationale:
      'Practica los elementos aprobados usando intervalos transparentes Otra vez / Difícil / Bien / Fácil (autoestudio personal, sin validez académica acreditada).',
    targetMinutes: 5,
  });

  const totalMinutes = studyPlanSteps.reduce((sum, s) => sum + s.targetMinutes, 0);
  const summaryPlain = stripMarkdownFormatting(units[0]?.body ?? normalized)
    .replace(/\s+/g, ' ')
    .slice(0, 240);

  return {
    lessonId,
    title: resolvedTitle.slice(0, 140),
    subject: input.subject,
    sourceFormat: input.sourceFormat,
    safeSourceFilename,
    summary:
      summaryPlain.length >= 20
        ? summaryPlain
        : `${units.length} unidades de aprendizaje editables preparadas para tu estudio interactivo personal.`,
    estimatedMinutes: totalMinutes,
    units,
    studyPlanSteps,
  };
}
