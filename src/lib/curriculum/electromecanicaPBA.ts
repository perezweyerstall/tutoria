import type { SubjectKind } from '../transform/lessonParser';

export type CampoFormacion =
  | 'Formación General'
  | 'Formación Científico-Tecnológica'
  | 'Formación Técnico-Específica'
  | 'Prácticas Profesionalizantes';

export interface PBATopic {
  id: string;
  name: string;
  summary: string;
  keyConcepts: string[];
  keyFormula?: string;
  practicalApplication: string;
}

export interface PBASubject {
  id: string;
  name: string;
  campo: CampoFormacion;
  year: number; // 1 to 7
  hoursPerWeek?: number;
  description: string;
  topics: PBATopic[];
}

export interface PBACurriculumYear {
  year: number;
  yearLabel: string;
  cycle: 'Ciclo Básico Técnico' | 'Ciclo Superior Técnico en Electromecánica';
  focus: string;
  subjects: PBASubject[];
}

export interface PBALessonTemplate {
  id: string;
  title: string;
  subject: SubjectKind;
  year: number;
  subjectName: string;
  summary: string;
  content: string;
}

/**
 * Base de datos oficial del Diseño Curricular de la Provincia de Buenos Aires
 * para la Educación Secundaria Técnica — Especialidad: Electromecánica
 * (Dirección General de Cultura y Educación - DGCyE PBA / Res. 3828/09, Res. 5655/24 y normativas vigentes).
 */
