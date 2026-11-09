import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { exportAllDataBundle } from '@/lib/server/studyRepository';
import { handleRouteError } from '@/lib/server/apiResponse';
import { toSafeFilename } from '@/lib/security/safeFilename';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const format = url.searchParams.get('format') === 'sqlite' ? 'sqlite' : 'json';
    const datePart = new Date().toISOString().slice(0, 10);

    if (format === 'sqlite') {
      const { sqlite } = getDb();
      const buffer = sqlite.serialize();
      const filename = toSafeFilename(`tutoria-sqlite-${datePart}`, {
        extension: 'db',
        maxLength: 64,
      });

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    const bundle = exportAllDataBundle();
    const filename = toSafeFilename(`tutoria-export-${datePart}`, {
      extension: 'json',
      maxLength: 64,
    });

    return new NextResponse(JSON.stringify(bundle, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
