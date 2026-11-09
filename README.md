# TutorIA — Cuaderno Personal Interactivo de Matemáticas, Ciencias y Repaso Activo

TutorIA es un cuaderno local de estudio individual construido con **Next.js 15**, **TypeScript**, **SQLite (`better-sqlite3`)**, **Drizzle ORM** y un **Service Worker para uso sin conexión**.

Ofrece un sustituto personal y transparente para tus flujos de estudio activo de matemáticas, ciencias e idiomas: tú aportas tus propios apuntes en Markdown o texto plano, y TutorIA los divide en **unidades de aprendizaje editables**, añade **exploradores interactivos de parámetros y puntos de control activos**, prepara **borradores de tarjetas de estudio y cuestionarios cortos sujetos a tu aprobación explícita**, programa un **calendario transparente de repaso espaciado (`due`, `again`, `hard`, `good`, `easy` / pendiente, otra vez, difícil, bien, fácil)** y visualiza **gráficas de avance sin rachas diarias y diagnóstico de temas por reforzar**, todo guardado localmente en tu computadora por defecto.

---

## Alcance Honesto y Exclusiones Deliberadas

TutorIA es estrictamente una **herramienta personal de autoestudio** y no realiza afirmaciones más allá de la organización local del aprendizaje y la práctica de recuperación activa:

- **Sin instrucción acreditada, calificaciones oficiales ni certificados:** Todos los puntos de control, resultados de cuestionarios y gráficas de avance son señales informales de autoestudio personal.
- **Sin catálogo de cursos comerciales o con licencia:** La base de datos inicia completamente vacía; todo el contenido proviene de los apuntes que tú mismo escribes o importas (puedes cargar plantillas de apuntes de dominio público en el editor para inspeccionarlas o editarlas).
- **Sin tutores en vivo, aulas masivas ni mercado de estudiantes:** Diseñado exclusivamente para estudio individual a tu propio ritmo.
- **Sin cuentas, cobros, telemetría, analíticas ni panel de control en la nube:** `NEXT_TELEMETRY_DISABLED=1` viene configurado por defecto; no existe ningún rastreo de uso.
- **Sin afirmaciones de reproducir datos propietarios, liquidez de red, acceso regulado ni infraestructura de frontera.**
- **Sin afirmaciones médicas ni clínicas sobre el habla:** Las comparaciones de duración, cadencia, proporción de pausas y coincidencia de palabras usan las APIs estándar de audio y voz del navegador únicamente como apoyo informal para practicar idiomas, y nunca constituyen una evaluación médica, audiológica ni fonoaudiológica.

---

## Base de Datos Curricular: Secundaria Técnica en Electromecánica (PBA)

TutorIA incorpora la base de datos oficial de contenidos mínimos, materias y talleres del **Diseño Curricular de la Provincia de Buenos Aires para la Educación Secundaria Técnica — Orientación Electromecánica** (Dirección General de Cultura y Educación - DGCyE PBA / Resolución N° 3828/09, Res. 5655/24 y normativas vigentes), abarcando la trayectoria formativa completa de **7 años**:

### 1. Ciclo Básico Técnico (1° a 3° Año)
- **1° Año:** Procedimientos Técnicos I (Ajuste manual, limado, trazado plano con gramil, hojalatería, EPP y seguridad inicial), Lenguajes Tecnológicos I (Normas IRAM de dibujo técnico 4502 y 4505, rotulado IRAM 4503), Sistemas Tecnológicos I (Máquinas simples, palancas, poleas y cinemática básica).
- **2° Año:** Procedimientos Técnicos II (Soldadura eléctrica por arco con electrodo revestido SMAW E6013/E7018, electricidad domiciliaria básica, cajas de paso, llaves de combinación y cables IRAM 247-3), Lenguajes Tecnológicos II (Cortes, secciones y acotación normalizada), Físico-Química (Energía térmica, calorimetría y dilatación).
- **3° Año:** Procedimientos Técnicos III (Tornería paralela básica, cálculo de RPM con $N = \frac{1000 \cdot V_c}{\pi \cdot D}$, frenteado, cilindrado, herramientas HSS), Lenguajes Tecnológicos III (Diseño asistido por computadora CAD 2D), Sistemas Tecnológicos III (Leyes de Ohm y Kirchhoff en CC, divisores resistivos y potencia eléctrica $P = V \cdot I$).

