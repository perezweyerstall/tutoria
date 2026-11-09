import { NextResponse } from 'next/server';
import { z } from 'zod';
import { formatZodError } from '@/lib/validation/schemas';

export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ data: T } | { errorResponse: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      errorResponse: NextResponse.json(
        {
          error: 'El cuerpo JSON enviado tiene un formato inválido. Revisa los datos e inténtalo de nuevo.',
          issues: [],
        },
        { status: 400 }
      ),
    };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const formatted = formatZodError(parsed.error);
    return {
      errorResponse: NextResponse.json(
        {
          error: formatted.message,
          issues: formatted.issues,
        },
        { status: 400 }
      ),
    };
  }

  return { data: parsed.data };
}

export function handleRouteError(err: unknown): NextResponse {
  if (err instanceof z.ZodError) {
    const formatted = formatZodError(err);
    return NextResponse.json(
      { error: formatted.message, issues: formatted.issues },
      { status: 400 }
    );
  }
  const message =
    err instanceof Error ? err.message : 'Ocurrió un error inesperado en el servidor local.';
  const status = /no se encontr[oó]|not found/i.test(message)
    ? 404
    : /unsafe|inseguro|inv[aá]lido|agrega una l[ií]nea en blanco|agrega al menos una/i.test(message)
      ? 400
      : 500;
  return NextResponse.json({ error: message }, { status });
}