export const PBA_ELECTROMECANICA_CURRICULUM: PBACurriculumYear[] = [
  // ==========================================
  // CICLO BÁSICO TÉCNICO (1° A 3° AÑO)
  // ==========================================
  {
    year: 1,
    yearLabel: '1° Año',
    cycle: 'Ciclo Básico Técnico',
    focus: 'Iniciación instrumental, habilidades manuales básicas, pensamiento tecnológico y ciencias fundamentales.',
    subjects: [
      {
        id: 'pba-1-procedimientos-tecnicos',
        name: 'Procedimientos Técnicos I (Taller)',
        campo: 'Formación Técnico-Específica',
        year: 1,
        description: 'Operaciones básicas de ajuste manual, corte, limado, trazado plano y seguridad en talleres.',
        topics: [
          {
            id: 't-1-1',
            name: 'Ajuste Mecánico Manual y Limado',
            summary: 'Técnicas de sujeción en morsa, tipos de limas (planas, media caña, triangulares, redondas) y control de planitud con regla de pelo.',
            keyConcepts: ['Morsa de banco', 'Picado simple y doble', 'Regla de control', 'Desbarbado'],
            practicalApplication: 'Conformado de escuadras y piezas prismáticas de acero dulce con tolerancias de medio milímetro.',
          },
          {
            id: 't-1-2',
            name: 'Trazado Plano y Hojalatería',
            summary: 'Uso de gramil, punta de trazar de acero al carbono, granete y compás de puntas sobre chapa galvanizada.',
            keyConcepts: ['Punta de trazar', 'Graneteado', 'Tijera de hojalatero', 'Plegado manual'],
            practicalApplication: 'Construcción de cajas metálicas organizadoras y bandejas de herramientas con bordes pestañados.',
          },
          {
            id: 't-1-3',
            name: 'Seguridad e Higiene Inicial en el Taller',
            summary: 'Uso obligatorio de elementos de protección personal (EPP), orden y limpieza en los puestos de trabajo.',
            keyConcepts: ['Gafas de seguridad', 'Calzado con puntera', 'Protección auditiva', 'Manejo de virutas'],
            practicalApplication: 'Prevención de atrapamientos y lesiones oculares en operaciones de taladrado y limado.',
          },
        ],
      },
      {
        id: 'pba-1-lenguajes-tecnologicos',
        name: 'Lenguajes Tecnológicos I (Dibujo Técnico)',
        campo: 'Formación Técnico-Específica',
        year: 1,
        description: 'Fundamentos de dibujo técnico normalizado según normas IRAM.',
        topics: [
          {
            id: 't-1-4',
            name: 'Normas IRAM de Dibujo Técnico (4502 y 4505)',
            summary: 'Formatos normalizados de láminas (A4, A3), tipos de líneas (continua gruesa, fina, trazos y eje) y caligrafía técnica inclinada y vertical.',
            keyConcepts: ['Formato A4/A3', 'Línea tipo A y B', 'Rótulo escolar IRAM', 'Escalas normalizadas'],
            practicalApplication: 'Confección del rótulo técnico y encuadre normalizado en tablero de dibujo con paralelas.',
          },
          {
            id: 't-1-5',
            name: 'Trazados Geométricos y Proyecciones Ortogonales',
            summary: 'Construcción de mediatrices, bisectrices, polígonos regulares y proyección ortogonal en método ISO-E de cuerpos simples.',
            keyConcepts: ['Proyección diedro', 'Vista anterior o alzado', 'Vista superior o planta', 'Vista lateral izquierda'],
            practicalApplication: 'Representación en tres vistas fundamentales de prismas con rebajes y chaflanes.',
          },
        ],
      },
      {
        id: 'pba-1-sistemas-tecnologicos',
        name: 'Sistemas Tecnológicos I',
        campo: 'Formación Científico-Tecnológica',
        year: 1,
        description: 'Estructura sistémica y operadores mecánicos elementales.',
        topics: [
          {
            id: 't-1-6',
            name: 'Operadores Mecánicos y Máquinas Simples',
            summary: 'Palancas de primer, segundo y tercer género, polea fija y móvil, plano inclinado y ventaja mecánica.',
            keyConcepts: ['Brazo de palanca', 'Ventaja mecánica', 'Momento de fuerza', 'Polea móvil'],
            keyFormula: 'F1 * d1 = F2 * d2',
            practicalApplication: 'Cálculo del esfuerzo requerido para levantar cargas utilizando aparejos de poleas en el taller.',
          },
        ],
      },
      {
        id: 'pba-1-matematica',
        name: 'Matemática I',
        campo: 'Formación General',
        year: 1,
        description: 'Operaciones numéricas, proporcionalidad y geometría aplicada.',
        topics: [
          {
            id: 't-1-7',
            name: 'Números Naturales, Enteros y Proporcionalidad Directa',
            summary: 'Propiedades de las operaciones, regla de tres simple, cálculo de porcentajes y perímetros.',
            keyConcepts: ['Proporcionalidad directa', 'Regla de tres', 'Perímetro', 'Áreas poligonales'],
            practicalApplication: 'Cálculo de longitud de chapa requerida para plegar perfiles según espesor.',
          },
        ],
      },
    ],
  },
  {
    year: 2,
    yearLabel: '2° Año',
    cycle: 'Ciclo Básico Técnico',
    focus: 'Mecanizado y unión de materiales, electricidad básica domiciliaria y ciencias físico-químicas.',
    subjects: [
      {
        id: 'pba-2-procedimientos-tecnicos',
        name: 'Procedimientos Técnicos II (Taller)',
        campo: 'Formación Técnico-Específica',
        year: 2,
        description: 'Uniones soldadas por arco y oxiacetilénica, instalaciones eléctricas domiciliarias elementales.',
        topics: [
          {
            id: 't-2-1',
            name: 'Soldadura Eléctrica por Arco (SMAW)',
            summary: 'Principio del arco eléctrico, electrodos revestidos celulósicos y rutílicos (AWS E6013), polaridad directa e inversa, cordón de soldadura.',
            keyConcepts: ['Electrodo E6013', 'Cebado del arco', 'Escoria protectora', 'Máscara fotosensible'],
            practicalApplication: 'Unión a tope y en ángulo de planchuelas y tubos estructurales de acero para bancos de trabajo.',
          },
          {
            id: 't-2-2',
            name: 'Instalaciones Eléctricas Básicas en Baja Tensión',
            summary: 'Montaje de cajas octogonales y rectangulares, conductores IRAM NM 247-3, empalmes seguros (prolongación y derivación) y conexionado de llaves combinadas.',
            keyConcepts: ['Fase, Neutro y Tierra', 'Llave de un punto', 'Llave de combinación', 'Tomacorriente 10A con toma de tierra'],
            practicalApplication: 'Armado de tablero de prueba con circuito de iluminación comandado desde dos puntos y tomacorriente protegido.',
          },
        ],
      },
      {
        id: 'pba-2-lenguajes-tecnologicos',
        name: 'Lenguajes Tecnológicos II',
        campo: 'Formación Técnico-Específica',
        year: 2,
        description: 'Acotación normalizada, cortes y secciones en dibujo técnico.',
        topics: [
          {
            id: 't-2-3',
            name: 'Cortes, Secciones y Acotación (Norma IRAM 4505)',
            summary: 'Corte total, medio corte y corte quebrado; líneas de cota, flechas normalizadas, cotas de posición y de dimensión.',
            keyConcepts: ['Línea de corte', 'Rayado a 45°', 'Cota en serie y paralelo', 'Sección abatida'],
            practicalApplication: 'Plano de fabricación con corte transversal de una pieza cilíndrica hueca con chavetero interior.',
          },
        ],
      },
      {
        id: 'pba-2-fisico-quimica',
        name: 'Físico-Química',
        campo: 'Formación General',
        year: 2,
        description: 'Leyes fundamentales de la materia, energía, calor y estructura atómica.',
        topics: [
          {
            id: 't-2-4',
            name: 'Estados de la Materia, Calor y Temperatura',
            summary: 'Teoría cinético molecular, calor específico, dilatación térmica de sólidos y fluidos, transmisión del calor (conducción, convección, radiación).',
            keyConcepts: ['Calor específico', 'Dilatación lineal', 'Conducción térmica', 'Calor latente'],
            keyFormula: 'Q = m * c * DeltaT',
            practicalApplication: 'Cálculo de la dilatación térmica en tuberías de vapor y juntas de expansión metálicas.',
          },
        ],
      },
    ],
  },
  {
    year: 3,
    yearLabel: '3° Año',
    cycle: 'Ciclo Básico Técnico',
    focus: 'Máquinas herramientas convencionales, neumática elemental, diseño asistido (CAD) y automatismos con relés.',
    subjects: [
      {
        id: 'pba-3-procedimientos-tecnicos',
        name: 'Procedimientos Técnicos III (Taller)',
        campo: 'Formación Técnico-Específica',
        year: 3,
        description: 'Tornería paralela elemental, mandos neumáticos básicos y cerrajería técnica.',
        topics: [
          {
            id: 't-3-1',
            name: 'Introducción al Torno Paralelo',
            summary: 'Partes de la máquina (bancada, cabezal fijo, cabezal móvil, carro principal y charriot), afilado de cuchillas de acero rápido (HSS), centrado y refrentado.',
            keyConcepts: ['Torno paralelo', 'Acero rápido HSS', 'Velocidad de husillo', 'Refrentado y cilindrado'],
            practicalApplication: 'Mecanizado de un bulón de cabeza hexagonal y cilindrado escalonado en barra maciza.',
          },
          {
            id: 't-3-2',
            name: 'Neumática Elemental',
            summary: 'Generación de aire comprimido, compresores de pistón, unidades FRL, cilindros de simple y doble efecto con válvulas 3/2 pulsador.',
            keyConcepts: ['Aire comprimido', 'Filtro regulador lubricador', 'Cilindro neumático', 'Válvula 3/2 NC'],
            practicalApplication: 'Circuito para expulsión neumática de piezas en una mesa de ensamblado manual.',
          },
        ],
      },
      {
        id: 'pba-3-lenguajes-tecnologicos',
        name: 'Lenguajes Tecnológicos III (CAD 2D)',
        campo: 'Formación Técnico-Específica',
        year: 3,
        description: 'Diseño asistido por computadora para planos mecánicos y esquemas eléctricos.',
        topics: [
          {
            id: 't-3-3',
            name: 'Diseño 2D por Computadora y Simbología Normalizada',
            summary: 'Entorno de trabajo en AutoCAD/LibreCAD, capas, coordenadas cartesianas y polares, acotación y bloques de simbología eléctrica IRAM.',
            keyConcepts: ['Capas (Layers)', 'Simbología unifilar', 'Comandos dibujo y modificación', 'Exportación PDF'],
            practicalApplication: 'Digitalización en CAD del plano de un circuito de iluminación y tomacorrientes domiciliarios.',
          },
        ],
      },
      {
        id: 'pba-3-sistemas-tecnologicos',
        name: 'Sistemas Tecnológicos III',
        campo: 'Formación Científico-Tecnológica',
        year: 3,
        description: 'Circuitos eléctricos de corriente continua y automatismos cableados elementales.',
        topics: [
          {
            id: 't-3-4',
            name: 'Circuitos Eléctricos de CC y Ley de Ohm',
            summary: 'Relación entre tensión, corriente y resistencia; leyes de Kirchhoff de nodos y mallas, potencia eléctrica (efecto Joule).',
            keyConcepts: ['Ley de Ohm', 'Leyes de Kirchhoff', 'Resistencia equivalente', 'Efecto Joule'],
            keyFormula: 'I = V / R',
            practicalApplication: 'Cálculo de caída de potencial en una línea de alimentación de corriente continua y potencia disipada en resistores.',
          },
        ],
      },
    ],
  },

  // ==========================================
  // CICLO SUPERIOR TÉCNICO EN ELECTROMECÁNICA (4° A 7° AÑO)
  // ==========================================
  {
    year: 4,
    yearLabel: '4° Año',
    cycle: 'Ciclo Superior Técnico en Electromecánica',
    focus: 'Estudio de materiales mecánicos y eléctricos, máquinas de corriente continua, metrología de taller e instalaciones de suministro.',
    subjects: [
      {
        id: 'pba-4-conocimiento-materiales',
        name: 'Conocimiento de los Materiales (Estudio de los Materiales)',
        campo: 'Formación Científico-Tecnológica',
        year: 4,
        description: 'Propiedades físicas, químicas y mecánicas de aceros, fundiciones y aleaciones no ferrosas. Ensayos y tratamientos térmicos.',
        topics: [
          {
            id: 't-4-1',
            name: 'Propiedades Mecánicas y Ensayos de Tracción y Dureza',
            summary: 'Curva tensión-deformación en aceros, tensión de fluencia, límite de rotura, módulo elástico de Young. Ensayos Brinell (HB) y Rockwell (HRC).',
            keyConcepts: ['Curva tensión-deformación', 'Tensión de fluencia', 'Dureza Brinell/Rockwell', 'Resiliencia Charpy'],
            keyFormula: 'sigma = F / A_0',
            practicalApplication: 'Determinación de la carga máxima admisible de un perno de acero SAE 1045 con coeficiente de seguridad.',
          },
          {
            id: 't-4-2',
            name: 'Diagrama Hierro-Carbono y Tratamientos Térmicos',
            summary: 'Estructuras de austenita, ferrita, cementita y perlita. Procesos térmicos: temple (martensita), revenido, recocido contra acritud y cementación.',
            keyConcepts: ['Diagrama Fe-C', 'Austenita y Martensita', 'Temple y Revenido', 'Dureza superficial'],
            practicalApplication: 'Temple y revenido de un cincel de taller para obtener filo cortante resistente sin fragilidad excesiva.',
          },
        ],
      },
      {
        id: 'pba-4-maquinas-electricas-1',
        name: 'Máquinas Eléctricas y Automatismos I (Máquinas Eléctricas I)',
        campo: 'Formación Técnico-Específica',
        year: 4,
        description: 'Electromagnetismo aplicado, generadores y motores de corriente continua.',
        topics: [
          {
            id: 't-4-3',
            name: 'Circuitos Magnéticos y Leyes de Inducción',
            summary: 'Flujo magnético, inducción magnética B, excitación magnética H, ciclo de histéresis y ley de Faraday-Lenz.',
            keyConcepts: ['Flujo magnético', 'Reluctancia magnética', 'Ley de Faraday-Lenz', 'Fuerza electromotriz'],
            keyFormula: 'e = -N * (dPhi / dt)',
            practicalApplication: 'Cálculo de la sección de núcleo ferromagnético para evitar la saturación magnética en inductores.',
          },
          {
            id: 't-4-4',
            name: 'Generadores y Motores de Corriente Continua',
            summary: 'Principio constructivo: estator inductor, rotor inducido con delgas, escobillas. Conexiones serie, derivación (shunt) y compuesta. Curvas par-velocidad.',
            keyConcepts: ['Motor CC Shunt', 'Motor CC Serie', 'Fuerza contraelectromotriz', 'Par motor'],
            keyFormula: 'M = k * Phi * I_a',
            practicalApplication: 'Selección de un motor serie de CC para tracción electromecánica gracias a su elevado par de arranque.',
          },
        ],
      },
      {
        id: 'pba-4-diseno-procesamiento-1',
        name: 'Diseño y Procesamiento Mecánico I (Diseño y Mecanizado I)',
        campo: 'Formación Técnico-Específica',
        year: 4,
        description: 'Metrología dimensional de precisión, sistema de tolerancias ISO y mecanizado básico.',
        topics: [
          {
            id: 't-4-5',
            name: 'Metrología Dimensional y Ajustes Normalizados ISO',
            summary: 'Calibre pie de rey con nonio de 0.02 mm, micrómetro centesimal para exteriores, ajustes con juego (H7/g6) y con aprieto (H7/p6).',
            keyConcepts: ['Nonio 0.02 mm', 'Micrómetro centesimal', 'Tolerancias ISO', 'Ajuste H7/g6'],
            practicalApplication: 'Verificación del diámetro rectificado de un eje de transmisión para montaje de rodamientos de bolas.',
          },
          {
            id: 't-4-6',
            name: 'Mecanizado en Torno Paralelo y Parámetros de Corte',
            summary: 'Cálculo de velocidad de corte Vc, RPM del husillo según diámetro, avance de mecanizado, torneado exterior y trinchado.',
            keyConcepts: ['Velocidad de corte', 'RPM del husillo', 'Ángulo de ataque de herramienta', 'Fluido de corte'],
            keyFormula: 'n = (1000 * V_c) / (pi * D)',
            practicalApplication: 'Ajuste de la velocidad de rotación en la caja Norton para mecanizar acero SAE 1020 con cuchilla de metal duro.',
          },
        ],
      },
      {
        id: 'pba-4-instalaciones-energia-1',
        name: 'Instalaciones y Aplicaciones de la Energía I (Montaje y Suministro I)',
        campo: 'Formación Técnico-Específica',
        year: 4,
        description: 'Conductores normalizados, cálculo de caída de tensión y protecciones termomagnéticas y diferenciales.',
        topics: [
          {
            id: 't-4-7',
            name: 'Conductores y Caída de Tensión (Reglamentación AEA 90364)',
            summary: 'Secciones comerciales según corriente admisible, temperatura ambiente y caída de tensión máxima admisible (3% terminales, 5% motrices).',
            keyConcepts: ['Norma IRAM 247-3', 'Caída de tensión DeltaV', 'Conductores de cobre', 'Corriente admisible I_z'],
            keyFormula: 'DeltaV = (2 * L * I * rho) / S',
            practicalApplication: 'Dimensionamiento de la línea seccional de un taller de 40 metros para evitar parpadeo y pérdidas térmicas.',
          },
          {
            id: 't-4-8',
            name: 'Protecciones Eléctricas y Sistema de Puesta a Tierra TT',
            summary: 'Interruptores termomagnéticos (curva C para usos generales, curva D para motores), disyuntor diferencial de 30 mA y jabalina de puesta a tierra con resistencia menor a 10 ohms.',
            keyConcepts: ['Termomagnética Curva C', 'Disyuntor diferencial 30mA', 'Puesta a tierra TT', 'Resistencia jabalina < 10 Ohm'],
            practicalApplication: 'Diseño del cuadro de protecciones de un tablero secundario con selectividad diferencial y puesta a tierra.',
          },
        ],
      },
    ],
  },
  {
    year: 5,
    yearLabel: '5° Año',
    cycle: 'Ciclo Superior Técnico en Electromecánica',
    focus: 'Corriente alterna senoidal monofásica, cinemática de mecanismos, resistencia de materiales, máquinas asincrónicas y electroneumática.',
    subjects: [
      {
        id: 'pba-5-electrotecnia-1',
        name: 'Electrotecnia I (Aplicaciones Técnicas de la Electricidad I)',
        campo: 'Formación Científico-Tecnológica',
        year: 5,
        description: 'Circuitos de corriente alterna monofásica senoidal, impedancia compleja, potencias activa, reactiva y factor de potencia.',
        topics: [
          {
            id: 't-5-1',
            name: 'Corriente Alterna Senoidal e Impedancia Compleja (RLC)',
            summary: 'Frecuencia (50 Hz), valor eficaz, reactancia inductiva X_L = 2*pi*f*L, reactancia capacitiva X_C = 1/(2*pi*f*C), fasores e impedancia Z.',
            keyConcepts: ['Valor eficaz (RMS)', 'Reactancia inductiva', 'Reactancia capacitiva', 'Impedancia Z'],
            keyFormula: 'Z = sqrt(R^2 + (X_L - X_C)^2)',
            practicalApplication: 'Cálculo de la corriente que absorbe una bobina de contactor alimentada a 220 V 50 Hz.',
          },
          {
            id: 't-5-2',
            name: 'Triángulo de Potencias y Factor de Potencia (cos phi)',
            summary: 'Potencia activa P (W), potencia reactiva Q (VAr), potencia aparente S (VA), corrección del factor de potencia mediante capacitores.',
            keyConcepts: ['Potencia Activa P', 'Potencia Reactiva Q', 'Potencia Aparente S', 'Factor de Potencia cos(phi)'],
            keyFormula: 'S = sqrt(P^2 + Q^2)',
            practicalApplication: 'Cálculo de la capacidad en microfaradios necesaria para elevar el factor de potencia de un motor de 0.72 a 0.95.',
          },
        ],
      },
      {
        id: 'pba-5-mecanica-mecanismos',
        name: 'Mecánica y Mecanismos (Física Aplicada)',
        campo: 'Formación Técnico-Específica',
        year: 5,
        description: 'Cinemática y dinámica de transmisiones mecánicas por correas, poleas, cadenas y engranajes.',
        topics: [
          {
            id: 't-5-3',
            name: 'Transmisión por Correas Trapezoidales y Cadenas',
            summary: 'Cálculo de relación de transmisión, velocidad periférica, distancia entre centros, selección de correas en V perfiles A, B y C según potencia a transmitir.',
            keyConcepts: ['Relación de transmisión i', 'Correa trapezoidal', 'Cadena de rodillos ASA', 'Distancia entre centros'],
            keyFormula: 'i = n1 / n2 = D2 / D1',
            practicalApplication: 'Diseño de la transmisión por correa entre un motor eléctrico de 1450 RPM y un compresor de aire de 720 RPM.',
          },
          {
            id: 't-5-4',
            name: 'Engranajes Cilíndricos y Trenes de Reducción',
            summary: 'Módulo métrico m, diámetro primitivo Dp = m * Z, diámetro exterior De = m * (Z + 2), engranajes rectos y helicoidales, relación de trenes compuestos.',
            keyConcepts: ['Módulo métrico m', 'Diámetro primitivo', 'Tren compuesto de engranajes', 'Par motor multiplicado'],
            keyFormula: 'D_p = m * Z',
            practicalApplication: 'Cálculo de la velocidad de salida y torque disponible en el reductor de un puente grúa.',
          },
        ],
      },
      {
        id: 'pba-5-resistencia-materiales',
        name: 'Resistencia y Ensayos de los Materiales (Mecánica de Materiales)',
        campo: 'Formación Científico-Tecnológica',
        year: 5,
        description: 'Esfuerzos axiales, ley de Hooke, flexión en vigas isostáticas y dimensionamiento de perfiles.',
        topics: [
          {
            id: 't-5-5',
            name: 'Esfuerzos Axiales y Ley de Hooke',
            summary: 'Tensión normal sigma, deformación específica épsilon, módulo de Young E, cálculo del alargamiento elástico en barras traccionadas.',
            keyConcepts: ['Tensión normal sigma', 'Módulo de Young E', 'Alargamiento DeltaL', 'Coeficiente de seguridad'],
            keyFormula: 'DeltaL = (F * L) / (E * A)',
            practicalApplication: 'Verificación del alargamiento elástico en los cables de acero de un montacargas industrial.',
          },
          {
            id: 't-5-6',
            name: 'Flexión en Vigas Isostáticas y Diagramas M y V',
            summary: 'Reacciones de apoyo, diagrama de fuerza cortante V(x) y momento flector M(x). Fórmula de Navier sigma = M_max / W_x para perfiles IPN y UPN.',
            keyConcepts: ['Momento flector M_max', 'Fuerza cortante V', 'Módulo resistente W_x', 'Fórmula de Navier'],
            keyFormula: 'sigma_max = M_max / W_x',
            practicalApplication: 'Selección de un perfil laminado IPN para soportar una carga puntual central en una viga de 4 metros.',
          },
        ],
      },
      {
        id: 'pba-5-maquinas-electricas-2',
        name: 'Máquinas Eléctricas y Automatismos II (Máquinas Eléctricas II)',
        campo: 'Formación Técnico-Específica',
        year: 5,
        description: 'Transformadores monofásicos y trifásicos, motores asincrónicos trifásicos y control con contactores.',
        topics: [
          {
            id: 't-5-7',
            name: 'Transformadores Monofásicos y Trifásicos',
            summary: 'Relación de transformación m = V1/V2 = N1/N2, circuito equivalente, ensayo en vacío (pérdidas en el hierro) y en cortocircuito (pérdidas en el cobre), rendimiento.',
            keyConcepts: ['Relación de espiras N1/N2', 'Pérdidas en el hierro', 'Pérdidas en el cobre', 'Rendimiento eta'],
            keyFormula: 'V1 / V2 = N1 / N2 = I2 / I1',
            practicalApplication: 'Cálculo del rendimiento de un transformador de distribución de 100 kVA operando a plena carga.',
          },
          {
            id: 't-5-8',
            name: 'Motores Asincrónicos Trifásicos y Arranque Estrella-Triángulo',
            summary: 'Campo magnético giratorio, velocidad de sincronismo ns = 60*f/p, deslizamiento s, corriente de arranque y comando electromagnético estrella-triángulo.',
            keyConcepts: ['Velocidad de sincronismo', 'Deslizamiento s', 'Arranque Estrella-Triángulo', 'Relé térmico bimetálico'],
            keyFormula: 'n_s = (60 * f) / p',
            practicalApplication: 'Cableado del circuito de potencia y comando con tres contactores y temporizador para arranque suave de un motor de 15 HP.',
          },
        ],
      },
      {
        id: 'pba-5-instalaciones-energia-2',
        name: 'Instalaciones y Aplicaciones de la Energía II (Neumática y Electroneumática)',
        campo: 'Formación Técnico-Específica',
        year: 5,
        description: 'Sistemas neumáticos industriales, válvulas direccionales y mandos electroneumáticos.',
        topics: [
          {
            id: 't-5-9',
            name: 'Circuitos Neumáticos y Dimensionamiento de Cilindros',
            summary: 'Leyes de los gases, caudal de compresores, válvulas 5/2 biestables y monoestables, cilindros de doble efecto y cálculo de fuerza teórica de avance.',
            keyConcepts: ['Presión de trabajo (bar)', 'Fuerza de avance', 'Válvula distribuidora 5/2', 'Regulador de caudal unidireccional'],
            keyFormula: 'F = P * A',
            practicalApplication: 'Cálculo del diámetro de pistón requerido para prensar piezas con una fuerza de 1200 N a 6 bar.',
          },
          {
            id: 't-5-10',
            name: 'Electroneumática y Método Cascada',
            summary: 'Electroválvulas con solenoide de 24 VCC, finales de carrera magnéticos reed switch, mando por relés auxiliares y resolución de secuencias sin señales parásitas.',
            keyConcepts: ['Electroválvula 24VCC', 'Sensor magnético reed', 'Método cascada', 'Relés auxiliares'],
            practicalApplication: 'Automatización de un dispositivo de carga y taladrado secuencial A+ B+ B- A-.',
          },
        ],
      },
    ],
  },
  {
    year: 6,
    yearLabel: '6° Año',
    cycle: 'Ciclo Superior Técnico en Electromecánica',
    focus: 'Sistemas trifásicos de potencia, automatización industrial con PLC, mecanizado CNC, laboratorio de mediciones y oleohidráulica.',
    subjects: [
      {
        id: 'pba-6-electrotecnia-2',
        name: 'Electrotecnia II (Aplicaciones Técnicas de la Electricidad II)',
        campo: 'Formación Científico-Tecnológica',
        year: 6,
        description: 'Sistemas trifásicos equilibrados y desequilibrados, potencia trifásica, armónicos y compensación reactiva.',
        topics: [
          {
            id: 't-6-1',
            name: 'Sistemas Trifásicos Estrella y Triángulo',
            summary: 'Tensiones de línea (380 V) y de fase (220 V), corrientes de línea y de fase en estrella (I_L = I_F) y en triángulo (I_L = sqrt(3)*I_F), potencia trifásica activa.',
            keyConcepts: ['Conexión Estrella', 'Conexión Triángulo', 'Tensión de fase y línea', 'Potencia trifásica activa'],
            keyFormula: 'P = sqrt(3) * V_L * I_L * cos(phi)',
            practicalApplication: 'Cálculo de la corriente de línea absorbida por un horno industrial trifásico conectado en triángulo a 380 V.',
          },
          {
            id: 't-6-2',
            name: 'Compensación Automática de Potencia Reactiva',
            summary: 'Bancos automáticos de capacitores con regulador varimétrico, dimensionamiento del banco en kVAr, cálculo de inductancias antiresonantes contra armónicos.',
            keyConcepts: ['Banco de capacitores', 'Regulador varimétrico', 'Resonancia con armónicos', 'Inductancia de desintonización'],
            keyFormula: 'Q_c = P * (tan(phi_1) - tan(phi_2))',
            practicalApplication: 'Instalación de un banco automático de 45 kVAr en pasos de 5 kVAr para evitar multas de la distribuidora eléctrica.',
          },
        ],
      },
      {
        id: 'pba-6-laboratorio-mediciones',
        name: 'Laboratorio de Mediciones Eléctricas (Metrología I)',
        campo: 'Formación Técnico-Específica',
        year: 6,
        description: 'Métodos de medición industrial en baja y media tensión, osciloscopios, megóhmetro y telurímetro.',
        topics: [
          {
            id: 't-6-3',
            name: 'Medición de Aislación y Resistencia de Tierra (IRAM 2281)',
            summary: 'Ensayo con megóhmetro a 1000 V CC para resistencia de aislación en bobinados (> 1 MOhm/kV); medición de puesta a tierra con telurímetro mediante método de caída de potencial.',
            keyConcepts: ['Megóhmetro 1000V', 'Telurímetro 3 jabalinas', 'Resistencia de dispersión', 'Norma IRAM 2281'],
            practicalApplication: 'Certificación técnica de la resistencia de tierra de un tablero general de una planta industrial.',
          },
          {
            id: 't-6-4',
            name: 'Medición de Potencia Trifásica (Método de los Dos Vatímetros - Aron)',
            summary: 'Conexión Aron en sistemas trifásicos de tres hilos sin neutro, cálculo de potencia activa P = W1 + W2 y potencia reactiva Q = sqrt(3)*(W1 - W2).',
            keyConcepts: ['Método de Aron', 'Vatímetro electrodinámico', 'Sistemas de 3 hilos', 'Determinación indirecta de cos(phi)'],
            keyFormula: 'P_total = W_1 + W_2',
            practicalApplication: 'Medición de consumo y factor de potencia en el motor principal de un molino industrial con vatímetros portátiles.',
          },
        ],
      },
      {
        id: 'pba-6-automatismos-plc',
        name: 'Máquinas Eléctricas y Automatismos III (Automatización y PLC)',
        campo: 'Formación Técnico-Específica',
        year: 6,
        description: 'Variadores de frecuencia electrónicos y controladores lógicos programables (PLC).',
        topics: [
          {
            id: 't-6-5',
            name: 'Controladores Lógicos Programables (PLC) y Lenguaje Ladder',
            summary: 'Estructura modular del PLC, ciclo de scan, entradas y salidas digitales de 24 VCC, programación Ladder (contactos, bobinas, temporizadores TON/TOF y contadores CTU).',
            keyConcepts: ['PLC / Autómata programable', 'Lenguaje Ladder (KOP)', 'Ciclo de scan', 'Temporizador TON'],
            practicalApplication: 'Programación de la lógica de arranque secuencial y parada de emergencia de una cinta transportadora.',
          },
          {
            id: 't-6-6',
            name: 'Variadores de Frecuencia (VFD) y Control de Velocidad',
            summary: 'Etapa rectificadora, bus de CC, inversor PWM con IGBTs, control escalar V/f constante, rampas de aceleración/desaceleración y frenado dinámico.',
            keyConcepts: ['Inversor PWM', 'Curva V/f constante', 'Rampa de aceleración', 'Resistencia de frenado'],
            practicalApplication: 'Parametrización de un variador de 7.5 kW para control de velocidad y frenado suave de un puente grúa.',
          },
        ],
      },
      {
        id: 'pba-6-mecanizado-cnc',
        name: 'Diseño y Procesamiento Mecánico III (Diseño y Mecanizado III - CNC)',
        campo: 'Formación Técnico-Específica',
        year: 6,
        description: 'Programación manual y asistida de tornos y fresadoras de Control Numérico Computarizado (CNC).',
        topics: [
          {
            id: 't-6-7',
            name: 'Programación ISO en Torno y Fresadora CNC (Código G y M)',
            summary: 'Cero máquina (M) y cero pieza (W - G54), interpolaciones G00, G01, G02, G03, ciclo fijo de desbaste G71/G68, compensación de radio de herramienta G41/G42 y funciones M (M03, M08, M30).',
            keyConcepts: ['Código G y M', 'Decalaje G54', 'Interpolación circular G02/G03', 'Ciclo fijo G71'],
            practicalApplication: 'Elaboración del código G para torneado de un eje escalonado con chaflanes y redondeos mediante simulador CNC.',
          },
        ],
      },
      {
        id: 'pba-6-oleohidraulica-energia',
        name: 'Instalaciones y Aplicaciones de la Energía III (Oleohidráulica y Térmica)',
        campo: 'Formación Técnico-Específica',
        year: 6,
        description: 'Oleohidráulica de potencia, circuitos de alta presión y termodinámica técnica.',
        topics: [
          {
            id: 't-6-8',
            name: 'Oleohidráulica Industrial de Alta Presión',
            summary: 'Fluidos hidráulicos ISO VG 68, bombas de engranajes y de pistones axiales, válvulas limitadoras de presión proporcional, cilindros hidráulicos telescópicos y cálculo de potencia hidráulica.',
            keyConcepts: ['Bomba de engranajes', 'Válvula limitadora de presión', 'Fluido hidráulico', 'Potencia hidráulica'],
            keyFormula: 'P_hidr = (p * Q) / 600',
            practicalApplication: 'Cálculo de la potencia requerida en el motor eléctrico para accionar la central hidráulica de una prensa de 50 toneladas.',
          },
        ],
      },
    ],
  },
  {
    year: 7,
    yearLabel: '7° Año',
    cycle: 'Ciclo Superior Técnico en Electromecánica',
    focus: 'Electrónica de potencia y control PID, mantenimiento predictivo industrial, proyecto integrador electromecánico, seguridad en el trabajo y prácticas profesionalizantes.',
    subjects: [
      {
        id: 'pba-7-electronica-industrial',
        name: 'Electrónica Industrial (Sistemas de Control Industrial)',
        campo: 'Formación Técnico-Específica',
        year: 7,
        description: 'Tiristores, TRIACs, IGBTs, convertidores estáticos de potencia, control PID y sistemas SCADA.',
        topics: [
          {
            id: 't-7-1',
            name: 'Semiconductores de Potencia y Convertidores Estáticos',
            summary: 'Diodos de potencia, tiristores (SCR), TRIACs, MOSFETs de potencia e IGBTs. Rectificadores controlados por ángulo de disparo alfa para velocidad de motores y calentamiento inductivo.',
            keyConcepts: ['Tiristor SCR', 'Transistor IGBT', 'Ángulo de disparo alfa', 'Disipador térmico'],
            practicalApplication: 'Diseño de la etapa de potencia de un rectificador trifásico controlado para alimentación de electrólisis.',
          },
          {
            id: 't-7-2',
            name: 'Sistemas de Control en Lazo Cerrado y Control PID',
            summary: 'Lazo cerrado con realimentación, sensor transmisor de 4-20 mA, sintonía de parámetros Proporcional (Kp), Integral (Ti) y Derivativo (Td) mediante método de Ziegler-Nichols.',
            keyConcepts: ['Lazo cerrado de control', 'Acción proporcional Kp', 'Acción integral Ti', 'Sintonía Ziegler-Nichols'],
            practicalApplication: 'Sintonización del lazo PID de temperatura en un intercambiador de calor industrial para minimizar sobrepico.',
          },
        ],
      },
      {
        id: 'pba-7-mantenimiento-montaje',
        name: 'Mantenimiento y Montaje Electromecánico',
        campo: 'Formación Técnico-Específica',
        year: 7,
        description: 'Organización del mantenimiento preventivo, predictivo (CBM), termografía, vibraciones y alineación láser.',
        topics: [
          {
            id: 't-7-3',
            name: 'Mantenimiento Predictivo: Termografía y Análisis de Vibraciones',
            summary: 'Emisividad térmica, detección de puntos calientes en bornes y contactos; análisis de vibraciones mecánicas RMS según ISO 10816, desbalanceo y desalineación de rotores.',
            keyConcepts: ['Termografía infrarroja', 'Vibraciones RMS ISO 10816', 'Desbalanceo dinámico', 'Alineación láser de ejes'],
            practicalApplication: 'Inspección termográfica preventiva del tablero general de una fábrica durante pico de producción.',
          },
          {
            id: 't-7-4',
            name: 'Estrategias de Mantenimiento y RCM (Confiabilidad)',
            summary: 'Mantenimiento correctivo, preventivo, predictivo y RCM (Mantenimiento Centrado en Confiabilidad); cálculo de tasa de falla lambda, MTBF y MTTR.',
            keyConcepts: ['RCM (Confiabilidad)', 'MTBF (Tiempo medio entre fallas)', 'MTTR (Tiempo medio de reparación)', 'Plan de lubricación'],
            keyFormula: 'MTBF = Tiempo_Total_Operacion / Numero_Fallas',
            practicalApplication: 'Elaboración del plan de mantenimiento anual para un parque de 20 bombas centrífugas de procesos.',
          },
        ],
      },
      {
        id: 'pba-7-sistemas-mecanicos',
        name: 'Sistemas Mecánicos (Estructuras Mecánicas)',
        campo: 'Formación Técnico-Específica',
        year: 7,
        description: 'Cálculo de árboles de transmisión a flexotorsión, chavetas y vida útil de rodamientos.',
        topics: [
          {
            id: 't-7-5',
            name: 'Cálculo de Árboles a Flexotorsión y Selección de Rodamientos',
            summary: 'Momento flector y torsor combinados mediante criterio de Von Mises/Tresca; cálculo de vida útil nominal de rodamientos de bolas L_10 en millones de revoluciones y horas.',
            keyConcepts: ['Momento ideal M_eq', 'Criterio de Von Mises', 'Vida útil de rodamientos L_10', 'Capacidad de carga dinámica C'],
            keyFormula: 'M_eq = sqrt(M_f^2 + M_t^2)',
            practicalApplication: 'Dimensionamiento del diámetro del eje principal y rodamientos de soporte en un triturador de mandíbulas.',
          },
        ],
      },
      {
        id: 'pba-7-proyecto-diseno',
        name: 'Proyecto y Diseño Electromecánico (Proyecto Integrador)',
        campo: 'Formación Técnico-Específica',
        year: 7,
        description: 'Desarrollo integral de un prototipo, máquina o instalación electromecánica con memorias técnica, de cálculo y planos.',
        topics: [
          {
            id: 't-7-6',
            name: 'Elaboración del Proyecto Integrador Electromecánico',
            summary: 'Memoria descriptiva, memorias de cálculo mecánico y eléctrico, planos normalizados IRAM en CAD, esquemas unifilares, programación de PLC y presupuesto técnico.',
            keyConcepts: ['Memoria técnica y cálculo', 'Planos de conjunto y despiece', 'Presupuesto de fabricación', 'Cronograma de Gantt'],
            practicalApplication: 'Diseño integral y memoria de cálculo de una máquina envasadora dosificadora automatizada.',
          },
        ],
      },
      {
        id: 'pba-7-seguridad-higiene',
        name: 'Seguridad, Higiene y Protección Ambiental',
        campo: 'Formación Técnico-Específica',
        year: 7,
        description: 'Legislación argentina (Ley 19.587 / Dec. 351/79), las 5 Reglas de Oro eléctricas, protocolo LOTO y gestión ambiental.',
        topics: [
          {
            id: 't-7-7',
            name: 'Las 5 Reglas de Oro en Trabajos Eléctricos y Procedimiento LOTO',
            summary: 'Las 5 Reglas de Oro (corte visible, enclavamiento/bloqueo, verificación de ausencia de tensión, puesta a tierra y señalización); bloqueo y etiquetado físico (Lockout-Tagout).',
            keyConcepts: ['5 Reglas de Oro', 'Bloqueo LOTO', 'Ausencia de tensión', 'Puesta a tierra en cortocircuito'],
            practicalApplication: 'Aplicación obligatoria del protocolo de consignación antes de intervenir una celda de media tensión o motor trifásico.',
          },
        ],
      },
      {
        id: 'pba-7-practicas-profesionalizantes',
        name: 'Prácticas Profesionalizantes del Sector Electromecánico',
        campo: 'Prácticas Profesionalizantes',
        year: 7,
        hoursPerWeek: 6,
        description: '200 horas mínimas de integración en entornos productivos reales, empresas industriales o proyectos tecnológicos comunitarios.',
        topics: [
          {
            id: 't-7-8',
            name: 'Práctica Profesionalizante en Planta Industrial',
            summary: 'Pasantía en industrias metalmecánicas, plantas químicas o distribuidoras de energía: diagnóstico de fallas, mantenimiento en campo y reporte técnico profesional.',
            keyConcepts: ['Entorno productivo real', 'Diagnóstico de averías', 'Bitácora de prácticas', 'Informe técnico profesional'],
            practicalApplication: 'Desempeño en turnos de mantenimiento industrial resolviendo problemas reales en líneas continuas de envasado.',
          },
        ],
      },
    ],
  },
];

