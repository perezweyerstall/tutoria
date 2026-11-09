import { NextResponse } from 'next/server';
import {
  bulkDecideCandidates,
  getWorkspaceSnapshot,
} from '@/lib/server/studyRepository';
import { handleRouteError, parseJsonBody } from '@/lib/server/apiResponse';
import { bulkCandidateDecisionSchema } from '@/lib/validation/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const parsed = await parseJsonBody(request, bulkCandidateDecisionSchema);
    if ('errorResponse' in parsed) return parsed.errorResponse;

    const outcome = bulkDecideCandidates(
      parsed.data.candidateIds,
      parsed.data.decision
    );
    return NextResponse.json({
      outcome,
      snapshot: getWorkspaceSnapshot(),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
