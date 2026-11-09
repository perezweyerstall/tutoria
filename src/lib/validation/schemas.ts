import { z } from 'zod';

export const subjectEnum = z.enum([
  'mathematics',
  'physics',
  'chemistry',
  'biology',
  'computer-science',
  'language',
  'general-science',
]);

export const sourceFormatEnum = z.enum(['markdown', 'text', 'notes']);

export const unitTypeEnum = z.enum([
  'concept',
  'interactive-lab',
  'worked-example',
  'language-drill',
]);

export const srsActionEnum = z.enum(['again', 'hard', 'good', 'easy']);

export const importLessonSchema = z.object({
  title: z
    .string()
    .trim()
    .max(140, 'El título de la lección no debe superar los 140 caracteres.')
    .optional(),
  subject: subjectEnum.default('mathematics'),
  sourceFormat: sourceFormatEnum.default('markdown'),
  sourceFilename: z.string().trim().max(180).optional().nullable(),
  rawContent: z
    .string()
    .trim()
    .min(12, 'Escribe o pega al menos 12 caracteres de apuntes o Markdown.')
    .max(120_000, 'La lección supera el límite máximo de 120,000 caracteres.'),
});

export const interactiveSliderSchema = z.object({
  symbol: z.string().trim().min(1).max(16),
  label: z.string().trim().min(1).max(60),
  min: z.number().finite(),
  max: z.number().finite(),
  step: z.number().positive().finite(),
  initial: z.number().finite(),
  unit: z.string().trim().max(20).default(''),
});

export const interactiveConfigSchema = z.object({
  kind: z.enum(['formula-explorer', 'step-prediction', 'concept-check']),
  prompt: z.string().trim().min(3).max(500),
  expressionLabel: z.string().trim().max(120).default(''),
  formulaKind: z
    .enum([
      'pendulum-period',
      'spring-energy',
      'linear-kinematics',
      'quadratic',
      'exponential-growth',
      'ohms-law',
      'derivative-secant',
      'weighted-ratio',
    ])
    .default('quadratic'),
  sliders: z.array(interactiveSliderSchema).max(4).default([]),
  checkpointQuestion: z.string().trim().min(3).max(400),
  expectedAnswer: z.string().trim().min(1).max(200),
  numericTolerance: z.number().nonnegative().finite().default(0.15),
  choices: z.array(z.string().trim().min(1).max(200)).max(6).default([]),
  hint: z.string().trim().max(400).default(''),
  explanation: z.string().trim().min(3).max(800),
});

export const createUnitSchema = z.object({
  lessonId: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1, 'El título de la unidad es obligatorio.').max(140),
  topic: z.string().trim().min(1, 'La etiqueta de tema es obligatoria.').max(80),
  unitType: unitTypeEnum.default('concept'),
  body: z.string().trim().min(3, 'El contenido de la unidad no puede estar vacío.').max(30_000),
  keyFormula: z.string().trim().max(160).optional().nullable(),
  estimatedMinutes: z.number().int().min(1).max(120).default(5),
});

export const updateUnitSchema = z.object({
  title: z.string().trim().min(1).max(140).optional(),
  topic: z.string().trim().min(1).max(80).optional(),
  unitType: unitTypeEnum.optional(),
  body: z.string().trim().min(1).max(30_000).optional(),
  keyFormula: z.string().trim().max(160).nullable().optional(),
  estimatedMinutes: z.number().int().min(1).max(120).optional(),
  orderIndex: z.number().int().min(0).max(500).optional(),
  completed: z.boolean().optional(),
  splitAtParagraph: z.number().int().min(1).max(100).optional(),
  interactiveConfig: interactiveConfigSchema.optional(),
});

export const updateLessonSchema = z.object({
  title: z.string().trim().min(1).max(140).optional(),
  subject: subjectEnum.optional(),
  summary: z.string().trim().min(1).max(1000).optional(),
  toggleStepId: z.string().trim().min(1).max(80).optional(),
});

export const generateCandidatesSchema = z.object({
  lessonId: z.string().trim().min(1).max(80),
  unitId: z.string().trim().min(1).max(80).optional(),
});

export const candidateDecisionSchema = z.object({
  decision: z.enum(['approve', 'reject', 'EditOnly', 'edit']).transform((v) =>
    v === 'EditOnly' ? 'edit' : v
  ),
  prompt: z.string().trim().min(2).max(600).optional(),
  answer: z.string().trim().min(1).max(600).optional(),
  topic: z.string().trim().min(1).max(80).optional(),
  options: z.array(z.string().trim().min(1).max(240)).max(6).optional(),
  explanation: z.string().trim().min(2).max(1000).optional(),
});

export const bulkCandidateDecisionSchema = z.object({
  candidateIds: z.array(z.string().trim().min(1).max(80)).min(1).max(200),
  decision: z.enum(['approve', 'reject']),
});