### 2. Ciclo Superior Técnico en Electromecánica (4° a 7° Año)
- **4° Año:** Conocimiento y Ensayo de los Materiales (Diagrama Fe-C, temple, revenido, ensayos de tracción y dureza Brinell/Rockwell), Máquinas Eléctricas I (Circuitos magnéticos, motores y generadores de corriente continua), Diseño y Procesamiento Mecánico I (Metrología de precisión con calibre y micrómetro, tolerancias ISO H7/g6), Instalaciones y Aplicaciones de la Energía I (Reglamentación AEA 90364, cálculo de alimentadores por caída de tensión admisible $\Delta V \le 3\%$, protección termomagnética curva C, disyuntores diferenciales de 30 mA y esquema de puesta a tierra TT).
- **5° Año:** Electrotecnia I (Circuitos senoidales de corriente alterna a 50 Hz, impedancia compleja $Z = R + j(X_L - X_C)$, triángulo de potencias activa $P$, reactiva $Q$ y aparente $S$, corrección del factor de potencia $\cos(\varphi)$ con capacitores), Mecánica y Mecanismos (Transmisiones mecánicas por correas trapezoidales, cadenas y engranajes cilíndricos $D_p = m \cdot Z$), Resistencia y Ensayos de los Materiales (Ley de Hooke, módulo de Young, diagramas de momentos flectores $M(x)$ y corte $V(x)$, fórmula de Navier $\sigma_{max} = \frac{M_{max}}{W_x}$ en perfiles IPN/UPN), Máquinas Eléctricas y Automatismos II (Transformadores monofásicos y trifásicos, motores asincrónicos jaula de ardilla, velocidad de sincronismo $n_s = \frac{60 \cdot f}{p}$, deslizamiento y maniobra estrella-triángulo $Y-\Delta$), Instalaciones y Aplicaciones de la Energía II (Neumática industrial, compresores, unidad de mantenimiento FRL, cilindros de doble efecto $F = P \cdot A$ y método de diseño en cascada).
- **6° Año:** Electrotecnia II (Sistemas trifásicos equilibrados y desequilibrados, tensiones de línea y fase $V_L = \sqrt{3}V_F$, método de Aron de los dos vatímetros), Máquinas Eléctricas y Automatismos III (Automatización con controladores lógicos programables PLC en lenguaje de contactos Ladder bajo norma IEC 61131-3, ciclo de scan, temporizadores TON/TOF y contadores), Diseño y Procesamiento Mecánico III (Mecanizado por Control Numérico Computarizado CNC en torno y fresadora, código ISO G00, G01, G02, G03, ciclo fijo de desbaste G71 y compensación de radio de plaquita G41/G42), Oleohidráulica y Térmica (Bombas hidráulicas volumétricas, válvulas limitadoras de presión y dimensionamiento de calderas de vapor).
- **7° Año:** Electrónica Industrial (Semiconductores de potencia SCR, TRIAC, IGBT, rectificadores controlados y lazos cerrados PID), Sistemas Mecánicos (Cálculo de árboles de transmisión a flexión y torsión combinadas $M_{eq} = \sqrt{M_f^2 + M_t^2}$, rodamientos y vida útil nominal $L_{10}$), Mantenimiento y Montaje Electromecánico (Estrategias de mantenimiento predictivo CBM y RCM, termografía infrarroja, análisis de vibraciones mecánicas RMS según ISO 10816 y cálculo de confiabilidad MTBF y MTTR), Seguridad, Higiene y Protección Ambiental (Ley Nacional 19.587, Decreto 351/79, protocolo obligatorio de las **5 Reglas de Oro** para trabajos eléctricos sin tensión y procedimiento LOTO Lockout/Tagout de consignación de energías peligrosas), Prácticas Profesionalizantes (200 horas reloj en empresas o plantas de producción).

