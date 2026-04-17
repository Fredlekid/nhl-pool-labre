import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase() || "";
  const position = searchParams.get("position"); // "F" or "D"

  const players = await prisma.playerStats.findMany({
    where: {
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      ...(position ? { position } : {}),
    },
    orderBy: [{ teamAbbr: "asc" }, { name: "asc" }],
  });

  return Response.json(players);
}
