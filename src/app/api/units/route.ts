import { NextResponse } from 'next/server';
import {
  createLearningUnit,
  getWorkspaceSnapshot,
} from '@/lib/server/studyRepository';
import { handleRouteError, parseJsonBody } from '@/lib/server/apiResponse';
import { createUnitSchema } from '@/lib/validation/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const parsed = await parseJsonBody(request, createUnitSchema);
    if ('errorResponse' in parsed) return parsed.errorResponse;

    const unitId = createLearningUnit(parsed.data);
    return NextResponse.json(
      { unitId, snapshot: getWorkspaceSnapshot() },
      { status: 201 }
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