### Exploración y Sincronización
- **Pestaña "Currículum PBA":** Permite navegar visualmente el programa de los 7 años, filtrar por año o campo formativo, realizar búsquedas instantáneas y cargar cualquier tema directamente en el editor con un clic.
- **Comando de carga directa:** Para poblar la base SQLite local con las lecciones interactivas de Electromecánica PBA:
  ```bash
  npm run seed:pba
  ```
- **Botón en interfaz:** En la barra superior de "Plan y lecciones" y en el estado inicial del cuaderno se encuentra el botón **"⚙ Cargar Currículum Oficial de Electromecánica PBA (1° a 7° Año)"**, que importa los contenidos y unidades interactivas de forma inmediata.

---

## Inicio Rápido (Un Solo Comando para la Primera Ejecución)

### Requisitos previos
- **Node.js 20+ / 24 LTS** y **npm**

### Primera ejecución (un comando documentado)
Desde la raíz del repositorio, ejecuta:

```bash
./quickstart.sh
```

Lo que `./quickstart.sh` realiza automáticamente en la primera ejecución:
1. Instala las dependencias de npm si la carpeta `node_modules/` aún no existe.
2. Copia `.env.example` a `.env` si `.env` no existe todavía.
3. Crea los directorios `./data/` y `./data/backups/` e inicializa automáticamente todas las tablas de SQLite mediante Drizzle en la primera solicitud.
4. Inicia el servidor local de Next.js 15 en `http://localhost:3000` con la telemetría del framework desactivada.

*(Una vez instaladas las dependencias, `npm run dev` también garantiza automáticamente la creación de `.env` y `./data` mediante el script `predev`.)*

---

## Variables de Entorno y Secretos (`.env`)

La configuración local vive en `.env` (ignorado por Git). El archivo `.env.example` está versionado con valores locales seguros y marcadores vacíos:

```dotenv
DATABASE_URL=./data/tutoria.db
BACKUP_DIR=./data/backups
NEXT_TELEMETRY_DISABLED=1
PORT=3000

# Credenciales opcionales compatibles con OpenAI para generación asistida de borradores.
# Déjalas en blanco para usar el generador determinista 100% local (comportamiento por defecto).
OPTIONAL_AI_API_KEY=
OPTIONAL_AI_BASE_URL=
OPTIONAL_AI_MODEL=
```

- **Nunca subas `.env`, claves de API ni archivos `.db` al repositorio.** Tanto `.env*` (excepto `.env.example`) como `/data/` están excluidos en `.gitignore`.
- Si `OPTIONAL_AI_API_KEY` y `OPTIONAL_AI_BASE_URL` se dejan en blanco —o si un servicio externo configurado no está disponible o devuelve un error—, TutorIA recurre automáticamente al generador determinista local sin interrumpir tu flujo de trabajo.

---

## Arquitectura del Proyecto

