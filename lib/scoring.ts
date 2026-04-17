import { prisma } from "./db";
import type { PlayerStats, TeamStats } from "@/app/generated/prisma/client";

export interface TeamScore {
  id: string;
  displayName: string;
  totalPoints: number;
  playerPoints: number;
  teamPoints: number;
  picks: {
    forwards: string[];
    defensemen: string[];
    eastTeam: string;
    westTeam: string;
  };
}

export async function computeLeaderboard(): Promise<TeamScore[]> {
  const [requests, playerStats, teamStats] = await Promise.all([
    prisma.teamRequest.findMany({ where: { status: "approved" } }),
    prisma.playerStats.findMany(),
    prisma.teamStats.findMany(),
  ]);

  const playerMap = new Map<string, PlayerStats>(playerStats.map((p) => [p.nhlId, p]));
  const teamMap = new Map<string, TeamStats>(teamStats.map((t) => [t.nhlAbbr, t]));

  const scores: TeamScore[] = requests.map((req) => {
    const allPlayerIds = [...req.forwards, ...req.defensemen];
    let playerPoints = 0;

    for (const nhlId of allPlayerIds) {
      const stats = playerMap.get(nhlId);
      if (stats) playerPoints += stats.goals + stats.assists;
    }

    let teamPoints = 0;
    for (const teamAbbr of [req.eastTeam, req.westTeam]) {
      const stats = teamMap.get(teamAbbr);
      if (stats) teamPoints += stats.wins + stats.seriesWins;
    }

    return {
      id: req.id,
      displayName: `${req.firstName} ${req.lastName}`,
      totalPoints: playerPoints + teamPoints,
      playerPoints,
      teamPoints,
      picks: {
        forwards: req.forwards,
        defensemen: req.defensemen,
        eastTeam: req.eastTeam,
        westTeam: req.westTeam,
      },
    };
  });

  return scores.sort((a, b) => b.totalPoints - a.totalPoints);
}
