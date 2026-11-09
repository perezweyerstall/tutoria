'use client';

import React from 'react';
import type { StreakFreeProgressSummary } from '@/lib/analytics/progress';

interface StreakFreeChartsProps {
  progress: StreakFreeProgressSummary;
  onStartWeakTopicReview?: (topic: string) => void;
}

export function StreakFreeCharts({
  progress,
  onStartWeakTopicReview,
}: StreakFreeChartsProps) {
  const maxWeeklyMinutes = Math.max(
    30,
    ...progress.weeklyVolume.map((w) => w.minutes),
    ...progress.goalProgress
      .filter((g) => g.metric === 'weekly_minutes')
      .map((g) => g.targetValue)
  );

  const weeklyGoalTarget =
    progress.goalProgress.find((g) => g.metric === 'weekly_minutes' && !g.completed)
      ?.targetValue ?? null;

  const totalCards =
    progress.stability.newCount +
    progress.stability.learningCount +
    progress.stability.familiarCount +
    progress.stability.stableCount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
      <div className="panel-subtle" style={{ fontSize: '0.86rem', color: 'var(--ink-secondary)' }}>
        <strong>Diseño sin rachas y alcance no acreditado:</strong> Las gráficas muestran tu volumen
        acumulado de estudio, la estabilidad de tus intervalos de recuperación y tu precisión por
        tema, nunca rachas diarias. Los días de descanso son parte normal de la consolidación de la
        memoria. Todas las métricas son exclusivamente para autoestudio personal y no representan
        calificaciones ni certificaciones acreditadas.
      </div>

      <div className="two-col-grid">
        {/* Chart 1: Weekly Volume Bar Chart (SVG) */}
        <section className="panel" aria-label="Gráfica de minutos semanales de estudio">
          <div className="panel-header">
            <div>
              <h3>Volumen semanal de estudio</h3>
              <p className="field-hint">
                Minutos acumulados durante 6 semanas ({progress.totalStudyMinutes} min en total)
              </p>
            </div>
            <span className="badge badge-teal">{progress.thisWeekMinutes} min esta semana</span>
          </div>

          <svg
            viewBox="0 0 380 185"
            width="100%"
            height="185"
            role="img"
            aria-label="Gráfica de barras de minutos de estudio semanales durante seis semanas"
          >
            {/* Optional weekly goal reference line */}
            {weeklyGoalTarget !== null && (
              <>
                <line
                  x1="28"
                  y1={148 - (weeklyGoalTarget / maxWeeklyMinutes) * 116}
                  x2="365"
                  y2={148 - (weeklyGoalTarget / maxWeeklyMinutes) * 116}
                  stroke="hsl(33, 80%, 40%)"
                  strokeDasharray="4 3"
                  strokeWidth="1.4"
                />
                <text
                  x="363"
                  y={Math.max(14, 144 - (weeklyGoalTarget / maxWeeklyMinutes) * 116)}
                  textAnchor="end"
                  fontSize="9.5"
                  fill="hsl(33, 80%, 35%)"
                >
                  Meta: {weeklyGoalTarget}m
                </text>
              </>
            )}

            <line
              x1="24"
              y1="148"
              x2="366"
              y2="148"
              stroke="hsl(36, 15%, 76%)"
            />

            {progress.weeklyVolume.map((point, idx) => {
              const slotWidth = 336 / progress.weeklyVolume.length;
              const barWidth = 30;
              const x = 32 + idx * slotWidth + (slotWidth - barWidth) / 2;
              const barHeight = Math.max(
                point.minutes > 0 ? 5 : 1.5,
                (point.minutes / maxWeeklyMinutes) * 116
              );
              const y = 148 - barHeight;

              return (
                <g key={point.weekStartIso}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="4"
                    fill={
                      idx === progress.weeklyVolume.length - 1
                        ? 'hsl(187, 66%, 26%)'
                        : 'hsl(187, 32%, 52%)'
                    }
                  />
                  <text
                    x={x + barWidth / 2}
                    y={y - 5}
                    textAnchor="middle"
                    fontSize="10"
                    fill="hsl(214, 20%, 26%)"
                  >
                    {point.minutes > 0 ? `${point.minutes}m` : '0'}
                  </text>
                  <text
                    x={x + barWidth / 2}
                    y="166"
                    textAnchor="middle"
                    fontSize="10"
                    fill="hsl(214, 14%, 42%)"
                  >
                    {point.weekLabel}
                  </text>
                </g>
              );
            })}
          </svg>
        </section>

        {/* Chart 2: Memory Stability Distribution */}
        <section className="panel" aria-label="Distribución de estabilidad de memoria">
          <div className="panel-header">
            <div>
              <h3>Desglose de estabilidad de recuperación</h3>
              <p className="field-hint">
                Tarjetas de estudio aprobadas agrupadas por profundidad de intervalo de repaso espaciado
              </p>
            </div>
            <span className="badge">{totalCards} tarjetas</span>
          </div>

          {totalCards === 0 ? (
            <p className="field-hint" style={{ padding: '1.2rem 0' }}>
              Aún no hay tarjetas de estudio aprobadas. Genera y aprueba elementos de una lección
              para dar seguimiento a tus intervalos de recuperación aquí.
            </p>
          ) : (
            <div>
              <svg
                viewBox="0 0 360 44"
                width="100%"
                height="44"
                role="img"
                aria-label="Barra horizontal apilada de estabilidad de memoria en tarjetas"
              >
                {(() => {
                  const segments = [
                    {
                      label: 'Nuevas',
                      count: progress.stability.newCount,
                      color: 'hsl(214, 16%, 68%)',
                    },
                    {
                      label: 'En aprendizaje (<1d)',
                      count: progress.stability.learningCount,
                      color: 'hsl(33, 80%, 46%)',
                    },
                    {
                      label: 'Familiares (1–7d)',
                      count: progress.stability.familiarCount,
                      color: 'hsl(187, 56%, 34%)',
                    },
                    {
                      label: 'Estables (>7d)',
                      count: progress.stability.stableCount,
                      color: 'hsl(151, 48%, 31%)',
                    },
                  ];
                  let cursorX = 0;
                  return segments.map((seg) => {
                    if (seg.count <= 0) return null;
                    const segW = (seg.count / totalCards) * 360;
                    const el = (
                      <rect
                        key={seg.label}
                        x={cursorX}
                        y={8}
                        width={Math.max(3, segW - 1.5)}
                        height={24}
                        rx="3"
                        fill={seg.color}
                      />
                    );
                    cursorX += segW;
                    return el;
                  });
                })()}
              </svg>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '0.55rem',
                  marginTop: '0.6rem',
                  fontSize: '0.83rem',
                }}
              >
                <div>
                  <span className="badge">Nuevas</span> {progress.stability.newCount}
                </div>
                <div>
                  <span className="badge badge-amber">En aprendizaje (&lt;1d)</span>{' '}
                  {progress.stability.learningCount}
                </div>
                <div>
                  <span className="badge badge-teal">Familiares (1–7d)</span>{' '}
                  {progress.stability.familiarCount}
                </div>
                <div>
                  <span className="badge badge-sage">Estables (&gt;7d)</span>{' '}
                  {progress.stability.stableCount}
                </div>
              </div>

              <p className="field-hint" style={{ marginTop: '0.85rem' }}>
                Unidades interactivas verificadas: <strong>{progress.completedUnitsCount}</strong> de{' '}
                <strong>{progress.totalUnitsCount}</strong> · Repasos completados esta semana:{' '}
                <strong>{progress.thisWeekReviews}</strong>
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Weak-Topic Review Diagnostic Section */}
      <section className="panel" aria-label="Diagnóstico de temas por reforzar">
        <div className="panel-header">
          <div>
            <h3>Señales de temas por reforzar</h3>
            <p className="field-hint">
              Detectados de forma transparente a partir de tropiezos de recuperación (&ldquo;Otra
              vez&rdquo;), repasos exigentes (&ldquo;Difícil&rdquo;), factores de facilidad bajos y
              errores en cuestionarios cortos.
            </p>
          </div>
        </div>

        {progress.weakTopics.length === 0 ? (
          <p className="field-hint">
            No hay temas por reforzar señalados en este momento. A medida que califiques tarjetas
            con &ldquo;Otra vez&rdquo; o &ldquo;Difícil&rdquo;, o falles preguntas de cuestionario,
            los temas que requieran práctica aparecerán aquí con sus motivos exactos.
          </p>
        ) : (
          <ul className="item-list">
            {progress.weakTopics.map((wt) => (
              <li
                key={wt.topic}
                className="plan-step-item"
                style={{ alignItems: 'center', flexWrap: 'wrap' }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {wt.topic}{' '}
                    <span className="badge badge-terracotta" style={{ marginLeft: '0.35rem' }}>
                      Prioridad {wt.weaknessScore}
                    </span>
                  </div>
                  <div className="meta-line">
                    {wt.reasons.map((r) => (
                      <span key={r}>• {r}</span>
                    ))}
                  </div>
                </div>
                {onStartWeakTopicReview && (
                  <button
                    id={`weak-topic-review-btn-${wt.topic.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`}
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => onStartWeakTopicReview(wt.topic)}
                  >
                    Practicar tema
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
