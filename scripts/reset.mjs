import { rmSync } from "node:fs";
// Stop the development server first. This resets only the mock database.
const path = process.env.DATABASE_PATH || "./data/support.sqlite";
for (const suffix of ["", "-wal", "-shm"])
  rmSync(path + suffix, { force: true });
console.log("Mock CRM will be seeded on the next server start.");
