import { NextResponse } from 'next/server';
import {
  getWorkspaceSnapshot,
  resetOrDeleteAllData,
} from '@/lib/server/studyRepository';
import { handleRouteError, parseJsonBody } from '@/lib/server/apiResponse';
import { resetDataSchema } from '@/lib/validation/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const parsed = await parseJsonBody(request, resetDataSchema);
    if ('errorResponse' in parsed) return parsed.errorResponse;

    if (
      parsed.data.mode === 'progress-only' &&
      parsed.data.confirmationText !== 'REINICIAR' &&
      parsed.data.confirmationText !== 'RESET'
    ) {
      return NextResponse.json(
        { error: 'Escribe REINICIAR para confirmar el reinicio del progreso de estudio.' },
        { status: 400 }
      );
    }

    if (
      parsed.data.mode === 'delete-all' &&
      parsed.data.confirmationText !== 'ELIMINAR TODO' &&
      parsed.data.confirmationText !== 'DELETE ALL'
    ) {
      return NextResponse.json(
        {
          error:
            'Escribe ELIMINAR TODO para confirmar el borrado permanente de todos tus datos de aprendizaje.',
        },
        { status: 400 }
      );
    }

    const result = resetOrDeleteAllData(
      parsed.data.mode,
      parsed.data.removeBackups
    );
    return NextResponse.json({
      result,
      snapshot: getWorkspaceSnapshot(),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
