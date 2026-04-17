import { computeLeaderboard } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export async function GET() {
  const leaderboard = await computeLeaderboard();
  return Response.json(leaderboard);
}
