import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createNoteRecord,
  deleteNoteRecord,
  getWorkspaceSnapshot,
  updateNoteRecord,
} from '@/lib/server/studyRepository';
import { handleRouteError, parseJsonBody } from '@/lib/server/apiResponse';
import { createNoteSchema, updateNoteSchema } from '@/lib/validation/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const parsed = await parseJsonBody(request, createNoteSchema);
    if ('errorResponse' in parsed) return parsed.errorResponse;

    const id = createNoteRecord(parsed.data);
    return NextResponse.json({ id, snapshot: getWorkspaceSnapshot() }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const parsed = await parseJsonBody(request, updateNoteSchema);
    if ('errorResponse' in parsed) return parsed.errorResponse;

    updateNoteRecord(parsed.data);
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

    deleteNoteRecord(parsed.data.id);
    return NextResponse.json({ snapshot: getWorkspaceSnapshot() });
  } catch (err) {
    return handleRouteError(err);
  }
}
