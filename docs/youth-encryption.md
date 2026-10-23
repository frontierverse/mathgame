# Shared youth encryption

This app reads the same encrypted youth records as the staff work system.
The compatible AES-256-GCM envelope implementation lives in `src/app/server/youthEncryptionCore.ts`.
Keys stay in server-only environment variables. Never prefix these keys with `NEXT_PUBLIC_`:

- `YOUTH_DATA_ENCRYPTION_KEYS`: same versioned key ring as the staff service.
- `YOUTH_NAME_INDEX_KEY`: same independent index key (required to validate the shared configuration).
- `YOUTH_DATA_ENCRYPTION_REQUIRED=true`
- `YOUTH_DATA_ENCRYPTION_MIGRATING=false` after a verified conversion.

`server/students.ts` decrypts names and admission/discharge dates only on the server. Age/birth date is used only for the existing sort order and is not included in student responses. Hidden-student rules and student IDs are preserved.
`server/database.ts` encrypts/decrypts `MathLearningProgress.progress`. Version matching and the ID-based learning relationship remain unchanged.

Production conversion must be coordinated with the staff service: verify backups, build both services, stop old writers, apply the schema migration, convert youth and shared records, verify all original values/relationships, switch both verified deployments, then resume writes. A plaintext progress row in strict mode fails closed. Do not point the old app at the converted database.

The historical Quiz tables are not used by this production source. Their name copies are handled by `encrypt-shared-youth-data.ts` in the staff repository. That command preserves record counts, values and shared name-key relationships and can reject subsequent plaintext writes. Retire old name-based deployments/RPC callers rather than allowing them to write new plaintext copies.

Local synthetic tests, type checking, lint and a Webpack production build were run. No production keys, database writes or deployments were performed by this implementation task.
