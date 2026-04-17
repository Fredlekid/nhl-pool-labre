import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const client = new pg.Client({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL });
await client.connect();

await client.query(`
  ALTER TABLE "TeamRequest"
  ADD COLUMN IF NOT EXISTS "deleted" BOOLEAN NOT NULL DEFAULT false;
`);

console.log("✓ Added deleted column to TeamRequest");
await client.end();
