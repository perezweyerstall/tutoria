import { NextResponse } from 'next/server';
import {
  getWorkspaceSnapshot,
  logStudySessionRecord,
} from '@/lib/server/studyRepository';
import { handleRouteError, parseJsonBody } from '@/lib/server/apiResponse';
import { createSessionSchema } from '@/lib/validation/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const parsed = await parseJsonBody(request, createSessionSchema);
    if ('errorResponse' in parsed) return parsed.errorResponse;

    const id = logStudySessionRecord(parsed.data);
    return NextResponse.json({ id, snapshot: getWorkspaceSnapshot() }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
