import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const requests = await prisma.teamRequest.findMany({
    orderBy: { createdAt: "desc" },
  });

  return Response.json(requests);
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  await prisma.teamRequest.delete({ where: { id } });

  return Response.json({ ok: true });
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
