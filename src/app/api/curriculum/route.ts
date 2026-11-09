import { NextResponse } from 'next/server';
import {
  getElectromecanicaCurriculum,
  getWorkspaceSnapshot,
  seedCurriculumElectromecanicaPBA,
} from '@/lib/server/studyRepository';
import { handleRouteError } from '@/lib/server/apiResponse';
import { PBA_ELECTROMECANICA_LESSONS } from '@/lib/curriculum/electromecanicaPBA';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const curriculum = getElectromecanicaCurriculum();
    return NextResponse.json({
      curriculum,
      totalYears: curriculum.length,
      availableLessonsCount: PBA_ELECTROMECANICA_LESSONS.length,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(request: Request) {
  try {
    let overwrite = false;
    let stageCandidates = false;

    try {
      const body = await request.json();
      if (typeof body === 'object' && body !== null) {
        if ('overwrite' in body && typeof body.overwrite === 'boolean') {
          overwrite = body.overwrite;
        }
        if ('stageCandidates' in body && typeof body.stageCandidates === 'boolean') {
          stageCandidates = body.stageCandidates;
        }
      }
    } catch {
      // Body is optional
    }

    const result = await seedCurriculumElectromecanicaPBA({ overwrite, stageCandidates });
    const snapshot = getWorkspaceSnapshot();

    return NextResponse.json({
      message: `Se sincronizó el currículum de Electromecánica PBA (${result.createdCount} lecciones cargadas, ${result.skippedCount} conservadas).`,
      result,
      snapshot,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
