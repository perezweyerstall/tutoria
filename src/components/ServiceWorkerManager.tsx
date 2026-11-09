'use client';

import { useEffect, useState } from 'react';

export interface SwStatus {
  supported: boolean;
  ready: boolean;
  message: string;
}

export function useServiceWorkerStatus(): SwStatus {
  const [status, setStatus] = useState<SwStatus>({
    supported: true,
    ready: false,
    message: 'Verificando Service Worker sin conexión…',
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      setStatus({
        supported: false,
        ready: false,
        message: 'Service Worker no disponible en este contexto de navegador; la caché local sigue activa.',
      });
      return;
    }

    let cancelled = false;
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        if (cancelled) return;
        setStatus({
          supported: true,
          ready: Boolean(reg.active || reg.installing || reg.waiting),
          message: 'Service Worker sin conexión activo',
        });
      })
      .catch(() => {
        if (cancelled) return;
        setStatus({
          supported: false,
          ready: false,
          message: 'Registro de Service Worker omitido; respaldo en almacenamiento local activo.',
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
