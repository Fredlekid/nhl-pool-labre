import { readFileSync } from "fs";

const env = readFileSync(".env", "utf8");
for (const line of env.split("\n")) {
  const match = line.match(/^([^#=]+)=["']?(.+?)["']?\s*$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DIRECT_URL });

const NHL_API = "https://api-web.nhle.com/v1";
const SEASON = "20252026";

const TEAMS = [
  { abbr: "BUF", name: "Buffalo Sabres",        conference: "Eastern" },
  { abbr: "BOS", name: "Boston Bruins",          conference: "Eastern" },
  { abbr: "TBL", name: "Tampa Bay Lightning",    conference: "Eastern" },
  { abbr: "MTL", name: "Montréal Canadiens",     conference: "Eastern" },
  { abbr: "CAR", name: "Carolina Hurricanes",    conference: "Eastern" },
  { abbr: "OTT", name: "Ottawa Senators",        conference: "Eastern" },
  { abbr: "PIT", name: "Pittsburgh Penguins",    conference: "Eastern" },
  { abbr: "PHI", name: "Philadelphia Flyers",    conference: "Eastern" },
  { abbr: "COL", name: "Colorado Avalanche",     conference: "Western" },
  { abbr: "LAK", name: "Los Angeles Kings",      conference: "Western" },
  { abbr: "DAL", name: "Dallas Stars",           conference: "Western" },
  { abbr: "MIN", name: "Minnesota Wild",         conference: "Western" },
  { abbr: "VGK", name: "Vegas Golden Knights",   conference: "Western" },
  { abbr: "UTA", name: "Utah Mammoth",           conference: "Western" },
  { abbr: "EDM", name: "Edmonton Oilers",        conference: "Western" },
  { abbr: "ANA", name: "Anaheim Ducks",          conference: "Western" },
];

async function upsertTeam(abbr, name, conference) {
  await pool.query(
    `INSERT INTO "TeamStats" ("id","nhlAbbr","name","conference","wins","seriesWins","eliminated","updatedAt")
     VALUES ($1,$2,$3,$4,0,0,false,NOW())
     ON CONFLICT ("nhlAbbr") DO UPDATE SET "name"=$3,"conference"=$4,"updatedAt"=NOW()`,
    [abbr, abbr, name, conference]
  );
}

async function upsertPlayer(id, name, position, teamAbbr) {
  await pool.query(
    `INSERT INTO "PlayerStats" ("id","nhlId","name","position","teamAbbr","goals","assists","updatedAt")
     VALUES ($1,$2,$3,$4,$5,0,0,NOW())
     ON CONFLICT ("nhlId") DO UPDATE SET "name"=$3,"position"=$4,"teamAbbr"=$5,"updatedAt"=NOW()`,
    [id, id, name, position, teamAbbr]
  );
}

let totalPlayers = 0;

for (const team of TEAMS) {
  process.stdout.write(`Loading ${team.abbr}... `);
  await upsertTeam(team.abbr, team.name, team.conference);

  try {
    const res = await fetch(`${NHL_API}/roster/${team.abbr}/${SEASON}`);
    const data = await res.json();

    let count = 0;
    for (const group of ["forwards", "defensemen"]) {
      const position = group === "forwards" ? "F" : "D";
      for (const p of data[group] || []) {
        const name = `${p.firstName?.default || ""} ${p.lastName?.default || ""}`.trim();
        await upsertPlayer(String(p.id), name, position, team.abbr);
        count++;
      }
    }

    totalPlayers += count;
    console.log(`${count} players`);
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
  }
}

console.log(`\n✓ Done. ${TEAMS.length} teams, ${totalPlayers} players total.`);
await pool.end();
