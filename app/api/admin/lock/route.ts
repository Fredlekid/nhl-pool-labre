import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { locked, lockDate } = await request.json();
  const existing = await prisma.settings.findFirst();

  if (existing) {
    const updated = await prisma.settings.update({
      where: { id: existing.id },
      data: {
        picksLocked: locked ?? existing.picksLocked,
        lockDate: lockDate ? new Date(lockDate) : existing.lockDate,
      },
    });
    return Response.json(updated);
  } else {
    const created = await prisma.settings.create({
      data: {
        id: "settings",
        picksLocked: locked ?? false,
        lockDate: lockDate ? new Date(lockDate) : null,
      },
    });
    return Response.json(created);
  }
}

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const settings = await prisma.settings.findFirst();
  return Response.json(settings);
}
