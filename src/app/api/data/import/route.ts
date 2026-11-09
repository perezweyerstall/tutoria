import { NextResponse } from 'next/server';
import {
  getWorkspaceSnapshot,
  importDataBundle,
} from '@/lib/server/studyRepository';
import { handleRouteError, parseJsonBody } from '@/lib/server/apiResponse';
import { exportBundleSchema } from '@/lib/validation/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const parsed = await parseJsonBody(request, exportBundleSchema);
    if ('errorResponse' in parsed) return parsed.errorResponse;

    const restored = importDataBundle(parsed.data);
    return NextResponse.json({
      restored,
      snapshot: getWorkspaceSnapshot(),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
