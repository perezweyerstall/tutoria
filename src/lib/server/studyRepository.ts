import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { asc, desc, eq } from 'drizzle-orm';
import { getDb, getResolvedBackupDir, getResolvedDatabasePath, schema } from '@/db';
import {
  buildInteractiveConfig,
  parseLessonIntoStudyPlan,
  type InteractiveConfig,
  type SubjectKind,
} from '@/lib/transform/lessonParser';
import { generateCandidateItemsWithFallback } from '@/lib/transform/candidateGenerator';
import {
  computeNextSrsState,
  isCardDue,
  previewAllSrsActions,
  type SrsAction,
  type SrsCardState,
} from '@/lib/srs/scheduler';
import { computeStreakFreeProgress } from '@/lib/analytics/progress';
import { compareLanguagePractice } from '@/lib/language/speechCompare';
import { resolveSafeChildPath, toSafeFilename } from '@/lib/security/safeFilename';
import { exportBundleSchema } from '@/lib/validation/schemas';
import {
  PBA_ELECTROMECANICA_LESSONS,
  PBA_ELECTROMECANICA_CURRICULUM,
  type PBACurriculumYear,
} from '@/lib/curriculum/electromecanicaPBA';

export const NON_ACCREDITED_NOTICE =
  'Herramienta exclusiva de autoestudio personal. TutorIA convierte tus propios apuntes en práctica interactiva y repaso espaciado; no ofrece instrucción acreditada, calificaciones oficiales, certificados, cursos con licencia ni evaluaciones médicas.';

export interface LocalBackupFileInfo {
  filename: string;
  sizeBytes: number;
  createdAt: string;
}

