import { seedCurriculumElectromecanicaPBA } from '../src/lib/server/studyRepository';
import { closeDbConnection } from '../src/db';

async function main() {
  console.log('Sincronizando el Diseño Curricular de Electromecánica PBA (1° a 7° Año) en SQLite local...');
  const result = await seedCurriculumElectromecanicaPBA({ overwrite: true, stageCandidates: true });
  console.log('Sincronización completada con éxito:', result);
  closeDbConnection();
}

main().catch((err) => {
  console.error('Error durante la sincronización del currículum:', err);
  process.exit(1);
});
