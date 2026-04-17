import { NextRequest } from "next/server";
import { createAdminToken, setAdminCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return Response.json({ error: "ADMIN_PASSWORD not set in environment." }, { status: 500 });
  }

  if (password !== adminPassword) {
    return Response.json({ error: "Incorrect password." }, { status: 401 });
  }

  const token = createAdminToken();
  await setAdminCookie(token);

  return Response.json({ success: true });
}
