import { NextResponse } from 'next/server';
import {
  deleteLessonRecord,
  getWorkspaceSnapshot,
  updateLessonRecord,
} from '@/lib/server/studyRepository';
import { handleRouteError, parseJsonBody } from '@/lib/server/apiResponse';
import { updateLessonSchema } from '@/lib/validation/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const parsed = await parseJsonBody(request, updateLessonSchema);
    if ('errorResponse' in parsed) return parsed.errorResponse;

    updateLessonRecord(id, parsed.data);
    return NextResponse.json({ snapshot: getWorkspaceSnapshot() });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    deleteLessonRecord(id);
    return NextResponse.json({ snapshot: getWorkspaceSnapshot() });
  } catch (err) {
    return handleRouteError(err);
  }
}
