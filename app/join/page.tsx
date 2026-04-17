"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { teamLogoUrl } from "@/lib/nhl-logos";

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
}

type Step = "info" | "picks" | "done";

export default function JoinPage() {
  const [step, setStep] = useState<Step>("info");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [closed, setClosed] = useState(false);

  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const [selectedForwards, setSelectedForwards] = useState<string[]>([]);
  const [selectedDefensemen, setSelectedDefensemen] = useState<string[]>([]);
  const [eastTeam, setEastTeam] = useState("");
  const [westTeam, setWestTeam] = useState("");

  const [fSearch, setFSearch] = useState("");
  const [dSearch, setDSearch] = useState("");

  const loadData = useCallback(async () => {
    const [playersRes, teamsRes, settingsRes] = await Promise.all([
      fetch("/api/players"),
      fetch("/api/teams"),
      fetch("/api/admin/lock").catch(() => null),
    ]);

    setPlayers(await playersRes.json());
    setTeams(await teamsRes.json());

    if (settingsRes?.ok) {
      const settings = await settingsRes.json();
      if (settings?.picksLocked) setClosed(true);
    }

    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function togglePlayer(id: string, position: "F" | "D") {
    if (position === "F") {
      setSelectedForwards((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 10 ? [...prev, id] : prev
      );
    } else {
      setSelectedDefensemen((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 6 ? [...prev, id] : prev
      );
    }
  }

  function infoValid() {
    return firstName.trim().length >= 1 && lastName.trim().length >= 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  const picksComplete =
    selectedForwards.length === 10 &&
    selectedDefensemen.length === 6 &&
    eastTeam !== "" &&
    westTeam !== "";

  async function submit() {
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, forwards: selectedForwards, defensemen: selectedDefensemen, eastTeam, westTeam }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) { setError(data.error || "Submission failed."); return; }
    setStep("done");
  }

  const forwards = players.filter((p) => p.position === "F");
  const defensemen = players.filter((p) => p.position === "D");
  const eastTeams = teams.filter((t) => t.conference === "Eastern");
  const westTeams = teams.filter((t) => t.conference === "Western");

  const filteredF = forwards.filter(
    (p) => p.name.toLowerCase().includes(fSearch.toLowerCase()) || p.teamAbbr.toLowerCase().includes(fSearch.toLowerCase())
  );
  const filteredD = defensemen.filter(
    (p) => p.name.toLowerCase().includes(dSearch.toLowerCase()) || p.teamAbbr.toLowerCase().includes(dSearch.toLowerCase())
  );

  if (loading) return (
    <div className="text-center py-20 text-slate-400">
      <div className="text-4xl mb-3">🏒</div>
      <p>Loading...</p>
    </div>
  );

  if (closed) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Submissions Closed</h1>
        <p className="text-slate-500">The playoffs have started. No more picks accepted.</p>
        <Link href="/" className="mt-6 inline-block text-blue-700 hover:underline">View Leaderboard →</Link>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Request Submitted!</h1>
        <p className="text-slate-500 mb-2">
          Thanks <strong className="text-slate-800">{firstName}</strong>! Your picks are pending admin approval.
        </p>
        <p className="text-slate-400 text-sm mb-8">You'll appear on the leaderboard once approved.</p>
        <Link href="/" className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
          View Leaderboard
        </Link>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400">
        <div className="text-5xl mb-4">⏳</div>
        <p className="text-lg text-slate-600 mb-2">Player data not loaded yet.</p>
        <p className="text-sm">The admin needs to load players first. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Join the Pool</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Pick 10 forwards, 6 defensemen, 1 Eastern team, 1 Western team.
          Your picks go to the admin for approval before appearing on the leaderboard.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 text-sm">
        <StepDot n={1} label="Your Info" active={step === "info"} done={step === "picks"} />
        <div className="flex-1 h-px bg-slate-200" />
        <StepDot n={2} label="Your Picks" active={step === "picks"} done={false} />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      {/* Step 1: Info */}
      {step === "info" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-slate-800 text-lg">Your Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-500 mb-1 font-medium">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Mike"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1 font-medium">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Smith"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-500 mb-1 font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mike@example.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
            <p className="text-slate-400 text-xs mt-1">Used to identify you — not shared publicly.</p>
          </div>
          <button
            onClick={() => setStep("picks")}
            disabled={!infoValid()}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg transition-colors mt-2"
          >
            Continue to Picks →
          </button>
        </div>
      )}

      {/* Step 2: Picks */}
      {step === "picks" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">
                Forwards: <span className={selectedForwards.length === 10 ? "text-green-600 font-bold" : "text-slate-800"}>{selectedForwards.length}/10</span>
                &nbsp;·&nbsp;
                Defensemen: <span className={selectedDefensemen.length === 6 ? "text-green-600 font-bold" : "text-slate-800"}>{selectedDefensemen.length}/6</span>
              </p>
            </div>
            <button onClick={() => setStep("info")} className="text-slate-400 hover:text-slate-600 text-sm">
              ← Edit Info
            </button>
          </div>

          {/* Teams */}
          <div className="grid md:grid-cols-2 gap-4">
            <TeamSelector label="Eastern Conference" teams={eastTeams} selected={eastTeam} onSelect={setEastTeam} />
            <TeamSelector label="Western Conference" teams={westTeams} selected={westTeam} onSelect={setWestTeam} />
          </div>

          {/* Forwards */}
          <PlayerSection
            title="Forwards"
            subtitle={`${selectedForwards.length}/10`}
            players={filteredF}
            selected={selectedForwards}
            onToggle={(id) => togglePlayer(id, "F")}
            maxReached={selectedForwards.length >= 10}
            search={fSearch}
            onSearch={setFSearch}
          />

          {/* Defensemen */}
          <PlayerSection
            title="Defensemen"
            subtitle={`${selectedDefensemen.length}/6`}
            players={filteredD}
            selected={selectedDefensemen}
            onToggle={(id) => togglePlayer(id, "D")}
            maxReached={selectedDefensemen.length >= 6}
            search={dSearch}
            onSearch={setDSearch}
          />

          <button
            onClick={submit}
            disabled={!picksComplete || submitting}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-40 text-white font-bold py-3 rounded-lg transition-colors text-lg"
          >
            {submitting ? "Submitting..." : picksComplete ? "Submit My Picks 🏒" : "Complete your picks to submit"}
          </button>

          <p className="text-center text-slate-400 text-xs">
            Scoring: 1 pt per goal · 1 pt per assist · 1 pt per team win · 1 pt per series win
          </p>
        </div>
      )}
    </div>
  );
}

