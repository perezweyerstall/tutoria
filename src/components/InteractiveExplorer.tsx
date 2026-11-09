'use client';

import React, { useMemo, useState } from 'react';
import type { InteractiveConfig } from '@/lib/transform/lessonParser';

interface InteractiveExplorerProps {
  unitId: string;
  config: InteractiveConfig;
  isCompleted: boolean;
  onCompleteCheckpoint: (unitId: string) => void;
}

function evaluateExplorerCurve(
  formulaKind: InteractiveConfig['formulaKind'],
  values: Record<string, number>
): {
  liveReadout: string;
  points: Array<{ x: number; y: number }>;
  xLabel: string;
  yLabel: string;
  markerX: number;
  markerY: number;
} {
  const pts: Array<{ x: number; y: number }> = [];

  switch (formulaKind) {
    case 'pendulum-period': {
      const L = values.L ?? 1.0;
      const g = Math.max(0.5, values.g ?? 9.8);
      const T = 2 * Math.PI * Math.sqrt(L / g);
      for (let i = 0; i <= 32; i++) {
        const len = 0.1 + (i / 32) * 4.2;
        pts.push({ x: len, y: 2 * Math.PI * Math.sqrt(len / g) });
      }
      return {
        liveReadout: `T(${L.toFixed(2)} m, ${g.toFixed(1)} m/s²) = ${T.toFixed(2)} s`,
        points: pts,
        xLabel: 'Longitud L (m)',
        yLabel: 'Período T (s)',
        markerX: L,
        markerY: T,
      };
    }

    case 'spring-energy': {
      const k = values.k ?? 4;
      const xVal = values.x ?? 2;
      const E = 0.5 * k * xVal * xVal;
      for (let i = 0; i <= 32; i++) {
        const d = (i / 32) * 6;
        pts.push({ x: d, y: 0.5 * k * d * d });
      }
      return {
        liveReadout: `E(k=${k}, x=${xVal}) = ${E.toFixed(2)}`,
        points: pts,
        xLabel: 'Desplazamiento x',
        yLabel: 'Energía E',
        markerX: xVal,
        markerY: E,
      };
    }

    case 'derivative-secant': {
      const x0 = values.x0 ?? 3;
      const h = values.h ?? 1;
      const secantSlope = 2 * x0 + h;
      const exactSlope = 2 * x0;
      for (let i = 0; i <= 32; i++) {
        const xv = -3.5 + (i / 32) * 8.5;
        pts.push({ x: xv, y: xv * xv });
      }
      return {
        liveReadout: `Pendiente secante = ${secantSlope.toFixed(2)} (Límite tangente en x₀=${x0}: ${exactSlope.toFixed(2)})`,
        points: pts,
        xLabel: 'x',
        yLabel: 'f(x) = x²',
        markerX: x0 + h,
        markerY: (x0 + h) * (x0 + h),
      };
    }

    case 'ohms-law': {
      const V = values.V ?? 12;
      const R = Math.max(0.5, values.R ?? 4);
      const I = V / R;
      for (let i = 0; i <= 32; i++) {
        const res = 0.8 + (i / 32) * 11.5;
        pts.push({ x: res, y: V / res });
      }
      return {
        liveReadout: `Corriente I = ${V} V / ${R} Ω = ${I.toFixed(2)} A`,
        points: pts,
        xLabel: 'Resistencia R (Ω)',
        yLabel: 'Corriente I (A)',
        markerX: R,
        markerY: I,
      };
    }

    case 'exponential-growth': {
      const N0 = values.N0 ?? 100;
      const r = values.r ?? 0.2;
      const at5 = N0 * Math.exp(r * 5);
      for (let i = 0; i <= 32; i++) {
        const t = (i / 32) * 8;
        pts.push({ x: t, y: N0 * Math.exp(r * t) });
      }
      return {
        liveReadout: `N(5) = ${N0} · e^(${r.toFixed(2)}×5) = ${at5.toFixed(1)}`,
        points: pts,
        xLabel: 'Tiempo t',
        yLabel: 'Cantidad N(t)',
        markerX: 5,
        markerY: at5,
      };
    }

    case 'linear-kinematics': {
      const v0 = values.v0 ?? 2;
      const a = values.a ?? 3;
      const v4 = v0 + a * 4;
      for (let i = 0; i <= 32; i++) {
        const t = (i / 32) * 6;
        pts.push({ x: t, y: v0 + a * t });
      }
      return {
        liveReadout: `v(4 s) = ${v0} + (${a})×4 = ${v4.toFixed(2)} m/s`,
        points: pts,
        xLabel: 'Tiempo t (s)',
        yLabel: 'Velocidad v(t)',
        markerX: 4,
        markerY: v4,
      };
    }

    case 'weighted-ratio': {
      const depth = values.depth ?? 6;
      const load = values.load ?? 2;
      const index = depth / (1 + load);
      for (let i = 0; i <= 32; i++) {
        const lv = (i / 32) * 9;
        pts.push({ x: lv, y: depth / (1 + lv) });
      }
      return {
        liveReadout: `Índice de retención = ${depth} ÷ (1 + ${load}) = ${index.toFixed(2)}`,
        points: pts,
        xLabel: 'Carga de lectura pasiva',
        yLabel: 'Índice de retención',
        markerX: load,
        markerY: index,
      };
    }

    case 'quadratic':
    default: {
      const a = values.a ?? 1;
      const b = values.b ?? 3;
      const y2 = a * 4 + b * 2;
      for (let i = 0; i <= 36; i++) {
        const xv = -4 + (i / 36) * 8;
        pts.push({ x: xv, y: a * xv * xv + b * xv });
      }
      return {
        liveReadout: `y(2) = ${a}·(2²) + ${b}·(2) = ${y2.toFixed(2)}`,
        points: pts,
        xLabel: 'x',
        yLabel: 'y(x)',
        markerX: 2,
        markerY: y2,
      };
    }
  }
}

