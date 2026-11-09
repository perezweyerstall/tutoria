import { NextResponse } from 'next/server';
import {
  applyFlashcardReview,
  getWorkspaceSnapshot,
} from '@/lib/server/studyRepository';
import { handleRouteError, parseJsonBody } from '@/lib/server/apiResponse';
import { reviewFlashcardSchema } from '@/lib/validation/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const parsed = await parseJsonBody(request, reviewFlashcardSchema);
    if ('errorResponse' in parsed) return parsed.errorResponse;

    const now = parsed.data.reviewedAt ? new Date(parsed.data.reviewedAt) : new Date();
    const transition = applyFlashcardReview(id, parsed.data.action, now);

    return NextResponse.json({
      transition,
      snapshot: getWorkspaceSnapshot(),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
