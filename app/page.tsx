import Leaderboard from "@/components/Leaderboard";

export default function HomePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Playoff Leaderboard</h1>
        <p className="text-slate-500 text-sm">Stats update after each game is completed (typically within an hour of the final buzzer).</p>
      </div>
      <Leaderboard />
    </div>
  );
}
