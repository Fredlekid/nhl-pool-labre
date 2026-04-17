"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface TeamRequest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  forwards: string[];
  defensemen: string[];
  eastTeam: string;
  westTeam: string;
  status: string;
  createdAt: string;
}

interface Settings {
  id: string;
  picksLocked: boolean;
  lockDate: string | null;
}

interface Player {
  nhlId: string;
  name: string;
  position: string;
  teamAbbr: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<TeamRequest[]>([]);
  const [playerMap, setPlayerMap] = useState<Map<string, Player>>(new Map());
  const [settings, setSettings] = useState<Settings | null>(null);
  const [lockDate, setLockDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<{ success?: boolean; error?: string; playersUpdated?: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState<"requests" | "settings">("requests");

  const loadData = useCallback(async () => {
    const [reqRes, settingsRes, playersRes] = await Promise.all([
      fetch("/api/admin/requests"),
      fetch("/api/admin/lock"),
      fetch("/api/players"),
    ]);

    if (reqRes.status === 401) { router.push("/login"); return; }

    setRequests(await reqRes.json());

    const players: Player[] = await playersRes.json();
    setPlayerMap(new Map(players.map((p) => [p.nhlId, p])));

    if (settingsRes.ok) {
      const s = await settingsRes.json();
      setSettings(s);
      if (s?.lockDate) setLockDate(s.lockDate.slice(0, 16));
    }
    setLoading(false);
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  async function setStatus(id: string, status: string) {
    const res = await fetch("/api/admin/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    }
  }

  async function toggleLock() {
    if (!settings) return;
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/admin/lock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locked: !settings.picksLocked }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) { setSettings(data); setMsg(data.picksLocked ? "✓ Picks locked." : "✓ Picks unlocked."); }
  }

  async function saveLockDate() {
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/admin/lock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lockDate: lockDate ? new Date(lockDate).toISOString() : null }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) { setSettings(data); setMsg("✓ Auto-lock date saved."); }
  }

  async function refreshStats() {
    setRefreshing(true);
    setRefreshResult(null);
    const res = await fetch("/api/stats/refresh", { method: "POST" });
    setRefreshResult(await res.json());
    setRefreshing(false);
  }

  const pending = requests.filter((r) => r.status === "pending");
  const approved = requests.filter((r) => r.status === "approved");
  const rejected = requests.filter((r) => r.status === "rejected");

  if (loading) return (
    <div className="text-center py-20 text-slate-400">
      <div className="text-4xl mb-3">⚙️</div>
      <p>Loading...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
        <div className="flex rounded-lg overflow-hidden border border-slate-200 text-sm shadow-sm">
          <button
            onClick={() => setTab("requests")}
            className={`px-4 py-1.5 transition-colors ${tab === "requests" ? "bg-blue-700 text-white" : "text-slate-500 hover:text-slate-800 bg-white"}`}
          >
            Requests {pending.length > 0 && <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">{pending.length}</span>}
          </button>
          <button
            onClick={() => setTab("settings")}
            className={`px-4 py-1.5 transition-colors ${tab === "settings" ? "bg-blue-700 text-white" : "text-slate-500 hover:text-slate-800 bg-white"}`}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Requests tab */}
      {tab === "requests" && (
        <div className="space-y-4">
          {requests.length === 0 && (
            <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200">No requests yet.</div>
          )}

          {pending.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase text-amber-600 tracking-wide mb-2">
                Pending ({pending.length})
              </h2>
              <div className="space-y-2">
                {pending.map((r) => <RequestCard key={r.id} request={r} playerMap={playerMap} onSetStatus={setStatus} />)}
              </div>
            </section>
          )}

          {approved.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase text-green-600 tracking-wide mb-2">
                Approved ({approved.length})
              </h2>
              <div className="space-y-2">
                {approved.map((r) => <RequestCard key={r.id} request={r} playerMap={playerMap} onSetStatus={setStatus} />)}
              </div>
            </section>
          )}

          {rejected.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase text-red-500 tracking-wide mb-2">
                Rejected ({rejected.length})
              </h2>
              <div className="space-y-2">
                {rejected.map((r) => <RequestCard key={r.id} request={r} playerMap={playerMap} onSetStatus={setStatus} />)}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Settings tab */}
      {tab === "settings" && (
        <div className="space-y-4">
          {/* Lock control */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-slate-800">Pick Submissions</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Currently</p>
                <p className={`font-bold ${settings?.picksLocked ? "text-red-500" : "text-green-600"}`}>
                  {settings?.picksLocked ? "🔒 LOCKED" : "🔓 OPEN"}
                </p>
              </div>
              <button
                onClick={toggleLock}
                disabled={saving}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
                  settings?.picksLocked ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                {settings?.picksLocked ? "Unlock" : "Lock Now"}
              </button>
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1 font-medium">Auto-Lock Date/Time</label>
              <div className="flex gap-2">
                <input
                  type="datetime-local"
                  value={lockDate}
                  onChange={(e) => setLockDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 flex-1"
                />
                <button onClick={saveLockDate} disabled={saving} className="bg-blue-700 hover:bg-blue-800 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
                  Save
                </button>
              </div>
            </div>
            {msg && <p className={`text-sm ${msg.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>{msg}</p>}
          </div>

          {/* Stats refresh */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-slate-800">NHL Stats</h2>
            <p className="text-sm text-slate-500">Refresh player goals/assists and team wins from the NHL API. Also auto-runs hourly.</p>
            <button
              onClick={refreshStats}
              disabled={refreshing}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              {refreshing ? "Refreshing..." : "Refresh Stats Now"}
            </button>
            {refreshResult && (
              <div className={`rounded-lg p-3 text-sm ${refreshResult.error ? "bg-red-50 text-red-600 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
                {refreshResult.error ? `Error: ${refreshResult.error}` : `✓ Done — ${refreshResult.playersUpdated ?? 0} players updated.`}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RequestCard({
  request: r, playerMap, onSetStatus,
}: {
  request: TeamRequest;
  playerMap: Map<string, { name: string; teamAbbr: string }>;
  onSetStatus: (id: string, status: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const statusBadge = r.status === "approved"
    ? "text-green-700 bg-green-50 border-green-200"
    : r.status === "rejected"
    ? "text-red-600 bg-red-50 border-red-200"
    : "text-amber-700 bg-amber-50 border-amber-200";

  function resolveName(id: string) {
    const p = playerMap.get(id);
    return p ? `${p.name} (${p.teamAbbr})` : id;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <span className="font-semibold text-slate-800">{r.firstName} {r.lastName}</span>
          <span className="text-slate-400 text-sm ml-2">{r.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${statusBadge}`}>
            {r.status}
          </span>
          {r.status === "pending" && (
            <>
              <button onClick={() => onSetStatus(r.id, "approved")} className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded-md transition-colors">
                Approve
              </button>
              <button onClick={() => onSetStatus(r.id, "rejected")} className="bg-red-100 hover:bg-red-200 text-red-600 text-xs px-3 py-1 rounded-md transition-colors">
                Reject
              </button>
            </>
          )}
          {r.status === "approved" && (
            <button onClick={() => onSetStatus(r.id, "rejected")} className="text-slate-400 hover:text-red-500 text-xs transition-colors">
              Revoke
            </button>
          )}
          {r.status === "rejected" && (
            <button onClick={() => onSetStatus(r.id, "approved")} className="text-slate-400 hover:text-green-600 text-xs transition-colors">
              Re-approve
            </button>
          )}
          <button onClick={() => setOpen((o) => !o)} className="text-slate-400 text-xs ml-1 hover:text-slate-600">
            {open ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 space-y-3 text-xs">
          <div>
            <p className="text-slate-400 uppercase font-semibold mb-1">Teams</p>
            <p className="text-slate-600">
              East: <strong className="text-slate-800">{r.eastTeam}</strong>
              &nbsp;·&nbsp;
              West: <strong className="text-slate-800">{r.westTeam}</strong>
            </p>
          </div>

          <div>
            <p className="text-slate-400 uppercase font-semibold mb-1">Forwards ({r.forwards.length})</p>
            <div className="flex flex-wrap gap-1">
              {r.forwards.map((id) => (
                <span key={id} className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                  {resolveName(id)}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-slate-400 uppercase font-semibold mb-1">Defensemen ({r.defensemen.length})</p>
            <div className="flex flex-wrap gap-1">
              {r.defensemen.map((id) => (
                <span key={id} className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                  {resolveName(id)}
                </span>
              ))}
            </div>
          </div>

          <p className="text-slate-400">Submitted: {new Date(r.createdAt).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}
