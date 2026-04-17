import { readFileSync } from "fs";
import { Pool } from "pg";

const env = readFileSync(".env", "utf8");
for (const line of env.split("\n")) {
  const match = line.match(/^([^#=]+)=["']?(.+?)["']?\s*$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const pool = new Pool({ connectionString: process.env.DIRECT_URL });

const sql = `
DROP TABLE IF EXISTS "Pick" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

CREATE TABLE IF NOT EXISTS "TeamRequest" (
  "id"         TEXT PRIMARY KEY,
  "firstName"  TEXT NOT NULL,
  "lastName"   TEXT NOT NULL,
  "email"      TEXT UNIQUE NOT NULL,
  "forwards"   TEXT[] NOT NULL,
  "defensemen" TEXT[] NOT NULL,
  "eastTeam"   TEXT NOT NULL,
  "westTeam"   TEXT NOT NULL,
  "status"     TEXT NOT NULL DEFAULT 'pending',
  "createdAt"  TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "PlayerStats" (
  "id"        TEXT PRIMARY KEY,
  "nhlId"     TEXT UNIQUE NOT NULL,
  "name"      TEXT NOT NULL,
  "position"  TEXT NOT NULL,
  "teamAbbr"  TEXT NOT NULL,
  "goals"     INT NOT NULL DEFAULT 0,
  "assists"   INT NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "TeamStats" (
  "id"         TEXT PRIMARY KEY,
  "nhlAbbr"    TEXT UNIQUE NOT NULL,
  "name"       TEXT NOT NULL,
  "conference" TEXT NOT NULL,
  "wins"       INT NOT NULL DEFAULT 0,
  "seriesWins" INT NOT NULL DEFAULT 0,
  "eliminated" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt"  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Settings" (
  "id"          TEXT PRIMARY KEY,
  "picksLocked" BOOLEAN NOT NULL DEFAULT false,
  "lockDate"    TIMESTAMP,
  "updatedAt"   TIMESTAMP NOT NULL DEFAULT NOW()
);
`;

try {
  await pool.query(sql);
  console.log("✓ Database tables ready.");
} catch (e) {
  console.error("Error:", e.message);
  process.exit(1);
} finally {
  await pool.end();
}
