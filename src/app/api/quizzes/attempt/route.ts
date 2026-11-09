import { NextResponse } from 'next/server';
import {
  getWorkspaceSnapshot,
  submitQuizAttempt,
} from '@/lib/server/studyRepository';
import { handleRouteError, parseJsonBody } from '@/lib/server/apiResponse';
import { quizAttemptSchema } from '@/lib/validation/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const parsed = await parseJsonBody(request, quizAttemptSchema);
    if ('errorResponse' in parsed) return parsed.errorResponse;

    const result = submitQuizAttempt(
      parsed.data.questionId,
      parsed.data.submittedAnswer
    );
    return NextResponse.json({
      result,
      snapshot: getWorkspaceSnapshot(),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