function StepDot({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
        active ? "bg-blue-700 text-white" : done ? "bg-green-600 text-white" : "bg-slate-200 text-slate-400"
      }`}>
        {done ? "✓" : n}
      </div>
      <span className={`text-sm ${active ? "text-slate-900 font-medium" : "text-slate-400"}`}>{label}</span>
    </div>
  );
}

function TeamSelector({ label, teams, selected, onSelect }: { label: string; teams: Team[]; selected: string; onSelect: (a: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <h3 className="font-semibold text-slate-700 mb-3 text-sm">{label}</h3>
      <div className="grid grid-cols-2 gap-1.5">
        {teams.map((t) => (
          <button
            key={t.nhlAbbr}
            onClick={() => onSelect(t.nhlAbbr)}
            className={`text-left px-2.5 py-2 rounded-xl text-xs transition-colors border flex items-center gap-2 ${
              selected === t.nhlAbbr
                ? "bg-blue-700 border-blue-600 text-white"
                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span className="inline-flex items-center justify-center rounded-full bg-slate-800 shrink-0" style={{ width: 32, height: 32 }}>
              <Image
                src={teamLogoUrl(t.nhlAbbr)}
                alt={t.nhlAbbr}
                width={22}
                height={22}
                className="object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </span>
            <div className="min-w-0">
              <p className={`font-bold text-xs ${selected === t.nhlAbbr ? "text-white" : "text-slate-800"}`}>{t.nhlAbbr}</p>
              <p className={`text-xs leading-tight truncate ${selected === t.nhlAbbr ? "text-blue-100" : "text-slate-500"}`}>{t.name}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function PlayerSection({ title, subtitle, players, selected, onToggle, maxReached, search, onSearch }: {
  title: string; subtitle: string; players: Player[]; selected: string[];
  onToggle: (id: string) => void; maxReached: boolean; search: string; onSearch: (v: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800">
          {title} <span className={`font-normal text-sm ${maxReached ? "text-green-600" : "text-slate-400"}`}>({subtitle})</span>
        </h3>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search name or team..."
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 w-44"
        />
      </div>
      <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
        {players.length === 0 && <p className="text-slate-400 text-sm py-4 text-center">No players found.</p>}
        {players.map((p) => {
          const isSelected = selected.includes(p.nhlId);
          const isDisabled = !isSelected && maxReached;
          return (
            <button
              key={p.nhlId}
              onClick={() => onToggle(p.nhlId)}
              disabled={isDisabled}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                isSelected
                  ? "bg-blue-50 border border-blue-200 text-blue-900"
                  : isDisabled
                  ? "opacity-30 bg-slate-50 border border-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="flex items-center gap-2">
                {isSelected && <span className="text-blue-600 text-xs font-bold">✓</span>}
                <span className="font-medium">{p.name}</span>
                <span className="text-slate-400 text-xs">{p.teamAbbr}</span>
              </span>
              <span className="text-xs text-slate-400 tabular-nums">{p.goals}G {p.assists}A</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
