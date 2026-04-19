import { prisma } from "@/lib/db";
import { getPlayoffPlayerStats, getPlayoffTeamStats, getTeamRoster, getPlayoffTeams } from "@/lib/nhl";
import { isAdmin } from "@/lib/auth";

export const maxDuration = 60;

export async function POST() {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return runRefresh();
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  // Cron job with secret — always run
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return runRefresh();
  }

  // Public auto-refresh — only if stats are older than 5 minutes
  const latest = await prisma.playerStats.findFirst({ orderBy: { updatedAt: "desc" } });
  if (latest && Date.now() - latest.updatedAt.getTime() < 5 * 60 * 1000) {
    return Response.json({ skipped: true });
  }

  return runRefresh();
}

async function runRefresh() {
  try {
    const settings = await prisma.settings.findFirst();
    if (settings && !settings.picksLocked && settings.lockDate) {
      if (new Date() >= settings.lockDate) {
        await prisma.settings.update({ where: { id: settings.id }, data: { picksLocked: true } });
      }
    }

    const playoffTeams = await getPlayoffTeams();
    for (const team of playoffTeams) {
      await prisma.teamStats.upsert({
        where: { nhlAbbr: team.abbr },
        create: { id: team.abbr, nhlAbbr: team.abbr, name: team.name, conference: team.conference },
        update: { name: team.name, conference: team.conference },
      });
    }

    const teamResults = await getPlayoffTeamStats();
    for (const t of teamResults) {
      await prisma.teamStats.upsert({
        where: { nhlAbbr: t.abbr },
        create: { id: t.abbr, nhlAbbr: t.abbr, name: t.name, conference: t.conference, wins: t.wins, seriesWins: t.seriesWins },
        update: { wins: t.wins, seriesWins: t.seriesWins, name: t.name },
      });
    }

    const playerStats = await getPlayoffPlayerStats();
    if (playerStats.length > 0) {
      for (const p of playerStats) {
        await prisma.playerStats.upsert({
          where: { nhlId: p.nhlId },
          create: { id: p.nhlId, nhlId: p.nhlId, name: p.name, position: p.position, teamAbbr: p.teamAbbr, goals: p.goals, assists: p.assists },
          update: { goals: p.goals, assists: p.assists, name: p.name, ...(p.teamAbbr ? { teamAbbr: p.teamAbbr } : {}) },
        });
      }
    } else {
      const teams = await prisma.teamStats.findMany();
      for (const team of teams) {
        const roster = await getTeamRoster(team.nhlAbbr);
        for (const p of roster) {
          await prisma.playerStats.upsert({
            where: { nhlId: p.id },
            create: { id: p.id, nhlId: p.id, name: p.name, position: p.position, teamAbbr: p.teamAbbr, goals: 0, assists: 0 },
            update: { name: p.name, teamAbbr: p.teamAbbr },
          });
        }
      }
    }

    return Response.json({ success: true, playersUpdated: playerStats.length, teamsUpdated: teamResults.length });
  } catch (err) {
    console.error("Stats refresh error:", err);
    return Response.json({ error: "Refresh failed", detail: String(err) }, { status: 500 });
  }
}
