const NHL_API = "https://api-web.nhle.com/v1";
const NHL_STATS_API = "https://api.nhle.com/stats/rest/en";
const SEASON = "20252026";
const PLAYOFF_YEAR = "2026";

export interface NHLPlayer {
  id: string;
  name: string;
  position: string;
  teamAbbr: string;
}

export interface NHLTeam {
  abbr: string;
  name: string;
  conference: string;
}

export interface PlayoffTeamResult {
  abbr: string;
  name: string;
  conference: string;
  wins: number;
  seriesWins: number;
}

export interface PlayerStatsResult {
  nhlId: string;
  name: string;
  position: string;
  teamAbbr: string;
  goals: number;
  assists: number;
}

async function fetchJSON(url: string) {
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`NHL API error: ${res.status} ${url}`);
  return res.json();
}

// Series letters A-D = Eastern, E-H = Western
function conferenceFromLetter(letter: string): string {
  return ["A", "B", "C", "D"].includes(letter.toUpperCase()) ? "Eastern" : "Western";
}

export async function getPlayoffTeams(): Promise<NHLTeam[]> {
  try {
    const data = await fetchJSON(`${NHL_API}/playoff-bracket/${PLAYOFF_YEAR}`);
    const series = data.series || [];
    const teams: NHLTeam[] = [];
    const seen = new Set<string>();

    for (const s of series) {
      const conf = conferenceFromLetter(s.seriesLetter || "E");
      for (const side of ["topSeedTeam", "bottomSeedTeam"] as const) {
        const t = s[side];
        if (t?.abbrev && !seen.has(t.abbrev)) {
          seen.add(t.abbrev);
          teams.push({
            abbr: t.abbrev,
            name: t.name?.default || t.abbrev,
            conference: conf,
          });
        }
      }
    }

    return teams.length > 0 ? teams : getFallbackTeams();
  } catch {
    return getFallbackTeams();
  }
}

export async function getPlayoffTeamStats(): Promise<PlayoffTeamResult[]> {
  try {
    const data = await fetchJSON(`${NHL_API}/playoff-bracket/${PLAYOFF_YEAR}`);
    const series = data.series || [];
    const results = new Map<string, PlayoffTeamResult>();

    for (const s of series) {
      const conf = conferenceFromLetter(s.seriesLetter || "E");
      const seriesOver = Math.max(s.topSeedWins ?? 0, s.bottomSeedWins ?? 0) >= 4;

      for (const [side, winsKey] of [
        ["topSeedTeam", "topSeedWins"],
        ["bottomSeedTeam", "bottomSeedWins"],
      ] as const) {
        const t = s[side];
        if (!t?.abbrev) continue;

        const wins = s[winsKey] ?? 0;
        const seriesWon = seriesOver && wins >= 4 ? 1 : 0;

        const existing = results.get(t.abbrev);
        if (!existing) {
          results.set(t.abbrev, {
            abbr: t.abbrev,
            name: t.name?.default || t.abbrev,
            conference: conf,
            wins,
            seriesWins: seriesWon,
          });
        } else {
          existing.wins += wins;
          existing.seriesWins += seriesWon;
        }
      }
    }

    return [...results.values()];
  } catch {
    return [];
  }
}

export async function getPlayoffPlayerStats(): Promise<PlayerStatsResult[]> {
  try {
    const url =
      `${NHL_STATS_API}/skater/summary?isAggregate=true&isGame=false` +
      `&sort=[{"property":"points","direction":"DESC"}]` +
      `&start=0&limit=1000` +
      `&factCayenneExp=gamesPlayed>=1` +
      `&cayenneExp=gameTypeId=3 and seasonId<=${SEASON} and seasonId>=${SEASON}`;

    const data = await fetchJSON(url);
    const rows = data.data || [];
    if (rows.length === 0) return [];

    return rows.map((r: Record<string, unknown>) => ({
      nhlId: String(r.playerId),
      name: String(r.skaterFullName || r.lastName || ""),
      position: normalizePosition(String(r.positionCode || "")),
      teamAbbr: String(r.teamAbbrevs || ""),
      goals: Number(r.goals || 0),
      assists: Number(r.assists || 0),
    }));
  } catch {
    return [];
  }
}

export async function getTeamRoster(teamAbbr: string): Promise<NHLPlayer[]> {
  try {
    const data = await fetchJSON(`${NHL_API}/roster/${teamAbbr}/${SEASON}`);
    const players: NHLPlayer[] = [];

    for (const group of ["forwards", "defensemen"] as const) {
      for (const p of data[group] || []) {
        players.push({
          id: String(p.id),
          name: `${p.firstName?.default || ""} ${p.lastName?.default || ""}`.trim(),
          position: group === "forwards" ? "F" : "D",
          teamAbbr,
        });
      }
    }

    return players;
  } catch {
    return [];
  }
}

function normalizePosition(pos: string): string {
  if (["C", "LW", "RW", "W", "F"].includes(pos.toUpperCase())) return "F";
  if (pos.toUpperCase() === "D") return "D";
  return pos;
}

function getFallbackTeams(): NHLTeam[] {
  return [
    // Eastern Conference — 2026 playoffs
    { abbr: "BUF", name: "Buffalo Sabres", conference: "Eastern" },
    { abbr: "BOS", name: "Boston Bruins", conference: "Eastern" },
    { abbr: "TBL", name: "Tampa Bay Lightning", conference: "Eastern" },
    { abbr: "MTL", name: "Montréal Canadiens", conference: "Eastern" },
    { abbr: "CAR", name: "Carolina Hurricanes", conference: "Eastern" },
    { abbr: "OTT", name: "Ottawa Senators", conference: "Eastern" },
    { abbr: "PIT", name: "Pittsburgh Penguins", conference: "Eastern" },
    { abbr: "PHI", name: "Philadelphia Flyers", conference: "Eastern" },
    // Western Conference — 2026 playoffs
    { abbr: "COL", name: "Colorado Avalanche", conference: "Western" },
    { abbr: "LAK", name: "Los Angeles Kings", conference: "Western" },
    { abbr: "DAL", name: "Dallas Stars", conference: "Western" },
    { abbr: "MIN", name: "Minnesota Wild", conference: "Western" },
    { abbr: "VGK", name: "Vegas Golden Knights", conference: "Western" },
    { abbr: "UTA", name: "Utah Mammoth", conference: "Western" },
    { abbr: "EDM", name: "Edmonton Oilers", conference: "Western" },
    { abbr: "ANA", name: "Anaheim Ducks", conference: "Western" },
  ];
}
