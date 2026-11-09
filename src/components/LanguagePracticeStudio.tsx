'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  compareLanguagePractice,
  estimateTargetDurationSec,
  LANGUAGE_NON_MEDICAL_NOTICE,
  type LanguageComparisonResult,
} from '@/lib/language/speechCompare';

export interface LanguageUnitOption {
  id: string;
  title: string;
  body: string;
}

export interface SavedLanguageAttempt {
  id: string;
  phrase: string;
  languageLabel: string;
  captureMode: string;
  targetDurationSec: number;
  recordedDurationSec: number;
  activeSpeechSec: number;
  pauseRatio: number;
  wordsPerMinute: number;
  pacingRatio: number;
  recognizedTranscript: string | null;
  pronunciationOverlap: number | null;
  feedbackSummary: string;
  createdAt: string;
}

interface LanguagePracticeStudioProps {
  languageUnits: LanguageUnitOption[];
  attempts: SavedLanguageAttempt[];
  onSaveAttempt: (payload: {
    unitId?: string | null;
    phrase: string;
    languageLabel: string;
    captureMode: 'microphone' | 'audio-upload' | 'tap-cadence';
    targetDurationSec: number;
    recordedDurationSec: number;
    activeSpeechSec: number;
    recognizedTranscript?: string | null;
  }) => Promise<void>;
  onDeleteAttempt: (id: string) => Promise<void>;
}

interface BrowserSpeechCapabilities {
  microphone: boolean;
  speechRecognition: boolean;
  speechSynthesis: boolean;
  audioContext: boolean;
}

type MinimalSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

async function analyzeAudioBlobWithWebAudio(blob: Blob): Promise<{
  durationSec: number;
  activeSpeechSec: number;
  envelope: number[];
}> {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) {
    throw new Error('La API de Web Audio no está disponible en este navegador.');
  }

  const ctx = new AudioCtx();
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const channel = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const durationSec = Math.max(0.2, audioBuffer.duration);

    // 50ms RMS frames for active speech detection
    const frameSize = Math.max(1, Math.floor(sampleRate * 0.05));
    const rmsFrames: number[] = [];
    let peakRms = 0;

    for (let offset = 0; offset < channel.length; offset += frameSize) {
      const end = Math.min(channel.length, offset + frameSize);
      let sumSq = 0;
      for (let i = offset; i < end; i++) {
        sumSq += channel[i] * channel[i];
      }
      const rms = Math.sqrt(sumSq / Math.max(1, end - offset));
      rmsFrames.push(rms);
      if (rms > peakRms) peakRms = rms;
    }

    const silenceThreshold = Math.max(0.008, peakRms * 0.14);
    const activeFrames = rmsFrames.filter((v) => v >= silenceThreshold).length;
    const activeRatio = rmsFrames.length > 0 ? activeFrames / rmsFrames.length : 0.85;
    const activeSpeechSec = Math.max(0.1, durationSec * activeRatio);

    // Downsample into 28 bars for visual cadence envelope
    const barsCount = 28;
    const envelope: number[] = [];
    for (let b = 0; b < barsCount; b++) {
      const startIdx = Math.floor((b / barsCount) * rmsFrames.length);
      const endIdx = Math.max(
        startIdx + 1,
        Math.floor(((b + 1) / barsCount) * rmsFrames.length)
      );
      let sliceMax = 0;
      for (let k = startIdx; k < endIdx && k < rmsFrames.length; k++) {
        if (rmsFrames[k] > sliceMax) sliceMax = rmsFrames[k];
      }
      envelope.push(peakRms > 0 ? Math.round((sliceMax / peakRms) * 100) / 100 : 0.2);
    }

    return { durationSec, activeSpeechSec, envelope };
  } finally {
    await ctx.close().catch(() => undefined);
  }
}

const CAPTURE_MODE_LABELS: Record<string, string> = {
  microphone: 'Micrófono',
  'audio-upload': 'Clip de audio',
  'tap-cadence': 'Lectura cronometrada',
};