```text
├── public/
│   ├── sw.js                         # Service Worker sin conexión (interfaz, recursos estáticos y caché de instantánea GET)
│   └── manifest.json                 # Manifiesto web local instalable (es-419)
├── scripts/
│   └── ensure-env.mjs                # Inicializador idempotente de .env y ./data/backups
├── src/
│   ├── db/
│   │   ├── schema.ts                 # Esquema SQLite con Drizzle ORM (12 tablas locales)
│   │   └── index.ts                  # Conexión better-sqlite3 en modo WAL + creación idempotente de tablas
├── src/lib/
│   │   ├── transform/
│   │   │   ├── lessonParser.ts       # Divide Markdown/texto/apuntes en unidades editables, exploradores y plan de estudio
│   │   │   └── candidateGenerator.ts # Genera borradores PENDIENTES de tarjetas y cuestionarios con respaldo local
│   │   ├── srs/
│   │   │   └── scheduler.ts          # Matemática transparente de repaso espaciado (due, again, hard, good, easy)
│   │   ├── analytics/
│   │   │   └── progress.ts           # Volumen de 6 semanas sin rachas, estabilidad de memoria y temas por reforzar
│   │   ├── language/
│   │   │   └── speechCompare.ts      # Comparación no médica de cadencia hablada, PPM, pausas y coincidencia de palabras
│   │   ├── security/
│   │   │   └── safeFilename.ts       # Saneamiento de nombres de archivo y contención contra saltos de directorio
│   │   ├── validation/
│   │   │   └── schemas.ts            # Esquemas Zod para validación de entradas y paquetes JSON
│   │   └── server/
│   │       └── studyRepository.ts    # Operaciones transaccionales del dominio sobre SQLite
├── src/app/
│   │   ├── api/                      # Rutas REST locales validadas (lessons, units, candidates, SRS, curriculum, data)
│   │   ├── globals.css               # Sistema de diseño Apple HIG (Liquid Glass, desenfoque dinámico, modo claro/oscuro)
│   │   └── page.tsx                  # Entrada principal hidratada desde el servidor
├── src/components/
│   │   ├── icons/
│   │   │   ├── SFSymbol.tsx          # Renderizador vectorial de SF Symbols de Apple con opacidad jerárquica
│   │   │   └── index.ts              # Exportaciones modulares de símbolos e interfaces
│   │   ├── ui/
│   │   │   ├── GlassCard.tsx         # Tarjeta de cristal líquido translúcido con esquinas squircle
│   │   │   ├── GlassModal.tsx        # Modal de diálogo con desenfoque dinámico de fondo (28px)
│   │   │   ├── GlassButton.tsx       # Botón háptico de cristal esmerilado con microinteracciones Apple
│   │   │   ├── GlassBadge.tsx        # Píldora translúcida con colores semánticos Apple
│   │   │   ├── GlassSegmentedControl.tsx # Control segmentado auténtico de Apple HIG
│   │   │   └── index.ts              # Exportaciones modulares del kit de componentes de cristal
│   │   ├── TutorIAWorkbench.tsx      # Cuaderno de estudio unificado con selector de modo (Auto/Claro/Oscuro)
│   │   ├── InteractiveExplorer.tsx   # Controles deslizantes de ecuaciones en vivo, gráficas SVG y puntos de control
│   │   ├── StreakFreeCharts.tsx      # Gráficas SVG de progreso sin rachas estilo Apple Health
│   │   └── LanguagePracticeStudio.tsx# Estudio de cadencia de pronunciación sin afirmaciones médicas
└── tests/
    ├── unit/                         # Pruebas unitarias de parsing, SRS, currículum PBA y seguridad (Vitest)
    └── e2e/                          # Pruebas de extremo a extremo completas en navegador Chromium (Playwright)
```

### Garantías del Ciclo Principal
1. **Unidades de aprendizaje editables:** Los encabezados de Markdown, divisores `---` o párrafos de texto plano importados se transforman en unidades individuales que puedes editar, dividir en saltos de párrafo, ampliar o eliminar.
2. **Puerta de aprobación obligatoria:** Al generar tarjetas de estudio y cuestionarios cortos, los elementos se guardan exclusivamente en `candidate_items` con `status = 'pending'`. Solo se crean filas activas en `flashcards` y `quiz_questions` cuando haces clic en **Aprobar** (después de editar el borrador si lo deseas).
3. **Repaso espaciado transparente:** Cada botón de calificación (**Otra vez**, **Difícil**, **Bien**, **Fácil**) muestra por adelantado el próximo intervalo exacto (`10m`, `12h`, `1d`, `4d`, etc.) y permite inspeccionar la fórmula de facilidad e intervalo en la interfaz.
4. **Funcionamiento sin conexión:** `public/sw.js` almacena en caché la interfaz, tipografías, recursos estáticos y la última instantánea de `/api/bootstrap`, mientras que `src/lib/client/offlineStore.ts` guarda en cola local (`localStorage`) tus repasos y sesiones cuando trabajas sin conexión y los sincroniza al reconectar.

---

## Permisos del Navegador y Alternativas ante APIs no Disponibles