export const reviewFlashcardSchema = z.object({
  action: srsActionEnum,
  reviewedAt: z.string().datetime({ offset: true }).optional(),
});

export const quizAttemptSchema = z.object({
  questionId: z.string().trim().min(1).max(80),
  submittedAnswer: z.string().trim().min(1, 'Selecciona o escribe una respuesta.').max(400),
});

export const createGoalSchema = z.object({
  title: z.string().trim().min(2, 'La meta debe tener al menos 2 caracteres.').max(140),
  metric: z.enum(['weekly_minutes', 'weekly_reviews', 'units_completed']),
  targetValue: z.number().int().min(1).max(10_000),
  period: z.enum(['weekly', 'monthly', 'open']).default('weekly'),
});

export const updateGoalSchema = z.object({
  id: z.string().trim().min(1).max(80),
  title: z.string().trim().min(2).max(140).optional(),
  targetValue: z.number().int().min(1).max(10_000).optional(),
  completed: z.boolean().optional(),
});

export const createSessionSchema = z.object({
  lessonId: z.string().trim().max(80).optional().nullable(),
  topic: z.string().trim().min(1).max(80),
  activityType: z.enum([
    'interactive-lesson',
    'retrieval-review',
    'quiz',
    'language-practice',
    'weak-topic-review',
  ]),
  durationMinutes: z.number().min(0.5).max(600),
  itemsCompleted: z.number().int().min(0).max(1000).default(0),
  reflection: z.string().trim().max(2000).default(''),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
});

export const createNoteSchema = z.object({
  lessonId: z.string().trim().max(80).optional().nullable(),
  unitId: z.string().trim().max(80).optional().nullable(),
  topic: z.string().trim().min(1, 'El tema es obligatorio.').max(80),
  title: z.string().trim().min(1, 'El título del apunte es obligatorio.').max(140),
  body: z.string().trim().min(1, 'El contenido del apunte no puede estar vacío.').max(30_000),
});

export const updateNoteSchema = z.object({
  id: z.string().trim().min(1).max(80),
  topic: z.string().trim().min(1).max(80).optional(),
  title: z.string().trim().min(1).max(140).optional(),
  body: z.string().trim().min(1).max(30_000).optional(),
});

export const createLanguageAttemptSchema = z.object({
  unitId: z.string().trim().max(80).optional().nullable(),
  phrase: z.string().trim().min(2, 'La frase objetivo es obligatoria.').max(500),
  languageLabel: z.string().trim().min(2).max(60).default('Idioma en práctica'),
  captureMode: z.enum(['microphone', 'audio-upload', 'tap-cadence']),
  targetDurationSec: z.number().min(0.3).max(300),
  recordedDurationSec: z.number().min(0.2).max(300),
  activeSpeechSec: z.number().min(0.1).max(300),
  recognizedTranscript: z.string().trim().max(1000).optional().nullable(),
});

export const resetDataSchema = z.object({
  mode: z.enum(['progress-only', 'delete-all']),
  confirmationText: z.enum(['REINICIAR', 'ELIMINAR TODO', 'RESET', 'DELETE ALL']),
  removeBackups: z.boolean().default(false),
});

export const backupCreateSchema = z.object({
  label: z.string().trim().max(60).optional(),
});

export const backupRestoreFileSchema = z.object({
  filename: z.string().trim().min(3).max(140),
});

export const exportBundleSchema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.string(),
  app: z.string(),
  nonAccreditedNotice: z.string().optional(),
  data: z.object({
    lessons: z.array(z.record(z.string(), z.any())),
    learningUnits: z.array(z.record(z.string(), z.any())),
    studyPlanSteps: z.array(z.record(z.string(), z.any())),
    candidateItems: z.array(z.record(z.string(), z.any())).default([]),
    flashcards: z.array(z.record(z.string(), z.any())),
    reviewLogs: z.array(z.record(z.string(), z.any())).default([]),
    quizQuestions: z.array(z.record(z.string(), z.any())),
    quizAttempts: z.array(z.record(z.string(), z.any())).default([]),
    goals: z.array(z.record(z.string(), z.any())).default([]),
    studySessions: z.array(z.record(z.string(), z.any())).default([]),
    notes: z.array(z.record(z.string(), z.any())).default([]),
    languageAttempts: z.array(z.record(z.string(), z.any())).default([]),
  }),
});

export function formatZodError(error: z.ZodError): {
  message: string;
  issues: Array<{ field: string; message: string }>;
} {
  const issues = error.issues.map((issue) => ({
    field: issue.path.join('.') || 'entrada',
    message: issue.message,
  }));
  return {
    message: issues[0]?.message ?? 'Datos de entrada no válidos.',
    issues,
  };
}
