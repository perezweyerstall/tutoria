import { NextResponse } from 'next/server';
import { getWorkspaceSnapshot } from '@/lib/server/studyRepository';
import { handleRouteError } from '@/lib/server/apiResponse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshot = getWorkspaceSnapshot();
    return NextResponse.json(snapshot);
  } catch (err) {
    return handleRouteError(err);
  }
}
