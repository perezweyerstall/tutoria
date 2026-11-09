import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createLocalBackup,
  getWorkspaceSnapshot,
  listLocalBackups,
  restoreLocalBackupByFilename,
} from '@/lib/server/studyRepository';
import { handleRouteError, parseJsonBody } from '@/lib/server/apiResponse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const backupActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('create'),
    label: z.string().trim().max(60).optional(),
  }),
  z.object({
    action: z.literal('restore'),
    filename: z.string().trim().min(3).max(120),
  }),
]);

export async function GET() {
  try {
    return NextResponse.json({ backups: listLocalBackups() });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(request: Request) {
  try {
    const parsed = await parseJsonBody(request, backupActionSchema);
    if ('errorResponse' in parsed) return parsed.errorResponse;

    if (parsed.data.action === 'create') {
      const backup = createLocalBackup(parsed.data.label);
      return NextResponse.json(
        { backup, snapshot: getWorkspaceSnapshot() },
        { status: 201 }
      );
    }

    const restored = restoreLocalBackupByFilename(parsed.data.filename);
    return NextResponse.json({
      restored,
      snapshot: getWorkspaceSnapshot(),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
