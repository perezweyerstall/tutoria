import { NextResponse } from 'next/server';
import {
  getWorkspaceSnapshot,
  importLessonAndBuildPlan,
} from '@/lib/server/studyRepository';
import { handleRouteError, parseJsonBody } from '@/lib/server/apiResponse';
import { importLessonSchema } from '@/lib/validation/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshot = getWorkspaceSnapshot();
    return NextResponse.json({ lessons: snapshot.lessons });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(request: Request) {
  try {
    const parsed = await parseJsonBody(request, importLessonSchema);
    if ('errorResponse' in parsed) return parsed.errorResponse;

    const created = importLessonAndBuildPlan(parsed.data);
    const snapshot = getWorkspaceSnapshot();
    return NextResponse.json({ created, snapshot }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