/**
 * Lecciones completas pre-construidas listas para importar en la base de datos de TutorIA,
 * cubriendo los pilares técnicos del diseño curricular bonaerense.
 */
export const PBA_ELECTROMECANICA_LESSONS: PBALessonTemplate[] = [
  {
    id: 'pba-electrotecnia-ac-monofasica',
    title: 'Electrotecnia: Circuitos de Corriente Alterna y Factor de Potencia (5° Año PBA)',
    subject: 'physics',
    year: 5,
    subjectName: 'Electrotecnia I',
    summary:
      'Impedancia compleja en circuitos RLC, generación senoidal a 50 Hz, potencias activa, reactiva y corrección del factor de potencia cos(phi).',
    content: `# Electrotecnia: Circuitos de Corriente Alterna y Factor de Potencia (5° Año PBA)

## Ley de Ohm en Corriente Alterna e Impedancia RLC
Tema: Impedancia y reactancias en corriente alterna
\`Z = sqrt(R^2 + (X_L - X_C)^2)\`
**Impedancia compleja (Z)**: La oposición total que presenta un circuito al paso de la corriente alterna senoidal, expresada en ohmios (Ω).
En un circuito de corriente alterna senoidal a 50 Hz, una bobina introduce una reactancia inductiva \`X_L = 2 * pi * f * L\` que atrasa la corriente respecto al voltaje en 90 grados. Por el contrario, un capacitor introduce una reactancia capacitiva \`X_C = 1 / (2 * pi * f * C)\` que adelanta la corriente en 90 grados. La combinación serie con una resistencia óhmica pura \`R\` produce la impedancia total \`Z = sqrt(R^2 + (X_L - X_C)^2)\`.

## Triángulo de Potencias y el Factor de Potencia cos(phi)
Tema: Potencias activa, reactiva y aparente
\`S = sqrt(P^2 + Q^2)\`
**Factor de potencia (cos phi)**: La relación entre la potencia activa útil \`P\` (medida en Watts o kW) y la potencia aparente total entregada por la red \`S\` (en Volt-Amperes o kVA).
La potencia activa \`P = V * I * cos(phi)\` realiza el trabajo mecánico o calórico útil. La potencia reactiva \`Q = V * I * sin(phi)\` (en VAr) es absorbida periódicamente por los campos magnéticos de motores y transformadores. Un bajo factor de potencia (\`cos(phi) < 0.95\`) sobrecarga las líneas de distribución y provoca penalizaciones tarifarias en la Provincia de Buenos Aires.

## Ejemplo resuelto: Compensación de reactiva con banco de capacitores
Tema: Cálculo de capacitores para corrección de cos(phi)
Ejemplo resuelto: Un motor trifásico en un taller de Berazategui consume \`P = 15 kW\` con un factor de potencia inicial \`cos(phi_1) = 0.70\` (\`tan(phi_1) = 1.02\`). Se desea elevar el factor de potencia a \`cos(phi_2) = 0.95\` (\`tan(phi_2) = 0.33\`).
Paso 1: Calculamos la potencia reactiva requerida: \`Q_c = P * (tan(phi_1) - tan(phi_2)) = 15 kW * (1.02 - 0.33) = 15 * 0.69 = 10.35 kVAr\`.
Paso 2: Se selecciona un banco comercial de capacitores de \`12.5 kVAr\` con corte automático, reduciendo la corriente aparente de la línea en un 26%.`,
  },
  {
    id: 'pba-maquinas-electricas-motores',
    title: 'Máquinas Eléctricas: Motores Asincrónicos y Arranque Estrella-Triángulo (5° Año PBA)',
    subject: 'physics',
    year: 5,
    subjectName: 'Máquinas Eléctricas y Automatismos II',
    summary:
      'Velocidad de sincronismo, deslizamiento, circuito de potencia y comando estrella-triángulo para motores asincrónicos trifásicos.',
    content: `# Máquinas Eléctricas: Motores Asincrónicos y Arranque Estrella-Triángulo (5° Año PBA)

## Velocidad de Sincronismo y Deslizamiento en Motores de Inducción
Tema: Principio de funcionamiento del motor asincrónico
\`n_s = (60 * f) / p\`
**Velocidad de sincronismo (n_s)**: La velocidad de rotación del campo magnético giratorio producido por los devanados del estator, determinada exclusivamente por la frecuencia de la red \`f = 50 Hz\` y el número de pares de polos \`p\`.
El rotor en jaula de ardilla jamás puede girar a la velocidad sincrónica exacta, porque necesita cortar líneas de campo magnético para inducir corriente en sus barras. La diferencia relativa se denomina **deslizamiento** \`s = (n_s - n) / n_s\`. Para un motor de 4 polos (\`p = 2\`), la velocidad de sincronismo es de 1500 RPM, y a plena carga gira a aproximadamente 1420 RPM (\`s = 5.3%\`).

## Arranque Estrella-Triángulo en Contactores
Tema: Maniobra de motores asincrónicos trifásicos
\`I_arr_estrella = (1 / 3) * I_arr_triangulo\`
**Arranque Estrella-Triángulo (Y-D)**: Técnica de conmutación electromagnética que reduce la corriente de arranque de un motor trifásico conectando inicialmente los devanados en estrella a 380 V (cada fase recibe 220 V) durante 4 a 8 segundos, pasando luego a triángulo (donde cada fase recibe 380 V plenos).
El arranque directo de un motor asincrónico demanda entre 5 y 7 veces su corriente nominal, lo que provoca caídas de tensión en las redes fabriles. En conexión estrella, tanto la corriente absorbida como el par de arranque se reducen a exactamente un tercio del valor en triángulo.

## Protecciones del Motor: Relé Térmico y Guardamotor
Tema: Protección contra sobrecargas y cortocircuitos
**Relé térmico bimetálico**: Dispositivo de protección que actúa ante sobrecargas sostenidas mediante la flexión de tiras bimetálicas de diferente coeficiente de dilatación térmica.
Debe ajustarse a la corriente nominal de placa del motor (In). En caso de pérdida de una fase (marcha bifásica), el mecanismo diferencial del relé térmico dispara los contactos auxiliares (95-96 NC) interrumpiendo la alimentación de la bobina del contactor en menos de 2 minutos.`,
  },
  {
    id: 'pba-resistencia-flexion-vigas',
    title: 'Resistencia de Materiales: Esfuerzos y Flexión en Vigas Isostáticas (5° Año PBA)',
    subject: 'physics',
    year: 5,
    subjectName: 'Resistencia y Ensayos de los Materiales',
    summary:
      'Ley de Hooke, módulo elástico de Young, diagramas de momento flector y fuerza cortante en vigas y fórmula de Navier.',
    content: `# Resistencia de Materiales: Esfuerzos y Flexión en Vigas Isostáticas (5° Año PBA)

## Ley de Hooke y Alargamiento Elástico en Tracción
Tema: Deformación elástica de los materiales
\`DeltaL = (F * L) / (E * A)\`
**Módulo de elasticidad longitudinal o de Young (E)**: Constante que mide la rigidez intrínseca de un material dentro de su rango elástico lineal, con un valor de aproximadamente 210 GPa (2100000 kgf/cm²) para aceros estructurales al carbono.
Cuando una barra prismática de sección recta \`A\` y longitud inicial \`L\` se somete a una fuerza de tracción axial \`F\`, la tensión normal generada es \`sigma = F / A\`. Según la ley de Hooke, la deformación unitaria es proporcional a la tensión: \`sigma = E * epsilon\`, donde \`DeltaL = (F * L) / (E * A)\`. Al retirar la carga, la pieza recupera sus dimensiones originales si no se superó el límite de fluencia.

## Diagramas de Esfuerzo Cortante y Momento Flector
Tema: Equilibrio estático y flexión en vigas
\`M_max = (q * L^2) / 8\`
**Momento flector (M)**: La suma algebraica de los momentos de todas las fuerzas externas que actúan sobre la viga a un lado de una sección transversal determinada, medido en N·m o kgf·m.
En una viga simplemente apoyada de longitud \`L\` con una carga uniformemente distribuida \`q\` (en N/m):
1. Las reacciones en los apoyos valen \`R_A = R_B = (q * L) / 2\`.
2. El esfuerzo cortante varía linealmente cruzando por cero exactamente en el centro de la luz (\`x = L / 2\`).
3. El momento flector adopta forma parabólica alcanzando su valor máximo absoluto en el centro: \`M_max = (q * L^2) / 8\`.

## Dimensionamiento según la Fórmula de Navier
Tema: Tensión normal máxima por flexión
\`sigma_max = M_max / W_x\`
**Módulo resistente de la sección (W_x)**: Parámetro geométrico que caracteriza la capacidad de una sección transversal para resistir la flexión sin sobrepasar la tensión admisible del material \`sigma_adm = sigma_fluencia / n\`.
Para perfiles comerciales laminados (como IPN o UPN según normas IRAM-IAS U 500), se busca en tablas el perfil cuyo módulo resistente verifique \`W_x >= M_max / sigma_adm\`.`,
  },
  {
    id: 'pba-neumatica-industrial',
    title: 'Neumática Industrial: Compresores, Válvulas y Cilindros de Doble Efecto (5° Año PBA)',
    subject: 'physics',
    year: 5,
    subjectName: 'Instalaciones y Aplicaciones de la Energía II',
    summary:
      'Tratamiento de aire comprimido FRL, válvulas distribuidoras 5/2, cálculo de fuerza en cilindros neumáticos y diseño en cascada.',
    content: `# Neumática Industrial: Compresores, Válvulas y Cilindros de Doble Efecto (5° Año PBA)

## Preparación del Aire Comprimido y Unidad FRL
Tema: Acondicionamiento de aire en plantas industriales
**Unidad de Mantenimiento FRL**: Conjunto compuesto por un Filtro ciclónico para retención de partículas sólidas y agua condensada, un Regulador de presión con diafragma y manómetro, y un Lubricador por efecto Venturi.
El aire atmosférico ingresa al compresor cargado de humedad, polvo y vapores de aceite. Para garantizar que los sellos de nitrilo o poliuretano de las válvulas y cilindros alcancen su vida útil de más de 10 millones de ciclos, el aire debe filtrarse a 5 micrones y regularse a una presión de trabajo constante entre 6 y 7 bar.

## Cálculo de Fuerza en Cilindros Neumáticos de Doble Efecto
Tema: Fuerza teórica y práctica de actuadores lineales
\`F = P * A\`
**Fuerza de avance de un cilindro**: La fuerza transmitida al vástago generada por la presión del aire comprimido actuando sobre el área total del émbolo \`A_1 = (pi * D^2) / 4\`.
En la carrera de retroceso, el vástago ocupa parte del volumen interior, por lo que el área efectiva es menor: \`A_2 = pi * (D^2 - d^2) / 4\`, generando una fuerza de tracción ligeramente inferior.
Para el dimensionamiento práctico, se multiplica la fuerza teórica por un coeficiente de rendimiento dinámico de entre 0.85 y 0.90 para considerar la fricción de las juntas.

## Válvulas Distribuidoras 5/2 y Métodos de Comando
Tema: Comando de cilindros de doble efecto
**Válvula 5/2**: Válvula de 5 vías (conexión 1: presión; conexiones 2 y 4: salidas de trabajo a las cámaras del cilindro; conexiones 3 y 5: escapes con silenciador) y 2 posiciones estables.
Cuando la válvula es biestable (con dos pilotajes neumáticos o solenoides eléctricos de 24 VCC), un pulso momentáneo conmuta la posición y el cilindro avanza, permaneciendo en esa condición hasta que ingrese una señal opuesta en el otro extremo (memoria neumática).`,
  },
  {
    id: 'pba-automatizacion-plc',
    title: 'Automatización Industrial: Controladores Lógicos Programables (PLC) y Ladder (6° Año PBA)',
    subject: 'computer-science',
    year: 6,
    subjectName: 'Máquinas Eléctricas y Automatismos III',
    summary:
      'Arquitectura del PLC, ciclo de scan, temporizadores TON/TOF, contadores y programación en lenguaje Ladder bajo norma IEC 61131-3.',
    content: `# Automatización Industrial: Controladores Lógicos Programables (PLC) y Ladder (6° Año PBA)

## Arquitectura de un PLC y Ciclo de Scan
Tema: Estructura del controlador lógico programable
**Ciclo de Scan del PLC**: Secuencia cíclica y determinística que la CPU del autómata ejecuta en milisegundos dividida en tres etapas fundamentales:
1. **Lectura de entradas**: Se copia el estado físico de los sensores (24 VCC o 0 V) en la tabla de imagen de entradas (I:0/0).
2. **Ejecución del programa de usuario**: La CPU resuelve renglón por renglón la lógica booleana del diagrama de contactos (Ladder) o bloques.
3. **Actualización de salidas**: Se transfiere el estado de la tabla de imagen de salidas (Q:0/0) a los relés físicos o transistores de estado sólido que energizan actuadores.

## Lenguaje de Contactos Ladder (Norma IEC 61131-3)
Tema: Programación de automatismos secuenciales
**Lenguaje Ladder (diagrama de contactos)**: Lenguaje gráfico de programación que emula los esquemas eléctricos de control por relés mediante dos barras de alimentación verticales y peldaños horizontales.
- Contacto normalmente abierto (\`--[ ]--\`): Verdadero si el bit asociado está en 1 lógico.
- Contacto normalmente cerrado (\`--[/]--\`): Verdadero si el bit asociado está en 0 lógico.
- Bobina de salida (\`--( )--\`): Se energiza (pasa a 1) si hay continuidad lógica en el peldaño.
- Bobinas de retención Set/Latch (\`--( S )--\`) y Reset/Unlatch (\`--( R )--\`): Mantienen su estado independientemente de que la condición previa se desactive.

## Temporizadores y Contadores Industriales
Tema: Funciones de tiempo y conteo en PLC
**Temporizador con retardo a la conexión (TON)**: Comienza a cronometrar cuando su entrada lógica se activa; una vez alcanzado el tiempo preestablecido (Preset), activa su bandera de finalización (DN / Done).
Se utiliza para secuencias de arranque progresivo, detección de atascos en cintas transportadoras y conmutación retardada estrella-triángulo en tableros de bombas.`,
  },
  {
    id: 'pba-mecanizado-cnc',
    title: 'Mecanizado CNC: Programación Código G y Ciclos Fijos en Torno y Fresa (6° Año PBA)',
    subject: 'physics',
    year: 6,
    subjectName: 'Diseño y Procesamiento Mecánico III',
    summary:
      'Sistemas de coordenadas cartesianas, decalajes G54, interpolaciones lineales y circulares (G01, G02, G03) y ciclo fijo G71.',
    content: `# Mecanizado CNC: Programación Código G y Ciclos Fijos en Torno y Fresa (6° Año PBA)

## Sistema de Coordenadas y Decalajes de Origen (G54)
Tema: Ejes cartesianos en máquinas herramienta CNC
**Cero pieza (W / Work Origin)**: El punto de referencia fijado por el operador sobre la pieza de trabajo (comúnmente la cara frontal centrada en el eje Z=0 del torno), referenciado al cero máquina (M) a través de los decalajes de origen (\`G54\` a \`G59\`).
En un torno CNC de dos ejes:
- Eje Z: Coincide con la línea de centros del husillo principal; los desplazamientos hacia la derecha de la cara son Z positivos.
- Eje X: Es perpendicular al eje del husillo y mide el diámetro de la pieza mecanizada.

## Funciones Preparatorias de Movimiento (Código G)
Tema: Interpolaciones lineales y circulares
- \`G00\`: Posicionamiento rápido a máxima velocidad de máquina sin contacto con el material (para aproximación y retirada segura de la herramienta).
- \`G01\`: Interpolación lineal con velocidad de avance controlada \`F\` en mm/min o mm/rev (\`G94\` / \`G95\`).
- \`G02\`: Interpolación circular en sentido horario con radio \`R\` especificado.
- \`G03\`: Interpolación circular en sentido antihorario.
- \`G41 / G42\`: Compensación del radio de la plaquita de corte a izquierda o derecha del perfil para evitar errores de forma en conos y arcos.

## Ciclo Fijo de Desbaste Longitudinal G71
Tema: Optimización del mecanizado en torneado
\`G71 U(pasada) R(retroceso)\`
\`G71 P(inicio) Q(fin) U(sobreespesor_X) W(sobreespesor_Z) F(avance)\`
**Ciclo fijo de desbaste G71**: Instrucción paramétrica que remueve automáticamente sucesivas capas de material cilíndrico siguiendo el perfil definido entre los bloques \`P\` y \`Q\`, dejando el sobreespesor especificado para una única pasada final de acabado con \`G70\`.`,
  },
  {
    id: 'pba-seguridad-5-reglas-oro',
    title: 'Seguridad Eléctrica e Industrial: Las 5 Reglas de Oro y Protocolo LOTO (7° Año PBA)',
    subject: 'general-science',
    year: 7,
    subjectName: 'Seguridad, Higiene y Protección Ambiental',
    summary:
      'Procedimiento secuencial de las 5 Reglas de Oro para trabajos sin tensión eléctrica y bloqueo físico y etiquetado LOTO.',
    content: `# Seguridad Eléctrica e Industrial: Las 5 Reglas de Oro y Protocolo LOTO (7° Año PBA)

## Las 5 Reglas de Oro en Trabajos Eléctricos
Tema: Procedimiento obligatorio de desenergización segura
**Las 5 Reglas de Oro**: Protocolo secuencial e inalterable establecido por la Ley Nacional N° 19.587 de Higiene y Seguridad en el Trabajo para garantizar que una instalación eléctrica quede completamente desprovista de tensión antes de cualquier intervención técnica:
1. **Corte visible o apertura efectiva**: Desconectar todas las fuentes de alimentación abriendo seccionadores, interruptores o retirando fusibles con corte a la vista.
2. **Enclavamiento o bloqueo mecánico y señalización**: Bloquear los aparatos de maniobra mediante candados para impedir una reconexión intempestiva e instalar cartel de "Peligro - Hombres Trabajando".
3. **Verificación de ausencia de tensión**: Comprobar con un detector de tensión bipolar calibrado que no existe diferencia de potencial entre fases ni entre fase y tierra.
4. **Puesta a tierra y en cortocircuito**: Colocar conjuntos portátiles de puesta a tierra y cortocircuito en todas las fases conductoras a ambos lados de la zona de trabajo.
5. **Delimitación y señalización de la zona de trabajo**: Colocar vallados, conos y cintas reflectivas delimitando el área de seguridad frente a elementos colindantes en tensión.

## Bloqueo y Etiquetado LOTO (Lockout / Tagout)
Tema: Consignación de energías peligrosas
**Protocolo LOTO (Lockout-Tagout)**: Procedimiento industrial estandarizado para aislar y neutralizar fuentes de energía primaria y residual (eléctrica, neumática, hidráulica, térmica y mecánica por gravedad) antes del mantenimiento.
Cada operario coloca su propio candado físico personal en una aldaba múltiple. La máquina no puede reiniciarse hasta que el último técnico haya retirado su candado personal.

## Elementos de Protección Personal (EPP) Específicos
Tema: Protección ante arco eléctrico y choque
- Guantes dieléctricos ensayados según clase de tensión (Clase 0 hasta 1000 V, Clase 2 hasta 17000 V) acompañados de sobreguantes de cuero contra desgarros mecánicos.
- Pantalla facial con protección contra arco eléctrico (Arc Flash) resistente a radiación térmica.
- Calzado de seguridad con suela dieléctrica de poliuretano sin ojalillos metálicos.`,
  },
  {
    id: 'pba-mantenimiento-predictivo-rcm',
    title: 'Mantenimiento Electromecánico: Termografía, Vibraciones y Metodología RCM (7° Año PBA)',
    subject: 'physics',
    year: 7,
    subjectName: 'Mantenimiento y Montaje Electromecánico',
    summary:
      'Monitoreo por condición (CBM), análisis termográfico, medición de vibraciones RMS según ISO 10816 e indicadores MTBF y MTTR.',
    content: `# Mantenimiento Electromecánico: Termografía, Vibraciones y Metodología RCM (7° Año PBA)

## Mantenimiento Predictivo Basado en la Condición (CBM)
Tema: Monitoreo no destructivo en servicio
**Mantenimiento Predictivo (CBM - Condition Based Maintenance)**: Estrategia que monitorea variables físicas (temperatura, vibración, lubricante) de una máquina mientras opera a régimen normal para detectar fallas incipientes antes de que provoquen una parada catastrófica de planta.
A diferencia del mantenimiento preventivo tradicional por horas de marcha fijas, el predictivo maximiza la vida residual de los componentes y evita intervenciones invasivas innecesarias.

## Inspección Termográfica Infrarroja
Tema: Detección de anomalías térmicas
**Termografía infrarroja**: Técnica óptica que detecta la radiación infrarroja emitida por los cuerpos y la convierte en una imagen térmica cuantitativa (termograma).
- En tableros eléctricos: Un falso contacto en una bornera floja eleva la resistencia local; por efecto Joule \`P = I^2 * R\`, genera un gradiente de temperatura superior a 15 °C respecto a los bornes adyacentes, alertando sobre riesgo inminente de principio de incendio o fusión.
- En motores y bombas: Detecta sobrecalentamiento en cajas de rodamientos por falta de grasa lubricante o desalineación de ejes.

## Análisis de Vibraciones Mecánicas e Indicadores MTBF / MTTR
Tema: Dinámica de máquinas rotantes y confiabilidad
\`MTBF = Tiempo_Total_Operacion / Numero_Fallas\`
\`MTTR = Tiempo_Total_Reparacion / Numero_Fallas\`
**Severidad vibratoria (Norma ISO 10816)**: Medición de la velocidad eficaz cuadrática (RMS en mm/s) en frecuencias de 10 a 1000 Hz sobre apoyos de cojinetes. Permite clasificar la máquina en rangos: Bueno (A), Aceptable (B), No satisfactorio (C) o Peligroso (D).
El indicador **MTBF** (Mean Time Between Failures) mide la confiabilidad del sistema electromecánico; aumentarlo es la meta principal del mantenimiento industrial.`,
  },
];
