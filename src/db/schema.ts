import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const lessons = sqliteTable('lessons', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  subject: text('subject').notNull(),
  sourceFormat: text('source_format').notNull(),
  sourceFilename: text('source_filename'),
  rawContent: text('raw_content').notNull(),
  summary: text('summary').notNull(),
  estimatedMinutes: integer('estimated_minutes').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const learningUnits = sqliteTable('learning_units', {
  id: text('id').primaryKey(),
  lessonId: text('lesson_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  orderIndex: integer('order_index').notNull(),
  title: text('title').notNull(),
  topic: text('topic').notNull(),
  unitType: text('unit_type').notNull(), // 'concept' | 'interactive-lab' | 'worked-example' | 'language-drill'
  body: text('body').notNull(),
  keyFormula: text('key_formula'),
  interactiveConfigJson: text('interactive_config_json').notNull(),
  estimatedMinutes: integer('estimated_minutes').notNull().default(5),
  completedAt: text('completed_at'),
  updatedAt: text('updated_at').notNull(),
});

export const studyPlanSteps = sqliteTable('study_plan_steps', {
  id: text('id').primaryKey(),
  lessonId: text('lesson_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  unitId: text('unit_id').references(() => learningUnits.id, { onDelete: 'cascade' }),
  orderIndex: integer('order_index').notNull(),
  stepType: text('step_type').notNull(), // 'read-and-explore' | 'interactive-checkpoint' | 'approve-retrieval' | 'spaced-review'
  title: text('title').notNull(),
  rationale: text('rationale').notNull(),
  targetMinutes: integer('target_minutes').notNull(),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
});

export const candidateItems = sqliteTable('candidate_items', {
  id: text('id').primaryKey(),
  lessonId: text('lesson_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  unitId: text('unit_id').references(() => learningUnits.id, { onDelete: 'set null' }),
  itemType: text('item_type').notNull(), // 'flashcard' | 'quiz'
  topic: text('topic').notNull(),
  prompt: text('prompt').notNull(),
  answer: text('answer').notNull(),
  optionsJson: text('options_json').notNull().default('[]'),
  explanation: text('explanation').notNull(),
  generatorSource: text('generator_source').notNull().default('local-deterministic'),
  status: text('status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
  createdAt: text('created_at').notNull(),
  reviewedAt: text('reviewed_at'),
});

export const flashcards = sqliteTable('flashcards', {
  id: text('id').primaryKey(),
  lessonId: text('lesson_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  unitId: text('unit_id').references(() => learningUnits.id, { onDelete: 'set null' }),
  candidateId: text('candidate_id').references(() => candidateItems.id, { onDelete: 'set null' }),
  topic: text('topic').notNull(),
  front: text('front').notNull(),
  back: text('back').notNull(),
  explanation: text('explanation').notNull(),
  state: text('state').notNull().default('new'), // 'new' | 'learning' | 'review' | 'relearning'
  dueAt: text('due_at').notNull(),
  intervalDays: real('interval_days').notNull().default(0),
  easeFactor: real('ease_factor').notNull().default(2.5),
  repetitions: integer('repetitions').notNull().default(0),
  lapses: integer('lapses').notNull().default(0),
  lastReviewedAt: text('last_reviewed_at'),
  createdAt: text('created_at').notNull(),
});

export const reviewLogs = sqliteTable('review_logs', {
  id: text('id').primaryKey(),
  flashcardId: text('flashcard_id')
    .notNull()
    .references(() => flashcards.id, { onDelete: 'cascade' }),
  topic: text('topic').notNull(),
  action: text('action').notNull(), // 'again' | 'hard' | 'good' | 'easy'
  previousIntervalDays: real('previous_interval_days').notNull(),
  nextIntervalDays: real('next_interval_days').notNull(),
  previousEaseFactor: real('previous_ease_factor').notNull(),
  nextEaseFactor: real('next_ease_factor').notNull(),
  reviewedAt: text('reviewed_at').notNull(),
});

export const quizQuestions = sqliteTable('quiz_questions', {
  id: text('id').primaryKey(),
  lessonId: text('lesson_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  unitId: text('unit_id').references(() => learningUnits.id, { onDelete: 'set null' }),
  candidateId: text('candidate_id').references(() => candidateItems.id, { onDelete: 'set null' }),
  topic: text('topic').notNull(),
  prompt: text('prompt').notNull(),
  optionsJson: text('options_json').notNull(),
  correctAnswer: text('correct_answer').notNull(),
  explanation: text('explanation').notNull(),
  timesAnswered: integer('times_answered').notNull().default(0),
  timesCorrect: integer('times_correct').notNull().default(0),
  lastAnsweredAt: text('last_answered_at'),
  createdAt: text('created_at').notNull(),
});

export const quizAttempts = sqliteTable('quiz_attempts', {
  id: text('id').primaryKey(),
  questionId: text('question_id')
    .notNull()
    .references(() => quizQuestions.id, { onDelete: 'cascade' }),
  topic: text('topic').notNull(),
  submittedAnswer: text('submitted_answer').notNull(),
  isCorrect: integer('is_correct', { mode: 'boolean' }).notNull(),
  attemptedAt: text('attempted_at').notNull(),
});

export const goals = sqliteTable('goals', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  metric: text('metric').notNull(), // 'weekly_minutes' | 'weekly_reviews' | 'units_completed'
  targetValue: integer('target_value').notNull(),
  period: text('period').notNull().default('weekly'), // 'weekly' | 'monthly' | 'open'
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
});

export const studySessions = sqliteTable('study_sessions', {
  id: text('id').primaryKey(),
  lessonId: text('lesson_id').references(() => lessons.id, { onDelete: 'set null' }),
  topic: text('topic').notNull(),
  activityType: text('activity_type').notNull(),
  durationMinutes: real('duration_minutes').notNull(),
  itemsCompleted: integer('items_completed').notNull().default(0),
  reflection: text('reflection').notNull().default(''),
  startedAt: text('started_at').notNull(),
  endedAt: text('ended_at').notNull(),
});

export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  lessonId: text('lesson_id').references(() => lessons.id, { onDelete: 'set null' }),
  unitId: text('unit_id').references(() => learningUnits.id, { onDelete: 'set null' }),
  topic: text('topic').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const languageAttempts = sqliteTable('language_attempts', {
  id: text('id').primaryKey(),
  unitId: text('unit_id').references(() => learningUnits.id, { onDelete: 'set null' }),
  phrase: text('phrase').notNull(),
  languageLabel: text('language_label').notNull(),
  captureMode: text('capture_mode').notNull(), // 'microphone' | 'audio-upload' | 'tap-cadence'
  targetDurationSec: real('target_duration_sec').notNull(),
  recordedDurationSec: real('recorded_duration_sec').notNull(),
  activeSpeechSec: real('active_speech_sec').notNull(),
  pauseRatio: real('pause_ratio').notNull(),
  wordsPerMinute: real('words_per_minute').notNull(),
  pacingRatio: real('pacing_ratio').notNull(),
  recognizedTranscript: text('recognized_transcript'),
  pronunciationOverlap: real('pronunciation_overlap'),
  feedbackSummary: text('feedback_summary').notNull(),
  createdAt: text('created_at').notNull(),
});
