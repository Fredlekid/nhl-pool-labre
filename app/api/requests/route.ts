import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { firstName, lastName, email, forwards, defensemen, eastTeam, westTeam } = await request.json();

  if (!firstName?.trim() || !lastName?.trim()) {
    return Response.json({ error: "First and last name are required." }, { status: 400 });
  }
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "A valid email is required." }, { status: 400 });
  }
  if (!Array.isArray(forwards) || forwards.length !== 10) {
    return Response.json({ error: "You must select exactly 10 forwards." }, { status: 400 });
  }
  if (!Array.isArray(defensemen) || defensemen.length !== 6) {
    return Response.json({ error: "You must select exactly 6 defensemen." }, { status: 400 });
  }
  if (!eastTeam || !westTeam) {
    return Response.json({ error: "You must select one team per conference." }, { status: 400 });
  }

  const settings = await prisma.settings.findFirst();
  if (settings?.picksLocked) {
    return Response.json({ error: "Submissions are closed. The playoffs have started!" }, { status: 403 });
  }

  const existing = await prisma.teamRequest.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (existing) {
    return Response.json({ error: "A request with this email already exists." }, { status: 409 });
  }

  const id = `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const req = await prisma.teamRequest.create({
    data: {
      id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      forwards,
      defensemen,
      eastTeam,
      westTeam,
    },
  });

  return Response.json({ success: true, id: req.id }, { status: 201 });
}
