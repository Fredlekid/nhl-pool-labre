import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const requests = await prisma.teamRequest.findMany({
    orderBy: { createdAt: "desc" },
    where: { deleted: false },
  });

  const deleted = await prisma.teamRequest.findMany({
    orderBy: { createdAt: "desc" },
    where: { deleted: true },
  });

  return Response.json({ requests, deleted });
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, restore } = await request.json();

  const updated = await prisma.teamRequest.update({
    where: { id },
    data: { deleted: restore ? false : true },
  });

  return Response.json(updated);
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, status } = await request.json();
  if (!["approved", "rejected", "pending"].includes(status)) {
    return Response.json({ error: "Invalid status." }, { status: 400 });
  }

  const updated = await prisma.teamRequest.update({
    where: { id },
    data: { status },
  });

  return Response.json(updated);
}
