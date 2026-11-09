#!/usr/bin/env bash
set -euo pipefail

if [ ! -d "node_modules" ]; then
  echo "[tutoria] Instalando dependencias locales..."
  npm install
fi

node scripts/ensure-env.mjs

echo "[tutoria] Iniciando tu espacio de estudio local en http://localhost:${PORT:-3000} ..."
NEXT_TELEMETRY_DISABLED=1 exec npm run dev
