import { prisma } from "@/lib/db";

export async function GET() {
  const teams = await prisma.teamStats.findMany({
    orderBy: { wins: "desc" },
  });
  return Response.json(teams);
}
