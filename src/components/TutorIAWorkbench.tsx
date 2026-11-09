'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { InteractiveConfig, SubjectKind } from '@/lib/transform/lessonParser';
import type { SrsAction, SrsTransitionResult } from '@/lib/srs/scheduler';
import { formatIntervalDays } from '@/lib/srs/scheduler';
import type { StreakFreeProgressSummary } from '@/lib/analytics/progress';
import { SAMPLE_NOTE_TEMPLATES } from '@/lib/samples/sampleLessons';
import {
  PBA_ELECTROMECANICA_CURRICULUM,
  PBA_ELECTROMECANICA_LESSONS,
  type PBACurriculumYear,
  type PBASubject,
  type PBATopic,
} from '@/lib/curriculum/electromecanicaPBA';
import {
  clearAllClientOfflineData,
  enqueueOfflineMutation,
  loadOfflineQueue,
  loadOfflineSnapshotCache,
  saveOfflineQueue,
  saveOfflineSnapshotCache,
  type QueuedOfflineMutation,
} from '@/lib/client/offlineStore';
import { useServiceWorkerStatus } from './ServiceWorkerManager';
import { InteractiveExplorer } from './InteractiveExplorer';
import { StreakFreeCharts } from './StreakFreeCharts';
import {
  LanguagePracticeStudio,
  type SavedLanguageAttempt,
} from './LanguagePracticeStudio';
import { SFSymbol } from './icons';

export interface WorkspaceSnapshot {
  nonAccreditedNotice: string;
  storage: {
    mode: string;
    databaseFile: string;
    backupDirectory: string;
    aiGeneratorConfigured: boolean;
  };
  lessons: Array<{
    id: string;
    title: string;
    subject: string;
    sourceFormat: string;
    sourceFilename: string | null;
    rawContent: string;
    summary: string;
    estimatedMinutes: number;
    createdAt: string;
    updatedAt: string;
  }>;
  units: Array<{
    id: string;
    lessonId: string;
    orderIndex: number;
    title: string;
    topic: string;
    unitType: 'concept' | 'interactive-lab' | 'worked-example' | 'language-drill';
    body: string;
    keyFormula: string | null;
    interactiveConfig: InteractiveConfig;
    estimatedMinutes: number;
    completedAt: string | null;
    updatedAt: string;
  }>;
  studyPlanSteps: Array<{
    id: string;
    lessonId: string;
    unitId: string | null;
    orderIndex: number;
    stepType: string;
    title: string;
    rationale: string;
    targetMinutes: number;
    completed: boolean;
  }>;
  pendingCandidates: Array<{
    id: string;
    lessonId: string;
    unitId: string | null;
    itemType: 'flashcard' | 'quiz';
    topic: string;
    prompt: string;
    answer: string;
    options: string[];
    explanation: string;
    generatorSource: string;
    status: string;
    createdAt: string;
  }>;
  flashcards: Array<{
    id: string;
    lessonId: string;
    unitId: string | null;
    topic: string;
    front: string;
    back: string;
    explanation: string;
    state: string;
    dueAt: string;
    intervalDays: number;
    easeFactor: number;
    repetitions: number;
    lapses: number;
    lastReviewedAt: string | null;
    isDue: boolean;
    actionPreviews: Record<SrsAction, SrsTransitionResult>;
  }>;
  reviewLogs: Array<{
    id: string;
    flashcardId: string;
    topic: string;
    action: string;
    previousIntervalDays: number;
    nextIntervalDays: number;
    previousEaseFactor: number;
    nextEaseFactor: number;
    reviewedAt: string;
  }>;
  quizQuestions: Array<{
    id: string;
    lessonId: string;
    unitId: string | null;
    topic: string;
    prompt: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    timesAnswered: number;
    timesCorrect: number;
  }>;
  goals: Array<{
    id: string;
    title: string;
    metric: string;
    targetValue: number;
    period: string;
    completed: boolean;
    createdAt: string;
  }>;
  sessions: Array<{
    id: string;
    lessonId: string | null;
    topic: string;
    activityType: string;
    durationMinutes: number;
    itemsCompleted: number;
    reflection: string;
    startedAt: string;
    endedAt: string;
  }>;
  notes: Array<{
    id: string;
    lessonId: string | null;
    unitId: string | null;
    topic: string;
    title: string;
    body: string;
    createdAt: string;
    updatedAt: string;
  }>;
  languageAttempts: SavedLanguageAttempt[];
  backups: Array<{
    filename: string;
    sizeBytes: number;
    createdAt: string;
  }>;
  progress: StreakFreeProgressSummary;
}

type ActiveTab = 'lessons' | 'curriculum' | 'practice' | 'language' | 'progress' | 'data';

const SUBJECT_LABELS: Record<string, string> = {
  physics: 'Física',
  mathematics: 'Matemáticas',
  chemistry: 'Química',
  biology: 'Biología',
  'computer-science': 'Ciencias de la Computación',
  'general-science': 'Ciencia General',
  language: 'Práctica de Idiomas',
};

const UNIT_TYPE_LABELS: Record<string, string> = {
  concept: 'Concepto',
  'interactive-lab': 'Laboratorio interactivo',
  'worked-example': 'Ejemplo resuelto',
  'language-drill': 'Práctica de idioma',
};

const CARD_STATE_LABELS: Record<string, string> = {
  new: 'Nueva',
  learning: 'En aprendizaje',
  review: 'En repaso',
  relearning: 'Reaprendizaje',
};

const SRS_ACTION_LABELS: Record<SrsAction, string> = {
  again: 'Otra vez',
  hard: 'Difícil',
  good: 'Bien',
  easy: 'Fácil',
};

