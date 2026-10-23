import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTypeScript } from './load-typescript.mjs';
const core = loadTypeScript('src/app/server/youthEncryptionCore.ts');
const { databaseRequest } = loadTypeScript('src/app/server/database.ts');
const { getStudents } = loadTypeScript('src/app/server/students.ts');
test('server restores encrypted roster and progress while retaining ID, age ordering and version checks', async () => {
  const saved = { ...process.env }, fetchBefore = globalThis.fetch;
  Object.assign(process.env, { NEXT_PUBLIC_SUPABASE_URL: 'https://synthetic.invalid', SUPABASE_SERVICE_ROLE_KEY: 'synthetic', YOUTH_DATA_ENCRYPTION_REQUIRED: 'true', YOUTH_DATA_ENCRYPTION_KEYS: JSON.stringify({ active:'v1',keys:{v1:Buffer.alloc(32,1).toString('base64')} }), YOUTH_NAME_INDEX_KEY:Buffer.alloc(32,2).toString('base64') });
  const keys=core.readYouthDataKeys();
  let stored;
  globalThis.fetch = async (input, init) => {
    const url=new URL(input);
    if(url.pathname.endsWith('/Youth')) return Response.json([{id:'id-a',name:core.sealYouthText('합성 청소년','Youth.name',keys),admissionDate:core.sealYouthText('2026-01-01','Youth.admissionDate',keys),dischargeDate:null,birthDate:core.sealYouthText('2010-01-01','Youth.birthDate',keys),age:null,ageEncrypted:core.sealYouthText('16','Youth.age',keys)}]);
    if(url.pathname.endsWith('/StudentLifeHiddenYouth')) return Response.json([]);
    if(init.body) stored=JSON.parse(init.body);
    return Response.json([stored]);
  };
  try {
    const students=await getStudents();assert.equal(students[0].name,'합성 청소년');assert.equal(students[0].admissionDate,'2026-01-01');assert.equal('birthDate' in students[0],false);
    const progress={reflection:'합성 상담 메모',stars:3};
    const response=await databaseRequest('MathLearningProgress',{studentId:'eq.id-a',version:'eq.1'},{method:'PATCH',body:{progress,version:2}});
    assert.deepEqual(response,[{progress,version:2}]);assert.ok(stored.progress.$youthEncrypted);assert.doesNotMatch(JSON.stringify(stored),/합성 상담 메모/);
    stored={progress,version:2};await assert.rejects(databaseRequest('MathLearningProgress'),/암호화/);
  } finally {globalThis.fetch=fetchBefore; for(const key of Object.keys(process.env)) if(!(key in saved))delete process.env[key];Object.assign(process.env,saved);}
});