| Funcionalidad | API del navegador | ¿Requiere permiso? | Alternativa si no está disponible o se rechaza |
| :--- | :--- | :--- | :--- |
| Estudio de ciencias/matemáticas, SRS, cuestionarios, apuntes y gráficas | DOM estándar + Fetch | Ninguno | Funciona en cualquier navegador moderno, con o sin conexión |
| Caché sin conexión de interfaz y recursos | `navigator.serviceWorker` + `CacheStorage` | Ninguno | Respaldo automático de instantánea y cola en `localStorage` |
| Grabación de voz en vivo para práctica de idiomas | `navigator.mediaDevices.getUserMedia` + `MediaRecorder` | **Micrófono opcional** (solo se solicita al pulsar *Grabar con micrófono*) | **Subir clip de audio** (`.wav`/`.webm`/`.mp3`) o modo **Iniciar lectura cronometrada** |
| Envolvente de onda y detección de pausas | `AudioContext` | Ninguno | El cálculo de proporción de ritmo y palabras por minuto (PPM) sigue activo |
| Coincidencia de palabras sobre transcripción hablada | `SpeechRecognition` / `webkitSpeechRecognition` | Depende del navegador | Campo manual de transcripción para comparar coincidencia de palabras localmente |
| Escucha de cadencia de referencia | `window.speechSynthesis` | Ninguno | Se oculta limpiamente y se muestra la duración objetivo y guía de PPM |

---

## Ubicación de los Datos Locales, Exportación, Respaldos, Reinicio y Eliminación

### Ubicaciones por defecto
- **Base de datos SQLite principal:** `./data/tutoria.db` (junto con los archivos WAL `tutoria.db-wal` y `tutoria.db-shm`), configurable mediante `DATABASE_URL` en `.env`.
- **Respaldos locales en disco:** `./data/backups/*.json`, configurable mediante `BACKUP_DIR` en `.env`. Todos los nombres de archivos exportados o respaldados pasan por `toSafeFilename()` y `resolveSafeChildPath()` para impedir saltos de directorio (`path traversal`).
- **Caché sin conexión en el navegador:** Claves `tutoria.offline.snapshot.v1` y `tutoria.offline.queue.v1` en `localStorage`, además de las cachés `tutoria-shell-v1` y `tutoria-data-v1` del Service Worker.

### Pasos para exportar, respaldar, restaurar, reiniciar o eliminar todos los datos
Abre la pestaña **Datos locales y respaldos** en la aplicación (o invoca directamente los endpoints locales):

1. **Exportación portátil completa:**
   - Haz clic en **Exportar paquete JSON completo** (`GET /api/data/export?format=json`) para descargar un archivo `.json` legible y validado con las 12 tablas.
   - Haz clic en **Descargar SQLite (.db)** (`GET /api/data/export?format=sqlite`) para descargar una copia binaria atómica generada con `sqlite.serialize()`.
2. **Crear y restaurar respaldos locales en disco:**
   - Escribe una etiqueta opcional y haz clic en **Crear respaldo** para guardar una instantánea JSON con marca de tiempo en `./data/backups/`.
   - Haz clic en **Restaurar** junto a cualquier respaldo de la lista —o sube cualquier archivo `.json` exportado mediante **Elegir archivo .json exportado**— para validar el esquema con Zod y restaurar todas las tablas de forma transaccional.
3. **Reiniciar solo el avance:**
   - Escribe `REINICIAR` y haz clic en **Reiniciar solo el avance** para poner en cero los intervalos SRS, registros de repaso, intentos de cuestionarios y sesiones de estudio, conservando intactas tus lecciones, unidades editables y apuntes.
4. **Eliminación permanente de todos los datos de aprendizaje:**
   - Escribe `ELIMINAR TODO` (marcando opcionalmente *Eliminar también los respaldos locales*) y haz clic en **Eliminar todos los datos de aprendizaje**. Esto borra todas las filas de todas las tablas en SQLite, ejecuta `VACUUM;` para liberar las páginas en disco y limpia `localStorage` y las cachés del Service Worker.

---

## Comandos de Prueba y Verificación

```bash
# Verificación estricta de tipos con TypeScript
npm run typecheck

# Linter con ESLint
npm run lint

# Pruebas unitarias y de integración SQLite (Vitest)
npm test

# Compilación de producción y prueba E2E del flujo principal en navegador (Playwright)
npm run build
npm run test:e2e
```