export function TutorIAWorkbench({
  initialSnapshot,
}: {
  initialSnapshot: WorkspaceSnapshot;
}) {
  const swStatus = useServiceWorkerStatus();
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot>(initialSnapshot);
  const [activeTab, setActiveTab] = useState<ActiveTab>('lessons');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineQueue, setOfflineQueue] = useState<QueuedOfflineMutation[]>([]);
  const [themeMode, setThemeMode] = useState<'auto' | 'light' | 'dark'>('auto');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tutoria_theme_mode') as
        | 'auto'
        | 'light'
        | 'dark'
        | null;
      if (saved && (saved === 'auto' || saved === 'light' || saved === 'dark')) {
        setThemeMode(saved);
        if (saved === 'auto') {
          document.documentElement.removeAttribute('data-theme');
        } else {
          document.documentElement.setAttribute('data-theme', saved);
        }
      }
    } catch {
      // Fallback for SSR
    }
  }, []);

  const handleSetThemeMode = (mode: 'auto' | 'light' | 'dark') => {
    setThemeMode(mode);
    try {
      localStorage.setItem('tutoria_theme_mode', mode);
    } catch {
      // Ignore storage errors
    }
    if (mode === 'auto') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', mode);
    }
  };

  // Feedback states
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Lesson & Unit selection
  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    initialSnapshot.lessons[0]?.id ?? ''
  );
  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    initialSnapshot.units.find((u) => u.lessonId === initialSnapshot.lessons[0]?.id)?.id ?? ''
  );
  const [showImportForm, setShowImportForm] = useState<boolean>(
    initialSnapshot.lessons.length === 0
  );

  // Curriculum PBA Explorer state
  const [curriculumSearchQuery, setCurriculumSearchQuery] = useState('');
  const [curriculumYearFilter, setCurriculumYearFilter] = useState<number | 'all'>('all');
  const [curriculumCampoFilter, setCurriculumCampoFilter] = useState<string | 'all'>('all');

  // Import form state
  const [importTitle, setImportTitle] = useState('');
  const [importSubject, setImportSubject] = useState<SubjectKind>('physics');
  const [importFormat, setImportFormat] = useState<'markdown' | 'text' | 'notes'>('markdown');
  const [importFilename, setImportFilename] = useState<string | null>(null);
  const [importContent, setImportContent] = useState('');

  // Editable Unit state
  const [isEditingUnit, setIsEditingUnit] = useState(false);
  const [editUnitTitle, setEditUnitTitle] = useState('');
  const [editUnitTopic, setEditUnitTopic] = useState('');
  const [editUnitType, setEditUnitType] = useState<
    'concept' | 'interactive-lab' | 'worked-example' | 'language-drill'
  >('concept');
  const [editUnitFormula, setEditUnitFormula] = useState('');
  const [editUnitMinutes, setEditUnitMinutes] = useState(5);
  const [editUnitBody, setEditUnitBody] = useState('');

  // Add Unit modal/inline state
  const [showAddUnitForm, setShowAddUnitForm] = useState(false);
  const [newUnitTitle, setNewUnitTitle] = useState('');
  const [newUnitTopic, setNewUnitTopic] = useState('');
  const [newUnitBody, setNewUnitBody] = useState('');
  const [newUnitFormula, setNewUnitFormula] = useState('');

  // Candidate inline editing state
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null);
  const [candPromptDraft, setCandPromptDraft] = useState('');
  const [candAnswerDraft, setCandAnswerDraft] = useState('');
  const [candTopicDraft, setCandTopicDraft] = useState('');
  const [candExplanationDraft, setCandExplanationDraft] = useState('');

  // Practice & SRS state
  const [practiceSubMode, setPracticeSubMode] = useState<'srs' | 'quiz'>('srs');
  const [dueOnlyFilter, setDueOnlyFilter] = useState<boolean>(true);
  const [weakTopicFilter, setWeakTopicFilter] = useState<string | null>(null);
  const [cardFlipped, setCardFlipped] = useState<boolean>(false);
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [showSrsMathInspector, setShowSrsMathInspector] = useState<boolean>(false);
  const [lastSrsTransition, setLastSrsTransition] = useState<SrsTransitionResult | null>(null);

  // Short quiz state
  const [activeQuizIndex, setActiveQuizIndex] = useState<number>(0);
  const [selectedQuizChoice, setSelectedQuizChoice] = useState<string>('');
  const [quizOutcome, setQuizOutcome] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
    explanation: string;
  } | null>(null);

  // Focus Study Session Timer
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Goals, Manual Sessions & Notes form states
  const [goalTitle, setGoalTitle] = useState('');
  const [goalMetric, setGoalMetric] = useState<
    'weekly_minutes' | 'weekly_reviews' | 'units_completed'
  >('weekly_minutes');
  const [goalTarget, setGoalTarget] = useState(90);

  const [manualSessionTopic, setManualSessionTopic] = useState('Práctica general de ciencia y matemáticas');
  const [manualSessionMinutes, setManualSessionMinutes] = useState(25);
  const [manualSessionReflection, setManualSessionReflection] = useState('');

  const [noteSearch, setNoteSearch] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteTopic, setNoteTopic] = useState('');
  const [noteBody, setNoteBody] = useState('');

  // Backup & Reset confirmation states
  const [backupLabel, setBackupLabel] = useState('');
  const [resetConfirmInput, setResetConfirmInput] = useState('');
  const [deleteAllConfirmInput, setDeleteAllConfirmInput] = useState('');
  const [deleteBackupsToo, setDeleteBackupsToo] = useState(false);

  // Persist snapshot locally for offline access & monitor online status
  useEffect(() => {
    saveOfflineSnapshotCache(snapshot);
  }, [snapshot]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setOfflineQueue(loadOfflineQueue());

    const verifyLocalServer = async () => {
      try {
        const res = await fetch('/api/bootstrap', { method: 'GET', cache: 'no-store' });
        setIsOnline(res.ok);
      } catch {
        setIsOnline(false);
      }
    };

    void verifyLocalServer();

    const onOnline = () => {
      void verifyLocalServer();
    };
    const onOffline = () => {
      void verifyLocalServer();
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Focus session timer tick
  useEffect(() => {
    if (!timerRunning) return;
    const handle = setInterval(() => {
      setTimerSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(handle);
  }, [timerRunning]);

  // Keep selected lesson & unit aligned when snapshot updates
  useEffect(() => {
    if (snapshot.lessons.length === 0) {
      setSelectedLessonId('');
      setSelectedUnitId('');
      return;
    }
    const currentExists = snapshot.lessons.some((l) => l.id === selectedLessonId);
    const targetLessonId = currentExists ? selectedLessonId : snapshot.lessons[0].id;
    if (targetLessonId !== selectedLessonId) {
      setSelectedLessonId(targetLessonId);
    }

    const lessonUnits = snapshot.units.filter((u) => u.lessonId === targetLessonId);
    if (lessonUnits.length === 0) {
      setSelectedUnitId('');
    } else if (!lessonUnits.some((u) => u.id === selectedUnitId)) {
      setSelectedUnitId(lessonUnits[0].id);
    }
  }, [snapshot.lessons, snapshot.units, selectedLessonId, selectedUnitId]);

  const refreshWorkspace = useCallback(async () => {
    try {
      const res = await fetch('/api/bootstrap', { cache: 'no-store' });
      if (!res.ok) throw new Error('No se pudo actualizar el espacio de trabajo desde el servidor local.');
      const data = (await res.json()) as WorkspaceSnapshot;
      if (data && Array.isArray(data.lessons)) {
        setSnapshot(data);
      }
    } catch {
      const cached = loadOfflineSnapshotCache<WorkspaceSnapshot>();
      if (cached) {
        setSnapshot(cached);
      }
    }
  }, []);

  const syncOfflineQueue = useCallback(async () => {
    const queue = loadOfflineQueue();
    if (queue.length === 0) return;
    setBusyAction('Sincronizando acciones guardadas sin conexión…');
    const remaining: QueuedOfflineMutation[] = [];

    for (const item of queue) {
      try {
        const res = await fetch(item.endpoint, {
          method: item.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.body),
        });
        if (!res.ok) {
          remaining.push(item);
        }
      } catch {
        remaining.push(item);
      }
    }

    saveOfflineQueue(remaining);
    setOfflineQueue(remaining);
    setBusyAction(null);
    await refreshWorkspace();
    if (remaining.length === 0) {
      setSuccessMessage('Todas las acciones de estudio sin conexión se sincronizaron con tu SQLite local.');
    }
  }, [refreshWorkspace]);

  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      void syncOfflineQueue();
    }
  }, [isOnline, offlineQueue.length, syncOfflineQueue]);

  // Derived collections
  const selectedLesson = useMemo(
    () => snapshot.lessons.find((l) => l.id === selectedLessonId) ?? null,
    [snapshot.lessons, selectedLessonId]
  );

  const activeLessonUnits = useMemo(
    () => snapshot.units.filter((u) => u.lessonId === selectedLessonId),
    [snapshot.units, selectedLessonId]
  );

  const selectedUnit = useMemo(
    () => activeLessonUnits.find((u) => u.id === selectedUnitId) ?? activeLessonUnits[0] ?? null,
    [activeLessonUnits, selectedUnitId]
  );

  const activeLessonSteps = useMemo(
    () => snapshot.studyPlanSteps.filter((s) => s.lessonId === selectedLessonId),
    [snapshot.studyPlanSteps, selectedLessonId]
  );

  const activeLessonCandidates = useMemo(
    () => snapshot.pendingCandidates.filter((c) => c.lessonId === selectedLessonId),
    [snapshot.pendingCandidates, selectedLessonId]
  );

  const filteredFlashcards = useMemo(() => {
    let deck = snapshot.flashcards;
    if (weakTopicFilter) {
      deck = deck.filter((c) => c.topic.toLowerCase() === weakTopicFilter.toLowerCase());
    } else if (dueOnlyFilter) {
      deck = deck.filter((c) => c.isDue);
    }
    return deck;
  }, [snapshot.flashcards, dueOnlyFilter, weakTopicFilter]);

  const currentFlashcard =
    filteredFlashcards[Math.min(activeCardIndex, Math.max(0, filteredFlashcards.length - 1))] ??
    null;

  const filteredQuizzes = useMemo(() => {
    if (weakTopicFilter) {
      return snapshot.quizQuestions.filter(
        (q) => q.topic.toLowerCase() === weakTopicFilter.toLowerCase()
      );
    }
    return snapshot.quizQuestions;
  }, [snapshot.quizQuestions, weakTopicFilter]);

  const currentQuiz =
    filteredQuizzes[Math.min(activeQuizIndex, Math.max(0, filteredQuizzes.length - 1))] ??
    null;

  const languageUnits = useMemo(
    () =>
      snapshot.units
        .filter((u) => u.unitType === 'language-drill')
        .map((u) => ({ id: u.id, title: u.title, body: u.body })),
    [snapshot.units]
  );

  const filteredNotes = useMemo(() => {
    const q = noteSearch.trim().toLowerCase();
    if (!q) return snapshot.notes;
    return snapshot.notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.topic.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q)
    );
  }, [snapshot.notes, noteSearch]);

  const dueCount = useMemo(
    () => snapshot.flashcards.filter((c) => c.isDue).length,
    [snapshot.flashcards]
  );

  // Handlers
  function notifySuccess(msg: string) {
    setErrorMessage(null);
    setSuccessMessage(msg);
  }

  function notifyError(msg: string) {
    setSuccessMessage(null);
    setErrorMessage(msg);
  }

  function handleLoadSampleTemplate(templateId: string) {
    const tpl = SAMPLE_NOTE_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setImportTitle(tpl.title);
    setImportSubject(tpl.subject);
    setImportFormat(tpl.sourceFormat);
    setImportFilename(`${tpl.id}.md`);
    setImportContent(tpl.content);
    setShowImportForm(true);
    notifySuccess(
      `Se cargó "${tpl.label}" en el editor. Puedes editar cualquier línea antes de dividirla en unidades.`
    );
  }

  async function handleSyncCurriculumPBA(options?: {
    overwrite?: boolean;
    stageCandidates?: boolean;
  }) {
    setBusyAction('Sincronizando el Diseño Curricular de Electromecánica PBA (1° a 7° Año)…');
    try {
      const res = await fetch('/api/curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options || {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo sincronizar el currículum PBA.');
      if (data.snapshot) {
        setSnapshot(data.snapshot);
        if (data.snapshot.lessons.length > 0) {
          setSelectedLessonId(data.snapshot.lessons[0].id);
          const firstUnit = data.snapshot.units.find(
            (u: { lessonId: string }) => u.lessonId === data.snapshot.lessons[0].id
          );
          if (firstUnit) setSelectedUnitId(firstUnit.id);
        }
      }
      notifySuccess(data.message || 'Se sincronizó el currículum de Electromecánica PBA.');
      setActiveTab('lessons');
    } catch (err) {
      notifyError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al sincronizar el currículum PBA.'
      );
    } finally {
      setBusyAction(null);
    }
  }

  function handleLoadCurriculumTopic(
    topic: PBATopic,
    subject: PBASubject,
    year: PBACurriculumYear
  ) {
    const matchingLesson =
      PBA_ELECTROMECANICA_LESSONS.find(
        (l) =>
          l.year === year.year &&
          (l.title.toLowerCase().includes(topic.name.toLowerCase().slice(0, 20)) ||
            l.subjectName.toLowerCase() === subject.name.toLowerCase())
      ) ||
      PBA_ELECTROMECANICA_LESSONS.find(
        (l) =>
          l.title.toLowerCase().includes(topic.name.toLowerCase().slice(0, 20)) ||
          topic.name.toLowerCase().split(/\s+/).some((word) => word.length >= 4 && l.title.toLowerCase().includes(word))
      );


    if (matchingLesson) {
      setImportTitle(matchingLesson.title);
      setImportSubject(matchingLesson.subject);
      setImportFormat('markdown');
      setImportFilename(`${matchingLesson.id}.md`);
      setImportContent(matchingLesson.content);
    } else {
      const formulaBlock = topic.keyFormula ? `\`${topic.keyFormula}\`\n\n` : '';
      const markdown = `# ${topic.name} (${year.yearLabel} PBA - ${subject.name})

## Fundamentos Técnicos y Principios
Tema: ${topic.name}
${formulaBlock}**${topic.name}**: ${topic.summary}
Conceptos fundamentales: ${topic.keyConcepts.join(', ')}.

## Aplicación Práctica en Taller o Industria
Tema: Aplicación práctica en ${subject.name}
**Desarrollo en taller o planta**: ${topic.practicalApplication}
En el entorno electromecánico bonaerense, dominar estos conceptos permite garantizar la seguridad operativa, prevenir averías y optimizar los procesos de transformación energética.`;

      setImportTitle(`${topic.name} (${year.yearLabel} PBA)`);
      setImportSubject(
        subject.name.toLowerCase().includes('matemática')
          ? 'mathematics'
          : subject.name.toLowerCase().includes('química')
          ? 'chemistry'
          : subject.name.toLowerCase().includes('plc') ||
              subject.name.toLowerCase().includes('computación')
          ? 'computer-science'
          : 'physics'
      );
      setImportFormat('markdown');
      setImportFilename(`${topic.id}.md`);
      setImportContent(markdown);
    }

    setShowImportForm(true);
    setActiveTab('lessons');
    notifySuccess(
      `Se cargó "${topic.name}" (${year.yearLabel} - ${subject.name}) en el editor de estudio. Puedes personalizar cualquier punto antes de generar el plan interactivo.`
    );
  }

  const filteredCurriculum = useMemo(() => {
    const q = curriculumSearchQuery.trim().toLowerCase();
    return PBA_ELECTROMECANICA_CURRICULUM.map((yr) => {
      if (curriculumYearFilter !== 'all' && yr.year !== curriculumYearFilter) {
        return null;
      }

      const matchingSubjects = yr.subjects
        .map((subj) => {
          if (curriculumCampoFilter !== 'all' && subj.campo !== curriculumCampoFilter) {
            return null;
          }

          const matchingTopics = subj.topics.filter((topic) => {
            if (!q) return true;
            return (
              topic.name.toLowerCase().includes(q) ||
              topic.summary.toLowerCase().includes(q) ||
              (topic.keyFormula && topic.keyFormula.toLowerCase().includes(q)) ||
              topic.practicalApplication.toLowerCase().includes(q) ||
              topic.keyConcepts.some((c) => c.toLowerCase().includes(q)) ||
              subj.name.toLowerCase().includes(q)
            );
          });

          const subjectMatchesDirectly =
            !q ||
            subj.name.toLowerCase().includes(q) ||
            subj.description.toLowerCase().includes(q);

          if (matchingTopics.length === 0 && !subjectMatchesDirectly) {
            return null;
          }

          return {
            ...subj,
            topics: matchingTopics.length > 0 ? matchingTopics : subj.topics,
          };
        })
        .filter((s): s is PBASubject => s !== null);

      if (matchingSubjects.length === 0) {
        return null;
      }

      return {
        ...yr,
        subjects: matchingSubjects,
      };
    }).filter((yr): yr is PBACurriculumYear => yr !== null);
  }, [curriculumSearchQuery, curriculumYearFilter, curriculumCampoFilter]);


  function handleFileImportUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 512 * 1024) {
      notifyError('El archivo supera el límite de 512 KB. Importa un archivo Markdown o de texto más pequeño.');
      e.target.value = '';
      return;
    }

    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.md') && !lower.endsWith('.markdown') && !lower.endsWith('.txt')) {
      notifyError('Extensión no compatible. Elige un archivo .md, .markdown o .txt.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      setImportContent(text);
      setImportFilename(file.name);
      setImportFormat(lower.endsWith('.txt') ? 'text' : 'markdown');
      if (!importTitle.trim()) {
        setImportTitle(file.name.replace(/\.(md|markdown|txt)$/i, ''));
      }
      notifySuccess(`Se leyó "${file.name}" localmente. Revisa y divide en unidades de aprendizaje abajo.`);
    };
    reader.onerror = () => {
      notifyError('No se pudo leer el archivo seleccionado. Intenta de nuevo o pega tu texto directamente.');
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function handleImportLesson(e: React.FormEvent) {
    e.preventDefault();
    if (importContent.trim().length < 12) {
      notifyError('Ingresa al menos 12 caracteres de Markdown, texto plano o apuntes de estudio.');
      return;
    }

    setBusyAction('Dividiendo apuntes en unidades editables y plan de estudio…');
    try {
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: importTitle.trim() || undefined,
          subject: importSubject,
          sourceFormat: importFormat,
          sourceFilename: importFilename,
          rawContent: importContent,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo importar la lección.');
      }
      setSnapshot(data.snapshot);
      setSelectedLessonId(data.created.lessonId);
      setShowImportForm(false);
      setImportTitle('');
      setImportContent('');
      setImportFilename(null);
      notifySuccess(
        `Se creó "${data.created.title}" con ${data.created.unitsCreated} unidades de aprendizaje editables y un plan de estudio secuenciado.`
      );
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Error al importar la lección.');
    } finally {
      setBusyAction(null);
    }
  }

  function beginEditingUnit() {
    if (!selectedUnit) return;
    setEditUnitTitle(selectedUnit.title);
    setEditUnitTopic(selectedUnit.topic);
    setEditUnitType(selectedUnit.unitType);
    setEditUnitFormula(selectedUnit.keyFormula ?? '');
    setEditUnitMinutes(selectedUnit.estimatedMinutes);
    setEditUnitBody(selectedUnit.body);
    setIsEditingUnit(true);
  }

  async function handleSaveUnitEdits(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUnit) return;
    setBusyAction('Guardando cambios de la unidad…');
    try {
      const res = await fetch(`/api/units/${selectedUnit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editUnitTitle,
          topic: editUnitTopic,
          unitType: editUnitType,
          keyFormula: editUnitFormula.trim() || null,
          estimatedMinutes: Number(editUnitMinutes) || 5,
          body: editUnitBody,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar la unidad.');
      setSnapshot(data.snapshot);
      setIsEditingUnit(false);
      notifySuccess('Se actualizó la unidad de aprendizaje y se recalcularon los parámetros interactivos.');
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'No se pudo actualizar la unidad de aprendizaje.');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSplitUnit() {
    if (!selectedUnit) return;
    setBusyAction('Dividiendo unidad…');
    try {
      const res = await fetch(`/api/units/${selectedUnit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ splitAtParagraph: 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo dividir la unidad.');
      setSnapshot(data.snapshot);
      setIsEditingUnit(false);
      notifySuccess('La unidad de aprendizaje se dividió en dos unidades editables.');
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'No se pudo dividir la unidad.');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDeleteUnit(unitId: string) {
    setBusyAction('Eliminando unidad…');
    try {
      const res = await fetch(`/api/units/${unitId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo eliminar la unidad.');
      setSnapshot(data.snapshot);
      setIsEditingUnit(false);
      notifySuccess('Se eliminó la unidad de aprendizaje.');
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'No se pudo eliminar la unidad.');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleAddUnit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLesson) return;
    setBusyAction('Agregando unidad…');
    try {
      const res = await fetch('/api/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: selectedLesson.id,
          title: newUnitTitle,
          topic: newUnitTopic || selectedLesson.title,
          unitType: newUnitFormula.trim() ? 'interactive-lab' : 'concept',
          body: newUnitBody,
          keyFormula: newUnitFormula.trim() || null,
          estimatedMinutes: 5,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo agregar la unidad.');
      setSnapshot(data.snapshot);
      setSelectedUnitId(data.unitId);
      setShowAddUnitForm(false);
      setNewUnitTitle('');
      setNewUnitTopic('');
      setNewUnitBody('');
      setNewUnitFormula('');
      notifySuccess('Se agregó una nueva unidad de aprendizaje editable.');
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'No se pudo agregar la unidad.');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCompleteUnitCheckpoint(unitId: string) {
    try {
      const res = await fetch(`/api/units/${unitId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      });
      const data = await res.json();
      if (res.ok && data.snapshot) {
        setSnapshot(data.snapshot);
      }
    } catch {
      // Offline queue if disconnected
      const q = enqueueOfflineMutation({
        endpoint: `/api/units/${unitId}`,
        method: 'PATCH',
        body: { completed: true },
        label: 'Completar punto de control de unidad',
      });
      setOfflineQueue(q);
    }
  }

  async function handleTogglePlanStep(stepId: string) {
    if (!selectedLesson) return;
    try {
      const res = await fetch(`/api/lessons/${selectedLesson.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toggleStepId: stepId }),
      });
      const data = await res.json();
      if (res.ok && data.snapshot) setSnapshot(data.snapshot);
    } catch {
      notifyError('No se pudo actualizar el paso del plan sin conexión.');
    }
  }

  async function handleGenerateCandidates() {
    if (!selectedLesson) return;
    setBusyAction('Generando borradores de tarjetas y cuestionarios para tu aprobación…');
    try {
      const res = await fetch('/api/candidates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: selectedLesson.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudieron generar los borradores.');
      setSnapshot(data.snapshot);
      notifySuccess(`Se prepararon ${data.stagedCount} borradores. ${data.notice}`);
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Falló la generación de borradores.');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCandidateDecision(
    candidateId: string,
    decision: 'approve' | 'reject' | 'edit',
    edits?: {
      prompt?: string;
      answer?: string;
      topic?: string;
      explanation?: string;
    }
  ) {
    setBusyAction(
      decision === 'approve'
        ? 'Aprobando elemento…'
        : decision === 'reject'
          ? 'Descartando borrador…'
          : 'Guardando edición del borrador…'
    );
    try {
      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, ...edits }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar el borrador.');
      setSnapshot(data.snapshot);
      if (editingCandidateId === candidateId) {
        setEditingCandidateId(null);
      }
      if (decision === 'approve') {
        notifySuccess('¡Aprobado! El elemento se incorporó a tu mazo activo de práctica.');
      } else if (decision === 'reject') {
        notifySuccess('Borrador descartado y excluido de tu mazo.');
      } else {
        notifySuccess('Cambios guardados en el borrador pendiente.');
      }
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Falló la acción sobre el borrador.');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleBulkCandidates(
    candidateIds: string[],
    decision: 'approve' | 'reject'
  ) {
    if (candidateIds.length === 0) return;
    setBusyAction(
      decision === 'approve' ? 'Aprobando borradores pendientes…' : 'Descartando borradores…'
    );
    try {
      const res = await fetch('/api/candidates/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateIds, decision }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falló la actualización masiva.');
      setSnapshot(data.snapshot);
      notifySuccess(
        decision === 'approve'
          ? `Se aprobaron ${candidateIds.length} elementos en tus tarjetas de estudio y cuestionarios cortos.`
          : `Se descartaron ${candidateIds.length} borradores.`
      );
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Falló la acción masiva sobre borradores.');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleRateFlashcard(cardId: string, action: SrsAction) {
    const targetCard = snapshot.flashcards.find((c) => c.id === cardId);
    const optimisticPreview = targetCard?.actionPreviews[action] ?? null;
    const actionLabel = SRS_ACTION_LABELS[action];

    setBusyAction(`Programando (${actionLabel})…`);
    try {
      const res = await fetch(`/api/flashcards/${cardId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo registrar el repaso.');
      setSnapshot(data.snapshot);
      setLastSrsTransition(data.transition);
      setCardFlipped(false);
      setActiveCardIndex(0);
    } catch {
      // Offline resilient fallback: queue review mutation & apply local preview!
      const q = enqueueOfflineMutation({
        endpoint: `/api/flashcards/${cardId}/review`,
        method: 'POST',
        body: { action, reviewedAt: new Date().toISOString() },
        label: `Calificar tarjeta (${actionLabel})`,
      });
      setOfflineQueue(q);
      if (optimisticPreview) {
        setLastSrsTransition(optimisticPreview);
        setSnapshot((prev) => ({
          ...prev,
          flashcards: prev.flashcards.map((c) =>
            c.id === cardId
              ? {
                  ...c,
                  state: optimisticPreview.state,
                  dueAt: optimisticPreview.dueAt,
                  intervalDays: optimisticPreview.intervalDays,
                  easeFactor: optimisticPreview.easeFactor,
                  repetitions: optimisticPreview.repetitions,
                  lapses: optimisticPreview.lapses,
                  isDue: false,
                }
              : c
          ),
        }));
      }
      setCardFlipped(false);
      notifySuccess(
        `Modo sin conexión: se guardó la calificación "${actionLabel}" en cola local; se sincronizará automáticamente al reconectar.`
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSubmitQuizAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (!currentQuiz || !selectedQuizChoice.trim()) {
      notifyError('Selecciona una opción de respuesta antes de comprobar.');
      return;
    }
    setBusyAction('Comprobando respuesta…');
    try {
      const res = await fetch('/api/quizzes/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuiz.id,
          submittedAnswer: selectedQuizChoice,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo enviar el intento de cuestionario.');
      setQuizOutcome(data.result);
      setSnapshot(data.snapshot);
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Falló la comprobación del cuestionario.');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleFinishTimerSession() {
    const minutes = Math.max(0.5, Math.round((timerSeconds / 60) * 10) / 10);
    setTimerRunning(false);
    setTimerSeconds(0);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: selectedLesson?.id ?? null,
          topic: selectedLesson?.title ?? 'Autoestudio enfocado',
          activityType: activeTab === 'practice' ? 'retrieval-review' : 'interactive-lesson',
          durationMinutes: minutes,
          itemsCompleted: 1,
          reflection: 'Registrada con el temporizador de enfoque.',
        }),
      });
      const data = await res.json();
      if (res.ok && data.snapshot) {
        setSnapshot(data.snapshot);
        notifySuccess(`Se registró una sesión de enfoque de ${minutes} min en tu avance sin rachas.`);
      }
    } catch {
      const q = enqueueOfflineMutation({
        endpoint: '/api/sessions',
        method: 'POST',
        body: {
          topic: selectedLesson?.title ?? 'Autoestudio enfocado',
          activityType: 'interactive-lesson',
          durationMinutes: minutes,
          itemsCompleted: 1,
          reflection: 'Registrada sin conexión mediante el temporizador de enfoque.',
        },
        label: `Sesión de enfoque (${minutes}m)`,
      });
      setOfflineQueue(q);
      notifySuccess(`Sesión de enfoque de ${minutes} min guardada en cola sin conexión.`);
    }
  }

  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault();
    setBusyAction('Guardando meta personal…');
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: goalTitle,
          metric: goalMetric,
          targetValue: Number(goalTarget),
          period: 'weekly',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo crear la meta.');
      setSnapshot(data.snapshot);
      setGoalTitle('');
      notifySuccess('Meta personal de estudio agregada.');
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'No se pudo crear la meta.');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDeleteGoal(id: string) {
    const res = await fetch('/api/goals', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (res.ok && data.snapshot) setSnapshot(data.snapshot);
  }

  async function handleLogManualSession(e: React.FormEvent) {
    e.preventDefault();
    setBusyAction('Registrando sesión de estudio…');
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: selectedLesson?.id ?? null,
          topic: manualSessionTopic,
          activityType: 'interactive-lesson',
          durationMinutes: Number(manualSessionMinutes),
          itemsCompleted: 1,
          reflection: manualSessionReflection,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo registrar la sesión.');
      setSnapshot(data.snapshot);
      setManualSessionReflection('');
      notifySuccess('Sesión de estudio registrada.');
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'No se pudo registrar la sesión.');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCreateNote(e: React.FormEvent) {
    e.preventDefault();
    setBusyAction('Guardando apunte de estudio…');
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: selectedLesson?.id ?? null,
          unitId: selectedUnit?.id ?? null,
          topic: noteTopic.trim() || selectedUnit?.topic || 'Apuntes de estudio',
          title: noteTitle,
          body: noteBody,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar el apunte.');
      setSnapshot(data.snapshot);
      setNoteTitle('');
      setNoteBody('');
      notifySuccess('Apunte guardado en tu base SQLite local.');
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'No se pudo guardar el apunte.');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDeleteNote(id: string) {
    const res = await fetch('/api/notes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (res.ok && data.snapshot) setSnapshot(data.snapshot);
  }

  async function handleCreateBackup(e: React.FormEvent) {
    e.preventDefault();
    setBusyAction('Escribiendo archivo de respaldo local…');
    try {
      const res = await fetch('/api/data/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', label: backupLabel || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falló la creación del respaldo.');
      setSnapshot(data.snapshot);
      setBackupLabel('');
      notifySuccess(`Se creó el respaldo local "${data.backup.filename}".`);
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Falló la creación del respaldo.');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleRestoreLocalBackup(filename: string) {
    setBusyAction(`Restaurando "${filename}"…`);
    try {
      const res = await fetch('/api/data/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', filename }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falló la restauración.');
      setSnapshot(data.snapshot);
      notifySuccess(
        `Se restauraron ${data.restored.restoredLessons} lecciones y ${data.restored.restoredFlashcards} tarjetas desde "${filename}".`
      );
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Falló la restauración del respaldo.');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleImportBackupBundleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusyAction('Validando y restaurando paquete JSON exportado…');
    try {
      const rawText = await file.text();
      const json = JSON.parse(rawText);
      const res = await fetch('/api/data/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Paquete de respaldo inválido.');
      setSnapshot(data.snapshot);
      notifySuccess(
        `Se importaron ${data.restored.restoredLessons} lecciones y ${data.restored.restoredFlashcards} tarjetas de estudio.`
      );
    } catch (err) {
      notifyError(
        err instanceof Error
          ? `No se pudo importar el respaldo JSON: ${err.message}`
          : 'Archivo JSON de respaldo inválido.'
      );
    } finally {
      setBusyAction(null);
      e.target.value = '';
    }
  }

  async function handleResetOrDelete(mode: 'progress-only' | 'delete-all') {
    const confirmationText =
      mode === 'progress-only' ? resetConfirmInput.trim() : deleteAllConfirmInput.trim();
    setBusyAction(
      mode === 'delete-all'
        ? 'Eliminando permanentemente todos los datos locales de aprendizaje…'
        : 'Reiniciando calendarios de estudio y progreso…'
    );
    try {
      const res = await fetch('/api/data/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          confirmationText,
          removeBackups: mode === 'delete-all' ? deleteBackupsToo : false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Solicitud de reinicio rechazada.');

      if (mode === 'delete-all') {
        await clearAllClientOfflineData();
        setOfflineQueue([]);
        setDeleteAllConfirmInput('');
        setShowImportForm(true);
        notifySuccess(
          'Se eliminaron todos los datos locales de aprendizaje y se limpiaron las cachés sin conexión. Tu espacio está completamente limpio.'
        );
      } else {
        setResetConfirmInput('');
        notifySuccess(
          'Se reiniciaron los intervalos de repaso, contadores de cuestionarios y sesiones de estudio, conservando intactas tus lecciones y apuntes.'
        );
      }
      setSnapshot(data.snapshot);
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'La operación falló.');
    } finally {
      setBusyAction(null);
    }
  }

  function startWeakTopicPractice(topic: string) {
    setWeakTopicFilter(topic);
    setDueOnlyFilter(false);
    setActiveCardIndex(0);
    setActiveQuizIndex(0);
    setCardFlipped(false);
    setQuizOutcome(null);
    setActiveTab('practice');
    notifySuccess(`Repaso enfocado de tema por reforzar activo para "${topic}".`);
  }

  const formattedTimer = `${String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:${String(
    timerSeconds % 60
  ).padStart(2, '0')}`;

  const resetConfirmed =
    resetConfirmInput.trim() === 'REINICIAR' || resetConfirmInput.trim() === 'RESET';
  const deleteAllConfirmed =
    deleteAllConfirmInput.trim() === 'ELIMINAR TODO' ||
    deleteAllConfirmInput.trim() === 'DELETE ALL';

  return (
    <div className="workbench-shell">
      {/* Honesty & Local-First Status Strip */}
      <div className="honesty-strip" role="region" aria-label="Estado de alcance y almacenamiento local">
        <span>
          <strong>Solo autoestudio personal:</strong> Contenido propio · Sin instrucción
          acreditada, certificados ni calificaciones oficiales · Cero cuentas o telemetría
        </span>
        <div className="status-cluster">
          <span className={`status-tag ${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? 'Servidor local conectado' : 'Modo sin conexión (en caché)'}
          </span>
          <span className="status-tag" title={swStatus.message}>
            SQLite: {snapshot.storage.databaseFile}
          </span>
          {offlineQueue.length > 0 && (
            <button
              id="sync-offline-queue-btn"
              type="button"
              className="btn btn-sm"
              onClick={syncOfflineQueue}
            >
              Sincronizar {offlineQueue.length} en cola
            </button>
          )}
        </div>
      </div>

      {/* Primary Header & Navigation */}
      <header className="top-header">
        <div className="top-header-inner">
          <div className="brand-group">
            <div className="brand-logo-symbol" aria-hidden="true">
              <SFSymbol name="graduationcap" size={22} color="var(--apple-blue)" />
            </div>
            <div>
              <span className="brand-mark">TutorIA</span>
              <span className="brand-subtitle">Cuaderno interactivo de ciencias y repaso activo</span>
            </div>
          </div>

          <nav className="primary-nav" role="tablist" aria-label="Secciones del cuaderno de estudio">
            <button
              id="nav-tab-lessons"
              role="tab"
              aria-selected={activeTab === 'lessons'}
              className="nav-tab"
              onClick={() => setActiveTab('lessons')}
            >
              <SFSymbol name="book.pages" size={15} />
              <span>Plan y lecciones</span>
              {snapshot.pendingCandidates.length > 0 && (
                <span className="nav-count" title="Borradores esperando tu aprobación">
                  {snapshot.pendingCandidates.length} borr.
                </span>
              )}
            </button>
            <button
              id="nav-tab-curriculum"
              role="tab"
              aria-selected={activeTab === 'curriculum'}
              className="nav-tab"
              onClick={() => setActiveTab('curriculum')}
            >
              <SFSymbol name="graduationcap" size={15} />
              <span>Currículum PBA</span>
              <span className="nav-count">7 años</span>
            </button>
            <button
              id="nav-tab-practice"
              role="tab"
              aria-selected={activeTab === 'practice'}
              className="nav-tab"
              onClick={() => setActiveTab('practice')}
            >
              <SFSymbol name="brain.head.profile" size={15} />
              <span>Práctica y pendientes</span>
              <span className="nav-count">{dueCount}</span>
            </button>
            <button
              id="nav-tab-language"
              role="tab"
              aria-selected={activeTab === 'language'}
              className="nav-tab"
              onClick={() => setActiveTab('language')}
            >
              <SFSymbol name="waveform" size={15} />
              <span>Laboratorio de idiomas</span>
            </button>
            <button
              id="nav-tab-progress"
              role="tab"
              aria-selected={activeTab === 'progress'}
              className="nav-tab"
              onClick={() => setActiveTab('progress')}
            >
              <SFSymbol name="chart.xyaxis.line" size={15} />
              <span>Avance, metas y apuntes</span>
              {snapshot.progress.weakTopics.length > 0 && (
                <span className="nav-count">{snapshot.progress.weakTopics.length} por reforzar</span>
              )}
            </button>
            <button
              id="nav-tab-data"
              role="tab"
              aria-selected={activeTab === 'data'}
              className="nav-tab"
              onClick={() => setActiveTab('data')}
            >
              <SFSymbol name="externaldrive" size={15} />
              <span>Datos locales y respaldos</span>
            </button>
          </nav>

          {/* Right Header Controls: Apple Theme Selector + Focus Timer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="theme-toggle-cluster" role="radiogroup" aria-label="Modo de apariencia visual">
              <button
                type="button"
                className={`theme-chip ${themeMode === 'auto' ? 'active' : ''}`}
                onClick={() => handleSetThemeMode('auto')}
                title="Automático (sigue la preferencia del sistema operativo)"
                aria-label="Apariencia automática según el sistema"
              >
                <SFSymbol name="gearshape" size={12} />
                <span>Auto</span>
              </button>
              <button
                type="button"
                className={`theme-chip ${themeMode === 'light' ? 'active' : ''}`}
                onClick={() => handleSetThemeMode('light')}
                title="Modo claro Apple Liquid Glass"
                aria-label="Modo claro"
              >
                <SFSymbol name="sun.max.fill" size={12} color="var(--apple-orange)" />
                <span>Claro</span>
              </button>
              <button
                type="button"
                className={`theme-chip ${themeMode === 'dark' ? 'active' : ''}`}
                onClick={() => handleSetThemeMode('dark')}
                title="Modo oscuro Apple Liquid Glass"
                aria-label="Modo oscuro"
              >
                <SFSymbol name="moon.fill" size={12} color="var(--apple-indigo)" />
                <span>Oscuro</span>
              </button>
            </div>

            {/* Compact Focus Timer */}
            <div className="timer-pill" aria-label="Temporizador de sesión de estudio">
              <SFSymbol name="timer" size={15} color="var(--apple-blue)" />
              <span className="timer-readout">{formattedTimer}</span>
              {!timerRunning ? (
                <button
                  id="focus-timer-start-btn"
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setTimerRunning(true)}
                >
                  <SFSymbol name="play.fill" size={11} />
                  <span>Iniciar enfoque</span>
                </button>
              ) : (
                <button
                  id="focus-timer-pause-btn"
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setTimerRunning(false)}
                >
                  <SFSymbol name="pause.fill" size={11} />
                  <span>Pausar</span>
                </button>
              )}
              {timerSeconds >= 5 && (
                <button
                  id="focus-timer-log-btn"
                  type="button"
                  className="btn btn-sage btn-sm"
                  onClick={handleFinishTimerSession}
                >
                  <SFSymbol name="checkmark.circle.fill" size={12} />
                  <span>Registrar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="workbench-main">
        {/* Global Loading / Success / Recoverable Error Banners */}
        {busyAction && (
          <div className="banner banner-info" role="status" aria-live="polite">
            <span>{busyAction}</span>
          </div>
        )}

        {successMessage && (
          <div className="banner banner-success" role="status" aria-live="polite">
            <span>{successMessage}</span>
            <button
              id="dismiss-success-banner-btn"
              type="button"
              className="btn btn-sm"
              onClick={() => setSuccessMessage(null)}
            >
              Cerrar
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="banner banner-error" role="alert">
            <span>{errorMessage}</span>
            <div className="btn-row">
              <button
                id="retry-refresh-btn"
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  setErrorMessage(null);
                  void refreshWorkspace();
                }}
              >
                Actualizar estado
              </button>
              <button
                id="dismiss-error-banner-btn"
                type="button"
                className="btn btn-sm"
                onClick={() => setErrorMessage(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 1: STUDY PLAN & EDITABLE LESSONS + MANDATORY APPROVAL GATE
            ================================================================= */}
        {activeTab === 'lessons' && (
          <div>
            <div className="page-intro">
              <div>
                <h1>Planes de estudio interactivos y lecciones propias</h1>
                <p>
                  Importa tus propios apuntes en Markdown o texto plano para dividirlos en unidades
                  editables con exploradores de parámetros en vivo y ejercicios de recuperación
                  aprobados por ti.
                </p>
              </div>
              <div className="btn-row">
                <button
                  id="sync-pba-curriculum-header-btn"
                  type="button"
                  className="btn btn-sage"
                  onClick={() => handleSyncCurriculumPBA()}
                >
                  ⚙ Cargar Currículum Electromecánica PBA
                </button>
                <button
                  id="toggle-import-drawer-btn"
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowImportForm((v) => !v)}
                >
                  {showImportForm ? 'Ocultar importador de lecciones' : '+ Importar / Crear lección'}
                </button>
              </div>
            </div>

            {showImportForm && (
              <section
                className="panel"
                style={{ marginBottom: '1.5rem' }}
                aria-label="Importar o redactar una lección de estudio"
              >
                <div className="panel-header">
                  <div>
                    <h2>Importar Markdown, texto plano o apuntes</h2>
                    <p className="field-hint">
                      Pega tus apuntes, sube un archivo local <code>.md</code> / <code>.txt</code> o
                      carga una nota de ejemplo editable abajo.
                    </p>
                  </div>
                  <label
                    htmlFor="lesson-file-upload-input"
                    className="btn btn-sm"
                    style={{ cursor: 'pointer' }}
                  >
                    Subir archivo .md / .txt
                    <input
                      id="lesson-file-upload-input"
                      type="file"
                      accept=".md,.markdown,.txt,text/markdown,text/plain"
                      style={{ display: 'none' }}
                      onChange={handleFileImportUpload}
                    />
                  </label>
                </div>

                <div className="btn-row" style={{ marginBottom: '1rem' }}>
                  <span className="field-hint">Cargar nota de ejemplo editable:</span>
                  {SAMPLE_NOTE_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      id={`sample-template-btn-${tpl.id}`}
                      type="button"
                      className="btn btn-sm"
                      onClick={() => handleLoadSampleTemplate(tpl.id)}
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleImportLesson}>
                  <div className="two-col-grid" style={{ gap: '0.85rem' }}>
                    <div className="field-group">
                      <label htmlFor="import-lesson-title" className="field-label">
                        Título de la lección (Opcional: se deduce del primer encabezado si se deja vacío)
                      </label>
                      <input
                        id="import-lesson-title"
                        className="input"
                        type="text"
                        placeholder="Ej.: Osciladores armónicos y leyes de escala"
                        value={importTitle}
                        onChange={(e) => setImportTitle(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="field-group">
                        <label htmlFor="import-lesson-subject" className="field-label">
                          Área temática
                        </label>
                        <select
                          id="import-lesson-subject"
                          className="select"
                          value={importSubject}
                          onChange={(e) => setImportSubject(e.target.value as SubjectKind)}
                        >
                          <option value="physics">Física</option>
                          <option value="mathematics">Matemáticas</option>
                          <option value="chemistry">Química</option>
                          <option value="biology">Biología</option>
                          <option value="computer-science">Ciencias de la Computación</option>
                          <option value="general-science">Ciencia General</option>
                          <option value="language">Práctica de Idiomas</option>
                        </select>
                      </div>

                      <div className="field-group">
                        <label htmlFor="import-lesson-format" className="field-label">
                          Formato de origen
                        </label>
                        <select
                          id="import-lesson-format"
                          className="select"
                          value={importFormat}
                          onChange={(e) =>
                            setImportFormat(e.target.value as 'markdown' | 'text' | 'notes')
                          }
                        >
                          <option value="markdown">Markdown</option>
                          <option value="text">Texto plano</option>
                          <option value="notes">Apuntes personales</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="field-group">
                    <label htmlFor="import-lesson-content" className="field-label">
                      Contenido de la lección (Los encabezados o párrafos se convierten en unidades editables)
                    </label>
                    <textarea
                      id="import-lesson-content"
                      className="textarea textarea-mono"
                      style={{ minHeight: '190px' }}
                      placeholder={`# Título de la lección\n\n## Concepto 1\n**Definición**: Explica la idea principal...\n\`T = 2 * pi * sqrt(L / g)\``}
                      value={importContent}
                      onChange={(e) => setImportContent(e.target.value)}
                    />
                  </div>

                  <div className="btn-row">
                    <button
                      id="import-lesson-submit-btn"
                      type="submit"
                      className="btn btn-primary"
                      disabled={Boolean(busyAction)}
                    >
                      Dividir en plan de estudio y unidades editables
                    </button>
                    {snapshot.lessons.length > 0 && (
                      <button
                        id="import-lesson-cancel-btn"
                        type="button"
                        className="btn"
                        onClick={() => setShowImportForm(false)}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </section>
            )}

            {snapshot.lessons.length === 0 ? (
              <section className="empty-state" aria-label="Aviso de cuaderno vacío">
                <h2>Tu cuaderno de estudio local está vacío</h2>
                <p>
                  TutorIA no incluye cursos comerciales con licencia para que todo en tu base de
                  datos te pertenezca por completo. Pega tus apuntes de matemáticas, ciencias o
                  idiomas arriba —o carga una nota de ejemplo— para generar un plan interactivo.
                </p>
                <div className="btn-row">
                  <button
                    id="empty-load-sample-physics-btn"
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleLoadSampleTemplate('pendulum-harmonic')}
                  >
                    Cargar ejemplo de Física en el editor
                  </button>
                  <button
                    id="empty-load-sample-math-btn"
                    type="button"
                    className="btn"
                    onClick={() => handleLoadSampleTemplate('derivatives-linearization')}
                  >
                    Cargar ejemplo de Cálculo
                  </button>
                  <button
                    id="empty-load-curriculum-pba-btn"
                    type="button"
                    className="btn btn-sage"
                    onClick={() => handleSyncCurriculumPBA()}
                  >
                    ⚙ Cargar Currículum Oficial de Electromecánica PBA (1° a 7° Año)
                  </button>
                </div>
              </section>
            ) : (
              <div className="split-layout">
                {/* Left Sidebar: Lessons & Study Plan Checklist */}
                <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                  <section className="panel" aria-label="Lista de lecciones creadas">
                    <div className="panel-header">
                      <h3>Tus lecciones</h3>
                      <span className="badge">{snapshot.lessons.length}</span>
                    </div>
                    <ul className="item-list">
                      {snapshot.lessons.map((lesson) => {
                        const isSelected = lesson.id === selectedLessonId;
                        return (
                          <li key={lesson.id}>
                            <button
                              id={`select-lesson-btn-${lesson.id}`}
                              type="button"
                              className={`lesson-list-btn ${isSelected ? 'active' : ''}`}
                              onClick={() => {
                                setSelectedLessonId(lesson.id);
                                setIsEditingUnit(false);
                              }}
                            >
                              <div style={{ fontWeight: 600 }}>{lesson.title}</div>
                              <div className="meta-line">
                                <span className="badge">
                                  {SUBJECT_LABELS[lesson.subject] ?? lesson.subject}
                                </span>
                                <span>~{lesson.estimatedMinutes} min</span>
                                {lesson.sourceFilename && (
                                  <span className="mono">{lesson.sourceFilename}</span>
                                )}
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>

                  {selectedLesson && (
                    <section className="panel" aria-label="Pasos del plan de estudio">
                      <div className="panel-header">
                        <h3>Plan de estudio</h3>
                        <span className="field-hint">Autoguía no acreditada</span>
                      </div>
                      <ul className="plan-step-list">
                        {activeLessonSteps.map((step) => (
                          <li
                            key={step.id}
                            className={`plan-step-item ${step.completed ? 'done' : ''}`}
                          >
                            <label
                              htmlFor={`plan-step-check-${step.id}`}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.5rem',
                                cursor: 'pointer',
                              }}
                            >
                              <input
                                id={`plan-step-check-${step.id}`}
                                type="checkbox"
                                checked={step.completed}
                                onChange={() => handleTogglePlanStep(step.id)}
                                style={{ marginTop: '0.22rem' }}
                              />
                              <div>
                                <div style={{ fontWeight: 600 }}>{step.title}</div>
                                <div className="field-hint">{step.rationale}</div>
                              </div>
                            </label>
                            <span className="mono field-hint">{step.targetMinutes}m</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </aside>

                {/* Right Main Column: Approval Queue + Editable Learning Units + Interactive Practice */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                  {selectedLesson && (
                    <section className="panel" aria-label="Barra de herramientas de la lección">
                      <div className="panel-header" style={{ marginBottom: '0.4rem' }}>
                        <div>
                          <h2>{selectedLesson.title}</h2>
                          <p className="field-hint">{selectedLesson.summary}</p>
                        </div>
                        <div className="btn-row">
                          <button
                            id="generate-candidates-btn"
                            type="button"
                            className="btn btn-primary"
                            disabled={Boolean(busyAction)}
                            onClick={handleGenerateCandidates}
                          >
                            Generar borradores de tarjetas y cuestionario
                          </button>
                          <button
                            id="add-unit-toggle-btn"
                            type="button"
                            className="btn btn-sm"
                            onClick={() => setShowAddUnitForm((v) => !v)}
                          >
                            + Agregar unidad
                          </button>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* MANDATORY APPROVAL GATE FOR CANDIDATE FLASHCARDS & QUIZZES */}
                  {activeLessonCandidates.length > 0 && (
                    <section
                      id="approval-queue-section"
                      className="panel"
                      style={{ borderColor: 'var(--accent-amber)' }}
                      aria-label="Puerta de aprobación de tarjetas y cuestionarios"
                    >
                      <div className="panel-header">
                        <div>
                          <h3>
                            Puerta de aprobación ({activeLessonCandidates.length} borradores pendientes)
                          </h3>
                          <p className="field-hint">
                            Ningún elemento entra a tus tarjetas de estudio, cuestionarios cortos ni
                            calendario de repaso espaciado hasta que lo revises y apruebes aquí.
                          </p>
                        </div>
                        <div className="btn-row">
                          <button
                            id="approve-all-candidates-btn"
                            type="button"
                            className="btn btn-sage btn-sm"
                            disabled={Boolean(busyAction)}
                            onClick={() =>
                              handleBulkCandidates(
                                activeLessonCandidates.map((c) => c.id),
                                'approve'
                              )
                            }
                          >
                            Aprobar todo ({activeLessonCandidates.length})
                          </button>
                          <button
                            id="reject-all-candidates-btn"
                            type="button"
                            className="btn btn-danger btn-sm"
                            disabled={Boolean(busyAction)}
                            onClick={() =>
                              handleBulkCandidates(
                                activeLessonCandidates.map((c) => c.id),
                                'reject'
                              )
                            }
                          >
                            Descartar todo
                          </button>
                        </div>
                      </div>

                      <ul className="item-list">
                        {activeLessonCandidates.map((cand) => {
                          const isEditingThis = editingCandidateId === cand.id;
                          return (
                            <li
                              key={cand.id}
                              className="panel-subtle"
                              style={{ padding: '0.9rem 1rem' }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  flexWrap: 'wrap',
                                  gap: '0.5rem',
                                  marginBottom: '0.45rem',
                                }}
                              >
                                <div className="btn-row">
                                  <span
                                    className={`badge ${
                                      cand.itemType === 'flashcard' ? 'badge-teal' : 'badge-amber'
                                    }`}
                                  >
                                    {cand.itemType === 'flashcard'
                                      ? 'Borrador de tarjeta'
                                      : 'Borrador de cuestionario'}
                                  </span>
                                  <span className="badge">{cand.topic}</span>
                                </div>
                                <div className="btn-row">
                                  <button
                                    id={`edit-candidate-btn-${cand.id}`}
                                    type="button"
                                    className="btn btn-sm"
                                    onClick={() => {
                                      if (isEditingThis) {
                                        setEditingCandidateId(null);
                                      } else {
                                        setEditingCandidateId(cand.id);
                                        setCandPromptDraft(cand.prompt);
                                        setCandAnswerDraft(cand.answer);
                                        setCandTopicDraft(cand.topic);
                                        setCandExplanationDraft(cand.explanation);
                                      }
                                    }}
                                  >
                                    {isEditingThis ? 'Cancelar edición' : 'Editar borrador'}
                                  </button>
                                  <button
                                    id={`approve-candidate-btn-${cand.id}`}
                                    type="button"
                                    className="btn btn-sage btn-sm"
                                    disabled={Boolean(busyAction)}
                                    onClick={() =>
                                      handleCandidateDecision(
                                        cand.id,
                                        'approve',
                                        isEditingThis
                                          ? {
                                              prompt: candPromptDraft,
                                              answer: candAnswerDraft,
                                              topic: candTopicDraft,
                                              explanation: candExplanationDraft,
                                            }
                                          : undefined
                                      )
                                    }
                                  >
                                    Aprobar
                                  </button>
                                  <button
                                    id={`reject-candidate-btn-${cand.id}`}
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    disabled={Boolean(busyAction)}
                                    onClick={() => handleCandidateDecision(cand.id, 'reject')}
                                  >
                                    Descartar
                                  </button>
                                </div>
                              </div>

                              {isEditingThis ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                                  <input
                                    id={`cand-topic-input-${cand.id}`}
                                    className="input"
                                    value={candTopicDraft}
                                    onChange={(e) => setCandTopicDraft(e.target.value)}
                                    placeholder="Tema"
                                  />
                                  <textarea
                                    id={`cand-prompt-input-${cand.id}`}
                                    className="textarea"
                                    style={{ minHeight: '64px' }}
                                    value={candPromptDraft}
                                    onChange={(e) => setCandPromptDraft(e.target.value)}
                                  />
                                  <input
                                    id={`cand-answer-input-${cand.id}`}
                                    className="input"
                                    value={candAnswerDraft}
                                    onChange={(e) => setCandAnswerDraft(e.target.value)}
                                  />
                                  <input
                                    id={`cand-explanation-input-${cand.id}`}
                                    className="input"
                                    value={candExplanationDraft}
                                    onChange={(e) => setCandExplanationDraft(e.target.value)}
                                  />
                                  <div>
                                    <button
                                      id={`save-candidate-edit-btn-${cand.id}`}
                                      type="button"
                                      className="btn btn-primary btn-sm"
                                      onClick={() =>
                                        handleCandidateDecision(cand.id, 'edit', {
                                          prompt: candPromptDraft,
                                          answer: candAnswerDraft,
                                          topic: candTopicDraft,
                                          explanation: candExplanationDraft,
                                        })
                                      }
                                    >
                                      Guardar cambios del borrador
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ fontSize: '0.9rem' }}>
                                  <div>
                                    <strong>Pregunta:</strong> {cand.prompt}
                                  </div>
                                  <div style={{ marginTop: '0.2rem' }}>
                                    <strong>Respuesta:</strong> {cand.answer}
                                  </div>
                                  {cand.options.length > 0 && (
                                    <div className="field-hint" style={{ marginTop: '0.2rem' }}>
                                      Opciones: {cand.options.join(' · ')}
                                    </div>
                                  )}
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  )}

                  {/* Optional Add New Unit Form */}
                  {showAddUnitForm && selectedLesson && (
                    <section className="panel" aria-label="Agregar unidad de aprendizaje">
                      <h3>Agregar unidad de aprendizaje a {selectedLesson.title}</h3>
                      <form onSubmit={handleAddUnit} style={{ marginTop: '0.8rem' }}>
                        <div className="two-col-grid" style={{ gap: '0.75rem' }}>
                          <div className="field-group">
                            <label htmlFor="new-unit-title" className="field-label">
                              Título de la unidad
                            </label>
                            <input
                              id="new-unit-title"
                              className="input"
                              required
                              value={newUnitTitle}
                              onChange={(e) => setNewUnitTitle(e.target.value)}
                            />
                          </div>
                          <div className="field-group">
                            <label htmlFor="new-unit-topic" className="field-label">
                              Etiqueta de tema
                            </label>
                            <input
                              id="new-unit-topic"
                              className="input"
                              placeholder={selectedLesson.title}
                              value={newUnitTopic}
                              onChange={(e) => setNewUnitTopic(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="field-group">
                          <label htmlFor="new-unit-formula" className="field-label">
                            Ecuación o fórmula clave (Opcional)
                          </label>
                          <input
                            id="new-unit-formula"
                            className="input mono"
                            placeholder="Ej.: E = 0.5 * k * x^2"
                            value={newUnitFormula}
                            onChange={(e) => setNewUnitFormula(e.target.value)}
                          />
                        </div>
                        <div className="field-group">
                          <label htmlFor="new-unit-body" className="field-label">
                            Apuntes de la unidad
                          </label>
                          <textarea
                            id="new-unit-body"
                            className="textarea"
                            required
                            value={newUnitBody}
                            onChange={(e) => setNewUnitBody(e.target.value)}
                          />
                        </div>
                        <div className="btn-row">
                          <button id="create-unit-submit-btn" type="submit" className="btn btn-primary">
                            Agregar unidad
                          </button>
                          <button
                            id="create-unit-cancel-btn"
                            type="button"
                            className="btn"
                            onClick={() => setShowAddUnitForm(false)}
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    </section>
                  )}

                  {/* Editable Learning Units Navigator + Active Unit Canvas */}
                  {activeLessonUnits.length > 0 && selectedUnit && (
                    <article className="panel" aria-label="Unidad de aprendizaje editable activa">
                      <div className="btn-row" style={{ marginBottom: '1rem' }}>
                        {activeLessonUnits.map((u, idx) => (
                          <button
                            key={u.id}
                            id={`select-unit-pill-${idx}`}
                            type="button"
                            className={`btn btn-sm ${
                              u.id === selectedUnit.id ? 'btn-primary' : ''
                            }`}
                            onClick={() => {
                              setSelectedUnitId(u.id);
                              setIsEditingUnit(false);
                            }}
                          >
                            {idx + 1}. {u.title}
                            {u.completedAt ? ' ✓' : ''}
                          </button>
                        ))}
                      </div>

                      <hr className="section-divider" />

                      {!isEditingUnit ? (
                        <div>
                          <div className="panel-header">
                            <div>
                              <div className="btn-row" style={{ marginBottom: '0.35rem' }}>
                                <span className="badge badge-teal">{selectedUnit.topic}</span>
                                <span className="badge">
                                  {UNIT_TYPE_LABELS[selectedUnit.unitType] ?? selectedUnit.unitType}
                                </span>
                                <span className="field-hint">
                                  ~{selectedUnit.estimatedMinutes} min
                                </span>
                              </div>
                              <h3>{selectedUnit.title}</h3>
                            </div>
                            <div className="btn-row">
                              <button
                                id="edit-unit-toggle-btn"
                                type="button"
                                className="btn btn-sm"
                                onClick={beginEditingUnit}
                              >
                                Editar unidad
                              </button>
                              <button
                                id="unit-jump-note-btn"
                                type="button"
                                className="btn btn-sm"
                                onClick={() => {
                                  setNoteTopic(selectedUnit.topic);
                                  setNoteTitle(`Apuntes sobre ${selectedUnit.title}`);
                                  setActiveTab('progress');
                                }}
                              >
                                + Nota rápida
                              </button>
                            </div>
                          </div>

                          <div className="unit-prose">{selectedUnit.body}</div>

                          <InteractiveExplorer
                            key={selectedUnit.id}
                            unitId={selectedUnit.id}
                            config={selectedUnit.interactiveConfig}
                            isCompleted={Boolean(selectedUnit.completedAt)}
                            onCompleteCheckpoint={handleCompleteUnitCheckpoint}
                          />
                        </div>
                      ) : (
                        <form onSubmit={handleSaveUnitEdits}>
                          <div className="panel-header">
                            <h3>Editando unidad de aprendizaje</h3>
                            <div className="btn-row">
                              <button
                                id="split-unit-btn"
                                type="button"
                                className="btn btn-sm"
                                onClick={handleSplitUnit}
                              >
                                Dividir en salto de párrafo
                              </button>
                              {activeLessonUnits.length > 1 && (
                                <button
                                  id="delete-unit-btn"
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleDeleteUnit(selectedUnit.id)}
                                >
                                  Eliminar unidad
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="two-col-grid" style={{ gap: '0.75rem' }}>
                            <div className="field-group">
                              <label htmlFor="edit-unit-title" className="field-label">
                                Título de la unidad
                              </label>
                              <input
                                id="edit-unit-title"
                                className="input"
                                value={editUnitTitle}
                                onChange={(e) => setEditUnitTitle(e.target.value)}
                              />
                            </div>
                            <div className="field-group">
                              <label htmlFor="edit-unit-topic" className="field-label">
                                Etiqueta de tema
                              </label>
                              <input
                                id="edit-unit-topic"
                                className="input"
                                value={editUnitTopic}
                                onChange={(e) => setEditUnitTopic(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="two-col-grid" style={{ gap: '0.75rem' }}>
                            <div className="field-group">
                              <label htmlFor="edit-unit-type" className="field-label">
                                Tipo de unidad
                              </label>
                              <select
                                id="edit-unit-type"
                                className="select"
                                value={editUnitType}
                                onChange={(e) =>
                                  setEditUnitType(
                                    e.target.value as
                                      | 'concept'
                                      | 'interactive-lab'
                                      | 'worked-example'
                                      | 'language-drill'
                                  )
                                }
                              >
                                <option value="concept">Concepto</option>
                                <option value="interactive-lab">Laboratorio interactivo</option>
                                <option value="worked-example">Ejemplo resuelto</option>
                                <option value="language-drill">Práctica de idioma</option>
                              </select>
                            </div>
                            <div className="field-group">
                              <label htmlFor="edit-unit-formula" className="field-label">
                                Fórmula clave (Opcional)
                              </label>
                              <input
                                id="edit-unit-formula"
                                className="input mono"
                                value={editUnitFormula}
                                onChange={(e) => setEditUnitFormula(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="field-group">
                            <label htmlFor="edit-unit-body" className="field-label">
                              Contenido de la unidad (Separa los párrafos con una línea en blanco para poder dividirla)
                            </label>
                            <textarea
                              id="edit-unit-body"
                              className="textarea textarea-mono"
                              value={editUnitBody}
                              onChange={(e) => setEditUnitBody(e.target.value)}
                            />
                          </div>

                          <div className="btn-row">
                            <button
                              id="save-unit-edits-btn"
                              type="submit"
                              className="btn btn-primary"
                            >
                              Guardar cambios de la unidad
                            </button>
                            <button
                              id="cancel-unit-edits-btn"
                              type="button"
                              className="btn"
                              onClick={() => setIsEditingUnit(false)}
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      )}
                    </article>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================================
            TAB: OFFICIAL PBA ELECTROMECHANICS CURRICULUM EXPLORER (1° A 7° AÑO)
            ================================================================= */}
        {activeTab === 'curriculum' && (
          <div>
            <div className="page-intro">
              <div>
                <h1>Diseño Curricular de Electromecánica (Provincia de Buenos Aires)</h1>
                <p>
                  Base de datos oficial de contenidos, materias y talleres para la Educación
                  Secundaria Técnica de la Provincia de Buenos Aires (DGCyE PBA - Res. 3828/09,
                  Res. 5655/24 y normativas vigentes). Abarca los 7 años de formación continua:
                  Ciclo Básico (1° a 3°) y Ciclo Superior Técnico (4° a 7°).
                </p>
              </div>
              <div className="btn-row">
                <button
                  id="curriculum-sync-all-btn"
                  type="button"
                  className="btn btn-sage"
                  onClick={() => handleSyncCurriculumPBA()}
                >
                  ⚙ Cargar lecciones del currículum en SQLite
                </button>
                <button
                  id="curriculum-sync-and-stage-btn"
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleSyncCurriculumPBA({ stageCandidates: true })}
                >
                  ⚡ Cargar y generar tarjetas de repaso
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <section
              className="panel"
              style={{ marginBottom: '1.5rem' }}
              aria-label="Filtros del currículum PBA"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.85rem' }}>
                  <div className="field-group">
                    <label htmlFor="curriculum-search-input" className="field-label">
                      Buscar en el programa (materias, temas, fórmulas, normas IRAM o aplicaciones)
                    </label>
                    <input
                      id="curriculum-search-input"
                      type="search"
                      className="input"
                      placeholder="Ej.: Ley de Ohm, Tornería, Ladder, Navier, RLC, Soldadura, 5 Reglas de Oro..."
                      value={curriculumSearchQuery}
                      onChange={(e) => setCurriculumSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="field-group">
                    <label htmlFor="curriculum-campo-select" className="field-label">
                      Campo de formación
                    </label>
                    <select
                      id="curriculum-campo-select"
                      className="select"
                      value={curriculumCampoFilter}
                      onChange={(e) => setCurriculumCampoFilter(e.target.value)}
                    >
                      <option value="all">Todos los campos</option>
                      <option value="Formación Técnico-Específica">
                        Formación Técnico-Específica (Talleres y Especialidad)
                      </option>
                      <option value="Formación Científico-Tecnológica">
                        Formación Científico-Tecnológica (Física, Química, Matemática)
                      </option>
                      <option value="Prácticas Profesionalizantes">
                        Prácticas Profesionalizantes (7° Año)
                      </option>
                    </select>
                  </div>
                </div>

                {/* Year Filter Buttons */}
                <div>
                  <span className="field-label" style={{ display: 'block', marginBottom: '0.35rem' }}>
                    Filtrar por año de la carrera técnica:
                  </span>
                  <div className="btn-row" style={{ flexWrap: 'wrap', gap: '0.4rem' }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${curriculumYearFilter === 'all' ? 'btn-primary' : ''}`}
                      onClick={() => setCurriculumYearFilter('all')}
                    >
                      Todos (1° a 7°)
                    </button>
                    {[1, 2, 3, 4, 5, 6, 7].map((yr) => (
                      <button
                        key={yr}
                        id={`filter-year-${yr}-btn`}
                        type="button"
                        className={`btn btn-sm ${curriculumYearFilter === yr ? 'btn-primary' : ''}`}
                        onClick={() => setCurriculumYearFilter(yr)}
                      >
                        {yr}° Año {yr <= 3 ? '(Básico)' : '(Superior)'}
                      </button>
                    ))}
                    {(curriculumSearchQuery || curriculumYearFilter !== 'all' || curriculumCampoFilter !== 'all') && (
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => {
                          setCurriculumSearchQuery('');
                          setCurriculumYearFilter('all');
                          setCurriculumCampoFilter('all');
                        }}
                      >
                        ✕ Limpiar filtros
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Curriculum Tree Results */}
            {filteredCurriculum.length === 0 ? (
              <section className="empty-state">
                <h3>No se encontraron temas con los filtros aplicados</h3>
                <p>
                  Intenta con un término de búsqueda más general o restablece los filtros de año
                  y campo de formación para explorar los 7 años de la especialidad.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setCurriculumSearchQuery('');
                    setCurriculumYearFilter('all');
                    setCurriculumCampoFilter('all');
                  }}
                >
                  Restablecer filtros
                </button>
              </section>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {filteredCurriculum.map((yearData) => (
                  <section
                    key={yearData.year}
                    className="panel"
                    aria-label={`Currículum PBA ${yearData.yearLabel}`}
                  >
                    <div
                      className="panel-header"
                      style={{
                        borderBottom: '2px solid var(--border-hairline)',
                        paddingBottom: '0.75rem',
                        marginBottom: '1rem',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <h2>{yearData.yearLabel}</h2>
                          <span
                            className={`badge ${yearData.year <= 3 ? 'badge-teal' : 'badge-amber'}`}
                          >
                            {yearData.cycle}
                          </span>
                        </div>
                        <p className="field-hint" style={{ marginTop: '0.35rem' }}>
                          <strong>Enfoque formativo:</strong> {yearData.focus}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {yearData.subjects.map((subject) => (
                        <article
                          key={subject.id}
                          className="card"
                          style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-hairline)',
                            borderRadius: 'var(--radius-md)',
                            padding: '1.1rem',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'baseline',
                              flexWrap: 'wrap',
                              gap: '0.5rem',
                              marginBottom: '0.5rem',
                            }}
                          >
                            <h3 style={{ fontSize: '1.18rem', margin: 0 }}>
                              {subject.name}
                            </h3>
                            <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                              <span className="badge badge-sage">{subject.campo}</span>
                              {subject.hoursPerWeek && (
                                <span className="badge">{subject.hoursPerWeek} hs/sem</span>
                              )}
                            </div>
                          </div>

                          <p style={{ color: 'var(--ink-secondary)', fontSize: '0.92rem', marginBottom: '0.85rem' }}>
                            {subject.description}
                          </p>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {subject.topics.map((topic) => (
                              <div
                                key={topic.id}
                                style={{
                                  background: 'var(--bg-subtle)',
                                  border: '1px solid var(--border-hairline)',
                                  borderRadius: 'var(--radius-sm)',
                                  padding: '0.85rem 1rem',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    gap: '0.75rem',
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  <div style={{ flex: '1 1 320px' }}>
                                    <h4 style={{ fontSize: '1.02rem', marginBottom: '0.25rem' }}>
                                      {topic.name}
                                    </h4>
                                    <p style={{ fontSize: '0.88rem', margin: '0 0 0.5rem 0' }}>
                                      {topic.summary}
                                    </p>

                                    {topic.keyFormula && (
                                      <div
                                        style={{
                                          fontFamily: 'var(--font-mono)',
                                          fontSize: '0.84rem',
                                          background: 'var(--bg-surface)',
                                          padding: '0.35rem 0.65rem',
                                          borderRadius: '4px',
                                          border: '1px solid var(--border-hairline)',
                                          display: 'inline-block',
                                          marginBottom: '0.5rem',
                                          color: 'var(--accent-primary)',
                                        }}
                                      >
                                        📐 {topic.keyFormula}
                                      </div>
                                    )}

                                    <div
                                      style={{
                                        fontSize: '0.82rem',
                                        color: 'var(--ink-secondary)',
                                        marginBottom: '0.45rem',
                                      }}
                                    >
                                      <strong>Aplicación en taller/industria:</strong>{' '}
                                      {topic.practicalApplication}
                                    </div>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                      {topic.keyConcepts.map((concept, cIdx) => (
                                        <span
                                          key={cIdx}
                                          className="badge"
                                          style={{ fontSize: '0.72rem' }}
                                        >
                                          {concept}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  <div style={{ alignSelf: 'flex-start' }}>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-primary"
                                      onClick={() =>
                                        handleLoadCurriculumTopic(topic, subject, yearData)
                                      }
                                      title="Cargar este tema en el editor para generar unidades y práctica"
                                    >
                                      📖 Cargar en editor
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =================================================================
            TAB 2: TRANSPARENT SPACED REPETITION & APPROVED SHORT QUIZZES
            ================================================================= */}
        {activeTab === 'practice' && (
          <div>
            <div className="page-intro">
              <div>
                <h1>Repaso espaciado y cuestionarios cortos</h1>
                <p>
                  Repaso espaciado transparente con intervalos visibles (Otra vez, Difícil, Bien y
                  Fácil), acompañado de cuestionarios cortos construidos únicamente con los
                  elementos que aprobaste.
                </p>
              </div>
              <div className="btn-row">
                <button
                  id="practice-mode-srs-btn"
                  type="button"
                  className={`btn ${practiceSubMode === 'srs' ? 'btn-primary' : ''}`}
                  onClick={() => setPracticeSubMode('srs')}
                >
                  Tarjetas ({dueCount} pendientes)
                </button>
                <button
                  id="practice-mode-quiz-btn"
                  type="button"
                  className={`btn ${practiceSubMode === 'quiz' ? 'btn-primary' : ''}`}
                  onClick={() => setPracticeSubMode('quiz')}
                >
                  Cuestionarios cortos ({filteredQuizzes.length})
                </button>
              </div>
            </div>

            {weakTopicFilter && (
              <div className="banner banner-info">
                <span>
                  <strong>Enfoque en tema por reforzar activo:</strong> Filtrando tarjetas y
                  cuestionarios para el tema <strong>&ldquo;{weakTopicFilter}&rdquo;</strong>.
                </span>
                <button
                  id="clear-weak-topic-filter-btn"
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setWeakTopicFilter(null)}
                >
                  Mostrar todos los temas
                </button>
              </div>
            )}

            {practiceSubMode === 'srs' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                <div className="btn-row">
                  <button
                    id="filter-due-only-btn"
                    type="button"
                    className={`btn btn-sm ${dueOnlyFilter && !weakTopicFilter ? 'btn-primary' : ''}`}
                    onClick={() => {
                      setWeakTopicFilter(null);
                      setDueOnlyFilter(true);
                      setActiveCardIndex(0);
                    }}
                  >
                    Cola pendiente ({dueCount})
                  </button>
                  <button
                    id="filter-all-approved-cards-btn"
                    type="button"
                    className={`btn btn-sm ${!dueOnlyFilter && !weakTopicFilter ? 'btn-primary' : ''}`}
                    onClick={() => {
                      setWeakTopicFilter(null);
                      setDueOnlyFilter(false);
                      setActiveCardIndex(0);
                    }}
                  >
                    Todas las tarjetas aprobadas ({snapshot.flashcards.length})
                  </button>
                  <button
                    id="toggle-srs-math-btn"
                    type="button"
                    className="btn btn-sm"
                    onClick={() => setShowSrsMathInspector((v) => !v)}
                  >
                    {showSrsMathInspector
                      ? 'Ocultar cálculo del calendario'
                      : 'Inspeccionar cálculo del calendario'}
                  </button>
                </div>

                {lastSrsTransition && (
                  <div className="panel-subtle" role="status" style={{ fontSize: '0.86rem' }}>
                    <strong>
                      Última calificación ({SRS_ACTION_LABELS[lastSrsTransition.action].toUpperCase()}):
                    </strong>{' '}
                    Próximo repaso en <span className="mono">{lastSrsTransition.humanInterval}</span>{' '}
                    · {lastSrsTransition.formulaExplanation}
                  </div>
                )}

                {currentFlashcard ? (
                  <section className="flashcard-stage" aria-label="Repaso de tarjeta activa">
                    <div className="panel-header">
                      <div className="btn-row">
                        <span className="badge badge-teal">{currentFlashcard.topic}</span>
                        <span className="badge">
                          {CARD_STATE_LABELS[currentFlashcard.state] ?? currentFlashcard.state}
                        </span>
                        <span
                          className={`badge ${
                            currentFlashcard.isDue ? 'badge-amber' : 'badge-sage'
                          }`}
                        >
                          {currentFlashcard.isDue ? 'Pendiente ahora' : 'Programada'}
                        </span>
                      </div>
                      <span className="mono field-hint">
                        Facilidad {currentFlashcard.easeFactor.toFixed(2)} · Repeticiones{' '}
                        {currentFlashcard.repetitions} · Tropiezos {currentFlashcard.lapses}
                      </span>
                    </div>

                    <div style={{ padding: '1rem 0 1.25rem' }}>
                      <div className="field-hint" style={{ marginBottom: '0.35rem' }}>
                        Pregunta
                      </div>
                      <h2 style={{ fontSize: '1.35rem' }}>{currentFlashcard.front}</h2>
                    </div>

                    {!cardFlipped ? (
                      <button
                        id="reveal-flashcard-btn"
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setCardFlipped(true)}
                      >
                        Revelar respuesta y opciones de calendario
                      </button>
                    ) : (
                      <div>
                        <hr className="section-divider" />
                        <div className="field-hint" style={{ marginBottom: '0.35rem' }}>
                          Respuesta
                        </div>
                        <p style={{ fontSize: '1.08rem', fontWeight: 600 }}>
                          {currentFlashcard.back}
                        </p>
                        <p className="field-hint" style={{ marginTop: '0.45rem' }}>
                          {currentFlashcard.explanation}
                        </p>

                        <div
                          className="srs-rating-grid"
                          role="group"
                          aria-label="Acciones de calificación de repaso espaciado"
                        >
                          {(['again', 'hard', 'good', 'easy'] as SrsAction[]).map((action) => {
                            const preview = currentFlashcard.actionPreviews[action];
                            return (
                              <button
                                key={action}
                                id={`srs-rate-${action}-btn`}
                                type="button"
                                className={`srs-btn ${action}`}
                                disabled={Boolean(busyAction)}
                                onClick={() => handleRateFlashcard(currentFlashcard.id, action)}
                              >
                                <span className="srs-btn-label">{SRS_ACTION_LABELS[action]}</span>
                                <span className="srs-btn-interval">
                                  en {preview.humanInterval}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </section>
                ) : (
                  <section className="empty-state">
                    <h3>
                      {snapshot.flashcards.length === 0
                        ? 'Aún no hay tarjetas de estudio aprobadas'
                        : 'Al día con tus repasos pendientes'}
                    </h3>
                    <p>
                      {snapshot.flashcards.length === 0
                        ? 'Genera borradores desde una de tus lecciones y aprueba las tarjetas que quieras conservar.'
                        : 'No hay tarjetas pendientes en este momento. Puedes inspeccionar los próximos intervalos abajo, ver todas las tarjetas aprobadas para practicar por adelantado o descansar.'}
                    </p>
                    <div className="btn-row">
                      {snapshot.flashcards.length === 0 ? (
                        <button
                          id="empty-srs-goto-lessons-btn"
                          type="button"
                          className="btn btn-primary"
                          onClick={() => setActiveTab('lessons')}
                        >
                          Ir a Plan y lecciones
                        </button>
                      ) : (
                        <button
                          id="empty-srs-review-all-btn"
                          type="button"
                          className="btn"
                          onClick={() => setDueOnlyFilter(false)}
                        >
                          Ver las {snapshot.flashcards.length} tarjetas aprobadas
                        </button>
                      )}
                    </div>
                  </section>
                )}

                {showSrsMathInspector && (
                  <section
                    className="panel"
                    aria-label="Inspector transparente del calendario de repaso espaciado"
                  >
                    <h3>Reglas transparentes del calendario y estado del mazo</h3>
                    <p className="field-hint" style={{ marginTop: '0.35rem', marginBottom: '0.9rem' }}>
                      <strong>Otra vez:</strong> reinicia repeticiones a 0, suma 1 tropiezo, reduce
                      facilidad en 0.20 (mín. 1.30) y reprograma en 10m · <strong>Difícil:</strong>{' '}
                      primer paso de 12h o intervalo × 1.20, facilidad −0.15 · <strong>Bien:</strong>{' '}
                      1d → 3d → intervalo × facilidad · <strong>Fácil:</strong> primer paso de 4d o
                      intervalo × facilidad × 1.30, facilidad +0.15 (máx. 3.20).
                    </p>
                    {snapshot.flashcards.length > 0 && (
                      <ul className="item-list">
                        {snapshot.flashcards.map((c) => (
                          <li key={c.id} className="plan-step-item">
                            <div>
                              <strong>{c.front}</strong>
                              <div className="meta-line">
                                <span className="badge">{c.topic}</span>
                                <span>Estado: {CARD_STATE_LABELS[c.state] ?? c.state}</span>
                                <span>Intervalo: {formatIntervalDays(c.intervalDays)}</span>
                                <span>Facilidad: {c.easeFactor.toFixed(2)}</span>
                                <span>Tropiezos: {c.lapses}</span>
                              </div>
                            </div>
                            <span className={`badge ${c.isDue ? 'badge-amber' : 'badge-sage'}`}>
                              {c.isDue
                                ? 'Pendiente ahora'
                                : `Para el ${new Date(c.dueAt).toLocaleDateString('es-419')}`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                )}
              </div>
            ) : (
              /* Approved Short Quizzes View */
              <div>
                {!currentQuiz ? (
                  <section className="empty-state">
                    <h3>Aún no hay preguntas de cuestionario aprobadas</h3>
                    <p>
                      Genera borradores en una lección y aprueba preguntas de cuestionario para
                      practicar comprobaciones de opción múltiple aquí.
                    </p>
                    <button
                      id="empty-quiz-goto-lessons-btn"
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setActiveTab('lessons')}
                    >
                      Ir a Lecciones
                    </button>
                  </section>
                ) : (
                  <section className="panel" aria-label="Comprobación de cuestionario corto">
                    <div className="panel-header">
                      <div className="btn-row">
                        <span className="badge badge-amber">
                          Pregunta {activeQuizIndex + 1} de {filteredQuizzes.length}
                        </span>
                        <span className="badge">{currentQuiz.topic}</span>
                      </div>
                      <span className="mono field-hint">
                        Precisión: {currentQuiz.timesCorrect}/{currentQuiz.timesAnswered}
                      </span>
                    </div>

                    <h3 style={{ marginBottom: '1rem' }}>{currentQuiz.prompt}</h3>

                    <form onSubmit={handleSubmitQuizAnswer}>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.55rem',
                          marginBottom: '1rem',
                        }}
                      >
                        {currentQuiz.options.map((opt, idx) => {
                          const optId = `quiz-option-${currentQuiz.id}-${idx}`;
                          return (
                            <label
                              key={optId}
                              htmlFor={optId}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.55rem',
                                padding: '0.65rem 0.85rem',
                                borderRadius: '6px',
                                border: '1px solid var(--border-strong)',
                                background:
                                  selectedQuizChoice === opt
                                    ? 'var(--accent-primary-soft)'
                                    : 'var(--bg-surface)',
                                cursor: 'pointer',
                              }}
                            >
                              <input
                                id={optId}
                                type="radio"
                                name={`quiz-${currentQuiz.id}`}
                                value={opt}
                                checked={selectedQuizChoice === opt}
                                onChange={(e) => {
                                  setSelectedQuizChoice(e.target.value);
                                  setQuizOutcome(null);
                                }}
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>

                      <div className="btn-row">
                        <button
                          id="submit-quiz-answer-btn"
                          type="submit"
                          className="btn btn-primary"
                          disabled={Boolean(busyAction)}
                        >
                          Comprobar respuesta
                        </button>
                        {filteredQuizzes.length > 1 && (
                          <button
                            id="next-quiz-question-btn"
                            type="button"
                            className="btn"
                            onClick={() => {
                              setActiveQuizIndex((i) => (i + 1) % filteredQuizzes.length);
                              setSelectedQuizChoice('');
                              setQuizOutcome(null);
                            }}
                          >
                            Siguiente pregunta →
                          </button>
                        )}
                      </div>
                    </form>

                    {quizOutcome && (
                      <div
                        role="status"
                        className={`banner ${
                          quizOutcome.isCorrect ? 'banner-success' : 'banner-error'
                        }`}
                        style={{ marginTop: '1rem', marginBottom: 0 }}
                      >
                        <div>
                          <strong>
                            {quizOutcome.isCorrect
                              ? '¡Correcto!'
                              : `No exactamente: la respuesta esperada era "${quizOutcome.correctAnswer}".`}
                          </strong>{' '}
                          {quizOutcome.explanation}
                        </div>
                      </div>
                    )}
                  </section>
                )}
              </div>
            )}
          </div>
        )}

        {/* =================================================================
            TAB 3: LANGUAGE TIMING & PRONUNCIATION LAB (NON-MEDICAL)
            ================================================================= */}
        {activeTab === 'language' && (
          <div>
            <div className="page-intro">
              <div>
                <h1>Laboratorio de ritmo y pronunciación de idiomas</h1>
                <p>
                  Practica fraseo hablado, cadencia silábica, proporción de pausas y coincidencia de
                  palabras localmente, exclusivamente para estudio personal de idiomas y sin
                  afirmaciones médicas.
                </p>
              </div>
            </div>

            <LanguagePracticeStudio
              languageUnits={languageUnits}
              attempts={snapshot.languageAttempts}
              onSaveAttempt={async (payload) => {
                const res = await fetch('/api/language', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'No se pudo guardar el registro de idioma.');
                setSnapshot(data.snapshot);
                notifySuccess('Comparación de ritmo y cadencia guardada localmente.');
              }}
              onDeleteAttempt={async (id) => {
                const res = await fetch('/api/language', {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id }),
                });
                const data = await res.json();
                if (res.ok && data.snapshot) setSnapshot(data.snapshot);
              }}
            />
          </div>
        )}

        {/* =================================================================
            TAB 4: STREAK-FREE PROGRESS, GOALS, SESSIONS & STUDY NOTES
            ================================================================= */}
        {activeTab === 'progress' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="page-intro" style={{ marginBottom: 0 }}>
              <div>
                <h1>Avance sin rachas, metas y apuntes personales</h1>
                <p>
                  Da seguimiento a tus metas personales, sesiones de estudio, estabilidad de memoria,
                  temas por reforzar y apuntes, sin presión de rachas diarias ni calificaciones
                  acreditadas.
                </p>
              </div>
            </div>

            <StreakFreeCharts
              progress={snapshot.progress}
              onStartWeakTopicReview={startWeakTopicPractice}
            />

            <div className="two-col-grid">
              {/* Personal Goals */}
              <section className="panel" aria-label="Metas personales de estudio">
                <div className="panel-header">
                  <h3>Metas personales de estudio</h3>
                  <span className="badge">{snapshot.progress.goalProgress.length}</span>
                </div>

                <form onSubmit={handleCreateGoal} style={{ marginBottom: '1rem' }}>
                  <div className="field-group">
                    <label htmlFor="goal-title-input" className="field-label">
                      Descripción de la meta
                    </label>
                    <input
                      id="goal-title-input"
                      className="input"
                      required
                      placeholder="Ej.: Dedicar 90 minutos tranquilos a física y cálculo"
                      value={goalTitle}
                      onChange={(e) => setGoalTitle(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.65rem' }}>
                    <div className="field-group">
                      <label htmlFor="goal-metric-select" className="field-label">
                        Métrica
                      </label>
                      <select
                        id="goal-metric-select"
                        className="select"
                        value={goalMetric}
                        onChange={(e) =>
                          setGoalMetric(
                            e.target.value as
                              | 'weekly_minutes'
                              | 'weekly_reviews'
                              | 'units_completed'
                          )
                        }
                      >
                        <option value="weekly_minutes">Minutos semanales de estudio</option>
                        <option value="weekly_reviews">Repasos semanales de memoria</option>
                        <option value="units_completed">Unidades interactivas verificadas</option>
                      </select>
                    </div>
                    <div className="field-group">
                      <label htmlFor="goal-target-input" className="field-label">
                        Meta numérica
                      </label>
                      <input
                        id="goal-target-input"
                        className="input mono"
                        type="number"
                        min="1"
                        max="5000"
                        value={goalTarget}
                        onChange={(e) => setGoalTarget(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <button id="create-goal-btn" type="submit" className="btn btn-primary btn-sm">
                    Agregar meta personal
                  </button>
                </form>

                {snapshot.progress.goalProgress.length === 0 ? (
                  <p className="field-hint">Aún no has definido metas personales.</p>
                ) : (
                  <ul className="item-list">
                    {snapshot.progress.goalProgress.map((g) => (
                      <li key={g.id} className="panel-subtle" style={{ padding: '0.75rem 0.9rem' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.4rem',
                          }}
                        >
                          <strong style={{ fontSize: '0.9rem' }}>{g.title}</strong>
                          <div className="btn-row">
                            <span className="mono field-hint">
                              {g.currentValue} / {g.targetValue}
                            </span>
                            <button
                              id={`delete-goal-btn-${g.id}`}
                              type="button"
                              className="btn btn-sm"
                              onClick={() => handleDeleteGoal(g.id)}
                            >
                              ×
                            </button>
                          </div>
                        </div>
                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{ width: `${g.progressPercent}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Study Sessions */}
              <section className="panel" aria-label="Registro de sesiones de estudio">
                <div className="panel-header">
                  <h3>Sesiones de estudio</h3>
                  <span className="badge">{snapshot.sessions.length} registradas</span>
                </div>

                <form onSubmit={handleLogManualSession} style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.8fr', gap: '0.65rem' }}>
                    <div className="field-group">
                      <label htmlFor="session-topic-input" className="field-label">
                        Tema enfocado
                      </label>
                      <input
                        id="session-topic-input"
                        className="input"
                        required
                        value={manualSessionTopic}
                        onChange={(e) => setManualSessionTopic(e.target.value)}
                      />
                    </div>
                    <div className="field-group">
                      <label htmlFor="session-minutes-input" className="field-label">
                        Minutos
                      </label>
                      <input
                        id="session-minutes-input"
                        className="input mono"
                        type="number"
                        min="1"
                        max="600"
                        value={manualSessionMinutes}
                        onChange={(e) => setManualSessionMinutes(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="field-group">
                    <label htmlFor="session-reflection-input" className="field-label">
                      Reflexión breve (Opcional)
                    </label>
                    <input
                      id="session-reflection-input"
                      className="input"
                      placeholder="¿Qué quedó claro o qué conviene repasar?"
                      value={manualSessionReflection}
                      onChange={(e) => setManualSessionReflection(e.target.value)}
                    />
                  </div>
                  <button id="log-session-btn" type="submit" className="btn btn-primary btn-sm">
                    Registrar sesión de estudio
                  </button>
                </form>

                {snapshot.sessions.length === 0 ? (
                  <p className="field-hint">
                    Aún no hay sesiones registradas. Usa el temporizador de enfoque superior o
                    registra una sesión arriba.
                  </p>
                ) : (
                  <ul className="item-list">
                    {snapshot.sessions.slice(0, 6).map((s) => (
                      <li key={s.id} className="plan-step-item">
                        <div>
                          <strong>{s.topic}</strong>
                          <div className="meta-line">
                            <span>{s.durationMinutes} min</span>
                            <span>·</span>
                            <span>{new Date(s.startedAt).toLocaleDateString('es-419')}</span>
                          </div>
                          {s.reflection && <p className="field-hint">{s.reflection}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            {/* Personal Study Notes */}
            <section className="panel" aria-label="Apuntes personales de estudio">
              <div className="panel-header">
                <div>
                  <h3>Apuntes personales de estudio</h3>
                  <p className="field-hint">
                    Escribe demostraciones, intuiciones y casos límite; se guardan localmente y se
                    incluyen al exportar.
                  </p>
                </div>
                <input
                  id="notes-search-input"
                  className="input"
                  style={{ maxWidth: '240px' }}
                  placeholder="Filtrar apuntes…"
                  value={noteSearch}
                  onChange={(e) => setNoteSearch(e.target.value)}
                />
              </div>

              <div className="two-col-grid">
                <form onSubmit={handleCreateNote}>
                  <div className="field-group">
                    <label htmlFor="note-title-input" className="field-label">
                      Título del apunte
                    </label>
                    <input
                      id="note-title-input"
                      className="input"
                      required
                      placeholder="Ej.: Por qué la masa se cancela en el período del péndulo"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                    />
                  </div>
                  <div className="field-group">
                    <label htmlFor="note-topic-input" className="field-label">
                      Etiqueta de tema
                    </label>
                    <input
                      id="note-topic-input"
                      className="input"
                      placeholder="Ej.: Ley de escala del péndulo"
                      value={noteTopic}
                      onChange={(e) => setNoteTopic(e.target.value)}
                    />
                  </div>
                  <div className="field-group">
                    <label htmlFor="note-body-input" className="field-label">
                      Contenido del apunte
                    </label>
                    <textarea
                      id="note-body-input"
                      className="textarea"
                      required
                      placeholder="Escribe tu deducción o síntesis…"
                      value={noteBody}
                      onChange={(e) => setNoteBody(e.target.value)}
                    />
                  </div>
                  <button id="save-note-btn" type="submit" className="btn btn-primary btn-sm">
                    Guardar apunte
                  </button>
                </form>

                <div>
                  {filteredNotes.length === 0 ? (
                    <p className="field-hint">No hay apuntes que coincidan todavía.</p>
                  ) : (
                    <ul className="item-list">
                      {filteredNotes.map((n) => (
                        <li key={n.id} className="panel-subtle">
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              gap: '0.5rem',
                            }}
                          >
                            <div>
                              <strong>{n.title}</strong>{' '}
                              <span className="badge" style={{ marginLeft: '0.3rem' }}>
                                {n.topic}
                              </span>
                            </div>
                            <button
                              id={`delete-note-btn-${n.id}`}
                              type="button"
                              className="btn btn-sm"
                              onClick={() => handleDeleteNote(n.id)}
                            >
                              Eliminar
                            </button>
                          </div>
                          <p
                            style={{
                              marginTop: '0.45rem',
                              fontSize: '0.88rem',
                              whiteSpace: 'pre-wrap',
                            }}
                          >
                            {n.body}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* =================================================================
            TAB 5: LOCAL DATA, OFFLINE STATUS, EXPORT, BACKUP & FULL DELETION
            ================================================================= */}
        {activeTab === 'data' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
            <div className="page-intro" style={{ marginBottom: 0 }}>
              <div>
                <h1>Almacenamiento local, modo sin conexión, exportación y control de datos</h1>
                <p>
                  Todas tus lecciones, registros de repaso, apuntes y calendarios viven localmente en
                  tu computadora por defecto. Exporta, respalda, reinicia tu avance o elimina todo
                  de forma permanente abajo.
                </p>
              </div>
            </div>

            <div className="two-col-grid">
              {/* Export & Import */}
              <section className="panel" aria-label="Exportar y restaurar datos de estudio">
                <h3>Exportación completa y restauración portátil</h3>
                <p className="field-hint" style={{ marginTop: '0.3rem', marginBottom: '1rem' }}>
                  Descarga un paquete JSON completo con todas las tablas o una copia atómica de tu
                  base SQLite <code>.db</code> en cualquier momento.
                </p>

                <div className="btn-row" style={{ marginBottom: '1.15rem' }}>
                  <a
                    id="export-json-btn"
                    href="/api/data/export?format=json"
                    download
                    className="btn btn-primary"
                  >
                    Exportar paquete JSON completo
                  </a>
                  <a
                    id="export-sqlite-btn"
                    href="/api/data/export?format=sqlite"
                    download
                    className="btn"
                  >
                    Descargar SQLite (.db)
                  </a>
                </div>

                <hr className="section-divider" />

                <div className="field-group" style={{ marginBottom: 0 }}>
                  <span className="field-label">Restaurar desde paquete JSON exportado</span>
                  <span className="field-hint">
                    Valida el esquema antes de reemplazar las tablas actuales de tu espacio local.
                  </span>
                  <div style={{ marginTop: '0.45rem' }}>
                    <label
                      htmlFor="import-backup-json-input"
                      className="btn btn-sm"
                      style={{ cursor: 'pointer' }}
                    >
                      Elegir archivo .json exportado
                      <input
                        id="import-backup-json-input"
                        type="file"
                        accept=".json,application/json"
                        style={{ display: 'none' }}
                        onChange={handleImportBackupBundleFile}
                      />
                    </label>
                  </div>
                </div>
              </section>

              {/* On-Disk Local Backups */}
              <section className="panel" aria-label="Respaldos en carpeta local">
                <div className="panel-header">
                  <div>
                    <h3>Respaldos en disco</h3>
                    <p className="field-hint">
                      Guardados localmente en <code>{snapshot.storage.backupDirectory}</code> con
                      nombres de archivo saneados
                    </p>
                  </div>
                  <span className="badge">{snapshot.backups.length}</span>
                </div>

                <form onSubmit={handleCreateBackup} style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.55rem' }}>
                    <input
                      id="backup-label-input"
                      className="input"
                      placeholder="Etiqueta opcional (ej.: antes-de-repaso)"
                      value={backupLabel}
                      onChange={(e) => setBackupLabel(e.target.value)}
                    />
                    <button
                      id="create-local-backup-btn"
                      type="submit"
                      className="btn btn-primary"
                      disabled={Boolean(busyAction)}
                    >
                      Crear respaldo
                    </button>
                  </div>
                </form>

                {snapshot.backups.length === 0 ? (
                  <p className="field-hint">Aún no se han creado respaldos locales en disco.</p>
                ) : (
                  <ul className="item-list">
                    {snapshot.backups.slice(0, 6).map((bk) => (
                      <li key={bk.filename} className="plan-step-item">
                        <div>
                          <div className="mono" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                            {bk.filename}
                          </div>
                          <div className="meta-line">
                            <span>{(bk.sizeBytes / 1024).toFixed(1)} KB</span>
                            <span>·</span>
                            <span>{new Date(bk.createdAt).toLocaleString('es-419')}</span>
                          </div>
                        </div>
                        <button
                          id={`restore-backup-btn-${bk.filename}`}
                          type="button"
                          className="btn btn-sm"
                          onClick={() => handleRestoreLocalBackup(bk.filename)}
                        >
                          Restaurar
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            {/* Reset Progress vs Permanent Deletion */}
            <div className="two-col-grid">
              <section className="panel" aria-label="Reiniciar avance de estudio">
                <h3>Reiniciar calendario y avance de estudio</h3>
                <p className="field-hint" style={{ marginTop: '0.3rem', marginBottom: '0.9rem' }}>
                  Reinicia desde cero los intervalos SRS, registros de repaso, contadores de
                  cuestionarios y sesiones de estudio, conservando intactas tus lecciones, unidades
                  editables y apuntes.
                </p>
                <div className="field-group">
                  <label htmlFor="reset-progress-confirm-input" className="field-label">
                    Escribe <code>REINICIAR</code> para confirmar
                  </label>
                  <input
                    id="reset-progress-confirm-input"
                    className="input mono"
                    placeholder="REINICIAR"
                    value={resetConfirmInput}
                    onChange={(e) => setResetConfirmInput(e.target.value)}
                  />
                </div>
                <button
                  id="reset-progress-btn"
                  type="button"
                  className="btn"
                  disabled={!resetConfirmed || Boolean(busyAction)}
                  onClick={() => handleResetOrDelete('progress-only')}
                >
                  Reiniciar solo el avance
                </button>
              </section>

              <section className="panel" aria-label="Eliminar todos los datos de aprendizaje">
                <h3>Eliminación permanente de todos los datos de aprendizaje</h3>
                <p className="field-hint" style={{ marginTop: '0.3rem', marginBottom: '0.9rem' }}>
                  Elimina permanentemente todas las lecciones, unidades, borradores, tarjetas,
                  cuestionarios, metas, sesiones, apuntes y registros de idiomas en SQLite (con{' '}
                  <code>VACUUM</code>) y limpia las cachés sin conexión del navegador.
                </p>
                <div className="field-group">
                  <label htmlFor="delete-all-confirm-input" className="field-label">
                    Escribe <code>ELIMINAR TODO</code> para confirmar
                  </label>
                  <input
                    id="delete-all-confirm-input"
                    className="input mono"
                    placeholder="ELIMINAR TODO"
                    value={deleteAllConfirmInput}
                    onChange={(e) => setDeleteAllConfirmInput(e.target.value)}
                  />
                </div>
                <label
                  htmlFor="delete-backups-checkbox"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    fontSize: '0.84rem',
                    marginBottom: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    id="delete-backups-checkbox"
                    type="checkbox"
                    checked={deleteBackupsToo}
                    onChange={(e) => setDeleteBackupsToo(e.target.checked)}
                  />
                  <span>
                    Eliminar también los respaldos locales guardados en {snapshot.storage.backupDirectory}
                  </span>
                </label>
                <button
                  id="delete-all-data-btn"
                  type="button"
                  className="btn btn-danger"
                  disabled={!deleteAllConfirmed || Boolean(busyAction)}
                  onClick={() => handleResetOrDelete('delete-all')}
                >
                  Eliminar todos los datos de aprendizaje
                </button>
              </section>
            </div>
          </div>
        )}
      </main>

      <footer className="workbench-footer">
        TutorIA · Cuaderno local de autoestudio · Construido con Next.js 15, TypeScript, SQLite,
        Drizzle ORM y Service Worker sin conexión · Omite deliberadamente cuentas, cobros,
        telemetría, cursos con licencia, certificaciones acreditadas y aulas en vivo.
      </footer>
    </div>
  );
}