export function LanguagePracticeStudio({
  languageUnits,
  attempts,
  onSaveAttempt,
  onDeleteAttempt,
}: LanguagePracticeStudioProps) {
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [phrase, setPhrase] = useState<string>(
    'Cuanto mayor es la longitud, más lento es el período'
  );
  const [languageLabel, setLanguageLabel] = useState<string>('Español (es-419)');
  const [speechLangCode, setSpeechLangCode] = useState<string>('es-419');
  const [customTargetSec, setCustomTargetSec] = useState<string>('');
  const [transcriptInput, setTranscriptInput] = useState<string>('');

  const [capabilities, setCapabilities] = useState<BrowserSpeechCapabilities>({
    microphone: false,
    speechRecognition: false,
    speechSynthesis: false,
    audioContext: false,
  });

  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [isTapTiming, setIsTapTiming] = useState(false);
  const [tapElapsedSec, setTapElapsedSec] = useState(0);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [envelopeBars, setEnvelopeBars] = useState<number[]>([]);
  const [latestResult, setLatestResult] = useState<LanguageComparisonResult | null>(null);
  const [busyMessage, setBusyMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recordStartMsRef = useRef<number>(0);
  const speechRecRef = useRef<MinimalSpeechRecognition | null>(null);
  const tapIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecCtor =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext;

    setCapabilities({
      microphone:
        typeof navigator !== 'undefined' &&
        typeof navigator.mediaDevices?.getUserMedia === 'function' &&
        typeof MediaRecorder !== 'undefined',
      speechRecognition: Boolean(SpeechRecCtor),
      speechSynthesis: Boolean(typeof window.speechSynthesis !== 'undefined'),
      audioContext: Boolean(AudioCtx),
    });

    return () => {
      if (tapIntervalRef.current) clearInterval(tapIntervalRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const estimate = useMemo(() => estimateTargetDurationSec(phrase), [phrase]);
  const effectiveTargetSec = useMemo(() => {
    const parsed = Number(customTargetSec);
    if (customTargetSec.trim() !== '' && !Number.isNaN(parsed) && parsed >= 0.4) {
      return parsed;
    }
    return estimate.recommendedSec;
  }, [customTargetSec, estimate.recommendedSec]);

  function handleSelectUnit(unitId: string) {
    setSelectedUnitId(unitId);
    if (!unitId) return;
    const found = languageUnits.find((u) => u.id === unitId);
    if (!found) return;
    const boldMatch = found.body.match(/\*\*([^*]{4,160})\*\*/);
    const extracted = boldMatch ? boldMatch[1].trim() : found.title;
    setPhrase(extracted);
    setCustomTargetSec('');
  }

  function handleSpeakReference() {
    if (!capabilities.speechSynthesis || !phrase.trim()) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(phrase.trim());
      utterance.lang = speechLangCode;
      utterance.rate = 0.92;
      window.speechSynthesis.speak(utterance);
    } catch {
      setErrorMessage(
        'La síntesis de voz del navegador no pudo reproducir audio en este sistema; utiliza el indicador de duración de referencia.'
      );
    }
  }

  async function startMicRecording() {
    setErrorMessage(null);
    if (!phrase.trim() || phrase.trim().length < 2) {
      setErrorMessage('Ingresa una frase objetivo (al menos 2 caracteres) antes de grabar.');
      return;
    }
    if (!capabilities.microphone) {
      setErrorMessage(
        'La grabación con micrófono en vivo no está disponible en este contexto del navegador. Usa "Subir clip de audio" o "Iniciar lectura cronometrada" abajo.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      chunksRef.current = [];
      recordStartMsRef.current = performance.now();

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          chunksRef.current.push(ev.data);
        }
      };

      // Optional browser speech-to-text capture if supported
      const SpeechRecCtor =
        (
          window as unknown as {
            SpeechRecognition?: new () => MinimalSpeechRecognition;
            webkitSpeechRecognition?: new () => MinimalSpeechRecognition;
          }
        ).SpeechRecognition ||
        (
          window as unknown as {
            webkitSpeechRecognition?: new () => MinimalSpeechRecognition;
          }
        ).webkitSpeechRecognition;

      if (SpeechRecCtor) {
        try {
          const rec = new SpeechRecCtor();
          rec.lang = speechLangCode;
          rec.continuous = true;
          rec.interimResults = true;
          rec.onresult = (event) => {
            const parts: string[] = [];
            for (let i = 0; i < event.results.length; i++) {
              parts.push(event.results[i][0].transcript);
            }
            setTranscriptInput(parts.join(' ').trim());
          };
          rec.onerror = () => undefined;
          rec.start();
          speechRecRef.current = rec;
        } catch {
          // SpeechRecognition is optional; timing analysis still works
        }
      }

      recorder.onstop = async () => {
        const elapsedFallback = Math.max(
          0.3,
          (performance.now() - recordStartMsRef.current) / 1000
        );
        stream.getTracks().forEach((t) => t.stop());
        if (speechRecRef.current) {
          try {
            speechRecRef.current.stop();
          } catch {
            // ignore
          }
          speechRecRef.current = null;
        }

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
        setAudioPreviewUrl(URL.createObjectURL(blob));

        setBusyMessage('Analizando ritmo y cadencia localmente…');
        try {
          let durationSec = elapsedFallback;
          let activeSpeechSec = elapsedFallback * 0.85;

          if (capabilities.audioContext && blob.size > 0) {
            try {
              const decoded = await analyzeAudioBlobWithWebAudio(blob);
              durationSec = decoded.durationSec;
              activeSpeechSec = decoded.activeSpeechSec;
              setEnvelopeBars(decoded.envelope);
            } catch {
              setEnvelopeBars([]);
            }
          }

          const preview = compareLanguagePractice({
            phrase: phrase.trim(),
            targetDurationSec: effectiveTargetSec,
            recordedDurationSec: durationSec,
            activeSpeechSec,
            recognizedTranscript: transcriptInput.trim() || null,
          });
          setLatestResult(preview);

          await onSaveAttempt({
            unitId: selectedUnitId || null,
            phrase: phrase.trim(),
            languageLabel,
            captureMode: 'microphone',
            targetDurationSec: effectiveTargetSec,
            recordedDurationSec: durationSec,
            activeSpeechSec,
            recognizedTranscript: transcriptInput.trim() || null,
          });
        } catch (err) {
          setErrorMessage(
            err instanceof Error ? err.message : 'No se pudo guardar el intento de práctica.'
          );
        } finally {
          setBusyMessage(null);
        }
      };

      recorder.start();
      setIsRecordingMic(true);
    } catch {
      setErrorMessage(
        'Se denegó el permiso del micrófono o no se detectó ningún dispositivo de entrada. Puedes activar el micrófono en la configuración de tu navegador, subir un clip de audio o usar "Iniciar lectura cronometrada" abajo.'
      );
    }
  }

  function stopMicRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingMic(false);
  }

  async function handleAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('El archivo de audio debe pesar menos de 15 MB.');
      return;
    }

    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioPreviewUrl(URL.createObjectURL(file));
    setBusyMessage('Decodificando clip de audio localmente…');

    try {
      const decoded = await analyzeAudioBlobWithWebAudio(file);
      setEnvelopeBars(decoded.envelope);

      const preview = compareLanguagePractice({
        phrase: phrase.trim(),
        targetDurationSec: effectiveTargetSec,
        recordedDurationSec: decoded.durationSec,
        activeSpeechSec: decoded.activeSpeechSec,
        recognizedTranscript: transcriptInput.trim() || null,
      });
      setLatestResult(preview);

      await onSaveAttempt({
        unitId: selectedUnitId || null,
        phrase: phrase.trim(),
        languageLabel,
        captureMode: 'audio-upload',
        targetDurationSec: effectiveTargetSec,
        recordedDurationSec: decoded.durationSec,
        activeSpeechSec: decoded.activeSpeechSec,
        recognizedTranscript: transcriptInput.trim() || null,
      });
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? `No se pudo decodificar el audio subido (${err.message}). Prueba con un archivo estándar .wav, .webm o .mp3, o usa "Iniciar lectura cronometrada".`
          : 'No se pudo decodificar el archivo de audio.'
      );
    } finally {
      setBusyMessage(null);
      e.target.value = '';
    }
  }

  function startTapTimer() {
    setErrorMessage(null);
    if (!phrase.trim() || phrase.trim().length < 2) {
      setErrorMessage('Ingresa primero una frase objetivo.');
      return;
    }
    recordStartMsRef.current = performance.now();
    setTapElapsedSec(0);
    setIsTapTiming(true);
    if (tapIntervalRef.current) clearInterval(tapIntervalRef.current);
    tapIntervalRef.current = setInterval(() => {
      setTapElapsedSec(
        Math.round(((performance.now() - recordStartMsRef.current) / 1000) * 10) / 10
      );
    }, 100);
  }

  async function finishTapTimer() {
    if (tapIntervalRef.current) {
      clearInterval(tapIntervalRef.current);
      tapIntervalRef.current = null;
    }
    setIsTapTiming(false);
    const durationSec = Math.max(
      0.3,
      Math.round(((performance.now() - recordStartMsRef.current) / 1000) * 100) / 100
    );
    const activeSpeechSec = Math.round(durationSec * 0.88 * 100) / 100;

    setBusyMessage('Comparando ritmo de lectura en voz alta…');
    try {
      const preview = compareLanguagePractice({
        phrase: phrase.trim(),
        targetDurationSec: effectiveTargetSec,
        recordedDurationSec: durationSec,
        activeSpeechSec,
        recognizedTranscript: transcriptInput.trim() || null,
      });
      setLatestResult(preview);
      setEnvelopeBars([]);

      await onSaveAttempt({
        unitId: selectedUnitId || null,
        phrase: phrase.trim(),
        languageLabel,
        captureMode: 'tap-cadence',
        targetDurationSec: effectiveTargetSec,
        recordedDurationSec: durationSec,
        activeSpeechSec,
        recognizedTranscript: transcriptInput.trim() || null,
      });
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'No se pudo guardar la comparación de ritmo.'
      );
    } finally {
      setBusyMessage(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
      <div className="banner banner-info" role="note" style={{ marginBottom: 0 }}>
        <span>
          <strong>Aviso de alcance no médico:</strong> {LANGUAGE_NON_MEDICAL_NOTICE}
        </span>
      </div>

      {errorMessage && (
        <div className="banner banner-error" role="alert" style={{ marginBottom: 0 }}>
          <span>{errorMessage}</span>
          <button
            id="lang-dismiss-error-btn"
            type="button"
            className="btn btn-sm"
            onClick={() => setErrorMessage(null)}
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="two-col-grid">
        <section className="panel" aria-label="Controles de grabación de práctica de idiomas">
          <div className="panel-header">
            <h3>1. Frase objetivo y captura</h3>
            <span className="badge badge-teal">
              Meta ~{effectiveTargetSec.toFixed(1)}s ({estimate.wordCount} palabras)
            </span>
          </div>

          {languageUnits.length > 0 && (
            <div className="field-group">
              <label htmlFor="lang-unit-select" className="field-label">
                Cargar desde unidad de idioma de la lección (Opcional)
              </label>
              <select
                id="lang-unit-select"
                className="select"
                value={selectedUnitId}
                onChange={(e) => handleSelectUnit(e.target.value)}
              >
                <option value="">Frase de práctica personalizada</option>
                {languageUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="field-group">
            <label htmlFor="lang-phrase-input" className="field-label">
              Frase objetivo para pronunciar en voz alta
            </label>
            <textarea
              id="lang-phrase-input"
              className="textarea"
              style={{ minHeight: '78px' }}
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
            />
          </div>

          <div className="two-col-grid" style={{ gap: '0.75rem', marginBottom: '0.85rem' }}>
            <div className="field-group" style={{ marginBottom: 0 }}>
              <label htmlFor="lang-locale-select" className="field-label">
                Idioma / variante
              </label>
              <select
                id="lang-locale-select"
                className="select"
                value={speechLangCode}
                onChange={(e) => {
                  const code = e.target.value;
                  setSpeechLangCode(code);
                  const labelMap: Record<string, string> = {
                    'es-419': 'Español (es-419)',
                    'en-US': 'Inglés (en-US)',
                    'fr-FR': 'Francés (fr-FR)',
                    'de-DE': 'Alemán (de-DE)',
                    'ja-JP': 'Japonés (ja-JP)',
                  };
                  setLanguageLabel(labelMap[code] || code);
                }}
              >
                <option value="es-419">Español (es-419)</option>
                <option value="en-US">Inglés (en-US)</option>
                <option value="fr-FR">Francés (fr-FR)</option>
                <option value="de-DE">Alemán (de-DE)</option>
                <option value="ja-JP">Japonés (ja-JP)</option>
              </select>
            </div>

            <div className="field-group" style={{ marginBottom: 0 }}>
              <label htmlFor="lang-target-sec-input" className="field-label">
                Duración de referencia (seg)
              </label>
              <input
                id="lang-target-sec-input"
                type="number"
                step="0.1"
                min="0.5"
                max="120"
                className="input mono"
                placeholder={String(estimate.recommendedSec)}
                value={customTargetSec}
                onChange={(e) => setCustomTargetSec(e.target.value)}
              />
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="lang-transcript-input" className="field-label">
              Transcripción hablada (Se completa automáticamente si el navegador soporta voz a texto, o escríbela tú)
            </label>
            <input
              id="lang-transcript-input"
              type="text"
              className="input"
              placeholder={
                capabilities.speechRecognition
                  ? 'Se completará automáticamente al grabar con micrófono, o escribe lo que pronunciaste…'
                  : 'Voz a texto del navegador no disponible aquí: escribe lo que pronunciaste para comparar palabras…'
              }
              value={transcriptInput}
              onChange={(e) => setTranscriptInput(e.target.value)}
            />
          </div>

          <div className="btn-row" style={{ marginTop: '0.9rem' }}>
            {!isRecordingMic ? (
              <button
                id="lang-mic-record-btn"
                type="button"
                className="btn btn-primary"
                disabled={Boolean(busyMessage) || isTapTiming}
                onClick={startMicRecording}
              >
                Grabar con micrófono
              </button>
            ) : (
              <button
                id="lang-mic-stop-btn"
                type="button"
                className="btn btn-danger"
                onClick={stopMicRecording}
              >
                Detener grabación
              </button>
            )}

            {!isTapTiming ? (
              <button
                id="lang-tap-start-btn"
                type="button"
                className="btn"
                disabled={Boolean(busyMessage) || isRecordingMic}
                onClick={startTapTimer}
              >
                Iniciar lectura cronometrada
              </button>
            ) : (
              <button
                id="lang-tap-stop-btn"
                type="button"
                className="btn btn-sage"
                onClick={finishTapTimer}
              >
                Finalizar lectura ({tapElapsedSec.toFixed(1)}s)
              </button>
            )}

            <label
              htmlFor="lang-audio-upload-input"
              className="btn"
              style={{ cursor: 'pointer' }}
            >
              Subir clip de audio
              <input
                id="lang-audio-upload-input"
                type="file"
                accept="audio/*"
                style={{ display: 'none' }}
                onChange={handleAudioUpload}
              />
            </label>

            {capabilities.speechSynthesis && (
              <button
                id="lang-listen-reference-btn"
                type="button"
                className="btn btn-sm"
                onClick={handleSpeakReference}
              >
                Escuchar cadencia de referencia
              </button>
            )}
          </div>

          <div className="meta-line" style={{ marginTop: '0.75rem' }}>
            <span>
              API de micrófono:{' '}
              <strong>{capabilities.microphone ? 'Disponible' : 'Modo alternativo'}</strong>
            </span>
            <span>·</span>
            <span>
              Voz a texto:{' '}
              <strong>
                {capabilities.speechRecognition ? 'Disponible' : 'Autoverificación manual'}
              </strong>
            </span>
            {busyMessage && (
              <>
                <span>·</span>
                <span role="status">{busyMessage}</span>
              </>
            )}
          </div>

          {audioPreviewUrl && (
            <div style={{ marginTop: '0.9rem' }}>
              <span className="field-hint" style={{ display: 'block', marginBottom: '0.3rem' }}>
                Reproducción local (nunca sale de tu computadora):
              </span>
              <audio controls src={audioPreviewUrl} style={{ width: '100%', height: '36px' }} />
            </div>
          )}
        </section>

        {/* Comparison Results */}
        <section className="panel" aria-label="Resultados de comparación de ritmo y pronunciación">
          <div className="panel-header">
            <h3>2. Comparación de ritmo y pronunciación</h3>
            {latestResult && (
              <span
                className={`badge ${
                  latestResult.timingBand === 'steady' ? 'badge-sage' : 'badge-amber'
                }`}
              >
                Ritmo ×{latestResult.pacingRatio}
              </span>
            )}
          </div>

          {!latestResult ? (
            <div className="empty-state" style={{ padding: '1.25rem' }}>
              <p style={{ marginBottom: 0 }}>
                Graba con tu micrófono, sube un clip corto de audio o usa la lectura cronometrada
                para comparar tu duración hablada, proporción de pausas, palabras por minuto y
                coincidencia de palabras frente a la frase de referencia.
              </p>
            </div>
          ) : (
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: '0.65rem',
                  marginBottom: '1rem',
                }}
              >
                <div className="panel-subtle" style={{ padding: '0.7rem' }}>
                  <div className="field-hint">Duración</div>
                  <div className="mono" style={{ fontWeight: 600 }}>
                    {latestResult.recordedDurationSec}s / {latestResult.targetDurationSec}s
                  </div>
                </div>
                <div className="panel-subtle" style={{ padding: '0.7rem' }}>
                  <div className="field-hint">Cadencia</div>
                  <div className="mono" style={{ fontWeight: 600 }}>
                    {latestResult.wordsPerMinute} PPM
                  </div>
                </div>
                <div className="panel-subtle" style={{ padding: '0.7rem' }}>
                  <div className="field-hint">Proporción de pausas</div>
                  <div className="mono" style={{ fontWeight: 600 }}>
                    {Math.round(latestResult.pauseRatio * 100)}%
                  </div>
                </div>
              </div>

              {envelopeBars.length > 0 && (
                <div className="svg-plot-frame" style={{ marginBottom: '0.9rem' }}>
                  <svg
                    viewBox="0 0 320 68"
                    width="100%"
                    height="68"
                    role="img"
                    aria-label="Envolvente de amplitud y cadencia del habla grabada"
                  >
                    {envelopeBars.map((val, idx) => {
                      const bw = 300 / envelopeBars.length - 2;
                      const bh = Math.max(4, val * 52);
                      const x = 10 + idx * (300 / envelopeBars.length);
                      const y = 34 - bh / 2;
                      return (
                        <rect
                          key={idx}
                          x={x}
                          y={y}
                          width={bw}
                          height={bh}
                          rx="2"
                          fill={val > 0.14 ? 'hsl(187, 66%, 28%)' : 'hsl(36, 16%, 78%)'}
                        />
                      );
                    })}
                  </svg>
                </div>
              )}

              <p style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                {latestResult.feedbackSummary}
              </p>

              {latestResult.pronunciationOverlap !== null && (
                <div>
                  <span className="field-label">
                    Coincidencia de palabras ({Math.round(latestResult.pronunciationOverlap * 100)}%):
                  </span>
                  <div className="token-wrap">
                    {latestResult.wordTokens.map((tok, i) => (
                      <span
                        key={`${tok.word}-${i}`}
                        className={`word-token ${tok.matched ? 'matched' : 'unmatched'}`}
                      >
                        {tok.word}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* History */}
      <section className="panel" aria-label="Intentos guardados de práctica de idiomas">
        <div className="panel-header">
          <h3>Historial local de práctica reciente</h3>
          <span className="badge">{attempts.length} guardados localmente</span>
        </div>

        {attempts.length === 0 ? (
          <p className="field-hint">Aún no se han registrado comparaciones de ritmo de idioma.</p>
        ) : (
          <ul className="item-list">
            {attempts.slice(0, 10).map((att) => (
              <li
                key={att.id}
                className="plan-step-item"
                style={{ alignItems: 'center', flexWrap: 'wrap' }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{att.phrase}</div>
                  <div className="meta-line">
                    <span className="badge">{att.languageLabel}</span>
                    <span>Modo: {CAPTURE_MODE_LABELS[att.captureMode] ?? att.captureMode}</span>
                    <span>
                      {att.recordedDurationSec}s vs {att.targetDurationSec}s ({att.wordsPerMinute}{' '}
                      PPM)
                    </span>
                    {att.pronunciationOverlap !== null && (
                      <span>Coincidencia: {Math.round(att.pronunciationOverlap * 100)}%</span>
                    )}
                  </div>
                  <p className="field-hint" style={{ marginTop: '0.25rem' }}>
                    {att.feedbackSummary}
                  </p>
                </div>
                <button
                  id={`delete-lang-attempt-${att.id}`}
                  type="button"
                  className="btn btn-sm"
                  onClick={() => onDeleteAttempt(att.id)}
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
