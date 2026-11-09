import { NextResponse } from 'next/server';
import {
  decideCandidateItem,
  getWorkspaceSnapshot,
} from '@/lib/server/studyRepository';
import { handleRouteError, parseJsonBody } from '@/lib/server/apiResponse';
import { candidateDecisionSchema } from '@/lib/validation/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const parsed = await parseJsonBody(request, candidateDecisionSchema);
    if ('errorResponse' in parsed) return parsed.errorResponse;

    const outcome = decideCandidateItem(id, parsed.data);
    return NextResponse.json({
      outcome,
      snapshot: getWorkspaceSnapshot(),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
