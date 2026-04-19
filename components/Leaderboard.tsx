"use client";

import Image from "next/image";
import { Fragment, useEffect, useState, useCallback } from "react";
import { teamLogoUrl } from "@/lib/nhl-logos";

interface TeamScore {
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

interface Player {
  nhlId: string;
  name: string;
  position: string;
  teamAbbr: string;
  goals: number;
  assists: number;
}

interface Team {
  nhlAbbr: string;
  name: string;
  conference: string;
  wins: number;
  seriesWins: number;
  eliminated: boolean;
}

function TeamLogo({ abbr, size = 28 }: { abbr: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const pad = Math.round(size * 0.2);
  const outer = size + pad * 2;

  if (failed || !abbr) return null;

  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-slate-800 shrink-0"
      style={{ width: outer, height: outer }}
    >
      <Image
        src={teamLogoUrl(abbr)}
        alt={abbr}
        width={size}
        height={size}
        className="object-contain"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

export default function Leaderboard() {
  const [scores, setScores] = useState<TeamScore[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [scoresRes, playersRes, teamsRes] = await Promise.all([
      fetch("/api/leaderboard", { cache: "no-store" }),
      fetch("/api/players"),
      fetch("/api/teams"),
    ]);
    setScores(await scoresRes.json());
    setPlayers(await playersRes.json());
    setTeams(await teamsRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    // Trigger a stats refresh in the background (rate-limited server-side to 5 min)
    fetch("/api/stats/refresh").catch(() => {});
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const playerMap = new Map(players.map((p) => [p.nhlId, p]));
  const teamMap = new Map(teams.map((t) => [t.nhlAbbr, t]));

  if (loading) {
    return (
      <div className="text-center py-24 text-slate-400">
        <div className="text-5xl mb-4">🏒</div>
        <p className="text-lg font-medium">Loading standings...</p>
      </div>
    );
  }

  if (scores.length === 0) {
    return (
      <div className="text-center py-24 text-slate-400">
        <div className="text-5xl mb-4">🏒</div>
        <p className="text-lg font-semibold text-slate-700 mb-1">No teams yet!</p>
        <p className="text-sm">Be the first to submit your picks.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-100 text-slate-500 text-xs uppercase tracking-wide font-semibold">
            <th className="px-5 py-3 text-left w-10">#</th>
            <th className="px-5 py-3 text-left">Participant</th>
            <th className="px-4 py-3 text-right hidden sm:table-cell">Players</th>
            <th className="px-4 py-3 text-right hidden sm:table-cell">Teams</th>
            <th className="px-5 py-3 text-right text-slate-700">Total</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((score, i) => {
            const isOpen = openId === score.id;
            return (
              <Fragment key={score.id}>
                <tr
                  className={`border-t border-slate-200 cursor-pointer transition-colors ${isOpen ? "bg-blue-50" : "hover:bg-blue-50"}`}
                  onClick={() => setOpenId(isOpen ? null : score.id)}
                >
                  <td className="px-5 py-4 font-bold w-10 text-base">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <span className="text-slate-500 font-semibold text-sm">{i + 1}</span>}
                  </td>
                  <td className="px-5 py-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      {score.displayName}
                      <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right text-slate-600 font-medium hidden sm:table-cell">{score.playerPoints}</td>
                  <td className="px-4 py-4 text-right text-slate-600 font-medium hidden sm:table-cell">{score.teamPoints}</td>
                  <td className="px-5 py-4 text-right">
                    <span className="font-black text-blue-700 text-lg">{score.totalPoints}</span>
                    <span className="text-slate-400 text-xs ml-1">pts</span>
                  </td>
                </tr>

                {isOpen && (
                  <tr className="border-t border-blue-100">
                    <td colSpan={5} className="px-0 py-0">
                      <div className="bg-slate-50 divide-y divide-slate-100">

                        {/* Conference teams */}
                        <div className="px-5 py-4">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Conference Teams</p>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { abbr: score.picks.eastTeam, label: "Eastern" },
                              { abbr: score.picks.westTeam, label: "Western" },
                            ].map(({ abbr, label }) => {
                              const stats = teamMap.get(abbr);
                              const pts = stats ? stats.wins + stats.seriesWins : 0;
                              return (
                                <div key={abbr} className={`rounded-xl p-3 flex items-center gap-3 border ${stats?.eliminated ? "bg-red-50 border-red-200" : "bg-white border-slate-200"}`}>
                                  <TeamLogo abbr={abbr} size={32} />
                                  <div className="min-w-0">
                                    <p className="text-xs text-slate-500 font-medium">{label}</p>
                                    <p className={`font-bold text-sm truncate ${stats?.eliminated ? "text-red-600" : "text-slate-900"}`}>
                                      {stats?.name || abbr}
                                      {stats?.eliminated && <span className="ml-1 text-xs font-normal text-red-500">· out</span>}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                      {stats?.wins ?? 0}W · {stats?.seriesWins ?? 0} series ·{" "}
                                      <span className="font-bold text-blue-700">{pts} pts</span>
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Forwards */}
                        <PlayerGroup label="Forwards" ids={score.picks.forwards} playerMap={playerMap} teamMap={teamMap} />

                        {/* Defensemen */}
                        <PlayerGroup label="Defensemen" ids={score.picks.defensemen} playerMap={playerMap} teamMap={teamMap} />

                        {/* Total */}
                        <div className="px-5 py-3 bg-white flex justify-between items-center">
                          <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Total Points</span>
                          <span className="font-black text-blue-700 text-xl">{score.totalPoints}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PlayerGroup({ label, ids, playerMap, teamMap }: {
  label: string;
  ids: string[];
  playerMap: Map<string, Player>;
  teamMap: Map<string, Team>;
}) {
  const totalPts = ids.reduce((sum, id) => {
    const p = playerMap.get(id);
    return sum + (p ? p.goals + p.assists : 0);
  }, 0);

  return (
    <div className="px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</p>
        <span className="text-xs font-bold text-blue-700">{totalPts} pts</span>
      </div>
      <div className="space-y-1.5">
        {ids.map((id) => {
          const p = playerMap.get(id);
          const team = p ? teamMap.get(p.teamAbbr) : undefined;
          const pts = p ? p.goals + p.assists : 0;
          const eliminated = team?.eliminated ?? false;

          return (
            <div
              key={id}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${eliminated ? "bg-red-50 border border-red-200" : "bg-white border border-slate-200"}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {p?.teamAbbr && <TeamLogo abbr={p.teamAbbr} size={20} />}
                <span className={`font-semibold truncate ${eliminated ? "text-red-700" : "text-slate-900"}`}>
                  {p?.name || id}
                </span>
                {eliminated && <span className="text-xs text-red-500 shrink-0 font-medium">· eliminated</span>}
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-2">
                <span className="text-xs text-slate-500 tabular-nums hidden sm:block font-medium">
                  {p?.goals ?? 0}G · {p?.assists ?? 0}A
                </span>
                <span className={`text-xs font-bold tabular-nums w-10 text-right ${pts > 0 ? "text-blue-700" : "text-slate-300"}`}>
                  {pts} pts
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