export function listLocalBackups(): LocalBackupFileInfo[] {
  const backupDir = getResolvedBackupDir();
  if (!fs.existsSync(backupDir)) {
    return [];
  }
  const entries = fs.readdirSync(backupDir, { withFileTypes: true });
  const files: LocalBackupFileInfo[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const full = path.join(backupDir, entry.name);
    const stat = fs.statSync(full);
    files.push({
      filename: entry.name,
      sizeBytes: stat.size,
      createdAt: stat.mtime.toISOString(),
    });
  }

  return files.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function getWorkspaceSnapshot(now: Date = new Date()) {
  const { db, dbPath } = getDb();

  const lessons = db.select().from(schema.lessons).orderBy(desc(schema.lessons.createdAt)).all();
  const units = db
    .select()
    .from(schema.learningUnits)
    .orderBy(asc(schema.learningUnits.orderIndex))
    .all();
  const planSteps = db
    .select()
    .from(schema.studyPlanSteps)
    .orderBy(asc(schema.studyPlanSteps.orderIndex))
    .all();
  const pendingCandidates = db
    .select()
    .from(schema.candidateItems)
    .where(eq(schema.candidateItems.status, 'pending'))
    .orderBy(asc(schema.candidateItems.createdAt))
    .all();
  const flashcards = db
    .select()
    .from(schema.flashcards)
    .orderBy(asc(schema.flashcards.dueAt))
    .all();
  const reviewLogs = db
    .select()
    .from(schema.reviewLogs)
    .orderBy(desc(schema.reviewLogs.reviewedAt))
    .all();
  const quizQuestions = db
    .select()
    .from(schema.quizQuestions)
    .orderBy(desc(schema.quizQuestions.createdAt))
    .all();
  const goals = db.select().from(schema.goals).orderBy(desc(schema.goals.createdAt)).all();
  const sessions = db
    .select()
    .from(schema.studySessions)
    .orderBy(desc(schema.studySessions.startedAt))
    .all();
  const notes = db.select().from(schema.notes).orderBy(desc(schema.notes.updatedAt)).all();
  const languageAttempts = db
    .select()
    .from(schema.languageAttempts)
    .orderBy(desc(schema.languageAttempts.createdAt))
    .all();

  const hydratedUnits = units.map((u) => {
    let interactiveConfig: InteractiveConfig;
    try {
      interactiveConfig = JSON.parse(u.interactiveConfigJson);
    } catch {
      interactiveConfig = buildInteractiveConfig(
        u.title,
        u.body,
        u.keyFormula,
        'mathematics'
      );
    }
    return {
      ...u,
      unitType: u.unitType as 'concept' | 'interactive-lab' | 'worked-example' | 'language-drill',
      interactiveConfig,
    };
  });

  const hydratedCandidates = pendingCandidates.map((c) => {
    let options: string[] = [];
    try {
      options = JSON.parse(c.optionsJson);
    } catch {
      options = [];
    }
    return {
      ...c,
      itemType: c.itemType as 'flashcard' | 'quiz',
      options,
    };
  });

  const hydratedFlashcards = flashcards.map((card) => {
    const scheduleSnapshot = {
      state: card.state as SrsCardState,
      dueAt: card.dueAt,
      intervalDays: card.intervalDays,
      easeFactor: card.easeFactor,
      repetitions: card.repetitions,
      lapses: card.lapses,
      lastReviewedAt: card.lastReviewedAt,
    };
    return {
      ...card,
      isDue: isCardDue(card.dueAt, now),
      actionPreviews: previewAllSrsActions(scheduleSnapshot, now),
    };
  });

  const hydratedQuizzes = quizQuestions.map((q) => {
    let options: string[] = [];
    try {
      options = JSON.parse(q.optionsJson);
    } catch {
      options = [];
    }
    return {
      ...q,
      options,
    };
  });

  const progress = computeStreakFreeProgress(
    {
      flashcards,
      reviewLogs,
      quizQuestions,
      sessions,
      goals,
      units,
    },
    now
  );

  return {
    nonAccreditedNotice: NON_ACCREDITED_NOTICE,
    storage: {
      mode: 'local-sqlite',
      databaseFile: path.basename(dbPath),
      backupDirectory: path.relative(process.cwd(), getResolvedBackupDir()) || './data/backups',
      aiGeneratorConfigured: Boolean(
        process.env.OPTIONAL_AI_API_KEY?.trim() && process.env.OPTIONAL_AI_BASE_URL?.trim()
      ),
    },
    lessons,
    units: hydratedUnits,
    studyPlanSteps: planSteps,
    pendingCandidates: hydratedCandidates,
    flashcards: hydratedFlashcards,
    reviewLogs: reviewLogs.slice(0, 100),
    quizQuestions: hydratedQuizzes,
    goals,
    sessions,
    notes,
    languageAttempts,
    backups: listLocalBackups(),
    progress,
  };
}

export function importLessonAndBuildPlan(input: {
  title?: string;
  subject: SubjectKind;
  sourceFormat: 'markdown' | 'text' | 'notes';
  sourceFilename?: string | null;
  rawContent: string;
}) {
  const { db, sqlite } = getDb();
  const parsed = parseLessonIntoStudyPlan(input);
  const nowIso = new Date().toISOString();

  const runTx = sqlite.transaction(() => {
    db.insert(schema.lessons)
      .values({
        id: parsed.lessonId,
        title: parsed.title,
        subject: parsed.subject,
        sourceFormat: parsed.sourceFormat,
        sourceFilename: parsed.safeSourceFilename,
        rawContent: input.rawContent.trim(),
        summary: parsed.summary,
        estimatedMinutes: parsed.estimatedMinutes,
        createdAt: nowIso,
        updatedAt: nowIso,
      })
      .run();

    for (const unit of parsed.units) {
      db.insert(schema.learningUnits)
        .values({
          id: unit.id,
          lessonId: parsed.lessonId,
          orderIndex: unit.orderIndex,
          title: unit.title,
          topic: unit.topic,
          unitType: unit.unitType,
          body: unit.body,
          keyFormula: unit.keyFormula,
          interactiveConfigJson: JSON.stringify(unit.interactiveConfig),
          estimatedMinutes: unit.estimatedMinutes,
          completedAt: null,
          updatedAt: nowIso,
        })
        .run();
    }

    for (const step of parsed.studyPlanSteps) {
      db.insert(schema.studyPlanSteps)
        .values({
          id: step.id,
          lessonId: parsed.lessonId,
          unitId: step.unitId,
          orderIndex: step.orderIndex,
          stepType: step.stepType,
          title: step.title,
          rationale: step.rationale,
          targetMinutes: step.targetMinutes,
          completed: false,
        })
        .run();
    }
  });

  runTx();

  return {
    lessonId: parsed.lessonId,
    title: parsed.title,
    unitsCreated: parsed.units.length,
    planStepsCreated: parsed.studyPlanSteps.length,
  };
}

export function updateLessonRecord(
  lessonId: string,
  patch: {
    title?: string;
    subject?: SubjectKind;
    summary?: string;
    toggleStepId?: string;
  }
) {
  const { db } = getDb();
  const existing = db
    .select()
    .from(schema.lessons)
    .where(eq(schema.lessons.id, lessonId))
    .get();
  if (!existing) {
    throw new Error('No se encontró la lección.');
  }

  if (patch.toggleStepId) {
    const step = db
      .select()
      .from(schema.studyPlanSteps)
      .where(eq(schema.studyPlanSteps.id, patch.toggleStepId))
      .get();
    if (step && step.lessonId === lessonId) {
      db.update(schema.studyPlanSteps)
        .set({ completed: !step.completed })
        .where(eq(schema.studyPlanSteps.id, step.id))
        .run();
    }
  }

  const nowIso = new Date().toISOString();
  db.update(schema.lessons)
    .set({
      title: patch.title ?? existing.title,
      subject: patch.subject ?? existing.subject,
      summary: patch.summary ?? existing.summary,
      updatedAt: nowIso,
    })
    .where(eq(schema.lessons.id, lessonId))
    .run();

  return db.select().from(schema.lessons).where(eq(schema.lessons.id, lessonId)).get();
}

export function deleteLessonRecord(lessonId: string) {
  const { db } = getDb();
  db.delete(schema.lessons).where(eq(schema.lessons.id, lessonId)).run();
}

export function createLearningUnit(input: {
  lessonId: string;
  title: string;
  topic: string;
  unitType: 'concept' | 'interactive-lab' | 'worked-example' | 'language-drill';
  body: string;
  keyFormula?: string | null;
  estimatedMinutes: number;
}) {
  const { db, sqlite } = getDb();
  const lesson = db
    .select()
    .from(schema.lessons)
    .where(eq(schema.lessons.id, input.lessonId))
    .get();
  if (!lesson) {
    throw new Error('No se encontró la lección principal.');
  }

  const existingUnits = db
    .select()
    .from(schema.learningUnits)
    .where(eq(schema.learningUnits.lessonId, input.lessonId))
    .orderBy(asc(schema.learningUnits.orderIndex))
    .all();

  const orderIndex = existingUnits.length;
  const interactiveConfig = buildInteractiveConfig(
    input.title,
    input.body,
    input.keyFormula ?? null,
    lesson.subject as SubjectKind
  );
  const unitId = crypto.randomUUID();
  const nowIso = new Date().toISOString();

  const tx = sqlite.transaction(() => {
    db.insert(schema.learningUnits)
      .values({
        id: unitId,
        lessonId: input.lessonId,
        orderIndex,
        title: input.title,
        topic: input.topic,
        unitType: input.unitType,
        body: input.body,
        keyFormula: input.keyFormula ?? null,
        interactiveConfigJson: JSON.stringify(interactiveConfig),
        estimatedMinutes: input.estimatedMinutes,
        completedAt: null,
        updatedAt: nowIso,
      })
      .run();

    db.insert(schema.studyPlanSteps)
      .values({
        id: crypto.randomUUID(),
        lessonId: input.lessonId,
        unitId,
        orderIndex,
        stepType: 'interactive-checkpoint',
        title: `Unidad ${orderIndex + 1}: ${input.title}`,
        rationale: 'Explora las notas interactivas de la unidad y resuelve el punto de verificación.',
        targetMinutes: input.estimatedMinutes,
        completed: false,
      })
      .run();
  });

  tx();
  return unitId;
}

export function updateLearningUnit(
  unitId: string,
  patch: {
    title?: string;
    topic?: string;
    unitType?: 'concept' | 'interactive-lab' | 'worked-example' | 'language-drill';
    body?: string;
    keyFormula?: string | null;
    estimatedMinutes?: number;
    orderIndex?: number;
    completed?: boolean;
    splitAtParagraph?: number;
    interactiveConfig?: InteractiveConfig;
  }
) {
  const { db, sqlite } = getDb();
  const existing = db
    .select()
    .from(schema.learningUnits)
    .where(eq(schema.learningUnits.id, unitId))
    .get();
  if (!existing) {
    throw new Error('No se encontró la unidad de aprendizaje.');
  }

  const lesson = db
    .select()
    .from(schema.lessons)
    .where(eq(schema.lessons.id, existing.lessonId))
    .get();

  const nowIso = new Date().toISOString();

  // Support splitting an editable unit into two smaller units
  if (patch.splitAtParagraph !== undefined) {
    const paragraphs = existing.body
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (paragraphs.length < 2) {
      throw new Error(
        'Agrega una línea en blanco entre párrafos antes de dividir esta unidad en dos.'
      );
    }
    const splitIdx = Math.min(paragraphs.length - 1, Math.max(1, patch.splitAtParagraph));
    const firstBody = paragraphs.slice(0, splitIdx).join('\n\n');
    const secondBody = paragraphs.slice(splitIdx).join('\n\n');
    const secondTitle = `${existing.title} (Parte 2)`.slice(0, 140);
    const secondId = crypto.randomUUID();
    const subject = (lesson?.subject as SubjectKind) || 'mathematics';

    const tx = sqlite.transaction(() => {
      const siblingUnits = db
        .select()
        .from(schema.learningUnits)
        .where(eq(schema.learningUnits.lessonId, existing.lessonId))
        .orderBy(asc(schema.learningUnits.orderIndex))
        .all();

      for (const sib of siblingUnits) {
        if (sib.orderIndex > existing.orderIndex) {
          db.update(schema.learningUnits)
            .set({ orderIndex: sib.orderIndex + 1 })
            .where(eq(schema.learningUnits.id, sib.id))
            .run();
        }
      }

      db.update(schema.learningUnits)
        .set({
          body: firstBody,
          interactiveConfigJson: JSON.stringify(
            buildInteractiveConfig(existing.title, firstBody, existing.keyFormula, subject)
          ),
          updatedAt: nowIso,
        })
        .where(eq(schema.learningUnits.id, existing.id))
        .run();

      db.insert(schema.learningUnits)
        .values({
          id: secondId,
          lessonId: existing.lessonId,
          orderIndex: existing.orderIndex + 1,
          title: secondTitle,
          topic: existing.topic,
          unitType: existing.unitType,
          body: secondBody,
          keyFormula: existing.keyFormula,
          interactiveConfigJson: JSON.stringify(
            buildInteractiveConfig(secondTitle, secondBody, existing.keyFormula, subject)
          ),
          estimatedMinutes: Math.max(3, Math.ceil(existing.estimatedMinutes / 2)),
          completedAt: null,
          updatedAt: nowIso,
        })
        .run();
    });

    tx();
    return db
      .select()
      .from(schema.learningUnits)
      .where(eq(schema.learningUnits.id, existing.id))
      .get();
  }

  const nextTitle = patch.title ?? existing.title;
  const nextBody = patch.body ?? existing.body;
  const nextFormula =
    patch.keyFormula !== undefined ? patch.keyFormula : existing.keyFormula;

  let nextInteractiveJson = existing.interactiveConfigJson;
  if (patch.interactiveConfig) {
    nextInteractiveJson = JSON.stringify(patch.interactiveConfig);
  } else if (
    patch.body !== undefined ||
    patch.keyFormula !== undefined ||
    patch.title !== undefined
  ) {
    const rebuilt = buildInteractiveConfig(
      nextTitle,
      nextBody,
      nextFormula,
      (lesson?.subject as SubjectKind) || 'mathematics'
    );
    nextInteractiveJson = JSON.stringify(rebuilt);
  }

  const completedAt =
    patch.completed === undefined
      ? existing.completedAt
      : patch.completed
        ? existing.completedAt || nowIso
        : null;

  const tx = sqlite.transaction(() => {
    db.update(schema.learningUnits)
      .set({
        title: nextTitle,
        topic: patch.topic ?? existing.topic,
        unitType: patch.unitType ?? existing.unitType,
        body: nextBody,
        keyFormula: nextFormula,
        estimatedMinutes: patch.estimatedMinutes ?? existing.estimatedMinutes,
        orderIndex: patch.orderIndex ?? existing.orderIndex,
        interactiveConfigJson: nextInteractiveJson,
        completedAt,
        updatedAt: nowIso,
      })
      .where(eq(schema.learningUnits.id, unitId))
      .run();

    if (patch.completed !== undefined) {
      db.update(schema.studyPlanSteps)
        .set({ completed: patch.completed })
        .where(eq(schema.studyPlanSteps.unitId, unitId))
        .run();
    }
  });

  tx();
  return db
    .select()
    .from(schema.learningUnits)
    .where(eq(schema.learningUnits.id, unitId))
    .get();
}

export function deleteLearningUnit(unitId: string) {
  const { db } = getDb();
  db.delete(schema.learningUnits).where(eq(schema.learningUnits.id, unitId)).run();
}

/**
 * Generates candidate flashcards and short quizzes strictly in PENDING status.
 * Active flashcards and quizzes are NOT created here; learner approval is mandatory.
 */
export async function stageCandidateItemsForLesson(lessonId: string, unitId?: string) {
  const { db, sqlite } = getDb();
  const lesson = db
    .select()
    .from(schema.lessons)
    .where(eq(schema.lessons.id, lessonId))
    .get();
  if (!lesson) {
    throw new Error('No se encontró la lección.');
  }

  let units = db
    .select()
    .from(schema.learningUnits)
    .where(eq(schema.learningUnits.lessonId, lessonId))
    .orderBy(asc(schema.learningUnits.orderIndex))
    .all();

  if (unitId) {
    units = units.filter((u) => u.id === unitId);
  }

  if (units.length === 0) {
    throw new Error('Agrega al menos una unidad de aprendizaje antes de generar borradores.');
  }

  const generated = await generateCandidateItemsWithFallback(lessonId, units);
  const nowIso = new Date().toISOString();

  const tx = sqlite.transaction(() => {
    for (const draft of generated.candidates) {
      db.insert(schema.candidateItems)
        .values({
          id: draft.id,
          lessonId: draft.lessonId,
          unitId: draft.unitId,
          itemType: draft.itemType,
          topic: draft.topic,
          prompt: draft.prompt,
          answer: draft.answer,
          optionsJson: JSON.stringify(draft.options),
          explanation: draft.explanation,
          generatorSource: draft.generatorSource,
          status: 'pending',
          createdAt: nowIso,
          reviewedAt: null,
        })
        .run();
    }
  });

  tx();

  return {
    stagedCount: generated.candidates.length,
    source: generated.source,
    notice: generated.notice,
    candidates: generated.candidates,
  };
}

/**
 * Edits, approves, or rejects a pending candidate item.
 * ONLY 'approve' promotes the item into active flashcards or quizQuestions.
 */
export function decideCandidateItem(
  candidateId: string,
  payload: {
    decision: 'approve' | 'reject' | 'edit';
    prompt?: string;
    answer?: string;
    topic?: string;
    options?: string[];
    explanation?: string;
  }
) {
  const { db, sqlite } = getDb();
  const candidate = db
    .select()
    .from(schema.candidateItems)
    .where(eq(schema.candidateItems.id, candidateId))
    .get();

  if (!candidate) {
    throw new Error('No se encontró el borrador candidato.');
  }

  const nextPrompt = payload.prompt ?? candidate.prompt;
  const nextAnswer = payload.answer ?? candidate.answer;
  const nextTopic = payload.topic ?? candidate.topic;
  const nextExplanation = payload.explanation ?? candidate.explanation;

  let existingOptions: string[] = [];
  try {
    existingOptions = JSON.parse(candidate.optionsJson);
  } catch {
    existingOptions = [];
  }
  let nextOptions = payload.options ?? existingOptions;
  if (
    candidate.itemType === 'quiz' &&
    nextOptions.length > 0 &&
    !nextOptions.includes(nextAnswer)
  ) {
    nextOptions = [nextAnswer, ...nextOptions.slice(0, 3)];
  }

  const nowIso = new Date().toISOString();

  if (payload.decision === 'edit') {
    db.update(schema.candidateItems)
      .set({
        prompt: nextPrompt,
        answer: nextAnswer,
        topic: nextTopic,
        optionsJson: JSON.stringify(nextOptions),
        explanation: nextExplanation,
      })
      .where(eq(schema.candidateItems.id, candidateId))
      .run();
    return { status: 'pending', promotedId: null };
  }

  if (payload.decision === 'reject') {
    db.update(schema.candidateItems)
      .set({
        status: 'rejected',
        reviewedAt: nowIso,
      })
      .where(eq(schema.candidateItems.id, candidateId))
      .run();
    return { status: 'rejected', promotedId: null };
  }

  if (candidate.status === 'approved') {
    return { status: 'approved', promotedId: null };
  }

  const promotedId = crypto.randomUUID();

  const tx = sqlite.transaction(() => {
    db.update(schema.candidateItems)
      .set({
        prompt: nextPrompt,
        answer: nextAnswer,
        topic: nextTopic,
        optionsJson: JSON.stringify(nextOptions),
        explanation: nextExplanation,
        status: 'approved',
        reviewedAt: nowIso,
      })
      .where(eq(schema.candidateItems.id, candidateId))
      .run();

    if (candidate.itemType === 'flashcard') {
      db.insert(schema.flashcards)
        .values({
          id: promotedId,
          lessonId: candidate.lessonId,
          unitId: candidate.unitId,
          candidateId: candidate.id,
          topic: nextTopic,
          front: nextPrompt,
          back: nextAnswer,
          explanation: nextExplanation,
          state: 'new',
          dueAt: nowIso,
          intervalDays: 0,
          easeFactor: 2.5,
          repetitions: 0,
          lapses: 0,
          lastReviewedAt: null,
          createdAt: nowIso,
        })
        .run();
    } else {
      const finalOptions =
        nextOptions.length >= 2
          ? nextOptions
          : [
              nextAnswer,
              `Condición opuesta en ${nextTopic}`,
              `Suposición constante no relacionada`,
            ];

      db.insert(schema.quizQuestions)
        .values({
          id: promotedId,
          lessonId: candidate.lessonId,
          unitId: candidate.unitId,
          candidateId: candidate.id,
          topic: nextTopic,
          prompt: nextPrompt,
          optionsJson: JSON.stringify(finalOptions),
          correctAnswer: nextAnswer,
          explanation: nextExplanation,
          timesAnswered: 0,
          timesCorrect: 0,
          lastAnsweredAt: null,
          createdAt: nowIso,
        })
        .run();
    }

    // Check if lesson has any remaining pending items; if none, mark approve-retrieval step done
    const remainingPending = db
      .select()
      .from(schema.candidateItems)
      .where(eq(schema.candidateItems.lessonId, candidate.lessonId))
      .all()
      .filter((item) => item.status === 'pending');

    if (remainingPending.length === 0) {
      const steps = db
        .select()
        .from(schema.studyPlanSteps)
        .where(eq(schema.studyPlanSteps.lessonId, candidate.lessonId))
        .all();
      for (const s of steps) {
        if (s.stepType === 'approve-retrieval') {
          db.update(schema.studyPlanSteps)
            .set({ completed: true })
            .where(eq(schema.studyPlanSteps.id, s.id))
            .run();
        }
      }
    }
  });

  tx();

  return {
    status: 'approved',
    itemType: candidate.itemType,
    promotedId,
  };
}

export function bulkDecideCandidates(
  candidateIds: string[],
  decision: 'approve' | 'reject'
) {
  const results = candidateIds.map((id) => decideCandidateItem(id, { decision }));
  return {
    processed: results.length,
    decision,
  };
}

export function applyFlashcardReview(
  flashcardId: string,
  action: SrsAction,
  now: Date = new Date()
) {
  const { db, sqlite } = getDb();
  const card = db
    .select()
    .from(schema.flashcards)
    .where(eq(schema.flashcards.id, flashcardId))
    .get();

  if (!card) {
    throw new Error('No se encontró la tarjeta de estudio.');
  }

  const transition = computeNextSrsState(
    {
      state: card.state as SrsCardState,
      dueAt: card.dueAt,
      intervalDays: card.intervalDays,
      easeFactor: card.easeFactor,
      repetitions: card.repetitions,
      lapses: card.lapses,
      lastReviewedAt: card.lastReviewedAt,
    },
    action,
    now
  );

  const tx = sqlite.transaction(() => {
    db.update(schema.flashcards)
      .set({
        state: transition.state,
        dueAt: transition.dueAt,
        intervalDays: transition.intervalDays,
        easeFactor: transition.easeFactor,
        repetitions: transition.repetitions,
        lapses: transition.lapses,
        lastReviewedAt: transition.lastReviewedAt,
      })
      .where(eq(schema.flashcards.id, flashcardId))
      .run();

    db.insert(schema.reviewLogs)
      .values({
        id: crypto.randomUUID(),
        flashcardId: card.id,
        topic: card.topic,
        action,
        previousIntervalDays: card.intervalDays,
        nextIntervalDays: transition.intervalDays,
        previousEaseFactor: card.easeFactor,
        nextEaseFactor: transition.easeFactor,
        reviewedAt: now.toISOString(),
      })
      .run();

    // Mark spaced-review study plan step completed for this lesson once learner practices retrieval
    const steps = db
      .select()
      .from(schema.studyPlanSteps)
      .where(eq(schema.studyPlanSteps.lessonId, card.lessonId))
      .all();
    for (const s of steps) {
      if (s.stepType === 'spaced-review' && !s.completed) {
        db.update(schema.studyPlanSteps)
          .set({ completed: true })
          .where(eq(schema.studyPlanSteps.id, s.id))
          .run();
      }
    }
  });

  tx();

  return transition;
}

export function submitQuizAttempt(questionId: string, submittedAnswer: string) {
  const { db, sqlite } = getDb();
  const question = db
    .select()
    .from(schema.quizQuestions)
    .where(eq(schema.quizQuestions.id, questionId))
    .get();

  if (!question) {
    throw new Error('No se encontró la pregunta del cuestionario.');
  }

  const normalizedSubmitted = submittedAnswer.trim().toLowerCase();
  const normalizedCorrect = question.correctAnswer.trim().toLowerCase();
  const isCorrect = normalizedSubmitted === normalizedCorrect;
  const nowIso = new Date().toISOString();

  const tx = sqlite.transaction(() => {
    db.update(schema.quizQuestions)
      .set({
        timesAnswered: question.timesAnswered + 1,
        timesCorrect: question.timesCorrect + (isCorrect ? 1 : 0),
        lastAnsweredAt: nowIso,
      })
      .where(eq(schema.quizQuestions.id, questionId))
      .run();

    db.insert(schema.quizAttempts)
      .values({
        id: crypto.randomUUID(),
        questionId: question.id,
        topic: question.topic,
        submittedAnswer: submittedAnswer.trim(),
        isCorrect,
        attemptedAt: nowIso,
      })
      .run();
  });

  tx();

  return {
    isCorrect,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
  };
}

export function createGoalRecord(input: {
  title: string;
  metric: 'weekly_minutes' | 'weekly_reviews' | 'units_completed';
  targetValue: number;
  period: 'weekly' | 'monthly' | 'open';
}) {
  const { db } = getDb();
  const id = crypto.randomUUID();
  db.insert(schema.goals)
    .values({
      id,
      title: input.title,
      metric: input.metric,
      targetValue: input.targetValue,
      period: input.period,
      completed: false,
      createdAt: new Date().toISOString(),
    })
    .run();
  return id;
}

export function updateGoalRecord(input: {
  id: string;
  title?: string;
  targetValue?: number;
  completed?: boolean;
}) {
  const { db } = getDb();
  const existing = db.select().from(schema.goals).where(eq(schema.goals.id, input.id)).get();
  if (!existing) throw new Error('No se encontró la meta.');
  db.update(schema.goals)
    .set({
      title: input.title ?? existing.title,
      targetValue: input.targetValue ?? existing.targetValue,
      completed: input.completed ?? existing.completed,
    })
    .where(eq(schema.goals.id, input.id))
    .run();
}

export function deleteGoalRecord(id: string) {
  const { db } = getDb();
  db.delete(schema.goals).where(eq(schema.goals.id, id)).run();
}

export function logStudySessionRecord(input: {
  lessonId?: string | null;
  topic: string;
  activityType:
    | 'interactive-lesson'
    | 'retrieval-review'
    | 'quiz'
    | 'language-practice'
    | 'weak-topic-review';
  durationMinutes: number;
  itemsCompleted: number;
  reflection: string;
  startedAt?: string;
  endedAt?: string;
}) {
  const { db } = getDb();
  const now = new Date();
  const endedAt = input.endedAt || now.toISOString();
  const startedAt =
    input.startedAt ||
    new Date(now.getTime() - Math.round(input.durationMinutes * 60_000)).toISOString();
  const id = crypto.randomUUID();

  db.insert(schema.studySessions)
    .values({
      id,
      lessonId: input.lessonId || null,
      topic: input.topic,
      activityType: input.activityType,
      durationMinutes: Math.round(input.durationMinutes * 10) / 10,
      itemsCompleted: input.itemsCompleted,
      reflection: input.reflection,
      startedAt,
      endedAt,
    })
    .run();
  return id;
}

export function createNoteRecord(input: {
  lessonId?: string | null;
  unitId?: string | null;
  topic: string;
  title: string;
  body: string;
}) {
  const { db } = getDb();
  const id = crypto.randomUUID();
  const nowIso = new Date().toISOString();
  db.insert(schema.notes)
    .values({
      id,
      lessonId: input.lessonId || null,
      unitId: input.unitId || null,
      topic: input.topic,
      title: input.title,
      body: input.body,
      createdAt: nowIso,
      updatedAt: nowIso,
    })
    .run();
  return id;
}

export function updateNoteRecord(input: {
  id: string;
  topic?: string;
  title?: string;
  body?: string;
}) {
  const { db } = getDb();
  const existing = db.select().from(schema.notes).where(eq(schema.notes.id, input.id)).get();
  if (!existing) throw new Error('No se encontró el apunte.');
  db.update(schema.notes)
    .set({
      topic: input.topic ?? existing.topic,
      title: input.title ?? existing.title,
      body: input.body ?? existing.body,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.notes.id, input.id))
    .run();
}

export function deleteNoteRecord(id: string) {
  const { db } = getDb();
  db.delete(schema.notes).where(eq(schema.notes.id, id)).run();
}

export function recordLanguagePracticeAttempt(input: {
  unitId?: string | null;
  phrase: string;
  languageLabel: string;
  captureMode: 'microphone' | 'audio-upload' | 'tap-cadence';
  targetDurationSec: number;
  recordedDurationSec: number;
  activeSpeechSec: number;
  recognizedTranscript?: string | null;
}) {
  const { db } = getDb();
  const comparison = compareLanguagePractice({
    phrase: input.phrase,
    targetDurationSec: input.targetDurationSec,
    recordedDurationSec: input.recordedDurationSec,
    activeSpeechSec: input.activeSpeechSec,
    recognizedTranscript: input.recognizedTranscript,
  });

  const id = crypto.randomUUID();
  const nowIso = new Date().toISOString();

  db.insert(schema.languageAttempts)
    .values({
      id,
      unitId: input.unitId || null,
      phrase: input.phrase,
      languageLabel: input.languageLabel,
      captureMode: input.captureMode,
      targetDurationSec: comparison.targetDurationSec,
      recordedDurationSec: comparison.recordedDurationSec,
      activeSpeechSec: comparison.activeSpeechSec,
      pauseRatio: comparison.pauseRatio,
      wordsPerMinute: comparison.wordsPerMinute,
      pacingRatio: comparison.pacingRatio,
      recognizedTranscript: input.recognizedTranscript || null,
      pronunciationOverlap: comparison.pronunciationOverlap,
      feedbackSummary: comparison.feedbackSummary,
      createdAt: nowIso,
    })
    .run();

  return {
    id,
    comparison,
  };
}

export function deleteLanguageAttemptRecord(id: string) {
  const { db } = getDb();
  db.delete(schema.languageAttempts).where(eq(schema.languageAttempts.id, id)).run();
}

export function exportAllDataBundle() {
  const { db } = getDb();
  return {
    schemaVersion: 1 as const,
    exportedAt: new Date().toISOString(),
    app: 'TutorIA — Mesa Personal de Estudio Interactivo',
    nonAccreditedNotice: NON_ACCREDITED_NOTICE,
    data: {
      lessons: db.select().from(schema.lessons).all(),
      learningUnits: db.select().from(schema.learningUnits).all(),
      studyPlanSteps: db.select().from(schema.studyPlanSteps).all(),
      candidateItems: db.select().from(schema.candidateItems).all(),
      flashcards: db.select().from(schema.flashcards).all(),
      reviewLogs: db.select().from(schema.reviewLogs).all(),
      quizQuestions: db.select().from(schema.quizQuestions).all(),
      quizAttempts: db.select().from(schema.quizAttempts).all(),
      goals: db.select().from(schema.goals).all(),
      studySessions: db.select().from(schema.studySessions).all(),
      notes: db.select().from(schema.notes).all(),
      languageAttempts: db.select().from(schema.languageAttempts).all(),
    },
  };
}

export function importDataBundle(rawBundle: unknown) {
  const parsed = exportBundleSchema.parse(rawBundle);
  const { db, sqlite } = getDb();

  const tx = sqlite.transaction(() => {
    // Wipe existing local tables in FK-safe order before restoring
    db.delete(schema.reviewLogs).run();
    db.delete(schema.quizAttempts).run();
    db.delete(schema.flashcards).run();
    db.delete(schema.quizQuestions).run();
    db.delete(schema.candidateItems).run();
    db.delete(schema.studyPlanSteps).run();
    db.delete(schema.notes).run();
    db.delete(schema.languageAttempts).run();
    db.delete(schema.studySessions).run();
    db.delete(schema.goals).run();
    db.delete(schema.learningUnits).run();
    db.delete(schema.lessons).run();

    for (const row of parsed.data.lessons) {
      db.insert(schema.lessons).values(row as typeof schema.lessons.$inferInsert).run();
    }
    for (const row of parsed.data.learningUnits) {
      db.insert(schema.learningUnits)
        .values(row as typeof schema.learningUnits.$inferInsert)
        .run();
    }
    for (const row of parsed.data.studyPlanSteps) {
      db.insert(schema.studyPlanSteps)
        .values(row as typeof schema.studyPlanSteps.$inferInsert)
        .run();
    }
    for (const row of parsed.data.candidateItems) {
      db.insert(schema.candidateItems)
        .values(row as typeof schema.candidateItems.$inferInsert)
        .run();
    }
    for (const row of parsed.data.flashcards) {
      db.insert(schema.flashcards)
        .values(row as typeof schema.flashcards.$inferInsert)
        .run();
    }
    for (const row of parsed.data.reviewLogs) {
      db.insert(schema.reviewLogs)
        .values(row as typeof schema.reviewLogs.$inferInsert)
        .run();
    }
    for (const row of parsed.data.quizQuestions) {
      db.insert(schema.quizQuestions)
        .values(row as typeof schema.quizQuestions.$inferInsert)
        .run();
    }
    for (const row of parsed.data.quizAttempts) {
      db.insert(schema.quizAttempts)
        .values(row as typeof schema.quizAttempts.$inferInsert)
        .run();
    }
    for (const row of parsed.data.goals) {
      db.insert(schema.goals).values(row as typeof schema.goals.$inferInsert).run();
    }
    for (const row of parsed.data.studySessions) {
      db.insert(schema.studySessions)
        .values(row as typeof schema.studySessions.$inferInsert)
        .run();
    }
    for (const row of parsed.data.notes) {
      db.insert(schema.notes).values(row as typeof schema.notes.$inferInsert).run();
    }
    for (const row of parsed.data.languageAttempts) {
      db.insert(schema.languageAttempts)
        .values(row as typeof schema.languageAttempts.$inferInsert)
        .run();
    }
  });

  tx();

  return {
    restoredLessons: parsed.data.lessons.length,
    restoredUnits: parsed.data.learningUnits.length,
    restoredFlashcards: parsed.data.flashcards.length,
  };
}

export function createLocalBackup(label?: string): LocalBackupFileInfo {
  const backupDir = getResolvedBackupDir();
  fs.mkdirSync(backupDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const cleanLabel = label?.trim()
    ? toSafeFilename(label.trim(), { fallback: 'snapshot', maxLength: 32 })
    : '';
  const rawName = cleanLabel
    ? `backup-${cleanLabel}-${stamp}`
    : `tutoria-backup-${stamp}`;
  const { safeFilename, fullPath } = resolveSafeChildPath(backupDir, rawName, {
    extension: 'json',
    maxLength: 80,
  });

  const payload = JSON.stringify(exportAllDataBundle(), null, 2);
  fs.writeFileSync(fullPath, payload, 'utf-8');
  const stat = fs.statSync(fullPath);

  return {
    filename: safeFilename,
    sizeBytes: stat.size,
    createdAt: stat.mtime.toISOString(),
  };
}

export function restoreLocalBackupByFilename(rawFilename: string) {
  const backupDir = getResolvedBackupDir();
  const safeName = toSafeFilename(rawFilename, { extension: 'json', maxLength: 90 });
  const { fullPath } = resolveSafeChildPath(backupDir, safeName, {
    extension: 'json',
    maxLength: 90,
  });

  if (!fs.existsSync(fullPath)) {
    throw new Error(`No se encontró el archivo de respaldo «${safeName}» en la carpeta local.`);
  }

  const rawJson = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
  return importDataBundle(rawJson);
}

export function resetOrDeleteAllData(
  mode: 'progress-only' | 'delete-all',
  removeBackups: boolean = false
) {
  const { db, sqlite } = getDb();
  const nowIso = new Date().toISOString();

  if (mode === 'progress-only') {
    const tx = sqlite.transaction(() => {
      db.delete(schema.reviewLogs).run();
      db.delete(schema.quizAttempts).run();
      db.delete(schema.studySessions).run();
      db.delete(schema.languageAttempts).run();

      db.update(schema.flashcards)
        .set({
          state: 'new',
          dueAt: nowIso,
          intervalDays: 0,
          easeFactor: 2.5,
          repetitions: 0,
          lapses: 0,
          lastReviewedAt: null,
        })
        .run();

      db.update(schema.quizQuestions)
        .set({
          timesAnswered: 0,
          timesCorrect: 0,
          lastAnsweredAt: null,
        })
        .run();

      db.update(schema.learningUnits).set({ completedAt: null }).run();
      db.update(schema.studyPlanSteps).set({ completed: false }).run();
      db.update(schema.goals).set({ completed: false }).run();
    });

    tx();
    return { mode: 'progress-only' as const };
  }

  // Full deletion of all learning data
  const tx = sqlite.transaction(() => {
    db.delete(schema.reviewLogs).run();
    db.delete(schema.quizAttempts).run();
    db.delete(schema.flashcards).run();
    db.delete(schema.quizQuestions).run();
    db.delete(schema.candidateItems).run();
    db.delete(schema.studyPlanSteps).run();
    db.delete(schema.notes).run();
    db.delete(schema.languageAttempts).run();
    db.delete(schema.studySessions).run();
    db.delete(schema.goals).run();
    db.delete(schema.learningUnits).run();
    db.delete(schema.lessons).run();
  });

  tx();

  try {
    sqlite.exec('VACUUM;');
  } catch {
    // Ignore if memory DB
  }

  if (removeBackups) {
    const backupDir = getResolvedBackupDir();
    if (fs.existsSync(backupDir)) {
      for (const entry of fs.readdirSync(backupDir)) {
        if (entry.endsWith('.json')) {
          const { fullPath } = resolveSafeChildPath(backupDir, entry, {
            extension: 'json',
            maxLength: 100,
          });
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        }
      }
    }
  }

  return {
    mode: 'delete-all' as const,
    databasePath: path.basename(getResolvedDatabasePath()),
    backupsRemoved: removeBackups,
  };
}

export function getElectromecanicaCurriculum(): PBACurriculumYear[] {
  return PBA_ELECTROMECANICA_CURRICULUM;
}

export async function seedCurriculumElectromecanicaPBA(options?: {
  overwrite?: boolean;
  stageCandidates?: boolean;
}) {
  const { db } = getDb();
  let createdCount = 0;
  let skippedCount = 0;

  for (const template of PBA_ELECTROMECANICA_LESSONS) {
    const existing = db
      .select({ id: schema.lessons.id })
      .from(schema.lessons)
      .where(eq(schema.lessons.title, template.title))
      .get();

    if (existing) {
      if (options?.overwrite) {
        deleteLessonRecord(existing.id);
      } else {
        skippedCount++;
        continue;
      }
    }

    const created = importLessonAndBuildPlan({
      title: template.title,
      subject: template.subject,
      sourceFormat: 'markdown',
      sourceFilename: `${template.id}.md`,
      rawContent: template.content,
    });

    if (options?.stageCandidates) {
      await stageCandidateItemsForLesson(created.lessonId);
    }

    createdCount++;
  }

  return {
    success: true,
    createdCount,
    skippedCount,
    totalCurriculumLessons: PBA_ELECTROMECANICA_LESSONS.length,
    yearsCovered: 7,
  };
}

