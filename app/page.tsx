import Leaderboard from "@/components/Leaderboard";

export default function HomePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Playoff Leaderboard</h1>
        <p className="text-slate-500 text-sm">Updates every 5 minutes. Scores reflect live playoff stats.</p>
      </div>
      <Leaderboard />
    </div>
  );
}
