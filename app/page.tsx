import Leaderboard from "@/components/Leaderboard";

export default function HomePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Playoff Leaderboard</h1>
        <p className="text-slate-500 text-sm">Stats update within ~1 hour after each game ends — not live during play.</p>
      </div>
      <Leaderboard />
    </div>
  );
}
