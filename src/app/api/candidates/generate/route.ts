import { NextResponse } from 'next/server';
import {
  getWorkspaceSnapshot,
  stageCandidateItemsForLesson,
} from '@/lib/server/studyRepository';
import { handleRouteError, parseJsonBody } from '@/lib/server/apiResponse';
import { generateCandidatesSchema } from '@/lib/validation/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const parsed = await parseJsonBody(request, generateCandidatesSchema);
    if ('errorResponse' in parsed) return parsed.errorResponse;

    const result = await stageCandidateItemsForLesson(
      parsed.data.lessonId,
      parsed.data.unitId
    );
    return NextResponse.json({
      ...result,
      snapshot: getWorkspaceSnapshot(),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
