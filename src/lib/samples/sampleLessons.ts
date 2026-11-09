import type { SubjectKind } from '../transform/lessonParser';
import { PBA_ELECTROMECANICA_LESSONS } from '../curriculum/electromecanicaPBA';

export interface SampleNoteTemplate {
  id: string;
  label: string;
  title: string;
  subject: SubjectKind;
  sourceFormat: 'markdown' | 'text' | 'notes';
  description: string;
  content: string;
}

const BASE_TEMPLATES: SampleNoteTemplate[] = [
  {
    id: 'pendulum-harmonic',
    label: 'Física: Péndulos y fuerza restauradora',
    title: 'Péndulo simple y movimiento armónico para ángulos pequeños',
    subject: 'physics',
    sourceFormat: 'markdown',
    description:
      'Apunte en Markdown de tres unidades sobre fuerza restauradora, ley de raíz cuadrada del período e intercambio de energía.',
    content: `# Péndulo simple y movimiento armónico para ángulos pequeños

## Fuerza restauradora y ángulos pequeños
**Fuerza restauradora**: El tirón tangencial \`F = -m * g * sin(theta)\` que acelera la lenteja desplazada de vuelta hacia el equilibrio.
Cuando el ángulo de oscilación theta es pequeño (menor a unos 15 grados o 0.26 radianes), \`sin(theta)\` es casi igual a \`theta\` medido en radianes. Esa aproximación lineal convierte el movimiento del péndulo en una oscilación armónica simple.

## El período depende de la longitud y la gravedad
Tema: Ley de escala del péndulo
\`T = 2 * pi * sqrt(L / g)\`
**Período (T)**: El tiempo en segundos necesario para completar un ciclo completo de ida y vuelta.
Observa qué variable no aparece en \`T = 2 * pi * sqrt(L / g)\`: ¡la masa \`m\` se cancela por completo! Cuadruplicar la longitud \`L\` de la cuerda duplica el período de oscilación porque la longitud está dentro de una raíz cuadrada.

## Intercambio de energía potencial y cinética
Tema: Conservación de la energía mecánica
\`E = 0.5 * k * x^2\`
En los extremos más altos del recorrido, la rapidez es instantáneamente cero y la energía potencial gravitatoria es máxima. Al pasar por el punto más bajo de equilibrio, la energía potencial se transforma en energía cinética conservando la energía mecánica total si despreciamos la fricción del aire.`,
  },
  {
    id: 'derivatives-linearization',
    label: 'Matemáticas: Derivadas como linealización local',
    title: 'Las derivadas como rectas al hacer zoom',
    subject: 'mathematics',
    sourceFormat: 'markdown',
    description:
      'Apuntes de cálculo sobre cociente incremental, pendiente tangente y aproximaciones lineales locales.',
    content: `# Las derivadas como rectas al hacer zoom

## De la pendiente secante a la tasa instantánea
Tema: Cociente incremental y límites
\`m_sec = ((x0 + h)^2 - x0^2) / h\`
**Cociente incremental**: La tasa de cambio promedio de \`f(x)\` a lo largo de un paso horizontal finito \`h\`.
A medida que reducimos el paso \`h\` hacia cero, cualquier curva suave se ve más plana y recta al acercarnos. El límite de la pendiente de la recta secante define la derivada \`f'(x0)\`.

## Ejemplo resuelto: Linealización cerca de un cuadrado conocido
Tema: Linealización local
Ejemplo resuelto: Estimar \`(3.02)^2\` sin multiplicar decimales directamente.
Paso 1: Anclamos en \`x0 = 3\`, donde \`f(3) = 9\` y la pendiente tangente es \`f'(3) = 2 * 3 = 6\`.
Paso 2: Aplicamos \`L(x) = f(x0) + f'(x0) * (x - x0)\` con paso \`0.02\` para obtener \`9 + 6 * 0.02 = 9.12\`, quedando a solo \`0.0004\` del valor exacto \`9.1204\`.`,
  },
  {
    id: 'english-stem-cadence',
    label: 'Idiomas: Fluidez en frases científicas (EN)',
    title: 'Práctica de ritmo y pronunciación científica en inglés',
    subject: 'language',
    sourceFormat: 'notes',
    description:
      'Frases habladas para practicar duración, pausas y pronunciación en el Laboratorio de Idiomas.',
    content: `# Práctica de ritmo y pronunciación científica en inglés

## Enunciar una hipótesis proporcional
Tema: Expresión oral científica
**The greater the length, the slower the oscillation period**: Cuanto mayor es la longitud, más lento es el período de oscilación.
Practica enlazar las palabras de forma continua manteniendo un ritmo parejo y haciendo una pausa breve en la coma.

## Verificar unidades antes de calcular
Tema: Expresión oral científica
**Always verify your physical units before computing the result**: Verifica siempre tus unidades físicas antes de calcular el resultado.
Marca con claridad las sílabas tónicas en "AL-ways", "U-nits" y "re-SULT" sin apresurar las preposiciones intermedias.`,
  },
];

const PBA_TEMPLATES: SampleNoteTemplate[] = PBA_ELECTROMECANICA_LESSONS.map((lesson) => ({
  id: lesson.id,
  label: `${lesson.year}° Año PBA — ${lesson.subjectName}`,
  title: lesson.title,
  subject: lesson.subject,
  sourceFormat: 'markdown',
  description: `${lesson.summary} (Diseño Curricular PBA - Especialidad Electromecánica)`,
  content: lesson.content,
}));

/**
 * Plantillas de apuntes editables que incluyen el programa completo de
 * Electromecánica PBA (física aplicada, electrotecnia, máquinas eléctricas,
 * resistencia de materiales, PLC, CNC, mantenimiento y seguridad industrial).
 */
export const SAMPLE_NOTE_TEMPLATES: SampleNoteTemplate[] = [...BASE_TEMPLATES, ...PBA_TEMPLATES];