export function InteractiveExplorer({
  unitId,
  config,
  isCompleted,
  onCompleteCheckpoint,
}: InteractiveExplorerProps) {
  const initialMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of config.sliders) {
      map[s.symbol] = s.initial;
    }
    return map;
  }, [config.sliders]);

  const [sliderValues, setSliderValues] = useState<Record<string, number>>(initialMap);
  const [answerInput, setAnswerInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    message: string;
  } | null>(null);

  const curve = useMemo(
    () => evaluateExplorerCurve(config.formulaKind, sliderValues),
    [config.formulaKind, sliderValues]
  );

  // Build SVG polyline coordinates
  const svgGeometry = useMemo(() => {
    const width = 320;
    const height = 165;
    const padX = 28;
    const padY = 20;

    const xs = curve.points.map((p) => p.x);
    const ys = curve.points.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs, minX + 0.001);
    const minY = Math.min(0, ...ys);
    const maxY = Math.max(...ys, minY + 0.5);

    const projectX = (x: number) =>
      padX + ((x - minX) / (maxX - minX)) * (width - padX * 2);
    const projectY = (y: number) =>
      height - padY - ((y - minY) / (maxY - minY)) * (height - padY * 2);

    const polyline = curve.points
      .map((p) => `${projectX(p.x).toFixed(1)},${projectY(p.y).toFixed(1)}`)
      .join(' ');

    return {
      width,
      height,
      polyline,
      zeroY: projectY(0),
      markerCx: projectX(Math.min(maxX, Math.max(minX, curve.markerX))),
      markerCy: projectY(Math.min(maxY, Math.max(minY, curve.markerY))),
    };
  }, [curve]);

  function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = answerInput.trim();
    if (!trimmed) {
      setFeedback({
        correct: false,
        message: 'Ingresa o selecciona una respuesta para verificar tu razonamiento.',
      });
      return;
    }

    const expectedNum = Number(config.expectedAnswer);
    const submittedNum = Number(trimmed);

    let isMatch = false;
    if (!Number.isNaN(expectedNum) && !Number.isNaN(submittedNum) && config.choices.length === 0) {
      isMatch = Math.abs(submittedNum - expectedNum) <= (config.numericTolerance || 0.15);
    } else {
      isMatch = trimmed.toLowerCase() === config.expectedAnswer.trim().toLowerCase();
    }

    if (isMatch) {
      setFeedback({
        correct: true,
        message: `¡Verificado! ${config.explanation}`,
      });
      if (!isCompleted) {
        onCompleteCheckpoint(unitId);
      }
    } else {
      setFeedback({
        correct: false,
        message: `Todavía no es exacto: ajusta los controles deslizantes arriba para probar la relación o muestra la pista.`,
      });
    }
  }

  return (
    <section
      className="explorer-box"
      aria-label="Explorador interactivo de conceptos y punto de control"
    >
      <div className="panel-header" style={{ marginBottom: '0.6rem' }}>
        <div>
          <span className="badge badge-teal">Laboratorio de práctica interactiva</span>
          {isCompleted && (
            <span className="badge badge-sage" style={{ marginLeft: '0.45rem' }}>
              Punto de control verificado
            </span>
          )}
        </div>
        <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)' }}>
          {curve.liveReadout}
        </span>
      </div>

      {config.expressionLabel && (
        <div className="formula-banner">{config.expressionLabel}</div>
      )}

      <p style={{ fontSize: '0.9rem', color: 'var(--ink-secondary)' }}>{config.prompt}</p>

      {config.sliders.length > 0 && (
        <div className="explorer-grid">
          <div>
            {config.sliders.map((slider) => {
              const val = sliderValues[slider.symbol] ?? slider.initial;
              const sliderDomId = `slider-${unitId}-${slider.symbol}`;
              return (
                <div className="slider-row" key={slider.symbol}>
                  <div className="slider-header">
                    <label htmlFor={sliderDomId}>{slider.label}</label>
                    <span className="mono">
                      {val} {slider.unit}
                    </span>
                  </div>
                  <input
                    id={sliderDomId}
                    className="range-input"
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    value={val}
                    onChange={(e) =>
                      setSliderValues((prev) => ({
                        ...prev,
                        [slider.symbol]: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              );
            })}
          </div>

          <div className="svg-plot-frame">
            <svg
              viewBox={`0 0 ${svgGeometry.width} ${svgGeometry.height}`}
              width="100%"
              height="165"
              role="img"
              aria-label={`Gráfica interactiva de ${curve.yLabel} frente a ${curve.xLabel}`}
            >
              <line
                x1="28"
                y1={svgGeometry.zeroY}
                x2={svgGeometry.width - 24}
                y2={svgGeometry.zeroY}
                stroke="hsl(36, 15%, 76%)"
                strokeDasharray="3 3"
              />
              <line
                x1="28"
                y1="14"
                x2="28"
                y2={svgGeometry.height - 18}
                stroke="hsl(36, 15%, 76%)"
              />
              <polyline
                fill="none"
                stroke="hsl(187, 66%, 26%)"
                strokeWidth="2.6"
                points={svgGeometry.polyline}
              />
              <circle
                cx={svgGeometry.markerCx}
                cy={svgGeometry.markerCy}
                r="5.5"
                fill="hsl(33, 82%, 44%)"
                stroke="#ffffff"
                strokeWidth="1.8"
              />
              <text
                x={svgGeometry.width - 26}
                y={svgGeometry.height - 5}
                textAnchor="end"
                fontSize="10"
                fill="hsl(214, 14%, 42%)"
              >
                {curve.xLabel}
              </text>
              <text
                x="34"
                y="14"
                fontSize="10"
                fill="hsl(214, 14%, 42%)"
              >
                {curve.yLabel}
              </text>
            </svg>
          </div>
        </div>
      )}

      <form onSubmit={handleCheck} className="checkpoint-panel">
        <label
          htmlFor={`checkpoint-input-${unitId}`}
          className="field-label"
          style={{ display: 'block', marginBottom: '0.5rem' }}
        >
          Punto de control activo: {config.checkpointQuestion}
        </label>

        {config.choices.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.75rem' }}>
            {config.choices.map((choice, idx) => {
              const radioId = `checkpoint-choice-${unitId}-${idx}`;
              return (
                <label
                  key={radioId}
                  htmlFor={radioId}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    padding: '0.5rem 0.7rem',
                    borderRadius: '6px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-hairline)',
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                  }}
                >
                  <input
                    id={radioId}
                    type="radio"
                    name={`checkpoint-${unitId}`}
                    value={choice}
                    checked={answerInput === choice}
                    onChange={(e) => setAnswerInput(e.target.value)}
                  />
                  <span>{choice}</span>
                </label>
              );
            })}
          </div>
        ) : (
          <div style={{ maxWidth: '280px', marginBottom: '0.7rem' }}>
            <input
              id={`checkpoint-input-${unitId}`}
              className="input mono"
              type="text"
              placeholder="Ingresa tu predicción numérica…"
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
            />
          </div>
        )}

        <div className="btn-row">
          <button
            id={`checkpoint-verify-btn-${unitId}`}
            type="submit"
            className="btn btn-primary btn-sm"
          >
            Comprobar predicción
          </button>
          {config.hint && (
            <button
              id={`checkpoint-hint-btn-${unitId}`}
              type="button"
              className="btn btn-sm"
              onClick={() => setShowHint((prev) => !prev)}
            >
              {showHint ? 'Ocultar pista' : 'Mostrar pista'}
            </button>
          )}
        </div>

        {showHint && config.hint && (
          <p
            style={{
              marginTop: '0.65rem',
              fontSize: '0.85rem',
              color: 'var(--ink-secondary)',
              background: 'var(--bg-surface)',
              padding: '0.55rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid var(--border-hairline)',
            }}
          >
            <strong>Pista:</strong> {config.hint}
          </p>
        )}

        {feedback && (
          <div
            role="status"
            aria-live="polite"
            className={`banner ${feedback.correct ? 'banner-success' : 'banner-info'}`}
            style={{ marginTop: '0.75rem', marginBottom: 0 }}
          >
            <span>{feedback.message}</span>
          </div>
        )}
      </form>
    </section>
  );
}
