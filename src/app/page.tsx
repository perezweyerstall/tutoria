import { getWorkspaceSnapshot } from '@/lib/server/studyRepository';
import { TutorIAWorkbench } from '@/components/TutorIAWorkbench';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const initialSnapshot = getWorkspaceSnapshot();
  return <TutorIAWorkbench initialSnapshot={initialSnapshot} />;
}
