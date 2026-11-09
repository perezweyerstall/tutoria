import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  deleteLanguageAttemptRecord,
  getWorkspaceSnapshot,
  recordLanguagePracticeAttempt,
} from '@/lib/server/studyRepository';
import { handleRouteError, parseJsonBody } from '@/lib/server/apiResponse';
import { createLanguageAttemptSchema } from '@/lib/validation/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const parsed = await parseJsonBody(request, createLanguageAttemptSchema);
    if ('errorResponse' in parsed) return parsed.errorResponse;

    const outcome = recordLanguagePracticeAttempt(parsed.data);
    return NextResponse.json(
      { outcome, snapshot: getWorkspaceSnapshot() },
      { status: 201 }
    );
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(request: Request) {
  try {
    const parsed = await parseJsonBody(
      request,
      z.object({ id: z.string().trim().min(1).max(80) })
    );
    if ('errorResponse' in parsed) return parsed.errorResponse;

    deleteLanguageAttemptRecord(parsed.data.id);
    return NextResponse.json({ snapshot: getWorkspaceSnapshot() });
  } catch (err) {
    return handleRouteError(err);
  }
}
