import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createGoalRecord,
  deleteGoalRecord,
  getWorkspaceSnapshot,
  updateGoalRecord,
} from '@/lib/server/studyRepository';
import { handleRouteError, parseJsonBody } from '@/lib/server/apiResponse';
import { createGoalSchema, updateGoalSchema } from '@/lib/validation/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const parsed = await parseJsonBody(request, createGoalSchema);
    if ('errorResponse' in parsed) return parsed.errorResponse;

    const id = createGoalRecord(parsed.data);
    return NextResponse.json({ id, snapshot: getWorkspaceSnapshot() }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const parsed = await parseJsonBody(request, updateGoalSchema);
    if ('errorResponse' in parsed) return parsed.errorResponse;

    updateGoalRecord(parsed.data);
    return NextResponse.json({ snapshot: getWorkspaceSnapshot() });
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

    deleteGoalRecord(parsed.data.id);
    return NextResponse.json({ snapshot: getWorkspaceSnapshot() });
  } catch (err) {
    return handleRouteError(err);
  }
}
